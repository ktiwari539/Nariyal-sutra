import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4201';
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// Static ownership check for top-level HTML buttons. Generic navigation buttons are
// intentionally handled by data-view/data-go delegation; every other id must have
// an owning Admin runtime reference.
const html=fs.readFileSync('admin-preview.html','utf8');
const jsDir=path.join(process.cwd(),'assets','js');
const adminJs=fs.readdirSync(jsDir).filter(n=>/^admin-(?:v\d+.*|communication)\.js$/.test(n)).map(n=>fs.readFileSync(path.join(jsDir,n),'utf8')).join('\n');
const buttonTags=[...html.matchAll(/<button\b([^>]*)>/gi)].map(m=>m[1]);
const unowned=[];
for(const attrs of buttonTags){
  const id=attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
  if(!id||/\bdata-(?:view|go)=/i.test(attrs))continue;
  if(!adminJs.includes(id))unowned.push(id);
}
must(unowned.length===0,`Visible/static Admin buttons have no runtime owner: ${[...new Set(unowned)].join(', ')}`);

const server=spawn('python3',['-m','http.server','4201','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(900);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',acceptDownloads:true});
const page=await context.newPage();
const pageErrors=[];
const externalMutations=[];
const nonBusinessExternalPosts=[];
function classifyExternalPost(raw){
  let u;
  try{u=new URL(raw);}catch{return 'unknown';}
  const h=u.hostname,p=u.pathname;
  if(h==='firestore.googleapis.com'&&/\/google\.firestore\.v1\.Firestore\/Listen\/channel$/.test(p))return 'background-read';
  if(h==='firebaseremoteconfig.googleapis.com'&&/:fetch$/.test(p))return 'background-read';
  if(h==='firebaseinstallations.googleapis.com'&&/\/installations$/.test(p))return 'bootstrap-telemetry';
  if((h==='www.google-analytics.com'||h.endsWith('.google-analytics.com'))&&/\/g\/collect$/.test(p))return 'bootstrap-telemetry';
  return 'mutation';
}
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('request',r=>{
  const u=r.url(),m=r.method();
  if(u.startsWith(BASE)||['GET','HEAD','OPTIONS'].includes(m))return;
  const kind=classifyExternalPost(u);
  if(kind==='mutation')externalMutations.push(`${m} ${u}`);
  else nonBusinessExternalPosts.push({method:m,url:u,kind});
});
let original=null;

async function activeView(){return page.locator('.ap-view.is-active').getAttribute('data-view');}
async function go(view){
  await page.evaluate(v=>document.querySelector(`#apNav button[data-view="${v}"]`)?.click(),view);
  await page.waitForFunction(v=>document.querySelector(`.ap-view[data-view="${v}"]`)?.classList.contains('is-active'),view,{timeout:5000});
  must(await activeView()===view,`View ${view} did not activate`);
}
async function closeModal(){await page.evaluate(()=>document.querySelector('#apModalClose')?.click());await page.waitForFunction(()=>!document.querySelector('#apModal')?.classList.contains('is-open'),null,{timeout:3000}).catch(()=>{});}
async function countState(key){return page.evaluate(k=>(window.NSV421Store.load()[k]||[]).length,key);}
async function clickCenter(selector){
 const el=page.locator(selector).first();must(await el.count()===1,`Missing control ${selector}`);await el.scrollIntoViewIfNeeded();
 const hit=await el.evaluate(node=>{const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,t=document.elementFromPoint(x,y);return !!t&&(t===node||node.contains(t));});
 must(hit,`Control center is intercepted: ${selector}`);await el.click();
}
async function assertCreateOpensForm({view,button,form,key,cancel}){
 await go(view);const before=await countState(key);await clickCenter(button);await page.waitForSelector(form,{state:'visible',timeout:5000});
 const afterOpen=await countState(key);must(afterOpen===before,`${button} created placeholder data before form submit (${before} -> ${afterOpen})`);
 if(cancel){await page.locator(cancel).click();}else await closeModal();
 await sleep(80);const afterCancel=await countState(key);must(afterCancel===before,`${button} Cancel changed ${key} (${before} -> ${afterCancel})`);
}

