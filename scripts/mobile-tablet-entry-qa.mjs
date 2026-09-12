import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4201';
const OUT=path.join(process.cwd(),'qa-artifacts','mobile-tablet-entry');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};
const server=spawn('python3',['-m','http.server','4201','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

async function state(page){
  return page.evaluate(()=>{
    const intro=document.getElementById('jungle-intro');
    const main=document.getElementById('main-site');
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
      introDone:intro?.classList.contains('ji-done')||false,
      introBg:cs(intro,'::before')?.backgroundImage||'',
      titleVisible:isVisible(title),
      logoVisible:isVisible(logo),
      logoText:(logo?.textContent||'').trim(),
      mainVisible:isVisible(main),
      mainOpacity:Number(cs(main)?.opacity||0),
      mainPointer:cs(main)?.pointerEvents,
      scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
      scrollY
    };
  });
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
  const opening=await state(page);
  must(opening.introVisible,`${label}: opening screen is not visible ${JSON.stringify(opening)}`);
  must(opening.titleVisible&&opening.logoVisible&&/NARIYAL/i.test(opening.logoText),`${label}: opening branding is not visible ${JSON.stringify(opening)}`);
  must(/nariyal-premium-hero\.webp/.test(opening.introBg),`${label}: opening image is not applied ${opening.introBg}`);
  must(opening.mainOpacity<.15||opening.mainPointer==='none',`${label}: storefront is exposed underneath opening ${JSON.stringify(opening)}`);
  must(opening.scrollWidth<=opening.w+6,`${label}: opening has horizontal overflow ${opening.scrollWidth}>${opening.w}`);
  await page.screenshot({path:path.join(OUT,`${label}-opening.png`)});

  const maxWait=reducedMotion==='reduce'?3500:6500;
  await page.waitForFunction(()=>{
    const i=document.getElementById('jungle-intro'),m=document.getElementById('main-site');
    if(!i||!m)return false;
    const a=getComputedStyle(i),b=getComputedStyle(m);
    const introGone=a.display==='none'||a.visibility==='hidden'||Number(a.opacity||1)<.05;
    const mainReady=b.display!=='none'&&b.visibility!=='hidden'&&Number(b.opacity||0)>.9&&b.pointerEvents!=='none';
    return introGone&&mainReady&&!document.body.classList.contains('ns-intro-mobile')&&getComputedStyle(document.body).overflowY!=='hidden';
  },null,{timeout:maxWait});
  await page.waitForTimeout(250);
  const opened=await state(page);
  must(!opened.introVisible&&opened.mainVisible&&opened.mainOpacity>.9&&opened.mainPointer!=='none',`${label}: storefront did not open cleanly ${JSON.stringify(opened)}`);
  must(opened.scrollWidth<=opened.w+6,`${label}: storefront has horizontal overflow ${opened.scrollWidth}>${opened.w}`);
  must(!errors.length,`${label}: page errors ${errors.join(' | ')}`);
  await page.screenshot({path:path.join(OUT,`${label}-storefront.png`)});
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

  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'no-preference',serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(350);
  const skip=page.locator('#ji-skip');
  must(await skip.isVisible(),'mobile-skip: skip control is not visible');
  await skip.click({timeout:3000});
  await page.waitForFunction(()=>{
    const i=document.getElementById('jungle-intro'),m=document.getElementById('main-site');
    const a=i&&getComputedStyle(i),b=m&&getComputedStyle(m);
    return i&&m&&(a.display==='none'||a.visibility==='hidden'||Number(a.opacity||1)<.05)&&Number(b.opacity||0)>.9&&b.pointerEvents!=='none';
  },null,{timeout:2500});
  await page.screenshot({path:path.join(OUT,'mobile-skip-storefront.png')});
  await context.close();

  console.log('MOBILE + TABLET OPENING QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
