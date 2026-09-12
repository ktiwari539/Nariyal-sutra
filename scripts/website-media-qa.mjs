import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4195';
const OUT=path.join(process.cwd(),'qa-artifacts','website-media');
const IDS=Array.from({length:11},(_,i)=>'WS'+String(i+1).padStart(3,'0'));
const CLEAN=['WS001','WS003','WS005','WS006','WS010'];
const REFERENCE=IDS.filter(id=>!CLEAN.includes(id));
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};
fs.mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server','4195','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const res=await page.goto(BASE+'/admin-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
 must(res&&res.status()<400,`Admin returned ${res?.status()}`);
 await page.waitForFunction(()=>window.__NSV21_ADMIN_BOUND===true&&window.__NS_V421_ADMIN_V38__===true,null,{timeout:12000});
 await page.waitForTimeout(500);
 const state=await page.evaluate(({ids,clean,reference})=>{
  const s=window.NSV421Store.load(),find=id=>window.NSV421Store.mediaById(s,id);
  return {
   records:ids.map(id=>{const m=find(id);return {id,exists:!!m,status:m?.status,visible:m?.visible,publicAllowed:m?.publicAllowed,cat:m?.cat,src:m?.src||''};}),
   clean:clean.map(id=>find(id)),reference:reference.map(id=>find(id)),api:window.NSV421MediaDB?.websiteMediaIds||[]
  };
 },{ids:IDS,clean:CLEAN,reference:REFERENCE});
 must(state.records.every(x=>x.exists),`Website media missing from state: ${JSON.stringify(state.records.filter(x=>!x.exists))}`);
 must(IDS.every(id=>state.api.includes(id)),`Website media registry API incomplete: ${JSON.stringify(state.api)}`);
 must(state.clean.every(x=>x?.status==='Approved'&&x.visible!==false&&x.publicAllowed===true),'Clean website media must be placement eligible');
 must(state.reference.every(x=>x?.status==='Approved'&&x.visible!==false&&x.publicAllowed===false&&x.cat==='Cinematic'),'Composed website media must stay reference-only');
 const loads=await page.evaluate(async ids=>{
  const s=window.NSV421Store.load();
  return Promise.all(ids.map(id=>new Promise(resolve=>{const m=window.NSV421Store.mediaById(s,id),img=new Image();img.onload=()=>resolve({id,ok:true,w:img.naturalWidth,h:img.naturalHeight,src:m?.src||''});img.onerror=()=>resolve({id,ok:false,w:0,h:0,src:m?.src||''});img.src=m?.src||'';})));
 },IDS);
 must(loads.every(x=>x.ok&&x.w>100&&x.h>100),`Website media binary load failure: ${JSON.stringify(loads.filter(x=>!x.ok||x.w<=100||x.h<=100))}`);
 await page.locator('#apNav button[data-view="media"]').click();await page.waitForTimeout(300);
 const grid=await page.locator('#apMediaGrid .ap-media-id').allTextContents();
 for(const id of IDS)must(grid.includes(id),`${id} missing from Admin Media Library`);
 await page.screenshot({path:path.join(OUT,'admin-website-media.png'),fullPage:true});
 await page.locator('#apNav button[data-view="pages"]').click();await page.waitForTimeout(250);
 await page.locator('[data-v38-target="homepage-hero"]').click();await page.waitForTimeout(250);
 const picker=await page.locator('[data-v38-pick]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-v38-pick')));
 for(const id of CLEAN)must(picker.includes(id),`${id} missing from section image picker`);
 for(const id of REFERENCE)must(!picker.includes(id),`${id} reference frame exposed in standard image picker`);
 console.log('WEBSITE MEDIA ADMIN QA: PASS',JSON.stringify({ids:IDS,clean:CLEAN,reference:REFERENCE,loads}));
} finally {
 await browser.close();server.kill();
}
