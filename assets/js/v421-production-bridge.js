(function(){
'use strict';
if(window.__NS_V421_PRODUCTION_BRIDGE__)return;
window.__NS_V421_PRODUCTION_BRIDGE__=true;
const Store=window.NSV421Store;
if(!Store)return;
const LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
if(LOCAL)return;
const SDK='12.18.0';
const isAdmin=/admin-preview\.html$/i.test(location.pathname);
const PUBLIC_KEYS=['sections','pageSequences','sectionMedia','media','faceMarquee','peopleStreams','harvest','customSections','stories','content','schedule','settings'];
const PRIVATE_KEYS=['tasks','warehouses','deliveryServices','segments','communications','notificationQueue'];
const originalSave=Store.save.bind(Store);
const originalLoad=Store.load.bind(Store);
let appMod=null,authMod=null,fsMod=null,app=null,auth=null,db=null,user=null,role='';
let remoteReady=false,loadingRemote=false,pendingState=null,saveTimer=null,lastPublicHash='',lastPrivateHash='',lastCatalogHash='',unsubs=[];
let resolveReady;const ready=new Promise(r=>resolveReady=r);
const clone=v=>JSON.parse(JSON.stringify(v));
const safeHash=v=>{try{return JSON.stringify(v)}catch(e){return String(Date.now())}};
function configSlice(s,keys){const o={schemaVersion:s.schemaVersion||Store.SCHEMA,updatedAt:new Date().toISOString()};for(const k of keys)if(s[k]!==undefined)o[k]=clone(s[k]);return o;}
function mergeIntoLocal(parts){
 const s=originalLoad();
 for(const part of parts){if(!part||typeof part!=='object')continue;for(const [k,v] of Object.entries(part)){if(k==='updatedAt'||k==='status'||k==='type'||k==='schemaVersion')continue;if(PUBLIC_KEYS.includes(k)||PRIVATE_KEYS.includes(k))s[k]=clone(v);}}
 originalSave(s);return s;
}
function loadScript(src){return new Promise((res,rej)=>{if([...document.scripts].some(x=>x.src&&x.src.endsWith(src.replace(/^\//,''))))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
function overlay(msg){
 if(!isAdmin)return;
 let e=document.getElementById('nsProductionAdminGuard');
 if(!e){e=document.createElement('div');e.id='nsProductionAdminGuard';e.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#071108;color:#f7f3e8;font:600 13px/1.6 Jost,Arial,sans-serif;letter-spacing:.08em;text-align:center;padding:24px';e.innerHTML='<div><div style="font:400 34px/1.1 Georgia,serif;margin-bottom:12px">Nariyal Sutra</div><div id="nsProductionAdminGuardText"></div></div>';document.documentElement.appendChild(e);}const t=e.querySelector('#nsProductionAdminGuardText');if(t)t.textContent=msg||'Connecting secure Business Command Center…';
}
function clearOverlay(){document.getElementById('nsProductionAdminGuard')?.remove();}
function showError(msg){overlay('Admin connection blocked: '+msg);}
function setEnvironmentLabel(){const e=document.querySelector('.ap-env');if(e)e.innerHTML='LIVE SECURE ADMIN<br>Firebase-backed content, media and workflow configuration.';document.documentElement.dataset.nsAdminMode='production';}
function lockRole(){
 const select=document.getElementById('apRole');if(select){if([...select.options].some(o=>o.value===role))select.value=role;select.disabled=true;select.title='Production role comes from Firebase Admin role mapping';select.dispatchEvent(new Event('change',{bubbles:true}));}
 try{Store.setSession({id:user?.uid||'',role,name:user?.email||role});}catch(e){}
 const pill=document.getElementById('apSessionPill');if(pill)pill.hidden=false;
 const n=document.getElementById('apSessionName');if(n)n.textContent=user?.email||'Signed-in staff';
 const r=document.getElementById('apSessionRole');if(r)r.textContent=role;
}
async function ensureFirebase(){
 if(!window.NS_FIREBASE_CONFIG)await loadScript('/firebase-config.js');
 const cfg=window.NS_FIREBASE_CONFIG||{};if(!cfg.apiKey||!cfg.projectId||!cfg.appId)throw new Error('Firebase configuration is missing.');
 [appMod,authMod,fsMod]=await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`),
  import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`)
 ]);
 try{app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(cfg);}catch(e){app=appMod.initializeApp(cfg);}
 auth=authMod.getAuth(app);db=fsMod.getFirestore(app);return cfg;
}
async function adminRole(u){
 const owner=window.NS_ADMIN_CONFIG?.ownerUid||'';if(u.uid===owner)return 'Owner';
 const snap=await fsMod.getDoc(fsMod.doc(db,'adminRoles',u.uid));return snap.exists()?String(snap.data()?.role||''):'';
}
async function waitAuth(){return new Promise(resolve=>{const off=authMod.onAuthStateChanged(auth,u=>{off();resolve(u);});});}
async function readPublicOnce(){const snap=await fsMod.getDoc(fsMod.doc(db,'publicStories','site-config'));return snap.exists()?snap.data():null;}
async function readPrivateOnce(){const snap=await fsMod.getDoc(fsMod.doc(db,'contentStories','admin-state'));return snap.exists()?snap.data():null;}
function publicPayload(s){return {...configSlice(s,PUBLIC_KEYS),status:'live',type:'site-config'};}
function privatePayload(s){return {...configSlice(s,PRIVATE_KEYS),status:'draft',type:'admin-state'};}
async function persistRemote(s){
 if(!isAdmin||!remoteReady||!user||!['Owner','Admin','Manager','Content'].includes(role))return;
 const pub=publicPayload(s),priv=privatePayload(s),ph=safeHash(pub),qh=safeHash(priv);
 const batch=fsMod.writeBatch(db);let writes=0;
 if(ph!==lastPublicHash){
  batch.set(fsMod.doc(db,'contentStories','site-config'),pub,{merge:true});
  batch.set(fsMod.doc(db,'publicStories','site-config'),pub,{merge:true});
  lastPublicHash=ph;writes+=2;
 }
 if(qh!==lastPrivateHash){batch.set(fsMod.doc(db,'contentStories','admin-state'),priv,{merge:true});lastPrivateHash=qh;writes++;}
 if(writes)await batch.commit();
}
async function persistCatalog(s){
 if(!isAdmin||!remoteReady||!user||!['Owner','Admin','Manager','Operations'].includes(role))return;
 const products=Array.isArray(s.products)?s.products:[],inventory=Array.isArray(s.inventory)?s.inventory:[];
 const rows=products.map(p=>{const sku=String(p.sku||'').toUpperCase(),key=sku==='TENDER'?'tender':sku==='GREEN'?'green':sku==='BULK'?'bulk':'';if(!key)return null;const inv=inventory.find(x=>String(x.sku||'').toUpperCase()===sku)||{};return {key,name:p.name||key,price:Math.max(0,Math.round(Number(key==='bulk'?(p.bulk||p.retail):(p.retail||p.bulk))||0)),minQty:Math.max(1,Math.round(Number(p.moq)||1)),stock:Math.max(0,Math.round(Number(inv.onHand)||0)),active:String(p.state||'Active').toLowerCase()!=='inactive'};}).filter(Boolean);
 const h=safeHash(rows);if(h===lastCatalogHash)return;const batch=fsMod.writeBatch(db);for(const r of rows)batch.set(fsMod.doc(db,'products',r.key),{name:r.name,price:r.price,minQty:r.minQty,stock:r.stock,active:r.active,updatedAt:fsMod.serverTimestamp()},{merge:true});await batch.commit();lastCatalogHash=h;
}
function queuePersist(s){pendingState=clone(s);clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{const x=pendingState;pendingState=null;try{await Promise.all([persistRemote(x),persistCatalog(x)]);window.dispatchEvent(new CustomEvent('nsv421:remote-saved'));}catch(e){console.error('[Nariyal Sutra remote save]',e);window.dispatchEvent(new CustomEvent('nsv421:remote-error',{detail:String(e?.message||e)}));}},350);} 
Store.save=function(s){const out=originalSave(s);if(isAdmin)queuePersist(out);return out;};
async function syncOperationalData(){
 if(!isAdmin||!user)return;
 const s=originalLoad();let changed=false;
 if(['Owner','Admin','Manager','Operations','Support','Sales'].includes(role)){
  try{const q=fsMod.query(fsMod.collection(db,'orders'),fsMod.orderBy('createdAt','desc'),fsMod.limit(150));const snap=await fsMod.getDocs(q);s.orders=snap.docs.map(d=>{const x=d.data();return {id:x.orderId||d.id,customer:x.customerName||'Customer',product:x.productName||x.productKey||'Order',qty:Number(x.quantity||0),payment:x.paymentLabel||x.paymentType||'Awaiting',delivery:String(x.status||'pending').replaceAll('_',' '),total:Number(x.total||0),createdAt:x.createdAt?.toDate?x.createdAt.toDate().toISOString():x.createdAt||''};});changed=true;}catch(e){console.warn('[BCC] Orders sync unavailable',e);}
 }
 if(['Owner','Admin','Manager','Operations'].includes(role)){
  try{const snap=await fsMod.getDocs(fsMod.collection(db,'products'));const by={};snap.forEach(d=>by[d.id]=d.data());const defs=[['TENDER','tender','Fresh Tender Coconut'],['GREEN','green','Green Round Coconut'],['BULK','bulk','Bulk Tender Coconut']];s.products=defs.map(([sku,key,name])=>{const p=by[key]||{};return {sku,name:p.name||name,retail:key==='bulk'?0:Number(p.price||0),bulk:Number(p.price||0),moq:Number(p.minQty||1),priceVisible:true,state:p.active===false?'Inactive':'Active'};});s.inventory=defs.map(([sku,key,name])=>{const p=by[key]||{};return {sku,name:p.name||name,node:'Live catalog',onHand:Number(p.stock||0),reserved:0,incoming:0,low:0,freshness:'Live Firestore stock',supplier:'Configured supply'};});changed=true;}catch(e){console.warn('[BCC] Catalog sync unavailable',e);}
 }
 if(changed){originalSave(s);lastCatalogHash=safeHash((s.products||[]).map(p=>{const sku=String(p.sku||'').toUpperCase(),key=sku==='TENDER'?'tender':sku==='GREEN'?'green':sku==='BULK'?'bulk':'';const inv=(s.inventory||[]).find(x=>String(x.sku||'').toUpperCase()===sku)||{};return key?{key,name:p.name||key,price:Math.max(0,Math.round(Number(key==='bulk'?(p.bulk||p.retail):(p.retail||p.bulk))||0)),minQty:Math.max(1,Math.round(Number(p.moq)||1)),stock:Math.max(0,Math.round(Number(inv.onHand)||0)),active:String(p.state||'Active').toLowerCase()!=='inactive'}:null}).filter(Boolean));}
}
function watchPublic(){
 const ref=fsMod.doc(db,'publicStories','site-config');const unsub=fsMod.onSnapshot(ref,snap=>{if(!snap.exists())return;const data=snap.data();lastPublicHash=safeHash(data);mergeIntoLocal([data]);},e=>console.warn('[Nariyal Sutra public config watch]',e));unsubs.push(unsub);
}
async function initAdmin(){
 overlay('Authenticating secure Business Command Center…');
 user=await waitAuth();
 if(!user){const next=encodeURIComponent('admin-preview.html'+location.search+location.hash);location.replace('/admin-bcc-login.html?next='+next);return;}
 role=await adminRole(user);
 const allowed=['Owner','Admin','Manager','Operations','Content','Support','Sales'];
 if(!allowed.includes(role)){await authMod.signOut(auth).catch(()=>{});location.replace('/admin-bcc-login.html?error=not-authorized');return;}
 overlay('Loading live Admin configuration…');
 let pub=null,priv=null;
 try{[pub,priv]=await Promise.all([readPublicOnce(),['Owner','Admin','Manager','Content'].includes(role)?readPrivateOnce():Promise.resolve(null)]);}catch(e){console.warn('[BCC] Remote config initial read failed',e);}
 if(pub||priv)mergeIntoLocal([pub,priv]);
 await syncOperationalData();
 setEnvironmentLabel();lockRole();remoteReady=true;watchPublic();
 const current=originalLoad();lastPublicHash=safeHash(publicPayload(current));lastPrivateHash=safeHash(privatePayload(current));
 clearOverlay();resolveReady({mode:'admin',role,user});window.dispatchEvent(new CustomEvent('nsv421:production-ready',{detail:{role}}));
}
async function initPublic(){
 try{const data=await readPublicOnce();if(data)mergeIntoLocal([data]);watchPublic();remoteReady=true;resolveReady({mode:'public'});window.dispatchEvent(new CustomEvent('nsv421:production-ready',{detail:{mode:'public'}}));}catch(e){console.warn('[Nariyal Sutra public config]',e);remoteReady=true;resolveReady({mode:'public',degraded:true});}
}
async function uploadMedia(file,meta={}){
 if(!isAdmin||!user)throw new Error('Admin authentication is required for media upload.');
 const token=await user.getIdToken();
 const sign=await fetch('/.netlify/functions/media-sign-upload',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({folder:meta.folder||'nariyal-sutra/media',public_id:meta.publicId||'',tags:meta.tags||'admin-upload',context:meta.context||''})});
 const signed=await sign.json().catch(()=>({}));if(!sign.ok)throw new Error(signed.error||'Could not authorize media upload.');
 const fd=new FormData();fd.append('file',file);fd.append('api_key',signed.apiKey);fd.append('timestamp',String(signed.timestamp));fd.append('signature',signed.signature);fd.append('folder',signed.folder);if(signed.public_id)fd.append('public_id',signed.public_id);if(signed.tags)fd.append('tags',signed.tags);if(signed.context)fd.append('context',signed.context);
 const up=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,{method:'POST',body:fd});const out=await up.json().catch(()=>({}));if(!up.ok||!out.secure_url)throw new Error(out.error?.message||'Cloudinary upload failed.');return out;
}
window.NSV421ProductionBridge={ready,isProduction:true,isAdmin,get role(){return role},get user(){return user},persist:()=>Promise.all([persistRemote(originalLoad()),persistCatalog(originalLoad())]),reload:async()=>mergeIntoLocal([await readPublicOnce(),isAdmin&&user?await readPrivateOnce():null]),uploadMedia};
(async()=>{try{if(isAdmin)overlay('Connecting secure Business Command Center…');await ensureFirebase();if(isAdmin)await initAdmin();else await initPublic();}catch(e){console.error('[Nariyal Sutra production bridge]',e);if(isAdmin)showError(String(e?.message||e));resolveReady({error:String(e?.message||e)});}})();
window.addEventListener('beforeunload',()=>unsubs.forEach(fn=>{try{fn();}catch(e){}}));
})();
