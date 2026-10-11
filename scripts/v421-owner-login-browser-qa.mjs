/**
 * Execute the actual admin-bcc-login.html inline module against mocked Firebase ESM.
 * Synthetic canonical origin; every request fulfilled locally or blocked, no credentials.
 * Does not certify the real hosted Firebase Owner session.
 */
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const origin='https://nariyal-sutra.netlify.app';
const html=readFileSync(new URL('../admin-bcc-login.html',import.meta.url),'utf8');
const fakeApp=String.raw\`
export const getApps=()=>[];
export const initializeApp=cfg=>({name:'qa-mock-app'});
export const getApp=()=>({name:'qa-mock-app'});
\`;
const fakeAuth=String.raw\`
function state(){
  if(!window.__ownerQaAuth){
    const cfg=window.__ownerQaFixture||{};
    const initial=cfg.persisted?{uid:cfg.mismatch?'mismatched-uid':'qa-owner',email:'qa-owner@example.test',emailVerified:true}:null;
    window.__ownerQaAuth={currentUser:initial,listeners:[],signouts:0,signins:0,mode:cfg.mode||'normal',authStateReady:async()=>{}};
  }
  return window.__ownerQaAuth;
}
export const getAuth=()=>state();
export function onAuthStateChanged(auth,listener){
  auth.listeners.push(listener);
  queueMicrotask(()=>listener(auth.currentUser));
  return ()=>{auth.listeners=auth.listeners.filter(x=>x!==listener)};
}
export async function signOut(auth){
  auth.signouts++;
  if(auth.mode==='rejectSignout')throw new Error('QA sign-out failure');
  auth.currentUser=null;
  auth.listeners.forEach(fn=>fn(null));
}
export async function signInWithEmailAndPassword(auth,email,password){
  auth.signins++;
  if(auth.mode==='rejectSignin')throw new Error('QA sign-in failure');
  auth.currentUser={uid:auth.mode==='mismatchSignin'?'wrong-owner':'qa-owner',email,emailVerified:true};
  auth.listeners.forEach(fn=>fn(auth.currentUser));
  return {user:auth.currentUser};
}
export async function sendEmailVerification(){}
export async function sendPasswordResetEmail(){}
\`;
const fakeFirestore=String.raw\`
export const getFirestore=()=>({});
export const doc=(_db,...segments)=>segments.join('/');
export async function getDoc(){return {exists:()=>false,data:()=>({})}};
\`;
const modules={
  '/firebase-app.js':fakeApp,
  '/firebase-auth.js':fakeAuth,
  '/firebase-firestore.js':fakeFirestore
};
const browser=await chromium.launch({headless:true});
let passed=0;
try {
  async function openScenario({query='',persisted=false,mode='normal',mismatch=false}={}){
    const context=await browser.newContext({serviceWorkers:'block'});
    await context.addInitScript(args=>{
      window.__ownerQaFixture=args;
      window.__ownerQaLoginRedirects=[];
      window.NSAuthShell={signal(){}};
    },{persisted,mode,mismatch});
    const requests=[];
    await context.route('**/*',route=>{
      const url=route.request().url();
      requests.push(url);
      const u=new URL(url);
      const h={'access-control-allow-origin':'*','cache-control':'no-store'};
      if(u.origin===origin&&u.pathname==='/admin-bcc-login.html'){
        return route.fulfill({status:200,contentType:'text/html',headers:h,body:html});
      }
      if(u.origin===origin&&u.pathname==='/firebase-config.js'){
        return route.fulfill({status:200,contentType:'application/javascript',headers:h,
          body:"window.NS_FIREBASE_CONFIG={apiKey:'qa-key',projectId:'qa-project',appId:'qa-app'};window.NS_ADMIN_CONFIG={ownerUid:'qa-owner',ownerEmail:'qa-owner@example.test'};"});
      }
      if(u.origin===origin&&(u.pathname==='/admin-preview.html'||u.pathname==='/admin.html')){
        return route.fulfill({status:200,contentType:'text/html',headers:h,
          body:'<!doctype html><title>QA Authenticated Admin Landing</title><p id="qa-admin">Admin navigation reached</p>'});
      }
      if(u.hostname==='www.gstatic.com'&&u.pathname.includes('/firebasejs/12.18.0/')){
        const source=Object.entries(modules).find(([suffix])=>u.pathname.endsWith(suffix))?.[1];
        if(source)return route.fulfill({status:200,contentType:'text/javascript',headers:h,body:source});
      }
      // Never allow a real request to Firebase, Netlify, fonts or third parties.
      return route.abort();
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/admin-bcc-login.html'+query,{waitUntil:'domcontentloaded',timeout:15000});
    return {context,page,requests,errors};
  }
  async function done(s){
    assert.equal(s.requests.filter(url=>url.includes('firebaseio.com')||url.includes('googleapis.com/identitytoolkit')).length,0);
    await s.context.close();passed++;
  }
  // Scenario 1: A persisted Firebase Owner must NOT automatically reenter Admin on explicit logout.
  {
    const s=await openScenario({query:'?signed_out=1',persisted:true});
    await s.page.getByText('You are signed out. Sign in again to access Admin.').waitFor();
    const state=await s.page.evaluate(()=>({path:location.pathname,auth:window.__ownerQaAuth,
      disabled:document.getElementById('submit').disabled}));
    assert.equal(state.path,'/admin-bcc-login.html');
    assert.equal(state.auth.currentUser,null);
    assert.equal(state.auth.signouts,1);
    assert.equal(state.disabled,false);
    await s.page.reload({waitUntil:'domcontentloaded'});
    await s.page.waitForTimeout(250);
    assert.equal(new URL(s.page.url()).pathname,'/admin-bcc-login.html',
      'Signed-out login refresh must not silently reenter Admin');
    await done(s);
  }
  // Scenario 2: Manual verified Owner sign-in works after logout and is the ONLY reentry route.
  {
    const s=await openScenario({query:'?signed_out=1',persisted:true});
    await s.page.getByText('You are signed out. Sign in again to access Admin.').waitFor();
    await s.page.locator('#email').fill('qa-owner@example.test');
    await s.page.locator('#pw').fill('qa-local-password');
    await s.page.locator('#submit').click();
    await s.page.waitForURL(url=>url.pathname==='/admin-preview.html',{timeout:8000});
    assert.equal(await s.page.locator('#qa-admin').count(),1);
    await done(s);
  }
  // Scenario 3: A failed sign-out must keep login disabled and fail closed.
  {
    const s=await openScenario({query:'?signed_out=1',persisted:true,mode:'rejectSignout'});
    await s.page.getByText('Sign-out could not be confirmed. Reload this page to retry.').waitFor();
    assert.equal(await s.page.locator('#submit').isDisabled(),true);
    assert.equal(new URL(s.page.url()).pathname,'/admin-bcc-login.html');
    await done(s);
  }
  // Scenario 4: A normal persisted valid session may resume Admin (intentional).
  {
    const s=await openScenario({persisted:true});
    await s.page.waitForURL(url=>url.pathname==='/admin-preview.html',{timeout:8000});
    await done(s);
  }
  // Scenario 5: Wrong Owner UID must not enter.
  {
    const s=await openScenario({persisted:true,mismatch:true});
    await s.page.getByText('The verified Owner email is correct, but its Firebase identity no longer matches the configured Owner binding.').waitFor();
    assert.equal(new URL(s.page.url()).pathname,'/admin-bcc-login.html');
    assert.equal((await s.page.evaluate(()=>window.__ownerQaAuth.currentUser)),null);
    await done(s);
  }
  // Scenario 6: Disallow cross-origin next URL when Owner signs in.
  {
    const s=await openScenario({query:'?signed_out=1&next=https%3A%2F%2Fevil.example%2Fsteal',persisted:false});
    await s.page.getByText('You are signed out. Sign in again to access Admin.').waitFor();
    await s.page.locator('#email').fill('qa-owner@example.test');
    await s.page.locator('#pw').fill('qa-local-password');
    await s.page.locator('#submit').click();
    await s.page.waitForURL(url=>url.pathname==='/admin-preview.html',{timeout:8000});
    assert.equal(s.page.url().startsWith(origin),true,'Never redirect to external origin');
    await done(s);
  }
  console.log('PASS real Admin login HTML in isolated Chromium: '+passed+' mocked Firebase scenarios; no external network');
} finally {
  await browser.close();
}
