// Explicit V17/V18 media + location-map regression guard.
// All checks are against repository files and mocked geocoding; no live services.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const index=read('index.html');
const admin=read('admin-preview.html');
const adminJs=read('assets/js/admin-v21.js');
const customerJs=read('assets/js/v21-public.js');
const mapsJs=read('assets/js/map.js');
const tests=[];
function check(name,condition){assert.ok(condition,name);tests.push(name);}

// Earlier V17 reported blue '?' image boxes from four missing rain PNGs.
const localImages=[...index.matchAll(/<img\b[^>]*>/gi)]
  .map(m=>m[0].match(/\bsrc=["']([^"']+)["']/i)?.[1])
  .filter(Boolean).map(url=>url.replace(/^\//,'').split(/[?#]/)[0])
  .filter(url=>url.startsWith('assets/images/'));
check('Homepage has actual local image references',localImages.length>=10);
for(const img of new Set(localImages)){
  check('Existing image asset: '+img,fs.existsSync(path.join(root.pathname,img)));
}
const oldNames=['rain-coconut-stub.png','rain-coconut-short.png','rain-coconut-medium.png','rain-coconut-short-warm.png'];
for(const name of oldNames)check('No former broken image source '+name,
  !new RegExp('<img\\b[^>]*src=["\\x27][^"\\x27]*'+name.replace('.','\\.')+'["\\x27]','i').test(index));
check('Legacy image rain disabled',index.includes('var drops=[];'));
for(const name of ['story-coconut-hero.png','story-coconut-body-cut.png','story-coconut-cap-cut.png'])
  check('Three-piece coconut artwork exists '+name,fs.existsSync(path.join(root.pathname,'assets/images',name)));

// The delivery map used to be Street-only with no address/track updates on pin changes.
for(const mode of ['street','satellite','terrain']){
  check('Admin selectable '+mode+' mode',admin.includes('<option value="'+mode+'">'));
  check('Admin tile-provider '+mode,adminJs.includes("mode==='"+mode+"'")||mode==='street');
}
check('Admin Google Maps link',admin.includes('id="apDeliveryOpenGoogle"')&&adminJs.includes("https://www.google.com/maps/search/?api=1&query="));
check('Admin reverse-geocodes selected pin',adminJs.includes("nominatim.openstreetmap.org/reverse")&&adminJs.includes("marker.on('dragend'")&&adminJs.includes("map.on('click'"));
const setStart=adminJs.indexOf('async function setPin('),setEnd=adminJs.indexOf('function initMap()',setStart);
const setPin=adminJs.slice(setStart,setEnd);
check('Admin selected pin updates coordinate inputs',setPin.includes('inp.lat.value=')&&setPin.includes('inp.lng.value='));
check('Admin selected pin updates location label',setPin.includes('inp.location.value=d.locationLabel'));
check('Admin selected pin updates customer tracking preview',setPin.includes('renderTracking();'));
check('Admin current location supported',adminJs.includes('apDeliveryUseCurrent')&&adminJs.includes('getCurrentPosition'));

check('Customer pin is draggable',customerJs.includes("marker.on('dragend'"));
check('Customer map click updates pin',customerJs.includes("map.on('click'"));
check('Customer reverse-geocoding available',customerJs.includes('nominatim.openstreetmap.org/reverse'));
check('Customer shared location dispatches events',customerJs.includes("window.dispatchEvent(new CustomEvent('ns:location-updated'"));
check('Customer location and map use shared update pipeline',customerJs.includes("source:'pin',updateAddress:true"));
check('Tracking map has Street/Satellite modes and Google Maps external link',
 mapsJs.includes('function createTracking(')&&mapsJs.includes('>Street</button>')&&mapsJs.includes('>Satellite</button>')
 &&mapsJs.includes('Open in Google Maps ↗'));

// Exercise actual shared Google Maps URL and geocoder without network.
let observedUrl='';
const window={};
const sandbox={window,encodeURIComponent,fetch:async url=>{
  observedUrl=String(url);
  return {ok:true,json:async()=>({display_name:'QA: Ranjhi, Jabalpur'})};
}};
vm.runInNewContext(mapsJs,sandbox,{timeout:1000});
const google=window.NSMap.googleUrl(23.198712,80.019245);
const parsed=new URL(google);
check('Google Maps link uses selected pin',parsed.hostname==='www.google.com'
  &&parsed.searchParams.get('query')==='23.198712,80.019245');
const label=await window.NSMap.reverse(23.198712,80.019245);
check('Reverse lookup resolves map location',label==='QA: Ranjhi, Jabalpur'
  &&observedUrl.includes('lat=23.198712')&&observedUrl.includes('lon=80.019245'));
console.log('V18 MEDIA/MAP REGRESSION QA: PASS ('+tests.length+' checks, no external requests)');
