(function(){
'use strict';
/* Restore the deployed professional cinematic as the visual gold master while
   keeping later functional/Admin runtimes intact. */
function installGoldMasterGuards(){
  if(document.getElementById('ns-gold-master-guards'))return;
  const s=document.createElement('style');
  s.id='ns-gold-master-guards';
  s.textContent=`
    @media(min-width:981px){
      #jungle-intro .ji-title-wrap{left:50%!important;right:auto!important;width:min(86vw,1500px)!important;max-width:86vw!important;transform:translateX(-50%)!important;text-align:center!important;box-sizing:border-box!important;overflow:visible!important}
      #jungle-intro .ji-logo[data-ns-wordmark-stable="1"]{display:flex!important;justify-content:center!important;align-items:baseline!important;gap:.08em!important;width:100%!important;max-width:100%!important;font-size:clamp(72px,8vw,132px)!important;line-height:.9!important;letter-spacing:.02em!important;white-space:nowrap!important;overflow:visible!important}
      #jungle-intro .ji-logo[data-ns-wordmark-stable="1"] .ns-wordmark-line{display:inline!important;position:static!important;width:auto!important;max-width:none!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;clip:auto!important;clip-path:none!important;overflow:visible!important;white-space:nowrap!important;line-height:.9!important}
      #jungle-intro .ji-logo[data-ns-wordmark-stable="1"] .ns-wordmark-sutra{margin-top:0!important}
    }
    #v421-cinematic-film-pro .nspro-focus-ring{display:none!important;opacity:0!important}
    #v421-cinematic-film-pro .nspro-nut,#v421-cinematic-film-pro .nspro-nut img{background:transparent!important}
    .v25-story-stream-foot{display:none!important}
  `;
  document.head.appendChild(s);
}
function zoomWords(){
  const nodes=[...document.querySelectorAll('main h1,main h2,section h2,.people-hero-copy h1,.sec-title')]
    .filter((x,i,a)=>a.indexOf(x)===i&&!x.closest('#jungle-intro')&&!x.closest('#v421-cinematic-film-pro'));
  nodes.forEach(x=>x.classList.add('v29-word-zoom'));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){nodes.forEach(x=>x.classList.add('is-in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.13,rootMargin:'0px 0px -8% 0px'});
  nodes.forEach(x=>io.observe(x));
}
function cleanDeadSpace(){document.querySelectorAll('section').forEach(sec=>{if(sec.hidden)return;const meaningful=sec.querySelector('img,video,form,article,h1,h2,h3,p,button,a,input,textarea,select');if(!meaningful&&!sec.id)sec.style.display='none';});}
function loadFinalPolish(){
  if(document.querySelector('script[data-ns-final-polish]'))return;
  const p=document.createElement('script');
  p.src='assets/js/v421-storefront-final-polish.js?v=20260913-gold-master';
  p.defer=true;
  p.dataset.nsFinalPolish='1';
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
  installGoldMasterGuards();
  setTimeout(()=>{
    loadProfessionalCinematic();
    setTimeout(loadFinalPolish,500);
    try{zoomWords();}catch(e){console.warn('[NS] zoomWords skipped',e);}
    try{cleanDeadSpace();}catch(e){console.warn('[NS] cleanDeadSpace skipped',e);}
  },80);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
