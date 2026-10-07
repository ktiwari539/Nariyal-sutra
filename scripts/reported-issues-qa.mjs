import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const BASE='http://127.0.0.1:4213',OUT='qa-artifacts/reported-issues',must=(c,m)=>{if(!c)throw new Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4213','--bind','127.0.0.1'],{stdio:'ignore'});await sleep(850);
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.setDefaultTimeout(15000);
 await page.goto(BASE+'/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.NSLiveCatalog&&document.querySelector('.hero-price'));
 must(await page.locator('.hero-price [data-price-value]').count()===1,'Hero still exposes multiple customer prices');
 must(await page.locator('.hero-price [data-price-value="bulk"]').count()===0,'Hero still exposes ambiguous bulk price');
 const fit=await page.locator('#people-of-nariyal .ns-people-visual img').evaluate(el=>getComputedStyle(el).objectFit);
 must(fit==='contain','Homepage People teaser still crops photography: '+fit);
 await page.locator('#people-of-nariyal').scrollIntoViewIfNeeded();await page.screenshot({path:OUT+'/storefront-people-and-price.png',fullPage:false});

 await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.NSV421Store?.load&&window.__NS_V421_ADMIN_MEDIA_ORGANIZER__===true);
 await page.evaluate(()=>document.documentElement.setAttribute('data-ns-admin-theme','coastal-premium'));
 await page.locator('#apNav button[data-view="media"]').click();await page.waitForSelector('#apV42MediaOrganizer',{state:'visible'});
 for(const key of ['website-ready','in-use','people','reference','needs-review','archived','all']){
   const b=page.locator('[data-v42-filter="'+key+'"]');await b.click();await page.waitForFunction(k=>document.querySelector('#apMediaGrid')?.dataset.activeFilter===k,key);
   must(await b.getAttribute('aria-pressed')==='true','Filter did not stay active: '+key);
 }
 await page.locator('[data-v42-filter="website-ready"]').click();await page.waitForFunction(()=>document.querySelector('#apMediaGrid')?.dataset.activeFilter==='website-ready');
 const mediaButtonContrast=await page.locator('#apMediaGrid .ap-media-actions button').first().evaluate(el=>{const s=getComputedStyle(el);return{color:s.color,bg:s.backgroundColor,text:(el.textContent||'').trim()}});
 must(mediaButtonContrast.text.length>0,'Media action button text missing');
 must(mediaButtonContrast.color!==mediaButtonContrast.bg,'Media action button text is visually blank');
 await page.screenshot({path:OUT+'/admin-media-filters-coastal.png',fullPage:false});

 await page.locator('#apNav button[data-view="pages"]').click();await page.waitForSelector('#apCustomSectionGrid',{state:'visible'});
 const custom=page.locator('#apCustomSectionGrid .ap-v12-section-card').first();if(await custom.count()){
   const colors=await custom.evaluate(el=>{const s=getComputedStyle(el),h=el.querySelector('h3');return{bg:s.backgroundColor,color:h?getComputedStyle(h).color:s.color}});
   must(colors.bg!==colors.color,'Pages & Sections custom card has unreadable contrast');
 }
 await page.screenshot({path:OUT+'/admin-pages-coastal.png',fullPage:false});

 await page.locator('#apNav button[data-view="water-formats"]').click();await page.waitForSelector('#nsWaterFrame',{state:'attached'});await sleep(600);
 const water=await page.evaluate(()=>{const c=document.querySelector('.ns-water-preview-canvas')?.getBoundingClientRect(),s=document.querySelector('.ns-water-preview-stage')?.getBoundingClientRect();return{canvas:c?.height||0,stage:s?.height||0}});
 must(water.canvas>100&&water.canvas<700,'Water preview canvas is still oversized/blank: '+JSON.stringify(water));
 await page.screenshot({path:OUT+'/admin-water-preview.png',fullPage:false});

 await page.locator('#apNav button[data-view="followups"]').click();await page.waitForSelector('#apFollowupRows',{state:'attached'});
 const rows=page.locator('#apFollowupRows tr[data-followup-id]');if(await rows.count()){
   const first=rows.first();must(await first.locator('.ns-fu-more').count()===1,'Follow-up row missing compact more-actions menu');
   must(await first.locator('.ns-fu-row-actions > .ap-btn').count()<=1,'Follow-up row still exposes too many direct actions');
 }
 await page.screenshot({path:OUT+'/admin-followups-compact.png',fullPage:false});

 await page.locator('#apNav button[data-view="communication"]').click();await page.waitForSelector('#nsCampaignCenter',{state:'visible'});
 must(await page.locator('#nsCampaignDirectoryExport').count()===1,'Full customer directory export missing');
 await page.locator('#nsCampaignNew').click();await page.waitForSelector('#nsCampaignForm',{state:'visible'});
 for(const sel of ['[data-camp-source="existing"]','[data-camp-source="imported"]','[data-camp-select-all]','[data-camp-city]','[data-camp-product]','[data-camp-type]','[data-camp-template]','#nsCampaignCsvImport'])must(await page.locator('#nsCampaignForm '+sel).count()===1,'Campaign audience control missing: '+sel);
 must(await page.locator('#nsCampaignForm .ns-camp-customer-row').count()>0,'Existing customers are not visible in Campaign Center');
 const summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(summary.length===5,'Campaign audience KPI summary incomplete');
 await page.screenshot({path:OUT+'/campaign-audience-builder-desktop.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});await sleep(120);
 must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Campaign modal causes mobile page overflow');
 await page.screenshot({path:OUT+'/campaign-audience-builder-mobile.png',fullPage:false});
 console.log('REPORTED ISSUE VISUAL + WORKFLOW QA: PASS');
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}