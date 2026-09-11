import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync('qa-artifacts',{recursive:true});
await sleep(1200);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

try {
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#v421-story-film[data-rebuilt="1"]',{state:'attached',timeout:20000});
  await page.waitForFunction(()=>window.__NS_V421_CINEMATIC_REBUILD && Number.isFinite(window.__NS_V421_CINEMATIC_REBUILD.progress),null,{timeout:20000});

  const film=page.locator('#v421-story-film');
  if(await film.count()!==1) throw new Error('film missing');
  const rebuilt=await film.getAttribute('data-rebuilt');
  if(rebuilt!=='1') throw new Error('rebuilt cinematic did not initialize');

  const metrics=await film.evaluate(el=>({top:el.offsetTop,height:el.offsetHeight,viewport:innerHeight}));
  const range=metrics.height-metrics.viewport;
  if(range<metrics.viewport*.75) throw new Error(`cinematic scroll range too short: ${range}`);

  const points=[0,.10,.18,.26,.34,.42,.50,.58,.64,.70,.76,.82,.88,.94,1];
  const states=[];
  const shots=new Set([.26,.50,.64,.76,.94]);
  for(const p of points){
    await page.evaluate(({top,range,p})=>scrollTo(0,top+range*p),{top:metrics.top,range,p});
    await page.waitForTimeout(180);
    const state=await page.evaluate(()=>window.__NS_V421_CINEMATIC_REBUILD||{});
    states.push({...state,sample:p});
    if(shots.has(p)) await page.screenshot({path:`qa-artifacts/cinematic-${String(Math.round(p*100)).padStart(2,'0')}.png`,fullPage:false});
  }

  const max=k=>Math.max(...states.map(s=>Number(s[k]||0)));
  const checks={
    rain:max('rain')>=.8,
    hero:max('hero')>.45,
    knife:max('knife')>.55,
    splash:max('splash')>.55,
    water:max('water')>.9
  };
  for(const [k,v] of Object.entries(checks)) if(!v) throw new Error(`${k} stage not reached`);

  const stage=page.locator('#v421-story-film .v421-cine-stage');
  const stageBox=await stage.boundingBox();
  if(!stageBox || stageBox.height<850 || stageBox.width<1300) throw new Error(`cinematic stage collapsed: ${JSON.stringify(stageBox)}`);

  await page.evaluate(({top,range})=>scrollTo(0,top+range*.94),{top:metrics.top,range});
  await page.waitForTimeout(180);
  const waterCoverage=await page.evaluate(()=>{
    const el=document.querySelector('#v421-story-film .v421-water');
    if(!el) return null;
    const r=el.getBoundingClientRect();
    const cs=getComputedStyle(el);
    return {top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height,opacity:Number(cs.opacity),viewport:{w:innerWidth,h:innerHeight}};
  });
  if(!waterCoverage || waterCoverage.opacity<.8 || waterCoverage.width<waterCoverage.viewport.w*.95 || waterCoverage.height<waterCoverage.viewport.h*.95) {
    throw new Error(`water does not visually cover viewport: ${JSON.stringify(waterCoverage)}`);
  }

  if(errors.length) throw new Error('page errors: '+errors.join(' | '));
  console.log(JSON.stringify({checks,metrics,waterCoverage,states:states.map(s=>({sample:s.sample,progress:s.progress,rain:s.rain,hero:s.hero,knife:s.knife,splash:s.splash,water:s.water}))},null,2));
  console.log('CINEMATIC REBUILD QA: PASS');
} finally {
  await browser.close();
  server.kill();
}
