import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT=process.cwd();
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts/final-release');
const PROD='https://nariyal-sutra.netlify.app';
fs.mkdirSync(OUT,{recursive:true});

const failures=[];
const checks=[];
const fail=(scope,msg)=>failures.push({scope,msg});

function requireText(file,needle,scope=file){
  const p=path.join(ROOT,file);
  if(!fs.existsSync(p)){fail(scope,'file missing');return;}
  const s=fs.readFileSync(p,'utf8');
  if(!s.includes(needle))fail(scope,`missing required marker: ${needle}`);
}
function requireAsset(file){
  const p=path.join(ROOT,file);
  if(!fs.existsSync(p)||fs.statSync(p).size<100)fail(file,'required release asset is missing/empty');
}
function mime(file){return ({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'})[path.extname(file).toLowerCase()]||'application/octet-stream'}
async function mirrorCandidateAssets(page){
  await page.route(`${PROD}/assets/**`,async route=>{
    const u=new URL(route.request().url());
    const file=path.join(ROOT,decodeURIComponent(u.pathname).replace(/^\//,''));
    if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({status:200,contentType:mime(file),body:fs.readFileSync(file)});
    return route.fulfill({status:404,contentType:'text/plain',body:'candidate asset missing'});
  });
}

requireText('_redirects','/admin /admin.html 200','admin-route');
requireText('_redirects','/admin/ /admin.html 200','admin-slash-route');
requireText('_headers','https://server.arcgisonline.com','map-csp-esri');
requireText('_headers','https://*.tile.openstreetmap.org','map-csp-osm');
requireText('_headers','https://unpkg.com','map-csp-leaflet');
requireText('assets/css/v36-public.css','V42.1 final release gate','intro-css-gate');
requireText('assets/js/v36-public.js','introDisabled:true','intro-runtime-gate');
[
  'assets/images/nariyal-premium-hero.webp',
  'assets/images/nariyal-hospitality.webp',
  'assets/images/nariyal-product-collection.webp',
  'assets/images/story-coconut-hero.png',
  'assets/images/story-coconut-body-cut.png',
  'assets/images/story-coconut-cap-cut.png'
].forEach(requireAsset);

const browser=await chromium.launch({headless:true});
try{
  for(const vp of [
    {name:'desktop',width:1440,height:900},
    {name:'tablet',width:768,height:1024},
    {name:'mobile',width:390,height:844}
  ]){
    const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},reducedMotion:'no-preference'});
    await mirrorCandidateAssets(page);
    const failedRequests=[];
    page.on('response',r=>{try{const u=new URL(r.url());if((u.origin===new URL(BASE).origin||u.origin===PROD)&&r.status()>=400)failedRequests.push(`${r.status()} ${u.pathname}`)}catch{}});
    const resp=await page.goto(`${BASE}/index.html?finalqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!resp){fail(vp.name,'storefront navigation failed');await page.close();continue;}
    await page.waitForTimeout(1600);
    const state=await page.evaluate(()=>{
      const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.01&&r.width>2&&r.height>2};
      const intro=document.getElementById('jungle-intro');
      const main=document.getElementById('main-site');
      const hero=document.querySelector('.hero');
      const broken=[...document.images].filter(i=>visible(i)&&i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src);
      const heroImgs=[...document.querySelectorAll('.hero img,.hero-visual img')].filter(visible).map(i=>({src:i.currentSrc||i.src,w:i.naturalWidth,h:i.naturalHeight}));
      const desktopFilm=document.getElementById('v20-story-film');
      const mobileReel=document.querySelector('.mobile-story-reel');
      return {
        introVisible:visible(intro),mainVisible:visible(main),heroVisible:visible(hero),
        bodyOverflow:getComputedStyle(document.body).overflowY,
        scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),viewport:innerWidth,
        broken,heroImgs,
        desktopFilmVisible:visible(desktopFilm),mobileReelVisible:visible(mobileReel),
        runtime:window.NS_V421_STABILIZATION||null
      };
    });
    if(state.introVisible)fail(vp.name,'legacy jungle intro is visible');
    if(!state.mainVisible)fail(vp.name,'main storefront is hidden');
    if(!state.heroVisible)fail(vp.name,'hero is not visible');
    if(state.bodyOverflow==='hidden')fail(vp.name,'page scrolling remains locked');
    if(state.scrollWidth>state.viewport+4)fail(vp.name,`horizontal overflow ${state.scrollWidth}px > ${state.viewport}px`);
    if(state.broken.length)fail(vp.name,`broken visible images: ${state.broken.slice(0,6).join(', ')}`);
    if(!state.heroImgs.length||state.heroImgs.some(x=>x.w<10||x.h<10))fail(vp.name,'accepted hero image did not decode');
    if(!state.runtime?.introDisabled)fail(vp.name,'final stabilization runtime did not initialize');
    if(vp.width<=980){
      if(state.desktopFilmVisible)fail(vp.name,'desktop cinematic film is still visible on touch layout');
      if(!state.mobileReelVisible)fail(vp.name,'mobile story reel is not visible');
    }
    for(const r of [...new Set(failedRequests)])fail(vp.name,`candidate request failed: ${r}`);
    await page.screenshot({path:path.join(OUT,`storefront-${vp.name}.png`),fullPage:true});
    checks.push({scope:vp.name,state,failedRequests:[...new Set(failedRequests)]});
    await page.close();
  }

  const admin=await browser.newPage({viewport:{width:1440,height:900}});
  const resp=await admin.goto(`${BASE}/admin.html?finalqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
  if(!resp)fail('admin','admin.html navigation failed');
  else{
    await admin.waitForTimeout(1200);
    const state=await admin.evaluate(()=>{
      const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2};
      const candidates=[...document.querySelectorAll('.login-card,.app,.shell')];
      return {title:document.title,styled:candidates.some(visible),bodyBackground:getComputedStyle(document.body).backgroundImage,bodyColor:getComputedStyle(document.body).color,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
    });
    if(!/Owner Portal|Nariyal Sutra/i.test(state.title))fail('admin',`unexpected admin title: ${state.title}`);
    if(!state.styled)fail('admin','canonical Admin rendered without its styled shell');
    if(state.scrollWidth>state.viewport+4)fail('admin','Admin horizontally overflows desktop viewport');
    await admin.screenshot({path:path.join(OUT,'admin-desktop.png'),fullPage:true});
    checks.push({scope:'admin',state});
  }
  await admin.close();
} finally {
  await browser.close();
}

const report={generatedAt:new Date().toISOString(),failures,checks};
fs.writeFileSync(path.join(OUT,'final-release-report.json'),JSON.stringify(report,null,2));
console.log(`Final release regression QA: ${failures.length?'FAIL':'PASS'}`);
for(const f of failures)console.error(`FAIL [${f.scope}] ${f.msg}`);
if(failures.length)process.exit(1);
