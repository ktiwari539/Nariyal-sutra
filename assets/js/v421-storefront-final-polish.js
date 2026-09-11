(function(){
'use strict';
if(window.__NS_V421_STOREFRONT_FINAL_POLISH__)return;
window.__NS_V421_STOREFRONT_FINAL_POLISH__=true;

const LOCAL_HARVEST=[
  '/assets/images/nariyal-hospitality.webp',
  '/assets/images/nariyal-product-collection.webp',
  '/assets/images/nariyal-coconut-grove.webp'
];

function fixLegacyStoryMedia(){
  /* The old 72-frame/video fold depends on a retired deploy URL and duplicates
     the new cinematic. Remove it from the customer journey instead of showing
     a white/empty player. */
  const motion=document.getElementById('live-motion');
  if(motion){
    motion.hidden=true;
    motion.setAttribute('aria-hidden','true');
    motion.style.setProperty('display','none','important');
    motion.style.setProperty('height','0','important');
    motion.querySelectorAll('video').forEach(v=>{try{v.pause();v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();}catch(_e){}});
  }

  /* Keep the editorial harvest panel, but make every scene first-party/local so
     local review and production are not tied to an old deploy hostname. */
  const harvest=document.getElementById('harvest-film');
  if(harvest){
    harvest.querySelectorAll('.harvest-scene').forEach((img,i)=>{
      const src=LOCAL_HARVEST[i%LOCAL_HARVEST.length];
      if(img.getAttribute('src')!==src)img.setAttribute('src',src);
      img.removeAttribute('srcset');
      img.setAttribute('loading','eager');
      img.style.setProperty('opacity',img.classList.contains('is-active')?'1':'0');
    });
    const first=harvest.querySelector('.harvest-scene.is-active')||harvest.querySelector('.harvest-scene');
    if(first){first.classList.add('is-active');first.style.setProperty('opacity','1');}
  }
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
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
