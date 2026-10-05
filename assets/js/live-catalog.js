/* The only customer price authority. Bundled fixtures and local Admin drafts are never prices. */
(function(){
'use strict';
if(window.NSLiveCatalog)return;
const LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname||'');
const LOCAL_QA_CATALOG={tender:{id:'tender',name:'Fresh Tender Coconut — Local QA',price:55,stock:150,active:true,minQty:1},green:{id:'green',name:'Green Round Coconut — Local QA',price:55,stock:100,active:true,minQty:1},bulk:{id:'bulk',name:'Bulk Pack 10+ pcs — Local QA',price:45,stock:300,active:true,minQty:10}};
let catalog=LOCAL?LOCAL_QA_CATALOG:{},status=LOCAL?'ready':'loading',source=LOCAL?'local-qa':'loading',revision=0,requestId=0,connection=null;
const keys=['tender','green','bulk'];
const valid=p=>p&&typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0;
const price=key=>status==='ready'&&valid(catalog[key])?catalog[key].price:null;
const timestamp=x=>x?.toMillis?x.toMillis():x?.seconds?x.seconds*1000:Date.parse(x||'')||0;
function emit(){window.NS_CATALOG=catalog;window.NS_CATALOG_LIVE=status==='ready';window.NS_CATALOG_SOURCE=source;render();window.dispatchEvent(new CustomEvent('ns:catalog',{detail:{catalog,live:status==='ready',status,source,revision}}));}
function accept(snap,{request,startedAt}={}){
 if(snap.metadata?.fromCache||snap.metadata?.hasPendingWrites)return false;
 if(request&&request!==requestId||startedAt!==undefined&&startedAt!==revision)return false;
 const next={};snap.forEach(d=>{const p=d.data();if(keys.includes(d.id)&&valid(p))next[d.id]={...p,id:d.id};});
 if(!Object.keys(next).length){unavailable();return false;}
 if(Object.keys(next).some(k=>timestamp(next[k].updatedAt)<timestamp(catalog[k]?.updatedAt)))return false;
 catalog=next;status='ready';source='firestore';revision++;emit();return true;
}
function unavailable(){if(LOCAL){catalog=LOCAL_QA_CATALOG;status='ready';source='local-qa';emit();return;}status='unavailable';source='unavailable';catalog={};emit();}
function render(){
 const ready=status==='ready',label=status==='loading'?'Loading current price…':'Current price unavailable — retry';
 document.documentElement.dataset.catalogStatus=status;document.documentElement.dataset.catalogSource=source;
 document.querySelectorAll('[data-price-value]').forEach(e=>{const p=price(e.dataset.priceValue);e.textContent=p===null?'—':p.toLocaleString('en-IN');e.setAttribute('aria-label',p===null?label:`₹${p}`);});
 document.querySelectorAll('[data-product-retail]').forEach(e=>{const k=/green-coconut/.test(location.pathname)?'green':'tender';e.textContent=price(k)??'—';});
 document.querySelectorAll('[data-product-bulk]').forEach(e=>e.textContent=price('bulk')??'—');
 for(const key of keys){const p=catalog[key],available=ready&&valid(p)&&p.active!==false&&Number(p.stock)>0;
 document.querySelectorAll(`[data-min-value="${key}"]`).forEach(e=>e.textContent=ready&&p?p.minQty||1:'—');
 document.querySelectorAll(`[data-stock-pill="${key}"]`).forEach(e=>e.textContent=!ready?'Checking availability…':available?'In stock':'Unavailable');
 const opt=document.querySelector(`#oPr option[value="${key}"]`);if(opt){opt.dataset.price=price(key)??'';opt.dataset.stock=p?.stock??0;opt.dataset.min=p?.minQty??1;opt.dataset.active=String(available);opt.disabled=!available;opt.textContent=(p?.name||opt.dataset.name||key)+(price(key)===null?' — price pending':` (₹${price(key)}/pc)`);}
 document.querySelectorAll(`[data-product-card="${key}"] .pc-btn,[data-product-card="${key}"] .po-btn`).forEach(e=>e.disabled=!available);
 }
 const toggle=(sel,text)=>{document.querySelectorAll(sel).forEach(e=>e.textContent=text);};
 const retail=[price('tender'),price('green')].filter(x=>x!==null);
 toggle('[data-retail-toggle]',retail.length?`🥥 Retail from ₹${Math.min(...retail)}/pc`:'🥥 Retail · price pending');
 toggle('[data-bulk-toggle]',price('bulk')!==null?`📦 Bulk ${catalog.bulk.minQty||1}+ — ₹${price('bulk')}/pc`:'📦 Bulk · price pending');
 const live=document.getElementById('catalogLive');if(live){live.textContent=ready?(source==='local-qa'?'Local QA availability':'Current availability'):label;if(!ready&&status!=='loading'){const b=document.createElement('button');b.type='button';b.textContent='Retry';b.onclick=refresh;live.append(' ',b);}}
 document.querySelectorAll('.live-price-kicker').forEach(e=>e.textContent=ready?(source==='local-qa'?'Local QA pricing':'Current pricing'):label);
 if(typeof window.calc==='function')window.calc();
}
async function refresh(){if(LOCAL){emit();return true;}if(!connection)return false;const request=++requestId,startedAt=revision;try{const snap=await connection.fs.getDocsFromServer(connection.ref);return accept(snap,{request,startedAt});}catch(e){if(request===requestId&&startedAt===revision)unavailable();return false;}}
function connect(fs,db){if(LOCAL){emit();return;}if(connection)return;const ref=fs.collection(db,'products');connection={fs,ref};fs.onSnapshot(ref,{includeMetadataChanges:true},s=>accept(s),()=>unavailable());refresh();
 try{const bc=new BroadcastChannel('ns-catalog');bc.onmessage=e=>{if(e.data?.type==='refresh')refresh();};}catch(_){}
 addEventListener('storage',e=>{if(e.key==='ns_catalog_version')refresh();});addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
}
window.NSLiveCatalog={get catalog(){return catalog},get status(){return status},get source(){return source},price,accept,unavailable,connect,refresh,render};window.NS_REFRESH_CATALOG=refresh;window.NS_CATALOG={};window.NS_CATALOG_LIVE=false;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{render();if(LOCAL)emit();});else{render();if(LOCAL)emit();}
if(!LOCAL)setTimeout(()=>{if(status==='loading')unavailable();},12000);
})();
