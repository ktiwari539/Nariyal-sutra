(function(){
'use strict';
if(window.__NS_V421_MEDIA_INTEGRITY__)return;
window.__NS_V421_MEDIA_INTEGRITY__=true;
const file=(location.pathname.split('/').pop()||'index.html').toLowerCase()||'index.html';
const $=(s,r=document)=>r.querySelector(s);

function local(src){return src.startsWith('/')?src:'/'+src;}
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
function markFailures(){
 document.querySelectorAll('img').forEach(img=>{
   if(img.dataset.nsIntegrityGuard==='1')return;img.dataset.nsIntegrityGuard='1';
   img.addEventListener('error',()=>{
     img.classList.add('ns-media-unavailable');
     const host=img.closest('figure,.w-hero-media,.sp-video,.water-window,.supplier-photo,.brand-portrait,.farm-media,.story-card,.cw-image-panel')||img.parentElement;
     if(host){host.classList.add('ns-media-unavailable-host');host.dataset.nsMissingMedia=img.getAttribute('src')||'';}
     /* Never repaint an unrelated failed image with the same generic grove. */
     img.style.setProperty('display','none','important');
   });
 });
}
function installStyle(){
 if($('#nsMediaIntegrityStyle'))return;
 const s=document.createElement('style');s.id='nsMediaIntegrityStyle';s.textContent=`
 .ns-integrity-still{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
 .sp-video>.ns-integrity-still,.water-window>.ns-integrity-still{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 .sp-video,.water-window{position:relative;overflow:hidden;background:#071107}
 .ns-media-unavailable-host{background:radial-gradient(circle at 70% 20%,rgba(212,168,67,.10),transparent 36%),linear-gradient(145deg,#0a1708,#030902)!important;min-height:220px}
 .ns-media-unavailable-host:after{content:'Nariyal Sutra · visual unavailable';position:absolute;left:20px;bottom:18px;color:rgba(245,209,126,.58);font:600 8px/1.4 Jost,sans-serif;letter-spacing:2.2px;text-transform:uppercase}
 `;document.head.appendChild(s);
}
function applyPageVisuals(){
 installStyle();
 switch(file){
  case 'supplier-partnership.html':
    setImg('.w-hero-media img','assets/images/generated/supplier.webp','Coconut supplier partnership and sourcing capability');
    setImg('.supplier-photo img','assets/images/harvest-wall-organic.jpg','Current coconut source capability and field context');
    break;
  case 'direct-farm.html':
    setImg('.w-hero-media img','assets/images/generated/direct-sourcing.webp','Direct coconut sourcing and farmer supplier process');
    setImg('.brand-portrait img','assets/images/brand/coconut-premium.webp','Current coconut product and sourcing requirement');
    break;
  case 'freshness-first.html':
    replaceEmptyVideo('.water-window video','assets/images/freshness-coconut-splash.webp','Fresh coconut water and cut presentation study');
    break;
  case 'fresh-tender-coconut.html':
    replaceEmptyVideo('.sp-video video','assets/images/freshness-coconut-splash.webp','Fresh tender coconut cut and water study');
    break;
  case 'coconut-events-hospitality.html':
    replaceEmptyVideo('.sp-video video','assets/images/generated/hospitality.webp','Fresh coconut hospitality and event presentation');
    break;
  case 'coconut-water.html':
    setImg('.cw-image-panel img','assets/images/nariyal-product-collection.webp','Fresh green coconuts prepared for serving');
    break;
 }
 markFailures();
 document.documentElement.dataset.nsMediaIntegrity='ready';
}
function init(){applyPageVisuals();setTimeout(applyPageVisuals,500);setTimeout(markFailures,1500);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
