import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BASE='http://127.0.0.1:4173';
const OUT=path.join(ROOT,'qa-artifacts','cinematic-professional');
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const must=(c,m)=>{if(!c)throw new Error(m)};
const mark=msg=>console.log(`[CINE-QA] ${new Date().toISOString()} ${msg}`);
async function timed(label,promise,ms=15000){
  mark(`${label} START`);
  let timer;
  try{
    const result=await Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out after ${ms}ms`)),ms);})
    ]);
    mark(`${label} PASS`);
    return result;
  } finally { clearTimeout(timer); }
}
await sleep(1000);

async function settleStorefront(page,width,label){
  mark(`${label} settle wait 1100ms`);
  await page.waitForTimeout(1100);
  if(width>980)await timed(`${label} initial wheel`,page.mouse.wheel(0,160),8000);
  await timed(`${label} wait main visible`,page.waitForFunction(()=>{
    const main=document.getElementById('main-site');if(!main)return false;
    const s=getComputedStyle(main);return Number.parseFloat(s.opacity||'0')>.9&&s.pointerEvents!=='none'&&s.visibility!=='hidden';
  },null,{timeout:10000}),12000);
  await timed(`${label} reset scroll`,page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,0);}),8000);
}

async function storefront(viewport,label){
  mark(`${label} context create`);
  const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const response=await timed(`${label} goto`,page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000}),35000);
  must(response&&response.status()<400,`${label}: storefront returned ${response?.status()}`);
  await settleStorefront(page,viewport.width,label);
  await timed(`${label} wait #scroll-cinema`,page.waitForSelector('#scroll-cinema',{state:'attached',timeout:10000}),12000);

  if(viewport.width<=980){
    const reel=page.locator('.mobile-story-reel');
    must(await reel.count()===1,`${label}: mobile cinematic reel missing`);
    const state=await timed(`${label} inspect mobile reel`,reel.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();const imgs=[...el.querySelectorAll('img')];return {display:s.display,visibility:s.visibility,w:r.width,h:r.height,broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')||'')};}),8000);
    must(state.display!=='none'&&state.visibility!=='hidden'&&state.w>200&&state.h>100,`${label}: mobile cinematic reel is not rendered ${JSON.stringify(state)}`);
    must(!state.broken.length,`${label}: mobile cinematic assets broken ${JSON.stringify(state.broken)}`);
    await timed(`${label} screenshot mobile reel`,reel.screenshot({path:path.join(OUT,`${label}-cinematic.png`),timeout:15000}),18000);
    must(!errors.length,`${label}: page errors ${errors.join(' | ')}`);
    console.log(`${label.toUpperCase()} CINEMATIC PASS`,JSON.stringify(state));
    await context.close();return;
  }

  await timed(`${label} wait #v20-story-film`,page.waitForSelector('#v20-story-film',{state:'attached',timeout:10000}),12000);
  await timed(`${label} wait rain`,page.waitForFunction(()=>document.querySelectorAll('#v20-story-film .v21-real-rain img').length>=6,null,{timeout:10000}),12000);
  const metrics=await timed(`${label} film metrics`,page.locator('#v20-story-film').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {top:r.top+scrollY,height:el.offsetHeight,viewport:innerHeight,display:s.display,visibility:s.visibility};}),8000);
  must(metrics.display!=='none'&&metrics.visibility!=='hidden',`${label}: current source-to-cut film hidden`);
  must(metrics.height>=metrics.viewport*3,`${label}: cinematic runway unexpectedly short ${metrics.height}px`);
  must(metrics.height<=metrics.viewport*4.2,`${label}: cinematic runway unexpectedly long ${metrics.height}px`);
  const range=Math.max(1,metrics.height-metrics.viewport);
  const samples=[
    {name:'rain',p:.16,prop:'--v21-rain-alpha',min:.2},
    {name:'hero',p:.66,prop:'--hero-alpha',min:.25},
    {name:'knife',p:.82,prop:'--knife-alpha',min:.25},
    {name:'splash',p:.91,prop:'--splash-alpha',min:.12},
    {name:'water',p:.94,prop:'--water-alpha',min:.45}
  ];
  const states=[];
  for(const sample of samples){
    await timed(`${label} ${sample.name} scroll`,page.evaluate(({top,range,p})=>scrollTo(0,Math.round(top+range*p)),{top:metrics.top,range,p:sample.p}),8000);
    await page.waitForTimeout(220);
    const state=await timed(`${label} ${sample.name} state`,page.locator('#v20-story-film').evaluate((el,prop)=>({p:Number.parseFloat(getComputedStyle(el).getPropertyValue('--p'))||0,value:Number.parseFloat(getComputedStyle(el).getPropertyValue(prop))||0}),sample.prop),8000);
    must(state.value>=sample.min,`${label}: ${sample.name} state not visible ${JSON.stringify(state)}`);
    states.push({name:sample.name,...state});
    await timed(`${label} ${sample.name} screenshot`,page.screenshot({path:path.join(OUT,`${label}-${sample.name}.png`),fullPage:false,timeout:15000}),18000);
  }
  const rain=await timed(`${label} inspect rain`,page.evaluate(()=>[...document.querySelectorAll('#v20-story-film .v21-real-rain img')].map(i=>({src:i.getAttribute('src')||'',ok:i.complete&&i.naturalWidth>0}))),8000);
  must(rain.length>=6&&rain.every(x=>x.ok),`${label}: photographic coconut rain is incomplete ${JSON.stringify(rain)}`);
  must(!errors.length,`${label}: page errors ${errors.join(' | ')}`);
  console.log(`${label.toUpperCase()} CINEMATIC PASS`,JSON.stringify({metrics,states,rain:rain.length}));
  await context.close();
}

mark('browser launch');
const browser=await chromium.launch({headless:true});
try{
  await storefront({width:1440,height:900},'desktop');
  await storefront({width:390,height:844},'mobile');

  mark('admin context create');
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await timed('admin goto',page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000}),35000);
  await timed('admin wait app',page.waitForSelector('.ap-app',{state:'visible',timeout:12000}),15000);
  await timed('admin wait runtime',page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V38__===true,null,{timeout:12000}),15000);
  const state=await timed('admin inspect',page.evaluate(()=>({title:document.title,path:location.pathname,sidebar:!!document.querySelector('#apSidebar'),imageTargets:!!document.querySelector('#apV38ImageTargets')})),8000);
  must(/Business Command Center/i.test(state.title)&&state.sidebar&&state.imageTargets,`Admin canonical UI missing ${JSON.stringify(state)}`);
  must(!errors.length,`Admin page errors ${errors.join(' | ')}`);
  await timed('admin screenshot',page.screenshot({path:path.join(OUT,'admin-business-command-center.png'),fullPage:false,timeout:15000}),18000);
  await context.close();
  console.log('PROFESSIONAL WEBSITE QA: PASS');
} finally {
  mark('browser close');
  await browser.close().catch(()=>{});
  server.kill();
}
