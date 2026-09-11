(function(){
'use strict';
if(window.__NS_SMART_LOCATION__) return;
window.__NS_SMART_LOCATION__=true;

function state(){return window.NSDeliveryState||{};}
function emit(){window.dispatchEvent(new CustomEvent('ns:location-updated',{detail:{...state()}}));}

function current(){
  if(typeof window.nsDelGPS==='function') return window.nsDelGPS();
  if(!navigator.geolocation) return Promise.reject(new Error('Geolocation is not available'));
  return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(pos=>{
    const s=state(); s.lat=pos.coords.latitude; s.lng=pos.coords.longitude; s.accuracy=pos.coords.accuracy; emit(); resolve({...s});
  },reject,{enableHighAccuracy:true,timeout:10000,maximumAge:60000}));
}

function sync(lat,lng,label){
  const s=state();
  if(Number.isFinite(Number(lat))) s.lat=Number(lat);
  if(Number.isFinite(Number(lng))) s.lng=Number(lng);
  if(label){s.address2=String(label); const city=document.getElementById('oCity'); if(city&&!city.value) city.value=String(label);}
  const display=document.getElementById('ns-coords-display');
  if(display&&s.lat!=null&&s.lng!=null) display.textContent=`${Number(s.lat).toFixed(5)}, ${Number(s.lng).toFixed(5)}`;
  emit(); return {...s};
}

window.NSSmartLocation={current,sync,getState:()=>({...state()})};
window.addEventListener('ns:map-pin-change',e=>{const d=e.detail||{};sync(d.lat,d.lng,d.label||d.address);});
})();
