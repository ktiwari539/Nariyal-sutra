import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as fixtures from './fixtures/auth-firebase.mjs';
const base=process.env.NS_QA_BASE_URL||'http://127.0.0.1:4173',out='qa-artifacts/auth';
fs.mkdirSync(out,{recursive:true});const checks=[],errors=[];
const ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
const browser=await chromium.launch();
async function context(options={}){
 const c=await browser.newContext({viewport:{width:1440,height:1000},...options});c.setDefaultTimeout(15000);c.setDefaultNavigationTimeout(20000);
 await c.addInitScript(()=>{
  window.__authCalls=[];window.__soundCalls=[];window.NS_FIREBASE_READY=true;
  // Audio instrumentation records requested envelopes without making forced sound during QA.
  window.AudioContext=class{state='running';currentTime=0;destination={};constructor(){window.__soundCalls.push('context');}createOscillator(){return {frequency:{value:0},connect(){},start(){window.__soundCalls.push('start');},stop(){}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';window.__soundCalls.push('suspend');return Promise.resolve();}};
 });
 await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.NS_FIREBASE_CONFIG={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'owner@example.com'};window.NS_CUSTOMER_AUTH_PROVIDERS={};window.NS_INIT_APP_CHECK=async()=>null;window.NS_FIREBASE_READY=true;`}));
 await c.route('https://**/*',r=>{
  const m=r.request().url().match(/firebase-(app-check|app|auth|firestore|storage|analytics|performance)\.js/);
  if(m){const key=m[1]==='app-check'?'appCheck':m[1];return r.fulfill({contentType:'application/javascript',body:fixtures[key]});}
  return r.abort();
 });
 return c;
}
async function customer(c){const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/index.html');await p.waitForFunction(()=>window.NS_CUSTOMER_CONTEXT?.ready);await p.evaluate(()=>{skipIntro();NS_CUSTOMER_OPEN_ACCOUNT();});await p.locator('#nsacct-signin').waitFor();return p;}
async function admin(c,suffix=''){const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/admin-bcc-login.html'+suffix);await p.waitForFunction(()=>!document.getElementById('submit').disabled);return p;}
async function shot(p,name){await p.waitForTimeout(450);await p.screenshot({path:out+'/'+name+'.png',fullPage:false});}
const c=await context({recordVideo:{dir:out+'/motion',size:{width:1200,height:900}}}),p=await customer(c);
const brand=await p.locator('.ns-auth-brand').innerHTML();
ok('Customer sound defaults off with no audio context',await p.locator('[data-auth-sound]').getAttribute('aria-pressed')==='false'&&await p.evaluate(()=>__soundCalls.length===0));
await shot(p,'customer-desktop-signin');
await p.locator('#nsacct-login-email').fill('qa@example.com');await p.locator('[data-nsacct-auth-tab="signup"]').click();
ok('State transition has a bounded diagonal panel reveal',await p.locator('.ns-auth-stage').evaluate(e=>getComputedStyle(e).animationName)==='nsAuthPanelReveal');
ok('Focus moves to new state heading',await p.locator('.ns-auth-title').evaluate(e=>e===document.activeElement));
ok('Email survives auth-state change',await p.locator('#nsacct-signup-email').inputValue()==='qa@example.com');
await shot(p,'customer-desktop-create');
await p.locator('#nsacct-signup-name').fill('QA Person');await p.locator('#nsacct-signup-phone').fill('9876543210');await p.locator('#nsacct-signup-password').fill('Synthetic-test-123');await p.locator('#nsacct-signup-confirm').fill('Different-test-456');await p.locator('#nsacct-terms').check();await p.locator('#nsacct-signup button[type=submit]').click();
ok('Mismatched passwords prevent account creation',await p.evaluate(()=>!__authCalls.includes('signup')));
await p.locator('#nsacct-signup-confirm').fill('Synthetic-test-123');await p.locator('#nsacct-signup button[type=submit]').click();await p.waitForFunction(()=>__authCalls.includes('verify'));
ok('Signup preserves profile creation and verification adapter',await p.evaluate(()=>['signup','profile','setDoc','verify'].every(x=>__authCalls.includes(x))));
await p.locator('[data-nsacct-auth-tab="signin"]').click();await p.locator('[data-nsacct-action="forgot-password"]').click();await shot(p,'customer-desktop-reset');
await p.evaluate(()=>window.__authScenario='missing-user');await p.locator('#nsacct-reset button[type=submit]').click();await p.waitForFunction(()=>__authCalls.includes('reset'));
ok('Customer reset uses provider and neutral account-existence response',(await p.locator('#nsacct-message').innerText()).includes('If this email has an account'));
await p.locator('[data-nsacct-auth-tab="signin"]').click();await p.locator('#nsacct-login-password').fill('Synthetic-test-123');await p.locator('.ns-auth-reveal').click();ok('Password reveal toggles without changing value',await p.locator('#nsacct-login-password').getAttribute('type')==='text');await p.locator('.ns-auth-reveal').click();
await p.evaluate(()=>window.__authScenario='wrong-password');await p.locator('#nsacct-signin button[type=submit]').click();await p.locator('#nsacct-message.show').waitFor();ok('Failed customer login is announced and remains editable',await p.locator('#nsacct-message').getAttribute('aria-live')==='polite'&&!await p.locator('#nsacct-login-email').isDisabled());
await p.locator('[data-auth-sound]').click();ok('Explicit opt-in creates two short chime notes',await p.evaluate(()=>__soundCalls.filter(x=>x==='start').length===2));await shot(p,'sound-enabled');await p.locator('[data-auth-sound]').click();await p.locator('[data-nsacct-auth-tab="signup"]').click();ok('Off toggle silences further state changes',await p.evaluate(()=>__soundCalls.filter(x=>x==='start').length===2&&__soundCalls.includes('suspend')));
await p.locator('[data-nsacct-close]').last().focus();await p.keyboard.press('Tab');ok('Keyboard remains in customer dialog',await p.evaluate(()=>document.querySelector('#nsacct-panel').contains(document.activeElement)));
await p.keyboard.press('Escape');ok('Escape closes account and unlocks storefront',!await p.locator('#nsacct-overlay').evaluate(e=>e.classList.contains('open')));
const a=await admin(c);ok('Customer and Admin use identical brand lockup',await a.locator('.ns-auth-brand').innerHTML()===brand);ok('Admin never offers signup',await a.locator('[data-nsacct-auth-tab="signup"]').count()===0);
await shot(a,'admin-desktop-signin');await a.locator('#email').fill('staff@example.com');await a.locator('#forgot').click();ok('Admin reset removes password from focus/validation',!await a.locator('#pw').isVisible()&&await a.locator('#pw').isDisabled());await shot(a,'admin-desktop-reset');await a.locator('#submit').click();await a.waitForFunction(()=>__authCalls.includes('reset'));ok('Admin reset reaches provider',await a.locator('#msg').innerText().then(s=>s.includes('If this email has an account')));
await a.locator('#ns-admin-back').click();await a.locator('#pw').fill('Synthetic-test-123');await a.evaluate(()=>window.__authUser={uid:'qa-no-role',email:'staff@example.com',emailVerified:true});await a.locator('#submit').click();await a.waitForFunction(()=>__authCalls.includes('signout'));ok('Unassigned identity is denied and signed out',a.url().includes('admin-bcc-login')&&(await a.locator('#msg').innerText()).includes('does not have active'));
async function gate(name,user,role,expectPath){const x=await admin(c,'?next=https://example.com/unsafe');await x.evaluate(({user,role})=>{window.__authUser=user.uid==='OWNER'?{...user,uid:NS_ADMIN_CONFIG.ownerUid,email:NS_ADMIN_CONFIG.ownerEmail}:user.email==='OWNER'?{...user,email:NS_ADMIN_CONFIG.ownerEmail}:user;window.__authRole=role;},{user,role});await x.locator('#email').fill('staff@example.com');await x.locator('#pw').fill('Synthetic-test-123');await x.locator('#submit').click();if(expectPath)await x.waitForURL('**'+expectPath);else await x.waitForFunction(()=>__authCalls.includes('signout'));ok(name,expectPath?new URL(x.url()).pathname===expectPath:x.url().includes('admin-bcc-login'));await x.close();}
await gate('Unverified Owner receives verification but cannot enter',{uid:'OWNER',email:'OWNER',emailVerified:false},null);
await gate('Wrong Owner UID cannot enter',{uid:'wrong-owner',email:'OWNER',emailVerified:true},null);
await gate('Inactive staff cannot enter',{uid:'staff',email:'staff@example.com',emailVerified:true},{role:'Admin',email:'staff@example.com',status:'Active',active:false});
await gate('Mismatched staff email cannot enter',{uid:'staff',email:'staff@example.com',emailVerified:true},{role:'Admin',email:'another@example.com',status:'Active',active:true});
// Block the destination document so tests never execute the Admin application.
await c.route('**/admin-preview.html',r=>r.fulfill({contentType:'text/html',body:'<title>Authorized QA destination</title>'}));
await gate('Verified Owner enters only the safe same-origin destination',{uid:'OWNER',email:'OWNER',emailVerified:true},null,'/admin-preview.html');
await gate('Verified active staff enters only the safe same-origin destination',{uid:'staff',email:'staff@example.com',emailVerified:true},{role:'Admin',email:'staff@example.com',status:'Active',active:true},'/admin-preview.html');
for(const [label,width,height] of [['tablet',768,1024],['mobile',390,844],['small-mobile',320,740]]){
 const d=await context({viewport:{width,height}}),cp=await customer(d),ap=await admin(d);
 for(const [kind,page] of [['customer',cp],['admin',ap]]){ok(kind+' '+label+' has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.ns-auth-shell').scrollWidth<=document.querySelector('.ns-auth-shell').clientWidth+1));await shot(page,kind+'-'+label);}
 if(label==='mobile'){await cp.locator('[data-nsacct-auth-tab="signup"]').click();await shot(cp,'customer-mobile-create');await cp.locator('[data-nsacct-auth-tab="signin"]').click();await cp.locator('[data-nsacct-action="forgot-password"]').click();await shot(cp,'customer-mobile-reset');await ap.locator('#forgot').click();await shot(ap,'admin-mobile-reset');}
 if(label==='mobile'){await cp.locator('.ns-auth-content').scrollIntoViewIfNeeded();await shot(cp,'customer-mobile-form');}
 await d.close();
}
const reduced=await context({reducedMotion:'reduce'}),rp=await customer(reduced);await rp.locator('[data-nsacct-auth-tab="signup"]').click();ok('Reduced motion suppresses panel animation',await rp.locator('.ns-auth-stage').evaluate(e=>getComputedStyle(e).animationName)==='none');ok('New session sound defaults off',await rp.locator('[data-auth-sound]').getAttribute('aria-pressed')==='false');await shot(rp,'reduced-motion');await reduced.close();
// Existing signed-in account functionality must remain accessible after successful login.
const success=await context(),sp=await customer(success);
await sp.locator('#nsacct-login-email').fill('customer@example.com');await sp.locator('#nsacct-login-password').fill('Synthetic-test-123');await sp.locator('#nsacct-signin button[type=submit]').click();await sp.waitForFunction(()=>NS_CUSTOMER_CONTEXT?.uid==='qa-customer');
ok('Successful customer login retains the signed-in account drawer',await sp.locator('.nsacct-userhead').count()===1&&!await sp.locator('#nsacct-panel').evaluate(e=>e.classList.contains('ns-auth-panel')));
ok('Success acknowledgement survives the signed-in render without delaying access',await sp.locator('#nsacct-panel').evaluate(e=>e.classList.contains('ns-auth-acknowledged')));
await sp.screenshot({path:out+'/success-acknowledgement.png'});
await success.close();
// Read real computed foreground/background pairs to catch conflicts from storefront CSS.
async function contrast(page){return page.evaluate(()=>{
 const rgb=s=>{const n=s.match(/[\d.]+/g);return n?n.map(Number):[0,0,0,0];};
 const lum=c=>{const n=c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return n[0]*.2126+n[1]*.7152+n[2]*.0722;};
 const failures=[];
 for(const e of document.querySelectorAll('.ns-auth-content h1,.ns-auth-content h2,.ns-auth-content p,.ns-auth-content label,.ns-auth-content button,.ns-auth-content input,.ns-auth-topline span')){
  const st=getComputedStyle(e);if(!e.getClientRects().length||e.disabled||st.visibility==='hidden')continue;
  let n=e,bg;while(n){const value=rgb(getComputedStyle(n).backgroundColor);if(value[3]===undefined||value[3]===1){bg=value;break;}n=n.parentElement;}
  if(!bg)continue;const fg=rgb(st.color),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(st.fontSize)>=24;
  if(ratio<(large?3:4.5))failures.push({text:e.textContent.slice(0,45),ratio});
  if(e.matches('input[placeholder]')){const v=lum(rgb(getComputedStyle(e,'::placeholder').color)),r=(Math.max(v,b)+.05)/(Math.min(v,b)+.05);if(r<4.5)failures.push({text:'placeholder',ratio:r});}
 }
 return failures;
});}
const colors=await context(),colorPage=await customer(colors);
for(const theme of ['nariyal-signature','fresh-grove','coastal-premium','golden-harvest']){await colorPage.evaluate(t=>document.documentElement.dataset.nsTheme=t,theme);const failures=await contrast(colorPage);ok('Customer readable computed contrast under '+theme,failures.length===0);}
const colorAdmin=await admin(colors);const adminContrast=await contrast(colorAdmin);if(adminContrast.length)console.log(adminContrast);ok('Admin inputs and copy meet computed contrast thresholds',adminContrast.length===0);
await colors.close();
await c.close();await p.video().saveAs(out+'/customer-motion.webm');await a.video().saveAs(out+'/admin-motion.webm');await browser.close();ok('No browser runtime exceptions',errors.length===0);fs.writeFileSync(out+'/results.json',JSON.stringify({ok:true,checks,errors,mode:'Local browser with intercepted Firebase adapters; zero production network calls'},null,2));console.log(`Auth experience QA PASS (${checks.length} assertions)`);
