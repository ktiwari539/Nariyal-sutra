import { chromium, webkit } from 'playwright';
const engines=[['chromium',chromium],['webkit',webkit]];
const sizes=[['desktop',1440,900],['tablet',1024,768],['mobile',390,844]];
async function seek(page,target){
  for(let i=0;i<8;i++){
    const before=await page.evaluate((t)=>{
      const s=document.querySelector('#ns-film42');
      const range=Math.max(1,s.offsetHeight-innerHeight);
      const p=Math.max(0,Math.min(1,-s.getBoundingClientRect().top/range));
      window.scrollBy(0,(t-p)*range);
      window.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new Event('scroll'));
      return {p,top:s.getBoundingClientRect().top,range,scrollY};
    },target);
    await page.waitForTimeout(180);
    const after=await page.evaluate(()=>{const s=document.querySelector('#ns-film42'),range=Math.max(1,s.offsetHeight-innerHeight);return Math.max(0,Math.min(1,-s.getBoundingClientRect().top/range));});
    if(Math.abs(after-target)<.035)return after;
  }
  const final=await page.evaluate(()=>{const s=document.querySelector('#ns-film42'),range=Math.max(1,s.offsetHeight-innerHeight);return {p:Math.max(0,Math.min(1,-s.getBoundingClientRect().top/range)),top:s.getBoundingClientRect().top,range,scrollY};});
  throw new Error('seek failed target='+target+' final='+JSON.stringify(final));
}
for(const [engineName,engine] of engines){
  const browser=await engine.launch({headless:true});
  for(const [name,width,height] of sizes){
    const page=await browser.newPage({viewport:{width,height}}); const local404=[];
    page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4173/')&&r.status()===404)local404.push(r.url())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#ns-film42',{state:'attached',timeout:15000});
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.body.style.scrollBehavior='auto';});
    const base=await page.evaluate(()=>({films:document.querySelectorAll('#ns-film42').length,legacy:document.querySelectorAll('#v20-story-film,.mobile-story-reel,#grove-story,#cut-story,#live-coconut-motion').length,rain:document.querySelectorAll('#ns-film42-rain img').length,bg:document.querySelector('.ns-film42-bg img')?.naturalWidth||0,hero:document.querySelector('.ns-film42-selected')?.naturalWidth||0,cut:document.querySelector('.ns-film42-cut-bg img')?.naturalWidth||0,scroll:document.documentElement.scrollWidth,view:innerWidth}));
    const expectedRain=width<=700?10:(width<=1024?16:30);
    if(base.films!==1||base.legacy!==0||base.rain!==expectedRain||!base.bg||!base.hero||!base.cut||base.scroll>base.view+2) throw new Error(engineName+' '+name+' base '+JSON.stringify(base)+' 404='+JSON.stringify(local404));
    const rp=await seek(page,.36); await page.waitForTimeout(220);
    const rain=await page.evaluate(()=>({opacity:+getComputedStyle(document.querySelector('#ns-film42-rain')).opacity,visible:[...document.querySelectorAll('#ns-film42-rain img')].filter(x=>+getComputedStyle(x).opacity>.25).length,count:+document.querySelector('#ns-film42-count').textContent,scrollY}));
    if(rain.opacity<.70||rain.visible<5||rain.count<70) throw new Error(engineName+' '+name+' rain progress='+rp+' '+JSON.stringify(rain));
    await page.screenshot({path:`qa-${engineName}-${name}-RAIN.png`});
    const cp=await seek(page,.80); await page.waitForTimeout(220);
    const cut=await page.evaluate(()=>({cut:+getComputedStyle(document.querySelector('.ns-film42-cut-bg')).opacity,copy:+getComputedStyle(document.querySelector('.ns-film42-copy-cut')).opacity}));
    if(cut.cut<.70||cut.copy<.45) throw new Error(engineName+' '+name+' cut progress='+cp+' '+JSON.stringify(cut));
    await page.screenshot({path:`qa-${engineName}-${name}-CUT.png`});
    if(local404.length) throw new Error(engineName+' '+name+' local404 '+JSON.stringify(local404));
    await page.close();
  }
  await browser.close();
}
const browser=await chromium.launch({headless:true});
const pages=['admin-preview.html','coconut-water.html','fresh-tender-coconut.html','green-coconut.html','bulk-coconut-supply.html','coconut-events-hospitality.html','freshness-first.html'];
for(const path of pages){
  const page=await browser.newPage({viewport:{width:1280,height:800}}); const local404=[];
  page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4173/')&&r.status()===404)local404.push(r.url())});
  await page.goto('http://127.0.0.1:4173/'+path,{waitUntil:'domcontentloaded',timeout:30000}); await page.waitForTimeout(500);
  if(local404.length) throw new Error(path+' local404 '+JSON.stringify(local404));
  if(path==='admin-preview.html'){
    const text=(await page.textContent('body'))||'';
    if(!/Delivery Hub/i.test(text)||!/Media Library/i.test(text)||!/Schedule/i.test(text)) throw new Error('Admin OS smoke failed');
    await page.screenshot({path:'qa-admin.png'});
  }
  await page.close();
}
await browser.close();
console.log('V42.3 browser QA passed');
