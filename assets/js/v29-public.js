(function(){
'use strict';
/* V32 compatibility shim: the old V29 homepage reordering is intentionally retired.
   It could pull nested cinematic/story chapters out of their parent containers.
   V32 owns safe top-level sequencing. */
function zoomWords(){
  const nodes=[...document.querySelectorAll('main h1,main h2,section h2,.people-hero-copy h1,.sec-title')]
    .filter((x,i,a)=>a.indexOf(x)===i&&!x.closest('#jungle-intro')&&!x.closest('#v20-story-film'));
  nodes.forEach(x=>x.classList.add('v29-word-zoom'));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){nodes.forEach(x=>x.classList.add('is-in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.13,rootMargin:'0px 0px -8% 0px'});
  nodes.forEach(x=>io.observe(x));
}
function cleanDeadSpace(){document.querySelectorAll('section').forEach(sec=>{if(sec.hidden)return;const meaningful=sec.querySelector('img,video,form,article,h1,h2,h3,p,button,a,input,textarea,select');if(!meaningful&&!sec.id)sec.style.display='none';});}
function forceCinematicRunway(){
  const film=document.getElementById('v20-story-film');
  if(!film||film.dataset.rebuilt!=='1'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const h=innerWidth<=980?'480vh':'620vh';
  film.style.setProperty('display','block','important');
  film.style.setProperty('position','relative','important');
  film.style.setProperty('height',h,'important');
  film.style.setProperty('min-height',h,'important');
  film.style.setProperty('max-height','none','important');
  film.style.setProperty('overflow','visible','important');
  const stage=film.querySelector('.v421-cine-stage');
  if(stage){
    stage.style.setProperty('display','block','important');
    stage.style.setProperty('position','sticky','important');
    stage.style.setProperty('top','0','important');
    stage.style.setProperty('height','100svh','important');
    stage.style.setProperty('min-height','100svh','important');
  }
}
function loadRebuiltCinematic(){
  if(window.__NS_V421_REAL_CINE_LOADER__)return;
  window.__NS_V421_REAL_CINE_LOADER__=true;
  const s=document.createElement('script');
  s.src='assets/js/v421-cinematic-rebuild.js?v=20260911-real-sequence-4';
  s.defer=true;
  s.dataset.cinematic='v421-rebuild';
  s.onload=()=>{
    [0,80,250,700].forEach(ms=>setTimeout(forceCinematicRunway,ms));
    addEventListener('resize',forceCinematicRunway,{passive:true});
  };
  s.onerror=()=>{window.__NS_V421_REAL_CINE_LOADER__=false;console.error('[NS] cinematic rebuild failed to load');};
  document.head.appendChild(s);
}
function init(){
  setTimeout(()=>{
    loadRebuiltCinematic();
    try{zoomWords();}catch(e){console.warn('[NS] zoomWords skipped',e);}
    try{cleanDeadSpace();}catch(e){console.warn('[NS] cleanDeadSpace skipped',e);}
  },80);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
