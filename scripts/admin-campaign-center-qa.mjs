import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const BASE='http://127.0.0.1:4209',OUT='qa-artifacts/campaign-center',must=(c,m)=>{if(!c)throw new Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));fs.mkdirSync(OUT,{recursive:true});
const campaign=fs.readFileSync('assets/js/admin-campaign-center.js','utf8'),account=fs.readFileSync('customer-account.js','utf8'),rules=fs.readFileSync('firestore.rules','utf8'),bridge=fs.readFileSync('assets/js/v421-production-bridge.js','utf8'),loader=fs.readFileSync('assets/js/admin-v30.js','utf8');
for(const flag of ['marketingEmailOptIn===true','marketingWhatsappOptIn===true','marketingTelegramOptIn===true'])must(campaign.includes(flag),`Campaign audience does not require explicit ${flag}`);
must(!/notifyEmail|notifyWhatsapp|notifyTelegram/.test(campaign),'Campaign Center incorrectly reuses order-update preferences as marketing consent');
must(account.includes('Offers, announcements &amp; festival greetings')&&account.includes('marketingEmailOptIn:false')&&account.includes('marketingWhatsappOptIn:false')&&account.includes('marketingTelegramOptIn:false'),'Customer account does not expose separate default-off marketing consent');
for(const f of ['marketingEmailOptIn','marketingWhatsappOptIn','marketingTelegramOptIn'])must(rules.includes(f),`Firestore profile contract missing ${f}`);
must(rules.includes("!d.diff(resource.data).affectedKeys().hasAny(['marketingEmailOptIn','marketingWhatsappOptIn','marketingTelegramOptIn'])"),'Firestore consent timestamp would be forced to refresh on unrelated profile edits');
must(rules.includes("d.diff(resource.data).affectedKeys().hasAny(['marketingConsentUpdatedAt'])"),'Firestore rules do not bind consent timestamp changes to consent-field changes');
must(bridge.includes("'campaigns'")&&loader.includes('admin-campaign-center.js'),'Campaign drafts are not wired into private Admin persistence/runtime');
must(!/api\.emailjs\.com|graph\.facebook|whatsapp.*api|api\.telegram\.org/i.test(campaign),'No-cost Campaign Center contains a direct bulk provider send path');
const server=spawn('python3',['-m','http.server','4209','--bind','127.0.0.1'],{stdio:'ignore'});await sleep(850);
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'}),page=await context.newPage();const errors=[],mutations=[];
page.on('pageerror',e=>{const m=String(e);if(/serviceWorker.*sandboxed.*allow-same-origin/i.test(m))return;errors.push(m)});
page.on('request',r=>{if(r.url().startsWith(BASE))return;if(['POST','PUT','PATCH','DELETE'].includes(r.method()))mutations.push(`${r.method()} ${r.url()}`)});
let original;
try{
 const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});must(res&&res.status()<400,'Admin preview failed to load');
 await page.waitForFunction(()=>window.NSV421CampaignCenter?.ready===true,null,{timeout:15000});original=await page.evaluate(()=>window.NSV421Store.load());
 await page.evaluate(()=>{const s=window.NSV421Store.load();s.customerProfiles=[
  {uid:'qa1',displayName:'Email WA Opt In',contactEmail:'optin@example.com',phone:'+919876543210',primaryCity:'Jabalpur',preferredProduct:'tender',notifyEmail:true,notifyWhatsapp:true,marketingEmailOptIn:true,marketingWhatsappOptIn:true,marketingTelegramOptIn:false},
  {uid:'qa2',displayName:'Order Updates Only',contactEmail:'orders-only@example.com',phone:'+919999999999',primaryCity:'Jabalpur',preferredProduct:'tender',notifyEmail:true,notifyWhatsapp:true,marketingEmailOptIn:false,marketingWhatsappOptIn:false,marketingTelegramOptIn:false},
  {uid:'qa3',displayName:'Telegram Opt In',contactEmail:'tg@example.com',phone:'+918888888888',telegramUsername:'qa_telegram',primaryCity:'Bhopal',preferredProduct:'green',marketingEmailOptIn:false,marketingWhatsappOptIn:false,marketingTelegramOptIn:true}
 ];s.orders=[];s.campaigns=[];window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));});
 await page.locator('#apNav button[data-view="communication"]').click();await page.waitForSelector('#nsCampaignCenter',{state:'visible'});await sleep(80);
 const stats=await page.locator('#nsCampaignCenter .ns-camp-stats strong').allTextContents();must(stats.join('|')==='3|2|1|1|1',`Consent KPI counts wrong: ${stats.join('|')}`);
 must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Campaign Center desktop page overflow');
 await page.screenshot({path:OUT+'/campaign-center-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await sleep(120);
 must(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Campaign Center mobile page overflow');
 await page.screenshot({path:OUT+'/campaign-center-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await sleep(120);
 const audience=await page.evaluate(()=>window.NSV421CampaignCenter.audience({channels:['Email','WhatsApp','Telegram'],city:'',product:''}));must(audience.email.length===1&&audience.wa.length===1&&audience.tg.length===1&&audience.union.length===2,'Order-update-only customer leaked into campaign audience');
 await page.locator('#nsCampaignNew').click();await page.waitForSelector('#nsCampaignForm',{state:'visible'});
  const sourceButtons=await page.locator('#nsCampaignForm [data-camp-source]').allTextContents();must(sourceButtons.join('|').includes('Existing customers')&&sourceButtons.join('|').includes('Imported sheet'),'Campaign audience source controls missing');
  must(await page.locator('#nsCampaignForm [data-camp-select-all]').count()===1,'Select-all eligible control missing');
  must(await page.locator('#nsCampaignForm [data-camp-template]').count()===1,'CSV/Excel template download control missing');
  must(await page.locator('#nsCampaignForm .ns-camp-customer-row').count()===3,'Existing customer audience table did not render');await page.locator('#nsCampaignForm [name="name"]').fill('QA Festival Campaign');await page.locator('#nsCampaignForm [name="channels"][value="WhatsApp"]').check();await page.locator('#nsCampaignForm [name="channels"][value="Telegram"]').check();await page.locator('#nsCampaignForm [name="subject"]').fill('Festival wishes from Nariyal Sutra');await page.locator('#nsCampaignForm [name="message"]').fill('Warm wishes from Nariyal Sutra.');await page.locator('#nsCampaignForm button[type="submit"]').click();
 await page.waitForFunction(()=>window.NSV421Store.load().campaigns?.length===1);let saved=await page.evaluate(()=>window.NSV421Store.load().campaigns[0]);must(saved.status==='Draft'&&saved.channels.length===3,'Campaign draft did not persist correctly');
 page.once('dialog',d=>d.accept());await page.locator(`[data-camp-ready="${saved.id}"]`).click();await page.waitForFunction(id=>window.NSV421Store.load().campaigns?.find(x=>x.id===id)?.status==='Ready',saved.id);
 await page.locator(`[data-camp-email="${saved.id}"]`).click();must(/1 selected, explicitly opted-in email recipient/i.test(await page.locator('#apModal').innerText()),'Email BCC handoff count is wrong');
 await page.locator('#apModalClose').click().catch(()=>{});await page.locator(`[data-camp-wa="${saved.id}"]`).click();must(/1 selected opted-in recipient/i.test(await page.locator('#apModal').innerText()),'WhatsApp queue count is wrong');must(await page.locator('#apModal a[href^="https://wa.me/"]').count()===1,'WhatsApp queue did not render exactly one individual DM');
 await page.locator('#apModalClose').click().catch(()=>{});await page.locator(`[data-camp-tg="${saved.id}"]`).click();must(await page.locator('#apModal a[href^="https://t.me/"]').count()===1,'Telegram queue did not render exactly one opted-in handoff');
 must(errors.length===0,`Campaign Center page errors: ${JSON.stringify(errors)}`);must(mutations.length===0,`Local campaign QA attempted external mutation: ${JSON.stringify(mutations)}`);
 console.log('CUSTOMER CAMPAIGN CENTER QA: PASS');
}finally{if(original)try{await page.evaluate(s=>{window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},original)}catch{}await context.close().catch(()=>{});await browser.close().catch(()=>{});server.kill('SIGTERM');}