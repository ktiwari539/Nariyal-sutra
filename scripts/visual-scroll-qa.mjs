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

async function assertSourcesLoad(page,selector,label){
  const result=await page.locator(selector).first().evaluate(async el=>{
    const srcs=[...new Set([...el.querySelectorAll('img')].map(img=>img.getAttribute('src')||'').filter(Boolean))];
    const checks=await Promise.all(srcs.map(src=>new Promise(resolve=>{
      const img=new Image();
      const done=ok=>resolve({src,ok,w:img.naturalWidth||0,h:img.naturalHeight||0});
      img.onload=()=>done(img.naturalWidth>0);
      img.onerror=()=>done(false);
      img.src=src;
      if(img.complete)queueMicrotask(()=>done(img.naturalWidth>0));
    })));
    return {count:srcs.length,checks};
  });
  const failed=result.checks.filter(x=>!x.ok);
  must(!failed.length,`${label}: configured image sources failed independent decode/load: ${JSON.stringify(failed)}`);
  return result;
}

async function centerInViewport(page,loc){
  for(let attempt=0;attempt<3;attempt++){
    await loc.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
    await page.waitForTimeout(320);
    const visible=await loc.evaluate(el=>{
      const r=el.getBoundingClientRect();
      return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight&&r.width>2&&r.height>2;
    });
    if(visible)return true;
    await loc.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const absoluteTop=scrollY+r.top;
      const target=Math.max(0,absoluteTop-(innerHeight-r.height)/2);
      scrollTo({top:target,left:0,behavior:'instant'});
    });
    await page.waitForTimeout(320);
  }
  return loc.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight&&r.width>2&&r.height>2;
  });
}

async function visibleShot(page,selector,name){
  const loc=page.locator(selector).first();
  must(await loc.count()===1,`${name}: missing ${selector}`);
  must(await centerInViewport(page,loc),`${name}: target could not be positioned in the viewport`);
  await page.waitForTimeout(650);
  const state=await loc.evaluate(el=>{
    const s=getComputedStyle(el),r=el.getBoundingClientRect();
    const inViewport=r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight&&r.width>2&&r.height>2;
    const all=[...el.querySelectorAll('img')];
    const imgs=all.map(img=>{
      const ir=img.getBoundingClientRect(),cs=getComputedStyle(img);
      const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>.05&&ir.right>0&&ir.left<innerWidth&&ir.bottom>0&&ir.top<innerHeight&&ir.width>2&&ir.height>2;
      return {src:img.getAttribute('src')||'',visible,complete:img.complete,ok:img.complete&&img.naturalWidth>0,w:img.naturalWidth,h:img.naturalHeight,rect:{top:ir.top,bottom:ir.bottom,left:ir.left,right:ir.right}};
    });
    return {display:s.display,visibility:s.visibility,opacity:Number(s.opacity||1),inViewport,w:r.width,h:r.height,rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},imgs,visibleImgs:imgs.filter(x=>x.visible)};
  });
  must(state.display!=='none'&&state.visibility!=='hidden'&&state.opacity>.05&&state.inViewport&&state.w>120&&state.h>40,`${name}: target is not visibly rendered ${JSON.stringify(state)}`);
  if(state.imgs.length){
    must(state.visibleImgs.length>0,`${name}: target is in viewport but none of its images are visibly rendered ${JSON.stringify(state)}`);
    must(state.visibleImgs.every(x=>x.ok),`${name}: a user-visible image failed to render ${JSON.stringify(state.visibleImgs)}`);
  }
  await loc.screenshot({path:path.join(OUT,name)});
  return state;
}

async function exerciseReveals(page,label,minCount){
  const reveals=page.locator('.w-reveal');
  const count=await reveals.count();
  must(count>=minCount,`${label}: expected at least ${minCount} reveal sections, found ${count}`);
  for(let i=0;i<count;i++){
    const loc=reveals.nth(i);
    must(await centerInViewport(page,loc),`${label}: reveal ${i+1} could not enter viewport`);
    await page.waitForFunction(index=>{
      const el=document.querySelectorAll('.w-reveal')[index];
      return !!el&&el.classList.contains('is-visible')&&Number(getComputedStyle(el).opacity)>.05;
    },i,{timeout:3000});
  }
  const state=await page.evaluate(()=>[...document.querySelectorAll('.w-reveal')].map((el,i)=>({i,visible:el.classList.contains('is-visible'),opacity:getComputedStyle(el).opacity})));
  must(state.every(x=>x.visible&&Number(x.opacity)>.05),`${label}: reveal sections failed after real viewport exposure: ${JSON.stringify(state)}`);
  return state;
}

async function noBroken(page,label){
  const broken=await page.evaluate(()=>[...document.images].filter(img=>{
    const s=getComputedStyle(img),r=img.getBoundingClientRect();
    return img.complete&&img.naturalWidth===0&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2;
  }).map(img=>img.getAttribute('src')||''));
  must(!broken.length,`${label} broken images after scroll: ${JSON.stringify(broken)}`);
}

try{
  {
    const {context,page}=await openPage('/','Homepage');
    await page.evaluate(()=>{try{window.skipIntro?.()}catch{}document.getElementById('jungle-intro')?.classList.add('ji-done');});
    await page.waitForSelector('#nsPeopleMarquee .ns-face-card',{timeout:12000});
    await assertSourcesLoad(page,'#nsPeopleMarquee','Homepage People rail');
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
    await exerciseReveals(page,'Direct sourcing',6);
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
    await exerciseReveals(page,'Supplier',5);
    await visibleShot(page,'.supplier-photo','supplier-photo-visible.png');
    await visibleShot(page,'.supplier-questions','supplier-questions-visible.png');
    await noBroken(page,'Supplier');
    await context.close();
  }

  {
    const {context,page}=await openPage('/people-of-nariyal-sutra.html','People page');
    await page.waitForSelector('#v25PeopleStreams [data-stream="ambassadors"]',{timeout:10000});
    await assertSourcesLoad(page,'#v25PeopleStreams [data-stream="ambassadors"]','People ambassador stream');
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
    await assertSourcesLoad(page,item.selector,`${item.label} motion/still`);
    await scrollThrough(page);
    const state=await visibleShot(page,item.selector,item.name);
    must(state.visibleImgs.some(x=>x.ok),`${item.label}: motion/still visual did not render a valid visible image`);
    await noBroken(page,item.label);
    await context.close();
  }

  console.log('VISUAL SCROLL + REVEAL QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
