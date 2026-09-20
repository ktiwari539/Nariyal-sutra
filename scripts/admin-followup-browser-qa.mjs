import {chromium} from 'playwright';
import {spawn} from 'node:child_process';

const BASE='http://127.0.0.1:4212';
const must=(c,m)=>{if(!c)throw new Error(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn('python3',['-m','http.server','4212','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(800);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
let original=null;

async function selectRole(name){await page.locator('#apRole').selectOption(name);await sleep(80);}
async function go(){await page.locator('#apNav button[data-view="followups"]').click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="followups"]')?.classList.contains('is-active'));}

try{
 const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
 must(res&&res.status()<400,`Admin returned ${res?.status()}`);
 await page.waitForFunction(()=>window.NSV421Followups?.ready===true&&window.NSV421CommunicationAdmin?.ready===true,null,{timeout:15000});
 original=await page.evaluate(()=>JSON.parse(JSON.stringify(window.NSV421Store.load())));
 await selectRole('Support');await go();
 const supportAccess=await page.locator('#apFollowupAccess').textContent();
 must(supportAccess==='Create and update',`Support did not receive Follow-up write access (${JSON.stringify(supportAccess)})`);
 const before=await page.evaluate(()=>(window.NSV421Store.load().followups||[]).length);
 await page.locator('#apFollowupAdd').click();await page.waitForSelector('#nsFollowupForm');
 for(const name of ['customerName','customerKey','orderId','assignee','reason','dueAt','priority'])must(await page.locator(`#nsFollowupForm [name="${name}"]`).count()===1,`Follow-up form missing ${name}`);
 await page.locator('#nsFollowupForm [name="customerName"]').fill('QA Follow-up Customer');
 await page.locator('#nsFollowupForm [name="customerKey"]').fill('QA-CUSTOMER-1');
 await page.locator('#nsFollowupForm [name="orderId"]').fill('QA-ORDER-FU-1');
 await page.locator('#nsFollowupForm [name="assignee"]').fill('Support');
 await page.locator('#nsFollowupForm [name="reason"]').fill('Confirm recurring delivery requirements');
 await page.locator('#nsFollowupForm [name="dueAt"]').fill('2026-09-24T11:30');
 await page.locator('#nsFollowupForm [name="priority"]').selectOption('high');
 await page.locator('#nsFollowupForm button[type="submit"]').click();
 await page.waitForFunction(n=>(window.NSV421Store.load().followups||[]).length===n,before+1,{timeout:5000});
 const id=await page.evaluate(()=>(window.NSV421Store.load().followups||[]).find(x=>x.customerName==='QA Follow-up Customer')?.id||'');
 must(id,'Saved Follow-up record not found');
 const created=await page.evaluate(cid=>{const s=window.NSV421Store.load(),x=s.followups.find(v=>v.id===cid),events=s.followupEvents.filter(v=>v.followupId===cid);return {x,events};},id);
 must(created.x.customerKey==='QA-CUSTOMER-1'&&created.x.orderId==='QA-ORDER-FU-1'&&created.x.status==='open','Customer/order/status linkage did not persist');
 must(created.events.some(x=>x.action==='created'),'Create history event was not appended');

 await page.locator('#apFollowupSearch').fill('QA-ORDER-FU-1');
 must(await page.locator(`tr[data-followup-id="${id}"]`).count()===1,'Search did not find linked order Follow-up');
 await page.locator(`tr[data-followup-id="${id}"] [data-fu-status="in_progress"]`).click();
 await page.waitForFunction(cid=>(window.NSV421Store.load().followups||[]).find(x=>x.id===cid)?.status==='in_progress',id);
 await page.locator(`tr[data-followup-id="${id}"] [data-fu-history]`).click();
 must(/Status changed from Open to In Progress/i.test(await page.locator('#apModalBody').innerText()),'Status history did not render');
 await page.locator('#apModalClose').click();

 await page.locator(`tr[data-followup-id="${id}"] [data-fu-communication]`).click();await page.waitForSelector('#v38Form');
 must(await page.locator('#v38Form [name="recipient"]').inputValue()==='QA Follow-up Customer','Communication draft did not inherit customer');
 must(await page.locator('#v38Form [name="orderId"]').inputValue()==='QA-ORDER-FU-1','Communication draft did not inherit order');
 must(/Confirm recurring delivery requirements/.test(await page.locator('#v38Form [name="message"]').inputValue()),'Communication draft did not inherit context');
 must((await page.evaluate(()=>(window.NSV421Store.load().communications||[]).filter(x=>x.recipient==='QA Follow-up Customer').length))===0,'Draft was persisted before explicit Save');
 await page.locator('#apModalClose').click();

 await selectRole('Operations');
 must(await page.locator('#apFollowupAccess').textContent()==='Read only','Operations did not receive read-only Follow-up posture');
 must(await page.locator('#apFollowupAdd').isDisabled(),'Operations could still create a Follow-up');
 must(await page.locator(`tr[data-followup-id="${id}"] [data-fu-edit]`).count()===0,'Operations could still edit a Follow-up');
 must(await page.locator(`tr[data-followup-id="${id}"] [data-fu-history]`).count()===1,'Operations could not read Follow-up history');

 await page.setViewportSize({width:390,height:844});
 must(await page.locator('#apFollowupRows').isVisible(),'Follow-up queue is not visible on mobile');
 const overflow=await page.locator('.ap-view[data-view="followups"] .ap-table-wrap').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,overflow:getComputedStyle(el).overflowX}));
 must(overflow.scroll>overflow.client&&overflow.overflow!=='visible','Mobile Follow-up table has no safe horizontal overflow');
 must(errors.length===0,`Follow-up browser page errors: ${JSON.stringify(errors)}`);
 console.log('ADMIN FOLLOW-UP BROWSER QA: PASS',JSON.stringify({id,events:created.events.length,mobileOverflow:overflow}));
} finally {
 if(original){try{await page.evaluate(s=>{window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},original);}catch{}}
 await context.close();await browser.close();server.kill();
}
