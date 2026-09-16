(function(){
'use strict';
if(window.__NS_V421_DELIVERY_CONTRACT__)return;
window.__NS_V421_DELIVERY_CONTRACT__=true;
const Store=window.NSV421Store;
if(!Store)return;
const SDK='12.18.0';
const STATUSES=['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered'];
const LABELS={pending:'Pending',confirmed:'Confirmed',preparing:'Preparing',ready_for_dispatch:'Ready for dispatch',out_for_delivery:'Out for delivery',delivered:'Delivered'};
const $=(s,r=document)=>r.querySelector(s);
function production(){return !!window.NSV421ProductionBridge?.isProduction;}
function clean(v,max){return String(v==null?'':v).trim().slice(0,max||500);}
function finite(v){return v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v));}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),4200);}
async function firebase(){
 const [appMod,fsMod]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`)]);
 const app=appMod.getApps()[0];if(!app)throw new Error('Production Firebase app is not ready.');
 if(typeof window.NS_INIT_APP_CHECK==='function')await window.NS_INIT_APP_CHECK(app);
 const db=fsMod.getFirestore(app),user=window.NSV421ProductionBridge?.user;if(!user)throw new Error('Admin authentication is required.');
 return {fsMod,db,user};
}
function normalizeStatusSelect(){
 if(!production())return;
 const sel=$('#apDeliveryForm select[name="status"]');if(!sel)return;
 const current=STATUSES.includes(sel.value)?sel.value:'pending';
 sel.innerHTML=STATUSES.map(s=>`<option value="${s}">${LABELS[s]}</option>`).join('');sel.value=current;
}
async function sendStatusEmail(order,status,note){
 if(!order?.email||String(order.email).indexOf('@')<1)return {skipped:true};
 try{
   const r=await fetch('/.netlify/functions/send-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:'customer_status',data:{...order,status,statusNote:clean(note,500)}})});
   const out=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(out.error||'Status email provider rejected request.');
   return {ok:true};
 }catch(e){console.warn('[Delivery status email]',e);return {ok:false,error:String(e?.message||e)};}
}
async function saveDelivery(){
 if(!production())return {skipped:true};
 const role=window.NSV421ProductionBridge?.role;if(!['Owner','Admin','Manager','Operations'].includes(role))throw new Error('Your role cannot update delivery.');
 const s=Store.load(),live=s.deliveryLive||{},orderId=clean(live.orderId,40);if(!orderId)throw new Error('Select an order before saving delivery.');
 const form=$('#apDeliveryForm');if(!form)throw new Error('Delivery form is unavailable.');
 const status=clean(form.elements.status?.value,40);if(!STATUSES.includes(status))throw new Error('Choose a valid delivery status.');
 const eta=clean(form.elements.eta?.value,160),partnerName=clean(form.elements.partner?.value,100),vehicle=clean(form.elements.vehicle?.value,80),locationLabel=clean(form.elements.location?.value,160),customerUpdate=clean(form.elements.update?.value,500),internalNote=clean(form.elements.internal?.value,1000);
 const lat=finite(form.elements.lat?.value)?Number(form.elements.lat.value):null,lng=finite(form.elements.lng?.value)?Number(form.elements.lng.value):null;
 const {fsMod,db,user}=await firebase(),orderRef=fsMod.doc(db,'orders',orderId),orderSnap=await fsMod.getDoc(orderRef);if(!orderSnap.exists())throw new Error(`Order ${orderId} no longer exists.`);
 const order=orderSnap.data()||{},previous=String(order.status||'pending');
 const batch=fsMod.writeBatch(db),now=fsMod.serverTimestamp();
 batch.update(orderRef,{status,deliveryEta:eta,deliveryLat:lat,deliveryLng:lng,deliveryAccuracy:null,deliveryLocationSource:'pin',deliveryCoordinatesConfirmed:lat!==null&&lng!==null,updatedAt:now});
 batch.set(fsMod.doc(db,'deliveryAdmin',orderId),{orderId,status,eta,partnerName,vehicle,locationLabel,lat,lng,customerUpdate,internalNote,updatedAt:now,updatedBy:user.uid},{merge:true});
 if(order.trackingToken){
   const tr=fsMod.doc(db,'publicTracking',String(order.trackingToken)),trSnap=await fsMod.getDoc(tr);
   if(trSnap.exists())batch.update(tr,{status,eta,deliveryEstimate:eta||'Confirmed on WhatsApp',deliveryPartnerName:partnerName,vehicle,locationLabel,lat,lng,customerUpdate,updatedAt:now});
 }
 if(order.customerUid){
   const cr=fsMod.doc(db,'customerOrders',String(order.customerUid),'orders',orderId),crSnap=await fsMod.getDoc(cr);
   if(crSnap.exists())batch.update(cr,{status,deliveryEstimate:eta||'Confirmed on WhatsApp',destinationDisplay:locationLabel||[order.city,order.state,order.country].filter(Boolean).join(', '),updatedAt:now});
 }
 await batch.commit();
 Object.assign(live,{status,eta,partnerName,vehicle,locationLabel,lat,lng,customerUpdate,internalNote,locationSource:'saved delivery pin'});s.deliveryLive=live;
 const localOrder=(s.orders||[]).find(o=>String(o.id||o.orderId)===orderId);if(localOrder){localOrder.status=status;localOrder.delivery=status.replaceAll('_',' ');localOrder.deliveryEta=eta;localOrder.deliveryLat=lat;localOrder.deliveryLng=lng;}
 Store.save(s);
 let email={skipped:true};if(status!==previous)email=await sendStatusEmail({...order,orderId,trackingToken:order.trackingToken||'',deliveryEta:eta},status,customerUpdate);
 window.dispatchEvent(new CustomEvent('nsv421:delivery-committed',{detail:{orderId,status,previous,email}}));
 return {orderId,status,previous,email};
}
function intercept(e){
 const b=e.target.closest?.('#apSaveDelivery');if(!b||!production())return;
 e.preventDefault();e.stopImmediatePropagation();toast('Saving delivery and customer projections…');
 saveDelivery().then(r=>{toast(`${r.orderId} saved to order, tracking and customer projections.${r.email?.ok?' Status email sent.':r.email?.error?' Email warning: '+r.email.error:''}`);}).catch(err=>{console.error('[Delivery contract]',err);toast('Delivery save failed: '+String(err?.message||err));});
}
function init(){document.addEventListener('click',intercept,true);window.addEventListener('nsv421:production-ready',()=>setTimeout(normalizeStatusSelect,0));document.addEventListener('click',e=>{if(e.target.closest?.('#apNav button[data-view="delivery"]'))setTimeout(normalizeStatusSelect,0);});if(production())setTimeout(normalizeStatusSelect,120);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
window.NSV421DeliveryContract={ready:true,save:saveDelivery,statuses:STATUSES.slice()};
})();
