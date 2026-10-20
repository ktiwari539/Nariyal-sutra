// Pure mock Firebase auth-events test of actual shipped open-tab Admin guard.
// No Firebase credentials, storage writes, HTTP requests or deployment needed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const bridge=fs.readFileSync(new URL('../assets/js/v421-production-bridge.js',import.meta.url),'utf8');

const routeExpression=bridge.match(/const isAdmin=([^;]+);/)?.[1];
assert.ok(routeExpression,'Production Admin route predicate exists');
const matchesAdmin=path=>new Function('location','return '+routeExpression)({pathname:path});
for(const path of ['/admin-preview.html','/admin-preview','/admin-preview/']){
  assert.equal(matchesAdmin(path),true,'Known Admin rewrite must require Firebase auth: '+path);
}
for(const path of ['/','/admin.html','/coconut-water','/admin-preview-not-really']){
  assert.equal(matchesAdmin(path),false,'Non-Admin path must not enable Admin bridge: '+path);
}

const adminHtml=fs.readFileSync(new URL('../admin-preview.html',import.meta.url),'utf8');
assert.ok(adminHtml.includes("location.hostname==='nariyal-sutra.netlify.app'"),'First paint gate restricted to production host');
assert.ok(adminHtml.includes('html.ns-production-auth-pending .ap-app{visibility:hidden!important}'),'Production Admin UI hidden before auth finishes');
assert.ok(bridge.includes("document.documentElement.classList.remove('ns-production-auth-pending')"),'Successful authenticated setup releases shell gate');
const waitFrom=bridge.indexOf('function recentAdminHandoff(){');
const waitTo=bridge.indexOf('async function readPublicOnce',waitFrom);
assert.ok(waitFrom>0&&waitTo>waitFrom,'Admin auth restoration grace helper exists');
const waitSource=bridge.slice(waitFrom,waitTo).replace('2500','25');
const waitHarness=new Function('withHandoff','restoreLater','restoreDuringReady',`return (async()=>{
 const storage=new Map();if(withHandoff)storage.set('ns-admin-auth-handoff',String(Date.now()));
 const sessionStorage={getItem:k=>storage.get(k)||null,removeItem:k=>storage.delete(k)};
 let current=null,observer=null;
 const auth={
  get currentUser(){return current},set currentUser(v){current=v},
  async authStateReady(){
   if(restoreDuringReady){await new Promise(resolve=>setTimeout(resolve,5));auth.currentUser={uid:'qa-owner'};}
  }
 };
 const authMod={onAuthStateChanged(_auth,fn){observer=fn;queueMicrotask(()=>fn(auth.currentUser));return ()=>{}}};
 ${waitSource}
 if(restoreLater)setTimeout(()=>{auth.currentUser={uid:'qa-owner'};observer?.(auth.currentUser);},5);
 const user=await waitAuth();
 return {uid:user&&user.uid||'',marker:storage.has('ns-admin-auth-handoff')};
})()`);
const restored=await waitHarness(true,true,false);
assert.equal(restored.uid,'qa-owner','Recent verified login handoff must survive a transient initial null auth state');
assert.equal(restored.marker,false,'Successful Admin restoration clears the one-time handoff marker');
const reloadRestored=await waitHarness(false,false,true);
assert.equal(reloadRestored.uid,'qa-owner','Persisted Owner session must restore on Admin reload/tab wake even without a handoff marker');
const noHandoff=await waitHarness(false,false,false);
assert.equal(noHandoff.uid,'','Direct unauthenticated Admin visit must still fail closed after Firebase auth state is ready');

const from=bridge.indexOf('let adminSessionTerminated=false');
const to=bridge.indexOf('function installSignOut(){',from);
assert.ok(from>0&&to>from,'Find actual production Admin session watcher');
const source=bridge.slice(from,to).replace('2500','25');
assert.ok(bridge.includes('remoteReady=true;monitorAdminAuthSession();if(adminSessionTerminated)return;'),
 'Admin must activate watcher immediately after remote readiness');
