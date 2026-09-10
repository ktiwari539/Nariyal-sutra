import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT=process.cwd();
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');
const PROD='https://nariyal-sutra.netlify.app';
fs.mkdirSync(OUT,{recursive:true});

const pages=[
 'index.html','fresh-tender-coconut.html','green-coconut.html','bulk-coconut-supply.html',
 'about-nariyal-sutra.html','direct-farm.html','south-india-groves.html','gujarat-coast.html',
 'freshness-first.html','coconut-water.html','coconut-events-hospitality.html','supplier-partnership.html',
 'coconut-wholesale-export.html','people-of-nariyal-sutra.html','track.html',
 'privacy.html','terms.html','delivery-policy.html'
];
const failures=[],checks=[];
const fail=(scope,msg)=>failures.push({scope,msg});
function mime(file){const e=path.extname(file).toLowerCase();return({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4'})[e]||'application/octet-stream'}
async function mirrorProdAssets(page){
 await page.route(`${PROD}/assets/**`,async route=>{
  const u=new URL(route.request().url()),file=path.join(ROOT,decodeURIComponent(u.pathname).replace(/^\//,''));
  if(fs.existsSync(file)&&fs.statSync(file).isFile())await route.fulfill({status:200,contentType:mime(file),body:fs.readFileSync(file)});
  else await route.fulfill({status:404,contentType:'text/plain',body:'QA mirror missing repository asset'});
 });
}
async function forceAllImages(page){
 await page.evaluate(()=>{for(const img of document.images)img.loading='eager'});
 const height=await page.evaluate(()=>Math.max(document.documentElement.scrollHeight,document.body.scrollHeight));
 for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(18)}
 await page.evaluate(()=>scrollTo(0,0));
 await page.evaluate(async()=>{
  const imgs=[...document.images];
  await Promise.all(imgs.map(i=>i.complete?Promise.resolve():new Promise(resolve=>{const done=()=>resolve();i.addEventListener('load',done,{once:true});i.addEventListener('error',done,{once:true});setTimeout(done,2500)})));
 });
}

const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 for(const file of pages){
  const page=await ctx.newPage(),runtimeErrors=[],requestFailures=[];
  await mirrorProdAssets(page);
  page.on('pageerror',e=>runtimeErrors.push(e.message));
  page.on('response',r=>{try{const u=new URL(r.url());if((u.origin===new URL(BASE).origin||u.origin===PROD)&&r.status()>=400)requestFailures.push(`${r.status()} ${r.url()}`)}catch{}});
  const res=await page.goto(`${BASE}/${file}?integrity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  if(!res||res.status()>=400){fail(file,`page HTTP ${res?.status()||'no response'}`);await page.close();continue}
  await page.waitForTimeout(file==='index.html'?1800:650);
  await forceAllImages(page);
  await page.waitForTimeout(250);
  const r=await page.evaluate(()=>{
   const shown=e=>{const c=getComputedStyle(e),b=e.getBoundingClientRect();return !e.hidden&&c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity||1)>.02&&b.width>3&&b.height>3};
   const imgs=[...document.images].filter(shown).map(i=>({src:(i.currentSrc||i.src||'').split('?')[0],ok:i.complete&&i.naturalWidth>1,w:i.naturalWidth,h:i.naturalHeight,alt:i.alt||''}));
   const sections=[...document.querySelectorAll('main section,body>section')].filter(shown).map((s,i)=>{const b=s.getBoundingClientRect(),media=[...s.querySelectorAll('img,video,svg,canvas')].some(shown),bg=getComputedStyle(s).backgroundImage;return{i,h:Math.round(b.height),text:(s.innerText||'').trim().length,media,bg:bg&&bg!=='none'}});
   const links=[...document.querySelectorAll('a[href]')].filter(shown).map(a=>a.getAttribute('href')).filter(Boolean);
   const videos=[...document.querySelectorAll('video')].filter(shown).map(v=>({src:v.currentSrc||v.src||'',sources:[...v.querySelectorAll('source')].map(x=>x.src),error:!!v.error}));
   return{imgs,sections,links,videos,sw:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),vw:innerWidth};
  });
  for(const i of r.imgs)if(!i.ok)fail(file,`broken visible image: ${i.src||'(empty)'}`);
  for(const s of r.sections)if(s.h>=430&&s.text<12&&!s.media&&!s.bg)fail(file,`blank large section #${s.i+1} (${s.h}px)`);
  if(r.sw>r.vw+6)fail(file,`horizontal overflow ${r.sw-r.vw}px`);
  for(const v of r.videos)if(v.error)fail(file,`visible video failed: ${v.src||v.sources.join(',')||'no source'}`);
  for(const bad of [...new Set(requestFailures)])fail(file,`request failed: ${bad}`);
  const local=[...new Set(r.links.filter(h=>!h.startsWith('#')&&!/^(mailto:|tel:|javascript:|https?:\/\/|\/\/)/i.test(h)).map(h=>h.split('#')[0].split('?')[0]).filter(Boolean))];
  for(const href of local){const rr=await ctx.request.get(new URL(href,`${BASE}/${file}`).href).catch(()=>null);if(!rr||rr.status()>=400)fail(file,`broken local link ${href} -> ${rr?.status()||'request failed'}`)}
  if(file==='direct-farm.html'){
   const srcs=r.imgs.map(x=>x.src.replace(PROD,new URL(BASE).origin)).filter(Boolean),dupes=[...new Set(srcs.filter((x,i)=>srcs.indexOf(x)!==i))];
   if(dupes.length)fail(file,`repeated sourcing-story image(s): ${dupes.join(', ')}`);
   if(new Set(srcs).size<6)fail(file,`needs at least six distinct sourcing visuals; found ${new Set(srcs).size}`);
  }
  if(file==='south-india-groves.html'){
   const srcs=r.imgs.map(x=>x.src.replace(PROD,new URL(BASE).origin)).filter(Boolean);if(new Set(srcs).size<4)fail(file,`grove story still repeats too few visuals (${new Set(srcs).size})`);
  }
  if(file==='index.html'){
   if(!await page.locator('#nsDiscoverySource').count())fail(file,'checkout acquisition source question missing');
   if(await page.locator('#v20-story-coconut:visible,.v20-knife:visible,.water-stream:visible').count())fail(file,'known broken legacy cinematic layer visible');
  }
  if(runtimeErrors.length)fail(file,'runtime error(s): '+[...new Set(runtimeErrors)].join(' | '));
  checks.push({file,images:r.imgs.length,sections:r.sections.length,links:r.links.length});
  await page.close();
 }
 await ctx.close();
}finally{await browser.close()}

const report={generatedAt:new Date().toISOString(),failures,checks};
fs.writeFileSync(path.join(OUT,'content-integrity-qa-report.json'),JSON.stringify(report,null,2));
const summary=['# Storefront Content Integrity QA','',`Failures: ${failures.length}`,'',...(failures.length?failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','Checks: all real customer pages load; lazy media is forced through the viewport before validation; production-hosted repository assets are mirrored from the candidate; visible images decode; local links resolve; no large blank sections or horizontal overflow; direct-sourcing and grove imagery stays distinct; checkout attribution exists; broken legacy cinematic layers stay hidden.'].join('\n');
fs.writeFileSync(path.join(OUT,'content-integrity-qa-summary.md'),summary);console.log(summary);if(failures.length)process.exit(1);
