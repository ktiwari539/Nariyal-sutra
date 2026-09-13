(function(){
'use strict';
/* V42.1 stabilization: #scroll-cinema / #v20-story-film remains the single supported
   homepage cinematic owner. The retired professional runtime stays dormant. */
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
function refineVisualRecovery(){
  if(!document.getElementById('ns-v421-gold-flow-refine')){
    const style=document.createElement('style');
    style.id='ns-v421-gold-flow-refine';
    style.textContent=`
      @media(min-width:769px){
        /* Keep the grove readable: a restrained fall, then one hero coconut. */
        #v20-story-film .v421-rain-item:nth-child(n+11),
        #v20-story-film .v421-rain-item.is-cluster{display:none!important}
        #v20-story-film .v421-rain-item{max-width:72px!important;max-height:86px!important;filter:drop-shadow(0 12px 20px rgba(0,0,0,.34))!important}
        #v20-story-film .v421-product-stage{width:clamp(190px,20vw,286px)!important;aspect-ratio:1/1.18!important}
        #v20-story-film .v421-product-stage .v421-fruit-photo{object-fit:contain!important;object-position:center!important;clip-path:none!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;filter:drop-shadow(0 28px 44px rgba(0,0,0,.48)) saturate(1.02) contrast(1.03) brightness(.96)!important}
        #v20-story-film .v421-product-stage::after{display:none!important}
      }
    `;
    document.head.appendChild(style);
  }
  const film=document.getElementById('v20-story-film');
  const hero=film?.querySelector('.v421-product-stage .v421-fruit-photo');
  if(hero&&hero.dataset.nsGoldHero!=='1'){
    hero.dataset.nsGoldHero='1';
    hero.src='/assets/images/story-coconut-hero.png';
  }
  if(film){
    film.dataset.nsVisualDirection='gold-master-single-fruit';
    film.dataset.nsVisibleRainCap='10';
  }
}
function loadFinalPolish(){
  if(document.querySelector('script[data-ns-final-polish]'))return;
  const p=document.createElement('script');p.src='assets/js/v421-storefront-final-polish.js?v=20260912-current-cinematic';p.async=false;p.dataset.nsFinalPolish='1';document.head.appendChild(p);
}
function init(){
  setTimeout(()=>{restoreCurrentCinematic();loadFinalPolish();try{zoomWords();}catch(e){console.warn('[NS] zoomWords skipped',e);}try{cleanDeadSpace();}catch(e){console.warn('[NS] cleanDeadSpace skipped',e);}},80);
  [260,520,900,1500].forEach(ms=>setTimeout(refineVisualRecovery,ms));
  window.addEventListener('nsv421:change',()=>setTimeout(()=>{restoreCurrentCinematic();refineVisualRecovery();},0));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();