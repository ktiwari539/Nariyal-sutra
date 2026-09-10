import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT=process.cwd();
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');
fs.mkdirSync(OUT,{recursive:true});
const failures=[],warnings=[],checks=[];
const fail=(scope,msg)=>failures.push({scope,msg});
const warn=(scope,msg)=>warnings.push({scope,msg});

/* Production-safety contract. The release candidate must never replace /admin
   with the local-storage Business Command Center demo. The canonical page must
   retain Firebase Authentication + Firestore operational wiring. */
const adminSource=fs.readFileSync(path.join(ROOT,'admin.html'),'utf8');
const requiredSource=[
 ['firebase config','firebase-config.js'],
 ['Firebase app SDK','firebase-app.js'],
 ['Firebase auth SDK','firebase-auth.js'],
 ['Firestore SDK','firebase-firestore.js'],
 ['orders collection',"collection(db,'orders')"],
 ['customers collection',"collection(db,'customers')"],
 ['customer Admin collection',"collection(db,'customerAdmin')"],
 ['audit collection',"collection(db,'adminAudit')"],
 ['enquiries collection',"collection(db,'inquiries')"],
 ['products collection',"collection(db,'products')"],
 ['catalog writes','setDoc('],
 ['batch catalog writes','writeBatch('],
 ['realtime listeners','onSnapshot('],
 ['unified Admin enhancement','/assets/js/v421-admin.js']
];
for(const [label,token] of requiredSource)if(!adminSource.includes(token))fail('admin:source',`missing ${label} wiring (${token})`);
if(/NO FIREBASE|NO PRODUCTION WRITES|LOCAL INTERACTIVE PREVIEW/i.test(adminSource))fail('admin:source','canonical admin.html is still the local-only demo shell');
if(!/Secure Owner Access/i.test(adminSource))fail('admin:source','secure Owner login shell is missing');
const firebaseCfg=fs.readFileSync(path.join(ROOT,'firebase-config.js'),'utf8');
if(!/projectId:\s*["']nariyal-sutra["']/.test(firebaseCfg))fail('admin:source','release is not pointed at the established nariyal-sutra Firebase project');

const requiredDom=[
 'loginView','loginForm','email','password','appView','signOutBtn',
 'kOrders','kPending','kRevenue','kCustomers','search','statusFilter','orderPaymentFilter','exportBtn','ordersBody','mobileOrders',
 'peopleCount','exportPeopleBtn','peopleSearch','peopleType','peopleActivity','clearPeopleFilters','peopleHealth','peopleBody','peopleMobile',
 'inquiryCount','exportEnquiriesBtn','inquiriesBody','auditCount','exportAuditBtn','auditList',
 'seedCatalogBtn','saveAllCatalogBtn','catalogAlert','catalogGrid','drawer','detailGrid','statusActions','paymentOps','emailAudit',
 'peopleDrawer','personDrawerName','personDetailGrid','personContactActions','personAdminOwner','personAdminFollowup','personAdminNextAction','personAdminTags','personAdminNote','personAdminStatus','savePersonAdmin','personOrders','personDataNote'
];

const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 async function auditPage(viewport,label){
  const page=await context.newPage();await page.setViewportSize(viewport);
  const localFailures=[],externalFailures=[],pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('response',r=>{if(r.status()<400)return;try{const u=new URL(r.url()),base=new URL(BASE);const row=`${r.status()} ${r.url()}`;(u.origin===base.origin?localFailures:externalFailures).push(row)}catch{}});
  const res=await page.goto(`${BASE}/admin.html?qa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  if(!res||res.status()>=400){fail(`admin:${label}`,`document returned ${res?.status()||'no response'}`);await page.close();return}
  await page.waitForTimeout(2600);
  const state=await page.evaluate(ids=>{
    const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return !e.classList.contains('hidden')&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2};
    const missing=ids.filter(id=>!document.getElementById(id));
    const login=document.getElementById('loginView'),app=document.getElementById('appView');
    return {
      title:document.title,
      missing,
      loginVisible:visible(login),
      appHidden:!!app&&(app.classList.contains('hidden')||!visible(app)),
      emailType:document.getElementById('email')?.type||'',
      passwordType:document.getElementById('password')?.type||'',
      unifiedReady:!!window.NSV421Admin?.ready,
      unifiedNav:!!document.getElementById('nsUnifiedAdminNav'),
      websiteDirectory:!!document.getElementById('nsAdminWebsiteDirectory'),
      acquisitionPanel:!!document.getElementById('nsAdminAcquisition'),
      scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),viewport:innerWidth,
      localBanner:!!document.getElementById('ns-local-preview-banner')
    };
  },requiredDom);
  if(state.missing.length)fail(`admin:${label}`,`production Admin controls missing: ${state.missing.join(', ')}`);
  if(!state.loginVisible)fail(`admin:${label}`,'secure Owner login is not visible for an unauthenticated session');
  if(!state.appHidden)fail(`admin:${label}`,'private Admin application is visible before authentication');
  if(state.emailType!=='email'||state.passwordType!=='password')fail(`admin:${label}`,'credential fields are not typed safely');
  if(!state.unifiedReady||!state.unifiedNav||!state.websiteDirectory)fail(`admin:${label}`,'V42.1 Admin enhancement did not initialize on the production Owner Portal');
  if(!state.acquisitionPanel)fail(`admin:${label}`,'Customer Acquisition reporting panel did not mount');
  if(state.scrollWidth>state.viewport+6)fail(`admin:${label}`,`horizontal overflow ${state.scrollWidth}px > ${state.viewport}px`);
  for(const x of [...new Set(localFailures)])fail(`admin:${label}`,`same-origin resource failed: ${x}`);
  for(const x of [...new Set(externalFailures)])warn(`admin:${label}`,`third-party/provider resource failed during isolated QA: ${x}`);
  for(const x of [...new Set(pageErrors)])warn(`admin:${label}`,`runtime provider warning: ${x}`);
  const shot=path.join(OUT,`admin-production-${label}.png`);await page.screenshot({path:shot,fullPage:true});
  checks.push({scope:`admin:${label}`,state,localFailures:[...new Set(localFailures)],externalFailures:[...new Set(externalFailures)]});await page.close();
 }
 await auditPage({width:1440,height:1000},'desktop');
 await auditPage({width:390,height:844},'mobile');

 /* Auth/support pages must remain reachable. We do not submit real credentials
    or perform production writes in CI. */
 for(const file of ['admin-login.html','admin-set-password.html','staff-sign-in.html']){
  const page=await context.newPage(),localFailures=[];
  page.on('response',r=>{if(r.status()>=400){try{if(new URL(r.url()).origin===new URL(BASE).origin)localFailures.push(`${r.status()} ${r.url()}`)}catch{}}});
  const url=file==='admin-set-password.html'?`${BASE}/${file}?token=invalid-qa`:`${BASE}/${file}?qa=1`;
  const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(350);
  if(!res||res.status()>=400)fail(`admin:auth:${file}`,`page returned ${res?.status()||'no response'}`);
  const body=(await page.locator('body').innerText().catch(()=>'' )).trim();if(body.length<20)fail(`admin:auth:${file}`,'auth page is visually/content empty');
  for(const x of [...new Set(localFailures)])fail(`admin:auth:${file}`,`same-origin resource failed: ${x}`);
  checks.push({scope:`admin:auth:${file}`,bodyLength:body.length});await page.close();
 }
 await context.close();
}finally{await browser.close()}

const report={generatedAt:new Date().toISOString(),failures,warnings,checks};
fs.writeFileSync(path.join(OUT,'admin-functional-qa-report.json'),JSON.stringify(report,null,2));
const summary=['# Production Admin QA','',`Failures: ${failures.length}`,`Warnings: ${warnings.length}`,'','## Failures',...(failures.length?failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','## Warnings',...(warnings.length?warnings.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','Coverage: Firebase-backed canonical admin.html, secure unauthenticated state, production Orders/Customers/Enquiries/Audit/Catalog controls, customer internal-accountability controls, V42.1 Website & Content enhancement, Customer Acquisition panel, desktop/mobile layout, exact same-origin resource failures, and auth/support entry pages. CI intentionally does not submit real credentials or write production data.'].join('\n');
fs.writeFileSync(path.join(OUT,'admin-functional-qa-summary.md'),summary);console.log(summary);if(failures.length)process.exit(1);
