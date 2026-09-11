import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve('qa-artifacts');fs.mkdirSync(OUT,{recursive:true});
const failures=[];const observations={};const fail=m=>failures.push(m);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(BASE+'/?ux='+Date.now(),{waitUntil:'domcontentloaded'});await page.waitForTimeout(1000);
  observations.intro=await page.evaluate(()=>{const i=document.querySelector('#jungle-intro'),title=i?.querySelector('.ji-logo');const s=i?getComputedStyle(i):null;return{exists:!!i,visible:!!i&&s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.1,title:(title?.textContent||'').trim()}});
  if(!observations.intro.exists||!observations.intro.visible||!observations.intro.title.match(/NARIYAL/i))fail('Branded Nariyal Sutra intro is not visibly present on first load.');
  await page.screenshot({path:path.join(OUT,'user-intro-desktop.png')});
  await page.waitForTimeout(4300);

  observations.products=await page.evaluate(()=>['tender','green','bulk'].map(k=>{const img=document.querySelector(`[data-product-card="${k}"] .pc-img-wrap img`);return img?new URL(img.currentSrc||img.src,location.href).pathname:''}));
  if(new Set(observations.products.filter(Boolean)).size!==3)fail('Product cards do not use three distinct images: '+observations.products.join(', '));

  const film=page.locator('#v20-story-film');await film.scrollIntoViewIfNeeded();
  const filmBox=await film.boundingBox();
  if(!filmBox)fail('Cinematic film is missing.');
  else {
    const metrics=await page.evaluate(()=>{const f=document.querySelector('#v20-story-film'),top=f.getBoundingClientRect().top+scrollY;return{top,height:f.offsetHeight,viewport:innerHeight}});
    const range=Math.max(1,metrics.height-metrics.viewport);
    observations.filmMetrics={...metrics,range};
    const seen={rain:false,selected:false,knife:false,splash:false,water:false};
    const maxima={progress:0,rain:0,selected:0,knife:0,splash:0,water:0};
    let shot={knife:false,splash:false,water:false};
    const steps=48;
    for(let n=0;n<=steps;n++){
      const y=Math.round(range*n/steps);
      await page.evaluate(v=>scrollTo({top:v,behavior:'auto'}),metrics.top+y);await page.waitForTimeout(110);
      const s=await page.evaluate(()=>{
        window.NSV421CinematicFinal?.update?.();
        const x=window.__NS_V421_CINEMATIC_STATE||{};
        const visible=q=>{const e=document.querySelector(q);if(!e)return{exists:false,opacity:0,display:'none',w:0,h:0};const c=getComputedStyle(e),r=e.getBoundingClientRect();return{exists:true,opacity:+c.opacity||0,display:c.display,w:r.width,h:r.height}};
        return{progress:+x.progress||0,rain:+x.visibleRain||0,selected:+x.selected||0,knife:+x.knife||0,splash:+x.splash||0,water:+x.water||0,knifeEl:visible('.v421-final-stage .v421-local-knife'),waterEl:visible('.v421-final-stage .v421-water-finish'),dropEl:visible('.v421-final-stage .v421-water-drop')};
      });
      for(const k of Object.keys(maxima))maxima[k]=Math.max(maxima[k],+s[k]||0);
      if(s.rain>=5)seen.rain=true;
      if(s.selected>.2)seen.selected=true;
      if(s.knife>.2 && s.knifeEl.exists && s.knifeEl.display!=='none' && s.knifeEl.w>100)seen.knife=true;
      if(s.splash>.15 && s.dropEl.exists && s.dropEl.display!=='none')seen.splash=true;
      if(s.water>.2 && s.waterEl.exists && s.waterEl.display!=='none' && s.waterEl.w>500)seen.water=true;
      if(seen.knife&&!shot.knife){shot.knife=true;await page.screenshot({path:path.join(OUT,'cinematic-knife.png')});}
      if(seen.splash&&!shot.splash){shot.splash=true;await page.screenshot({path:path.join(OUT,'cinematic-splash.png')});}
      if(seen.water&&!shot.water){shot.water=true;await page.screenshot({path:path.join(OUT,'cinematic-water-finish.png')});}
    }
    observations.cinematic={seen,maxima};
    for(const [k,v] of Object.entries(seen))if(!v)fail(`Normal scrolling did not visibly reach cinematic stage: ${k} (max=${maxima[k]})`);
  }

  const admin=await browser.newPage({viewport:{width:1440,height:900}});
  await admin.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded'});await admin.waitForTimeout(900);
  observations.admin=await admin.evaluate(()=>({title:document.title,command:!!document.querySelector('.ap-app'),sidebar:!!document.querySelector('#apSidebar'),label:(document.querySelector('.ap-brand-copy span')?.textContent||'').trim()}));
  if(!observations.admin.command||!observations.admin.sidebar||!observations.admin.label.includes('Business Command Center'))fail('Business Command Center admin-preview is not the active local Admin.');
  await admin.screenshot({path:path.join(OUT,'user-admin-business-command-center.png')});
  await admin.close();await page.close();
}finally{await browser.close();}
fs.writeFileSync(path.join(OUT,'user-experience-qa.json'),JSON.stringify({failures,observations},null,2));
console.log(JSON.stringify(observations,null,2));
console.log(failures.length?'USER EXPERIENCE QA FAIL:\n- '+failures.join('\n- '):'USER EXPERIENCE QA: PASS');
if(failures.length)process.exit(1);
