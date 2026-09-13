(function(){
'use strict';
/* Keep the deployed professional cinematic as the visual owner. Later code here is limited to non-cinematic media safety. */
function zoomWords(){
  const nodes=[...document.querySelectorAll('main h1,main h2,section h2,.people-hero-copy h1,.sec-title')]
    .filter((x,i,a)=>a.indexOf(x)===i&&!x.closest('#jungle-intro')&&!x.closest('#v421-cinematic-film-pro'));
  nodes.forEach(x=>x.classList.add('v29-word-zoom'));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){nodes.forEach(x=>x.classList.add('is-in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.13,rootMargin:'0px 0px -8% 0px'});
  nodes.forEach(x=>io.observe(x));
}
function cleanDeadSpace(){document.querySelectorAll('section').forEach(sec=>{if(sec.hidden)return;const meaningful=sec.querySelector('img,video,form,article,h1,h2,h3,p,button,a,input,textarea,select');if(!meaningful&&!sec.id)sec.style.display='none';});}
function applyMediaSafety(){
  const trade=document.querySelector('.trade-route.trade-buy img');
  if(trade&&/ws001-fresh-cut-ocean/.test(trade.currentSrc||trade.getAttribute('src')||'')){
    trade.setAttribute('src','/assets/images/freshness-coconut-splash.webp');
    trade.removeAttribute('srcset');
    trade.alt='Fresh coconut water served after a clean cut';
    trade.dataset.nsLargeMediaSafe='1';
  }
}
function installMediaSafetyGuard(){
  applyMediaSafety();
  const root=document.querySelector('#main-site')||document.body;
  if(!root||root.dataset.nsMediaSafetyGuard==='1')return;
  root.dataset.nsMediaSafetyGuard='1';
  new MutationObserver(muts=>{
    for(const m of muts){
      if(m.type==='attributes'&&m.target?.matches?.('.trade-route.trade-buy img')){applyMediaSafety();return;}
      if(m.type==='childList'&&[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.trade-route.trade-buy img')||n.querySelector?.('.trade-route.trade-buy img')))){applyMediaSafety();return;}
    }
  }).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});
}
function loadFinalPolish(){
  if(document.querySelector('script[data-ns-final-polish]'))return;
  const p=document.createElement('script');
  p.src='assets/js/v421-storefront-final-polish.js?v=20260911-depth-scroll-2';
  p.defer=true;
  p.dataset.nsFinalPolish='1';
  p.onload=()=>{installMediaSafetyGuard();setTimeout(applyMediaSafety,40);setTimeout(applyMediaSafety,700);setTimeout(applyMediaSafety,1800);};
  document.head.appendChild(p);
}
function loadProfessionalCinematic(){
  if(window.__NS_V421_PRO_CINE_LOADER__)return;
  window.__NS_V421_PRO_CINE_LOADER__=true;
  if(!document.querySelector('link[data-cinematic-pro-style]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='assets/css/v421-cinematic-professional.css?v=20260911-depth-scroll-2';
    l.dataset.cinematicProStyle='1';
    document.head.appendChild(l);
  }
  const s=document.createElement('script');
  s.src='assets/js/v421-cinematic-professional.js?v=20260911-professional-3';
  s.defer=true;
  s.dataset.cinematic='v421-professional';
  s.onload=()=>setTimeout(loadFinalPolish,30);
  s.onerror=()=>{window.__NS_V421_PRO_CINE_LOADER__=false;console.error('[NS] professional cinematic failed to load');};
  document.head.appendChild(s);
}
function init(){
  installMediaSafetyGuard();
  setTimeout(()=>{
    loadProfessionalCinematic();
    setTimeout(loadFinalPolish,500);
    setTimeout(applyMediaSafety,1200);
    try{zoomWords();}catch(e){console.warn('[NS] zoomWords skipped',e);}
    try{cleanDeadSpace();}catch(e){console.warn('[NS] cleanDeadSpace skipped',e);}
  },80);
  window.addEventListener('nsv421:change',()=>setTimeout(applyMediaSafety,80));
  window.addEventListener('nsv421:production-ready',()=>setTimeout(applyMediaSafety,80));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
