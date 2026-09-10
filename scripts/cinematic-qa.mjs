import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE=process.env.NS_QA_BASE||'http://127.0.0.1:4173';
const OUT=path.resolve(process.env.NS_QA_OUT||'qa-artifacts');
fs.mkdirSync(OUT,{recursive:true});
const failures=[];
const checks=[];
const fail=(scope,msg)=>failures.push({scope,msg});

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(`${BASE}/index.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(900);

  const boot=await page.evaluate(()=>{
    const film=document.querySelector('#v20-story-film');
    const drops=[...document.querySelectorAll('#v20-rain .v25-rain-coconut')];
    return {
      drops:drops.length,
      declared:document.querySelector('#v20-rain')?.dataset.nsRainCount||'',
      filmHeight:film?.offsetHeight||0,
      viewport:innerHeight,
      recovery:window.NSV421Cinematic?.version||'',
      oldRain:document.querySelectorAll('.v21-real-rain').length
    };
  });
  checks.push({scope:'cinematic:boot',...boot});
  if(boot.drops!==35) fail('cinematic:boot',`expected 35 falling coconuts, found ${boot.drops}`);
  if(boot.oldRain!==0) fail('cinematic:boot',`legacy rectangular rain layer still exists (${boot.oldRain})`);
  if(boot.filmHeight<boot.viewport*4.7) fail('cinematic:boot',`cinematic runway too short: ${boot.filmHeight}px`);
  if(boot.recovery!=='v27-restored') fail('cinematic:boot','V27 recovery runtime did not initialize');

  async function setProgress(p,name){
    await page.evaluate(p=>{
      const film=document.querySelector('#v20-story-film');
      const top=film.getBoundingClientRect().top+scrollY;
      const range=Math.max(1,film.offsetHeight-innerHeight);
      scrollTo(0,top+range*p);
    },p);
    await page.waitForTimeout(180);
    const state=await page.evaluate(()=>{
      const film=document.querySelector('#v20-story-film');
      const drops=[...document.querySelectorAll('#v20-rain .v25-rain-coconut')];
      const visibleDrops=drops.filter(x=>Number(getComputedStyle(x).opacity)>.12).length;
      const source=document.querySelector('#v20-rain .v25-rain-coconut.is-source');
      const vars=getComputedStyle(film);
      return {
        visibleDrops,
        sourceOpacity:source?Number(getComputedStyle(source).opacity):0,
        heroAlpha:Number(vars.getPropertyValue('--hero-alpha')||0),
        knifeAlpha:Number(vars.getPropertyValue('--knife-alpha')||0),
        streamAlpha:Number(vars.getPropertyValue('--stream-alpha')||0),
        waterAlpha:Number(vars.getPropertyValue('--water-alpha')||0)
      };
    });
    checks.push({scope:`cinematic:${name}`,progress:p,...state});
    await page.screenshot({path:path.join(OUT,`cinematic-${name}.png`),fullPage:false});
    return state;
  }

  const rain=await setProgress(.34,'rain');
  if(rain.visibleDrops<24) fail('cinematic:rain',`dense rain not visible enough (${rain.visibleDrops}/35)`);

  const dense=await setProgress(.53,'dense-harvest');
  if(dense.visibleDrops<28) fail('cinematic:dense-harvest',`full harvest does not hold (${dense.visibleDrops}/35)`);

  const one=await setProgress(.61,'one-remains');
  if(one.sourceOpacity<.15) fail('cinematic:one-remains','selected source coconut is not visible');
  if(one.visibleDrops>8) fail('cinematic:one-remains',`too many coconuts remain visible (${one.visibleDrops})`);

  const cut=await setProgress(.82,'knife-cut');
  if(cut.knifeAlpha<.25) fail('cinematic:knife-cut',`knife is not visibly active (${cut.knifeAlpha})`);
  if(cut.heroAlpha<.15) fail('cinematic:knife-cut','selected cutting coconut is not visible');

  const pour=await setProgress(.91,'water-pour');
  if(pour.streamAlpha<.2) fail('cinematic:water-pour',`water stream is not visibly active (${pour.streamAlpha})`);

  await page.goto(`${BASE}/about-nariyal-sutra.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(450);
  const aboutTrade=await page.$eval('#export img',img=>img.getAttribute('src')||'').catch(()=>null);
  checks.push({scope:'trade:story-card',src:aboutTrade});
  if(!aboutTrade||!aboutTrade.includes('trade-logistics.svg')) fail('trade:story-card',`wrong International Trade image: ${aboutTrade}`);
  await page.screenshot({path:path.join(OUT,'trade-story-card.png'),fullPage:false});

  await page.goto(`${BASE}/coconut-wholesale-export.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(450);
  const trade=await page.evaluate(()=>({
    hero:document.querySelector('.w-hero-media img')?.getAttribute('src')||'',
    route:document.querySelector('.route-map img')?.getAttribute('src')||''
  }));
  checks.push({scope:'trade:export-page',...trade});
  if(!trade.hero.includes('trade-logistics.svg')) fail('trade:export-page',`wrong export hero: ${trade.hero}`);
  if(!trade.route.includes('trade-logistics.svg')) fail('trade:export-page',`wrong route visual: ${trade.route}`);
  await page.screenshot({path:path.join(OUT,'trade-export-page.png'),fullPage:false});

  await page.close();
} finally {
  await browser.close();
}

const report={generatedAt:new Date().toISOString(),failures,checks};
fs.writeFileSync(path.join(OUT,'cinematic-qa-report.json'),JSON.stringify(report,null,2));
const summary=[
  '# Cinematic + semantic image QA','',
  `Failures: ${failures.length}`,'',
  ...(failures.length?failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'',
  'Screenshots: cinematic-rain, cinematic-dense-harvest, cinematic-one-remains, cinematic-knife-cut, cinematic-water-pour, trade-story-card, trade-export-page.'
].join('\n');
fs.writeFileSync(path.join(OUT,'cinematic-qa-summary.md'),summary);
console.log(summary);
if(failures.length)process.exit(1);
