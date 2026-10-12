// Exercise the shipped calculator and delivery recap against live inventory changes.
// Synthetic records only; no Firebase, browser credentials or order submission.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),delivery=read('ns-delivery.js');
const calculator=html.slice(html.indexOf('function getCurrentPrice(){'),html.indexOf('function pick(name,'));
const recap=delivery.slice(delivery.indexOf('function nsDelUpdateSummary(){'),delivery.indexOf('/* ─── Patch placeOrder'));
const option={value:'tender',disabled:false,dataset:{name:'Tender',min:'5',stock:'100',active:'true'}};
const nodes={oQ:{value:'5',dispatchEvent(){}},pAmt:{textContent:''},pNote:{textContent:''},orderSelectionSummary:{textContent:''},'ns-del-summary':{style:{},textContent:'',innerHTML:''}};
let selected=option,price=77;
const order=new Function('document','window','currentProduct','productMin','productStock','Event',calculator+';return {calc,getCurrentPrice,getCurrentTotal};')(
  {getElementById:id=>nodes[id]}, {NSLiveCatalog:{status:'ready',price:()=>price}},()=>selected,
  opt=>Number(opt.dataset.min),opt=>Number(opt.dataset.stock),class{constructor(type){this.type=type;}}
);
const updateRecap=new Function('el','getCurrentPrice','getCurrentTotal','deliveryEstimates','nsDelivery','esc','nsDistanceText',recap+';return nsDelUpdateSummary;')(
  id=>nodes[id],order.getCurrentPrice,order.getCurrentTotal,()=>[],{recurring:'onetime'},String,()=>''
);
const checks=[];
function valid(label,qty,total){
  nodes.oQ.value=String(qty);order.calc();updateRecap();
  assert.equal(order.getCurrentTotal(),total,label+' canonical total');
  assert.equal(nodes.pAmt.textContent,'₹'+total.toLocaleString('en-IN'),label+' calculator');
  assert.match(nodes['ns-del-summary'].innerHTML,new RegExp('₹'+total.toLocaleString('en-IN')),label+' delivery recap');
  checks.push(label);
}
function blocked(label){
  order.calc();updateRecap();
  assert.equal(order.getCurrentTotal(),null,label+' canonical total must fail closed');
  assert.equal(nodes.pAmt.textContent,'—',label+' calculator must not show a charge');
  assert.match(nodes['ns-del-summary'].textContent,/unavailable|select/i,label+' delivery recap must explain why no total is available');
  checks.push(label);
}
valid('Live tender minimum',5,385);
option.dataset.active='false';blocked('Product deactivated while selected');
option.dataset.active='true';option.disabled=true;blocked('Selected option disabled');
option.disabled=false;option.dataset.stock='3';blocked('Stock drops below live minimum');
option.dataset.stock='0';blocked('Selected product sells out');
option.dataset.stock='100';price=null;blocked('Live price unavailable');
price=77;selected=null;blocked('No product selected');
selected=option;valid('Recovered catalog clears blocked state',5,385);
for(const input of ['','0','-1','2','5.5','5pieces','101']){
  nodes.oQ.value=input;assert.equal(order.getCurrentTotal(),null,'Invalid raw quantity cannot fabricate total: '+input);
}
nodes.oQ.value='0';order.calc();updateRecap();
assert.equal(nodes.oQ.value,'5','Zero quantity normalizes to actual minimum');
assert.equal(order.getCurrentTotal(),385);
assert.match(nodes['ns-del-summary'].innerHTML,/₹385/,'Normalized quantity reaches recap');
checks.push('Invalid quantities and recovery');
console.log('PASS live availability/recap: '+JSON.stringify(checks));
