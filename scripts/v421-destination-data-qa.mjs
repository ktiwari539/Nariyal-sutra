// Offline, zero-network checkout-destination regression.
// Run: node scripts/v421-destination-data-qa.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const delivery=fs.readFileSync(new URL('../ns-delivery.js',import.meta.url),'utf8');
const order=fs.readFileSync(new URL('../ns-order-patch.js',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../assets/js/v421-production-bridge.js',import.meta.url),'utf8');
const pos=html.indexOf('var orderRecord={');
const end=html.indexOf('var saveStatusEl=',pos);
assert.ok(pos>0&&end>pos,'Checkout notification payload found');
const payload=html.slice(pos,end);
assert.ok(payload.includes("country:String(deliveryExtra.country||'India')"));
assert.ok(payload.includes("state:String(deliveryExtra.state||'')"));
assert.ok(payload.includes("pin:String(deliveryExtra.pin||'')"));
assert.ok(html.includes('window.NS_SAVE_ORDER(orderRecord)'));
assert.ok(html.includes('window.NS_SEND_ORDER_EMAILS(orderRecord)'));
assert.ok(html.includes("'\\nDestination country: '+String(deliveryExtra.country||'India')"));
assert.ok(html.includes("deliveryExtra.state?'\\nState / province: "));
assert.ok(html.includes("deliveryExtra.pin?'\\nPostal code: "));
assert.ok(html.includes("deliveryExtra.isInternational?'\\nInternational quote requested"));
assert.ok(order.includes('var merged=Object.assign({},order,extra)'));
assert.ok(order.includes('var privateDoc=Object.assign({},merged'));
assert.ok(order.includes("batch.set(fsMod.doc(db,'orders',String(merged.orderId)),privateDoc)"));
assert.ok(order.includes('var dest=[merged.city,merged.state,merged.country]'));
assert.ok(bridge.includes("location.hostname!=='nariyal-sutra.netlify.app'"));

const start=delivery.indexOf('function patchPlaceOrder(){');
const stop=delivery.indexOf('/* ─── Order Hub',start);
assert.ok(start>0&&stop>start,'Delivery wrapper found');
const wrapper=delivery.slice(start,stop);
const factory=new Function('window','el','nsDelivery','deliveryEstimates','genToken','genOTP','qtyBand','setTimeout','nsShowOrderHub','getComputedStyle',
  wrapper+String.fromCharCode(10)+'return patchPlaceOrder;');
function scenario(country,manualCountry){
  let calls=0,focused=false;
  const status={textContent:''};
  const input={value:manualCountry,focus(){focused=true;}};
  const elements={oQ:{value:'10'},'ns-country-other':input,'ns-del-choice-status':status};
  const el=id=>elements[id]||null;
  const window={placeOrder(){calls++;},addEventListener(){}};
  const nsDelivery={
    country,state:'São Paulo',pin:'01000-000',landmark:'',
    lat:null,lng:null,accuracy:null,selectedDelivery:'door',
    handoverPointType:'door',handoverPointName:'',handoverPointAddress:'',
    handoverPointLat:null,handoverPointLng:null,handoverSearchSource:'',handoverNote:'',
    recurring:'onetime',isInternational:country!=='India'
  };
  const patch=factory(window,el,nsDelivery,
    ()=>[{id:'door',label:'Home delivery',rangeMin:null,rangeMax:null,eta:'Quote pending'}],
    ()=>'a'.repeat(48),()=>123456,()=> 'bulk',()=>{},()=>{},()=>({display:'none'}));
  patch();
  window.placeOrder();
  return {calls,focused,status:status.textContent,extra:window.NS_DELIVERY_EXTRA};
}
const missing=scenario('Other',' ');
assert.equal(missing.calls,0);
assert.equal(missing.focused,true);
assert.equal(missing.extra,undefined);
const global=scenario('Other','Brazil');
assert.equal(global.calls,1);
assert.equal(global.extra.country,'Brazil');
assert.equal(global.extra.state,'São Paulo');
assert.equal(global.extra.pin,'01000-000');
assert.equal(global.extra.isInternational,true);
const india=scenario('India','');
assert.equal(india.calls,1);
assert.equal(india.extra.country,'India');
assert.equal(india.extra.isInternational,false);
console.log('PASS: 14 destination source contracts and 3 delivery wrapper scenarios (mocked, no network)');
