(function(){
'use strict';
if(window.__NS_V421_MEDIA_INTEGRITY__)return;
window.__NS_V421_MEDIA_INTEGRITY__=true;
const file=(location.pathname.split('/').pop()||'index.html').toLowerCase()||'index.html';
const $=(s,r=document)=>r.querySelector(s);
const GENERIC_FALLBACKS=['/assets/images/nariyal-coconut-grove.webp','/assets/images/harvest-wall-organic.jpg'];
const WS={
 hospitality:'/assets/images/website-media/ws001-fresh-cut-ocean.webp',
 harvestHands:'/assets/images/website-media/ws003-harvest-hands.webp',
 fieldHarvest:'/assets/images/website-media/ws005-field-harvest-workers.webp',
 productBasket:'/assets/images/website-media/ws006-tender-coconut-basket.webp',
 coastSunset:'/assets/images/website-media/ws010-coast-sunset-grove.webp'
};

function local(src){return src.startsWith('/')?src:'/'+src;}
function pathOf(src){try{return new URL(src,location.href).pathname;}catch(_){return src||'';}}
function setImg(selector,src,alt){
 const img=$(selector);if(!img)return false;
 img.src=local(src);img.removeAttribute('srcset');img.removeAttribute('onerror');
 if(alt)img.alt=alt;
 img.dataset.nsIntegrity='1';return true;
}
function replaceEmptyVideo(selector,src,alt){
 const video=$(selector);if(!video)return false;
 const hasSource=!!(video.getAttribute('src')||video.querySelector('source[src]'));
 if(hasSource)return false;
 const img=document.createElement('img');
 img.className=(video.className?video.className+' ':'')+'ns-integrity-still';
 img.src=local(src);img.alt=alt||'Nariyal Sutra product story';img.loading='eager';img.decoding='async';img.dataset.nsIntegrity='1';
 video.replaceWith(img);return true;
}
function pageFallback(img){
 const product=img.closest?.('[data-product-card]')?.dataset.productCard;
 if(product==='tender')return '/assets/images/nariyal-product-collection.webp';
 if(product==='green')return '/assets/images/green-round-coconut.jpg';
 if(product==='bulk')return '/assets/images/bulk-coconut-pack.jpg';
 if(img.closest?.('#people-of-nariyal,.people-page,#nsPeopleMarquee,.v25-people-worlds'))return '';
 if(img.closest?.('.trade-buy'))return WS.hospitality;
 if(img.closest?.('.trade-supply'))return WS.fieldHarvest;
 if(img.closest?.('.promise-portal.farm'))return WS.harvestHands;
 if(img.closest?.('#cut-story,.water-window,.cw-image-panel'))return '/assets/images/freshness-coconut-splash.webp';
 const map={
  'supplier-partnership.html':WS.fieldHarvest,
  'direct-farm.html':WS.coastSunset,
  'freshness-first.html':'/assets/images/freshness-coconut-splash.webp',
  'fresh-tender-coconut.html':'/assets/images/nariyal-product-collection.webp',
  'coconut-events-hospitality.html':WS.hospitality,
  'green-coconut.html':'/assets/images/green-round-coconut.jpg',
  'bulk-coconut-supply.html':'/assets/images/bulk-coconut-pack.jpg',
  'gujarat-coast.html':'/assets/images/review/coastal-grove.png',
  'south-india-groves.html':'/assets/images/review/backwater-grove.png',
  'coconut-water.html':'/assets/images/brand/coconut-premium.webp'
 };
 return map[file]||'/assets/images/nariyal-premium-hero.webp';
}
function retireGenericRepaints(){
 document.querySelectorAll('img[data-ns-original-src]').forEach(img=>{
   const current=pathOf(img.currentSrc||img.getAttribute('src')||'');
   const original=pathOf(img.dataset.nsOriginalSrc||'');
   if(!GENERIC_FALLBACKS.includes(current)||GENERIC_FALLBACKS.includes(original))return;
   const replacement=pageFallback(img);
   if(replacement&&replacement!==current){img.src=replacement;img.removeAttribute('srcset');img.dataset.nsIntegrityRecovery='context';}
   else if(!replacement){const card=img.closest('.ns-face-card,.v25-story-person,.story-card');if(card)card.remove();else img.style.setProperty('display','none','important');}
 });
}
function markFailures(){
 document.querySelectorAll('img').forEach(img=>{
   if(img.dataset.nsIntegrityGuard==='1')return;img.dataset.nsIntegrityGuard='1';
   img.addEventListener('error',()=>{
     const replacement=pageFallback(img),current=pathOf(img.currentSrc||img.getAttribute('src')||'');
     if(replacement&&pathOf(replacement)!==current&&img.dataset.nsIntegrityRecovery!=='final'){
       img.dataset.nsIntegrityRecovery='final';img.src=replacement;img.removeAttribute('srcset');return;
     }
     img.classList.add('ns-media-unavailable');
     const card=img.closest('.ns-face-card,.v25-story-person');if(card){card.remove();return;}
     const host=img.closest('figure,.w-hero-media,.sp-video,.water-window,.supplier-photo,.brand-portrait,.farm-media,.story-card,.cw-image-panel')||img.parentElement;
     if(host){host.classList.add('ns-media-unavailable-host');host.dataset.nsMissingMedia=img.getAttribute('src')||'';}
     img.style.setProperty('display','none','important');
   });
 });
 retireGenericRepaints();
}
function installStyle(){
 if($('#nsMediaIntegrityStyle'))return;
 const s=document.createElement('style');s.id='nsMediaIntegrityStyle';s.textContent=`
 .ns-integrity-still{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
 .sp-video>.ns-integrity-still,.water-window>.ns-integrity-still{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 .sp-video,.water-window{position:relative;overflow:hidden;background:#071107}
 .ns-media-unavailable-host{position:relative;background:radial-gradient(circle at 70% 20%,rgba(212,168,67,.10),transparent 36%),linear-gradient(145deg,#0a1708,#030902)!important;min-height:220px}
 .ns-media-unavailable-host:after{content:'Nariyal Sutra · visual unavailable';position:absolute;left:20px;bottom:18px;color:rgba(245,209,126,.58);font:600 8px/1.4 Jost,sans-serif;letter-spacing:2.2px;text-transform:uppercase}
 `;document.head.appendChild(s);
}
function applyPageVisuals(){
 installStyle();
 switch(file){
  case 'supplier-partnership.html':
    setImg('.w-hero-media img',WS.fieldHarvest,'Coconut supplier partnership and field sourcing capability');
    setImg('.supplier-photo img',WS.harvestHands,'Hands-on coconut harvest and source handling');
    break;
  case 'direct-farm.html':
    setImg('.w-hero-media img',WS.coastSunset,'Direct coconut sourcing from coastal groves');
    setImg('.brand-portrait img',WS.productBasket,'Fresh tender coconuts prepared after sourcing');
    break;
  case 'freshness-first.html':
    replaceEmptyVideo('.water-window video','/assets/images/freshness-coconut-splash.webp','Fresh coconut water and cut presentation study');
    break;
  case 'fresh-tender-coconut.html':
    replaceEmptyVideo('.sp-video video','/assets/images/freshness-coconut-splash.webp','Fresh tender coconut cut and water study');
    break;
  case 'green-coconut.html':
    replaceEmptyVideo('.sp-video video','/assets/images/green-round-coconut.jpg','Green coconut product study');
    break;
  case 'coconut-events-hospitality.html':
    setImg('.sp-scenes .sp-scene:nth-child(1)','/assets/images/nariyal-hospitality.webp','Fresh coconut hospitality service presentation');
    setImg('.sp-scenes .sp-scene:nth-child(3)','/assets/images/bulk-coconut-pack.jpg','Event-scale coconut presentation');
    replaceEmptyVideo('.sp-video video',WS.hospitality,'Fresh-cut coconut hospitality and event presentation');
    break;
  case 'coconut-water.html':
    setImg('.cw-visual img','/assets/images/brand/coconut-premium.webp','Fresh green tender coconut opened for coconut water');
    setImg('.cw-image-panel img','/assets/images/nariyal-product-collection.webp','Fresh green coconuts prepared for serving');
    break;
 }
 markFailures();retireGenericRepaints();
 document.documentElement.dataset.nsMediaIntegrity='ready';
}
function init(){applyPageVisuals();setTimeout(applyPageVisuals,500);setTimeout(()=>{markFailures();retireGenericRepaints();},1500);setTimeout(retireGenericRepaints,2800);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
