// Execute the shipped storefront bootstrap and Firebase readiness path offline.
// No credentials, network, Firebase writes, analytics requests or deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const bootstrap=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(bootstrap?.includes('NSLiveCatalog.connect'),'Exercise the actual commerce bootstrap');
const execute=new Function('window','document','location','setTimeout','mockImport','console',
  'return '+bootstrap.trim().replace(/\bimport\(/g,'mockImport('));
const config={apiKey:'qa-only',projectId:'qa-only',appId:'qa-only'};

for(const supported of [true,false]){
  const events=[],warnings=[];
  const window={NS_FIREBASE_CONFIG:config,NS_ADMIN_CONFIG:{},
    NSLiveCatalog:{connect(){events.push('catalog-connected');}},
    __nsLoadGA4(){events.push('ga4-fallback');},
    __nsFlushAnalytics(){events.push('analytics-flushed');}};
  const app={initializeApp:()=>({})};
  const firestore={getFirestore:()=>({}),serverTimestamp(){throw Error('No write expected');}};
  const analytics={isSupported:async()=>supported,getAnalytics(){events.push('firebase-analytics');return {};},logEvent(){}};
  const performance={getPerformance(){events.push('performance');}};
  const mockImport=async spec=>spec.endsWith('/firebase-app.js')?app:
    spec.endsWith('/firebase-firestore.js')?firestore:
    spec.endsWith('/firebase-analytics.js')?analytics:
    spec.endsWith('/firebase-performance.js')?performance:{};
  await execute(window,{readyState:'complete'},{hostname:'nariyal-sutra.netlify.app'},
    fn=>fn(),mockImport,{warn:(...args)=>warnings.push(args)});
  assert.equal(warnings.length,0,'Production bootstrap must not throw after connecting catalog');
  assert.equal(window.NS_FIREBASE_READY,true);
  assert.equal(window.NS_FIRESTORE_READY,true);
  assert.equal(typeof window.NS_SAVE_ORDER,'function');
  assert.equal(typeof window.NS_SAVE_INQUIRY,'function');
  assert.equal(events.filter(x=>x==='catalog-connected').length,1);
  assert.equal(events.includes('firebase-analytics'),supported);
  assert.equal(events.includes('ga4-fallback'),!supported);
}

// Only the canonical production origin may emit production analytics.
for(const host of ['nariyal-sutra.netlify.app','localhost','127.0.0.1',
  'nariyal-sutra-staging.netlify.app','deploy-preview-13--nariyal-sutra.netlify.app','other.example']){
  const scripts=[],window={};
  vm.runInNewContext(read('assets/js/homepage-analytics.js'),{
    window,location:{hostname:host},document:{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}}
  });
  window.__nsLoadGA4();
  assert.equal(scripts.length,host==='nariyal-sutra.netlify.app'?1:0,
    'Production analytics must remain isolated on '+host);
}

// A deferred firebase-config.js may already be in the document but not executed.
// Reproduce the actual bridge call before DOMContentLoaded, then complete parsing.
const bridge=read('assets/js/v421-production-bridge.js');
const start=bridge.indexOf('async function ensureFirebase(){');
const end=bridge.indexOf('async function adminRole(u){',start);
assert.ok(start>=0&&end>start);
const ensureFactory=new Function('window','document','loadScript','mockImport','isAdmin',
  "const SDK='12.18.0';const adminAuthTrace=()=>{};let appMod,authMod,fsMod,app,auth,db;"+
  bridge.slice(start,end).replace(/\bimport\(/g,'mockImport(')+';return ensureFirebase;');
const calls=[],listeners=new Map(),window={NS_INIT_APP_CHECK:async()=>calls.push('app-check')};
const document={readyState:'loading',addEventListener:(name,fn)=>listeners.set(name,fn)};
const app={getApps:()=>[],getApp:()=>({}),initializeApp:()=>({})};
const modules={'firebase-app.js':app,'firebase-auth.js':{
  getAuth:()=>({}),browserLocalPersistence:{type:'LOCAL'},
  setPersistence:async()=>calls.push('set-persistence')
},'firebase-firestore.js':{getFirestore:()=>({})}};
const ensure=ensureFactory(window,document,async()=>calls.push('load-script'),
  async spec=>{calls.push('import');return modules[spec.split('/').pop()];},false);
const ready=ensure();
await Promise.resolve();
assert.equal(listeners.has('DOMContentLoaded'),true,'Bridge must wait for the existing deferred configuration');
assert.equal(calls.length,0,'Do not initialize or duplicate the configuration while parsing');
window.NS_FIREBASE_CONFIG=config;document.readyState='interactive';
listeners.get('DOMContentLoaded')();
assert.equal(await ready,config);
assert.equal(calls.filter(x=>x==='load-script').length,0,'Do not load a second Firebase config');
assert.equal(calls.filter(x=>x==='import').length,3);
assert.equal(calls.filter(x=>x==='app-check').length,1,'Preserve App Check initialization');
assert.equal(calls.filter(x=>x==='set-persistence').length,0,'Public bridge bootstrap must not change Firebase auth persistence');

// Admin bootstrap must explicitly request durable browser-local persistence.
const adminCalls=[],adminWindow={NS_FIREBASE_CONFIG:config,NS_INIT_APP_CHECK:async()=>adminCalls.push('app-check')};
const adminDocument={readyState:'complete',addEventListener(){throw new Error('Admin config is already ready');}};
const adminModules={'firebase-app.js':app,'firebase-auth.js':{
  getAuth:()=>({}),browserLocalPersistence:{type:'LOCAL'},
  setPersistence:async(_auth,persistence)=>adminCalls.push(['set-persistence',persistence.type])
},'firebase-firestore.js':{getFirestore:()=>({})}};
const adminEnsure=ensureFactory(adminWindow,adminDocument,async()=>adminCalls.push('load-script'),
  async spec=>adminModules[spec.split('/').pop()],true);
assert.equal(await adminEnsure(),config);
assert.deepEqual(adminCalls.filter(x=>Array.isArray(x)&&x[0]==='set-persistence'),
  [['set-persistence','LOCAL']],'Admin bridge must request browser-local Firebase persistence exactly once');

console.log('PASS shipped storefront analytics bootstrap, six-origin isolation, deferred Firebase configuration and App Check readiness');
