import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE='http://127.0.0.1:4212';
const must=(c,m)=>{if(!c)throw new Error(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=p=>fs.readFileSync(p,'utf8');

// Static contract: the UI must match the hardened Firestore lifecycle, projections and roles.
const rules=read('firestore.rules');
const ops=read('assets/js/admin-v44-order-operations.js');
const delivery=read('assets/js/admin-v50-delivery-contract.js');
const legacy=read('assets/js/admin-v47-manual-acceptance.js');
for(const s of ['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered','cancelled'])must(rules.includes(`'${s}'`),`Firestore lifecycle missing ${s}`);
for(const s of ['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered'])must(ops.includes(`'${s}'`),`Order Operations flow missing ${s}`);
for(const role of ['Owner','Admin','Manager','Operations'])must(ops.includes(`'${role}'`),`Order Operations manage role missing ${role}`);
for(const projection of ["'orders'","'publicTracking'","'customerOrders'","'deliveryAdmin'"])must(ops.includes(projection),`Order transition projection missing ${projection}`);
must(/runTransaction/.test(ops),'Order lifecycle transition is not transaction-backed');
must(/statusHistory/.test(ops)&&/actorUid/.test(ops)&&/actorRole/.test(ops),'Order lifecycle audit/history is incomplete');
must(/cancellationReason/.test(ops)&&/cancelledAt/.test(ops),'Cancellation reason/timestamp contract missing');
must(/validTransition/.test(delivery)&&/ready_for_dispatch/.test(delivery),'Delivery Hub is not aligned to lifecycle state machine');
must(/delegatesToLifecycleV2:true/.test(legacy),'Legacy decision writer does not delegate to lifecycle V2');
for(const obsolete of ['acceptedAt','acceptedBy','rejectedAt','rejectedBy'])must(!legacy.includes(obsolete),`Legacy invalid field still written: ${obsolete}`);

const server=spawn('python3',['-m','http.server','4212','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(850);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];const mutations=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('request',r=>{const u=r.url(),m=r.method();if(u.startsWith(BASE)||['GET','HEAD','OPTIONS'].includes(m))return;let benign=false;try{const x=new URL(u);benign=x.hostname.endsWith('googleapis.com')||x.hostname.endsWith('google-analytics.com');}catch{}if(!benign)mutations.push(`${m} ${u}`);});
let original=null;
const ids={owner:'QA-LIFE-OWNER',cancel:'QA-LIFE-CANCEL',ops:'QA-LIFE-OPS',support:'QA-LIFE-SUPPORT'};
try{
 const r=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});must(r&&r.status()<400,`Admin returned ${r?.status()}`);
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.NSV421OrderOperations?.lifecycleV2===true,null,{timeout:15000});
 original=await page.evaluate(()=>window.NSV421Store.load());
 await page.evaluate(ids=>{
   const S=window.NSV421Store,s=S.load();
   const base=id=>({id,orderId:id,customer:'QA Lifecycle',product:'Fresh Tender Coconut',qty:2,quantity:2,payment:'COD',delivery:'pending',status:'pending',total:110,trackingToken:'a'.repeat(48),createdAt:new Date().toISOString()});
   s.orders=[base(ids.owner),base(ids.cancel),base(ids.ops),base(ids.support),...(s.orders||[]).filter(o=>![ids.owner,ids.cancel,ids.ops,ids.support].includes(String(o.id||o.orderId)))];
   S.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));
 },ids);
 await sleep(150);

 // Owner can move through every legal state exactly one stage at a time.
 await page.evaluate(()=>{const e=document.querySelector('#apRole');e.value='Owner';e.dispatchEvent(new Event('change',{bubbles:true}));});
 const ownerResult=await page.evaluate(async id=>{
   const op=window.NSV421OrderOperations,out=[];
   for(const next of ['confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered'])out.push(await op.transition(id,next,{source:'qa'}));
   let backwardBlocked=false;try{await op.transition(id,'preparing',{source:'qa-invalid'});}catch{backwardBlocked=true;}
   const o=window.NSV421Store.load().orders.find(x=>x.id===id);return{out,backwardBlocked,status:o.status};
 },ids.owner);
 must(ownerResult.out.length===5&&ownerResult.status==='delivered','Owner lifecycle did not reach Delivered');
 must(ownerResult.backwardBlocked,'Delivered → Preparing was not blocked');

 // Cancellation is terminal and retains a reason.
 const cancelResult=await page.evaluate(async id=>{
   const op=window.NSV421OrderOperations;await op.cancelOrder(id,'QA customer cancellation');let terminal=false;try{await op.transition(id,'confirmed',{source:'qa-invalid'});}catch{terminal=true;}const o=window.NSV421Store.load().orders.find(x=>x.id===id);return{status:o.status,reason:o.cancellationReason,terminal};
 },ids.cancel);
 must(cancelResult.status==='cancelled','Cancellation did not set Cancelled');must(cancelResult.reason==='QA customer cancellation','Cancellation reason was not retained');must(cancelResult.terminal,'Cancelled order was not terminal');

 // Operations is an authorised fulfilment role.
 await page.evaluate(()=>{const e=document.querySelector('#apRole');e.value='Operations';e.dispatchEvent(new Event('change',{bubbles:true}));});
 const opsResult=await page.evaluate(async id=>{const op=window.NSV421OrderOperations;await op.transition(id,'confirmed',{source:'qa-ops'});return window.NSV421Store.load().orders.find(x=>x.id===id)?.status;},ids.ops);
 must(opsResult==='confirmed','Operations could not accept a pending order');

 // Support must be read-only. Verify both API contract and selected-order UI.
 await page.evaluate(()=>{const e=document.querySelector('#apRole');e.value='Support';e.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#apNav button[data-view="orders"]')?.click();});
 await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="orders"]')?.classList.contains('is-active'));
 await page.waitForSelector('#apOrdersBody tr',{timeout:5000});
 const supportRow=page.locator('#apOrdersBody tr').filter({hasText:ids.support}).first();must(await supportRow.count()===1,'Support QA order row missing');await supportRow.click();await sleep(120);
 await page.waitForSelector('#nsOrderOperations',{timeout:5000});
 must(await page.locator('#nsOrderOperations .ns-order-readonly').count()===1,'Support order detail is not read-only');
 must(await page.locator('#nsOrderOperations [data-ns-order-next]').count()===0,'Support can see fulfilment mutation action');
 must(await page.locator('#nsOrderOperations [data-ns-order-cancel]').count()===0,'Support can see cancellation mutation action');
 const apiSupport=await page.evaluate(()=>window.NSV421OrderOperations.canManage);must(apiSupport===false,'Support API reports manage permission');

 // Owner UI must expose the next action and lifecycle stepper.
 await page.evaluate(()=>{const e=document.querySelector('#apRole');e.value='Owner';e.dispatchEvent(new Event('change',{bubbles:true}));});
 await supportRow.click();await sleep(100);
 must(await page.locator('#nsOrderOperations .ns-order-step').count()>=6,'Order lifecycle stepper missing');
 must(await page.locator('#nsOrderOperations [data-ns-order-next="confirmed"]').count()===1,'Pending Owner order does not expose Accept order');
 must(await page.locator('#nsOrderOperations [data-ns-order-cancel]').count()===1,'Pending Owner order does not expose Cancel order');

 must(errors.length===0,`Order lifecycle page errors: ${errors.join(' | ')}`);
 must(mutations.length===0,`Local order lifecycle initiated external mutation(s): ${mutations.join(' | ')}`);
 console.log('ORDER LIFECYCLE OPERATIONS QA: PASS');
} finally {
 if(original){try{await page.evaluate(s=>{window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},original);}catch{}}
 await context.close().catch(()=>{});await browser.close().catch(()=>{});server.kill('SIGTERM');
}
