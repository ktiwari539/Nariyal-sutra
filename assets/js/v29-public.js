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
function loadRebuiltCinematic(){
  if(window.__NS_V421_REAL_CINE_LOADER__)return;
  window.__NS_V421_REAL_CINE_LOADER__=true;
  const s=document.createElement('script');
  s.src='assets/js/v421-cinematic-rebuild.js?v=20260911-real-sequence-2';
  s.defer=true;
  s.dataset.cinematic='v421-rebuild';
  document.head.appendChild(s);
}
function init(){setTimeout(()=>{zoomWords();cleanDeadSpace();loadRebuiltCinematic();},140);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
