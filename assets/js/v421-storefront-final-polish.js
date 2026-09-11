(function(){
'use strict';
if(window.__NS_V421_STOREFRONT_FINAL_POLISH__)return;
window.__NS_V421_STOREFRONT_FINAL_POLISH__=true;
const Store=window.NSV421Store;

/* Curated defaults are fallbacks only. Explicit Admin sectionMedia selections always win. */
const LOCAL_HARVEST=[
  '/assets/images/brand/coconut-premium.webp',
  '/assets/images/green-round-coconut.jpg',
  '/assets/images/bulk-coconut-pack.jpg'
];
const HARVEST_TARGETS=['homepage-harvest-1','homepage-harvest-2','homepage-harvest-3'];

function configuredMedia(target){
  if(!Store?.load||!Store?.mediaById)return '';
  try{
    const s=Store.load(),id=s?.sectionMedia?.[target];
    if(!id)return '';
    const m=Store.mediaById(s,id);
    return m?.src||m?.thumb||'';
  }catch(_e){return '';}
}

function setImg(selector,src,alt){
  const img=document.querySelector(selector);
  if(!img||!src)return;
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  img.removeAttribute('srcset');
  img.removeAttribute('onerror');
  if(alt)img.setAttribute('alt',alt);
}

function diversifyHomepageMedia(){
  /* Product / cut chapters */
  setImg('#cut-story .cut-photo-v16','/assets/images/freshness-coconut-splash.webp','Fresh coconut water splash after a clean cut');
  setImg('[data-product-card="tender"] .pc-img-wrap img','/assets/images/nariyal-product-collection.webp','Fresh tender coconut collection');

  /* Main story image: product-led, not another grove landscape. */
  setImg('.story-visual .sv-img','/assets/images/brand/coconut-premium.webp','Premium fresh green coconut prepared for drinking');

  /* User-approved generated campaign visuals: each commercial story gets its own scene. */
  setImg('.trade-route.trade-buy img','/assets/images/generated/hospitality.webp','Fresh coconuts prepared for bulk, events and hospitality');
  setImg('.trade-route.trade-supply img','/assets/images/generated/supplier.webp','Coconut farm and supplier partnership story');

  /* Explicit Admin choices outrank coded defaults. */
  const heroSrc=configuredMedia('homepage-hero');
  if(heroSrc)setImg('.hero-visual img',heroSrc,'Nariyal Sutra homepage hero');
  setImg('#people-of-nariyal .ns-people-visual img',configuredMedia('homepage-people-teaser')||'/assets/images/ambassadors/G001.webp','Nariyal Sutra community and people story');

  /* Five-story portals: coast / canopy / hands each get a different visual language. */
  setImg('.promise-portal.coast img','/assets/images/review/coastal-grove.png','Gujarat coastal coconut sourcing story');
  setImg('.promise-portal.grove img','/assets/images/review/backwater-grove.png','South India coconut backwater and canopy story');
  setImg('.promise-portal.farm img','/assets/images/generated/direct-sourcing.webp','Direct coconut sourcing and harvest story');

  /* Brand moment uses Admin media when selected, otherwise the curated coastal default. */
  const brand=document.querySelector('.brand-moment-bg');
  if(brand){
    const src=configuredMedia('homepage-brand')||'/assets/images/review/coastal-grove.png';
    brand.style.setProperty('background-image',`linear-gradient(90deg,rgba(2,9,2,.90) 0%,rgba(2,9,2,.40) 48%,rgba(2,9,2,.72) 100%),url('${src}')`,'important');
    brand.dataset.nsMedia=configuredMedia('homepage-brand')?'admin':'coastal-grove';
  }
  const grove=document.querySelector('.grove-photo');
  if(grove){
    grove.style.setProperty('background-image',"linear-gradient(to top,rgba(2,8,1,.96) 0%,rgba(2,8,1,.08) 55%,rgba(2,8,1,.30) 100%),linear-gradient(95deg,rgba(3,12,2,.48),rgba(3,12,2,.05) 60%,rgba(3,12,2,.34)),url('/assets/images/review/backwater-grove.png')",'important');
    grove.dataset.nsMedia='backwater-grove';
  }

  document.documentElement.dataset.nsMediaDiversity='ready';
}

function fixLegacyStoryMedia(){
  /* The retired 72-frame/video fold duplicates the new cinematic and could render blank. */
  const motion=document.getElementById('live-motion');
  if(motion){
    motion.hidden=true;
    motion.setAttribute('aria-hidden','true');
    motion.style.setProperty('display','none','important');
    motion.style.setProperty('height','0','important');
    motion.querySelectorAll('video').forEach(v=>{try{v.pause();v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();}catch(_e){}});
  }

  /* Harvest film: Admin-selected frames when present, otherwise three distinct defaults. */
  const harvest=document.getElementById('harvest-film');
  if(harvest){
    harvest.querySelectorAll('.harvest-scene').forEach((img,i)=>{
      const src=configuredMedia(HARVEST_TARGETS[i])||LOCAL_HARVEST[i%LOCAL_HARVEST.length];
      if(img.getAttribute('src')!==src)img.setAttribute('src',src);
      img.removeAttribute('srcset');
      img.setAttribute('loading','eager');
      img.style.setProperty('opacity',img.classList.contains('is-active')?'1':'0');
    });
    const first=harvest.querySelector('.harvest-scene.is-active')||harvest.querySelector('.harvest-scene');
    if(first){first.classList.add('is-active');first.style.setProperty('opacity','1');}
  }
  diversifyHomepageMedia();
}

function addCinematicDepth(){
  const film=document.getElementById('v421-cinematic-film-pro');
  if(!film)return false;
  film.classList.add('nspro-depth-ready');
  film.querySelectorAll('.nspro-nut').forEach((nut,i)=>{
    const d=Math.max(0,Math.min(1,Number(nut.dataset.depth||0.5)));
    nut.style.setProperty('--ns-depth',d.toFixed(3));
    nut.style.setProperty('--ns-depth-z',`${Math.round((d-.50)*300)}px`);
    nut.style.setProperty('--ns-depth-scale',(0.82+d*.34).toFixed(3));
    nut.classList.toggle('ns-depth-near',d>.72);
    nut.classList.toggle('ns-depth-mid',d>=.30&&d<=.72);
    nut.classList.toggle('ns-depth-far',d<.30);
    if(i%17===0)nut.classList.add('ns-cine-glint');
  });
  return true;
}

function init(){
  fixLegacyStoryMedia();
  if(!addCinematicDepth()){
    let tries=0;
    const timer=setInterval(()=>{
      fixLegacyStoryMedia();
      if(addCinematicDepth()||++tries>30)clearInterval(timer);
    },120);
  }
  setTimeout(fixLegacyStoryMedia,700);
  setTimeout(()=>{fixLegacyStoryMedia();addCinematicDepth();},1600);
  window.addEventListener('nsv421:change',()=>setTimeout(fixLegacyStoryMedia,0));
  window.addEventListener('nsv421:production-ready',()=>setTimeout(fixLegacyStoryMedia,0));
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
