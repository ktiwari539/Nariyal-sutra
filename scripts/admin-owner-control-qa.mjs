import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4203';
const OUT=path.join(process.cwd(),'qa-artifacts','admin-owner-control');
const ORDER_OPS=path.join(process.cwd(),'assets','js','admin-v44-order-operations.js');
const PROD_BRIDGE=path.join(process.cwd(),'assets','js','v421-production-bridge.js');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};
must(fs.existsSync(ORDER_OPS),'Order operations module missing');
const contract=fs.readFileSync(ORDER_OPS,'utf8');
for(const token of ["runTransaction","status:'cancelled'","publicTracking","customerOrders","CANCEL_ROLES","Paid cancellation does not issue a refund","deleteTestOrder","tx.delete(orderRef)","data-ns-order-delete-test","Only the Owner can permanently delete test orders","exact order ID"]){must(contract.includes(token),`Order operations contract missing: ${token}`);}
const bridgeContract=fs.readFileSync(PROD_BRIDGE,'utf8');
for(const demoId of ['NS-1048','NS-1047','NS-1046','NS-1042'])must(bridgeContract.includes(demoId),`Production bridge demo suppression missing ${demoId}`);
const server=spawn('python3',['-m','http.server','4203','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

async function installQaOrder(page){
 await page.evaluate(()=>{
  const body=document.querySelector('#apOrdersBody');
  if(!body)return;
  body.innerHTML='<tr data-order-qa="1"><td class="mono">QA-ORDER-001</td><td>QA Customer</td><td>Tender Coconut</td><td>12</td><td><span class="ap-status green">Paid</span></td><td>Preparing</td><td>₹660</td></tr>';
  body.querySelector('[data-order-qa]')?.addEventListener('click',()=>{
   const detail=document.querySelector('#apOrderDetail');
   if(detail)detail.innerHTML='<h3>QA-ORDER-001</h3><p>QA Customer</p><div class="ap-divider"></div><div class="ap-detail-grid"><div class="ap-detail"><label>Payment</label><span>Paid</span></div><div class="ap-detail"><label>Delivery</label><span>Preparing</span></div></div>';
  });
 });
}

async function checkOrderControls(page,label){
 await page.evaluate(()=>{window.NSV421ProductionBridge={isProduction:true};});
 await page.addScriptTag({path:ORDER_OPS});
 const orderNavActivated=await page.evaluate(()=>{const b=document.querySelector('#apNav button[data-view="orders"]');if(!b)return false;b.click();return true;});
 must(orderNavActivated,`${label}: Orders nav button missing`);
 await page.waitForFunction(()=>document.querySelector('#apOrdersBody')?.closest('.ap-view')?.classList.contains('is-active'),null,{timeout:5000});
 await page.waitForTimeout(120);
 await installQaOrder(page);
 const first=page.locator('#apOrdersBody tr[data-order-qa]').first();must(await first.count()===1,`${label}: deterministic QA order row missing`);await first.click();await page.waitForTimeout(100);
 await page.evaluate(()=>window.NSV421OrderOperations?.refresh?.());await page.waitForTimeout(40);
 const orderId=(await page.locator('#apOrderDetail h3').textContent())?.trim();must(orderId==='QA-ORDER-001',`${label}: selected QA order id missing`);
 must(await page.locator(`[data-ns-order-cancel="${orderId}"]`).count()===1,`${label}: Owner cancel control missing`);
 must(await page.locator(`[data-ns-order-delete-test="${orderId}"]`).count()===1,`${label}: Owner delete-test control missing`);
 const cancelConfirm=await page.evaluate(async id=>{let seen='';window.prompt=()=> 'QA cancellation';window.confirm=m=>{seen=String(m);return false;};document.querySelector(`[data-ns-order-cancel="${id}"]`)?.click();await new Promise(r=>setTimeout(r,20));return seen;},orderId);
 must(cancelConfirm.includes(orderId),`${label}: cancel confirmation omits order id`);must(/preserves the order history/i.test(cancelConfirm),`${label}: cancel confirmation omits history semantics`);must(/does NOT issue a refund/i.test(cancelConfirm),`${label}: paid cancellation refund warning missing`);
 const deletePrompt=await page.evaluate(async id=>{let seen='';window.prompt=m=>{seen=String(m);return null;};document.querySelector(`[data-ns-order-delete-test="${id}"]`)?.click();await new Promise(r=>setTimeout(r,20));return seen;},orderId);
 must(deletePrompt.includes(orderId),`${label}: delete confirmation omits exact order id`);must(/exact order ID/i.test(deletePrompt),`${label}: delete confirmation does not require exact id`);
 await page.selectOption('#apRole','Operations');await page.waitForTimeout(80);await page.evaluate(()=>window.NSV421OrderOperations?.refresh?.());
 must(await page.locator(`[data-ns-order-cancel="${orderId}"]`).count()===1,`${label}: Operations cancel control missing`);must(await page.locator('[data-ns-order-delete-test]').count()===0,`${label}: Operations must not see hard delete`);
 await page.selectOption('#apRole','Support');await page.waitForTimeout(80);await page.evaluate(()=>window.NSV421OrderOperations?.refresh?.());
 must(await page.locator('[data-ns-order-cancel]').count()===0,`${label}: Support must not see cancel`);must(await page.locator('[data-ns-order-delete-test]').count()===0,`${label}: Support must not see hard delete`);
 await page.selectOption('#apRole','Owner');await page.waitForTimeout(80);await page.evaluate(()=>window.NSV421OrderOperations?.refresh?.());
 must(await page.locator(`[data-ns-order-delete-test="${orderId}"]`).count()===1,`${label}: Owner delete-test control did not return`);
}

async function openAdmin(width,height,label){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width<900?2:1,hasTouch:width<900,serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const r=await page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});must(r&&r.status()<400,`${label}: admin status ${r?.status()}`);
 await page.waitForFunction(()=>window.__NS_V421_ADMIN_V40__===true&&document.querySelector('#apV40OwnerStatus'),null,{timeout:12000});
 await page.waitForTimeout(300);
 const base=await page.evaluate(()=>({role:document.querySelector('#apRole')?.value,sw:document.documentElement.scrollWidth,iw:innerWidth,views:[...document.querySelectorAll('.ap-view.is-active')].length,owner:document.querySelector('#apV40OwnerStatus')?.innerText||''}));
 must(base.role==='Owner',`${label}: expected Owner preview role, got ${base.role}`);must(base.views===1,`${label}: active views=${base.views}`);must(base.sw<=base.iw+8,`${label}: horizontal overflow ${base.sw}>${base.iw}`);must(/Owner control/i.test(base.owner),`${label}: Owner control status missing`);
 await checkOrderControls(page,label);
 if(width<900){await page.locator('#apMenuBtn').click();await page.waitForTimeout(80);}
 await page.locator('#apNav button[data-view="pages"]').click();await page.waitForTimeout(200);
 must(await page.locator('#apV38ImageTargets[data-v40-owned="1"]').count()===1,`${label}: V40 storefront placement map missing`);
 const change=page.locator('[data-v40-target]').first();must(await change.isVisible(),`${label}: Change image not visible`);await change.click();await page.waitForTimeout(100);
 must(await page.locator('#apModal.is-open .ap-v40-picker').count()===1,`${label}: Change image did not open approved picker`);
 must(await page.locator('#apV40Impact.is-show').count()===1,`${label}: click impact explanation not shown`);
 await page.locator('#apModalClose').click();
 if(width<900){await page.locator('#apMenuBtn').click();await page.waitForTimeout(80);}
 await page.locator('#apNav button[data-view="ambassadors"]').click();await page.waitForTimeout(200);
 must(await page.locator('#apV40Ambassador').count()===1,`${label}: Ambassador controller missing`);
 must(await page.locator('[data-v40-amb-save]').isVisible(),`${label}: Ambassador save control missing`);
 const rows=page.locator('[data-v40-amb-row]');must(await rows.count()>=1,`${label}: Ambassador selected rows missing`);
 const firstId=await rows.first().getAttribute('data-v40-amb-row');
 const mobileToggle=page.locator(`[data-v40-amb-device="mobile"][data-id="${firstId}"]`);must(await mobileToggle.count()===1,`${label}: per-device Ambassador visibility missing`);
 await page.screenshot({path:path.join(OUT,`${label}-ambassadors.png`),fullPage:true});
 must(!errors.length,`${label}: page errors ${errors.join(' | ')}`);
 await context.close();
}

try{
 await openAdmin(1440,900,'desktop');
 await openAdmin(820,1100,'tablet');
 await openAdmin(390,844,'mobile');
 console.log('ADMIN OWNER CONTROL QA: PASS');
} finally {await browser.close();server.kill();}
