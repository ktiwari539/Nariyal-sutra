import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const BASE='http://127.0.0.1:4206',OUT=path.join(process.cwd(),'qa-artifacts','ambassador-rail');fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};const server=spawn('python3',['-m','http.server','4206','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,900));const browser=await chromium.launch({headless:true});
const keys=['ambassadors','promoters','community'];
async function seed(page){
 return page.evaluate(()=>{
  const Store=window.NSV421Store,s=Store.load();
  const ids=(s.media||[]).filter(m=>m.cat==='People'&&Store.eligibleForPublic(s,m)).map(m=>m.id).slice(0,8);
  if(ids.length<4)throw new Error('not enough approved People media to verify three streams');
  s.peopleStreams=s.peopleStreams||{};
  const orders={ambassadors:ids.slice(0,6),promoters:[...ids.slice(0,5)].reverse(),community:ids.slice(1,7)};
  for(const key of ['ambassadors','promoters','community']){
   s.peopleStreams[key]={...(s.peopleStreams[key]||{}),enabled:true,selectedIds:orders[key],title:`QA ${key}`,subtitle:`QA ${key} public copy`,direction:key==='promoters'?'rtl':'ltr',speed:48,desktopLimit:0,tabletLimit:0,mobileLimit:0,deviceVisibility:{}};
  }
  if(orders.community[0])s.peopleStreams.community.deviceVisibility[orders.community[0]]={desktop:true,tablet:true,mobile:false};
  Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));
  return orders;
 });
}
async function snapshot(page){return page.evaluate(()=>{const out={};for(const key of ['ambassadors','promoters','community']){const sec=document.querySelector(`#people-${key}`),groups=[...sec?.querySelectorAll('.v25-story-group')||[]],primary=[...groups[0]?.querySelectorAll('.v25-story-person')||[]];out[key]={exists:!!sec,mode:sec?.dataset.streamMode,groups:groups.length,ids:primary.map(x=>x.dataset.id),broken:[...sec?.querySelectorAll('img')||[]].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),title:sec?.querySelector('h3')?.textContent?.trim()||'',direction:sec?.querySelector('.v25-story-track')?.classList.contains('reverse')?'rtl':'ltr'};}return {streams:out,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth};});}
async function check(width,height,label){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width<600?3:2,hasTouch:true,serviceWorkers:'block'});const page=await context.newPage(),errs=[];page.on('pageerror',e=>errs.push(String(e)));await page.goto(BASE+'/people-of-nariyal-sutra.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(700);const orders=await seed(page);await page.waitForFunction(()=>['ambassadors','promoters','community'].every(k=>document.querySelector(`#people-${k} .v25-story-group .v25-story-person`)),null,{timeout:8000});await page.waitForTimeout(250);let st=await snapshot(page);
 for(const key of keys){const got=st.streams[key];must(got.exists,`${label}: ${key} stream missing`);const expected=orders[key].filter((id,i)=>!(key==='community'&&label==='mobile'&&i===0));must(JSON.stringify(got.ids)===JSON.stringify(expected),`${label}: ${key} Admin sequence did not propagate expected=${JSON.stringify(expected)} got=${JSON.stringify(got.ids)}`);must(new Set(got.ids).size===got.ids.length,`${label}: duplicate IDs in ${key}`);must(!got.broken.length,`${label}: broken ${key} images ${got.broken.join(',')}`);must(got.title===`QA ${key}`,`${label}: ${key} title did not propagate`);if(key==='promoters')must(got.direction==='rtl',`${label}: promoter direction did not propagate`);}
 must(st.overflow<=8,`${label}: page horizontal overflow ${st.overflow}`);
 await page.evaluate(()=>{const Store=window.NSV421Store,s=Store.load();s.peopleStreams.community.enabled=false;Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));});await page.waitForTimeout(120);must(!(await page.locator('#people-community').count()),`${label}: hidden Community stream still rendered`);
 await page.screenshot({path:path.join(OUT,`${label}.png`),fullPage:true});must(!errs.length,`${label}: page errors ${errs.join(' | ')}`);await context.close();
}
try{await check(1440,900,'desktop');await check(820,1100,'tablet');await check(390,844,'mobile');console.log('PEOPLE STREAM PROPAGATION QA: PASS');}finally{await browser.close();server.kill();}
