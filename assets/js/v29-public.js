(function(){
'use strict';
/* V42.1 stabilization: the supported homepage cinematic is #scroll-cinema / #v20-story-film.
   The experimental v421 professional runtime stays dormant because it hides the supported
   cinematic and creates a second, conflicting scroll system. */
function zoomWords(){
  const nodes=[...document.querySelectorAll('main h1,main h2,section h2,.people-hero-copy h1,.sec-title')]
    .filter((x,i,a)=>a.indexOf(x)===i&&!x.closest('#jungle-intro')&&!x.closest('#v421-cinematic-film-pro'));
  nodes.forEach(x=>x.classList.add('v29-word-zoom'));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){nodes.forEach(x=>x.classList.add('is-in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.13,rootMargin:'0px 0px -8% 0px'});
  nodes.forEach(x=>io.observe(x));
}
function cleanDeadSpace(){document.querySelectorAll('section').forEach(sec=>{if(sec.hidden)return;const meaningful=sec.querySelector('img,video,form,article,h1,h2,h3,p,button,a,input,textarea,select');if(!meaningful&&!sec.id)sec.style.display='none';});}
function cinematicAdminHidden(){try{return window.NSV421Store?.load?.()?.sections?.find?.(s=>s.id==='cinematic')?.visible===false;}catch(_e){return false;}}
function restoreCurrentCinematic(){
  const current=document.getElementById('scroll-cinema');
  if(current){
    const adminHidden=cinematicAdminHidden();
    current.hidden=adminHidden;
    if(adminHidden)current.setAttribute('aria-hidden','true');else current.removeAttribute('aria-hidden');
    /* Clear only the retired professional runtime's inline suppression. V32/Admin remains the
       authority for section visibility and ordering. */
    ['height','min-height','margin','padding','overflow'].forEach(prop=>current.style.removeProperty(prop));
    if(!adminHidden)current.style.removeProperty('display');
    current.dataset.nsCinematicRuntime='v20-current';
  }
  const retired=document.getElementById('v421-cinematic-film-pro');if(retired)retired.remove();
  document.getElementById('v421-cinematic-pro-style')?.remove();
  document.querySelector('link[data-cinematic-pro-style]')?.remove();
  document.querySelector('script[data-cinematic="v421-professional"]')?.remove();
  window.__NS_V421_PRO_CINE_LOADER__=false;
}
function loadFinalPolish(){
  if(document.querySelector('script[data-ns-final-polish]'))return;
  const p=document.createElement('script');p.src='assets/js/v421-storefront-final-polish.js?v=20260912-current-cinematic';p.async=false;p.dataset.nsFinalPolish='1';document.head.appendChild(p);
}
function init(){
  setTimeout(()=>{restoreCurrentCinematic();loadFinalPolish();try{zoomWords();}catch(e){console.warn('[NS] zoomWords skipped',e);}try{cleanDeadSpace();}catch(e){console.warn('[NS] cleanDeadSpace skipped',e);}},80);
  window.addEventListener('nsv421:change',()=>setTimeout(restoreCurrentCinematic,0));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();