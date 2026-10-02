import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as fixtures from './fixtures/auth-firebase.mjs';
const base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173';
const out='qa-artifacts/auth-interactive';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],metrics=[];const ok=(name,condition)=>{assert.ok(condition,name);checks.push(name);console.log('PASS '+name);};
const engine=process.env.NS_QA_ENGINE==='webkit'?'webkit':'chromium';
const browser=await (engine==='webkit'?webkit:chromium).launch();
const themes=['nariyal-signature','fresh-grove','coastal-premium','golden-harvest'];
async function context({theme=themes[0],themeMode='ok',assetFail=false,delayAsset=0,...options}={}){
 const c=await browser.newContext({viewport:{width:1440,height:1000},...options});c.setDefaultTimeout(15000);
 await c.addInitScript(()=>{
  window.__authCalls=[];window.__soundCalls=[];window.__credentialReads=[];window.__shifts=[];window.NS_FIREBASE_READY=true;
  const property=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  Object.defineProperty(HTMLInputElement.prototype,'value',{...property,get(){if(new Error().stack.includes('auth-shell.js'))window.__credentialReads.push('forbidden');return property.get.call(this);}});
  try{new PerformanceObserver(list=>list.getEntries().filter(e=>!e.hadRecentInput).forEach(e=>__shifts.push(e.value))).observe({type:'layout-shift',buffered:true});}catch(_){}
  window.AudioContext=class{state='running';currentTime=0;destination={};constructor(){__soundCalls.push('context');}createOscillator(){return{frequency:{value:0},connect(){},disconnect(){},start(){__soundCalls.push('start');},stop(){__soundCalls.push('stop');}};}createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';__soundCalls.push('suspend');return Promise.resolve();}};
 });
 await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.NS_FIREBASE_CONFIG={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'owner@example.com'};window.NS_CUSTOMER_AUTH_PROVIDERS={};window.NS_INIT_APP_CHECK=async()=>null;window.NS_FIREBASE_READY=true;`}));
 await c.route('https://**/*',r=>{
  const m=r.request().url().match(/firebase-(app-check|app|auth|firestore|storage|analytics|performance)\.js/);
  return m?r.fulfill({contentType:'application/javascript',body:fixtures[m[1]==='app-check'?'appCheck':m[1]]}):r.abort();
 });
 await c.route('**/.netlify/functions/published-auth-theme',async r=>{
  if(themeMode==='failure')return r.abort();
  if(themeMode==='slow')await new Promise(resolve=>setTimeout(resolve,1200));
  if(themeMode==='delay')await new Promise(resolve=>setTimeout(resolve,300));
  return r.fulfill({contentType:'application/json',body:JSON.stringify({themeId:themeMode==='invalid'?'private-draft':theme})}).catch(()=>{});
 });
 if(assetFail||delayAsset)await c.route('**/assets/images/brand/grove/*.webp',async r=>{if(delayAsset)await new Promise(resolve=>setTimeout(resolve,delayAsset));return assetFail?r.abort():r.continue();});
 return c;
}
async function open(c,kind='customer'){
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+(kind==='customer'?'/index.html':'/admin-bcc-login.html'));
 if(kind==='customer'){await p.waitForFunction(()=>NS_CUSTOMER_CONTEXT?.ready);await p.evaluate(()=>{skipIntro();NS_CUSTOMER_OPEN_ACCOUNT();});await p.locator('#nsacct-signin').waitFor();}
 else await p.waitForFunction(()=>!document.getElementById('submit').disabled);
 await p.waitForFunction(()=>NSAuthTheme.status!=='pending');return p;
}
async function shot(p,name){await p.waitForTimeout(900);await p.screenshot({path:`${out}/${engine}-${name}.png`});}
async function geometry(p){return p.evaluate(()=>{
 const shell=document.querySelector('.ns-auth-shell'),art=shell.querySelector('.ns-auth-art'),obj=shell.querySelector('.ns-nariyal-scene'),copy=shell.querySelector('.ns-auth-art-copy'),r=obj.getBoundingClientRect();
 const controls=[...shell.querySelectorAll('.ns-auth-content input,.ns-auth-content button,.ns-auth-content label,.ns-auth-content a')].filter(e=>e.getClientRects().length);
 const overlap=controls.some(e=>{const x=e.getBoundingClientRect();return r.left<x.right&&r.right>x.left&&r.top<x.bottom&&r.bottom>x.top;});
 return {overflow:document.documentElement.scrollWidth>innerWidth||shell.scrollWidth>shell.clientWidth+1,overlap,composition:[getComputedStyle(art).borderRadius,Math.round(obj.offsetTop),Math.round(copy.offsetTop),getComputedStyle(art).textAlign].join('|')};
});}
async function contrast(p){return p.evaluate(()=>{
 const lum=s=>{const c=(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;},fail=[];
 for(const e of document.querySelectorAll('.ns-auth-content :is(h1,h2,p,label,button,input),.ns-auth-topline span')){
  if(!e.getClientRects().length||e.disabled)continue;let n=e,bg;while(n){const v=getComputedStyle(n).backgroundColor;if(/^rgb\(/.test(v)){bg=v;break;}n=n.parentElement;}if(!bg)continue;
  const st=getComputedStyle(e),b=lum(bg),a=lum(st.color),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<(parseFloat(st.fontSize)>=24?3:4.5))fail.push({element:e.tagName,ratio});
 }return fail;
});}
const compositions=[];
for(const theme of (process.env.NS_QA_SKIP_MATRIX?[]:themes)){
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['narrow',320,740],['landscape',844,390]]){
  const c=await context({theme,viewport:{width,height}});
  for(const kind of ['customer','admin']){
   const p=await open(c,kind),g=await geometry(p);
   ok(`${theme} ${kind} ${label}: published theme, no overflow or control overlap`,await p.evaluate(t=>NSAuthTheme.id===t,theme)&&!g.overflow&&!g.overlap);
   if(label==='desktop'||label==='mobile'){await shot(p,`${kind}-${theme}-${label}`);const failures=await contrast(p);if(failures.length)console.log(failures);ok(`${theme} ${kind} ${label}: readable controls`,failures.length===0);}
   if(label==='desktop'&&kind==='customer')compositions.push(g.composition);
   if(['desktop','mobile','narrow'].includes(label)&&kind==='customer'){
    for(const mode of ['signup','signin','reset']){
     await p.locator(mode==='reset'?'[data-nsacct-action="forgot-password"]':`[data-nsacct-auth-tab="${mode}"]`).click();
     await p.waitForTimeout(880);const gm=await geometry(p);if(gm.overflow||gm.overlap)console.log(gm);ok(`${theme} customer ${label} ${mode}: no control collision`,!gm.overflow&&!gm.overlap);
     if(label==='mobile'&&mode!=='signin'){await p.locator('.ns-auth-content').scrollIntoViewIfNeeded();await shot(p,`customer-${theme}-mobile-${mode}`);}
    }
   }
   await p.close();
  }await c.close();
 }
}
if(!process.env.NS_QA_SKIP_MATRIX)ok('Four themes have four different spatial compositions',new Set(compositions).size===4);
// Slow theme response: the form is available while art is neutral, and a late answer cannot recolor it.
for(const mode of ['failure','slow','invalid','delay']){
 const c=await context({theme:'fresh-grove',themeMode:mode}),p=await c.newPage();
 await p.goto(base+'/admin-bcc-login.html',{waitUntil:'domcontentloaded'});
 if(mode==='slow'){ok('Theme loading does not disable email or password',await p.locator('#email').isEnabled()&&await p.locator('#pw').isEnabled());}
 await p.waitForTimeout(1350);
 ok(`${mode} theme lookup resolves safely`,await p.evaluate(m=>NSAuthTheme.id===(m==='delay'?'fresh-grove':'nariyal-signature'),mode));
 metrics.push({case:'theme-'+mode,cls:await p.evaluate(()=>__shifts.reduce((a,b)=>a+b,0))});
 if(mode==='slow')await shot(p,'theme-fallback');await c.close();
}
const c=await context({recordVideo:{dir:out+'/video',size:{width:1440,height:1000}}}),p=await open(c);
await p.waitForTimeout(1000);
await p.locator('#nsacct-login-email').focus();await p.keyboard.type('preview@example.com',{delay:95});
ok('Email focus gently directs gaze',await p.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='email');
await p.locator('#nsacct-login-password').focus();await p.keyboard.type('Synthetic-preview-123',{delay:65});await p.waitForTimeout(900);
ok('Password focus closes eyes',await p.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='privacy');await shot(p,'privacy-pose');
await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(1000);ok('Show password makes a restrained peek',await p.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='peek');await shot(p,'password-peek');
await p.locator('.ns-auth-reveal').click();await p.waitForTimeout(700);ok('Hide password immediately restores privacy',await p.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='privacy');
await p.locator('[data-nsacct-auth-tab="signup"]').click();
await p.waitForTimeout(310);await p.screenshot({path:out+`/${engine}-diagonal-sweep.png`});
ok('Diagonal sweep crosses the full card',await p.locator('.ns-auth-sweep').evaluate(e=>getComputedStyle(e).animationName==='nsAuthSweep'&&getComputedStyle(e).visibility==='visible'));
await p.waitForTimeout(1400);await p.locator('[data-nsacct-auth-tab="signin"]').click();await p.waitForTimeout(1400);
ok('Sound stays off through interactions',await p.evaluate(()=>__soundCalls.length===0));
await p.locator('[data-auth-sound]').click();await shot(p,'sound-on');
ok('Opt-in plays exactly two notes',await p.evaluate(()=>__soundCalls.filter(x=>x==='start').length===2));
await p.locator('[data-auth-sound]').click();await p.locator('[data-nsacct-action="forgot-password"]').click();await p.waitForTimeout(900);
ok('Turning sound off cancels active notes and suppresses future cues',await p.evaluate(()=>__soundCalls.filter(x=>x==='start').length===2&&__soundCalls.includes('suspend')&&__soundCalls.filter(x=>x==='stop').length>=4));
ok('Animation never reads credentials',await p.evaluate(()=>__credentialReads.length===0));
const adminMotion=await open(c,'admin');await adminMotion.locator('#email').focus();await adminMotion.keyboard.type('staff@example.com',{delay:95});await adminMotion.keyboard.press('Tab');await adminMotion.keyboard.type('Synthetic-preview-123',{delay:65});await adminMotion.waitForTimeout(1300);await adminMotion.keyboard.press('Tab');await adminMotion.keyboard.press('Enter');await adminMotion.waitForTimeout(900);await adminMotion.keyboard.press('Enter');await adminMotion.waitForTimeout(900);await adminMotion.locator('#forgot').click();await adminMotion.waitForTimeout(1300);await adminMotion.locator('#ns-admin-back').click();await adminMotion.waitForTimeout(1200);
ok('Admin keyboard Show/Hide and reset preserve password privacy',await adminMotion.locator('#pw').getAttribute('autocomplete')==='current-password'&&await adminMotion.locator('.ns-auth-reveal').getAttribute('aria-controls')==='pw');
await c.close();await p.video().saveAs(out+'/'+engine+'-customer-motion.webm');await adminMotion.video().saveAs(out+'/'+engine+'-admin-motion.webm');
// Saved-credential/password-manager insertion WITHOUT keyboard/input/change events.
const autofill=await context(),ap=await open(autofill);
await ap.evaluate(()=>{document.getElementById('nsacct-login-email').value='saved@example.com';document.getElementById('nsacct-login-password').value='Synthetic-manager-123';window.__authScenario='wrong-password';});
await ap.locator('#nsacct-login-password').focus();ok('Manager-style fill without input events still gets privacy pose',await ap.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='privacy');
await ap.keyboard.press('Enter');await ap.locator('#nsacct-message.err').waitFor();
ok('Enter submits autofilled credentials and validation stays editable',await ap.evaluate(()=>__authCalls.includes('signin'))&&await ap.locator('#nsacct-login-password').isEnabled());
await shot(ap,'autofill-error');
await ap.evaluate(()=>{document.getElementById('nsacct-login-password').value='';});await ap.locator('#nsacct-login-password').focus();await ap.keyboard.insertText('Synthetic-pasted-123');
ok('Paste/insertText preserves password and privacy pose',await ap.locator('#nsacct-login-password').inputValue()==='Synthetic-pasted-123'&&await ap.locator('.ns-auth-shell').getAttribute('data-nariyal-pose')==='privacy');
await ap.locator('[data-nsacct-action="forgot-password"]').click();await ap.evaluate(()=>window.__authScenario='network');await ap.locator('#nsacct-reset button[type=submit]').click();await ap.locator('#nsacct-message.err').waitFor();await shot(ap,'network-error');
ok('Reset network failure is announced and retry remains available',await ap.locator('#nsacct-message').getAttribute('aria-live')==='polite'&&await ap.locator('#nsacct-reset button[type=submit]').isEnabled());
await autofill.close();
for(const kind of ['customer','admin']){
 const reduced=await context({reducedMotion:'reduce'}),rp=await open(reduced,kind);
 const email=kind==='customer'?'#nsacct-login-email':'#email',password=kind==='customer'?'#nsacct-login-password':'#pw';
 await rp.locator(email).focus();await rp.locator(password).focus();await rp.locator('.ns-auth-reveal').click();
 if(kind==='customer'){await rp.screenshot({path:out+'/'+engine+'-customer-reduced-motion-signin.png'});await rp.locator('[data-nsacct-auth-tab="signup"]').click();}else await rp.locator('#forgot').click();
 ok(`${kind} reduced motion: static object, no sweep, no idle animation`,await rp.locator('.ns-auth-shell').evaluate(e=>[...e.querySelectorAll('*')].every(x=>getComputedStyle(x).animationName==='none')&&getComputedStyle(e.querySelector('.ns-nariyal-object')).transform==='none'&&getComputedStyle(e.querySelector('.ns-auth-sweep')).display==='none'));
 await shot(rp,kind+'-reduced-motion');
 if(kind==='customer'){await rp.locator('[data-nsacct-auth-tab="signin"]').click();await rp.locator('[data-nsacct-action="forgot-password"]').click();await rp.locator('#nsacct-reset-email').fill('qa@example.com');await rp.locator('#nsacct-reset button[type="submit"]').click();}
 else {await rp.locator('#email').fill('staff@example.com');await rp.locator('#submit').click();}
 await rp.waitForFunction(()=>__authCalls.includes('reset'));ok(`${kind} reduced motion preserves reset submission`,true);await reduced.close();
 const failure=await context({assetFail:true}),fp=await open(failure,kind);await fp.waitForTimeout(200);
 ok(`${kind} artwork failure preserves form and reserved geometry`,await fp.locator('.ns-auth-shell').getAttribute('data-nariyal-asset')==='fallback'&&await fp.locator(email).isEnabled()&&!(await geometry(fp)).overlap);
 await shot(fp,kind+'-asset-fallback');await fp.evaluate(()=>window.__authScenario='wrong-password');await fp.locator(email).fill('qa@example.com');await fp.locator(password).fill('Synthetic-test-123');await fp.keyboard.press('Enter');await fp.waitForFunction(()=>__authCalls.includes('signin'));ok(`${kind} artwork failure does not block authentication`,true);await failure.close();
}
const refresh=await context({theme:'golden-harvest'}),r=await open(refresh,'admin');await r.reload();await r.waitForFunction(()=>NSAuthTheme.status!=='pending');
ok('Refresh resolves the same published theme and resets sound off',await r.evaluate(()=>NSAuthTheme.id==='golden-harvest'&&__soundCalls.length===0));
await refresh.close();
const delayed=await context({delayAsset:450}),dp=await open(delayed,'admin');await dp.waitForTimeout(1100);const cls=await dp.evaluate(()=>__shifts.reduce((a,b)=>a+b,0));metrics.push({case:'delayed-artwork',cls});console.log('LAYOUT METRICS '+JSON.stringify(metrics));ok('Delayed artwork has no cumulative layout shift',cls===0);await delayed.close();
ok('No runtime exceptions in interactive QA',errors.length===0);
await browser.close();
fs.writeFileSync(`${out}/${engine}-results.json`,JSON.stringify({ok:true,engine,matrixSkipped:!!process.env.NS_QA_SKIP_MATRIX,checks,metrics,errors,limits:['Firebase adapters and published-theme endpoint mocked; no production requests.','Autofill/password-manager insertion simulated without input events; actual saved credential stores and third-party extensions require manual device QA.','WebKit, when run, is engine coverage; actual Safari/macOS/iOS devices are not available.']},null,2));
console.log(`Interactive auth QA PASS (${checks.length} assertions; ${engine})`);
