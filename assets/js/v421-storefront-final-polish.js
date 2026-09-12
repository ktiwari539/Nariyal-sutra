(function(){
'use strict';
if(window.__NS_V421_STOREFRONT_FINAL_POLISH__)return;window.__NS_V421_STOREFRONT_FINAL_POLISH__=true;
const Store=window.NSV421Store;
const LOCAL_HARVEST=['/assets/images/review/coastal-grove.png','/assets/images/review/backwater-grove.png','/assets/images/nariyal-product-collection.webp'];
const HARVEST_TARGETS=['homepage-harvest-1','homepage-harvest-2','homepage-harvest-3'];
function configuredMedia(target){try{if(!Store?.load||!Store?.mediaById)return '';const s=Store.load(),id=s?.sectionMedia?.[target];if(!id)return '';const m=Store.mediaById(s,id);if(m?.largeSurfaceAllowed===false)return '';return m?.src||m?.thumb||'';}catch(_e){return '';}}
function setImg(selector,src,alt){const img=document.querySelector(selector);if(!img||!src)return;if(img.getAttribute('src')!==src)img.setAttribute('src',src);img.removeAttribute('srcset');img.removeAttribute('onerror');if(alt)img.setAttribute('alt',alt);}
function diversifyHomepageMedia(){
 setImg('#cut-story .cut-photo-v16','/assets/images/freshness-coconut-splash.webp','Fresh coconut water splash after a clean cut');
 setImg('[data-product-card="tender"] .pc-img-wrap img','/assets/images/nariyal-product-collection.webp','Fresh tender coconut collection');
 setImg('.story-visual .sv-img','/assets/images/nariyal-coconut-grove.webp','Coconut grove source story');
 setImg('.trade-route.trade-buy img','/assets/images/nariyal-hospitality.webp','Fresh coconut hospitality and serving story');
 setImg('.trade-route.trade-supply img','/assets/images/review/backwater-grove.png','Coconut sourcing and supply story');
 const heroSrc=configuredMedia('homepage-hero');if(heroSrc)setImg('.hero-visual img',heroSrc,'Nariyal Sutra homepage hero');
 setImg('#people-of-nariyal .ns-people-visual img',configuredMedia('homepage-people-teaser')||'/assets/images/review/coastal-grove.png','Nariyal Sutra community and people story');
 setImg('.promise-portal.coast img','/assets/images/review/coastal-grove.png','Gujarat coastal coconut sourcing story');
 setImg('.promise-portal.grove img','/assets/images/review/backwater-grove.png','South India coconut backwater and canopy story');
 setImg('.promise-portal.farm img','/assets/images/nariyal-coconut-grove.webp','Direct coconut grove sourcing story');
 const brand=document.querySelector('.brand-moment-bg');if(brand){const adminSrc=configuredMedia('homepage-brand'),src=adminSrc||'/assets/images/review/coastal-grove.png';brand.style.setProperty('background-image',`linear-gradient(90deg,rgba(2,9,2,.88) 0%,rgba(2,9,2,.34) 48%,rgba(2,9,2,.68) 100%),url('${src}')`,'important');brand.dataset.nsMedia=adminSrc?'admin':'coastal-grove';}
 const grove=document.querySelector('.grove-photo');if(grove){grove.style.setProperty('background-image',"linear-gradient(to top,rgba(2,8,1,.94) 0%,rgba(2,8,1,.06) 55%,rgba(2,8,1,.26) 100%),linear-gradient(95deg,rgba(3,12,2,.42),rgba(3,12,2,.03) 60%,rgba(3,12,2,.28)),url('/assets/images/nariyal-coconut-grove.webp')",'important');grove.dataset.nsMedia='nariyal-coconut-grove';}
 document.documentElement.dataset.nsMediaDiversity='ready';
}
function normalizeLegacyStoryMedia(){
 const motion=document.getElementById('live-motion');if(motion){motion.hidden=true;motion.setAttribute('aria-hidden','true');motion.style.setProperty('display','none','important');motion.style.setProperty('height','0','important');motion.querySelectorAll('video').forEach(v=>{try{v.pause();v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();}catch(_e){}});}
 const harvest=document.getElementById('harvest-film');if(harvest){harvest.querySelectorAll('.harvest-scene').forEach((img,i)=>{const src=configuredMedia(HARVEST_TARGETS[i])||LOCAL_HARVEST[i%LOCAL_HARVEST.length];if(img.getAttribute('src')!==src)img.setAttribute('src',src);img.removeAttribute('srcset');img.setAttribute('loading','eager');img.style.setProperty('opacity',img.classList.contains('is-active')?'1':'0');});const first=harvest.querySelector('.harvest-scene.is-active')||harvest.querySelector('.harvest-scene');if(first){first.classList.add('is-active');first.style.setProperty('opacity','1');}}
 diversifyHomepageMedia();
}
function assertCurrentCinematic(){const wrap=document.getElementById('scroll-cinema');if(wrap)wrap.dataset.nsFinalPolish='current-v20';const retired=document.getElementById('v421-cinematic-film-pro');if(retired)retired.remove();}
function apply(){assertCurrentCinematic();normalizeLegacyStoryMedia();}
function init(){apply();setTimeout(apply,500);setTimeout(apply,1400);window.addEventListener('nsv421:change',()=>setTimeout(apply,0));window.addEventListener('nsv421:production-ready',()=>setTimeout(apply,0));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();