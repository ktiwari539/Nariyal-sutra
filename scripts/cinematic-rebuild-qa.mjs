import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync('qa-artifacts',{recursive:true});
await sleep(1200);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'no-preference'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

try {
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(700);
  await page.evaluate(()=>{try{window.skipIntro?.()}catch{}});
  await page.waitForSelector('#v20-story-film[data-rebuilt="1"]',{state:'attached',timeout:20000});
  await page.waitForFunction(()=>window.__NS_V421_CINEMATIC_REBUILD && Number.isFinite(window.__NS_V421_CINEMATIC_REBUILD.progress),null,{timeout:20000});
  await page.waitForTimeout(900);

  const film=page.locator('#v20-story-film');
  if(await film.count()!==1) throw new Error('film missing');
  if(await film.getAttribute('data-rebuilt')!=='1') throw new Error('rebuilt cinematic did not initialize');

  const metrics=await film.evaluate(el=>{
    const cs=getComputedStyle(el),p=el.parentElement,pcs=p?getComputedStyle(p):null,r=el.getBoundingClientRect();
    return {top:r.top+scrollY,height:el.offsetHeight,viewport:innerHeight,display:cs.display,cssHeight:cs.height,minHeight:cs.minHeight,maxHeight:cs.maxHeight,position:cs.position,parent:p?.id||p?.className||'',parentHeight:p?.offsetHeight||0,parentCssHeight:pcs?.height||'',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  });
  const range=Math.max(1,metrics.height-metrics.viewport);
  console.log('LAYOUT '+JSON.stringify(metrics));
  if(metrics.display==='none') throw new Error('cinematic film is hidden');
  if(metrics.height<metrics.viewport*5.5) throw new Error(`cinematic runway compressed before capture: ${metrics.height}px`);

  const points=[0,.10,.18,.26,.34,.42,.49,.56,.63,.70,.76,.82,.90,.96,1];
  const states=[];
  const shotMap=new Map([[.18,'rain'],[.49,'hero'],[.56,'knife'],[.70,'splash'],[.90,'water']]);
  for(const p of points){
    await page.evaluate(({top,range,p})=>scrollTo(0,top+range*p),{top:metrics.top,range,p});
    await page.waitForTimeout(300);
    const state=await page.evaluate(()=>window.__NS_V421_CINEMATIC_REBUILD||{});
    states.push({...state,sample:p});
    if(shotMap.has(p)) await page.screenshot({path:`qa-artifacts/${shotMap.get(p)}.png`,fullPage:false});
  }

  const max=k=>Math.max(...states.map(s=>Number(s[k]||0)));
  const checks={rain:max('rain')>=.8,hero:max('hero')>.45,knife:max('knife')>.55,splash:max('splash')>.55,water:max('water')>.9};
  for(const [k,v] of Object.entries(checks)) if(!v) throw new Error(`${k} stage not reached`);

  const stage=page.locator('#v20-story-film .v421-cine-stage');
  const stageBox=await stage.boundingBox();
  if(!stageBox || stageBox.height<850 || stageBox.width<1300) throw new Error(`cinematic stage collapsed: ${JSON.stringify(stageBox)}`);

  await page.evaluate(({top,range})=>scrollTo(0,top+range*.90),{top:metrics.top,range});
  await page.waitForTimeout(300);
  const waterCoverage=await page.evaluate(()=>{const el=document.querySelector('#v20-story-film .v421-water');if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height,opacity:Number(cs.opacity),viewport:{w:innerWidth,h:innerHeight}};});
  if(!waterCoverage || waterCoverage.opacity<.8 || waterCoverage.width<waterCoverage.viewport.w*.98 || waterCoverage.height<waterCoverage.viewport.h*.98) throw new Error(`water does not visually cover viewport: ${JSON.stringify(waterCoverage)}`);

  await page.evaluate(({top,range})=>scrollTo(0,top+range*.18),{top:metrics.top,range});
  await page.waitForTimeout(300);
  const rainVisual=await page.evaluate(()=>{const nuts=[...document.querySelectorAll('#v20-story-film .v421-nut')];return {count:nuts.length,visible:nuts.filter(n=>Number(getComputedStyle(n).opacity)>.15).length};});
  if(rainVisual.count<80 || rainVisual.visible<8) throw new Error(`desktop coconut rain is not visibly populated: ${JSON.stringify(rainVisual)}`);

  console.log(JSON.stringify({checks,metrics,waterCoverage,rainVisual,states:states.map(s=>({sample:s.sample,progress:s.progress,rain:s.rain,hero:s.hero,knife:s.knife,splash:s.splash,water:s.water,count:s.count}))},null,2));
  if(errors.length) throw new Error('page errors: '+errors.join(' | '));
  console.log('CINEMATIC REBUILD QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
