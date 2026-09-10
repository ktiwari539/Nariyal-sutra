import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT=process.cwd();
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');
const PROD_ORIGIN='https://nariyal-sutra.netlify.app';
fs.mkdirSync(OUT,{recursive:true});

/* Release coverage: every customer-facing HTML entry point plus Admin/auth shells. */
const pages=[
  'index.html','fresh-tender-coconut.html','green-coconut.html','bulk-coconut-supply.html',
  'about-nariyal-sutra.html','direct-farm.html','south-india-groves.html','gujarat-coast.html',
  'freshness-first.html','coconut-water.html','coconut-events-hospitality.html','supplier-partnership.html',
  'coconut-wholesale-export.html','people-of-nariyal-sutra.html','track.html',
  'privacy.html','terms.html','delivery-policy.html',
  'admin-login.html','admin-set-password.html','staff-sign-in.html','admin.html'
];
const viewports=[
  {name:'desktop',width:1440,height:1000},
  {name:'laptop',width:1024,height:768},
  {name:'tablet',width:768,height:1024},
  {name:'mobile430',width:430,height:932},
  {name:'mobile390',width:390,height:844}
];
const report={startedAt:new Date().toISOString(),base:BASE,failures:[],warnings:[],checks:[],screenshots:[]};
const fail=(scope,msg)=>report.failures.push({scope,msg});
const warn=(scope,msg)=>report.warnings.push({scope,msg});

