import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync('qa-artifacts',{recursive:true});
await sleep(1200);
const browser=await chromium.launch({headless:true});

async function storefront(viewport,label){
 const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 await page.waitForTimeout(900);
 await page.evaluate(()=>{try{window.skipIntro?.()}catch{} const i=document.getElementById('jungle-intro');if(i)i.classList.add('ji-done');document.documentElement.style.scrollBehavior='auto';});
 await page.waitForSelector('#v421-cinematic-film-pro[data-ready="1"]',{state:'attached',timeout:20000});
 await page.waitForFunction(()=>window.__NS_V421_PRO_CINE&&window.__NS_V421_PRO_CINE.ready===true,null,{timeout:20000});
 const legacy=await page.evaluate(()=>['scroll-cinema','v421-cinematic-film'].every(id=>{const e=document.getElementById(id);return !e||e.hidden||getComputedStyle(e).display==='none'}));
 if(!legacy)throw new Error(`${label}: legacy cinematic still visible`);
 const metrics=await page.locator('#v421-cinematic-film-pro').evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,height:el.offsetHeight,viewport:innerHeight};});
 if(metrics.height<metrics.viewport*4.2)throw new Error(`${label}: runway too short ${metrics.height}`);
 const range=metrics.height-metrics.viewport;
 const samples=[['rain',.16],['hero',.47],['knife',.56],['splash',.69],['water',.86]];
 const states={};
 for(const [name,p] of samples){
   const target=metrics.top+range*p;
   await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:y,left:0,behavior:'instant'});},target);
   await page.waitForFunction(expected=>Math.abs((window.__NS_V421_PRO_CINE?.progress||0)-expected)<.055,p,{timeout:5000});
   await page.waitForTimeout(160);
   states[name]=await page.evaluate(()=>{
     const op=s=>Number.parseFloat(getComputedStyle(document.querySelector(s)).opacity)||0;
     const box=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
     return {...window.__NS_V421_PRO_CINE,
       heroOpacity:op('#v421-cinematic-film-pro .nspro-main'),
       knifeOpacity:op('#v421-cinematic-film-pro .nspro-knife'),
       splashOpacity:op('#v421-cinematic-film-pro .nspro-splash'),
       waterOpacity:op('#v421-cinematic-film-pro .nspro-water'),
       stage:box('#v421-cinematic-film-pro .nspro-stage'),
       heroBox:box('#v421-cinematic-film-pro .nspro-main'),
       knifeBox:box('#v421-cinematic-film-pro .nspro-knife'),
       splashBox:box('#v421-cinematic-film-pro .nspro-splash'),
       water:box('#v421-cinematic-film-pro .nspro-water'),
       viewport:{w:innerWidth,h:innerHeight}};
   });
   const st=states[name].stage;
   if(!st||st.w<viewport.width*.98||st.h<viewport.height*.98||Math.abs(st.y)>3)throw new Error(`${label}: stage is not pinned to viewport at ${name}: ${JSON.stringify(states[name])}`);
   await page.screenshot({path:`qa-artifacts/${label}-${name}.png`,fullPage:false});
 }
 const intersects=(b,v)=>b&&b.right>0&&b.bottom>0&&b.x<v.w&&b.y<v.h&&b.w>20&&b.h>20;
 if((states.rain.rainVisible||0)<6)throw new Error(`${label}: rain not visible ${JSON.stringify(states.rain)}`);
 if(states.hero.heroOpacity<.35||!intersects(states.hero.heroBox,states.hero.viewport))throw new Error(`${label}: hero coconut not on screen ${JSON.stringify(states.hero)}`);
 if(states.knife.knifeOpacity<.35||!intersects(states.knife.knifeBox,states.knife.viewport))throw new Error(`${label}: knife not on screen ${JSON.stringify(states.knife)}`);
 if(states.splash.splashOpacity<.35||!intersects(states.splash.splashBox,states.splash.viewport))throw new Error(`${label}: splash not on screen ${JSON.stringify(states.splash)}`);
 if(states.water.waterOpacity<.75||states.water.water.w<states.water.viewport.w*.98||states.water.water.h<states.water.viewport.h*.98)throw new Error(`${label}: water not full screen ${JSON.stringify(states.water)}`);
 const assets=await page.evaluate(()=>[...document.querySelectorAll('#v421-cinematic-film-pro img')].map(i=>({src:i.getAttribute('src'),ok:!i.complete||i.naturalWidth>0,w:i.naturalWidth,h:i.naturalHeight})));
 if(assets.some(a=>!a.ok))throw new Error(`${label}: broken cinematic asset ${JSON.stringify(assets.filter(a=>!a.ok))}`);
 if(errors.length)throw new Error(`${label}: page errors ${errors.join(' | ')}`);
 console.log(`${label.toUpperCase()} CINEMATIC PASS`,JSON.stringify({metrics,states,assets}));
 await context.close();
}

async function admin(){
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/admin.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForURL(/admin-live-legacy\.html/,{timeout:10000});
 await page.waitForSelector('#loginView',{state:'visible',timeout:10000});
 await page.waitForFunction(()=>window.NSV421Admin?.ready===true,null,{timeout:10000});
 if(!/Business Command Center/i.test(await page.title()))throw new Error(`Production Admin title is wrong: ${await page.title()}`);
 const state=await page.evaluate(()=>({
   loginVisible:!!document.querySelector('#loginView')&&getComputedStyle(document.querySelector('#loginView')).display!=='none',
   emailType:document.querySelector('#email')?.type,
   passwordType:document.querySelector('#password')?.type,
   appHidden:document.querySelector('#appView')?.classList.contains('hidden')===true,
   unifiedReady:window.NSV421Admin?.ready===true,
   skinLoaded:!!document.querySelector('link[data-ns-admin-business-skin]')
 }));
 if(!state.loginVisible||state.emailType!=='email'||state.passwordType!=='password'||!state.appHidden||!state.unifiedReady||!state.skinLoaded)throw new Error(`Secure Business Command Center entry invalid ${JSON.stringify(state)}`);
 await page.screenshot({path:'qa-artifacts/admin-business-command-center.png',fullPage:false});
 await context.close();
}

try{await storefront({width:1440,height:900},'desktop');await storefront({width:390,height:844},'mobile');await admin();console.log('PROFESSIONAL WEBSITE QA: PASS');}finally{await browser.close();server.kill();}
