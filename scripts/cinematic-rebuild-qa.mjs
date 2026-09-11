import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync('qa-artifacts',{recursive:true});
await sleep(1200);

const browser=await chromium.launch({headless:true});

async function testStorefront(viewport,label){
  const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(900);
  await page.evaluate(()=>{try{window.skipIntro?.()}catch{} const i=document.getElementById('jungle-intro');if(i)i.classList.add('ji-done');});
  await page.waitForSelector('#v421-cinematic-film[data-ready="1"]',{state:'attached',timeout:20000});
  await page.waitForFunction(()=>window.__NS_V421_ISOLATED_CINE&&Number.isFinite(window.__NS_V421_ISOLATED_CINE.progress),null,{timeout:20000});

  const legacyHidden=await page.evaluate(()=>{const x=document.getElementById('scroll-cinema');return !x||x.hidden||getComputedStyle(x).display==='none';});
  if(!legacyHidden)throw new Error(`${label}: legacy cinematic still visible`);

  const metrics=await page.locator('#v421-cinematic-film').evaluate(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {documentTop:r.top+scrollY,height:el.offsetHeight,viewport:innerHeight,display:cs.display,position:cs.position};});
  if(metrics.display==='none')throw new Error(`${label}: isolated cinematic hidden`);
  if(metrics.height<metrics.viewport*4.2)throw new Error(`${label}: cinematic runway too short ${metrics.height}px`);

  const assetState=await page.evaluate(()=>[...document.querySelectorAll('#v421-cinematic-film img')].map(img=>({src:img.getAttribute('src'),complete:img.complete,w:img.naturalWidth,h:img.naturalHeight}))); 
  const badAssets=assetState.filter(x=>x.complete&&x.w===0);
  if(badAssets.length)throw new Error(`${label}: cinematic assets broken ${JSON.stringify(badAssets)}`);

  const range=Math.max(1,metrics.height-metrics.viewport);
  const samples=[
    {p:.16,name:'rain'},
    {p:.47,name:'hero'},
    {p:.56,name:'knife'},
    {p:.69,name:'splash'},
    {p:.86,name:'water'}
  ];
  const states=[];
  for(const s of samples){
    await page.evaluate(({top,range,p})=>scrollTo(0,top+range*p),{top:metrics.documentTop,range,p:s.p});
    await page.waitForTimeout(300);
    const state=await page.evaluate(()=>{
      const f=n=>Number.parseFloat(getComputedStyle(document.querySelector(n)).opacity)||0;
      const cine=window.__NS_V421_ISOLATED_CINE||{};
      const water=document.querySelector('#v421-cinematic-film .v421i-water-fill')?.getBoundingClientRect();
      return {...cine,heroOpacity:f('#v421-cinematic-film .v421i-hero-main'),knifeOpacity:f('#v421-cinematic-film .v421i-knife'),splashOpacity:f('#v421-cinematic-film .v421i-splash'),waterOpacity:f('#v421-cinematic-film .v421i-water-fill'),water:water?{w:water.width,h:water.height,top:water.top,left:water.left}:null,viewport:{w:innerWidth,h:innerHeight}};
    });
    states.push({sample:s.p,name:s.name,...state});
    await page.screenshot({path:`qa-artifacts/${label}-${s.name}.png`,fullPage:false});
  }

  const byName=Object.fromEntries(states.map(s=>[s.name,s]));
  if((byName.rain?.rainVisible||0)<5)throw new Error(`${label}: coconut rain not visibly populated ${JSON.stringify(byName.rain)}`);
  if((byName.hero?.heroOpacity||0)<.35)throw new Error(`${label}: selected coconut not visible ${JSON.stringify(byName.hero)}`);
  if((byName.knife?.knifeOpacity||0)<.35)throw new Error(`${label}: knife not visible ${JSON.stringify(byName.knife)}`);
  if((byName.splash?.splashOpacity||0)<.35)throw new Error(`${label}: splash not visible ${JSON.stringify(byName.splash)}`);
  const w=byName.water;
  if(!w||w.waterOpacity<.75||!w.water||w.water.w<w.viewport.w*.98||w.water.h<w.viewport.h*.98)throw new Error(`${label}: water does not cover viewport ${JSON.stringify(w)}`);

  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(180);
  const distinctProducts=await page.evaluate(()=>{
    const imgs=[...document.querySelectorAll('[data-product-card] .pc-img-wrap img')];
    return {count:imgs.length,srcs:[...new Set(imgs.map(i=>new URL(i.currentSrc||i.src,location.href).pathname))],broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)};
  });
  if(distinctProducts.count>=3&&distinctProducts.srcs.length<3)throw new Error(`${label}: product cards still repeat one image ${JSON.stringify(distinctProducts)}`);
  if(distinctProducts.broken.length)throw new Error(`${label}: product image broken ${JSON.stringify(distinctProducts)}`);

  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height;y+=Math.max(600,viewport.height*.8)){
    await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(70);
  }
  const broken=await page.evaluate(()=>[...document.images].filter(img=>{
    const cs=getComputedStyle(img),r=img.getBoundingClientRect();
    return cs.display!=='none'&&cs.visibility!=='hidden'&&!img.hidden&&img.complete&&img.naturalWidth===0&&r.width>2&&r.height>2;
  }).map(img=>img.getAttribute('src')||''));
  if(broken.length)throw new Error(`${label}: visible broken images ${JSON.stringify(broken.slice(0,12))}`);

  if(errors.length)throw new Error(`${label}: page errors ${errors.join(' | ')}`);
  console.log(`${label.toUpperCase()} STOREFRONT QA: PASS`,JSON.stringify({metrics,states,distinctProducts}));
  await context.close();
}

async function testAdmin(){
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/admin.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForURL(/admin-preview\.html/,{timeout:10000});
  await page.waitForSelector('.ap-app',{state:'visible',timeout:10000});
  const title=await page.title();
  if(!/Business Command Center/i.test(title))throw new Error(`Admin title is not Business Command Center: ${title}`);
  const sidebar=await page.locator('.ap-sidebar').isVisible();
  if(!sidebar)throw new Error('Business Command Center sidebar missing');
  const keyLabels=await page.locator('.ap-nav button').allTextContents();
  for(const label of ['Products & Pricing','Inventory','Warehouses / Nodes','Delivery Services','Delivery Hub']){
    if(!keyLabels.some(x=>x.includes(label)))throw new Error(`Admin missing ${label}`);
  }
  await page.screenshot({path:'qa-artifacts/admin-business-command-center.png',fullPage:false});
  console.log('ADMIN CANONICAL QA: PASS');
  await context.close();
}

try{
  await testStorefront({width:1440,height:900},'desktop');
  await testStorefront({width:390,height:844},'mobile');
  await testAdmin();
  console.log('PROFESSIONAL WEBSITE QA: PASS');
}finally{
  await browser.close();
  server.kill();
}
