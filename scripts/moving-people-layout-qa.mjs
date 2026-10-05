// Focused local-only rail evidence. No external requests, credentials or data writes.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='qa-artifacts/moving-people',checks=[],metrics=[],errors=[];fs.mkdirSync(out,{recursive:true});
const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
const server=spawn('python3',['-m','http.server','4176','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,700));
const browser=await chromium.launch();
try{
 for(const theme of ['nariyal-signature','fresh-grove','coastal-premium','golden-harvest'])for(const [device,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]){
  const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  await c.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:','about:'].includes(u.protocol)?route.continue():route.abort();});
  await c.addInitScript(()=>{
   if(window===top&&'serviceWorker' in navigator)navigator.serviceWorker.register=()=>Promise.reject(new Error('Disabled in local QA'));
   window.__railCLS=0;
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput&&e.sources.some(s=>s.node?.closest?.('.ns-people-marquee')))window.__railCLS+=e.value;}).observe({type:'layout-shift',buffered:true});
  });
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4176/index.html?themePreview='+theme);await p.evaluate(()=>skipIntro());
  await p.waitForFunction(()=>getComputedStyle(document.getElementById('main-site')).opacity==='1'&&!document.body.classList.contains('ns-intro-mobile'));
  // Existing opening/section-placement callbacks run for five seconds. Reach the
  // rail after that opening settles, then include actual image decoding in CLS.
  await p.waitForTimeout(5200);
  await p.locator('.ns-people-marquee').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  await p.locator('.ns-face-card img').evaluateAll(async imgs=>{imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});await p.waitForTimeout(800);
  const contrast=await p.evaluate(()=>{
   const lum=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
   return [...document.querySelectorAll('.ns-people-marquee-head h3,.ns-people-marquee-head small,.ns-people-marquee-head p,.ns-people-marquee-foot span,.ns-people-marquee-foot a')].map(e=>{const s=getComputedStyle(e);let n=e,bg;while(n){const x=getComputedStyle(n).backgroundColor;if(/^rgb\(/.test(x)){bg=x;break;}n=n.parentElement;}const a=lum(s.color),b=lum(bg);return {text:e.textContent.slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),minimum:parseFloat(s.fontSize)>=24?3:4.5};});
  });
  ok(`${theme} ${device}: heading, caption and CTA contrast`,contrast.every(x=>x.ratio>=x.minimum));
  ok(`${theme} ${device}: customer-facing title; fades exclude surrounding copy`,await p.locator('.ns-people-marquee').evaluate(e=>!e.querySelector('h3').textContent.includes('full-picture rail')&&getComputedStyle(e,'::before').display==='none'&&getComputedStyle(e,'::after').display==='none'));
  const measure=()=>p.evaluate(()=>[...document.querySelectorAll('.ns-face-row')].map(row=>({gap:parseFloat(getComputedStyle(row).gap),cards:[...row.querySelectorAll('.ns-face-card')].map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img'),ir=i.getBoundingClientRect();const before=getComputedStyle(e,'::before');return {height:r.height,width:r.width,top:r.top,bottom:r.bottom,mediaHeight:ir.height,mediaTop:ir.top,mediaBottom:ir.bottom,fit:getComputedStyle(i).objectFit,focal:getComputedStyle(i).objectPosition,sourceFocal:i.style.objectPosition,loaded:i.complete&&i.naturalWidth>0,mode:e.dataset.fit||'',backdrop:before.backgroundImage,backdropFilter:before.filter};})})));
  const before=await measure(),spread=(xs,key)=>Math.max(...xs.map(x=>x[key]))-Math.min(...xs.map(x=>x[key]));
  ok(`${theme} ${device}: all rail photographs loaded`,before.length>0&&before.every(r=>r.cards.length>2&&r.cards.every(x=>x.loaded)));
  ok(`${theme} ${device}: equal card/media heights and aligned edges`,before.every(r=>['height','mediaHeight','top','bottom','mediaTop','mediaBottom'].every(k=>spread(r.cards,k)<.1)));
  ok(`${theme} ${device}: 2:3 frames, 14px gutters, full-photo-safe framing and retained focal points`,before.every(r=>r.gap===14&&r.cards.every(x=>Math.abs(x.width/x.height-2/3)<.002&&(x.mode==='cover'?x.fit==='cover':x.fit==='contain')&&(!x.sourceFocal||x.sourceFocal===x.focal))));
  ok(`${theme} ${device}: uncropped photos use a blurred card-filling backdrop`,before.every(r=>r.cards.filter(x=>x.mode!=='cover').every(x=>x.backdrop&&x.backdrop!=='none'&&/blur\(/.test(x.backdropFilter))));
  const point=await p.evaluate(()=>{const e=[...document.querySelectorAll('.ns-face-card')].find(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.top<innerHeight-20});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:Math.min(innerHeight-10,r.y+r.height/2)};});
  if(point)await p.mouse.move(point.x,point.y);await p.waitForTimeout(750);const hovered=await measure();
  ok(`${theme} ${device}: no frame resize during motion/hover`,before.every((r,j)=>r.cards.every((x,i)=>Math.abs(x.height-hovered[j].cards[i].height)<.1&&Math.abs(x.mediaHeight-hovered[j].cards[i].mediaHeight)<.1)));
  const m=await p.evaluate(()=>({cls:__railCLS,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  ok(`${theme} ${device}: no rail CLS or document overflow`,m.cls===0&&!m.overflow);
  // Only pause the marquee for clear screenshots; all measurements above used motion.
  await p.locator('.ns-face-row').evaluateAll(xs=>xs.forEach(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=0;})));
  await p.screenshot({path:`${out}/${theme}-${device}.png`});
  metrics.push({theme,device,viewport:{width,height},...m,contrast,rows:before.map(r=>({gap:r.gap,cards:r.cards.length,cardHeight:r.cards[0].height,mediaHeight:r.cards[0].mediaHeight,cardHeightSpread:spread(r.cards,'height'),mediaHeightSpread:spread(r.cards,'mediaHeight')}))});await c.close();
 }
 ok('No rail runtime exceptions',errors.length===0);
 fs.writeFileSync(out+'/results.json',JSON.stringify({ok:true,checks,metrics,errors,limits:['Chromium emulated viewports; no physical device test.','CLS is scoped to rail sources after the existing storefront opening settles; whole-site opening CLS is not claimed to be zero.','Review captures pause only the marquee. Frame measurements include its active motion and hover.','External requests blocked. No authentication, pricing, water or security suites rerun.']},null,2));
 console.log(`Moving People QA PASS (${checks.length} assertions; 12 theme/viewport cases)`);
}finally{await browser.close();server.kill();}
