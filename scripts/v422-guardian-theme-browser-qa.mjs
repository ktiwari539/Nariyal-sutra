// Real shipped login/storefront, isolated Firebase and public-theme fixtures.
// No production requests, credentials, orders or customer-facing messages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
import * as fixtures from './fixtures/auth-firebase.mjs';

const out='qa-artifacts/v422-guardian';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],matrix=[],blockedWrites=[];
const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
const themes={'nariyal-signature':'signature','fresh-grove':'fresh','coastal-premium':'coastal','golden-harvest':'golden'};
const root=path.resolve('.'),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch();
async function context({theme='nariyal-signature',assetFail=false,delayFresh=false,...options}={}){
 const c=await browser.newContext({viewport:{width:1440,height:1000},...options});c.setDefaultTimeout(15000);
 await c.addInitScript(()=>{
  window.__authCalls=[];window.__credentialReads=[];window.NS_FIREBASE_READY=true;
  const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  Object.defineProperty(HTMLInputElement.prototype,'value',{...descriptor,get(){if(new Error().stack.includes('auth-shell.js'))__credentialReads.push('forbidden');return descriptor.get.call(this);}});
 });
 await c.addInitScript(fixtures.soundSpy);
 await c.route('**/*',r=>{
  const u=r.request().url();
  if(!['GET','HEAD'].includes(r.request().method())){blockedWrites.push(u);return r.abort();}
  if(u.startsWith(base+'/'))return r.continue();
  const m=u.match(/firebase-(app-check|app|auth|firestore|storage|analytics|performance)\.js/);
  return m?r.fulfill({contentType:'application/javascript',body:fixtures[m[1]==='app-check'?'appCheck':m[1]]}):r.abort();
 });
 await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.NS_FIREBASE_CONFIG={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'owner@example.com'};window.NS_CUSTOMER_AUTH_PROVIDERS={};window.NS_INIT_APP_CHECK=async()=>null;window.NS_FIREBASE_READY=true;"}));
 await c.route('**/.netlify/functions/published-auth-theme',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({themeId:theme})}));
 if(assetFail)await c.route('**/assets/images/brand/guardian/*.webp',r=>r.abort());
 if(delayFresh)await c.route('**/assets/images/brand/guardian/fresh.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,650));await r.continue();});
 return c;
}
async function open(c,kind,theme='nariyal-signature',preview=true){
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+(kind==='customer'?'/index.html':'/admin-bcc-login.html')+(preview?'?themePreview='+theme:''),{waitUntil:'domcontentloaded'});
 if(kind==='customer'){
  await p.waitForFunction(()=>window.NS_CUSTOMER_CONTEXT?.ready&&typeof window.skipIntro==='function');
  await p.evaluate(()=>window.skipIntro());
  await p.waitForFunction(()=>{const e=document.getElementById('main-site');return e&&getComputedStyle(e).pointerEvents!=='none';});
  ok('Customer login is hidden until My Account opens it',!await p.locator('#nsacct-overlay').isVisible());
  await p.locator('#nsacct-trigger').click();
 }else await p.waitForFunction(()=>!document.getElementById('submit').disabled);
 await p.waitForFunction(()=>document.querySelector('.ns-auth-shell')?.dataset.authBound==='true'&&document.querySelector('.ns-nariyal-scene')?.dataset.guardianReady==='true');
 return p;
}
async function blinkFrame(p,fraction){
 return p.locator('.ns-auth-shell').evaluate((shell,f)=>{
  const eyes=shell.querySelector('.ns-nariyal-eyes'),blink=shell.querySelector('.ns-guardian-blink');
  // Sample the actual CSS animation timeline, including its rendered SVG matrix.
  for(const a of shell.getAnimations({subtree:true}))if(['nsGuardianIdleEyes','nsGuardianBlink'].includes(a.animationName)){a.pause();a.currentTime=Number(a.effect.getTiming().duration)*f;}
  return {opacity:Number(getComputedStyle(eyes).opacity),scale:new DOMMatrixReadOnly(getComputedStyle(blink).transform).d,name:getComputedStyle(blink).animationName};
 },fraction);
}
async function publish(p,id){
 await p.evaluate(themeId=>{
  const s=NSV421Store.load();s.themeConfig={...s.themeConfig,publishedTheme:themeId,manualOverride:null,schedules:[]};NSV421Store.save(s);
 },id);
 await p.waitForFunction(themeId=>NSAuthTheme.id===themeId&&document.querySelector('.ns-auth-shell')?.dataset.guardianTheme===themeId&&document.querySelector('.ns-nariyal-scene')?.dataset.guardianReady==='true',id);
}
try{
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['narrow',320,740]]){
  for(const [theme,art] of Object.entries(themes))for(const kind of ['customer','admin']){
   const c=await context({theme,viewport:{width,height}}),p=await open(c,kind,theme);
   const shell=p.locator('.ns-auth-shell'),prefix=kind+' '+theme+' '+label;
   const initial=await shell.evaluate(e=>{
    const scene=e.querySelector('.ns-nariyal-scene'),r=scene.getBoundingClientRect(),image=e.querySelector('[data-guardian-product="primary"]');
    const controls=[...e.querySelectorAll('.ns-auth-content input,.ns-auth-content button')].filter(x=>x.getClientRects().length);
    return {src:image.getAttribute('src'),loaded:image.naturalWidth>0,theme:e.dataset.guardianTheme,width:r.width,height:r.height,position:[scene.offsetLeft,scene.offsetTop],overflow:document.documentElement.scrollWidth>innerWidth||e.scrollWidth>e.clientWidth+1,overlap:controls.some(x=>{const s=x.getBoundingClientRect();return r.left<s.right&&r.right>s.left&&r.top<s.bottom&&r.bottom>s.top;}),idle:getComputedStyle(e.querySelector('.ns-guardian-blink')).animationName};
   });
   ok(prefix+': actual themed coconut loaded, responsive art does not cover controls',initial.src.endsWith('/'+art+'.webp')&&initial.loaded&&initial.theme===theme&&!initial.overflow&&!initial.overlap);
   ok(prefix+': idle blink runs without touching an input',initial.idle==='nsGuardianBlink');
   const openEyes=await blinkFrame(p,.46),closedEyes=await blinkFrame(p,.50),reopened=await blinkFrame(p,.54);
   ok(prefix+': visible idle eyes close and reopen',openEyes.opacity>=.5&&openEyes.scale>.98&&closedEyes.scale<.06&&reopened.scale>.98);
   if(label==='desktop'||label==='mobile'){
    await blinkFrame(p,.46);await p.screenshot({path:out+'/'+kind+'-'+theme+'-'+label+'.png'});
    await blinkFrame(p,.50);await p.locator('.ns-auth-art').screenshot({path:out+'/'+kind+'-'+theme+'-'+label+'-blink.png'});
   }
   // Paused CSS timelines can survive as detached Web Animations after a style
   // change. Release the sampled frames before testing the live privacy state.
   await shell.evaluate(e=>{for(const a of e.getAnimations({subtree:true}))if(['nsGuardianIdleEyes','nsGuardianBlink'].includes(a.animationName))a.cancel();});
   const password=kind==='customer'?'#nsacct-login-password':'#pw';
   await p.locator(password).focus();
   await p.waitForFunction(()=>{const e=document.querySelector('.ns-auth-shell');return e.dataset.nariyalPose==='privacy'&&Number(getComputedStyle(e.querySelector('.ns-nariyal-eyes')).opacity)===0&&getComputedStyle(e.querySelector('.ns-guardian-blink')).animationName==='none';},null,{timeout:1500});
   const privacy=await shell.evaluate(e=>({pose:e.dataset.nariyalPose,eyes:Number(getComputedStyle(e.querySelector('.ns-nariyal-eyes')).opacity),blink:getComputedStyle(e.querySelector('.ns-guardian-blink')).animationName,active:document.activeElement.id,animations:e.querySelector('.ns-nariyal-eyes').getAnimations().map(a=>({name:a.animationName,time:a.currentTime,state:a.playState}))}));
   if(!(privacy.pose==='privacy'&&privacy.eyes===0&&privacy.blink==='none'))console.log('PRIVACY DIAGNOSTIC '+JSON.stringify(privacy));
   ok(prefix+': password stops blinking and closes eyes',privacy.pose==='privacy'&&privacy.eyes===0&&privacy.blink==='none');
   await p.locator('.ns-auth-reveal').click();
   await p.waitForFunction(()=>{const e=document.querySelector('.ns-auth-shell');return e.dataset.nariyalPose==='peek'&&Number(getComputedStyle(e.querySelector('.ns-guardian-eye-far')).opacity)===0;});
   ok(prefix+': Show permits one-eye peek only',await shell.evaluate(e=>Number(getComputedStyle(e.querySelector('.ns-guardian-eye-near')).opacity)===1));
   await p.locator('.ns-auth-reveal').click();
   ok(prefix+': Hide immediately restores privacy',await shell.getAttribute('data-nariyal-pose')==='privacy');
   ok(prefix+': animation never reads credential contents and sound remains off',await p.evaluate(()=>__credentialReads.length===0)&&await p.locator('[data-auth-sound]').getAttribute('aria-pressed')==='false');
   matrix.push({kind,theme,viewport:label,...initial});await c.close();
  }
 }
 for(const kind of ['customer','admin']){
  const desktop=matrix.filter(x=>x.kind===kind&&x.viewport==='desktop');
  ok(kind+': four themes produce distinct artwork and spatial composition',new Set(desktop.map(x=>[x.src,x.width,x.height,...x.position].join('|'))).size===4);
 }
 const c=await context({delayFresh:true}),p=await open(c,'customer','nariyal-signature',false);
 await p.locator('#nsacct-login-password').fill('Synthetic-only-123');
 await publish(p,'fresh-grove');
 ok('An open customer login adopts the published theme without resetting focus or privacy',await p.locator('#nsacct-login-password').evaluate(e=>document.activeElement===e&&e.type==='password')&&await p.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='privacy');
 await publish(p,'coastal-premium');await publish(p,'golden-harvest');await publish(p,'nariyal-signature');
 ok('Repeated published theme changes replace primary and secondary art',await p.locator('[data-guardian-product="primary"]').getAttribute('src')==='/assets/images/brand/guardian/signature.webp'&&await p.locator('[data-guardian-product="secondary"]').getAttribute('src')==='/assets/images/brand/guardian/golden.webp');
 // Rapid publication deliberately lets the obsolete green image finish last.
 await p.evaluate(()=>{
  for(const themeId of ['fresh-grove','golden-harvest']){const s=NSV421Store.load();s.themeConfig={...s.themeConfig,publishedTheme:themeId};NSV421Store.save(s);}
 });
 await p.waitForTimeout(900);
 ok('Late image callbacks cannot restore obsolete artwork or a stale fallback',await p.locator('.ns-auth-shell').evaluate(e=>e.dataset.guardianTheme==='golden-harvest'&&!e.dataset.nariyalAsset&&e.querySelector('[data-guardian-product="primary"]').src.endsWith('/golden.webp')&&e.querySelector('.ns-nariyal-scene').dataset.guardianReady==='true'));
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ns:theme-applied',{detail:{id:'unknown-private-draft'}})));
 ok('Invalid or mismatched theme events cannot replace the current theme',await p.evaluate(()=>NSAuthTheme.id==='golden-harvest'));
 await p.keyboard.press('Escape');await p.locator('#nsacct-trigger').click();
 await p.waitForFunction(()=>document.querySelector('.ns-nariyal-scene')?.dataset.guardianReady==='true');
 ok('Reopening My Account uses the latest theme',await p.locator('.ns-auth-shell').getAttribute('data-guardian-theme')==='golden-harvest');
 ok('Theme changes never invoke authentication or credential reads',await p.evaluate(()=>__authCalls.length===0&&__credentialReads.length===0));
 await c.close();
 for(const kind of ['customer','admin']){
  const r=await context({reducedMotion:'reduce'}),rp=await open(r,kind);
  ok(kind+': reduced motion is static with usable controls',await rp.locator('.ns-auth-shell').evaluate(e=>[...e.querySelectorAll('*')].every(x=>getComputedStyle(x).animationName==='none'&&getComputedStyle(x).transitionDuration==='0s')));
  await rp.locator(kind==='customer'?'#nsacct-login-password':'#pw').focus();
  ok(kind+': reduced motion still immediately hides eyes for passwords',await rp.locator('.ns-nariyal-eyes').evaluate(e=>Number(getComputedStyle(e).opacity)===0));await r.close();
  const f=await context({assetFail:true}),fp=await open(f,kind);
  ok(kind+': missing artwork fails safely without blocking login',await fp.locator('.ns-auth-shell').getAttribute('data-nariyal-asset')==='fallback'&&await fp.locator(kind==='customer'?'#nsacct-login-email':'#email').isEnabled());await f.close();
 }
 ok('No runtime exceptions or attempted writes',errors.length===0&&blockedWrites.length===0);
 fs.writeFileSync(out+'/results.json',JSON.stringify({ok:true,checks,matrix,errors,blockedWrites,limits:['Actual shipped HTML with isolated Firebase/public-theme fixtures.','Hosted staging, real Owner login and physical-device QA remain separate release gates.']},null,2));
 console.log('V42.2 Guardian QA PASS ('+checks.length+' checks, '+matrix.length+' responsive theme cases)');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
