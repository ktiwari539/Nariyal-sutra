// Local-only evidence. Firebase modules and all external traffic are intercepted.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as fixtures from './fixtures/auth-firebase.mjs';
const base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173';
const out='qa-artifacts/recovery/auth-guardian', checks=[], errors=[], metrics=[];
const completedMotionKinds=[];
if(process.argv.includes('--resume')&&fs.existsSync(out+'/progress.json')){const saved=JSON.parse(fs.readFileSync(out+'/progress.json'));checks.push(...saved.checks);metrics.push(...saved.metrics);completedMotionKinds.push(...(saved.completedMotionKinds||[]));}
const themes=['nariyal-signature','fresh-grove','coastal-premium','golden-harvest'];
const quick=process.argv.includes('--inspect');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
async function context(options={}){
 const c=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,...options});c.setDefaultTimeout(15000);
 await c.addInitScript(()=>{window.__authCalls=[];window.NS_FIREBASE_READY=true;window.__authCLS=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput&&e.sources?.some(s=>s.node?.closest?.('.ns-auth-shell')))window.__authCLS+=e.value;}).observe({type:'layout-shift',buffered:true});});
 await c.addInitScript(fixtures.soundSpy);
 await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.NS_FIREBASE_CONFIG={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'owner@example.com'};window.NS_CUSTOMER_AUTH_PROVIDERS={};window.NS_INIT_APP_CHECK=async()=>null;window.NS_FIREBASE_READY=true;`}));
 await c.route('https://**/*',r=>{const m=r.request().url().match(/firebase-(app-check|app|auth|firestore|storage|analytics|performance)\.js/);return m?r.fulfill({contentType:'application/javascript',body:fixtures[m[1]==='app-check'?'appCheck':m[1]]}):r.abort();});
 await c.route('**/admin-preview.html',r=>r.fulfill({contentType:'text/html',body:'<style>body{background:#0a2a20;color:#fff8e7;font:28px Georgia;padding:80px}</style><h1>Authorized local QA destination</h1><p>Verified Owner flow completed. Firebase is intercepted.</p>'}));
 return c;
}
async function open(c,kind,theme,p=undefined){
 p ||= await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+(kind==='customer'?'/index.html':'/admin-bcc-login.html')+'?themePreview='+theme);
 if(kind==='customer'){await p.waitForFunction(()=>window.NS_CUSTOMER_CONTEXT?.ready);await p.evaluate(()=>skipIntro());await p.locator('#nsacct-trigger').click();}
 else await p.waitForFunction(()=>!document.getElementById('submit').disabled);
 await p.waitForFunction(()=>document.querySelector('.ns-nariyal-scene')?.dataset.guardianReady==='true');
 await p.waitForTimeout(900);return p;
}
async function waitError(p){try{await p.waitForFunction(()=>document.querySelector('.ns-auth-shell').dataset.nariyalPose==='error');}catch(e){console.log('ERROR DIAGNOSTIC '+JSON.stringify(await p.evaluate(()=>({pose:document.querySelector('.ns-auth-shell').dataset,active:document.activeElement?.id,calls:window.__authCalls,message:document.querySelector('#msg,#nsacct-message')?.textContent,invalid:[...document.querySelectorAll('input:invalid')].map(i=>({id:i.id,reason:i.validationMessage})),busy:document.querySelector('#login')?.getAttribute('aria-busy')}))));throw e;}}
const selectors=kind=>({email:kind==='customer'?'#nsacct-login-email':'#email',password:kind==='customer'?'#nsacct-login-password':'#pw',submit:kind==='customer'?'#nsacct-signin button[type=submit]':'#submit'});
const state=p=>p.locator('.ns-auth-shell').evaluate(e=>{
 const s=q=>getComputedStyle(e.querySelector(q));
 return {pose:e.dataset.nariyalPose,group:s('.ns-nariyal-scene').transform,secondary:s('.ns-grove-secondary').transform,primary:s('.ns-nariyal-object').transform,leaf:s('.ns-grove-privacy-leaf').transform,eyes:Number(s('.ns-nariyal-eyes').opacity),far:Number(s('.ns-guardian-eye-far').opacity),near:Number(s('.ns-guardian-eye-near').opacity),leafTransition:s('.ns-grove-privacy-leaf').transitionDuration,secondaryDisplay:s('.ns-grove-secondary').display};
});
async function closeup(p,name){await p.locator('.ns-auth-art').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await p.locator('.ns-auth-art').screenshot({path:out+'/'+name+'.png',timeout:15000});}
if(process.argv.includes('--closed-only')){
 for(const kind of (process.env.NS_QA_KIND?[process.env.NS_QA_KIND]:['customer','admin']))for(const theme of themes){
  const c=await context(),p=await open(c,kind,theme),q=selectors(kind);
  await p.locator(q.email).focus();await p.waitForTimeout(800);await p.locator(q.password).focus();
  await p.evaluate(()=>{const shell=document.querySelector('.ns-auth-shell');getComputedStyle(shell.querySelector('.ns-grove-privacy-leaf')).transform;shell.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=433;});});
  const eyes=await p.locator('.ns-nariyal-eyes').evaluate(e=>Number(getComputedStyle(e).opacity));
  ok(kind+' '+theme+': closed-eye frame has no open iris',eyes===0);
  await closeup(p,`${kind}-${theme}-closed-eyes-closeup`);await c.close();
 }
 await browser.close();fs.writeFileSync(out+'/closed-frame-results.json',JSON.stringify({ok:true,checks,method:'Actual CSS timeline paused at 433ms, before leaf begins at 500ms.'},null,2));process.exit(0);
}
for(const kind of (process.env.NS_QA_KIND?[process.env.NS_QA_KIND]:['customer','admin'])){
 for(const theme of (process.argv.includes("--motion-only")?[]:process.env.NS_QA_THEME?[process.env.NS_QA_THEME]:quick?themes.slice(0,2):themes)){
  for(const [size,width,height] of (quick?[['desktop',1440,1000]]:[['desktop',1440,1000],['mobile',390,844]])){
   if(metrics.some(m=>m.kind===kind&&m.theme===theme&&m.size===size))continue;
   const c=await context({viewport:{width,height}}),p=await open(c,kind,theme),q=selectors(kind);
   const loaded=await p.locator('.ns-nariyal-scene img').evaluateAll(imgs=>imgs.every(i=>i.naturalWidth>0&&getComputedStyle(i).display!=='none'));
   ok(`${kind} ${theme} ${size}: all art loaded and visible`,loaded);
   await p.screenshot({path:`${out}/${kind}-${theme}-${size}.png`});
   const idle=await state(p);
   ok(`${kind} ${theme} ${size}: subtle idle; intended element count`,idle.eyes<.03&&(kind==='admin'?idle.secondaryDisplay==='none':idle.secondaryDisplay!=='none'));
   await closeup(p,`${kind}-${theme}-${size}-idle-closeup`);
   await p.locator(q.email).focus();await p.waitForTimeout(800);const gaze=await state(p);
   ok(`${kind} ${theme} ${size}: gaze affects primary only`,gaze.eyes>idle.eyes&&gaze.group===idle.group&&gaze.secondary===idle.secondary);
   await closeup(p,`${kind}-${theme}-${size}-email-closeup`);
   const readable=await p.locator('.ns-guardian-eye-near').evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,opacity:Number(getComputedStyle(e.closest('.ns-nariyal-eyes')).opacity)}});
   ok(`${kind} ${theme} ${size}: active eyes readable at native scale`,readable.width>=12&&readable.opacity>=.7);
   await p.locator(q.password).focus();
   const timing=await p.locator('.ns-auth-shell').evaluate(e=>({leaf:parseFloat(getComputedStyle(e.querySelector('.ns-grove-privacy-leaf')).transitionDelay),close:parseFloat(getComputedStyle(e.querySelector('.ns-guardian-blink')).transitionDelay)+parseFloat(getComputedStyle(e.querySelector('.ns-guardian-blink')).transitionDuration),turn:getComputedStyle(e).getPropertyValue('--guardian-turn')}));
   ok(`${kind} ${theme} ${size}: eye closure precedes leaf; restrained turn`,timing.leaf>timing.close&&Math.abs(parseFloat(timing.turn))>=3&&Math.abs(parseFloat(timing.turn))<=5);
   await p.waitForTimeout(240);
   {
    // Freeze the actual in-flight frame so screenshot encoding cannot skip the closed-eye beat.
    await p.evaluate(()=>{window.__guardianFrozen=document.querySelector('.ns-auth-shell').getAnimations({subtree:true});__guardianFrozen.forEach(a=>{a.pause();a.currentTime=433;});});
    await closeup(p,`${kind}-${theme}-${size}-closed-eyes-closeup`);
    await p.evaluate(()=>__guardianFrozen.forEach(a=>a.cancel()));
   }
   await p.waitForTimeout(1100);const privacy=await state(p);
   ok(`${kind} ${theme} ${size}: eyes closed; privacy turn and leaf cover`,privacy.eyes===0&&privacy.leaf!==idle.leaf&&privacy.primary!==idle.primary&&privacy.group===idle.group);
   await closeup(p,`${kind}-${theme}-${size}-privacy-closeup`);
   await p.locator('.ns-auth-reveal').click();
   await p.waitForFunction(()=>{const e=document.querySelector('.ns-auth-shell');if(!e||e.dataset.nariyalPose!=='peek')return false;const s=q=>getComputedStyle(e.querySelector(q));return Number(s('.ns-guardian-eye-far').opacity)===0&&Number(s('.ns-guardian-eye-near').opacity)>=.99&&Number(s('.ns-nariyal-eyes').opacity)>0;},{timeout:2500});
   const peek=await state(p);
   ok(`${kind} ${theme} ${size}: only one eye peeks`,peek.pose==='peek'&&peek.far===0&&peek.near>=.99&&peek.eyes>0&&peek.leaf!==privacy.leaf);
   await closeup(p,`${kind}-${theme}-${size}-peek-closeup`);
   await p.locator('.ns-auth-reveal').click();const hidden=await state(p);
   ok(`${kind} ${theme} ${size}: Hide closes eyes immediately`,hidden.pose==='privacy'&&hidden.eyes===0);
   await p.waitForTimeout(850);
   await p.locator(q.email).fill('review@example.com');await p.locator(q.password).fill('Synthetic-review-123');
   await p.evaluate(()=>{window.__authScenario='wrong-password';window.__authLatency=180;});
   await p.keyboard.press('Enter');await waitError(p);await p.waitForTimeout(750);
   const failure=await state(p);ok(`${kind} ${theme} ${size}: invalid login releases leaf and restores readable eyes`,failure.pose==='error'&&failure.eyes>=.7&&failure.leaf!==privacy.leaf);
   await closeup(p,`${kind}-${theme}-${size}-error-closeup`);
   await p.locator(q.password).focus();await p.keyboard.insertText('1');
   ok(`${kind} ${theme} ${size}: editing retry clears error and restarts privacy`,await p.locator('.ns-auth-shell').evaluate(e=>e.dataset.nariyalPose==='privacy'&&e.dataset.authFeedback==='idle'));
   await p.waitForTimeout(1000);await closeup(p,`${kind}-${theme}-${size}-retry-closeup`);await p.locator(q.password).focus();
   await p.keyboard.press('Enter');await waitError(p);
   await p.keyboard.press('Enter');
   ok(`${kind} ${theme} ${size}: repeated Enter retry restarts privacy while focus remains`,await p.locator('.ns-auth-shell').evaluate(e=>e.dataset.nariyalPose==='privacy'&&e.dataset.authFeedback==='loading'));
   await waitError(p);
   // Explicit expression inspection, separate from real successful navigation below.
   await p.evaluate(()=>NSAuthShell.signal(document.querySelector('.ns-auth-shell'),'success'));
   await p.waitForTimeout(450);await closeup(p,`${kind}-${theme}-${size}-success-pose-closeup`);
   const m=await p.evaluate(()=>({cls:__authCLS,art:[...new Set(performance.getEntriesByType('resource').filter(r=>r.name.includes('/brand/guardian/')).map(r=>r.name.split('/').pop()))],overflow:document.documentElement.scrollWidth>innerWidth,decorative:document.querySelector('.ns-nariyal-scene').getAttribute('aria-hidden')==='true'&&!document.querySelector('.ns-nariyal-scene [tabindex]'),intensity:getComputedStyle(document.querySelector('.ns-auth-shell')).getPropertyValue('--guardian-intensity').trim()}));
   metrics.push({kind,theme,size,...m});
   ok(`${kind} ${theme} ${size}: CLS 0; no overflow; decorative; selective images`,m.cls===0&&!m.overflow&&m.decorative&&m.art.length===(kind==='admin'?2:3));
   fs.writeFileSync(out+'/progress.json',JSON.stringify({checks,metrics,errors,completedMotionKinds},null,2));await c.close();
  }
 }
 if(quick||completedMotionKinds.includes(kind))continue;
 // Native 100% scale capture, same application styles. Annotation is QA-only, outside the interface.
 const c=await context({viewport:{width:1440,height:1000},deviceScaleFactor:1,recordVideo:{dir:out+'/video',size:{width:1440,height:1000}}});
 let p=await open(c,kind,themes[0]),q=selectors(kind);
 async function label(text){await p.evaluate(text=>{let e=document.getElementById('qa-caption');if(!e){e=document.createElement('div');e.id='qa-caption';e.style='position:fixed;left:16px;bottom:10px;z-index:2147483647;background:#071c15ee;color:#fff8e7;padding:8px 14px;font:12px system-ui;pointer-events:none;border:1px solid #b8a472;border-radius:5px';document.body.append(e);}e.textContent='LOCAL QA · '+text;},text);}
 await label('Idle · sound off · intercepted Firebase');await p.waitForTimeout(1600);
 await label('Email focus / gentle gaze / typing');await p.locator(q.email).focus();await p.keyboard.type('review@example.com',{delay:65});await p.waitForTimeout(1200);
 await label('Password · notice → close → turn away → privacy leaf');await p.locator(q.password).focus();await p.keyboard.type('Synthetic-review-123',{delay:55});await p.waitForTimeout(1200);
 await label('Show · one-eye peek');await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(2100);
 await label('Hide · return to privacy');await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(1700);
 await label('Authentication error · intercepted invalid-credential response');await p.evaluate(()=>window.__authScenario='wrong-password');await p.locator(q.submit).click();await p.waitForTimeout(1800);
 await label('Retry · edit restarts privacy');await p.locator(q.password).focus();await p.keyboard.insertText('1');await p.waitForTimeout(1400);await p.keyboard.press('Enter');await p.waitForTimeout(1000);await label('Repeated retry · Enter while password remains focused');await p.keyboard.press('Enter');await p.waitForTimeout(1400);
 await label('Success expression inspection · held shell, no navigation delay added');await p.evaluate(()=>NSAuthShell.signal(document.querySelector('.ns-auth-shell'),'success'));await p.waitForTimeout(1600);
 await label('Actual successful login · immediate account access');await p.evaluate(()=>{window.__authScenario='success';window.__authUser={uid:'qa-owner',email:'owner@example.com',emailVerified:true,displayName:'QA Owner'};});await p.locator(q.submit).click();
 if(kind==='customer')await p.waitForFunction(()=>NS_CUSTOMER_CONTEXT?.uid==='qa-owner');else await p.waitForURL('**/admin-preview.html');
 ok(kind+': actual success reaches account/destination without animation gate',kind==='customer'?await p.locator('.nsacct-userhead').count()===1:new URL(p.url()).pathname==='/admin-preview.html');await p.waitForTimeout(1600);
 p=await open(c,kind,themes[0],p);
 await label(kind==='customer'?'Create account · diagonal transition':'Forgot password · diagonal transition');await p.locator(kind==='customer'?'[data-nsacct-auth-tab="signup"]':'#forgot').click();await p.waitForTimeout(1600);
 await label('Back to Sign in');await p.locator(kind==='customer'?'[data-nsacct-auth-tab="signin"]':'#ns-admin-back').click();await p.waitForTimeout(1300);
 ok(kind+': no audio before opt-in',await p.evaluate(()=>__soundCalls.length===0));
 await label('Sound ON · original 640 ms signature');await p.locator('[data-auth-sound]').click();await p.waitForTimeout(850);
 await p.locator(q.email).focus();await p.keyboard.type('silent');await p.evaluate(()=>NSAuthShell.signal(document.querySelector('.ns-auth-shell'),'error'));
 ok(kind+': email typing and error feedback remain silent',await p.evaluate(()=>__soundCalls.filter(x=>x==='start').length===2));
 await label('Sound ON · privacy rustle (340 ms)');await p.locator(q.password).focus();await p.waitForTimeout(1000);
 await label('Sound ON · restrained wood tick (85 ms)');await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(1000);
 const sound=await p.evaluate(()=>({starts:__soundEvents.filter(e=>e.op==='start'),stops:__soundEvents.filter(e=>e.op==='stop')}));
 ok(kind+': signature, rustle and tick scheduled only after opt-in',sound.starts.length===4&&sound.starts.some(e=>e.kind==='noise')&&sound.stops.some(e=>e.t===.34)&&sound.stops.some(e=>e.t===.64)&&sound.stops.some(e=>e.t===.085));
 await label('Sound OFF · active / scheduled cues cancelled');await p.locator('[data-auth-sound]').click();await p.locator(q.email).focus();await p.keyboard.type('typing');await p.locator(q.password).focus();await p.waitForTimeout(900);
 ok(kind+': OFF stops and suppresses subsequent cues',await p.evaluate(()=>__soundEvents.filter(e=>e.op==='start').length===4&&__soundEvents.some(e=>e.op==='cancel')&&__soundCalls.includes('suspend')));
 await c.close();await p.video().saveAs(`${out}/${kind}-motion.webm`);
 const reduced=await context({reducedMotion:'reduce'}),rp=await open(reduced,kind,themes[0]);
 await rp.locator(q.password).focus();const r1=await state(rp);await rp.locator('.ns-auth-reveal').click();const r2=await state(rp);
 const noMotion=await rp.locator('.ns-auth-shell').evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none'&&getComputedStyle(n).transitionDuration==='0s'));
 ok(kind+': reduced motion keeps static privacy and one-eye peek without animation',noMotion&&r1.primary==='none'&&r2.primary==='none'&&r1.eyes===0&&r2.eyes>0&&r2.far===0&&r1.leaf!==r2.leaf);
 await closeup(rp,kind+'-reduced-motion');await reduced.close();completedMotionKinds.push(kind);fs.writeFileSync(out+'/progress.json',JSON.stringify({checks,metrics,errors,completedMotionKinds},null,2));
}
if(!quick){
 // Resume race: a delayed browser audio-unlock cannot replay after Off.
 const c=await context(),p=await open(c,'customer',themes[0]);
 await p.locator('[data-auth-sound]').click();await p.locator('[data-auth-sound]').click();
 await p.evaluate(()=>window.__delayAudioResume=true);await p.locator('[data-auth-sound]').click();await p.locator('[data-auth-sound]').click();
 await p.evaluate(()=>__resolveAudioResume());await p.waitForTimeout(50);
 ok('Off defeats pending audio resume race',await p.evaluate(()=>__soundCalls.filter(x=>x==='start').length===2));await c.close();
 // Render the production sonic engine with OfflineAudioContext, not an imitation.
 const sonics=fs.readFileSync('assets/js/auth-sonics.js','utf8');
 const audioMetrics=[];
 for(const [cue,duration] of [['privacy',.34],['peek',.085],['signature',.64]]){
  const p=await browser.newPage();await p.setContent('<title>Offline sonic proof</title>');
  await p.evaluate(()=>{window.AudioContext=class extends OfflineAudioContext{constructor(){super(1,48000,48000);window.__offline=this;}get state(){return 'running';}};});
  await p.addScriptTag({content:sonics});
  const data=await p.evaluate(async cue=>{NSAuthSonics.setEnabled(true);NSAuthSonics.play(cue,1);const b=await __offline.startRendering();return Array.from(b.getChannelData(0));},cue);
  const wav=Buffer.alloc(44+data.length*2);wav.write('RIFF');wav.writeUInt32LE(36+data.length*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(data.length*2,40);data.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));fs.writeFileSync(`${out}/${cue}.wav`,wav);
  const peak=data.reduce((m,v)=>Math.max(m,Math.abs(v)),0),grace=.08,tailStart=Math.ceil((duration+grace)*48000),tailPeak=data.slice(tailStart).reduce((m,v)=>Math.max(m,Math.abs(v)),0),peakLimit=.05;
  ok(cue+': real audio render is finite, quiet, unclipped, bounded',data.every(Number.isFinite)&&peak>0&&peak<peakLimit&&tailPeak<.00001);audioMetrics.push({cue,duration,grace,peakLimit,peak,peakDBFS:20*Math.log10(peak),tailPeak});await p.close();
 }
 fs.writeFileSync(out+'/audio-results.json',JSON.stringify(audioMetrics,null,2));
}
ok('No Guardian runtime exceptions',errors.length===0);await browser.close();
fs.writeFileSync(out+'/results.json',JSON.stringify({ok:true,checks,errors,metrics,limits:['Chromium desktop/mobile emulation; physical iOS/Safari not available.','All Firebase adapters intercepted; no production credentials or data.','Motion recordings are silent; real procedural audio renders supplied separately.','Success expression close-ups are explicitly held pose inspections; actual unblocked login is separately recorded and asserted.','CLS measurement covers auth shell sources during local fixture runs; it is not a production field metric.']},null,2));
console.log(`Guardian QA PASS (${checks.length} assertions)`);
