(function(){
const KEY='ns-v421-local-state-v20';
const defaults={
 products:[
  {sku:'TENDER',name:'Fresh Tender Coconut',retail:55,bulk:45,moq:10,state:'Active'},
  {sku:'GREEN',name:'Green Round Coconut',retail:55,bulk:48,moq:10,state:'Active'},
  {sku:'BULK',name:'Bulk Tender Coconut',retail:0,bulk:45,moq:50,state:'Quote'}
 ],
 inventory:[
  {sku:'TENDER',name:'Fresh Tender Coconut',onHand:420,reserved:36,incoming:180,low:80,supplier:'Farmer / supplier network',node:'Jabalpur fulfilment'},
  {sku:'GREEN',name:'Green Round Coconut',onHand:220,reserved:20,incoming:100,low:60,supplier:'Farmer / supplier network',node:'Mumbai MMR partner node'}
 ],
 warehouses:[
  {name:'Jabalpur fulfilment',ownership:'Partner-operated',city:'Jabalpur, Madhya Pradesh'},
  {name:'MMR partner node',ownership:'Partner-operated',city:'Virar / Mumbai Metropolitan Region'}
 ],
 media:[
  {id:'M-ORIGIN-01',name:'Coastal coconut grove',status:'Approved',visible:true,placement:'Homepage',src:'assets/images/review/coastal-grove.png'},
  {id:'M-ORIGIN-02',name:'Backwater coconut grove',status:'Approved',visible:true,placement:'Sourcing',src:'assets/images/review/backwater-grove.png'},
  {id:'M-LIVE-01',name:'Protected coconut hero',status:'Approved',visible:true,placement:'Product',src:'https://nariyal-sutra.netlify.app/assets/images/story-coconut-hero.png'}
 ],
 sections:[
  {id:'origin-grove',title:'Origin / Grove',visible:true,order:1,placement:'Homepage',motion:'Slow crossfade'},
  {id:'fresh-cut',title:'Fresh Cut',visible:true,order:2,placement:'Homepage',motion:'Restrained motion'},
  {id:'people',title:'People of Nariyal Sutra',visible:true,order:3,placement:'Homepage glimpse',motion:'Static editorial'}
 ],
 team:[
  {name:'Krishna Tiwari',role:'Owner',state:'Active'},
  {name:'Amit Sharma',role:'Operations',state:'Active'},
  {name:'Riya Mehta',role:'Content',state:'Active'},
  {name:'Neha Verma',role:'Support',state:'Active'},
  {name:'Arjun Rao',role:'Sales',state:'Active'}
 ],
 delivery:{orderId:'NS-DEMO-2408',status:'Out for delivery',eta:'Today 5:30–6:15 PM',partner:'Local delivery partner',vehicle:'Delivery vehicle',location:'Jabalpur, Madhya Pradesh',lat:23.1815,lng:79.9864,customerUpdate:'Your order is on the way.',internalNote:'Private operations note — never public.'},
 audit:[]
};
function clone(v){return JSON.parse(JSON.stringify(v))}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&typeof x==='object'?Object.assign(clone(defaults),x):clone(defaults)}catch(e){return clone(defaults)}}
function save(s,action){localStorage.setItem(KEY,JSON.stringify(s));if(action){s.audit=s.audit||[];s.audit.unshift({at:new Date().toLocaleString(),action});s.audit=s.audit.slice(0,50);localStorage.setItem(KEY,JSON.stringify(s))}window.dispatchEvent(new CustomEvent('ns:v20-change',{detail:s}));return s}
function reset(){localStorage.removeItem(KEY);const s=load();window.dispatchEvent(new CustomEvent('ns:v20-change',{detail:s}));return s}
function setSession(x){sessionStorage.setItem('ns-v421-staff-session',JSON.stringify(x||{}))}
function getSession(){try{return JSON.parse(sessionStorage.getItem('ns-v421-staff-session')||'null')}catch(e){return null}}
window.NSStore={KEY,defaults,load,save,reset,setSession,getSession};
})();
