import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173',OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');fs.mkdirSync(OUT,{recursive:true});
const pages=['index.html','about-nariyal-sutra.html','fresh-tender-coconut.html','green-coconut.html','bulk-coconut-supply.html','coconut-events-hospitality.html','coconut-wholesale-export.html','direct-farm.html','gujarat-coast.html','people-of-nariyal-sutra.html','coconut-water.html','freshness-first.html','supplier-partnership.html','track-order.html','privacy.html','terms.html','delivery-policy.html','returns-refunds.html'];
const failures=[],checks=[],fail=(s,m)=>failures.push({scope:s,msg:m});
const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 for(const file of pages){
  const page=await ctx.newPage(),bad=[];page.on('pageerror',e=>bad.push(e.message));
  const res=await page.goto(`${BASE}/${file}?integrity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});if(!res||res.status()>=400){fail(file,`page HTTP ${res?.status()||'no response'}`);await page.close();continue}await page.waitForTimeout(900);
  const r=await page.evaluate(()=>{
   const shown=e=>{const c=getComputedStyle(e),b=e.getBoundingClientRect();return !e.hidden&&c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity||1)>.02&&b.width>3&&b.height>3};
   const imgs=[...document.images].filter(shown).map(i=>({src:(i.currentSrc||i.src||'').split('?')[0],ok:i.complete&&i.naturalWidth>1,w:i.naturalWidth,h:i.naturalHeight,alt:i.alt||''}));
   const sections=[...document.querySelectorAll('main section,body>section')].filter(shown).map((s,i)=>{const b=s.getBoundingClientRect(),media=[...s.querySelectorAll('img,video,svg,canvas')].some(shown),bg=getComputedStyle(s).backgroundImage;return{i,h:Math.round(b.height),text:(s.innerText||'').trim().length,media,bg:bg&&bg!=='none'}});
   const links=[...document.querySelectorAll('a[href]')].filter(shown).map(a=>a.getAttribute('href')).filter(Boolean);
   const buttons=[...document.querySelectorAll('button')].filter(shown).map(b=>({text:(b.innerText||b.getAttribute('aria-label')||'').trim(),disabled:b.disabled}));
   const videos=[...document.querySelectorAll('video')].filter(shown).map(v=>({src:v.currentSrc||v.src||'',sources:[...v.querySelectorAll('source')].map(x=>x.src),poster:v.poster||'',ready:v.readyState,error:!!v.error}));
   return{imgs,sections,links,buttons,videos,sw:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),vw:innerWidth};
  });
  for(const i of r.imgs)if(!i.ok)fail(file,`broken visible image: ${i.src||'(empty)'}`);
  for(const s of r.sections)if(s.h>=430&&s.text<12&&!s.media&&!s.bg)fail(file,`blank large section #${s.i+1} (${s.h}px)`);
  if(r.sw>r.vw+6)fail(file,`horizontal overflow ${r.sw-r.vw}px`);
  for(const v of r.videos)if(v.error)fail(file,`visible video failed: ${v.src||v.sources.join(',')||'no source'}`);
  const local=[...new Set(r.links.filter(h=>!h.startsWith('#')&&!/^(mailto:|tel:|javascript:|https?:\/\/|\/\/)/i.test(h)).map(h=>h.split('#')[0].split('?')[0]).filter(Boolean))];
  for(const href of local){const rr=await ctx.request.get(new URL(href,`${BASE}/${file}`).href).catch(()=>null);if(!rr||rr.status()>=400)fail(file,`broken local link ${href} -> ${rr?.status()||'request failed'}`)}
  if(file==='direct-farm.html'){
    const srcs=r.imgs.map(x=>x.src).filter(Boolean),dupes=[...new Set(srcs.filter((x,i)=>srcs.indexOf(x)!==i))];if(dupes.length)fail(file,`repeated sourcing-story image(s): ${dupes.join(', ')}`);if(new Set(srcs).size<6)fail(file,`needs at least six distinct sourcing visuals; found ${new Set(srcs).size}`);
  }
  if(file==='index.html'){
    const attr=await page.locator('#ns-acquisition-source').count();if(!attr)fail(file,'checkout acquisition source question missing');
    const brokenLegacy=await page.locator('#v20-story-coconut:visible,.v20-knife:visible,.water-stream:visible').count();if(brokenLegacy)fail(file,'known broken legacy cinematic layer visible');
  }
  checks.push({file,images:r.imgs.length,sections:r.sections.length,links:r.links.length,buttons:r.buttons.length});if(bad.length)fail(file,'runtime error(s): '+bad.join(' | '));
  await page.close();
 }
 await ctx.close();
}finally{await browser.close()}
const report={generatedAt:new Date().toISOString(),failures,checks};fs.writeFileSync(path.join(OUT,'content-integrity-qa-report.json'),JSON.stringify(report,null,2));const summary=['# Storefront Content Integrity QA','',`Failures: ${failures.length}`,'',...(failures.length?failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','Checks: customer pages load; visible images load; no large blank sections; no horizontal overflow; visible videos do not fail; local links resolve; direct-sourcing story uses distinct images; checkout attribution exists; broken legacy cinematic layers stay hidden.'].join('\n');fs.writeFileSync(path.join(OUT,'content-integrity-qa-summary.md'),summary);console.log(summary);if(failures.length)process.exit(1);