try{
 const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
 must(res&&res.status()<400,`Admin returned ${res?.status()}`);
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V48_ACTION_CONTRACT__===true&&window.NSV421CommunicationAdmin?.ready===true,null,{timeout:15000});
 await page.waitForSelector('.ap-app',{state:'visible'});
 await sleep(300);
 const flags=await page.evaluate(()=>({v21:window.__NSV21_ADMIN_BOUND,v38:window.__NS_V421_ADMIN_V38__,communication:window.__NS_V421_ADMIN_COMMUNICATION__,communicationApi:!!window.NSV421CommunicationAdmin,communicationReady:window.NSV421CommunicationAdmin?.ready===true,communicationOwner:document.querySelector('#apCommunicationNew')?.dataset?.nsCommunicationOwner||null,v45:window.__NS_V421_ADMIN_V45__,v47:window.__NS_V421_MANUAL_ACCEPTANCE__,v48:window.__NS_V421_ADMIN_V48_ACTION_CONTRACT__,delivery:!!window.NSV421DeliveryServicesAdmin,review:!!window.NSV421ReviewQueue}));
 must(flags.communication===true&&flags.communicationApi&&flags.communicationReady&&flags.communicationOwner==='1',`Communication runtime did not become authoritative: ${JSON.stringify(flags)}`);
 must(flags.v45===true,`Operability runtime did not load: ${JSON.stringify(flags)}`);
 must(flags.delivery,`Delivery Services runtime did not load: ${JSON.stringify(flags)}`);
 must(flags.review,`Review Queue runtime did not load: ${JSON.stringify(flags)}`);
 original=await page.evaluate(()=>window.NSV421Store.load());

 // Global actions must do something observable.
 await clickCenter('#apNotifications');
 await page.waitForSelector('#apModal.is-open');
 must(/Notifications/i.test(await page.locator('#apModalTitle').innerText()),'Notifications did not open its queue');
 await closeModal();
 await clickCenter('#apQuickCreate');
 await page.waitForSelector('#apModal.is-open');
 must(/Quick create/i.test(await page.locator('#apModalTitle').innerText()),'Quick create did not open workflow choices');
 await closeModal();

 // Export is a real download contract, not a toast-only no-op.
 await go('overview');
 const downloadPromise=page.waitForEvent('download',{timeout:5000});
 await clickCenter('#apExportSnapshot');
 const dl=await downloadPromise;
 must(/nariyal-sutra-config-.*\.json/.test(dl.suggestedFilename()),`Unexpected snapshot filename ${dl.suggestedFilename()}`);

 // History buttons open the relevant audit/history surface.
 await go('products');
 await clickCenter('#apProductAudit');
 await page.waitForSelector('#apModal.is-open');
 must(/Price history/i.test(await page.locator('#apModalTitle').innerText()),'Price history has no modal contract');
 await closeModal();
 await go('inventory');
 await clickCenter('#apInventoryAudit');
 await page.waitForSelector('#apModal.is-open');
 must(/Stock history/i.test(await page.locator('#apModalTitle').innerText()),'Stock history has no modal contract');
 await closeModal();

 // Add/create actions: click must open a real form and Cancel must create nothing.
 await assertCreateOpensForm({view:'products',button:'#apProductAdd',form:'#v45ProductAdd',key:'products'});
 await assertCreateOpensForm({view:'inventory',button:'#apInventoryAdjust',form:'#v45StockAdd',key:'inventory'});
 await assertCreateOpensForm({view:'warehouses',button:'#apAddWarehouse',form:'#v48WarehouseForm',key:'warehouses',cancel:'[data-v48-cancel]'});
 await assertCreateOpensForm({view:'delivery-services',button:'#apAddDeliveryService',form:'#apDeliveryServiceForm',key:'deliveryServices',cancel:'[data-ds-cancel]'});
 await assertCreateOpensForm({view:'segments',button:'#apSegmentAdd',form:'#v48SegmentForm',key:'segments',cancel:'[data-v48-cancel]'});
 await assertCreateOpensForm({view:'communication',button:'#apCommunicationNew',form:'#v38Form',key:'communications',cancel:'[data-comm-cancel]'});
 await assertCreateOpensForm({view:'content',button:'#apNewContent',form:'#v48ContentForm',key:'content',cancel:'[data-v48-cancel]'});
 await assertCreateOpensForm({view:'stories',button:'#apAddStory',form:'#v48StoryForm',key:'stories',cancel:'[data-v48-cancel]'});

 // Order filtering and export must be deterministic.
 await go('orders');
 await page.locator('#apOrderSearch').fill('__NO_MATCH_ACTION_CONTRACT__');
 await page.locator('#apOrderSearch').dispatchEvent('input');
 await sleep(80);
 const visibleRows=await page.locator('#apOrdersBody tr:visible').count();
 must(visibleRows===0,`Order search did not filter rows; ${visibleRows} remain visible`);
 await page.locator('#apOrderSearch').fill('');await page.locator('#apOrderSearch').dispatchEvent('input');
 const orderDownload=page.waitForEvent('download',{timeout:5000});await clickCenter('#apOrdersExport');must(/orders-filtered-.*\.csv/.test((await orderDownload).suggestedFilename()),'Order export did not create filtered CSV');

 // Review Queue is dynamically inserted and must activate reliably.
 const reviews=page.locator('#apNav button[data-view="reviews"]');
 must(await reviews.count()===1,'Reviews navigation was not installed');
 await reviews.click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="reviews"]')?.classList.contains('is-active'),null,{timeout:5000});
 must(await activeView()==='reviews','Reviews nav click did not activate Review Queue');

 // Delivery Services edit is an actual editor, not a dead row button.
 await go('delivery-services');
 const edit=page.locator('[data-ds-edit]').first();
 if(await edit.count()){must(await edit.isEnabled(),'Owner delivery-service edit unexpectedly disabled');await edit.click();await page.waitForSelector('#apDeliveryServiceForm');await page.locator('[data-ds-cancel]').click();}

 // Representative role visibility / gating.
 await page.locator('#apRole').selectOption('Support');await sleep(100);
 must(await page.locator('#apNav button[data-view="communication"]').isVisible(),'Support lost intended Communication access');
 must(!(await page.locator('#apNav button[data-view="products"]').isVisible()),'Support can see Products unexpectedly');
 await page.locator('#apRole').selectOption('Operations');await sleep(100);await go('delivery-services');
 must(await page.locator('#apAddDeliveryService').isDisabled(),'Operations delivery-service Add should be explicitly read-only');
 await page.locator('#apRole').selectOption('Owner');await sleep(100);

 must(externalMutations.length===0,`Local Admin action sweep attempted external business mutation(s): ${JSON.stringify(externalMutations)}`);
 must(pageErrors.length===0,`Admin action sweep page errors: ${JSON.stringify(pageErrors)}`);
 console.log('ADMIN ACTION CONTRACT QA: PASS',JSON.stringify({staticButtons:buttonTags.length,flags,externalMutations:externalMutations.length,nonBusinessExternalPosts:nonBusinessExternalPosts.length}));
} finally {
 if(original){try{await page.evaluate(s=>window.NSV421Store?.save?.(s),original);}catch{}}
 await context.close();await browser.close();server.kill();
}