function sameSite(url){try{return new URL(url).origin===new URL(BASE).origin}catch{return false}}
function safeName(s){return s.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'')}
function mimeFor(file){const ext=path.extname(file).toLowerCase();return ({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream'}
async function installProdAssetMirror(page){
  await page.route(`${PROD_ORIGIN}/assets/**`,async route=>{
    const u=new URL(route.request().url());
    const file=path.join(ROOT,decodeURIComponent(u.pathname).replace(/^\//,''));
    if(fs.existsSync(file)&&fs.statSync(file).isFile()) await route.fulfill({status:200,contentType:mimeFor(file),body:fs.readFileSync(file)});
    else await route.fulfill({status:404,contentType:'text/plain',body:'QA mirror: missing repository asset'});
  });
}
const visibleState=()=>{
  const body=document.body,html=document.documentElement;
  const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.01&&r.width>2&&r.height>2};
  const brokenImages=[...document.images].filter(i=>visible(i)&&i.currentSrc&&i.complete&&i.naturalWidth===0).map(i=>i.currentSrc);
  const visibleBroken=[...document.querySelectorAll('.ns-media-failed')].filter(visible).length;
  const emptyLarge=[...document.querySelectorAll('section,main>div')].map((e,i)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),text=(e.innerText||'').trim();const hasMedia=!!e.querySelector('img,video,canvas,svg,[style*="background-image"]');return {i,h:Math.round(r.height),display:s.display,text:text.length,hasMedia}}).filter(x=>x.display!=='none'&&x.h>500&&x.text<8&&!x.hasMedia);
  return {title:document.title,bodyHeight:Math.max(body?.scrollHeight||0,html.scrollHeight||0),scrollWidth:Math.max(body?.scrollWidth||0,html.scrollWidth||0),viewport:innerWidth,brokenImages,visibleBroken,emptyLarge};
};

const browser=await chromium.launch({headless:true});
try{
  /* Whole-site broken asset / layout audit. */
  for(const pageName of pages){
    const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await installProdAssetMirror(page);
    const consoleErrors=[],local404=[];
    page.on('console',m=>{if(m.type()==='error'){const text=m.text();if(!/favicon|google-analytics|firebaseinstallations|ERR_BLOCKED_BY_CLIENT|Failed to load resource: net::ERR_/i.test(text))consoleErrors.push(text)}});
    page.on('response',r=>{const u=new URL(r.url());if((sameSite(r.url())||u.origin===PROD_ORIGIN)&&r.status()>=400)local404.push(`${r.status()} ${r.url()}`)});
    page.on('pageerror',e=>consoleErrors.push(`pageerror: ${e.message}`));
    const response=await page.goto(`${BASE}/${pageName}?siteqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!response){fail(pageName,'navigation failed');await page.close();continue}
    if(response.status()>=400)fail(pageName,`document returned HTTP ${response.status()}`);
    await page.waitForTimeout(pageName==='index.html'?5400:1700);
    const state=await page.evaluate(visibleState);
    if(!state.title)fail(pageName,'missing page title');
    if(state.bodyHeight<450)fail(pageName,`page body too short (${state.bodyHeight}px)`);
    if(state.scrollWidth>state.viewport+4)fail(pageName,`horizontal overflow ${state.scrollWidth}px > viewport ${state.viewport}px`);
    if(state.brokenImages.length)fail(pageName,`broken rendered images: ${state.brokenImages.slice(0,8).join(', ')}`);
    if(state.visibleBroken)fail(pageName,`${state.visibleBroken} visible failed-media element(s)`);
    if(state.emptyLarge.length)warn(pageName,`${state.emptyLarge.length} large visually empty block(s) detected`);
    for(const e of consoleErrors.slice(0,12))warn(pageName,`console: ${e}`);
    for(const e of [...new Set(local404)].slice(0,12))fail(pageName,`request failed: ${e}`);
    if(pageName==='index.html'){
      const critical=await page.evaluate(()=>({runtime:!!window.NS_V421_STABILIZATION,collection:!!document.querySelector('#collection'),order:!!document.querySelector('#order'),contact:!!document.querySelector('#contact'),hero:!!document.querySelector('.hero'),nav:!!document.querySelector('nav'),footer:!!document.querySelector('footer')}));
      for(const [k,v] of Object.entries(critical))if(!v)fail(pageName,`critical storefront region/runtime missing: ${k}`);
    }
    report.checks.push({page:pageName,state,consoleErrors,local404:[...new Set(local404)]});
    await page.close();
  }

  /* Homepage responsiveness + complete long-page screenshots. */
  for(const vp of viewports){
    const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},reducedMotion:'reduce'});
    await installProdAssetMirror(page);
    const scope=`index:${vp.name}`,local404=[];
    page.on('response',r=>{const u=new URL(r.url());if((sameSite(r.url())||u.origin===PROD_ORIGIN)&&r.status()>=400)local404.push(`${r.status()} ${r.url()}`)});
    const response=await page.goto(`${BASE}/index.html?responsiveqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!response){fail(scope,'navigation failed');await page.close();continue}
    await page.waitForTimeout(vp.width<=980?5400:1900);
    const metrics=await page.evaluate(()=>{
      const html=document.documentElement,body=document.body;const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2};
      return {scrollWidth:Math.max(html.scrollWidth,body.scrollWidth),viewport:innerWidth,bodyHeight:Math.max(html.scrollHeight,body.scrollHeight),mainVisible:visible(document.getElementById('main-site')),introVisible:visible(document.getElementById('jungle-intro')),heroVisible:visible(document.querySelector('.hero')),failedVisible:[...document.querySelectorAll('.ns-media-failed')].filter(visible).length,brokenImages:[...document.images].filter(i=>visible(i)&&i.currentSrc&&i.complete&&i.naturalWidth===0).map(i=>i.currentSrc)};
    });
    if(metrics.scrollWidth>vp.width+4)fail(scope,`horizontal overflow ${metrics.scrollWidth}px > ${vp.width}px`);
    if(!metrics.mainVisible)fail(scope,'main storefront is not visible after intro fail-safe window');
    if(!metrics.heroVisible)fail(scope,'hero is not visible');
    if(vp.width<=980&&metrics.introVisible)fail(scope,'mobile/tablet intro still blocks storefront after fail-safe window');
    if(metrics.failedVisible)fail(scope,`${metrics.failedVisible} visible media failures`);
    if(metrics.brokenImages.length)fail(scope,`broken visible images: ${metrics.brokenImages.slice(0,8).join(', ')}`);
    for(const e of [...new Set(local404)])fail(scope,`request failed: ${e}`);
    const shot=path.join(OUT,`home-${safeName(vp.name)}-${vp.width}x${vp.height}.png`);
    await page.screenshot({path:shot,fullPage:true});report.screenshots.push(path.basename(shot));report.checks.push({page:'index.html',viewport:vp,metrics});await page.close();
  }

  /* People rail: one rail, real approved image sources, no duplicate URLs. */
  {
    const page=await browser.newPage({viewport:{width:1440,height:900}});await installProdAssetMirror(page);await page.goto(`${BASE}/index.html?peopleqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(2200);
    const people=await page.evaluate(()=>{const rails=document.querySelectorAll('#nsPeopleMarquee');const imgs=[...document.querySelectorAll('#nsPeopleMarquee img')].filter(x=>x.getAttribute('src'));const srcs=imgs.map(x=>x.getAttribute('src'));return {rails:rails.length,images:imgs.length,unique:new Set(srcs).size,bad:srcs.filter(x=>!/ambassadors\//i.test(x))}});
    if(people.rails!==1)fail('people-rail',`expected exactly one People rail, found ${people.rails}`);
    if(people.images<4)fail('people-rail',`People rail has too few rendered images (${people.images})`);
    if(people.unique<Math.min(people.images,4))fail('people-rail',`People rail repeats too few unique images (${people.unique}/${people.images})`);
    if(people.bad.length)warn('people-rail',`non-canonical People media detected: ${people.bad.slice(0,4).join(', ')}`);
    await page.$eval('#nsPeopleMarquee',x=>x.scrollIntoView({block:'center'})).catch(()=>{});await page.waitForTimeout(150);await page.screenshot({path:path.join(OUT,'people-rail.png')});report.screenshots.push('people-rail.png');report.checks.push({scope:'people-rail',people});await page.close();
  }

  /* Account design must not merge/overflow at desktop + mobile. */
  for(const vp of [{name:'account-desktop',width:1440,height:900},{name:'account-mobile',width:390,height:844}]){
    const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});await installProdAssetMirror(page);await page.goto(`${BASE}/index.html?accountPreview=1&qa=${Date.now()}#account`,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1600);
    const acct=await page.evaluate(()=>{const p=document.querySelector('#nsacct-panel');const body=document.querySelector('#nsacct-body');const r=p?.getBoundingClientRect();return {panel:!!p,demo:body?.dataset.v421Demo==='1',width:r?.width||0,right:r?.right||0,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,channels:document.querySelectorAll('.demo-channel,.nsacct-prefgrid label').length}});
    if(!acct.panel||!acct.demo)fail(vp.name,'local account visual preview did not initialize');
    if(acct.scrollWidth>acct.viewport+4||acct.right>acct.viewport+4)fail(vp.name,'account drawer overflows viewport');
    if(acct.channels<3)fail(vp.name,`account update channels incomplete (${acct.channels})`);
    const shot=path.join(OUT,`${vp.name}.png`);await page.screenshot({path:shot});report.screenshots.push(`${vp.name}.png`);report.checks.push({scope:vp.name,acct});await page.close();
  }

  /* Checkout acquisition attribution must visibly mount. */
  {
    const page=await browser.newPage({viewport:{width:1280,height:900}});await installProdAssetMirror(page);await page.goto(`${BASE}/index.html?utm_source=qa&utm_medium=test#order`,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1700);
    const attr=await page.evaluate(()=>({context:!!window.NS_ATTRIBUTION_CONTEXT,select:!!document.querySelector('[data-ns-attribution-select],#ns-attribution-source'),section:[...document.querySelectorAll('label,h3,h4,p')].some(x=>/how did you hear about nariyal sutra/i.test(x.textContent||''))}));
    if(!attr.context)fail('checkout-attribution','attribution runtime did not initialize');if(!attr.select&&!attr.section)fail('checkout-attribution','How did you hear about Nariyal Sutra field did not mount');report.checks.push({scope:'checkout-attribution',attr});await page.close();
  }
} finally {await browser.close()}

report.finishedAt=new Date().toISOString();
fs.writeFileSync(path.join(OUT,'qa-report.json'),JSON.stringify(report,null,2));
const summary=['# Nariyal Sutra V42.1 Visual QA','',`Started: ${report.startedAt}`,`Finished: ${report.finishedAt}`,'',`Failures: ${report.failures.length}`,`Warnings: ${report.warnings.length}`,'','## Failures',...(report.failures.length?report.failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','## Warnings',...(report.warnings.length?report.warnings.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','## Screenshots',...report.screenshots.map(x=>`- ${x}`),''].join('\n');
fs.writeFileSync(path.join(OUT,'qa-summary.md'),summary);console.log(summary);if(report.failures.length)process.exit(1);
