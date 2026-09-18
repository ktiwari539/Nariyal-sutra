import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4201';
const OUT=path.join(process.cwd(),'qa-artifacts','mobile-tablet-entry');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};

const releaseJs=fs.readFileSync(path.join(process.cwd(),'assets/js/v36-public.js'),'utf8');
must(releaseJs.includes('introDurationMs:3800'),'release runtime must keep the desktop 3.8s intro contract');
must(releaseJs.includes('mobileIntroDurationMs:MOBILE_INTRO_MS'),'release runtime must expose the shorter mobile intro contract');
must(releaseJs.includes('const MOBILE_INTRO_MS=2400'),'mobile intro must stay responsive');
must(releaseJs.includes('installMobileVideoGovernor'),'mobile runtime must pause offscreen video loops');
must(releaseJs.includes("introAsset:'/assets/images/nariyal-coconut-grove.webp'"),'intro asset contract missing');
must(releaseJs.includes("homepageHeroAsset:'/assets/images/nariyal-premium-hero.webp'"),'homepage hero asset contract missing');

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
    const eyebrow=document.querySelector('#jungle-intro .ji-eyebrow');
    const tagline=document.querySelector('#jungle-intro .ji-tagline');
    const hint=document.querySelector('#jungle-intro .ji-scroll-hint');
    const wordmarkLines=[...document.querySelectorAll('#jungle-intro .ji-logo .ns-wordmark-line')];
    const cs=e=>e?getComputedStyle(e):null;
    const rect=e=>e?e.getBoundingClientRect():null;
    const box=e=>{const r=rect(e);return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null;};
    const isVisible=e=>{if(!e)return false;const s=cs(e),r=rect(e);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.05&&r.width>2&&r.height>2;};
    const before=intro?getComputedStyle(intro,'::before'):null;
    const hero=document.querySelector('.hero-visual');
    return {
      w:innerWidth,h:innerHeight,
      bodyClass:document.body.className,
      overflow:cs(document.body).overflowY,
      introVisible:isVisible(intro),introDisplay:cs(intro)?.display,introOpacity:Number(cs(intro)?.opacity||0),
      titleVisible:isVisible(title),logoVisible:isVisible(logo),eyebrowVisible:isVisible(eyebrow),taglineVisible:isVisible(tagline),hintVisible:isVisible(hint),skipVisible:isVisible(skip),
      titleBox:box(title),logoBox:box(logo),eyebrowBox:box(eyebrow),taglineBox:box(tagline),hintBox:box(hint),skipBox:box(skip),
      wordmarkText:(logo?.innerText||'').replace(/\s+/g,' ').trim().toUpperCase(),
      wordmarkLines:wordmarkLines.map(e=>({text:(e.textContent||'').trim().toUpperCase(),box:box(e),visible:isVisible(e),opacity:Number(cs(e)?.opacity||0),filter:cs(e)?.filter||'none',transform:cs(e)?.transform||'none'})),
      introBackground:before?.backgroundImage||'',heroBackground:hero?getComputedStyle(hero).backgroundImage:'',
      mainVisible:isVisible(main),mainOpacity:Number(cs(main)?.opacity||0),mainPointer:cs(main)?.pointerEvents,
      scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),scrollY
    };
  });
}

function assertInViewport(box,s,label,name,pad=1){
  must(box,`${label}: ${name} bounds missing ${JSON.stringify(s)}`);
  must(box.left>=-pad&&box.right<=s.w+pad,`${label}: ${name} clipped horizontally ${JSON.stringify({box,w:s.w})}`);
  must(box.top>=-pad&&box.bottom<=s.h+pad,`${label}: ${name} clipped vertically ${JSON.stringify({box,h:s.h})}`);
}

function assertWordmark(s,label){
  must(s.wordmarkText==='NARIYAL SUTRA',`${label}: wordmark text changed ${JSON.stringify(s.wordmarkText)}`);
  must(s.wordmarkLines.length===2,`${label}: expected two explicit wordmark lines ${JSON.stringify(s.wordmarkLines)}`);
  const [nariyal,sutra]=s.wordmarkLines;
  must(nariyal.text==='NARIYAL'&&sutra.text==='SUTRA',`${label}: wordmark line content invalid ${JSON.stringify(s.wordmarkLines)}`);
  for(const [name,line] of [['NARIYAL',nariyal],['SUTRA',sutra]]){
    must(line.visible&&line.opacity>.8,`${label}: ${name} line is not clearly visible ${JSON.stringify(line)}`);
    must(line.box?.width>40&&line.box?.height>20,`${label}: ${name} line has trivial visible bounds ${JSON.stringify(line)}`);
    assertInViewport(line.box,s,label,`${name} wordmark line`,2);
    must(line.filter==='none',`${label}: ${name} line has residual filter ${line.filter}`);
    must(line.transform==='none',`${label}: ${name} line has residual transform ${line.transform}`);
  }
  must(sutra.box.top>=nariyal.box.bottom-4,`${label}: SUTRA overlaps NARIYAL ${JSON.stringify({nariyal:nariyal.box,sutra:sutra.box})}`);
}

