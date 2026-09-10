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
    await page.waitForTimeout(1700);

    const boot=await page.evaluate(()=>{
      document.documentElement.style.scrollBehavior='auto';
      const film=document.querySelector('#v20-story-film');
      const items=[...document.querySelectorAll('.v421-final-coconut')];
      const fruitImages=[...document.querySelectorAll('.v421-final-coconut img')];
      const visible=el=>!!el && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden' && Number(getComputedStyle(el).opacity||1)>.01;
      const widths=items.map(x=>x.getBoundingClientRect().width);
      return {
        items:items.length,
        fruitImages:fruitImages.length,
        maxRainWidth:widths.length?Math.max(...widths):0,
        filmHeight:film?.offsetHeight||0,
        viewport:innerHeight,
        runtime:window.NSV421CinematicFinal?.version||'',
        build:window.NS_V421_BUILD||'',
        oldRainVisible:[...document.querySelectorAll('.v21-real-rain,#v20-rain .v421-rain-item')].filter(visible).length,
        legacyHeroVisible:visible(document.querySelector('#v20-story-coconut')),
        legacyKnifeVisible:[...document.querySelectorAll('.v20-knife,.knife.v20-knife')].some(visible),
        legacyStreamVisible:[...document.querySelectorAll('.water-stream')].some(visible),
        selected:!!document.querySelector('.v421-final-selected'),
        knife:!!document.querySelector('.v421-final-knife'),
        droplets:document.querySelectorAll('.v421-final-drop').length,
        waterFrame:document.querySelector('.v421-final-water img')?.getAttribute('src')||''
      };
    });
    checks.push({scope:`cinematic:${label}:boot`,...boot});
    if(boot.items!==100) fail(`cinematic:${label}:boot`,`expected 100 rain coconuts, found ${boot.items}`);
    if(boot.fruitImages!==100) fail(`cinematic:${label}:boot`,`expected 100 photographic coconut images, found ${boot.fruitImages}`);
    if(boot.maxRainWidth>90) fail(`cinematic:${label}:boot`,`rain coconut became oversized (${boot.maxRainWidth.toFixed(1)}px)`);
    if(boot.oldRainVisible) fail(`cinematic:${label}:boot`,`${boot.oldRainVisible} older rain layers still visible`);
    if(boot.legacyHeroVisible) fail(`cinematic:${label}:boot`,'malformed legacy story-coconut composite is visible');
    if(boot.legacyKnifeVisible) fail(`cinematic:${label}:boot`,'oversized legacy knife is visible');
    if(boot.legacyStreamVisible) fail(`cinematic:${label}:boot`,'legacy synthetic water beam is visible');
    if(!boot.selected||!boot.knife) fail(`cinematic:${label}:boot`,'final selected-fruit/knife stage did not initialize');
    if(boot.droplets<10) fail(`cinematic:${label}:boot`,`final splash field is incomplete (${boot.droplets} droplets)`);
    if(!/freshness-coconut-splash\.webp/i.test(boot.waterFrame)) fail(`cinematic:${label}:boot`,`wrong water finish frame: ${boot.waterFrame}`);
    const ratio=boot.filmHeight/Math.max(1,boot.viewport);
    if(ratio<2.75||ratio>3.25) fail(`cinematic:${label}:boot`,`cinematic runway should be ~300vh, got ${ratio.toFixed(2)}x viewport`);
    if(boot.runtime!=='100-rain-cut-water') fail(`cinematic:${label}:boot`,`final 100-coconut runtime did not initialize (${boot.runtime})`);

    async function setProgress(p,name){
      await page.evaluate(p=>{
        document.documentElement.style.scrollBehavior='auto';
        const film=document.querySelector('#v20-story-film');
        const top=film.getBoundingClientRect().top+window.scrollY;
        const range=Math.max(1,film.offsetHeight-innerHeight);
        window.scrollTo({top:top+range*p,left:0,behavior:'auto'});
        window.NSV421CinematicFinal?.update?.();
        window.dispatchEvent(new Event('scroll'));
      },p);
      await page.waitForTimeout(380);
      const state=await page.evaluate(()=>{
        window.NSV421CinematicFinal?.update?.();
        const film=document.querySelector('#v20-story-film');
        const items=[...document.querySelectorAll('.v421-final-coconut')];
        const visibleItems=items.filter(x=>Number(getComputedStyle(x).opacity)>.12 && getComputedStyle(x).display!=='none').length;
        const selected=document.querySelector('.v421-final-selected');
        const knife=document.querySelector('.v421-final-knife');
        const water=document.querySelector('.v421-final-water');
        const droplets=[...document.querySelectorAll('.v421-final-drop')];
        const legacyHero=document.querySelector('#v20-story-coconut');
        const legacyKnife=document.querySelector('.v20-knife,.knife.v20-knife');
        const legacyStream=document.querySelector('.water-stream');
        const rect=el=>el?el.getBoundingClientRect():null;
        const opacity=el=>el?Number(getComputedStyle(el).opacity||0):0;
        const isVisible=el=>!!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&opacity(el)>.01;
        return {
          visibleItems,
          selectedOpacity:opacity(selected),selectedRect:rect(selected),
          knifeOpacity:opacity(knife),knifeRect:rect(knife),
          waterOpacity:opacity(water),
          visibleDroplets:droplets.filter(x=>opacity(x)>.12).length,
          maxDropletOpacity:droplets.length?Math.max(...droplets.map(opacity)):0,
          legacyHeroVisible:isVisible(legacyHero),legacyKnifeVisible:isVisible(legacyKnife),legacyStreamVisible:isVisible(legacyStream),
          actualProgress:(()=>{const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return Math.max(0,Math.min(1,-r.top/range));})()
        };
      });
      checks.push({scope:`cinematic:${label}:${name}`,progress:p,...state});
      await page.screenshot({path:path.join(OUT,`cinematic-${label}-${name}.png`),fullPage:false});
      if(state.legacyHeroVisible||state.legacyKnifeVisible||state.legacyStreamVisible) fail(`cinematic:${label}:${name}`,'a known broken legacy composite/knife/stream became visible');
      return state;
    }

    const rain=await setProgress(.25,'rain');
    if(rain.visibleItems<70) fail(`cinematic:${label}:rain`,`100-coconut rain not visible enough (${rain.visibleItems}/100)`);

    const dense=await setProgress(.39,'dense-harvest');
    if(dense.visibleItems<70) fail(`cinematic:${label}:dense-harvest`,`dense harvest does not hold (${dense.visibleItems}/100)`);

    const one=await setProgress(.50,'one-remains');
    if(one.selectedOpacity<.2) fail(`cinematic:${label}:one-remains`,'selected photographic coconut is not visible');
    if(one.visibleItems>5) fail(`cinematic:${label}:one-remains`,`too many rain coconuts remain visible (${one.visibleItems})`);
    if(one.selectedRect && (one.selectedRect.width>245||one.selectedRect.height>310)) fail(`cinematic:${label}:one-remains`,`selected coconut is oversized (${one.selectedRect.width.toFixed(0)}x${one.selectedRect.height.toFixed(0)})`);

    const cut=await setProgress(.67,'knife-cut');
    if(cut.knifeOpacity<.18) fail(`cinematic:${label}:knife-cut`,`knife is not visibly active (${cut.knifeOpacity})`);
    if(cut.selectedOpacity<.15) fail(`cinematic:${label}:knife-cut`,'selected coconut is not visible during cut');
    if(cut.knifeRect && cut.knifeRect.width>235) fail(`cinematic:${label}:knife-cut`,`knife is oversized (${cut.knifeRect.width.toFixed(0)}px)`);

    const splash=await setProgress(.76,'splash');
    if(splash.visibleDroplets<5) fail(`cinematic:${label}:splash`,`too few visible droplets (${splash.visibleDroplets})`);
    if(splash.maxDropletOpacity<.25) fail(`cinematic:${label}:splash`,`droplets are too faint (${splash.maxDropletOpacity})`);

    await setProgress(.60,'pre-fast-jump');
    const fastSplash=await setProgress(.76,'fast-jump-splash');
    if(fastSplash.visibleDroplets<5) fail(`cinematic:${label}:fast-jump-splash`,`fast scroll skipped splash (${fastSplash.visibleDroplets} droplets)`);

    const water=await setProgress(.88,'water-pour');
    if(water.waterOpacity<.25) fail(`cinematic:${label}:water-pour`,`photographic water finish is not visibly active (${water.waterOpacity})`);

    await page.close();
  }

  await auditCinematic({width:1440,height:900},'desktop');
  await auditCinematic({width:1024,height:768},'laptop');

  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(`${BASE}/index.html?tradeqa=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(950);
  const homeTrade=await page.evaluate(()=>({promise:document.querySelector('.promise-portal.export img')?.getAttribute('src')||'',route:document.querySelector('.trade-route.trade-export img')?.getAttribute('src')||''}));
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
  const trade=await page.evaluate(()=>({hero:document.querySelector('.w-hero-media img')?.getAttribute('src')||'',route:document.querySelector('.route-map img')?.getAttribute('src')||''}));
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
} finally {await browser.close();}

const report={generatedAt:new Date().toISOString(),failures,checks};
fs.writeFileSync(path.join(OUT,'cinematic-qa-report.json'),JSON.stringify(report,null,2));
const summary=['# Cinematic + semantic image QA','',`Failures: ${failures.length}`,'',...(failures.length?failures.map(x=>`- **${x.scope}** — ${x.msg}`):['- None']),'','Screenshots include desktop + 1024px laptop 100-coconut rain, dense harvest, selected coconut, knife, visible splash, fast-jump splash, photographic water finish, International Trade, and Freshness sequence.'].join('\n');
fs.writeFileSync(path.join(OUT,'cinematic-qa-summary.md'),summary);
console.log(summary);
if(failures.length)process.exit(1);
