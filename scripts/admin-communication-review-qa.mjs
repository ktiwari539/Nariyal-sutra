import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE='http://127.0.0.1:4203';
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const communicationJs=fs.readFileSync('assets/js/admin-communication.js','utf8');
const reviewJs=fs.readFileSync('assets/js/admin-v44-review-queue.js','utf8');
const legacyReviewContract=fs.readFileSync('assets/js/admin-v38-reviews-contract.js','utf8');
const emailFn=fs.readFileSync('netlify/functions/admin-communication-send.js','utf8');
must(reviewJs.includes("type:'Communication'")&&reviewJs.includes('submitCommunication'),'Authoritative Review Queue does not own Communication review items');
must(!communicationJs.includes('data-comm-approve'),'Communication queue still exposes a direct approval bypass');
must(communicationJs.includes('data-comm-open-review'),'Communication queue has no path into the authoritative Review Queue');
must(!legacyReviewContract.includes('v38CommunicationReviews')&&!legacyReviewContract.includes('Communication review queue'),'Legacy V38 still owns a duplicate Communication review surface');
must(emailFn.includes('verifyFirebaseToken')&&emailFn.includes("['Owner','Admin','Manager']")&&emailFn.includes('EMAILJS_PRIVATE_KEY')&&emailFn.includes('authorization'),'Admin communication email endpoint is not authenticated/provider-gated');

