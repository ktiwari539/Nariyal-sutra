import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd(),BASE='http://127.0.0.1:4173',OUT=path.join(ROOT,'qa-artifacts','cinematic-professional');
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),must=(c,m)=>{if(!c)throw new Error(m)},mark=m=>console.log(`[CINE-QA] ${new Date().toISOString()} ${m}`);
await sleep(900);

async function enterStorefront(page,width,label){
 await page.waitForTimeout(700);
 const usable=()=>page.evaluate(()=>{const m=document.getElementById('main-site');if(!m)return false;const s=getComputedStyle(m);return Number.parseFloat(s.opacity||'0')>.9&&s.visibility!=='hidden'&&s.pointerEvents!=='none';});
 if(!(await usable())&&width>980){
   const skip=page.locator('#ji-skip');
   if(await skip.count()&&await skip.isVisible().catch(()=>false)){mark(`${label} using visible Skip control`);await skip.click({timeout:4000}).catch(()=>{});}
 }
 await page.waitForFunction(()=>{const m=document.getElementById('main-site');if(!m)return false;const s=getComputedStyle(m);return Number.parseFloat(s.opacity||'0')>.9&&s.visibility!=='hidden'&&s.pointerEvents!=='none';},null,{timeout:7000});
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,0);});
}
async function runtimeState(page){return page.evaluate(()=>{const film=document.getElementById('v20-story-film'),wrap=document.getElementById('scroll-cinema'),pro=document.getElementById('v421-cinematic-film-pro'),rain=[...document.querySelectorAll('#v20-story-film .v21-real-rain img')];return {wrap:{exists:!!wrap,hidden:!!wrap?.hidden,display:wrap?getComputedStyle(wrap).display:null},film:!!film,sticky:!!film?.querySelector('.v20-story-sticky'),rainCount:rain.length,rainGood:rain.filter(i=>i.complete&&i.naturalWidth>0).length,harvestCount:film?.dataset.nsHarvestCount||'',rainRuntime:film?.dataset.nsRainRuntime||'',pro:{exists:!!pro,display:pro?getComputedStyle(pro).display:null},proLoader:!!window.__NS_V421_PRO_CINE_LOADER__,harvest:window.NSV421Store?.load?.().harvest||null,scripts:[...document.scripts].map(s=>s.src).filter(s=>/v(21|28|29)-public|cinematic-professional/.test(s))};});}

const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 let res=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});must(res&&res.status()<400,`desktop storefront returned ${res?.status()}`);await enterStorefront(page,1440,'desktop');
 await page.waitForSelector('#scroll-cinema',{state:'attached',timeout:6000});await page.waitForSelector('#v20-story-film',{state:'attached',timeout:6000});
 await page.waitForFunction(()=>document.querySelectorAll('#v20-story-film .v21-real-rain img').length>=6,null,{timeout:6000}).catch(async()=>{throw new Error('desktop current cinematic rain did not initialize: '+JSON.stringify(await runtimeState(page)));});
 const rt=await runtimeState(page);must(rt.wrap.exists&&!rt.wrap.hidden&&rt.wrap.display!=='none',`current cinematic wrapper hidden ${JSON.stringify(rt)}`);must(!rt.pro.exists||rt.pro.display==='none',`retired professional cinematic is active ${JSON.stringify(rt.pro)}`);must(rt.rainCount>=6,`desktop rain count too low ${JSON.stringify(rt)}`);
 const metrics=await page.locator('#v20-story-film').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {top:r.top+scrollY,height:el.offsetHeight,viewport:innerHeight,display:s.display,visibility:s.visibility};});
 must(metrics.display!=='none'&&metrics.visibility!=='hidden','current source-to-cut film is hidden');must(metrics.height>=metrics.viewport*3&&metrics.height<=metrics.viewport*4.2,`cinematic runway out of contract ${JSON.stringify(metrics)}`);
 const range=Math.max(1,metrics.height-metrics.viewport),samples=[['rain',.16,'--v21-rain-alpha',.2],['hero',.66,'--hero-alpha',.25],['knife',.82,'--knife-alpha',.25],['splash',.91,'--splash-alpha',.12],['water',.94,'--water-alpha',.45]],states=[];
 for(const [name,p,prop,min] of samples){await page.evaluate(({top,range,p})=>scrollTo(0,Math.round(top+range*p)),{top:metrics.top,range,p});await page.waitForTimeout(180);const st=await page.locator('#v20-story-film').evaluate((el,prop)=>({p:Number.parseFloat(getComputedStyle(el).getPropertyValue('--p'))||0,value:Number.parseFloat(getComputedStyle(el).getPropertyValue(prop))||0}),prop);must(st.value>=min,`${name} state not visible ${JSON.stringify(st)}`);states.push({name,...st});await page.screenshot({path:path.join(OUT,`desktop-${name}.png`),fullPage:false,timeout:10000});}
 const rain=await page.evaluate(()=>[...document.querySelectorAll('#v20-story-film .v21-real-rain img')].slice(0,100).map(i=>({src:i.getAttribute('src')||'',ok:i.complete&&i.naturalWidth>0,hidden:i.hidden})));must(rain.filter(x=>!x.hidden).length>=6&&rain.filter(x=>!x.hidden).every(x=>x.ok),`photographic coconut rain incomplete ${JSON.stringify(rain.filter(x=>!x.ok).slice(0,8))}`);must(!errors.length,`desktop page errors ${errors.join(' | ')}`);console.log('DESKTOP CINEMATIC PASS',JSON.stringify({metrics,states,rain:rain.length,runtime:rt}));await context.close();

 const mctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,serviceWorkers:'block',reducedMotion:'no-preference'}),mobile=await mctx.newPage(),merrors=[];mobile.on('pageerror',e=>merrors.push(String(e)));res=await mobile.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});must(res&&res.status()<400,`mobile storefront returned ${res?.status()}`);await enterStorefront(mobile,390,'mobile');const reel=mobile.locator('.mobile-story-reel');must(await reel.count()===1,'mobile cinematic reel missing');const ms=await reel.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(),imgs=[...el.querySelectorAll('img')];return {display:s.display,visibility:s.visibility,w:r.width,h:r.height,broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')||'')};});must(ms.display!=='none'&&ms.visibility!=='hidden'&&ms.w>200&&ms.h>100&&!ms.broken.length,`mobile cinematic invalid ${JSON.stringify(ms)}`);await reel.screenshot({path:path.join(OUT,'mobile-cinematic.png'),timeout:10000});must(!merrors.length,`mobile page errors ${merrors.join(' | ')}`);console.log('MOBILE CINEMATIC PASS',JSON.stringify(ms));await mctx.close();

 const actx=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),admin=await actx.newPage(),aerrors=[];admin.on('pageerror',e=>aerrors.push(String(e)));await admin.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});await admin.waitForSelector('.ap-app',{state:'visible',timeout:12000});await admin.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V38__===true,null,{timeout:12000});const as=await admin.evaluate(()=>({title:document.title,path:location.pathname,sidebar:!!document.querySelector('#apSidebar'),imageTargets:!!document.querySelector('#apV38ImageTargets')}));must(/Business Command Center/i.test(as.title)&&as.sidebar&&as.imageTargets,`Admin canonical UI missing ${JSON.stringify(as)}`);must(!aerrors.length,`Admin page errors ${aerrors.join(' | ')}`);await admin.screenshot({path:path.join(OUT,'admin-business-command-center.png'),fullPage:false,timeout:10000});await actx.close();
 console.log('PROFESSIONAL WEBSITE QA: PASS');
} finally {await browser.close().catch(()=>{});server.kill();}
