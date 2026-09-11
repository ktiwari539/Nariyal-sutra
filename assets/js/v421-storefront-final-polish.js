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
let cinePhaseRaf=0;

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

function installCinematicFinish(){
  if(document.getElementById('ns-v421-cinematic-finish'))return;
  const style=document.createElement('style');
  style.id='ns-v421-cinematic-finish';
  style.textContent=`
    #v421-cinematic-film-pro .nspro-knife{width:min(46vw,620px)!important;height:96px!important;filter:drop-shadow(0 18px 24px rgba(0,0,0,.48))!important}
    #v421-cinematic-film-pro .nspro-knife .blade{top:29px!important;width:72%!important;height:38px!important;border-radius:1px 34% 34% 1px!important;clip-path:polygon(0 38%,88% 4%,100% 48%,89% 92%,0 62%)!important;background:linear-gradient(180deg,#858e89 0%,#e1e4df 20%,#a8afab 40%,#525a56 58%,#c8ccc7 73%,#303734 100%)!important;box-shadow:inset 0 1px rgba(255,255,255,.48),inset 0 -1px rgba(8,13,11,.65)!important}
    #v421-cinematic-film-pro .nspro-knife .handle{top:20px!important;width:31%!important;height:57px!important;border-radius:10px 26px 26px 10px!important;background:linear-gradient(90deg,#604329 0%,#24160f 48%,#0f0b08 68%,#51351f 100%)!important;box-shadow:inset 0 1px 2px rgba(255,255,255,.12),0 9px 17px rgba(0,0,0,.42)!important}
    #v421-cinematic-film-pro .nspro-splash{width:min(66vw,950px)!important;filter:saturate(.92) contrast(1.04) brightness(.76)!important}
    #v421-cinematic-film-pro.ns-v421-splash-phase .nspro-main,
    #v421-cinematic-film-pro.ns-v421-splash-phase .nspro-body,
    #v421-cinematic-film-pro.ns-v421-splash-phase .nspro-cap,
    #v421-cinematic-film-pro.ns-v421-splash-phase .nspro-focus-ring{opacity:0!important}
    #v421-cinematic-film-pro .nspro-water-photo{inset:-4%!important;width:108%!important;height:108%!important;object-position:center 54%!important;filter:saturate(1.03) contrast(1.12) brightness(.68)!important;mix-blend-mode:normal!important}
    #v421-cinematic-film-pro .nspro-water{inset:-8%!important;background:radial-gradient(circle at 48% 44%,rgba(218,250,244,.18) 0%,rgba(97,202,194,.25) 25%,rgba(19,112,126,.43) 52%,rgba(3,45,61,.66) 78%,rgba(1,18,29,.82) 100%),linear-gradient(180deg,rgba(0,40,48,.08),rgba(1,22,34,.38))!important}
    #v421-cinematic-film-pro .nspro-water:before,#v421-cinematic-film-pro .nspro-water:after{inset:-4%!important;background:radial-gradient(ellipse at 43% 47%,transparent 0 18%,rgba(255,255,255,.10) 19% 20%,transparent 21% 31%,rgba(255,255,255,.055) 32% 33%,transparent 34%)!important;mix-blend-mode:screen!important}
    #v421-cinematic-film-pro .nspro-water:after{opacity:.38!important}
    #v421-cinematic-film-pro .nspro-note{padding:7px 9px;background:rgba(1,18,20,.32);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(8px)}
    @media(max-width:980px){
      #v421-cinematic-film-pro .nspro-knife{width:min(76vw,430px)!important;height:72px!important}
      #v421-cinematic-film-pro .nspro-knife .blade{top:23px!important;height:29px!important}
      #v421-cinematic-film-pro .nspro-knife .handle{top:17px!important;height:43px!important}
      #v421-cinematic-film-pro .nspro-splash{width:min(86vw,600px)!important;filter:saturate(.92) contrast(1.04) brightness(.74)!important}
      #v421-cinematic-film-pro .nspro-water-photo{object-position:center 52%!important}
    }
  `;
  document.head.appendChild(style);
}

function syncCinematicPhase(){
  cinePhaseRaf=0;
  const film=document.getElementById('v421-cinematic-film-pro');
  if(!film)return;
  const p=Number(window.__NS_V421_PRO_CINE?.progress||0);
  film.classList.toggle('ns-v421-splash-phase',p>=.645);
}
function requestCinematicPhase(){if(!cinePhaseRaf)cinePhaseRaf=requestAnimationFrame(syncCinematicPhase);}

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
  installCinematicFinish();
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
  requestCinematicPhase();
  return true;
}

function init(){
  installCinematicFinish();
  fixLegacyStoryMedia();
  if(!addCinematicDepth()){
    let tries=0;
    const timer=setInterval(()=>{
      fixLegacyStoryMedia();
      if(addCinematicDepth()||++tries>30)clearInterval(timer);
    },120);
  }
  setTimeout(fixLegacyStoryMedia,700);
  setTimeout(()=>{fixLegacyStoryMedia();addCinematicDepth();requestCinematicPhase();},1600);
  window.addEventListener('scroll',requestCinematicPhase,{passive:true});
  window.addEventListener('resize',requestCinematicPhase,{passive:true});
  window.addEventListener('nsv421:change',()=>setTimeout(()=>{fixLegacyStoryMedia();requestCinematicPhase();},0));
  window.addEventListener('nsv421:production-ready',()=>setTimeout(()=>{fixLegacyStoryMedia();requestCinematicPhase();},0));
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
