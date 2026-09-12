import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4201';
const OUT=path.join(process.cwd(),'qa-artifacts','mobile-tablet-entry');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};

/* Static guard: the final release stylesheet must outrank older ns-intro-mobile rules. */
const releaseCss=fs.readFileSync(path.join(process.cwd(),'assets/css/v36-public.css'),'utf8');
must(releaseCss.includes('html body.ns-intro-mobile #jungle-intro'),'final release gate must explicitly outrank legacy mobile intro rules');
must(releaseCss.includes('html body.ns-intro-mobile #main-site'),'final release gate must explicitly keep storefront visible under ns-intro-mobile');

const server=spawn('python3',['-m','http.server','4201','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

async function state(page){
  return page.evaluate(()=>{
    const intro=document.getElementById('jungle-intro');
    const main=document.getElementById('main-site');
    const skip=document.getElementById('ji-skip');
    const title=document.querySelector('#jungle-intro .ji-title-wrap');
    const logo=document.querySelector('#jungle-intro .ji-logo');
    const cs=e=>e?getComputedStyle(e):null;
    const rect=e=>e?e.getBoundingClientRect():null;
    const isVisible=e=>{if(!e)return false;const s=cs(e),r=rect(e);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.05&&r.width>2&&r.height>2;};
    return {
      w:innerWidth,h:innerHeight,
      bodyClass:document.body.className,
      overflow:cs(document.body).overflowY,
      introVisible:isVisible(intro),
      introDisplay:cs(intro)?.display,
      introOpacity:Number(cs(intro)?.opacity||0),
      titleVisible:isVisible(title),
      logoVisible:isVisible(logo),
      skipVisible:isVisible(skip),
      mainVisible:isVisible(main),
      mainOpacity:Number(cs(main)?.opacity||0),
      mainPointer:cs(main)?.pointerEvents,
      scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
      scrollY
    };
  });
}

async function assertStorefrontReady(page,label){
  const s=await state(page);
  must(!s.introVisible&&s.introDisplay==='none'&&s.introOpacity<.05,`${label}: rejected jungle intro is still visible ${JSON.stringify(s)}`);
  must(!s.titleVisible&&!s.logoVisible&&!s.skipVisible,`${label}: legacy intro branding/skip leaked into viewport ${JSON.stringify(s)}`);
  must(s.mainVisible&&s.mainOpacity>.9&&s.mainPointer!=='none',`${label}: storefront is not immediately usable ${JSON.stringify(s)}`);
  must(s.overflow!=='hidden',`${label}: body is still scroll-locked ${JSON.stringify(s)}`);
  must(s.scrollWidth<=s.w+6,`${label}: horizontal overflow ${s.scrollWidth}>${s.w}`);
  return s;
}

async function checkViewport(cfg,reducedMotion='no-preference'){
  const label=`${cfg.label}-${reducedMotion==='reduce'?'reduced':'normal'}`;
  const context=await browser.newContext({
    viewport:{width:cfg.width,height:cfg.height},
    deviceScaleFactor:cfg.scale,
    isMobile:cfg.mobile,
    hasTouch:true,
    reducedMotion,
    serviceWorkers:'block'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const res=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  must(res&&res.status()<400,`${label}: homepage returned ${res?.status()}`);
  await page.waitForTimeout(350);

  await assertStorefrontReady(page,label);
  await page.screenshot({path:path.join(OUT,`${label}-storefront.png`),fullPage:false});

  /* Regression guard: even if old JS adds ns-intro-mobile later, the rejected intro must stay off. */
  await page.evaluate(()=>document.body.classList.add('ns-intro-mobile'));
  await page.waitForTimeout(80);
  await assertStorefrontReady(page,`${label}-forced-ns-intro-mobile`);
  await page.screenshot({path:path.join(OUT,`${label}-forced-class.png`),fullPage:false});

  must(!errors.length,`${label}: page errors ${errors.join(' | ')}`);
  await context.close();
}

try{
  const targets=[
    {label:'mobile',width:390,height:844,scale:3,mobile:true},
    {label:'tablet',width:820,height:1100,scale:2,mobile:true}
  ];
  for(const t of targets){
    await checkViewport(t,'no-preference');
    await checkViewport(t,'reduce');
  }

  console.log('MOBILE + TABLET ENTRY QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
