import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const BASE='http://127.0.0.1:4213',OUT='qa-artifacts/reported-issues',failures=[],must=(c,m)=>{if(!c)failures.push(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
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
 must(await page.locator('.story-visual .sv-badge [data-price-value="bulk"]').count()===0,'Story badge still mixes retail and bulk prices');
 must(await page.locator('.sticky-bar [data-price-value="bulk"]').count()===0,'Sticky CTA still mixes retail and bulk prices');
 const kicker=(await page.locator('.hero-price .live-price-kicker').textContent())||'';must(!/local admin/i.test(kicker),'Storefront leaks internal pricing source: '+kicker);
 await page.screenshot({path:OUT+'/storefront-hero-price.png',fullPage:false});
 const fit=await page.locator('#people-of-nariyal .ns-people-visual img').evaluate(el=>getComputedStyle(el).objectFit);
 must(fit==='contain','Homepage People teaser still crops photography: '+fit);
 await page.locator('#people-of-nariyal').scrollIntoViewIfNeeded();await page.screenshot({path:OUT+'/storefront-people.png',fullPage:false});
 const peoplePage=await browser.newPage({viewport:{width:1440,height:1000}});await peoplePage.goto(BASE+'/people-of-nariyal-sutra.html',{waitUntil:'domcontentloaded'});const heroFit=await peoplePage.locator('.people-hero>img').evaluate(el=>getComputedStyle(el).objectFit);must(heroFit==='contain','People page hero still crops photography: '+heroFit);await peoplePage.screenshot({path:OUT+'/people-page-hero.png',fullPage:false});await peoplePage.close();

 await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.NSV421Store?.load&&window.__NS_V421_ADMIN_MEDIA_ORGANIZER__===true);
 await page.evaluate(()=>document.documentElement.setAttribute('data-ns-admin-theme','coastal-premium'));
 await page.locator('#apNav button[data-view="media"]').click();await page.waitForSelector('#apV42MediaOrganizer',{state:'visible'});
 const mediaSets={};for(const key of ['website-ready','in-use','people','reference','needs-review','archived','all']){
   const b=page.locator('[data-v42-filter="'+key+'"]');await b.click();await page.waitForFunction(k=>document.querySelector('#apMediaGrid')?.dataset.activeFilter===k,key);
   must(await b.getAttribute('aria-pressed')==='true','Filter did not stay active: '+key);
   mediaSets[key]=await page.locator('#apMediaGrid .ap-media[data-v42-visible="1"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.id).filter(Boolean));
   const hiddenVisible=await page.locator('#apMediaGrid .ap-media[data-v42-visible="0"]:visible').count();must(hiddenVisible===0,'Hidden media cards became visible after filter '+key);
 }
 must(mediaSets.all.length>=mediaSets.people.length&&mediaSets.people.length>0,'People filter produced no usable subset');
 must(mediaSets.websiteReady===undefined||true,'compat');
 must(JSON.stringify(mediaSets['website-ready'])!==JSON.stringify(mediaSets.people),'Website-ready and People filters show the same card set');
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

 await page.evaluate(()=>{const s=window.NSV421Store.load();s.customerProfiles=[
  {uid:'v51-a',displayName:'Aarav Mehta',contactEmail:'aarav@example.com',phone:'+919811111111',primaryCity:'Jabalpur',primaryState:'Madhya Pradesh',preferredProduct:'tender',marketingEmailOptIn:true,marketingWhatsappOptIn:true,marketingTelegramOptIn:false},
  {uid:'v51-b',displayName:'Riya Sharma',contactEmail:'riya@example.com',phone:'+919822222222',primaryCity:'Bhopal',primaryState:'Madhya Pradesh',preferredProduct:'green',marketingEmailOptIn:true,marketingWhatsappOptIn:false,marketingTelegramOptIn:false},
  {uid:'v51-c',displayName:'No Marketing Consent',contactEmail:'orders@example.com',phone:'+919833333333',primaryCity:'Jabalpur',primaryState:'Madhya Pradesh',preferredProduct:'tender',marketingEmailOptIn:false,marketingWhatsappOptIn:false,marketingTelegramOptIn:false}
 ];s.orders=[{orderId:'V51-A1',customerUid:'v51-a',customerName:'Aarav Mehta',email:'aarav@example.com',phone:'+919811111111',city:'Jabalpur',state:'Madhya Pradesh',productKey:'tender',quantity:10,total:550,status:'delivered'},{orderId:'V51-A2',customerUid:'v51-a',customerName:'Aarav Mehta',email:'aarav@example.com',phone:'+919811111111',city:'Jabalpur',state:'Madhya Pradesh',productKey:'tender',quantity:10,total:550,status:'delivered'},{orderId:'V51-GUEST',customerName:'Guest Virar',email:'guest@example.com',phone:'+919844444444',city:'Virar',state:'Maharashtra',productKey:'bulk',quantity:10,total:450,status:'delivered'}];s.campaigns=[];window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));});
 await page.locator('#apNav button[data-view="communication"]').click();await page.waitForSelector('#nsCampaignCenter',{state:'visible'});
 must(await page.locator('#nsCampaignDirectoryExport').count()===1,'Full customer directory export missing');
 await page.locator('#nsCampaignNew').click();await page.waitForSelector('#nsCampaignForm',{state:'visible'});
 for(const sel of ['[data-camp-source="existing"]','[data-camp-source="imported"]','[data-camp-select-all]','[data-camp-state]','[data-camp-city]','[data-camp-product]','[data-camp-type]','[data-camp-channel-filter]','[data-camp-consent]','[data-camp-orders]','[data-camp-segment]','[data-camp-save-segment]','[data-camp-template]','#nsCampaignCsvImport'])must(await page.locator('#nsCampaignForm '+sel).count()===1,'Campaign audience control missing: '+sel);must(await page.locator('#nsCampaignForm [data-camp-step-button]').count()===4,'Audience → Message → Review → Send workflow stepper incomplete');
 must(await page.locator('#nsCampaignForm .ns-camp-customer-row').count()>=4,'Existing registered + guest customers are not visible in Campaign Center');
 let summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(summary.length===5,'Campaign audience KPI summary incomplete');must(Number(summary[3])===2,'Email default selection should include exactly two explicitly opted-in customers');
 await page.locator('#nsCampaignForm [data-camp-clear]').click();summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(Number(summary[3])===0,'Clear selection did not clear recipients');
 const firstEligible=page.locator('#nsCampaignForm [data-camp-row]:not([disabled])').first();await firstEligible.check();summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(Number(summary[3])===1,'Individual customer selection did not update');
 await page.locator('#nsCampaignForm [data-camp-select-all]').click();summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(Number(summary[3])===2,'Select all eligible did not restore the eligible audience');
 const mp=await page.locator('#nsCampaignForm [data-camp-state] option').filter({hasText:'Madhya Pradesh'}).first().getAttribute('value');must(!!mp,'Madhya Pradesh state option missing');if(mp)await page.locator('#nsCampaignForm [data-camp-state]').selectOption(mp);must((await page.locator('#nsCampaignForm [data-camp-city] option').first().textContent()).includes('customers'),'All cities option is still misleading about what its count means');const jabalpurOption=await page.locator('#nsCampaignForm [data-camp-city] option').filter({hasText:'Jabalpur'}).first().getAttribute('value');must(!!jabalpurOption,'Jabalpur city option missing after State selection');if(jabalpurOption)await page.locator('#nsCampaignForm [data-camp-city]').selectOption(jabalpurOption);summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(Number(summary[1])===2&&Number(summary[2])===1,'State → City filtering did not produce the expected Jabalpur audience');const disabledReason=(await page.locator('#nsCampaignForm .ns-camp-customer-row.is-disabled .ns-camp-eligibility-reason').first().textContent())||'';must(/consent|missing|invalid/i.test(disabledReason),'Disabled customer does not explain why selection is blocked: '+disabledReason);await page.locator('#nsCampaignForm [data-camp-orders]').selectOption('repeat');summary=await page.locator('#nsCampaignForm .ns-camp-audience-summary strong').allTextContents();must(Number(summary[1])===1,'Repeat customer filter did not isolate the 2+ order customer');
 await page.locator('#nsCampaignForm [data-camp-orders]').selectOption('all');await page.locator('#nsCampaignForm [data-camp-state]').selectOption('');await page.locator('#nsCampaignForm [data-camp-select-all]').click();await page.locator('#nsCampaignForm [data-camp-next="2"]').click();must(await page.locator('#nsCampaignForm [data-camp-step="2"]').isVisible(),'Campaign did not advance to Message step');await page.locator('#nsCampaignForm [name="name"]').fill('QA Campaign');await page.locator('#nsCampaignForm [name="subject"]').fill('QA Subject');await page.locator('#nsCampaignForm [name="message"]').fill('Hello {{first_name}}, QA message');await page.locator('#nsCampaignForm [data-camp-next="3"]').click();must(await page.locator('#nsCampaignForm [data-camp-step="3"]').isVisible(),'Campaign did not advance to Review step');must(await page.locator('#nsCampaignForm [data-camp-test="Email"]').count()===1,'Test handoff controls missing');await page.locator('#nsCampaignForm [data-camp-next="4"]').click();must(await page.locator('#nsCampaignForm [data-camp-step="4"]').isVisible(),'Campaign did not advance to Send / schedule step');must(await page.locator('#nsCampaignForm [name="scheduledAt"]').count()===1,'Campaign scheduling control missing');await page.locator('#nsCampaignForm [data-camp-step-button="1"]').click();const csv='customer_id,customer_name,email,phone,telegram,city,state,country,preferred_product,customer_type,marketing_email_opt_in,marketing_whatsapp_opt_in,marketing_telegram_opt_in,consent_updated_at,include_in_campaign\nIMP-1,Imported Customer,imported@example.com,919855555555,,Indore,Madhya Pradesh,India,tender,Imported,true,false,false,2026-10-07T00:00:00Z,true\n';
 await page.locator('#nsCampaignCsvImport').setInputFiles({name:'campaign.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await page.waitForTimeout(120);
 must(await page.locator('#nsCampaignForm [data-camp-source="imported"]').evaluate(el=>el.classList.contains('is-active')),'Imported sheet did not become active after CSV upload');
 must(await page.locator('#nsCampaignForm .ns-camp-customer-row').count()===1,'Imported CSV audience did not render exactly one row');
 await page.screenshot({path:OUT+'/campaign-audience-builder-desktop.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});await sleep(120);
 must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Campaign modal causes mobile page overflow');
 await page.screenshot({path:OUT+'/campaign-audience-builder-mobile.png',fullPage:false});
 if(failures.length)throw new Error('REPORTED ISSUE QA FAILURES ('+failures.length+'):\n- '+failures.join('\n- '));
 console.log('REPORTED ISSUE VISUAL + WORKFLOW QA: PASS');
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}