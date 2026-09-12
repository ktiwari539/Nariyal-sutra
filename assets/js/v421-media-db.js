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
const WEBSITE_MEDIA_IDS=Array.from({length:11},(_,i)=>'WS'+String(i+1).padStart(3,'0'));
const AMBASSADOR_ITEMS=[
 {id:'AMB101-P',name:'Brand ambassador · white shirt',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB101',src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB101-portrait.webp',version:7,versions:[{version:7,src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',at:'V42.1 approved reel'}]},
 {id:'AMB102-P',name:'Brand ambassador · beige vest',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB102',src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB102-portrait.webp',version:7,versions:[{version:7,src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',at:'V42.1 approved reel'}]},
 {id:'AMB201-P',name:'Product promoter · blue linen',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB201',src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',thumb:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',version:7,versions:[{version:7,src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',at:'V42.1 approved reel'}]}
];
const WEBSITE_MEDIA_ITEMS=[
 {id:'WS001',name:'Fresh cut · coastal serve',cat:'Hospitality',src:'assets/images/website-media/ws001-fresh-cut-ocean.webp',publicAllowed:true,homepageAllowed:true,placement:'Website library'},
 {id:'WS002',name:'Harvest grove · 94 coconuts cinematic',cat:'Cinematic',src:'assets/images/website-media/ws002-harvest-grove-94-cinematic.webp',publicAllowed:false,homepageAllowed:false,placement:'Reference only'},
 {id:'WS003',name:'Harvest hands · source handling',cat:'Sourcing',src:'assets/images/website-media/ws003-harvest-hands.webp',publicAllowed:true,homepageAllowed:true,placement:'Website library'},
 {id:'WS004',name:'Golden backwaters · 94 cinematic',cat:'Cinematic',src:'assets/images/website-media/ws004-golden-backwaters-94-cinematic.webp',publicAllowed:false,homepageAllowed:false,placement:'Reference only'},
 {id:'WS005',name:'Field harvest · source and dispatch',cat:'Sourcing',src:'assets/images/website-media/ws005-field-harvest-workers.webp',publicAllowed:true,homepageAllowed:true,placement:'Website library'},
 {id:'WS006',name:'Tender coconut basket',cat:'Product',src:'assets/images/website-media/ws006-tender-coconut-basket.webp',publicAllowed:true,homepageAllowed:true,placement:'Website library'},
 {id:'WS007',name:'Coast grove · 100 cinematic',cat:'Cinematic',src:'assets/images/website-media/ws007-coast-grove-100-cinematic.webp',publicAllowed:false,homepageAllowed:false,placement:'Reference only'},
 {id:'WS008',name:'Coast grove · 30 cinematic',cat:'Cinematic',src:'assets/images/website-media/ws008-coast-grove-30-cinematic.webp',publicAllowed:false,homepageAllowed:false,placement:'Reference only'},
 {id:'WS009',name:'Harvest falls · cinematic frame',cat:'Cinematic',src:'assets/images/website-media/ws009-harvest-falls-cinematic.webp',publicAllowed:false,homepageAllowed:false,placement:'Reference only'},
 {id:'WS010',name:'Coastal grove sunset',cat:'Sourcing',src:'assets/images/website-media/ws010-coast-sunset-grove.webp',publicAllowed:true,homepageAllowed:true,placement:'Website library'},
 {id:'WS011',name:'Grove to fresh serve · cinematic frame',cat:'Cinematic',src:'assets/images/website-media/ws011-grove-to-fresh-serve-cinematic.webp',publicAllowed:false,homepageAllowed:false,placement:'Reference only'}
].map((m,i)=>Object.assign({status:'Approved',visible:true,storyAllowed:true,brandFit:'Strong',faceGroup:null,thumb:m.src,version:1,versions:[{version:1,src:m.src,at:'V42.1 website media import'}],order:100+i},m));

function unique(ids){const seen=new Set();return (ids||[]).filter(id=>id&&!seen.has(id)&&(seen.add(id),true));}
function featuredFirst(current){
 const rest=unique((current||[]).filter(id=>!HOME_FEATURED.includes(id)));
 if(!rest.length)return [...HOME_FEATURED];
 return unique([HOME_FEATURED[0],rest[0],HOME_FEATURED[1],...rest.slice(1)]);
}
function ensureApprovedMedia(s){
 if(!s||typeof s!=='object')return s;
 const existing=Array.isArray(s.media)?s.media:[];
 const byId=new Map(existing.map(m=>[m.id,m]));
 const campaign=AMBASSADOR_ITEMS.map(m=>Object.assign({},byId.get(m.id)||{},m));
 const website=WEBSITE_MEDIA_ITEMS.map(m=>Object.assign({},byId.get(m.id)||{},m));
 const reserved=new Set([...CAMPAIGN_IDS,...WEBSITE_MEDIA_IDS,'AMB101-POST','AMB102-POST','AMB201-POST']);
 const others=existing.filter(m=>m&&!reserved.has(m.id));
 s.media=[...campaign,...website,...others];

 s.faceMarquee=s.faceMarquee||{};
 s.faceMarquee.selectedIds=featuredFirst(Array.isArray(s.faceMarquee.selectedIds)?s.faceMarquee.selectedIds:[]);
 s.faceMarquee.enabled=s.faceMarquee.enabled!==false;
 s.faceMarquee.homepage=s.faceMarquee.homepage!==false;

 s.peopleStreams=s.peopleStreams||{};
 s.peopleStreams.ambassadors=s.peopleStreams.ambassadors||{enabled:true,title:'Brand Ambassadors',subtitle:'Approved ambassador portraits.',speed:48,direction:'ltr',selectedIds:[],placement:'people-page'};
 const ambassadors=Array.isArray(s.peopleStreams.ambassadors.selectedIds)?s.peopleStreams.ambassadors.selectedIds:[];
 s.peopleStreams.ambassadors.selectedIds=unique([...CAMPAIGN_IDS,...ambassadors.filter(id=>!CAMPAIGN_IDS.includes(id))]);
 s.peopleStreams.ambassadors.enabled=s.peopleStreams.ambassadors.enabled!==false;
 return s;
}
function seedApprovedMedia(){
 const Store=window.NSV421Store;if(!Store)return;
 const MIG='ns-v421-authoritative-media-v7';
 const s=ensureApprovedMedia(Store.load());
 if(localStorage.getItem(MIG)!=='1')Store.audit?.(s,'Approved people + website media reconciled into Admin library','AMB101 / AMB102 / AMB201 / WS001–WS011');
 Store.save(s);localStorage.setItem(MIG,'1');
}
function stabilizeMediaLoads(){
 const Store=window.NSV421Store;if(!Store||Store.__authoritativeMediaLoadStableV7)return;
 const originalLoad=Store.load.bind(Store);
 const originalPublicFaces=typeof Store.publicFaces==='function'?Store.publicFaces.bind(Store):null;
 Store.load=function(){return ensureApprovedMedia(originalLoad());};
 if(originalPublicFaces)Store.publicFaces=function(s){return originalPublicFaces(ensureApprovedMedia(s||Store.load()));};
 Store.__authoritativeMediaLoadStableV7=true;
}

stabilizeMediaLoads();
seedApprovedMedia();
window.NSV421MediaDB={put,get,delete:del,hydrate,ensureApprovedAmbassadors:ensureApprovedMedia,ensureApprovedMedia,campaignIds:[...CAMPAIGN_IDS],websiteMediaIds:[...WEBSITE_MEDIA_IDS]};
function loadOnce(src,attr){if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'1');document.head.appendChild(s);}
const isAdmin=/admin-preview\.html$/i.test(location.pathname),local=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
if(isAdmin){
 if(!local&&!window.__NS_V421_PRODUCTION_BRIDGE__)loadOnce('/assets/js/v421-production-bridge.js','data-ns-production-bridge');
 loadOnce('/assets/js/admin-v38-production.js','data-ns-admin-v38');
}
})();