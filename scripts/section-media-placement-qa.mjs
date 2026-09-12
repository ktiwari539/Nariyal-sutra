import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'qa-artifacts','section-media-placement');
fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:4202';
const server=spawn('python3',['-m','http.server','4202','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(900);
const browser=await chromium.launch({headless:true});
const must=(v,m)=>{if(!v)throw new Error(m)};

try{
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`${BASE}/admin.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForURL(/admin-preview\.html/,{timeout:10000});
  await page.waitForFunction(()=>window.__NS_V421_ADMIN_V38__===true&&window.__NS_V421_ADMIN_V39__===true,null,{timeout:10000});
  await page.locator('#apNav [data-view="pages"]').click();
  await page.waitForSelector('#apV38ImageTargets',{state:'visible'});

  const defaults=await page.evaluate(()=>{
    const host=document.getElementById('apV38ImageTargets');
    return {
      cards:host?.querySelectorAll('article').length||0,
      images:[...(host?.querySelectorAll('article img')||[])].map(i=>({src:i.getAttribute('src'),complete:i.complete,nw:i.naturalWidth})),
      oldPlaceholder:(host?.innerText||'').includes('Uses coded default'),
      defaultLabels:[...(host?.querySelectorAll('article')||[])].filter(x=>(x.innerText||'').includes('Default image')).length
    };
  });
  must(defaults.cards===12,`expected 12 placement cards, got ${defaults.cards}`);
  must(defaults.images.length===12,'all placement cards must show an actual default/custom preview image');
  must(!defaults.oldPlaceholder,'legacy Uses coded default placeholder is still shown');
  must(defaults.defaultLabels>=1,'default image status is not visible');
  must(defaults.images.every(x=>x.src),'one or more placement preview src values are empty');

  await page.locator('[data-v38-target="homepage-hero"]').click();
  await page.waitForSelector('#apModal.is-open',{state:'visible'});
  const pick=page.locator('[data-v38-pick="WS001"]');
  must(await pick.count()===1,'WS001 is not available in section-image picker');
  await pick.click();
  await page.waitForFunction(()=>window.NSV421Store?.load()?.sectionMedia?.['homepage-hero']==='WS001');
  must(await page.locator('#apV38ImageTargets').innerText().then(x=>x.includes('Custom · Fresh cut · coastal serve')),'placement card did not refresh to selected media');
  await page.screenshot({path:path.join(OUT,'admin-placement-custom.png'),fullPage:true});

  await page.evaluate(()=>{
    const s=window.NSV421Store.load();
    s.sectionMedia=s.sectionMedia||{};
    Object.assign(s.sectionMedia,{
      'homepage-hero':'WS001',
      'people-hero':'WS005',
      'fresh-tender-hero':'WS005',
      'green-hero':'WS005',
      'bulk-hero':'WS005'
    });
    window.NSV421Store.save(s);
    window.dispatchEvent(new CustomEvent('nsv421:change'));
  });

  const checks=[
    ['index.html','.hero-visual img','ws001-fresh-cut-ocean.webp'],
    ['people-of-nariyal-sutra.html','#peopleHeroImg','ws005-field-harvest-workers.webp'],
    ['fresh-tender-coconut.html','.sp-scenes .sp-scene:first-child','ws005-field-harvest-workers.webp'],
    ['green-coconut.html','.sp-scenes .sp-scene:first-child','ws005-field-harvest-workers.webp'],
    ['bulk-coconut-supply.html','.w-hero-media img','ws005-field-harvest-workers.webp']
  ];
  for(const [file,selector,token] of checks){
    const p=await context.newPage();
    const errs=[];p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(`${BASE}/${file}`,{waitUntil:'domcontentloaded',timeout:30000});
    if(file==='index.html')await p.evaluate(()=>{try{window.skipIntro?.()}catch{}});
    await p.waitForFunction(({selector,token})=>{
      const el=document.querySelector(selector);return !!el&&String(el.currentSrc||el.getAttribute('src')||'').includes(token);
    },{selector,token},{timeout:10000});
    const src=await p.locator(selector).first().getAttribute('src');
    must(String(src).includes(token),`${file}: ${selector} did not use saved Admin placement, got ${src}`);
    must(!errs.length,`${file}: page errors ${errs.join(' | ')}`);
    await p.screenshot({path:path.join(OUT,file.replace(/\.html$/,'')+'-placement.png'),fullPage:false});
    await p.close();
  }

  await page.bringToFront();
  await page.locator('[data-v38-clear="homepage-hero"]').click();
  await page.waitForFunction(()=>!window.NSV421Store?.load()?.sectionMedia?.['homepage-hero']);
  must((await page.locator('#apV38ImageTargets').innerText()).includes('Default image'),'Use default did not restore default status');
  must(!errors.length,`admin page errors: ${errors.join(' | ')}`);
  console.log('SECTION MEDIA PLACEMENT QA: PASS');
  await context.close();
} finally {
  await browser.close();
  server.kill();
}
