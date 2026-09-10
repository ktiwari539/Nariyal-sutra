import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');
fs.mkdirSync(OUT,{recursive:true});
const failures=[],warnings=[],checks=[];
const fail=(scope,msg)=>failures.push({scope,msg});
const warn=(scope,msg)=>warnings.push({scope,msg});

const roles={
 Owner:'*',Admin:'*',
 Manager:['overview','orders','payments','products','inventory','warehouses','delivery-services','delivery','customers','segments','followups','communication','content','pages','stories','ambassadors','submissions','media','schedule','seo','analytics','reports','team','audit','security','settings'],
 Operations:['overview','orders','payments','products','inventory','warehouses','delivery-services','delivery','customers','followups','analytics','reports','audit'],
 Content:['overview','content','pages','stories','ambassadors','submissions','media','schedule','seo','analytics'],
 Support:['overview','orders','delivery','customers','followups','communication','submissions'],
 Sales:['overview','orders','customers','segments','followups','communication','analytics','reports']
};
const actions=['apNotifications','apQuickCreate','apExportSnapshot','apV12HealthDetails','apOrdersExport','apAssistedOrder','apOrderToday','apOrderWeek','apProductAudit','apProductAdd','apInventoryAudit','apInventoryAdjust','apAddWarehouse','apAddDeliveryService','apSaveDelivery','apOpenCustomerTracking','apDeliveryMapSearchBtn','apDeliveryUseCurrent','apDeliveryOpenGoogle','apConfirmDeliveryPin','apCustomerPhotoUpload','apCustomerPhotoRemove','apCustomerSave','apCustomerDelivery','apFollowupAdd','apSegmentAdd','apCommunicationNew','apPreviewSite','apNewContent','apPreviewHomepage','apPageSectionAdd','apValidateStories','apAddStory','apShowHistory','apUploadMedia','apScheduleNew','apCalendarPrev','apCalendarToday','apCalendarNext','apSeoExport','apReportOrders','apReportCustomers','apReportAudit','apV12AccessMatrix','apV12AdminLogin','apStaffPhotoUpload','apTaskAdd','apTeamInvite'];

