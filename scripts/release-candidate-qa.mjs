import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'qa-artifacts','release-candidate');
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4187','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1000);
const BASE='http://127.0.0.1:4187';
const failures=[];
const fail=(scope,msg)=>failures.push({scope,msg});

function sourceContract(){
  const redirects=fs.readFileSync(path.join(ROOT,'_redirects'),'utf8');
  const admin=fs.readFileSync(path.join(ROOT,'admin-live-legacy.html'),'utf8');
  const adminEntry=fs.readFileSync(path.join(ROOT,'admin.html'),'utf8');
  const requiredRedirects=['/admin /admin-live-legacy.html 200','/admin/ /admin-live-legacy.html 200'];
  for(const token of requiredRedirects)if(!redirects.includes(token))fail('source',`missing production Admin route: ${token}`);
  if(!adminEntry.includes('admin-live-legacy.html'))fail('source','admin.html does not open production Admin implementation');
  const wiring=[
    'firebase-config.js','firebase-app.js','firebase-auth.js','firebase-firestore.js',
    "collection(db,'orders')","collection(db,'customers')","collection(db,'inquiries')","collection(db,'products')",
    "collection(db,'adminAudit')",'setDoc(','writeBatch(','onSnapshot(','/assets/js/v421-admin.js'
  ];
  for(const token of wiring)if(!admin.includes(token))fail('source',`production Admin wiring missing ${token}`);
  if(/LOCAL INTERACTIVE PREVIEW|No Firebase, Cloudinary, email or production writes/i.test(admin))fail('source','production Admin contains local-preview-only marker');
}
sourceContract();

const browser=await chromium.launch({headless:true});
try{
  for(const vp of [
    {label:'desktop',width:1440,height:900},
    {label:'tablet',width:820,height:1100},
    {label:'mobile',width:390,height:844}
  ]){
    const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},serviceWorkers:'block',reducedMotion:'no-preference'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    const response=await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!response||response.status()>=400){fail(vp.label,`storefront returned ${response?.status()||'no response'}`);await context.close();continue;}
    await page.evaluate(()=>{try{window.skipIntro?.()}catch{} const i=document.getElementById('jungle-intro');if(i)i.classList.add('ji-done');document.documentElement.style.scrollBehavior='auto';});
    await page.waitForSelector('#v421-cinematic-film-pro[data-ready="1"]',{timeout:20000});
    await page.waitForTimeout(250);
    const first=await page.evaluate(()=>{
      const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number.parseFloat(s.opacity||'1')>.01&&r.width>2&&r.height>2};
      const legacy=['scroll-cinema','v421-cinematic-film'].map(id=>document.getElementById(id)).filter(Boolean);
      const productImgs=[...document.querySelectorAll('[data-product-card] img,.pc-img-wrap img')];
      return {
        main:visible(document.getElementById('main-site')||document.querySelector('main')),
        hero:visible(document.querySelector('.hero')),
        cineReady:window.__NS_V421_PRO_CINE?.ready===true,
        legacyHidden:legacy.every(e=>e.hidden||getComputedStyle(e).display==='none'),
        viewport:innerWidth,
        scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
        productCount:productImgs.length,
        productSrcs:[...new Set(productImgs.map(i=>new URL(i.currentSrc||i.src,location.href).pathname))]
      };
    });
    if(!first.main)fail(vp.label,'main storefront is hidden');
    if(!first.hero)fail(vp.label,'homepage hero is hidden');
    if(!first.cineReady)fail(vp.label,'professional cinematic did not initialize');
    if(!first.legacyHidden)fail(vp.label,'legacy cinematic remains visible');
    if(first.scrollWidth>first.viewport+6)fail(vp.label,`horizontal overflow ${first.scrollWidth}px > ${first.viewport}px`);
    if(first.productCount>=3&&first.productSrcs.length<3)fail(vp.label,`product imagery is repeating: ${JSON.stringify(first.productSrcs)}`);

    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    for(let y=0;y<height;y+=Math.max(620,Math.floor(vp.height*.75))){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(35);}
    const broken=await page.evaluate(()=>[...document.images].filter(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img);return s.display!=='none'&&s.visibility!=='hidden'&&!img.hidden&&img.complete&&img.naturalWidth===0&&r.width>2&&r.height>2;}).map(i=>i.getAttribute('src')||i.src));
    if(broken.length)fail(vp.label,`visible broken images: ${JSON.stringify(broken.slice(0,12))}`);
    if(errors.length)fail(vp.label,`page errors: ${errors.join(' | ')}`);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(OUT,`storefront-${vp.label}.png`),fullPage:true});
    await context.close();
  }

  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const admin=await context.newPage();
  const adminErrors=[];admin.on('pageerror',e=>adminErrors.push(String(e)));
  await admin.goto(`${BASE}/admin.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await admin.waitForURL(/admin-live-legacy\.html/,{timeout:10000});
  await admin.waitForSelector('#loginView',{state:'visible',timeout:10000});
  await admin.waitForFunction(()=>window.NSV421Admin?.ready===true,null,{timeout:10000});
  const adminState=await admin.evaluate(()=>{
    const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return !e.classList.contains('hidden')&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2};
    return {
      title:document.title,
      loginVisible:visible(document.getElementById('loginView')),
      appHidden:!visible(document.getElementById('appView')),
      emailType:document.getElementById('email')?.type,
      passwordType:document.getElementById('password')?.type,
      adminReady:window.NSV421Admin?.ready===true,
      skin:!!document.querySelector('link[data-ns-admin-business-skin]'),
      viewport:innerWidth,scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)
    };
  });
  if(!/Business Command Center/i.test(adminState.title))fail('admin',`unexpected title ${adminState.title}`);
  if(!adminState.loginVisible||!adminState.appHidden)fail('admin','secure unauthenticated boundary is incorrect');
  if(adminState.emailType!=='email'||adminState.passwordType!=='password')fail('admin','credential inputs are not typed correctly');
  if(!adminState.adminReady||!adminState.skin)fail('admin','Business Command Center enhancement did not initialize');
  if(adminState.scrollWidth>adminState.viewport+6)fail('admin',`horizontal overflow ${adminState.scrollWidth}px > ${adminState.viewport}px`);
  if(adminErrors.some(e=>!/storage|firebase|network/i.test(e)))fail('admin',`runtime errors: ${adminErrors.join(' | ')}`);
  await admin.screenshot({path:path.join(OUT,'admin-secure-entry.png'),fullPage:true});

  for(const file of ['admin-login.html','admin-set-password.html','staff-sign-in.html']){
    const p=await context.newPage();const res=await p.goto(`${BASE}/${file}${file==='admin-set-password.html'?'?token=qa-invalid':''}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!res||res.status()>=400)fail(`auth:${file}`,`returned ${res?.status()||'no response'}`);
    const text=(await p.locator('body').innerText().catch(()=>'' )).trim();if(text.length<20)fail(`auth:${file}`,'page is empty');await p.close();
  }
  await context.close();
} finally {
  await browser.close();
  server.kill();
}

const report={generatedAt:new Date().toISOString(),failures};
fs.writeFileSync(path.join(OUT,'release-candidate-report.json'),JSON.stringify(report,null,2));
console.log(`RELEASE CANDIDATE QA: ${failures.length?'FAIL':'PASS'}`);
for(const f of failures)console.error(`FAIL [${f.scope}] ${f.msg}`);
if(failures.length)process.exit(1);
