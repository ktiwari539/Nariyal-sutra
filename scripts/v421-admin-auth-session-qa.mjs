// Pure mock Firebase auth-events test of actual shipped open-tab Admin guard.
// No Firebase credentials, storage writes, HTTP requests or deployment needed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const bridge=fs.readFileSync(new URL('../assets/js/v421-production-bridge.js',import.meta.url),'utf8');
const adminHtml=fs.readFileSync(new URL('../admin-preview.html',import.meta.url),'utf8');
assert.ok(adminHtml.includes("location.hostname==='nariyal-sutra.netlify.app'"),'First paint gate restricted to production host');
assert.ok(adminHtml.includes('html.ns-production-auth-pending .ap-app{visibility:hidden!important}'),'Production Admin UI hidden before auth finishes');
assert.ok(bridge.includes("document.documentElement.classList.remove('ns-production-auth-pending')"),'Successful authenticated setup releases shell gate');
const from=bridge.indexOf('let adminSessionTerminated=false;');
const to=bridge.indexOf('function installSignOut(){',from);
assert.ok(from>0&&to>from,'Find actual production Admin session watcher');
const source=bridge.slice(from,to);
assert.ok(bridge.includes('remoteReady=true;monitorAdminAuthSession();if(adminSessionTerminated)return;'),
 'Admin must activate watcher immediately after remote readiness');
const harness=new Function('initial','enabled','admin',String.raw`
 const events=[],unsubs=[],auth={currentUser:initial};
 let isAdmin=admin,remoteReady=enabled,user=initial,role='Owner',
   roleRecord={role:'Owner'},pendingState={private:'pending'};
 const saveTimer={id:1};
 const clearTimeout=id=>events.push(['cancel',id.id]);
 const overlay=text=>events.push(['overlay',text]);
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
  getState(){return {remoteReady,user,role,roleRecord,pendingState,adminSessionTerminated,
   storage:[...storage.keys()],events:[...events],listener:!!observer,unsubs:unsubs.length}}
 };
`);
const owner={uid:'qa-owner',email:'owner@example.test',emailVerified:true};
const same=harness(owner,true,true);
assert.equal(same.getState().listener,true);
same.emit({...owner});
assert.equal(same.getState().events.length,0,'Same-user state refresh must not force logout');
same.emit(null);
let ended=same.getState();
assert.equal(ended.remoteReady,false);
assert.equal(ended.user,null);
assert.equal(ended.role,'');
assert.equal(ended.roleRecord,null);
assert.equal(ended.pendingState,null);
assert.deepEqual(ended.storage,[]);
assert.equal(ended.events.filter(e=>e[0]==='redirect').length,1);
assert.deepEqual(ended.events.filter(e=>e[0]==='redirect')[0],['redirect','/admin-bcc-login.html?signed_out=1']);
same.emit(null);
assert.equal(same.getState().events.filter(e=>e[0]==='redirect').length,1,'Repeated sign-out must redirect once');
const switched=harness(owner,true,true);
switched.emit({uid:'another-uid'});
assert.equal(switched.getState().adminSessionTerminated,true,'Identity switch must revoke Admin');
const intentional=harness(owner,false,true);
intentional.emit(null);
assert.equal(intentional.getState().events.length,0,'Explicit Admin logout owns redirect while writes are paused');
const early=harness(null,true,true);
assert.equal(early.getState().adminSessionTerminated,true,'Session lost during initial data load must fail closed');
const preview=harness(owner,true,false);
assert.equal(preview.getState().listener,false,'Preview host must not install production auth watcher');
console.log('PASS actual Admin Firebase auth-state watcher: same UID, logout, repeat, switch, in-progress logout, startup race, non-admin');