const harness=new Function('initial','enabled','admin',String.raw`
 const events=[],unsubs=[],auth={currentUser:initial};
 let isAdmin=admin,remoteReady=enabled,user=initial,role='Owner',
   roleRecord={role:'Owner'},pendingState={private:'pending'},saveTimer=null;
 const overlay=text=>events.push(['overlay',text]);
 const clearOverlay=()=>events.push(['clearOverlay']);
 const Store={setSession:s=>events.push(['session',s])};
 const storage=new Map([['ns_v10_admin_session','stale'],['ns-v421-preview-role','Owner']]);
 const sessionStorage={removeItem:k=>storage.delete(k)};
 const location={replace:u=>events.push(['redirect',u])};
 let observer=null;
 const authMod={onAuthStateChanged(_auth,fn){observer=fn;return ()=>events.push(['unsubscribe']);}};
 ${source}
 monitorAdminAuthSession();
 return {
  emit(next){auth.currentUser=next;observer?.(next);},
  async settle(ms=40){await new Promise(resolve=>setTimeout(resolve,ms));},
  getState(){return {remoteReady,user,role,roleRecord,pendingState,adminSessionTerminated,
   storage:[...storage.keys()],events:[...events],listener:!!observer,unsubs:unsubs.length}}
 };
`);
const owner={uid:'qa-owner',email:'owner@example.test',emailVerified:true};
const same=harness(owner,true,true);
assert.equal(same.getState().listener,true);
same.emit({...owner});
assert.equal(same.getState().events.length,0,'Same-user state refresh must not force logout');

const transient=harness(owner,true,true);
transient.emit(null);
assert.equal(transient.getState().remoteReady,false,'Transient null must block Admin immediately while session is rechecked');
assert.equal(transient.getState().events.filter(e=>e[0]==='redirect').length,0,'Transient null must not redirect before confirmation');
transient.emit({...owner});
await transient.settle();
assert.equal(transient.getState().remoteReady,true,'Same Owner restoration must resume Admin after transient null');
assert.equal(transient.getState().adminSessionTerminated,false);
assert.equal(transient.getState().events.filter(e=>e[0]==='redirect').length,0);

const endedSession=harness(owner,true,true);
endedSession.emit(null);
assert.equal(endedSession.getState().remoteReady,false,'Confirmed logout is blocked immediately');
await endedSession.settle();
let ended=endedSession.getState();
assert.equal(ended.remoteReady,false);
assert.equal(ended.user,null);
assert.equal(ended.role,'');
assert.equal(ended.roleRecord,null);
assert.equal(ended.pendingState,null);
assert.deepEqual(ended.storage,[]);
assert.equal(ended.events.filter(e=>e[0]==='redirect').length,1);
assert.deepEqual(ended.events.filter(e=>e[0]==='redirect')[0],['redirect','/admin-bcc-login.html?signed_out=1']);
endedSession.emit(null);
await endedSession.settle(5);
assert.equal(endedSession.getState().events.filter(e=>e[0]==='redirect').length,1,'Repeated sign-out must redirect once');

const switched=harness(owner,true,true);
switched.emit({uid:'another-uid'});
assert.equal(switched.getState().adminSessionTerminated,true,'Identity switch must revoke Admin immediately');

const intentional=harness(owner,false,true);
intentional.emit(null);
await intentional.settle(35);
assert.equal(intentional.getState().events.length,0,'Explicit Admin logout owns redirect while writes are paused');

const early=harness(null,true,true);
await early.settle();
assert.equal(early.getState().adminSessionTerminated,true,'Session absent after restoration window must fail closed');

const preview=harness(owner,true,false);
assert.equal(preview.getState().listener,false,'Preview host must not install production auth watcher');
console.log('PASS actual Admin Firebase auth-state watcher: same UID, logout, repeat, switch, in-progress logout, startup race, non-admin');