async function assertOpening(page,label){
  const s=await state(page);
  must(s.introVisible&&s.introOpacity>.9,`${label}: branded intro is not visible ${JSON.stringify(s)}`);
  must(s.titleVisible&&s.logoVisible&&s.eyebrowVisible&&s.taglineVisible,`${label}: complete Nariyal Sutra branding is not visible ${JSON.stringify(s)}`);
  assertInViewport(s.titleBox,s,label,'title block');
  assertInViewport(s.logoBox,s,label,'NARIYAL SUTRA logo');
  assertInViewport(s.eyebrowBox,s,label,'intro eyebrow');
  assertInViewport(s.taglineBox,s,label,'intro tagline');
  assertWordmark(s,label);
  if(s.hintVisible)assertInViewport(s.hintBox,s,label,'intro supporting hint');
  if(s.skipVisible)assertInViewport(s.skipBox,s,label,'intro skip control');
  must(s.introBackground.includes('nariyal-coconut-grove.webp'),`${label}: approved intro background missing ${s.introBackground}`);
  must(!s.heroBackground.includes('nariyal-coconut-grove.webp'),`${label}: intro image is incorrectly reused as homepage hero`);
  must(!s.mainVisible||s.mainOpacity<.1||s.mainPointer==='none',`${label}: storefront should not compete with opening frame ${JSON.stringify(s)}`);
  must(s.scrollWidth<=s.w+6,`${label}: horizontal overflow ${s.scrollWidth}>${s.w}`);
}

async function assertStorefrontReady(page,label){
  const s=await state(page);
  must(!s.introVisible&&s.introDisplay==='none'&&s.introOpacity<.05,`${label}: intro did not complete ${JSON.stringify(s)}`);
  must(!s.titleVisible&&!s.logoVisible&&!s.skipVisible,`${label}: intro controls leaked after completion ${JSON.stringify(s)}`);
  must(s.mainVisible&&s.mainOpacity>.9&&s.mainPointer!=='none',`${label}: storefront is not usable after intro ${JSON.stringify(s)}`);
  must(s.overflow!=='hidden',`${label}: body is still scroll-locked`);
  must(s.scrollWidth<=s.w+6,`${label}: horizontal overflow ${s.scrollWidth}>${s.w}`);
}

async function checkViewport(cfg,reducedMotion='no-preference'){
  const label=`${cfg.label}-${reducedMotion==='reduce'?'reduced':'normal'}`;
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:cfg.scale,isMobile:cfg.mobile,hasTouch:true,reducedMotion,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const res=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  must(res&&res.status()<400,`${label}: homepage returned ${res?.status()}`);
  await page.waitForTimeout(450);
  await assertOpening(page,label);
  await page.screenshot({path:path.join(OUT,`${label}-opening.png`),fullPage:false});
  await page.waitForFunction(()=>document.getElementById('jungle-intro')?.classList.contains('ji-done'),null,{timeout:6000});
  await page.waitForTimeout(180);
  await assertStorefrontReady(page,label);
  await page.screenshot({path:path.join(OUT,`${label}-storefront.png`),fullPage:false});
  await page.evaluate(()=>document.body.classList.add('ns-intro-mobile'));
  await page.waitForTimeout(80);
  await assertStorefrontReady(page,`${label}-forced-ns-intro-mobile`);
  must(!errors.length,`${label}: page errors ${errors.join(' | ')}`);
  await context.close();
}

try{
  const targets=[{label:'mobile',width:390,height:844,scale:3,mobile:true},{label:'tablet',width:820,height:1100,scale:2,mobile:true}];
  for(const t of targets){await checkViewport(t,'no-preference');await checkViewport(t,'reduce');}
  console.log('MOBILE + TABLET ENTRY QA: PASS');
} finally {await browser.close();server.kill();}