const server=spawn('python3',['-m','http.server','4203','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(900);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
const pageErrors=[];
const externalMutations=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('request',r=>{
  const u=r.url(),m=r.method();
  if(u.startsWith(BASE))return;
  if(/\/\.netlify\/functions\/admin-communication-send/i.test(u)||/api\.emailjs\.com\/api\/v1\.0\/email\/send/i.test(u)||(/firestore\.googleapis\.com/i.test(u)&&/(documents:commit|documents:batchWrite|Firestore\/Write\/channel)/i.test(u)))externalMutations.push(`${m} ${u}`);
});
let original=null;

async function go(view){
  const nav=page.locator(`#apNav button[data-view="${view}"]`);
  must(await nav.count()===1,`Missing Admin nav ${view}`);
  await nav.click();
  await page.waitForFunction(v=>document.querySelector(`.ap-view[data-view="${v}"]`)?.classList.contains('is-active'),view,{timeout:5000});
}
async function comm(id){return page.evaluate(cid=>(window.NSV421Store.load().communications||[]).find(x=>x.id===cid)||null,id);}
async function countComms(){return page.evaluate(()=>(window.NSV421Store.load().communications||[]).length);}
async function waitStatus(id,status){await page.waitForFunction(([cid,st])=>(window.NSV421Store.load().communications||[]).find(x=>x.id===cid)?.status===st,[id,status],{timeout:5000});}

try{
  const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
  must(res&&res.status()<400,`Admin returned ${res?.status()}`);
  await page.waitForFunction(()=>window.NSV421CommunicationAdmin?.ready===true&&!!window.NSV421ReviewQueue,null,{timeout:15000});
  await page.waitForSelector('.ap-app',{state:'visible'});
  original=await page.evaluate(()=>JSON.parse(JSON.stringify(window.NSV421Store.load())));
  if(await page.locator('#apRole').count())await page.locator('#apRole').selectOption('Owner');

  const before=await countComms();
  await go('communication');
  await page.locator('#apCommunicationNew').click();
  await page.waitForSelector('#v38Form',{state:'visible'});
  for(const name of ['purpose','channel','recipient','destination','orderId','owner','scheduledAt','subject','message'])must(await page.locator(`#v38Form [name="${name}"]`).count()===1,`Communication composer missing ${name}`);
  await page.locator('#v38Form [name="purpose"]').selectOption({label:'Customer support'});
  await page.locator('#v38Form [name="channel"]').selectOption('Email');
  await page.locator('#v38Form [name="recipient"]').fill('QA Review Customer');
  await page.locator('#v38Form [name="destination"]').fill('qa-review@example.com');
  await page.locator('#v38Form [name="orderId"]').fill('QA-ORDER-REVIEW');
  await page.locator('#v38Form [name="owner"]').fill('QA Owner');
  await page.locator('#v38Form [name="scheduledAt"]').fill('2026-09-16T10:00');
  await page.locator('#v38Form [name="subject"]').fill('QA review subject');
  await page.locator('#v38Form [name="message"]').fill('Please review this communication before any external send.');
  must(await countComms()===before,'Composer created placeholder data before Save draft');
  await page.locator('#v38Form button[type="submit"]').click();
  await page.waitForFunction(n=>(window.NSV421Store.load().communications||[]).length===n,before+1,{timeout:5000});
  const id=await page.evaluate(()=>(window.NSV421Store.load().communications||[]).find(x=>x.recipient==='QA Review Customer')?.id||'');
  must(id,'Saved communication was not found');
  let c=await comm(id);must(c.status==='Draft','New communication is not Draft');
  must(c.orderId==='QA-ORDER-REVIEW'&&c.owner==='QA Owner'&&c.scheduledAt,'Composer fields did not persist');

  await page.locator(`[data-comm-review="${id}"]`).click();
  await waitStatus(id,'Needs review');
  c=await comm(id);must(c.reviewSubmittedAt&&c.reviewSubmittedBy,'Review submission metadata missing');
  await go('reviews');
  const reviewRow=page.locator(`[data-review-type="Communication"][data-review-id="${id}"]`);
  await reviewRow.waitFor({state:'visible',timeout:5000});
  must(await page.locator('#v38CommunicationReviews').count()===0,'Duplicate legacy Communication review panel still exists');
  must(await reviewRow.locator('[data-review-action="approve"]').count()===1,'Authoritative Review Queue has no approve action for Communication');

  page.once('dialog',d=>d.accept('Please clarify the timing and wording.'));
  await reviewRow.locator('[data-review-action="changes"]').click();
  await waitStatus(id,'Needs changes');
  c=await comm(id);must(c.reviewOutcome==='Needs changes'&&/clarify/.test(c.reviewNote||''),'Request-changes state/note did not persist');
  must(await page.locator(`[data-review-type="Communication"][data-review-id="${id}"]`).count()===0,'Needs changes item remained in pending Review Queue');

  await go('communication');
  const row=page.locator(`[data-comm-id="${id}"]`);await row.waitFor({state:'visible'});
  must(await row.locator(`[data-comm-open="${id}"]`).innerText()==='Edit','Needs changes communication is not editable');
  await row.locator(`[data-comm-open="${id}"]`).click();
  await page.waitForSelector('#v38Form');
  await page.locator('#v38Form [name="message"]').fill('Updated wording after review feedback.');
  await page.locator('#v38Form button[type="submit"]').click();
  await waitStatus(id,'Draft');
  await page.locator(`[data-comm-review="${id}"]`).click();
  await waitStatus(id,'Needs review');

  await go('reviews');
  const approveRow=page.locator(`[data-review-type="Communication"][data-review-id="${id}"]`);await approveRow.waitFor({state:'visible'});
  await approveRow.locator('[data-review-action="approve"]').click();
  await waitStatus(id,'Approved');
  c=await comm(id);must(c.approvedAt&&c.approvedBy,'Approval metadata missing');

  await go('communication');
  must(await page.locator('[data-comm-approve]').count()===0,'Communication has a direct approve bypass outside Review Queue');
  const send=page.locator(`[data-comm-send="${id}"]`);await send.waitFor({state:'visible'});await send.click();
  await page.waitForFunction(()=>/Confirm external communication/i.test(document.querySelector('#apModalTitle')?.textContent||''),null,{timeout:3000});
  must(/qa-review@example\.com/.test(await page.locator('#apModalBody').innerText()),'Send confirmation does not show exact destination');
  await page.locator('[data-comm-send-confirm]').click();
  await sleep(120);
  c=await comm(id);must(c.status==='Approved'&&!c.sentAt,'Local preview incorrectly marked email Sent');
  must(externalMutations.length===0,`Local Communication acceptance attempted external send/write: ${JSON.stringify(externalMutations)}`);

  await page.locator(`[data-comm-archive="${id}"]`).click();
  await page.waitForFunction(cid=>!!(window.NSV421Store.load().communications||[]).find(x=>x.id===cid)?.archivedAt,id,{timeout:3000});
  await page.locator('#v38Archived').check();
  const archived=page.locator(`[data-comm-id="${id}"]`);await archived.waitFor({state:'visible'});await archived.locator(`[data-comm-archive="${id}"]`).click();
  await page.waitForFunction(cid=>!(window.NSV421Store.load().communications||[]).find(x=>x.id===cid)?.archivedAt,id,{timeout:3000});

  await page.locator(`[data-comm-dup="${id}"]`).click();
  await page.waitForFunction(n=>(window.NSV421Store.load().communications||[]).length===n,before+2,{timeout:3000});
  const dupId=await page.evaluate(cid=>(window.NSV421Store.load().communications||[]).find(x=>x.id!==cid&&x.recipient==='QA Review Customer'&&x.status==='Draft')?.id||'',id);
  must(dupId,'Duplicate Draft was not created');
  page.once('dialog',d=>d.accept());
  await page.locator(`[data-comm-delete="${dupId}"]`).click();
  await page.waitForFunction(cid=>!(window.NSV421Store.load().communications||[]).some(x=>x.id===cid),dupId,{timeout:3000});

  await page.evaluate(cid=>{const s=window.NSV421Store.load(),x=(s.communications||[]).find(c=>c.id===cid);x.status='Sent';x.sentAt=new Date().toISOString();window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},id);
  await sleep(100);
  await go('communication');
  must(await page.locator(`[data-comm-id="${id}"] [data-comm-delete]`).count()===0,'Sent communication exposes hard delete');
  must(pageErrors.length===0,`Communication/Review Queue page errors: ${JSON.stringify(pageErrors)}`);
  console.log('COMMUNICATION + REVIEW QUEUE ACCEPTANCE QA: PASS',JSON.stringify({id,externalMutations:externalMutations.length}));
} finally {
  if(original){try{await page.evaluate(s=>{window.NSV421Store?.save?.(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},original);}catch{}}
  await context.close();await browser.close();server.kill();
}
