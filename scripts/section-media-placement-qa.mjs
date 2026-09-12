import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd(),OUT=path.join(ROOT,'qa-artifacts','section-media-placement'),BASE='http://127.0.0.1:4202';fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4202','--bind','127.0.0.1'],{stdio:'ignore'}),wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(900);const browser=await chromium.launch({headless:true}),must=(v,m)=>{if(!v)throw new Error(m)};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(8000);
 await page.goto(`${BASE}/admin.html`,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForSelector('.ap-app',{state:'visible'});await page.waitForFunction(()=>window.__NS_V421_ADMIN_V38__===true&&window.__NS_V421_ADMIN_MEDIA_STUDIO__===true&&window.__NS_V421_ADMIN_RUNTIME_STABILITY__===true,null,{timeout:12000});await page.locator('#apNav [data-view="pages"]').click();await page.waitForSelector('#apV38ImageTargets',{state:'visible'});
 const initial=await page.evaluate(()=>{const host=document.getElementById('apV38ImageTargets'),cards=[...(host?.querySelectorAll('article')||[])];return {cards:cards.length,items:cards.map(c=>({target:c.dataset.v38PlacementCard||c.querySelector('[data-v38-target]')?.dataset.v38Target||'',state:c.dataset.v38Status||c.querySelector('[data-v38-status]')?.dataset.v38Status||'',src:c.querySelector('img')?.getAttribute('src')||''}))};});
 must(initial.cards===12,`expected 12 placement cards, got ${initial.cards}`);must(initial.items.every(x=>x.target&&['default','custom'].includes(x.state)&&x.src),`placement cards must expose deterministic target/state/preview metadata: ${JSON.stringify(initial.items)}`);

 await page.locator('[data-v38-target="homepage-hero"]').click();await page.waitForSelector('#apModal.is-open',{state:'visible'});await page.waitForTimeout(80);
 const picker=await page.locator('[data-v38-pick]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-v38-pick')));
 must(!picker.includes('WS001'),'Low-resolution WS001 must not be offered for a large homepage hero surface');
 must(picker.includes('M-ORIGIN-01'),`High-resolution bundled origin media missing from large-surface picker: ${JSON.stringify(picker.slice(0,20))}`);
 await page.locator('[data-v38-pick="M-ORIGIN-01"]').click();await page.waitForFunction(()=>window.NSV421Store?.load()?.sectionMedia?.['homepage-hero']==='M-ORIGIN-01');await page.waitForSelector('#apV38ImageTargets [data-v38-placement-card="homepage-hero"][data-v38-status="custom"]',{state:'attached'});await page.screenshot({path:path.join(OUT,'admin-placement-custom.png'),fullPage:false,timeout:10000});

 const source=await page.evaluate(()=>window.NSV421Store.mediaById(window.NSV421Store.load(),'M-ORIGIN-01')?.src||'');must(source,'M-ORIGIN-01 source missing');
 await page.evaluate(()=>{const s=window.NSV421Store.load();s.sectionMedia=s.sectionMedia||{};Object.assign(s.sectionMedia,{'homepage-hero':'M-ORIGIN-01','people-hero':'M-ORIGIN-01','fresh-tender-hero':'M-ORIGIN-01','green-hero':'M-ORIGIN-01','bulk-hero':'M-ORIGIN-01'});window.NSV421Store.save(s);});
 const checks=[['index.html','.hero-visual img'],['people-of-nariyal-sutra.html','#peopleHeroImg'],['fresh-tender-coconut.html','.sp-scenes .sp-scene:first-child'],['green-coconut.html','.sp-scenes .sp-scene:first-child'],['bulk-coconut-supply.html','.w-hero-media img']];
 for(const [file,selector] of checks){const p=await context.newPage(),errs=[];p.on('pageerror',e=>errs.push(String(e)));p.setDefaultTimeout(8000);await p.goto(`${BASE}/${file}?qa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:25000});await p.waitForFunction(({selector,source})=>{const el=document.querySelector(selector);return !!el&&String(el.currentSrc||el.getAttribute('src')||'').includes(source.replace(/^\/?/,'/').split('/').pop());},{selector,source},{timeout:10000});const src=await p.locator(selector).first().getAttribute('src');must(String(src).includes(source.split('/').pop()),`${file}: ${selector} did not use saved Admin placement, got ${src}`);must(!errs.length,`${file}: page errors ${errs.join(' | ')}`);await p.close();}

 await page.bringToFront();await page.locator('#apNav [data-view="pages"]').click();await page.waitForSelector('#apV38ImageTargets',{state:'visible'});const clear=page.locator('[data-v38-clear="homepage-hero"]');must(await clear.count()===1,'Use default control missing for custom homepage hero');await clear.click();await page.waitForFunction(()=>!window.NSV421Store?.load()?.sectionMedia?.['homepage-hero']);await page.waitForFunction(()=>{const card=document.querySelector('[data-v38-placement-card="homepage-hero"]');return card?.dataset.v38Status==='default'||card?.querySelector('[data-v38-status]')?.dataset.v38Status==='default';});must(!errors.length,`admin page errors: ${errors.join(' | ')}`);console.log('SECTION MEDIA PLACEMENT QA: PASS');await context.close();
} finally {await browser.close().catch(()=>{});server.kill();}
