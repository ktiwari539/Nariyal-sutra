import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE='http://127.0.0.1:4207';
const OUT=path.join(process.cwd(),'qa-artifacts','admin-upload-quality');
fs.mkdirSync(OUT,{recursive:true});
const must=(c,m)=>{if(!c)throw new Error(m)};
const server=spawn('python3',['-m','http.server','4207','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,900));
const browser=await chromium.launch({headless:true});

async function inspectMediaLayout(page,label){
 await page.evaluate(()=>document.querySelector('#apNav button[data-view="media"]')?.click());
 await page.waitForSelector('#apMediaGrid .ap-media',{state:'visible',timeout:8000});
 await page.waitForTimeout(180);
 const result=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('#apMediaGrid .ap-media')].filter(c=>{const r=c.getBoundingClientRect();return r.width>0&&r.height>0;});
  const rows=cards.map(card=>{
   const visual=card.querySelector('.ap-media-img'),body=card.querySelector('.ap-media-body'),img=visual?.querySelector('img'),cr=card.getBoundingClientRect(),vr=visual?.getBoundingClientRect(),br=body?.getBoundingClientRect();
   const buttons=[...(body?.querySelectorAll('button')||[])].filter(b=>{const s=getComputedStyle(b),r=b.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;}).map(b=>{const r=b.getBoundingClientRect();return {text:(b.textContent||'').trim(),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},inside:r.left>=cr.left-1&&r.right<=cr.right+1&&r.top>=cr.top-1&&r.bottom<=cr.bottom+1};});
   const nw=img?.naturalWidth||0,nh=img?.naturalHeight||0;
   return {id:card.dataset.id||'',card:{left:cr.left,top:cr.top,right:cr.right,bottom:cr.bottom,width:cr.width,height:cr.height},visual:vr&&{top:vr.top,bottom:vr.bottom,height:vr.height},body:br&&{top:br.top,bottom:br.bottom,height:br.height},buttons,nw,nh,fit:img?getComputedStyle(img).objectFit:null,portrait:nh>nw*1.15,landscape:nw>nh*1.15,imgRect:img?(()=>{const r=img.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}})():null};
  });
  return {rows,overflow:document.documentElement.scrollWidth>innerWidth+2,viewportWidth:innerWidth};
 });
 must(result.rows.length>0,`${label}: no rendered media cards`);
 must(!result.overflow,`${label}: media view caused horizontal page overflow`);
 let portrait=false,landscape=false;
 for(const row of result.rows){
  must(row.visual&&row.body,`${label}: ${row.id} missing visual/body`);
  const expected=result.viewportWidth<=860?200:220;
  must(Math.abs(row.visual.height-expected)<=2,`${label}: ${row.id} visual escaped bounded height ${row.visual.height} expected ${expected}`);
  must(row.body.top>=row.visual.bottom-1,`${label}: ${row.id} body overlaps visual (${row.body.top} < ${row.visual.bottom})`);
  must(!row.imgRect||row.fit==='contain',`${label}: ${row.id} Admin thumbnail is cropped; expected object-fit: contain, got ${row.fit}`);
  if(row.imgRect)must(row.imgRect.bottom<=row.visual.bottom+1&&row.imgRect.top>=row.visual.top-1,`${label}: ${row.id} image escaped visual bounds`);
  must(row.buttons.length>=1,`${label}: ${row.id} has no visible media action buttons`);
  for(const b of row.buttons)must(b.inside,`${label}: ${row.id} action escaped card: ${b.text}`);
  portrait||=row.portrait;landscape||=row.landscape;
 }

 // Hit-test every visible action only after bringing it into the viewport. Clamping
 // off-screen button coordinates to the viewport edge creates false interception
 // failures and does not test the actual button.
 const cards=page.locator('#apMediaGrid .ap-media');
 for(let i=0;i<await cards.count();i++){
  const card=cards.nth(i);
  if(!await card.isVisible())continue;
  const id=await card.getAttribute('data-id')||`card-${i}`;
  const buttons=card.locator('.ap-media-body button:visible');
  for(let j=0;j<await buttons.count();j++){
   const button=buttons.nth(j);
   await button.scrollIntoViewIfNeeded();
   const hit=await button.evaluate((b)=>{
    const r=b.getBoundingClientRect();
    const x=r.left+r.width/2,y=r.top+r.height/2;
    const el=document.elementFromPoint(x,y);
    return !!el&&(el===b||b.contains(el));
   });
   const text=(await button.textContent()||'').trim();
   must(hit,`${label}: ${id} action center intercepted: ${text}`);
  }
 }
 return {count:result.rows.length,portrait,landscape};
}

try{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__NS_V421_ADMIN_MEDIA_QUALITY_GATE__===true&&window.__NS_V421_ADMIN_MEDIA_STUDIO__===true&&document.querySelector('#apNewMediaPicker'),null,{timeout:12000});
 const desktopLayout=await inspectMediaLayout(page,'desktop');
 must(desktopLayout.portrait,'desktop: no tall/portrait media card was exercised');
 must(desktopLayout.landscape,'desktop: no landscape media card was exercised');

 const before=await page.evaluate(()=>window.NSV421Store.load().media.length);
 const low=path.resolve('assets/images/ambassadors/campaign/AMB101-portrait.webp');
 must(fs.existsSync(low),'low-res campaign fixture missing');
 await page.locator('#apNewMediaPicker').setInputFiles(low);
 await page.waitForTimeout(350);
 const blocked=await page.evaluate(()=>({count:window.NSV421Store.load().media.length,toast:document.querySelector('#apToast')?.textContent||''}));
 must(blocked.count===before,`low-res upload changed media count ${before}->${blocked.count}`);
 must(/Upload blocked/i.test(blocked.toast)&&/170×212|170x212/i.test(blocked.toast),`low-res upload did not explain quality block: ${blocked.toast}`);

 const high=path.resolve('assets/images/nariyal-premium-hero.webp');
 must(fs.existsSync(high),'high-res hero fixture missing');
 await page.locator('#apNewMediaPicker').setInputFiles(high);
 await page.waitForTimeout(900);
 const accepted=await page.evaluate((before)=>{const s=window.NSV421Store.load(),added=s.media.slice(before);return {count:s.media.length,added:added.map(m=>({id:m.id,width:m.width||m.uploadAssist?.width,height:m.height||m.uploadAssist?.height,large:m.largeSurfaceAllowed,tier:m.qualityTier,status:m.status}))};},before);
 must(accepted.count===before+1,`professional upload was not accepted: ${JSON.stringify(accepted)}`);
 const m=accepted.added[0];must(m.width&&m.height,`accepted upload missing dimensions ${JSON.stringify(m)}`);must(['large','standard'].includes(m.tier),`accepted upload missing quality tier ${JSON.stringify(m)}`);
 await inspectMediaLayout(page,'desktop-after-upload');
 await page.screenshot({path:path.join(OUT,'quality-gate.png'),fullPage:true});

 await page.setViewportSize({width:820,height:900});
 await inspectMediaLayout(page,'tablet');
 await page.setViewportSize({width:390,height:844});
 await inspectMediaLayout(page,'mobile');
 must(!errors.length,`page errors: ${errors.join(' | ')}`);
 await context.close();
 console.log('ADMIN MEDIA UPLOAD QUALITY QA: PASS');
} finally {await browser.close();server.kill();}
