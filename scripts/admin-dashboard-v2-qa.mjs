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
 await page.waitForFunction(()=>window.NSV421DashboardV2?.ready===true&&window.NSV421CommunicationAdmin?.ready===true&&window.NSV421ReviewQueue,{timeout:15000});
 original=await page.evaluate(()=>window.NSV421Store.load());
 await page.waitForSelector('#nsDashboardV2',{state:'visible'});
 must(await page.locator('#nsDashboardV2 .ns-kpi').count()===7,'Dashboard V2 KPI row is incomplete');
 must(await page.locator('#nsDashboardV2').innerText().then(t=>/BUSINESS COMMAND CENTER V2/i.test(t)),'Dashboard V2 identity is missing');
 must(await page.locator('#nsDashboardV2').innerText().then(t=>/Preview data · local Admin state/i.test(t)),'Local dashboard is not truthfully labelled as preview data');
 const legacyKpis=page.locator('.ap-view[data-view="overview"] > .ap-kpis');
 must(await legacyKpis.count()>0,'Legacy KPI surface was not found for replacement verification');
 must(await legacyKpis.evaluateAll(es=>es.every(e=>e.hidden)),'Legacy hard-coded KPI row remains visible');
 const legacyGrids=page.locator('.ap-view[data-view="overview"] > .ap-grid-2');
 must(await legacyGrids.count()>0,'Legacy overview grid was not found for replacement verification');
 must(await legacyGrids.evaluateAll(es=>es.every(e=>e.hidden)),'Legacy demo attention/chart grid remains visible');
 const metric=await page.evaluate(()=>window.NSV421DashboardV2.metrics());
 const stateMetric=await page.evaluate(()=>{const s=window.NSV421Store.load(),a=v=>Array.isArray(v)?v:[],n=v=>String(v||'').toLowerCase(),avail=i=>Math.max(0,Number(i.onHand||0)-Number(i.reserved||0));return{low:a(s.inventory).filter(i=>avail(i)<=Number(i.low??i.lowStockThreshold??0)).length,reviews:a(s.media).filter(m=>/needs review|needs enhancement/i.test(m.status||'')).length+a(s.content).filter(c=>/in_review|needs review|needs changes/i.test(c.state||'')).length+a(s.communications).filter(c=>c.status==='Needs review').length,communications:a(s.communications).filter(c=>['Draft','Needs review','Failed'].includes(c.status)||(!c.sentAt&&c.scheduledAt&&new Date(c.scheduledAt)<=new Date())).length,pending:a(s.orders).filter(o=>/pending|awaiting|review/.test(n(o.status||o.delivery||o.state))).length};});
 must(metric.low.length===stateMetric.low,'Low-stock KPI is not derived from inventory source');
 must(metric.reviews===stateMetric.reviews,'Review KPI is not derived from Media + Content + Communication');
 must(metric.comm.length===stateMetric.communications,'Communication KPI is not derived from current communication source');
 must(metric.pending.length===stateMetric.pending,'Pending-order KPI is not derived from order source');
 await page.locator('[data-dash-view="reviews"]').click();
 await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="reviews"]')?.classList.contains('is-active'));
 must(await page.locator('.ap-view[data-view="reviews"] .ns-dash-context').count()===1,'Review Queue deep-link did not preserve dashboard context');
 await page.locator('.ap-view[data-view="reviews"] .ns-dash-context button').click();
 must(await page.locator('.ap-view[data-view="reviews"] .ns-dash-context').count()===0,'Clear dashboard filter did not clear context');
 await overview();const before=await page.evaluate(()=>window.NSV421Store.load().communications?.length||0);
 await page.locator('[data-quick="communication"]').click();
 await page.waitForSelector('#v38Form',{state:'visible',timeout:5000});
 must(await page.locator('.ap-view[data-view="communication"]').evaluate(e=>e.classList.contains('is-active')),'Communication quick action did not activate real workspace');
 must((await page.evaluate(()=>window.NSV421Store.load().communications?.length||0))===before,'Opening dashboard Communication quick action created placeholder data');
 await page.locator('[data-comm-cancel]').click();await sleep(60);
 must((await page.evaluate(()=>window.NSV421Store.load().communications?.length||0))===before,'Cancelling dashboard Communication quick action changed state');
 await overview();const oid=await page.evaluate(()=>String(window.NSV421Store.load().orders?.[0]?.id||''));
 if(oid){await page.locator('#nsDashSearch').fill(oid);await page.locator('#nsDashSearchBtn').click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="orders"]')?.classList.contains('is-active'));must(await page.locator('.ap-view[data-view="orders"] .ns-dash-context').count()===1,'Dashboard search did not route known order with context');}
 await overview();await page.locator('[data-pulse="awaiting"]').click();await page.waitForFunction(()=>document.querySelector('.ap-view[data-view="orders"]')?.classList.contains('is-active'));
 const paymentFilter=page.locator('#apOrderPaymentFilter');if(await paymentFilter.count())must(/awaiting/i.test(await paymentFilter.inputValue()),'Payment pulse did not apply existing Awaiting filter');
 for(const vp of [{width:1024,height:900},{width:390,height:844}]){await page.setViewportSize(vp);await overview();await sleep(80);const box=await page.locator('#nsDashboardV2').boundingBox();must(box&&box.x>=-1&&box.x+box.width<=vp.width+1,`Dashboard V2 overflows ${vp.width}px viewport`);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);must(!overflow,`Dashboard V2 caused horizontal document overflow at ${vp.width}px`);}
 await page.evaluate(s=>{window.NSV421Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));},original);await sleep(80);
 must(errors.length===0,`Dashboard V2 page errors: ${errors.join(' | ')}`);
 must(mutations.length===0,`Dashboard V2 local preview initiated external mutation(s): ${mutations.join(' | ')}`);
 console.log('Admin Command Center V2 QA PASS');
} finally {await browser.close().catch(()=>{});server.kill('SIGTERM');}
