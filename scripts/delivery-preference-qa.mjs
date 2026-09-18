import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const must=(c,m)=>{if(!c)throw new Error(m)};

const delivery=read('ns-delivery.js');
for(const phrase of [
  "label:'Door Delivery'",
  "label:'Pickup from Handover Hub'",
  "label:'Railway Station Handover'",
  "label:'Bus Stand / Stop Handover'",
  "window.nsFindHandover=async function(kind)",
  "window.nsChooseHandover=function(idx)",
  "handoverPointName:String(nsDelivery.handoverPointName||'').slice(0,180)",
  "handoverSearchSource:String(nsDelivery.handoverSearchSource||'').slice(0,40)"
])must(delivery.includes(phrase),`Delivery preference contract missing: ${phrase}`);

must(!delivery.includes("Never remove coconuts from packaging before delivery."),'Obsolete delivery instruction is still customer-visible');

const index=read('index.html');
must(index.includes('Address / locality for serviceability'),'Checkout address wording was not generalized for pickup / station handover');
must(index.includes('Preferred handover point'),'WhatsApp confirmation does not carry the selected handover point');
must(index.includes('assets/js/ns-smart-location.js'),'Smart location must load from the same candidate build');
must(!index.includes('https://nariyal-sutra.netlify.app/assets/js/ns-smart-location.js'),'Checkout must not load stale production smart-location code');

const rules=read('firestore.rules');
for(const field of ['deliveryPreference','handoverPointType','handoverPointName','handoverPointAddress','handoverPointLat','handoverPointLng','handoverSearchSource','handoverNote'])
  must(rules.includes("'"+field+"'"),`Firestore order contract missing ${field}`);

const privacy=read('privacy.html');
must(privacy.includes("OpenStreetMap's Nominatim"),'Privacy policy must disclose nearby station/stop search provider');

console.log('DELIVERY PREFERENCE EXPERIENCE QA: PASS');
