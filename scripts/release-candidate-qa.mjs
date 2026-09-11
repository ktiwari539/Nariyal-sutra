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
  const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
  const redirects=read('_redirects');
  const adminEntry=read('admin.html');
  const adminPreview=read('admin-preview.html');
  const mediaDb=read('assets/js/v421-media-db.js');
  const bridge=read('assets/js/v421-production-bridge.js');
  const v32=read('assets/js/v32-public.js');

  const requiredRedirects=['/admin /admin.html 200','/admin/ /admin.html 200'];
  for(const token of requiredRedirects)if(!redirects.includes(token))fail('source',`missing Business Command Center route: ${token}`);
  if(/\/admin\/?\s+\/admin-live-legacy\.html\s+200/.test(redirects))fail('source','/admin still routes to rejected legacy Admin');
  if(!adminEntry.includes('admin-preview.html')||adminEntry.includes('admin-live-legacy.html'))fail('source','admin.html is not a clean Business Command Center entry');
  if(!adminPreview.includes('assets/js/v421-media-db.js'))fail('source','Business Command Center does not load the media/runtime bootstrap');
  if(!mediaDb.includes('admin-v38-production.js')||!mediaDb.includes('v421-production-bridge.js'))fail('source','Business Command Center production scripts are not loaded');

  const securityTokens=[
    'admin-bcc-login.html',
    'waitAuth()',
    'adminRole(user)',
    "['Owner','Admin','Manager','Operations','Content','Support','Sales']",
    'nsProductionAdminGuard',
    'uploadMedia',
    'persistRemote'
  ];
  for(const token of securityTokens)if(!bridge.includes(token))fail('source',`production Admin bridge missing ${token}`);
  if(!bridge.includes("const LOCAL=/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/i"))fail('source','production bridge local/production boundary is missing');
  if(!bridge.includes("const isAdmin=/admin-preview\\.html$/i"))fail('source','production bridge is not bound to the approved Business Command Center');
  if(!v32.includes("cinematic:()=>$('#v421-cinematic-film-pro')"))fail('source','homepage sequencing does not target the professional cinematic first');
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
    await page.waitForTimeout(900);
    const first=await page.evaluate(()=>{
      const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number.parseFloat(s.opacity||'1')>.01&&r.width>2&&r.height>2};
      const pathOf=sel=>{const i=document.querySelector(sel);return i?new URL(i.currentSrc||i.src,location.href).pathname:''};
      const legacy=['scroll-cinema','v421-cinematic-film'].map(id=>document.getElementById(id)).filter(Boolean);
      const productImgs=[...document.querySelectorAll('[data-product-card] img,.pc-img-wrap img')];
      const motion=document.getElementById('live-motion');
      const harvest=document.querySelector('#harvest-film .harvest-scene');
      const cine=document.getElementById('v421-cinematic-film-pro');
      const storyMedia=[
        pathOf('[data-product-card="tender"] .pc-img-wrap img'),
        pathOf('.story-visual .sv-img'),
        pathOf('.trade-route.trade-buy img'),
        pathOf('.trade-route.trade-supply img'),
        pathOf('#people-of-nariyal .ns-people-visual img'),
        pathOf('.promise-portal.coast img'),
        pathOf('.promise-portal.grove img'),
        pathOf('.promise-portal.farm img')
      ].filter(Boolean);
      return {
        main:visible(document.getElementById('main-site')||document.querySelector('main')),
        hero:visible(document.querySelector('.hero')),
        cineReady:window.__NS_V421_PRO_CINE?.ready===true,
        cineRunway:cine?.offsetHeight||0,
        legacyHidden:legacy.every(e=>e.hidden||getComputedStyle(e).display==='none'),
        retiredMotionHidden:!motion||motion.hidden||getComputedStyle(motion).display==='none',
        harvestSrc:harvest?.getAttribute('src')||'',
        depthCount:document.querySelectorAll('#v421-cinematic-film-pro .nspro-nut[style*="--ns-depth-z"]').length,
        mediaDiversityReady:document.documentElement.dataset.nsMediaDiversity==='ready',
        storyMedia,
        storyMediaUnique:[...new Set(storyMedia)],
        viewport:innerWidth,
        viewportH:innerHeight,
        scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
        productCount:productImgs.length,
        productSrcs:[...new Set(productImgs.map(i=>new URL(i.currentSrc||i.src,location.href).pathname))]
      };
    });
    if(!first.main)fail(vp.label,'main storefront is hidden');
    if(!first.hero)fail(vp.label,'homepage hero is hidden');
    if(!first.cineReady)fail(vp.label,'professional cinematic did not initialize');
    if(!first.legacyHidden)fail(vp.label,'legacy cinematic remains visible');
    if(!first.retiredMotionHidden)fail(vp.label,'retired white/empty live-motion fold remains visible');
    if(first.harvestSrc&&!first.harvestSrc.startsWith('/assets/'))fail(vp.label,`harvest media still points to retired deploy URL: ${first.harvestSrc}`);
    if(first.depthCount<6)fail(vp.label,'cinematic depth treatment did not initialize');
    if(first.cineRunway>first.viewportH*4.5)fail(vp.label,`cinematic runway is still excessively long: ${first.cineRunway}px`);
    if(first.scrollWidth>first.viewport+6)fail(vp.label,`horizontal overflow ${first.scrollWidth}px > ${first.viewport}px`);
    if(first.productCount>=3&&first.productSrcs.length<3)fail(vp.label,`product imagery is repeating: ${JSON.stringify(first.productSrcs)}`);
    if(!first.mediaDiversityReady)fail(vp.label,'storefront media-diversity pass did not initialize');
    if(first.storyMedia.length>=8&&first.storyMediaUnique.length!==first.storyMedia.length)fail(vp.label,`story imagery is repeating: ${JSON.stringify(first.storyMedia)}`);

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

  const localAdmin=await context.newPage();
  const adminErrors=[];localAdmin.on('pageerror',e=>adminErrors.push(String(e)));
  await localAdmin.goto(`${BASE}/admin.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await localAdmin.waitForURL(/admin-preview\.html/,{timeout:10000});
  await localAdmin.waitForSelector('.ap-app',{state:'visible',timeout:10000});
  await localAdmin.waitForFunction(()=>window.__NS_V421_ADMIN_V38__===true,null,{timeout:10000});
  const localState=await localAdmin.evaluate(()=>{
    const labels=[...document.querySelectorAll('#apNav button')].map(b=>b.textContent.replace(/\s+/g,' ').trim());
    const required=['Overview','Orders','Payments','Products & Pricing','Inventory','Warehouses / Nodes','Delivery Services','Delivery Hub','Customer 360','Media Library','Schedule','Team / Tasks'];
    return {
      title:document.title,
      missing:required.filter(x=>!labels.some(v=>v.includes(x))),
      sidebar:!!document.querySelector('#apSidebar'),
      app:!!document.querySelector('.ap-app'),
      v38:window.__NS_V421_ADMIN_V38__===true,
      imageTargets:!!document.querySelector('#apV38ImageTargets')
    };
  });
  if(!/Business Command Center/i.test(localState.title)||!localState.sidebar||!localState.app||!localState.v38||!localState.imageTargets||localState.missing.length)fail('admin-local',`approved Business Command Center UI missing ${JSON.stringify(localState)}`);
  if(adminErrors.length)fail('admin-local',`runtime errors: ${adminErrors.join(' | ')}`);
  await localAdmin.screenshot({path:path.join(OUT,'admin-business-command-center-local.png'),fullPage:true});
  await localAdmin.close();

  for(const file of ['admin-bcc-login.html','admin-login.html','admin-set-password.html','staff-sign-in.html']){
    const p=await context.newPage();
    const suffix=file==='admin-set-password.html'?'?token=qa-invalid':'';
    const res=await p.goto(`${BASE}/${file}${suffix}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!res||res.status()>=400)fail(`auth:${file}`,`returned ${res?.status()||'no response'}`);
    const text=(await p.locator('body').innerText().catch(()=>'' )).trim();
    if(text.length<20)fail(`auth:${file}`,'page is empty');
    await p.close();
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