const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},geolocation:{latitude:23.1987,longitude:80.0192},permissions:['geolocation'],acceptDownloads:true});
 async function openAdmin(){
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/favicon|ERR_BLOCKED_BY_CLIENT|tile|firebase|analytics/i.test(m.text()))errors.push('console: '+m.text())});
  page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(`${BASE}/admin.html?qa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(900);return{page,errors};
 }

 // Full module surface and navigation.
 {
  const {page,errors}=await openAdmin();
  const boot=await page.evaluate(()=>({store:!!window.NSV421Store,core:!!window.__NSV21_ADMIN_BOUND,nav:[...document.querySelectorAll('#apNav button[data-view]')].map(b=>b.dataset.view),sections:[...document.querySelectorAll('.ap-view[data-view]')].map(s=>s.dataset.view)}));
  if(!boot.store)fail('admin:boot','local Admin store did not initialize');
  if(!boot.core)fail('admin:boot','core Admin binder did not complete');
  if(boot.nav.length<25)fail('admin:boot',`full Business Command Center missing modules (${boot.nav.length})`);
  for(const v of boot.nav){
   if(!boot.sections.includes(v)){fail('admin:boot',`missing section ${v}`);continue}
   await page.click(`#apNav button[data-view="${v}"]`);await page.waitForTimeout(40);
   const r=await page.evaluate(v=>{const s=document.querySelector(`.ap-view[data-view="${v}"]`),cs=s&&getComputedStyle(s),b=s?.getBoundingClientRect();return{active:!!s?.classList.contains('is-active'),visible:!!s&&cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>20&&b.height>20,text:(s?.innerText||'').trim().length}},v);
   if(!r.active||!r.visible)fail(`admin:view:${v}`,'module does not open visibly');if(r.text<15)fail(`admin:view:${v}`,'module is effectively empty');
  }
  errors.forEach(e=>warn('admin:boot',e));await page.screenshot({path:path.join(OUT,'admin-command-center.png'),fullPage:true});await page.close();
 }

 // Role access surface.
 {
  const {page}=await openAdmin();const all=await page.locator('#apNav button[data-view]').evaluateAll(bs=>bs.map(b=>b.dataset.view));
  for(const [role,want] of Object.entries(roles)){await page.selectOption('#apRole',role);await page.waitForTimeout(70);const visible=await page.locator('#apNav button[data-view]').evaluateAll(bs=>bs.filter(b=>!b.hidden).map(b=>b.dataset.view));const expected=want==='*'?all:want,missing=expected.filter(x=>!visible.includes(x)),extra=visible.filter(x=>!expected.includes(x));if(missing.length||extra.length)fail(`admin:role:${role}`,`permission mismatch missing=[${missing}] extra=[${extra}]`)}await page.close();
 }

 // Every named action must cause a real observable result.
 for(const id of actions){
  const {page,errors}=await openAdmin(),button=page.locator('#'+id);if(!await button.count()){fail(`admin:button:${id}`,'missing');await page.close();continue}
  const view=await button.evaluate(e=>e.closest('.ap-view')?.dataset.view||'overview'),nav=page.locator(`#apNav button[data-view="${view}"]`);if(await nav.count())await nav.click();if(id==='apDeliveryMapSearchBtn')await page.fill('#apDeliveryMapSearch','Ranjhi Jabalpur');
  let download=false,file=false,popup=false;page.on('download',()=>download=true);page.on('filechooser',()=>file=true);page.on('popup',p=>{popup=true;p.close().catch(()=>{})});
  await page.evaluate(()=>{window.__qaMut=0;window.__qaObs?.disconnect?.();window.__qaObs=new MutationObserver(m=>window.__qaMut+=m.length);window.__qaObs.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true})});
  const before=await page.evaluate(id=>{const e=document.getElementById(id);return{disabled:!!e?.disabled,url:location.href,state:localStorage.getItem('ns-v421-local-state-v27')||'',view:document.querySelector('.ap-view.is-active')?.dataset.view||'',modal:document.querySelector('#apModal')?.classList.contains('is-open')||false,body:document.querySelector('#apModalBody')?.innerHTML||'',toast:document.querySelector('#apToast')?.textContent||'',section:e?.closest('.ap-view')?.innerHTML||''}},id);
  if(before.disabled){checks.push({scope:`admin:button:${id}`,status:'disabled'});await page.close();continue}
  await button.click({timeout:5000}).catch(e=>fail(`admin:button:${id}`,'click failed: '+e.message.split('\n')[0]));await page.waitForTimeout(/Map|Current/.test(id)?650:300);
  const after=await page.evaluate(id=>{const e=document.getElementById(id);return{url:location.href,state:localStorage.getItem('ns-v421-local-state-v27')||'',view:document.querySelector('.ap-view.is-active')?.dataset.view||'',modal:document.querySelector('#apModal')?.classList.contains('is-open')||false,body:document.querySelector('#apModalBody')?.innerHTML||'',toast:document.querySelector('#apToast')?.textContent||'',section:e?.closest('.ap-view')?.innerHTML||'',mut:window.__qaMut||0}},id);
  const effect=download||file||popup||before.url!==after.url||before.state!==after.state||before.view!==after.view||(!before.modal&&after.modal)||before.body!==after.body||before.toast!==after.toast||before.section!==after.section||after.mut>0;if(!effect)fail(`admin:button:${id}`,'visible button is a no-op');
  if(after.modal){const text=await page.locator('#apModalBody').innerText();if(text.trim().length<4)fail(`admin:button:${id}`,'opens blank modal');await page.click('#apModalClose').catch(()=>{});await page.waitForTimeout(40);if(await page.locator('#apModal.is-open').count())fail(`admin:button:${id}`,'modal cannot close')}
  errors.forEach(e=>warn(`admin:button:${id}`,e));checks.push({scope:`admin:button:${id}`,download,file,popup,modal:after.modal,state:before.state!==after.state,view:before.view!==after.view,mutations:after.mut});await page.close();
 }

 // Key second-step saves.
 async function flow(scope,view,open,form,fill,needle){const {page}=await openAdmin();await page.click(`#apNav button[data-view="${view}"]`);const before=await page.evaluate(()=>localStorage.getItem('ns-v421-local-state-v27')||'');await open(page);await page.waitForTimeout(70);if(!await page.locator(form).count()){fail(scope,`form ${form} missing`);await page.close();return}await fill(page);await page.locator(form).evaluate(f=>f.requestSubmit());await page.waitForTimeout(150);const after=await page.evaluate(()=>localStorage.getItem('ns-v421-local-state-v27')||'');if(before===after)fail(scope,'save did not persist');if(needle&&!after.includes(needle))fail(scope,'saved value not present');if(await page.locator('#apModal.is-open').count())fail(scope,'modal remains open after save');await page.close()}
  await flow('admin:flow:product','products',p=>p.locator('[data-prod]').first().click(),'#v21ProductForm',async p=>{const x=p.locator('#v21ProductForm input[name="name"]');await x.fill((await x.inputValue())+' QA')},' QA');
  await flow('admin:flow:stock','inventory',p=>p.locator('[data-stock]').first().click(),'#v21StockForm',async p=>{const x=p.locator('#v21StockForm input[name="on"]');await x.fill(String(+await x.inputValue()+1))});
  await flow('admin:flow:assisted-order','orders',p=>p.click('#apAssistedOrder'),'#v37OrderForm',async p=>{await p.fill('#v37OrderForm input[name="customer"]','QA Customer');await p.fill('#v37OrderForm input[name="qty"]','11')},'QA Customer');
  await flow('admin:flow:followup','followups',p=>p.click('#apFollowupAdd'),'#v37FollowupForm',async p=>{await p.fill('#v37FollowupForm input[name="customer"]','QA Customer');await p.fill('#v37FollowupForm input[name="reason"]','QA follow-up');await p.fill('#v37FollowupForm input[name="due"]','2026-09-11T12:00')},'QA follow-up');
  await flow('admin:flow:task','team',p=>p.click('#apTaskAdd'),'#v37TaskForm',p=>p.fill('#v37TaskForm input[name="title"]','QA task'),'QA task');

 // Page sequencing controls persist.
 {
  const {page}=await openAdmin();await page.click('#apNav button[data-view="pages"]');await page.waitForTimeout(260);
  for(const [scope,selector] of [['homepage','[data-v29-vis]'],['all-pages','#apV30PageRows [data-vis]']]){const b=page.locator(selector).first();if(!await b.count()){fail(`admin:sequencing:${scope}`,'show/hide control missing');continue}const before=await page.evaluate(()=>localStorage.getItem('ns-v421-local-state-v27')||'');await b.click();await page.waitForTimeout(100);const after=await page.evaluate(()=>localStorage.getItem('ns-v421-local-state-v27')||'');if(before===after)fail(`admin:sequencing:${scope}`,'show/hide did not persist')}
  await page.close();
 }

 // Mobile Admin.
 {
  const page=await context.newPage();await page.setViewportSize({width:390,height:844});await page.goto(`${BASE}/admin.html?mobile=${Date.now()}`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(650);await page.click('#apMenuBtn');if(!await page.locator('#apSidebar').evaluate(e=>e.classList.contains('is-open')))fail('admin:mobile','sidebar did not open');const sw=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth));if(sw>394)fail('admin:mobile',`horizontal overflow ${sw}px`);await page.screenshot({path:path.join(OUT,'admin-mobile-functional.png'),fullPage:true});await page.close();
 }

 // Auth shells: load, reject invalid credentials cleanly, and expose reset/setup paths.
 {
  const page=await context.newPage();await page.goto(`${BASE}/admin-login.html?qa=${Date.now()}`,{waitUntil:'domcontentloaded'});await page.fill('#email','qa.invalid@example.com');await page.fill('#pw','invalid-password');await page.click('#login button[type="submit"]');await page.waitForTimeout(100);if(!/not active|incorrect|incomplete/i.test(await page.locator('#msg').innerText()))fail('admin:auth:login','invalid login has no clear safe error');await page.click('#forgot');await page.waitForTimeout(60);if(!/valid staff login/i.test(await page.locator('#msg').innerText()))fail('admin:auth:forgot','unknown-user reset is not handled safely');await page.close();
  const set=await context.newPage();await set.goto(`${BASE}/admin-set-password.html?token=invalid-${Date.now()}`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(20).catch(()=>{});if(!/invalid|expired|new invitation/i.test((await set.locator('body').innerText()).toLowerCase()))fail('admin:auth:set-password','invalid setup token has no safe error');await set.close();
 }
 await context.close();
}finally{await browser.close()}

const report={generatedAt:new Date().toISOString(),failures,warnings,checks};fs.writeFileSync(path.join(OUT,'admin-functional-qa-report.json'),JSON.stringify(report,null,2));const summary=['# Admin Functional QA','',`Failures: ${failures.length}`,`Warnings: ${warnings.length}`,'','## Failures',...(failures.length?failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','## Warnings',...(warnings.length?warnings.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'',`Named buttons probed: ${actions.length}`,'Coverage: all modules, role visibility, named actions, modal close paths, product/inventory/order/follow-up/task saves, page sequencing, mobile menu, login/reset safety.'].join('\n');fs.writeFileSync(path.join(OUT,'admin-functional-qa-summary.md'),summary);console.log(summary);if(failures.length)process.exit(1);
