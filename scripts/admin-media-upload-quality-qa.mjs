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
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__NS_V421_ADMIN_MEDIA_QUALITY_GATE__===true&&document.querySelector('#apNewMediaPicker'),null,{timeout:12000});
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
 await page.screenshot({path:path.join(OUT,'quality-gate.png'),fullPage:true});
 must(!errors.length,`page errors: ${errors.join(' | ')}`);
 await context.close();
 console.log('ADMIN MEDIA UPLOAD QUALITY QA: PASS');
} finally {await browser.close();server.kill();}
