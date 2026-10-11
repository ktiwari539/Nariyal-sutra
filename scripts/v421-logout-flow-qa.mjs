// Targeted, offline Owner logout lifecycle regression. No network, Firebase, or Netlify deployment.
// Run: node scripts/v421-logout-flow-qa.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../admin-bcc-login.html',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../assets/js/v421-production-bridge.js',import.meta.url),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Admin login module must exist');
assert.ok(bridge.includes("await authMod.signOut(auth);"),'Firebase bridge signOut must remain');
assert.ok(bridge.includes("if(auth.currentUser)throw new Error('Firebase session remained authenticated after sign-out.')"),'Firebase bridge must verify cleared session');
const launch=new Function('mockImport','window','document','location','console','URL','URLSearchParams','sessionStorage',
  'return (async()=>{ '+script.replace(/\bimport\(/g,'mockImport(')+' })();');
const owner={uid:'qa-owner',email:'qa-owner@example.test',emailVerified:true};
async function scenario(search,{initialUser=owner,failSignOut=false,manualSignIn=false}={}){
  const redirects=[],errors=[],storage=new Map([['ns_v10_admin_session','stale'],['ns-v421-preview-role','Owner']]);
  const auth={currentUser:initialUser,async authStateReady(){}};
  let observer,submit,signOutCalls=0;
  const msg={className:'',textContent:''},button={disabled:true};
  const form={
    dataset:{authMode:'signin'},busy:null,
    getAttribute(name){return name==='aria-busy'?this.busy:null;},
    setAttribute(name,value){if(name==='aria-busy')this.busy=value;},
    removeAttribute(name){if(name==='aria-busy')this.busy=null;},
    addEventListener(name,fn){if(name==='submit')submit=fn;}
  };
  const controls={msg,submit:button,login:form,email:{value:owner.email},pw:{value:'test-only'},'ns-admin-auth':{}};
  const document={getElementById:id=>controls[id]||null};
  const window={NS_FIREBASE_CONFIG:{apiKey:'fake',projectId:'fake',appId:'fake'},
    NS_ADMIN_CONFIG:{ownerUid:owner.uid,ownerEmail:owner.email},NSAuthShell:{signal(){}}};
  const firebaseApp={getApps:()=>[],getApp:()=>({}),initializeApp:()=>({})};
  const firebaseAuth={
    getAuth:()=>auth,
    onAuthStateChanged(a,fn){observer=fn;const captured=a.currentUser;Promise.resolve().then(()=>fn(captured));return ()=>{};},
    async signOut(a){signOutCalls++;if(failSignOut)throw Error('simulated sign-out failure');a.currentUser=null;observer?.(null);},
    async signInWithEmailAndPassword(a){a.currentUser=owner;observer?.(owner);return {user:owner};},
    async sendEmailVerification(){},async sendPasswordResetEmail(){}
  };
  const firestore={getFirestore:()=>({}),doc:()=>({}),getDoc:async()=>({exists:()=>false})};
  const mockImport=async spec=>spec.includes('firebase-app.js')?firebaseApp:spec.includes('firebase-auth.js')?firebaseAuth:firestore;
  const location={search,origin:'https://nariyal-sutra.netlify.app',replace:value=>redirects.push(value)};
  const console={error:(...args)=>errors.push(args.join(' '))};
  const sessionStorage={removeItem:key=>storage.delete(key)};
  await launch(mockImport,window,document,location,console,URL,URLSearchParams,sessionStorage);
  await Promise.resolve();
  const initial={redirects:redirects.slice(),signOutCalls,active:!!auth.currentUser,blocked:button.disabled,storageKeys:[...storage.keys()],message:msg.textContent};
  if(manualSignIn){assert.ok(submit);await submit({preventDefault(){},currentTarget:form});}
  return {initial,afterManual:redirects.slice(),errors};
}
const signedOut=await scenario('?signed_out=1',{manualSignIn:true});
assert.deepEqual(signedOut.initial.redirects,[]);
assert.equal(signedOut.initial.signOutCalls,1);
assert.equal(signedOut.initial.active,false);
assert.equal(signedOut.initial.blocked,false);
assert.deepEqual(signedOut.initial.storageKeys,[]);
assert.deepEqual(signedOut.afterManual,['/admin-preview.html']);
const failure=await scenario('?signed_out=1',{failSignOut:true});
assert.deepEqual(failure.initial.redirects,[]);
assert.equal(failure.initial.blocked,true);
assert.equal(failure.initial.active,true);
const signedIn=await scenario('');
assert.deepEqual(signedIn.initial.redirects,['/admin-preview.html']);
const anonymous=await scenario('',{initialUser:null});
assert.deepEqual(anonymous.initial.redirects,[]);
console.log('PASS 4 targeted Admin logout/login lifecycle scenarios (simulated Firebase only)');
