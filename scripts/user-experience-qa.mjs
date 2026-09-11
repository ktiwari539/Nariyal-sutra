import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve('qa-artifacts');fs.mkdirSync(OUT,{recursive:true});
const failures=[];const fail=m=>failures.push(m);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(BASE+'/?ux='+Date.now(),{waitUntil:'domcontentloaded'});await page.waitForTimeout(900);
  const intro=await page.evaluate(()=>{const i=document.querySelector('#jungle-intro'),title=i?.querySelector('.ji-logo');const s=i?getComputedStyle(i):null;return{exists:!!i,visible:!!i&&s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.1,title:(title?.textContent||'').trim()}});
  if(!intro.exists||!intro.visible||!intro.title.match(/NARIYAL/i))fail('Branded Nariyal Sutra intro is not visibly present on first load.');
  await page.screenshot({path:path.join(OUT,'user-intro-desktop.png')});
  await page.waitForTimeout(4300);
  const products=await page.evaluate(()=>['tender','green','bulk'].map(k=>{const img=document.querySelector(`[data-product-card="${k}"] .pc-img-wrap img`);return img?new URL(img.currentSrc||img.src,location.href).pathname:''}));
  if(new Set(products.filter(Boolean)).size!==3)fail('Product cards do not use three distinct images: '+products.join(', '));
  const film=page.locator('#v20-story-film');
  await film.scrollIntoViewIfNeeded();
  const box=await film.boundingBox();
  if(!box)fail('Cinematic film is missing.');
  else {
    const filmTop=await page.evaluate(()=>{const f=document.querySelector('#v20-story-film');return f.getBoundingClientRect().top+scrollY});
    const filmH=await page.evaluate(()=>document.querySelector('#v20-story-film').offsetHeight);
    const range=Math.max(1,filmH-900);
    const seen={rain:false,selected:false,knife:false,splash:false,water:false};
    for(let y=0;y<=range;y+=Math.max(80,Math.round(range/30))){
      await page.evaluate(v=>scrollTo({top:v,behavior:'auto'}),filmTop+y);await page.waitForTimeout(90);
      const s=await page.evaluate(()=>{window.NSV421CinematicFinal?.update?.();const x=window.__NS_V421_CINEMATIC_STATE||{};const op=q=>{const e=document.querySelector(q);return e?+getComputedStyle(e).opacity||0:0};return{rain:x.visibleRain||0,selected:x.selected||0,knife:op('.v421-local-knife'),splash:x.splash||0,water:op('.v421-water-finish')}});
      if(s.rain>=5)seen.rain=true;if(s.selected>.2)seen.selected=true;if(s.knife>.12)seen.knife=true;if(s.splash>.12)seen.splash=true;if(s.water>.2)seen.water=true;
    }
    for(const [k,v] of Object.entries(seen))if(!v)fail('Normal scrolling did not visibly reach cinematic stage: '+k);
    await page.screenshot({path:path.join(OUT,'user-cinematic-normal-scroll.png')});
  }
  const admin=await browser.newPage({viewport:{width:1440,height:900}});
  await admin.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded'});await admin.waitForTimeout(700);
  const a=await admin.evaluate(()=>({title:document.title,command:!!document.querySelector('.ap-app'),sidebar:!!document.querySelector('#apSidebar'),ownerPortal:document.body.innerText.includes('Order command center.')}));
  if(!a.command||!a.sidebar||a.ownerPortal)fail('Business Command Center admin-preview is not the active local Admin.');
  await admin.screenshot({path:path.join(OUT,'user-admin-business-command-center.png')});
  await admin.close();await page.close();
}finally{await browser.close();}
fs.writeFileSync(path.join(OUT,'user-experience-qa.json'),JSON.stringify({failures},null,2));
console.log(failures.length?'USER EXPERIENCE QA FAIL:\n- '+failures.join('\n- '):'USER EXPERIENCE QA: PASS');
if(failures.length)process.exit(1);
