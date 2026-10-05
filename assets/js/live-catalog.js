/* One customer price authority per environment: Local Admin state on localhost, Firestore in production. */
(function(){
'use strict';
if(window.NSLiveCatalog)return;
const LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname||'');
const CORE=['tender','green','bulk'];
const META={
 tender:{id:'tender',name:'Fresh Tender Coconut',stock:0,active:true,minQty:1},
 green:{id:'green',name:'Green Round Coconut',stock:0,active:true,minQty:1},
 bulk:{id:'bulk',name:'Bulk Pack (10+ pcs)',stock:0,active:true,minQty:10}
};
let catalog={},status='loading',source=LOCAL?'local-admin':'loading',revision=0,requestId=0,connection=null;
const valid=p=>p&&typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0;
const price=key=>status==='ready'&&valid(catalog[key])&&catalog[key].priceVisible!==false?catalog[key].price:null;
const timestamp=x=>x?.toMillis?x.toMillis():x?.seconds?x.seconds*1000:Date.parse(x||'')||0;
function localCatalog(){
 const Store=window.NSV421Store;if(!Store?.load)return {};
 const s=Store.load(),inventory=Array.isArray(s.inventory)?s.inventory:[],next={};
 for(const [sku,key,meta] of [['TENDER','tender',META.tender],['GREEN','green',META.green],['BULK','bulk',META.bulk]]){
  const p=(s.products||[]).find(x=>String(x.sku||'').toUpperCase()===sku),inv=inventory.find(x=>String(x.sku||'').toUpperCase()===sku);
  const amount=Number(Store.productPrice?Store.productPrice(p):p?.price),stock=Number(inv?.onHand);
  next[key]={id:key,name:p?.name||meta.name,price:Number.isFinite(amount)&&amount>0?amount:0,priceVisible:p?.priceVisible!==false,stock:Number.isFinite(stock)?Math.max(0,stock):meta.stock,active:!!p&&String(p?.state||'Active').toLowerCase()!=='inactive',minQty:Math.max(1,Math.round(Number(p?.moq)||meta.minQty))};
 }
 return next;
}
function syncLocal(){if(!LOCAL)return false;catalog=localCatalog();status='ready';source='local-admin';revision++;emit();return true;}
function emit(){window.NS_CATALOG=catalog;window.NS_CATALOG_LIVE=status==='ready';window.NS_CATALOG_SOURCE=source;render();window.dispatchEvent(new CustomEvent('ns:catalog',{detail:{catalog,live:status==='ready',status,source,revision}}));}
function accept(snap,{request,startedAt}={}){
 if(snap.metadata?.fromCache||snap.metadata?.hasPendingWrites)return false;
 if(request&&request!==requestId||startedAt!==undefined&&startedAt!==revision)return false;
 const next={};snap.forEach(d=>{const p=d.data();if(CORE.includes(d.id)&&valid(p))next[d.id]={...p,id:d.id};});
 if(!Object.keys(next).length){unavailable();return false;}
 if(Object.keys(next).some(k=>timestamp(next[k].updatedAt)<timestamp(catalog[k]?.updatedAt)))return false;
 catalog=next;status='ready';source='firestore';revision++;emit();return true;
}
function unavailable(){if(LOCAL){syncLocal();return;}status='unavailable';source='unavailable';catalog={};emit();}
function render(){
 const ready=status==='ready',label=status==='loading'?'Loading current price…':'Current price unavailable — retry';
 document.documentElement.dataset.catalogStatus=status;document.documentElement.dataset.catalogSource=source;
 document.querySelectorAll('[data-price-value]').forEach(e=>{const p=price(e.dataset.priceValue);e.textContent=p===null?'—':p.toLocaleString('en-IN');e.setAttribute('aria-label',p===null?label:`₹${p}`);});
 for(const key of CORE){const p=catalog[key],available=ready&&valid(p)&&p.active!==false&&p.priceVisible!==false&&Number(p.stock)>0;
 document.querySelectorAll(`[data-min-value="${key}"]`).forEach(e=>e.textContent=ready&&p?p.minQty||1:'—');
 document.querySelectorAll(`[data-stock-pill="${key}"]`).forEach(e=>e.textContent=!ready?'Checking availability…':available?'In stock':'Unavailable');
 const opt=document.querySelector(`#oPr option[value="${key}"]`);if(opt){opt.dataset.price=price(key)??'';opt.dataset.stock=p?.stock??0;opt.dataset.min=p?.minQty??1;opt.dataset.active=String(available);opt.disabled=!available;opt.textContent=(p?.name||opt.dataset.name||key)+(price(key)===null?' — price pending':` (₹${price(key)}/pc)`);}
 document.querySelectorAll(`[data-product-card="${key}"] .pc-btn,[data-product-card="${key}"] .po-btn`).forEach(e=>e.disabled=!available);
 }
 const toggle=(sel,text)=>document.querySelectorAll(sel).forEach(e=>e.textContent=text);
 const retail=[price('tender'),price('green')].filter(x=>x!==null);
 toggle('[data-retail-toggle]',retail.length?`🥥 Retail from ₹${Math.min(...retail)}/pc`:'🥥 Retail · price pending');
 toggle('[data-bulk-toggle]',price('bulk')!==null?`📦 Bulk ${catalog.bulk.minQty||1}+ — ₹${price('bulk')}/pc`:'📦 Bulk · price pending');
 const live=document.getElementById('catalogLive');if(live){live.textContent=ready?(source==='local-admin'?'Local Admin catalogue':'Current availability'):label;if(!ready&&status!=='loading'){const b=document.createElement('button');b.type='button';b.textContent='Retry';b.onclick=refresh;live.append(' ',b);}}
 document.querySelectorAll('.live-price-kicker').forEach(e=>e.textContent=ready?(source==='local-admin'?'Local Admin pricing':'Current pricing'):label);
 if(typeof window.calc==='function')window.calc();
}
async function refresh(){if(LOCAL)return syncLocal();if(!connection)return false;const request=++requestId,startedAt=revision;try{const snap=await connection.fs.getDocsFromServer(connection.ref);return accept(snap,{request,startedAt});}catch(e){if(request===requestId&&startedAt===revision)unavailable();return false;}}
function connect(fs,db){if(LOCAL){syncLocal();return;}if(connection)return;const ref=fs.collection(db,'products');connection={fs,ref};fs.onSnapshot(ref,{includeMetadataChanges:true},s=>accept(s),()=>unavailable());refresh();
 try{const bc=new BroadcastChannel('ns-catalog');bc.onmessage=e=>{if(e.data?.type==='refresh')refresh();};}catch(_e){}
 addEventListener('storage',e=>{if(e.key==='ns_catalog_version')refresh();});addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
}
if(LOCAL){window.addEventListener('nsv421:change',syncLocal);window.addEventListener('storage',e=>{const key=window.NSV421Store?.KEY;if(!key||e.key===key)syncLocal();});}
window.NSLiveCatalog={get catalog(){return catalog},get status(){return status},get source(){return source},price,accept,unavailable,connect,refresh,render};window.NS_REFRESH_CATALOG=refresh;window.NS_CATALOG={};window.NS_CATALOG_LIVE=false;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>LOCAL?syncLocal():render());else LOCAL?syncLocal():render();
if(!LOCAL)setTimeout(()=>{if(status==='loading')unavailable();},12000);
})();
