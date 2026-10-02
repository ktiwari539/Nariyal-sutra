// Local visual evidence with intercepted Firebase. No production connections or writes.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as fixtures from './fixtures/auth-firebase.mjs';
const base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173';
const out='qa-artifacts/auth-grove',checks=[],errors=[];
const themes=['nariyal-signature','fresh-grove','coastal-premium','golden-harvest'];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
async function context(options={}){
 const c=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,...options});
 await c.addInitScript(()=>{window.__authCalls=[];window.NS_FIREBASE_READY=true;});
 await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.NS_FIREBASE_CONFIG={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'owner@example.com'};window.NS_CUSTOMER_AUTH_PROVIDERS={};window.NS_INIT_APP_CHECK=async()=>null;window.NS_FIREBASE_READY=true;`}));
 await c.route('https://**/*',r=>{const m=r.request().url().match(/firebase-(app-check|app|auth|firestore|storage|analytics|performance)\.js/);return m?r.fulfill({contentType:'application/javascript',body:fixtures[m[1]==='app-check'?'appCheck':m[1]]}):r.abort();});
 return c;
}
async function open(c,kind,theme){
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+(kind==='customer'?'/index.html':'/admin-bcc-login.html')+'?themePreview='+theme);
 if(kind==='customer'){await p.waitForFunction(()=>NS_CUSTOMER_CONTEXT?.ready);await p.evaluate(()=>{skipIntro();NS_CUSTOMER_OPEN_ACCOUNT();});}
 else await p.waitForFunction(()=>!document.getElementById('submit').disabled);
 await p.waitForFunction(()=>[...document.querySelectorAll('.ns-nariyal-scene img')].every(i=>i.complete&&i.naturalWidth));
 await p.waitForTimeout(850);return p;
}
const state=p=>p.locator('.ns-auth-shell').evaluate(e=>{
 const s=q=>getComputedStyle(e.querySelector(q));
 return {pose:e.dataset.nariyalPose,group:s('.ns-nariyal-scene').transform,secondary:s('.ns-grove-secondary').transform,primary:s('.ns-nariyal-object').transform,leaf:s('.ns-grove-privacy-leaf').transform,eyes:Number(s('.ns-nariyal-eyes').opacity),leafTransition:s('.ns-grove-privacy-leaf').transitionDuration,secondaryDisplay:s('.ns-grove-secondary').display};
});
async function closeup(p,name){await p.locator('.ns-auth-art').screenshot({path:out+'/'+name+'.png'});}
for(const kind of ['customer','admin']){
 for(const theme of themes){
  for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   const c=await context({viewport:{width,height}}),p=await open(c,kind,theme);
   await p.screenshot({path:`${out}/${kind}-${theme}-${size}.png`});
   const idle=await state(p);
   ok(`${kind} ${theme} ${size}: no obvious idle eyes; appropriate element count`,idle.eyes<.03&&(kind==='admin'?idle.secondaryDisplay==='none':idle.secondaryDisplay!=='none'));
   const email=kind==='customer'?'#nsacct-login-email':'#email',password=kind==='customer'?'#nsacct-login-password':'#pw';
   if(size==='desktop')await closeup(p,`${kind}-${theme}-idle-closeup`);
   await p.locator(email).focus();await p.waitForTimeout(780);const gaze=await state(p);
   ok(`${kind} ${theme} ${size}: email gaze leaves group and companion stationary`,gaze.eyes>idle.eyes&&gaze.group===idle.group&&gaze.secondary===idle.secondary&&gaze.leaf===idle.leaf);
   if(size==='desktop')await closeup(p,`${kind}-${theme}-email-closeup`);
   await p.locator(password).focus();await p.waitForTimeout(780);const privacy=await state(p);
   ok(`${kind} ${theme} ${size}: privacy leaf crosses and eyes close`,privacy.eyes===0&&privacy.leaf!==idle.leaf&&privacy.group===idle.group&&privacy.secondary===idle.secondary);
   if(size==='desktop')await closeup(p,`${kind}-${theme}-privacy-closeup`);
   else await p.locator('.ns-auth-art').screenshot({path:`${out}/${kind}-${theme}-mobile-privacy.png`});
   await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(600);const peek=await state(p);
   ok(`${kind} ${theme} ${size}: restrained leaf lift for peek`,peek.pose==='peek'&&peek.leaf!==privacy.leaf&&peek.leaf!==idle.leaf&&peek.eyes>0&&peek.eyes<gaze.eyes);
   if(size==='desktop')await closeup(p,`${kind}-${theme}-peek-closeup`);
   await p.locator('.ns-auth-reveal').click();const hidden=await state(p);
   ok(`${kind} ${theme} ${size}: Hide closes cues immediately`,hidden.pose==='privacy'&&hidden.eyes===0);
   await c.close();
  }
 }
 // Record enlarged actual interface (150% CSS zoom for inspection, no product styles changed).
 const c=await context({viewport:{width:1840,height:1280},deviceScaleFactor:1,recordVideo:{dir:out+'/video',size:{width:1840,height:1280}}});
 const p=await open(c,kind,themes[0]);
 await p.addStyleTag({content:'html{zoom:1.5}'});
 const email=kind==='customer'?'#nsacct-login-email':'#email',password=kind==='customer'?'#nsacct-login-password':'#pw';
 await p.waitForTimeout(1700);
 await p.locator(email).focus();await p.keyboard.type('review@example.com',{delay:55});await p.waitForTimeout(1300);
 await p.locator(password).focus();await p.keyboard.type('Synthetic-review-123',{delay:50});await p.waitForTimeout(1600);
 await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(1800);
 await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(1500);
 for(const theme of themes.slice(1)){
  // Art-only theme sampling; the unmodified localhost theme resolver is separately exercised above.
  await p.evaluate(t=>{document.activeElement.blur();document.documentElement.dataset.authTheme=t;},theme);
  await p.waitForTimeout(1000);await p.locator(email).focus();await p.waitForTimeout(1000);
  await p.locator(password).focus();await p.waitForTimeout(1500);await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(1200);await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(800);
 }
 await p.evaluate(()=>document.documentElement.dataset.authTheme='nariyal-signature');
 await p.locator(kind==='customer'?'[data-nsacct-auth-tab="signup"]':'#forgot').click();await p.waitForTimeout(1400);
 await p.locator(kind==='customer'?'[data-nsacct-auth-tab="signin"]':'#ns-admin-back').click();await p.waitForTimeout(1400);
 await p.locator('[data-auth-sound]').click();await p.waitForTimeout(900);await p.locator('[data-auth-sound]').click();await p.waitForTimeout(700);
 await c.close();await p.video().saveAs(`${out}/${kind}-motion.webm`);
 const reduced=await context({reducedMotion:'reduce'}),rp=await open(reduced,kind,themes[0]);
 await rp.locator(password).focus();const r1=await state(rp);
 await rp.locator('.ns-auth-reveal').click();const r2=await state(rp);
 ok(`${kind}: reduced motion keeps privacy states instantaneous and stationary eyes`,r1.leafTransition==='0s'&&r2.leafTransition==='0s'&&r1.eyes===0&&r2.eyes===0&&r1.leaf!==r2.leaf&&r1.primary==='none'&&r2.primary==='none');
 await closeup(rp,kind+'-reduced-motion');await reduced.close();
}
ok('No Grove runtime errors',errors.length===0);
await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify({ok:true,checks,errors,limits:['Chromium desktop/mobile emulation; no real Safari/iOS devices.','Firebase replaced by local fixtures; no real credentials or production writes.','Motion videos use 150% inspection zoom; theme matrix screenshots use unmodified layout at 2x pixel density.','Audio toggles are visible in silent browser recordings; envelope/default/off behavior is instrumented in auth-interactive QA.']},null,2));
console.log(`Grove QA PASS (${checks.length} assertions)`);
