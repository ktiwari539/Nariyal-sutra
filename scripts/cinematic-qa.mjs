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
  async function auditCinematic(viewport,label){
    const page=await browser.newPage({viewport});
    await page.goto(`${BASE}/index.html?qa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(1200);

    const boot=await page.evaluate(()=>{
      document.documentElement.style.scrollBehavior='auto';
      const film=document.querySelector('#v20-story-film');
      const drops=[...document.querySelectorAll('#v20-rain .v421-photo-rain')];
      const visible=el=>!!el && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden' && Number(getComputedStyle(el).opacity||1)>.01;
      const widths=drops.map(x=>x.getBoundingClientRect().width);
      return {
        drops:drops.length,
        declared:document.querySelector('#v20-rain')?.dataset.nsRainCount||'',
        sourceOk:drops.filter(x=>/green-round-coconut\.jpg/i.test(x.getAttribute('src')||'')).length,
        maxRainWidth:widths.length?Math.max(...widths):0,
        filmHeight:film?.offsetHeight||0,
        viewport:innerHeight,
        recovery:window.NSV421Cinematic?.version||'',
        build:window.NS_V421_BUILD||'',
        oldRainVisible:[...document.querySelectorAll('.v21-real-rain')].filter(visible).length,
        legacyHeroVisible:visible(document.querySelector('#v20-story-coconut')),
        legacyKnifeVisible:[...document.querySelectorAll('.v20-knife,.knife.v20-knife')].some(visible),
        legacyStreamVisible:[...document.querySelectorAll('.water-stream')].some(visible),
        productStage:!!document.querySelector('.v421-product-stage'),
        safeKnife:!!document.querySelector('.v421-knife'),
        pourFrame:document.querySelector('.v421-pour-frame img')?.getAttribute('src')||''
      };
    });
    checks.push({scope:`cinematic:${label}:boot`,...boot});
    if(boot.drops!==35) fail(`cinematic:${label}:boot`,`expected 35 falling coconuts, found ${boot.drops}`);
    if(boot.sourceOk!==35) fail(`cinematic:${label}:boot`,`expected 35 green-round-coconut rain assets, found ${boot.sourceOk}`);
    if(boot.maxRainWidth>132) fail(`cinematic:${label}:boot`,`rain coconut became oversized (${boot.maxRainWidth.toFixed(1)}px)`);
    if(boot.oldRainVisible) fail(`cinematic:${label}:boot`,`${boot.oldRainVisible} legacy rain layers still visible`);
    if(boot.legacyHeroVisible) fail(`cinematic:${label}:boot`,'malformed legacy story-coconut composite is visible');
    if(boot.legacyKnifeVisible) fail(`cinematic:${label}:boot`,'oversized legacy knife is visible');
    if(boot.legacyStreamVisible) fail(`cinematic:${label}:boot`,'legacy synthetic water beam is visible');
    if(!boot.productStage||!boot.safeKnife) fail(`cinematic:${label}:boot`,'safe product/knife stage did not initialize');
    if(!/freshness-coconut-splash\.webp/i.test(boot.pourFrame)) fail(`cinematic:${label}:boot`,`wrong pour frame: ${boot.pourFrame}`);
    if(boot.filmHeight<boot.viewport*4.7) fail(`cinematic:${label}:boot`,`cinematic runway too short: ${boot.filmHeight}px`);
    if(boot.recovery!=='v421-photo-safe') fail(`cinematic:${label}:boot`,`photo-safe runtime did not initialize (${boot.recovery})`);

    async function setProgress(p,name){
      await page.evaluate(p=>{
        document.documentElement.style.scrollBehavior='auto';
        const film=document.querySelector('#v20-story-film');
        const top=film.getBoundingClientRect().top+window.scrollY;
        const range=Math.max(1,film.offsetHeight-innerHeight);
        window.scrollTo({top:top+range*p,left:0,behavior:'auto'});
        window.NSV421Cinematic?.update?.();
        window.dispatchEvent(new Event('scroll'));
      },p);
      await page.waitForTimeout(340);
      const state=await page.evaluate(()=>{
        window.NSV421Cinematic?.update?.();
        const film=document.querySelector('#v20-story-film');
        const drops=[...document.querySelectorAll('#v20-rain .v421-photo-rain')];
        const visibleDrops=drops.filter(x=>Number(getComputedStyle(x).opacity)>.12 && getComputedStyle(x).display!=='none').length;
        const source=document.querySelector('#v20-rain .v421-photo-rain.is-source');
        const selected=document.querySelector('.v421-product-stage');
        const knife=document.querySelector('.v421-knife');
        const pour=document.querySelector('.v421-pour-frame');
        const legacyHero=document.querySelector('#v20-story-coconut');
        const legacyKnife=document.querySelector('.v20-knife,.knife.v20-knife');
        const legacyStream=document.querySelector('.water-stream');
        const rect=el=>el?el.getBoundingClientRect():null;
        const opacity=el=>el?Number(getComputedStyle(el).opacity||0):0;
        const isVisible=el=>!!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&opacity(el)>.01;
        return {
          visibleDrops,
          sourceOpacity:opacity(source),
          selectedOpacity:opacity(selected),
          selectedRect:rect(selected),
          knifeOpacity:opacity(knife),
          knifeRect:rect(knife),
          pourOpacity:opacity(pour),
          legacyHeroVisible:isVisible(legacyHero),
          legacyKnifeVisible:isVisible(legacyKnife),
          legacyStreamVisible:isVisible(legacyStream),
          actualProgress:(()=>{const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return Math.max(0,Math.min(1,-r.top/range));})()
        };
      });
      checks.push({scope:`cinematic:${label}:${name}`,progress:p,...state});
      await page.screenshot({path:path.join(OUT,`cinematic-${label}-${name}.png`),fullPage:false});
      if(state.legacyHeroVisible||state.legacyKnifeVisible||state.legacyStreamVisible){
        fail(`cinematic:${label}:${name}`,'a known broken legacy composite/knife/stream became visible');
      }
      return state;
    }

    const rain=await setProgress(.34,'rain');
    if(rain.visibleDrops<24) fail(`cinematic:${label}:rain`,`dense rain not visible enough (${rain.visibleDrops}/35)`);

    const dense=await setProgress(.53,'dense-harvest');
    if(dense.visibleDrops<28) fail(`cinematic:${label}:dense-harvest`,`full harvest does not hold (${dense.visibleDrops}/35)`);

    const one=await setProgress(.64,'one-remains');
    if(one.selectedOpacity<.15) fail(`cinematic:${label}:one-remains`,'selected photographic fruit is not visible');
    if(one.visibleDrops>4) fail(`cinematic:${label}:one-remains`,`too many rain coconuts remain visible (${one.visibleDrops})`);
    if(one.selectedRect && (one.selectedRect.width>300||one.selectedRect.height>390)) fail(`cinematic:${label}:one-remains`,`selected fruit is oversized (${one.selectedRect.width.toFixed(0)}x${one.selectedRect.height.toFixed(0)})`);

    const cut=await setProgress(.82,'knife-cut');
    if(cut.knifeOpacity<.2) fail(`cinematic:${label}:knife-cut`,`safe knife is not visibly active (${cut.knifeOpacity})`);
    if(cut.selectedOpacity<.15) fail(`cinematic:${label}:knife-cut`,'selected fruit is not visible during cut');
    if(cut.knifeRect && cut.knifeRect.width>300) fail(`cinematic:${label}:knife-cut`,`knife is oversized (${cut.knifeRect.width.toFixed(0)}px)`);

    const pour=await setProgress(.91,'water-pour');
    if(pour.pourOpacity<.25) fail(`cinematic:${label}:water-pour`,`photographic pour is not visibly active (${pour.pourOpacity})`);

    await page.close();
  }

  await auditCinematic({width:1440,height:900},'desktop');
  await auditCinematic({width:1024,height:768},'laptop');

  const page=await browser.newPage({viewport:{width:1440,height:900}});

  await page.goto(`${BASE}/index.html?tradeqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(950);
  const homeTrade=await page.evaluate(()=>({
    promise:document.querySelector('.promise-portal.export img')?.getAttribute('src')||'',
    route:document.querySelector('.trade-route.trade-export img')?.getAttribute('src')||''
  }));
  checks.push({scope:'trade:homepage',...homeTrade});
  if(!homeTrade.promise.includes('trade-logistics.svg')) fail('trade:homepage',`wrong promise image: ${homeTrade.promise}`);
  if(!homeTrade.route.includes('trade-logistics.svg')) fail('trade:homepage',`wrong trade-route image: ${homeTrade.route}`);

  await page.goto(`${BASE}/about-nariyal-sutra.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(500);
  const aboutTrade=await page.$eval('#export img',img=>img.getAttribute('src')||'').catch(()=>null);
  checks.push({scope:'trade:story-card',src:aboutTrade});
  if(!aboutTrade||!aboutTrade.includes('trade-logistics.svg')) fail('trade:story-card',`wrong International Trade image: ${aboutTrade}`);
  await page.$eval('#export',el=>el.scrollIntoView({block:'center',behavior:'auto'})).catch(()=>{});
  await page.waitForTimeout(100);
  await page.screenshot({path:path.join(OUT,'trade-story-card.png'),fullPage:false});

  await page.goto(`${BASE}/coconut-wholesale-export.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(500);
  const trade=await page.evaluate(()=>({
    hero:document.querySelector('.w-hero-media img')?.getAttribute('src')||'',
    route:document.querySelector('.route-map img')?.getAttribute('src')||''
  }));
  checks.push({scope:'trade:export-page',...trade});
  if(!trade.hero.includes('trade-logistics.svg')) fail('trade:export-page',`wrong export hero: ${trade.hero}`);
  if(!trade.route.includes('trade-logistics.svg')) fail('trade:export-page',`wrong route visual: ${trade.route}`);
  await page.screenshot({path:path.join(OUT,'trade-export-page.png'),fullPage:false});

  await page.goto(`${BASE}/freshness-first.html?freshqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(600);
  const freshness=await page.evaluate(()=>[...document.querySelectorAll('.v23-water-card img')].map(x=>x.getAttribute('src')||''));
  checks.push({scope:'freshness:sequence',sources:freshness});
  const expected=['green-round-coconut.jpg','nariyal-premium-hero.webp','freshness-coconut-splash.webp'];
  expected.forEach((name,i)=>{if(!freshness[i]?.includes(name))fail('freshness:sequence',`card ${i+1} should use ${name}, got ${freshness[i]||'missing'}`)});
  if(new Set(freshness).size!==freshness.length) fail('freshness:sequence','Freshness cards repeat the same image source');
  await page.$eval('.v23-water-sequence',el=>el.scrollIntoView({block:'center',behavior:'auto'})).catch(()=>{});
  await page.waitForTimeout(120);
  await page.screenshot({path:path.join(OUT,'freshness-sequence.png'),fullPage:false});

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
  'Screenshots include desktop + 1024px laptop rain, dense harvest, one-remains, knife-cut, water-pour, International Trade, and Freshness sequence.'
].join('\n');
fs.writeFileSync(path.join(OUT,'cinematic-qa-summary.md'),summary);
console.log(summary);
if(failures.length)process.exit(1);