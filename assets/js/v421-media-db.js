(function(){
'use strict';
const DB='nariyalMediaV21',STORE='blobs';
function open(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function put(key,blob){const d=await open();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(blob,key);t.oncomplete=()=>res(key);t.onerror=()=>rej(t.error);});}
async function get(key){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(STORE).objectStore(STORE).get(key);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
async function del(key){const d=await open();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
async function hydrate(root){const imgs=[...(root||document).querySelectorAll('img[data-local-blob-key]')];for(const img of imgs){try{const b=await get(img.dataset.localBlobKey);if(b){const u=URL.createObjectURL(b);img.src=u;img.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(u),2000),{once:true});}}catch(e){}}}

const CAMPAIGN_IDS=['AMB101-P','AMB102-P','AMB201-P'];
const HOME_FEATURED=['AMB101-P','AMB201-P'];
const AMBASSADOR_ITEMS=[
 {id:'AMB101-P',name:'Brand ambassador · white shirt',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB101',src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB101-portrait.webp',version:5,versions:[{version:5,src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',at:'V42.1 approved reel'}]},
 {id:'AMB102-P',name:'Brand ambassador · beige vest',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB102',src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB102-portrait.webp',version:5,versions:[{version:5,src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',at:'V42.1 approved reel'}]},
 {id:'AMB201-P',name:'Product promoter · blue linen',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB201',src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',thumb:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',version:5,versions:[{version:5,src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',at:'V42.1 approved reel'}]}
];

function unique(ids){const seen=new Set();return (ids||[]).filter(id=>id&&!seen.has(id)&&(seen.add(id),true));}
function ensureApprovedAmbassadors(s){
 if(!s||typeof s!=='object')return s;
 const existing=Array.isArray(s.media)?s.media:[];
 const byId=new Map(existing.map(m=>[m.id,m]));
 const campaign=AMBASSADOR_ITEMS.map(m=>Object.assign({},byId.get(m.id)||{},m));
 const others=existing.filter(m=>m&&!CAMPAIGN_IDS.includes(m.id)&&!['AMB101-POST','AMB102-POST','AMB201-POST'].includes(m.id));
 /* Put approved campaign records first so Admin Media/Ambassadors never hides them behind legacy Gxxx entries. */
 s.media=[...campaign,...others];

 s.faceMarquee=s.faceMarquee||{};
 const current=Array.isArray(s.faceMarquee.selectedIds)?s.faceMarquee.selectedIds:[];
 s.faceMarquee.selectedIds=unique([...HOME_FEATURED,...current.filter(id=>!HOME_FEATURED.includes(id))]);
 s.faceMarquee.enabled=s.faceMarquee.enabled!==false;
 s.faceMarquee.homepage=s.faceMarquee.homepage!==false;

 s.peopleStreams=s.peopleStreams||{};
 s.peopleStreams.ambassadors=s.peopleStreams.ambassadors||{enabled:true,title:'Brand Ambassadors',subtitle:'Approved ambassador portraits.',speed:48,direction:'ltr',selectedIds:[],placement:'people-page'};
 const ambassadors=Array.isArray(s.peopleStreams.ambassadors.selectedIds)?s.peopleStreams.ambassadors.selectedIds:[];
 s.peopleStreams.ambassadors.selectedIds=unique([...CAMPAIGN_IDS,...ambassadors.filter(id=>!CAMPAIGN_IDS.includes(id))]);
 s.peopleStreams.ambassadors.enabled=s.peopleStreams.ambassadors.enabled!==false;
 return s;
}

function seedApprovedAmbassadors(){
 const Store=window.NSV421Store;if(!Store)return;
 const MIG='ns-v421-ambassador-reel-v5';
 const s=ensureApprovedAmbassadors(Store.load());
 if(localStorage.getItem(MIG)!=='1')Store.audit?.(s,'Approved ambassador media promoted to Admin and public reels','AMB101 / AMB102 / AMB201');
 Store.save(s);localStorage.setItem(MIG,'1');
}
function stabilizeAmbassadorLoads(){
 const Store=window.NSV421Store;if(!Store||Store.__ambassadorLoadStableV5)return;
 const originalLoad=Store.load.bind(Store);
 const originalPublicFaces=typeof Store.publicFaces==='function'?Store.publicFaces.bind(Store):null;
 Store.load=function(){return ensureApprovedAmbassadors(originalLoad());};
 if(originalPublicFaces)Store.publicFaces=function(s){return originalPublicFaces(ensureApprovedAmbassadors(s||Store.load()));};
 Store.__ambassadorLoadStableV5=true;
}

stabilizeAmbassadorLoads();
seedApprovedAmbassadors();
window.NSV421MediaDB={put,get,delete:del,hydrate,ensureApprovedAmbassadors,campaignIds:[...CAMPAIGN_IDS]};
function loadOnce(src,attr){if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'1');document.head.appendChild(s);}
const isAdmin=/admin-preview\.html$/i.test(location.pathname),local=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
if(isAdmin){
 if(!local&&!window.__NS_V421_PRODUCTION_BRIDGE__)loadOnce('/assets/js/v421-production-bridge.js','data-ns-production-bridge');
 loadOnce('/assets/js/admin-v38-production.js','data-ns-admin-v38');
}
})();