import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');
fs.mkdirSync(OUT,{recursive:true});

const pages=[
  'index.html','fresh-tender-coconut.html','green-coconut.html','bulk-coconut-supply.html',
  'about-nariyal-sutra.html','direct-farm.html','south-india-groves.html','freshness-first.html',
  'coconut-water.html','coconut-events-hospitality.html','supplier-partnership.html','admin-login.html','admin.html'
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

const browser=await chromium.launch({headless:true});
try{
  for(const pageName of pages){
    const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    const pageScope=pageName;
    const consoleErrors=[];
    const local404=[];
    page.on('console',m=>{
      if(m.type()==='error'){
        const text=m.text();
        if(!/favicon|google-analytics|firebaseinstallations|ERR_BLOCKED_BY_CLIENT|Failed to load resource: net::ERR_/i.test(text)) consoleErrors.push(text);
      }
    });
    page.on('response',r=>{if(sameSite(r.url())&&r.status()>=400)local404.push(`${r.status()} ${r.url()}`)});
    page.on('pageerror',e=>consoleErrors.push(`pageerror: ${e.message}`));

    const response=await page.goto(`${BASE}/${pageName}`,{waitUntil:'domcontentloaded',timeout:30000}).catch(e=>null);
    if(!response){fail(pageScope,'navigation failed');await page.close();continue;}
    if(response.status()>=400)fail(pageScope,`document returned HTTP ${response.status()}`);
    await page.waitForTimeout(pageName==='index.html'?5400:1200);

    const state=await page.evaluate(()=>{
      const body=document.body,html=document.documentElement;
      const brokenImages=[...document.images].filter(i=>i.currentSrc && i.complete && i.naturalWidth===0).map(i=>i.currentSrc);
      const visibleBroken=[...document.querySelectorAll('.ns-media-failed')].filter(e=>{
        const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2;
      }).length;
      const emptyLarge=[...document.querySelectorAll('section,main>div')].map((e,i)=>{
        const r=e.getBoundingClientRect(),s=getComputedStyle(e),text=(e.innerText||'').trim();
        const hasMedia=!!e.querySelector('img,video,canvas,svg,[style*="background-image"]');
        return {i,h:Math.round(r.height),display:s.display,text:text.length,hasMedia};
      }).filter(x=>x.display!=='none'&&x.h>500&&x.text<8&&!x.hasMedia);
      return {
        title:document.title,
        bodyHeight:Math.max(body?.scrollHeight||0,html.scrollHeight||0),
        scrollWidth:Math.max(body?.scrollWidth||0,html.scrollWidth||0),
        viewport:innerWidth,
        brokenImages,
        visibleBroken,
        emptyLarge,
        runtime:window.NS_V421_STABILIZATION||null,
        assetRuntime:window.NS_V421_ASSET_STATUS||null,
        mainSite:document.getElementById('main-site')?getComputedStyle(document.getElementById('main-site')).display:null,
        intro:document.getElementById('jungle-intro')?getComputedStyle(document.getElementById('jungle-intro')).display:null
      };
    });

    if(!state.title)fail(pageScope,'missing page title');
    if(state.bodyHeight<500)fail(pageScope,`page body too short (${state.bodyHeight}px)`);
    if(state.scrollWidth>state.viewport+4)fail(pageScope,`horizontal overflow ${state.scrollWidth}px > viewport ${state.viewport}px`);
    if(state.brokenImages.length)fail(pageScope,`broken rendered images: ${state.brokenImages.slice(0,5).join(', ')}`);
    if(state.visibleBroken)fail(pageScope,`${state.visibleBroken} visible failed-media element(s)`);
    if(state.emptyLarge.length)warn(pageScope,`${state.emptyLarge.length} large visually empty block(s) detected`);
    for(const e of consoleErrors.slice(0,12))warn(pageScope,`console: ${e}`);
    for(const e of [...new Set(local404)].slice(0,12))fail(pageScope,`local request failed: ${e}`);

    if(pageName==='index.html'){
      if(!state.runtime)fail(pageScope,'V42.1 stabilization runtime did not initialize');
      const critical=await page.evaluate(()=>({
        collection:!!document.querySelector('#collection'),order:!!document.querySelector('#order'),contact:!!document.querySelector('#contact'),
        hero:!!document.querySelector('.hero'),nav:!!document.querySelector('nav'),footer:!!document.querySelector('footer')
      }));
      for(const [k,v] of Object.entries(critical))if(!v)fail(pageScope,`critical storefront region missing: ${k}`);
    }
    report.checks.push({page:pageName,state,consoleErrors,local404:[...new Set(local404)]});
    await page.close();
  }

  for(const vp of viewports){
    const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},reducedMotion:'reduce'});
    const scope=`index:${vp.name}`;
    const local404=[];
    page.on('response',r=>{if(sameSite(r.url())&&r.status()>=400)local404.push(`${r.status()} ${r.url()}`)});
    const response=await page.goto(`${BASE}/index.html`,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
    if(!response){fail(scope,'navigation failed');await page.close();continue;}
    await page.waitForTimeout(vp.width<=980?5400:1800);
    const metrics=await page.evaluate(()=>{
      const html=document.documentElement,body=document.body;
      const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2};
      const main=document.getElementById('main-site');
      const intro=document.getElementById('jungle-intro');
      const hero=document.querySelector('.hero');
      const fixed=[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).position==='fixed'&&visible(e)).map(e=>({tag:e.tagName,id:e.id,cls:e.className?.toString().slice(0,80),r:e.getBoundingClientRect().toJSON()}));
      return {
        scrollWidth:Math.max(html.scrollWidth,body.scrollWidth),viewport:innerWidth,bodyHeight:Math.max(html.scrollHeight,body.scrollHeight),
        mainVisible:main?visible(main):true,introVisible:intro?visible(intro):false,heroVisible:hero?visible(hero):false,
        failedVisible:[...document.querySelectorAll('.ns-media-failed')].filter(visible).length,
        brokenImages:[...document.images].filter(i=>visible(i)&&i.currentSrc&&i.complete&&i.naturalWidth===0).map(i=>i.currentSrc),
        fixed
      };
    });
    if(metrics.scrollWidth>vp.width+4)fail(scope,`horizontal overflow ${metrics.scrollWidth}px > ${vp.width}px`);
    if(!metrics.mainVisible)fail(scope,'main storefront is not visible after intro fail-safe window');
    if(!metrics.heroVisible)fail(scope,'hero is not visible');
    if(vp.width<=980&&metrics.introVisible)fail(scope,'mobile/tablet intro still blocks storefront after fail-safe window');
    if(metrics.failedVisible)fail(scope,`${metrics.failedVisible} visible media failures`);
    if(metrics.brokenImages.length)fail(scope,`broken visible images: ${metrics.brokenImages.slice(0,5).join(', ')}`);
    for(const e of [...new Set(local404)])fail(scope,`local request failed: ${e}`);

    const shot=path.join(OUT,`home-${safeName(vp.name)}-${vp.width}x${vp.height}.png`);
    await page.screenshot({path:shot,fullPage:true});
    report.screenshots.push(path.basename(shot));
    report.checks.push({page:'index.html',viewport:vp,metrics});
    await page.close();
  }
} finally {
  await browser.close();
}

report.finishedAt=new Date().toISOString();
fs.writeFileSync(path.join(OUT,'qa-report.json'),JSON.stringify(report,null,2));
const summary=[
  '# Nariyal Sutra V42.1 Visual QA',
  '',`Started: ${report.startedAt}`,`Finished: ${report.finishedAt}`,
  '',`Failures: ${report.failures.length}`,`Warnings: ${report.warnings.length}`,'',
  '## Failures',...(report.failures.length?report.failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),
  '','## Warnings',...(report.warnings.length?report.warnings.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),
  '','## Screenshots',...report.screenshots.map(x=>`- ${x}`),''
].join('\n');
fs.writeFileSync(path.join(OUT,'qa-summary.md'),summary);
console.log(summary);
if(report.failures.length)process.exit(1);
