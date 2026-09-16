import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE='http://127.0.0.1:4207';
const must=(c,m)=>{if(!c)throw new Error(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn('python3',['-m','http.server','4207','--bind','127.0.0.1'],{stdio:'ignore'});
await sleep(800);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',acceptDownloads:true});
const page=await context.newPage();
const errors=[];const mutations=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('request',r=>{const u=r.url(),m=r.method();if(u.startsWith(BASE)||['GET','HEAD','OPTIONS'].includes(m))return;let benign=false;try{const x=new URL(u);benign=(x.hostname==='firestore.googleapis.com'&&/Firestore\/Listen\/channel$/.test(x.pathname))||x.hostname==='firebaseremoteconfig.googleapis.com'||x.hostname==='firebaseinstallations.googleapis.com'||x.hostname.endsWith('google-analytics.com');}catch{}if(!benign)mutations.push(`${m} ${u}`);});
let original;
async function overview(){await page.evaluate(()=>document.querySelector('#apNav button[data-view="overview"]')?.click());await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="overview"]')?.classList.contains('is-active'));}
try{
 const r=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});must(r&&r.status()<400,`Admin returned ${r?.status()}`);
 await page.waitForFunction(()=>window.NSV421DashboardV2?.ready===true&&window.NSV421ReviewQueue,{timeout:15000});
 await page.waitForFunction(()=>window.NSV421OrderOperations?.lifecycleV2===true,null,{timeout:10000});
 original=await page.evaluate(()=>window.NSV421Store.load());
 await page.waitForSelector('#nsDashboardV2',{state:'visible'});
 must(await page.evaluate(()=>window.NSV421DashboardV2.version)==='executive-v3','Executive dashboard version is not active');
 must(await page.locator('[data-executive-dashboard]').count()===1,'Executive command header missing');
 must(await page.locator('[data-executive-trend]').count()===1,'Revenue/order trend surface missing');
 must(await page.locator('[data-attention-center]').count()===1,'Attention Center missing');
 must(await page.locator('[data-order-pipeline]').count()===1,'Order Operations pipeline missing');
 must(await page.locator('#nsDashboardV2 .ns-pipeline-stage').count()===6,'Order pipeline must expose six fulfilment stages');
 const stageNames=await page.locator('#nsDashboardV2 .ns-pipeline-stage > span').allTextContents();
 for(const expected of ['New','Confirmed','Preparing','Ready','Out for delivery','Delivered'])must(stageNames.some(x=>x.trim()===expected),`Pipeline stage missing: ${expected}`);
 must(await page.locator('#nsDashboardV2 .ns-kpi').count()===7,'Executive KPI row is incomplete');
 const dashText=await page.locator('#nsDashboardV2').innerText();
 must(/BUSINESS COMMAND CENTER V2/i.test(dashText),'Dashboard identity missing');
 must(/DEV PREVIEW/i.test(dashText),'Local dashboard does not show environment state');
 must(/Owner/i.test(dashText),'Dashboard role identity missing');
 must(/Preview data · local Admin state/i.test(dashText),'Local dashboard is not truthfully labelled as preview data');
 const legacyKpis=page.locator('.ap-view[data-view="overview"] > .ap-kpis');must(await legacyKpis.count()>0,'Legacy KPI surface was not found');must(await legacyKpis.evaluateAll(es=>es.every(e=>e.hidden)),'Legacy hard-coded KPI row remains visible');
 const legacyGrids=page.locator('.ap-view[data-view="overview"] > .ap-grid-2');must(await legacyGrids.count()>0,'Legacy overview grid was not found');must(await legacyGrids.evaluateAll(es=>es.every(e=>e.hidden)),'Legacy demo overview grid remains visible');
 const metric=await page.evaluate(()=>window.NSV421DashboardV2.metrics(window.NSV421Store.load()));
 const stateMetric=await page.evaluate(()=>{const s=window.NSV421Store.load(),a=v=>Array.isArray(v)?v:[],key=o=>String(o.status||o.delivery||o.state||'pending').trim().toLowerCase().replaceAll(' ','_'),avail=i=>Math.max(0,Number(i.onHand||0)-Number(i.reserved||0));return{low:a(s.inventory).filter(i=>avail(i)<=Number(i.low??i.lowStockThreshold??0)).length,reviews:a(s.media).filter(m=>/needs review|needs enhancement/i.test(m.status||'')).length+a(s.content).filter(c=>/in_review|needs review|needs changes/i.test(c.state||'')).length+a(s.communications).filter(c=>c.status==='Needs review').length,pending:a(s.orders).filter(o=>['pending','awaiting','review'].includes(key(o))).length};});
 must(metric.low.length===stateMetric.low,'Low-stock KPI is not derived from inventory source');must(metric.reviews===stateMetric.reviews,'Review KPI is not derived from source');must(metric.pipeline.pending===stateMetric.pending,'New-order KPI is not derived from order source');
 await page.locator('[data-stage="preparing"]').first().click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="orders"]')?.classList.contains('is-active'));
 await page.waitForFunction(()=>{const e=document.querySelector('#apOrderStatusFilter');return !!e&&/preparing/i.test(e.options[e.selectedIndex]?.textContent||e.value);},null,{timeout:3000});
 must(/preparing/i.test(await page.locator('#apOrderStatusFilter option:checked').textContent()),'Preparing pipeline stage did not drill into Preparing orders');
 await overview();
 await page.locator('[data-dash-view="reviews"]').click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="reviews"]')?.classList.contains('is-active'));await page.waitForSelector('.ap-view[data-view="reviews"] .ns-dash-context',{state:'attached',timeout:3000});
 must(await page.locator('.ap-view[data-view="reviews"] .ns-dash-context').count()===1,'Review Queue drilldown lost dashboard context');
 await page.locator('.ap-view[data-view="reviews"] .ns-dash-context button').click();await page.waitForFunction(()=>!document.querySelector('.ap-view[data-view="reviews"] .ns-dash-context'));
 await overview();const before=await page.evaluate(()=>window.NSV421Store.load().communications?.length||0);await page.locator('[data-quick="communication"]').click();await page.waitForSelector('#v38Form',{state:'visible',timeout:5000});
 must(await page.locator('.ap-view[data-view="communication"]').evaluate(e=>e.classList.contains('is-active')),'Communication quick action did not activate real workspace');must((await page.evaluate(()=>window.NSV421Store.load().communications?.length||0))===before,'Opening Communication quick action created placeholder data');
 const cancel=page.locator('[data-comm-cancel],#apModalClose').first();if(await cancel.count())await cancel.click();await sleep(60);must((await page.evaluate(()=>window.NSV421Store.load().communications?.length||0))===before,'Closing Communication quick action changed state');
 await overview();const oid=await page.evaluate(()=>String(window.NSV421Store.load().orders?.[0]?.id||window.NSV421Store.load().orders?.[0]?.orderId||''));if(oid){await page.locator('#nsDashSearch').fill(oid);await page.locator('#nsDashSearchBtn').click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="orders"]')?.classList.contains('is-active'));await page.waitForSelector('.ap-view[data-view="orders"] .ns-dash-context',{state:'attached',timeout:3000});}
 await overview();await page.locator('[data-pulse="awaiting"]').click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="orders"]')?.classList.contains('is-active'));const paymentFilter=page.locator('#apOrderPaymentFilter');if(await paymentFilter.count()){await page.waitForFunction(()=>{const e=document.querySelector('#apOrderPaymentFilter');return !!e&&/awaiting/i.test(e.options[e.selectedIndex]?.textContent||e.value);},null,{timeout:3000});}
 for(const vp of [{width:1024,height:900},{width:390,height:844}]){await page.setViewportSize(vp);await overview();await sleep(100);const box=await page.locator('#nsDashboardV2').boundingBox();must(box&&box.x>=-1&&box.x+box.width<=vp.width+1,`Dashboard overflows ${vp.width}px viewport`);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);must(!overflow,`Dashboard caused horizontal overflow at ${vp.width}px`);}
 await page.evaluate(s=>{window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},original);await sleep(100);
 must(errors.length===0,`Dashboard page errors: ${errors.join(' | ')}`);must(mutations.length===0,`Dashboard local preview initiated external mutation(s): ${mutations.join(' | ')}`);
 console.log('ADMIN EXECUTIVE DASHBOARD QA: PASS');
} finally {await browser.close().catch(()=>{});server.kill('SIGTERM');}
