import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4204';
const OUT=path.join(process.cwd(),'qa-artifacts','responsive-site');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};
const server=spawn('python3',['-m','http.server','4204','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});
const pages=[
 ['home','/'],['people','/people-of-nariyal-sutra.html'],['fresh','/fresh-tender-coconut.html'],['green','/green-coconut.html'],['bulk','/bulk-coconut-supply.html'],['sourcing','/direct-farm.html'],['hospitality','/coconut-events-hospitality.html']
];

async function settle(page,name){
 if(name==='home'){
   await page.waitForFunction(()=>{const i=document.getElementById('jungle-intro'),m=document.getElementById('main-site');if(!i||!m)return true;const a=getComputedStyle(i),b=getComputedStyle(m);return (a.display==='none'||Number(a.opacity||1)<.05)&&Number(b.opacity||0)>.9;},null,{timeout:8000}).catch(()=>{});
 }
 await page.waitForTimeout(450);
}
async function inspect(page,label){
 const errors=await page.evaluate(()=>{
   const out=[];
   const sw=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),iw=innerWidth;if(sw>iw+8)out.push(`overflow ${sw}>${iw}`);
   document.querySelectorAll('img').forEach(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img),visible=r.width>4&&r.height>4&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.05;if(visible&&img.complete&&img.naturalWidth===0)out.push(`broken image ${img.currentSrc||img.src}`);});
   document.querySelectorAll('button,a').forEach(el=>{const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&(r.left<-6||r.right>innerWidth+6))out.push(`control outside viewport ${(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,40)}`);});
   return out;
 });
 must(!errors.length,`${label}: ${errors.join(' | ')}`);
}
async function checkViewport(width,height,tag){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width<600?3:2,isMobile:width<900,hasTouch:true,serviceWorkers:'block'});
 for(const [name,url] of pages){
  const page=await context.newPage(),errs=[];page.on('pageerror',e=>errs.push(String(e)));
  const r=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});must(r&&r.status()<400,`${tag}-${name}: status ${r?.status()}`);await settle(page,name);
  const max=await page.evaluate(()=>Math.max(0,document.documentElement.scrollHeight-innerHeight));
  for(const p of [0,.2,.45,.7,1]){await page.evaluate(y=>scrollTo(0,y),Math.round(max*p));await page.waitForTimeout(180);await inspect(page,`${tag}-${name}@${p}`);}
  await page.screenshot({path:path.join(OUT,`${tag}-${name}.png`),fullPage:true});
  must(!errs.length,`${tag}-${name}: page errors ${errs.join(' | ')}`);await page.close();
 }
 await context.close();
}
try{await checkViewport(390,844,'mobile');await checkViewport(820,1100,'tablet');console.log('RESPONSIVE STOREFRONT QA: PASS');}finally{await browser.close();server.kill();}
