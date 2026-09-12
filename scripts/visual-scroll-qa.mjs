import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4198';
const OUT=path.join(process.cwd(),'qa-artifacts','visual-scroll');
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4198','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

async function openPage(url,label){
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const res=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});
  must(res&&res.status()<400,`${label} returned ${res?.status()}`);
  await page.waitForTimeout(1400);
  must(!errors.length,`${label} page errors: ${errors.join(' | ')}`);
  return {context,page,errors};
}

async function scrollThrough(page){
  await page.evaluate(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const step=Math.max(360,Math.floor(innerHeight*.68));
    for(let y=0;y<=max;y+=step){scrollTo(0,y);await sleep(90);}
    scrollTo(0,max);await sleep(220);
  });
}

async function visibleShot(page,selector,name){
  const loc=page.locator(selector).first();
  must(await loc.count()===1,`${name}: missing ${selector}`);
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(420);
  const state=await loc.evaluate(el=>{
    const s=getComputedStyle(el),r=el.getBoundingClientRect();
    const imgs=[...el.querySelectorAll('img')].map(img=>({src:img.getAttribute('src')||'',ok:img.complete&&img.naturalWidth>0,w:img.naturalWidth,h:img.naturalHeight}));
    return {display:s.display,visibility:s.visibility,opacity:Number(s.opacity||1),w:r.width,h:r.height,imgs};
  });
  must(state.display!=='none'&&state.visibility!=='hidden'&&state.opacity>.05&&state.w>120&&state.h>40,`${name}: target is not visibly rendered ${JSON.stringify(state)}`);
  must(state.imgs.every(x=>x.ok),`${name}: target contains failed image ${JSON.stringify(state.imgs)}`);
  await loc.screenshot({path:path.join(OUT,name)});
  return state;
}

async function noBroken(page,label){
  const broken=await page.evaluate(()=>[...document.images].filter(img=>img.complete&&img.naturalWidth===0&&getComputedStyle(img).display!=='none').map(img=>img.getAttribute('src')||''));
  must(!broken.length,`${label} broken images after scroll: ${JSON.stringify(broken)}`);
}

try{
  {
    const {context,page}=await openPage('/','Homepage');
    await page.evaluate(()=>{try{window.skipIntro?.()}catch{}document.getElementById('jungle-intro')?.classList.add('ji-done');});
    await page.waitForSelector('#nsPeopleMarquee .ns-face-card',{timeout:12000});
    await scrollThrough(page);
    await visibleShot(page,'#nsPeopleMarquee','homepage-people-reel-visible.png');
    await visibleShot(page,'.trade-route.trade-supply','homepage-sourcing-visible.png');
    await visibleShot(page,'.trade-route.trade-buy','homepage-hospitality-visible.png');
    await noBroken(page,'Homepage');
    await context.close();
  }

  {
    const {context,page}=await openPage('/direct-farm.html','Direct sourcing');
    await page.waitForFunction(()=>document.documentElement.dataset.nsMediaIntegrity==='ready',null,{timeout:10000});
    await scrollThrough(page);
    const reveal=await page.evaluate(()=>[...document.querySelectorAll('.w-reveal')].map(el=>({visible:el.classList.contains('is-visible'),opacity:getComputedStyle(el).opacity}))); 
    must(reveal.length>=6&&reveal.every(x=>x.visible&&Number(x.opacity)>.05),`Direct sourcing reveal sections did not activate: ${JSON.stringify(reveal)}`);
    await visibleShot(page,'.brand-note-grid','direct-sourcing-brand-note.png');
    await visibleShot(page,'.source-proof-grid','direct-sourcing-proof.png');
    await visibleShot(page,'.farm-step:nth-child(1)','direct-sourcing-chain.png');
    await page.screenshot({path:path.join(OUT,'direct-sourcing-after-scroll.png'),fullPage:true});
    await noBroken(page,'Direct sourcing');
    await context.close();
  }

  {
    const {context,page}=await openPage('/supplier-partnership.html','Supplier');
    await page.waitForFunction(()=>document.documentElement.dataset.nsMediaIntegrity==='ready',null,{timeout:10000});
    await scrollThrough(page);
    const reveal=await page.evaluate(()=>[...document.querySelectorAll('.w-reveal')].map(el=>el.classList.contains('is-visible')));
    must(reveal.length>=5&&reveal.every(Boolean),`Supplier reveal sections did not activate: ${JSON.stringify(reveal)}`);
    await visibleShot(page,'.supplier-photo','supplier-photo-visible.png');
    await visibleShot(page,'.supplier-questions','supplier-questions-visible.png');
    await noBroken(page,'Supplier');
    await context.close();
  }

  {
    const {context,page}=await openPage('/people-of-nariyal-sutra.html','People page');
    await page.waitForSelector('#v25PeopleStreams [data-stream="ambassadors"]',{timeout:10000});
    await scrollThrough(page);
    await visibleShot(page,'#v25PeopleStreams [data-stream="ambassadors"]','people-ambassadors-visible.png');
    await noBroken(page,'People page');
    await context.close();
  }

  for(const item of [
    {url:'/freshness-first.html',label:'Freshness',selector:'.water-window',name:'freshness-motion-visible.png'},
    {url:'/fresh-tender-coconut.html',label:'Fresh tender',selector:'.sp-video',name:'fresh-tender-motion-visible.png'},
    {url:'/green-coconut.html',label:'Green coconut',selector:'.sp-video',name:'green-coconut-motion-visible.png'},
    {url:'/coconut-events-hospitality.html',label:'Hospitality',selector:'.sp-video',name:'hospitality-motion-visible.png'}
  ]){
    const {context,page}=await openPage(item.url,item.label);
    await page.waitForFunction(()=>document.documentElement.dataset.nsMediaIntegrity==='ready',null,{timeout:10000});
    await scrollThrough(page);
    const state=await visibleShot(page,item.selector,item.name);
    must(state.imgs.some(x=>x.ok),`${item.label}: motion/still visual did not render a valid image`);
    await noBroken(page,item.label);
    await context.close();
  }

  console.log('VISUAL SCROLL + REVEAL QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
