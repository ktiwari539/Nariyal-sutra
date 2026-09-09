(function(){
  'use strict';

  const film=document.getElementById('v20-story-film');
  if(film){
    film.dataset.v36FastHarvest='1';
    film.dataset.desktopRunway='185vh';
  }

  const SAFE_IMAGE='/assets/images/nariyal-coconut-grove.webp';
  const SAFE_IMAGE_ALT='/assets/images/harvest-wall-organic.jpg';
  const DEPLOY_HOST_RE=/^[a-f0-9]{20,}--nariyal-sutra\.netlify\.app$/i;

  function isDeployScoped(url){
    try{return DEPLOY_HOST_RE.test(new URL(url,location.href).hostname);}catch(_){return false;}
  }

  function sameOriginCandidate(url){
    try{
      const u=new URL(url,location.href);
      return u.pathname+(u.search||'');
    }catch(_){return null;}
  }

  function installImageFallback(img){
    if(!img || img.dataset.nsMediaGuard==='1')return;
    img.dataset.nsMediaGuard='1';
    const original=img.currentSrc||img.getAttribute('src')||'';
    if(original)img.dataset.nsOriginalSrc=original;
    let stage=0;
    img.addEventListener('error',function(){
      const current=img.currentSrc||img.getAttribute('src')||'';
      if(stage===0 && isDeployScoped(current)){
        stage=1;
        const local=sameOriginCandidate(current);
        if(local && local!==current){img.src=local;return;}
      }
      if(stage<=1){
        stage=2;
        if(current!==SAFE_IMAGE){img.src=SAFE_IMAGE;return;}
      }
      if(stage===2){
        stage=3;
        if(current!==SAFE_IMAGE_ALT){img.src=SAFE_IMAGE_ALT;return;}
      }
      img.classList.add('ns-media-failed');
      img.removeAttribute('src');
    });
  }

  function installVideoFallback(video){
    if(!video || video.dataset.nsMediaGuard==='1')return;
    video.dataset.nsMediaGuard='1';
    const fallback=()=>{
      video.classList.add('ns-video-failed');
      video.pause?.();
      video.hidden=true;
      const card=video.closest('.msr-card,.film-frame,.sp-video,.water-window');
      if(card){
        const poster=card.querySelector('.msr-video-poster,img');
        if(poster){poster.style.display='block';poster.hidden=false;installImageFallback(poster);}
        card.classList.add('ns-video-fallback-active');
      }
    };
    video.addEventListener('error',fallback,{once:true});
    video.querySelectorAll('source').forEach(s=>s.addEventListener('error',fallback,{once:true}));
  }

  function guardMedia(root=document){
    root.querySelectorAll('img').forEach(installImageFallback);
    root.querySelectorAll('video').forEach(installVideoFallback);
  }

  document.documentElement.classList.add('ns-runtime-stabilized');
  guardMedia();

  const mo=new MutationObserver(records=>{
    for(const r of records){
      for(const n of r.addedNodes){
        if(n.nodeType!==1)continue;
        if(n.matches?.('img'))installImageFallback(n);
        if(n.matches?.('video'))installVideoFallback(n);
        guardMedia(n);
      }
    }
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});

  function releaseMainSite(){
    if(innerWidth>980)return;
    const intro=document.getElementById('jungle-intro');
    const main=document.getElementById('main-site');
    if(!main)return;
    const introVisible=intro && getComputedStyle(intro).display!=='none' && !intro.hidden;
    if(!introVisible)return;
    document.body.classList.remove('ns-intro-mobile');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('height');
    main.style.setProperty('opacity','1','important');
    main.style.setProperty('pointer-events','auto','important');
    if(intro){intro.style.setProperty('display','none','important');}
  }
  setTimeout(releaseMainSite,4600);
  window.addEventListener('pageshow',e=>{if(e.persisted)setTimeout(releaseMainSite,80);});

  const sticky=document.querySelector('.sticky-bar');
  if(sticky){
    document.addEventListener('focusin',e=>{
      if(innerWidth<=768 && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))sticky.classList.add('is-hidden');
    });
    document.addEventListener('focusout',()=>{setTimeout(()=>sticky.classList.remove('is-hidden'),120);});
  }

  window.NS_V421_STABILIZATION={
    build:'2026-09-09-live-stabilization',
    guardedMedia:document.querySelectorAll('img,video').length,
    viewport:{w:innerWidth,h:innerHeight}
  };
})();
