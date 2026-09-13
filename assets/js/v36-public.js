(function(){
  'use strict';

  const DEPLOY_HOST_RE=/^[a-f0-9]{20,}--nariyal-sutra\.netlify\.app$/i;

  function isDeployScoped(url){
    try{return DEPLOY_HOST_RE.test(new URL(url,location.href).hostname);}catch(_){return false;}
  }
  function sameOriginCandidate(url){
    try{const u=new URL(url,location.href);return u.pathname+(u.search||'');}catch(_){return null;}
  }
  function normalizeMediaUrl(el,attr){
    const raw=el.getAttribute(attr)||'';
    if(!raw||!isDeployScoped(raw))return false;
    const local=sameOriginCandidate(raw);if(!local)return false;
    el.setAttribute(attr,local);return true;
  }
  function installImageFallback(img){
    if(!img||img.dataset.nsMediaGuard==='1')return;
    img.dataset.nsMediaGuard='1';
    const original=img.currentSrc||img.getAttribute('src')||'';
    if(original)img.dataset.nsOriginalSrc=original;
    normalizeMediaUrl(img,'src');
    if(img.hasAttribute('srcset')){
      const rewritten=(img.getAttribute('srcset')||'').split(',').map(part=>{
        const bits=part.trim().split(/\s+/);
        if(bits[0]&&isDeployScoped(bits[0])){const local=sameOriginCandidate(bits[0]);if(local)bits[0]=local;}
        return bits.join(' ');
      }).join(', ');
      img.setAttribute('srcset',rewritten);
    }
    let retriedLocal=false;
    const recover=()=>{
      const current=img.currentSrc||img.getAttribute('src')||'';
      if(!retriedLocal&&isDeployScoped(current)){
        retriedLocal=true;
        const local=sameOriginCandidate(current);
        if(local&&local!==current){img.src=local;return;}
      }
      img.classList.add('ns-media-failed');
      img.dataset.nsMediaFailure='unrecovered';
    };
    img.addEventListener('error',recover);
    if(img.complete&&img.naturalWidth===0)setTimeout(recover,0);
  }
  function installVideoFallback(video){
    if(!video||video.dataset.nsMediaGuard==='1')return;
    video.dataset.nsMediaGuard='1';
    normalizeMediaUrl(video,'poster');
    video.querySelectorAll('source').forEach(s=>normalizeMediaUrl(s,'src'));
    const fallback=()=>{
      video.classList.add('ns-video-failed');
      video.dataset.nsMediaFailure='unrecovered';
      try{video.pause?.();}catch(_){ }
    };
    video.addEventListener('error',fallback,{once:true});
    video.querySelectorAll('source').forEach(s=>s.addEventListener('error',fallback,{once:true}));
    if(video.error)setTimeout(fallback,0);
  }
  function guardMedia(root=document){
    if(root.matches?.('img'))installImageFallback(root);
    if(root.matches?.('video'))installVideoFallback(root);
    root.querySelectorAll?.('img').forEach(installImageFallback);
    root.querySelectorAll?.('video').forEach(installVideoFallback);
  }

  function installExperienceCorrections(){
    if(document.getElementById('ns-v421-user-corrections'))return;
    const style=document.createElement('style');
    style.id='ns-v421-user-corrections';
    style.textContent=`
      #jungle-intro:not(.ji-done),#jungle-intro.ns-intro-active{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#031003!important}
      #jungle-intro.ji-done:not(.ns-intro-active){display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #jungle-intro:not(.ji-done)::before,#jungle-intro.ns-intro-active::before{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(2,8,1,.16),rgba(2,8,1,.34) 58%,rgba(2,8,1,.78)),url('/assets/images/nariyal-coconut-grove.webp') center 46%/cover no-repeat;transform:scale(1.015);animation:nsIntroFocus 3.6s cubic-bezier(.2,.75,.2,1) both}
      @keyframes nsIntroFocus{from{transform:scale(1.075);filter:brightness(.66)}to{transform:scale(1.015);filter:brightness(.9)}}
      #jungle-intro .ji-sky,#jungle-intro #starCanvas,#jungle-intro .ji-moon,#jungle-intro .ji-mist,#jungle-intro .ji-layer,#jungle-intro #fireflies{display:none!important}
      #jungle-intro .ji-cinematic-wash{display:block!important;opacity:.42!important}
      #jungle-intro .ji-title-wrap{display:block!important;visibility:visible!important;opacity:1!important;z-index:8!important}
      #jungle-intro .ji-logo,#jungle-intro .ji-eyebrow,#jungle-intro .ji-tagline{visibility:visible!important;opacity:1!important}
      #ji-skip{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:9999!important}
      #jungle-intro.ji-done:not(.ns-intro-active) + #ji-skip,#jungle-intro.ji-done:not(.ns-intro-active)~#ji-skip{display:none!important}
      .hero-visual{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.52)),url('/assets/images/nariyal-premium-hero.webp')!important}
      [data-product-card='tender'] .pc-img-wrap{background-image:url('/assets/images/nariyal-product-collection.webp')!important}
      [data-product-card='green'] .pc-img-wrap{background-image:url('/assets/images/green-round-coconut.jpg')!important}
      [data-product-card='bulk'] .pc-img-wrap{background-image:url('/assets/images/bulk-coconut-pack.jpg')!important}
      #harvest-film .film-frame{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.45)),url('/assets/images/harvest-wall-organic.jpg')!important}
      .water-window{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.38)),url('/assets/images/freshness-coconut-splash.webp')!important}
      #live-motion{background-image:linear-gradient(145deg,rgba(5,18,4,.14),rgba(2,8,1,.55)),url('/assets/images/nariyal-hospitality.webp')!important;background-size:cover!important;background-position:center!important}
      @media(min-width:981px){
        #v20-story-film .v421-local-knife{width:clamp(210px,20vw,320px)!important;height:44px!important}
        #v20-story-film .v421-local-knife .blade{height:24px!important}
        #v20-story-film .v421-local-knife .handle{height:34px!important}
        #v20-story-film .v421-water-finish img{filter:saturate(1.08) contrast(1.05) brightness(.86)!important}
      }
      @media(max-width:980px){
        #jungle-intro:not(.ji-done)::before,#jungle-intro.ns-intro-active::before{background-position:60% center;animation-duration:3.2s}
        #jungle-intro .ji-title-wrap{width:calc(100% - 36px)!important;left:18px!important;right:auto!important;top:auto!important;bottom:14%!important;transform:none!important;text-align:left!important}
      }
    `;
    document.head.appendChild(style);
  }

  function restoreIntro(){
    const intro=document.getElementById('jungle-intro');
    const skip=document.getElementById('ji-skip');
    const main=document.getElementById('main-site');
    if(!intro||!main)return;
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clearLegacyInline=el=>{
      if(!el)return;
      ['display','visibility','opacity','pointer-events'].forEach(p=>{if(el.style.getPropertyValue(p))el.style.removeProperty(p);});
      if(el.hasAttribute('aria-hidden'))el.removeAttribute('aria-hidden');
    };
    const keepIntroVisible=()=>{
      if(!intro.classList.contains('ns-intro-active'))intro.classList.add('ns-intro-active');
      if(intro.classList.contains('ji-done'))intro.classList.remove('ji-done');
      clearLegacyInline(intro);
      clearLegacyInline(skip);
    };
    clearLegacyInline(intro);
    clearLegacyInline(skip);
    const sync=()=>{
      const deadline=Number(intro.dataset.nsIntroReadyAt||Infinity);
      const userSkip=intro.dataset.nsIntroUserSkip==='1';
      const hold=!reduced&&!userSkip&&intro.dataset.nsIntroDeadline!=='complete'&&performance.now()<deadline;
      if(hold){
        keepIntroVisible();
        main.classList.remove('visible');
        main.style.setProperty('opacity','0','important');
        main.style.setProperty('visibility','visible','important');
        main.style.setProperty('pointer-events','none','important');
        document.body?.classList.remove('v30-intro-done');
        return;
      }
      intro.classList.remove('ns-intro-active');
      const done=intro.classList.contains('ji-done')||userSkip||intro.dataset.nsIntroDeadline==='complete'||reduced;
      if(done){
        if(!intro.classList.contains('ji-done'))intro.classList.add('ji-done');
        main.classList.add('visible');
        main.style.setProperty('opacity','1','important');
        main.style.setProperty('visibility','visible','important');
        main.style.setProperty('pointer-events','auto','important');
        main.style.removeProperty('transition');
        document.body?.classList.add('v30-intro-done');
        document.body?.style.removeProperty('overflow');
        document.body?.style.removeProperty('height');
        requestAnimationFrame(enforceCinematicViewport);
      }else{
        keepIntroVisible();
      }
    };
    if(intro.dataset.nsIntroRestore!=='1'){
      intro.dataset.nsIntroRestore='1';
      const observer=new MutationObserver(sync);
      observer.observe(intro,{attributes:true,attributeFilter:['class']});
      const introGuard=setInterval(()=>{
        const deadline=Number(intro.dataset.nsIntroReadyAt||Infinity);
        const holding=!reduced&&intro.dataset.nsIntroUserSkip!=='1'&&intro.dataset.nsIntroDeadline!=='complete'&&performance.now()<deadline;
        if(holding)sync();else clearInterval(introGuard);
      },80);
      skip?.addEventListener('click',()=>{
        intro.dataset.nsIntroUserSkip='1';
        intro.dataset.nsIntroDeadline='complete';
        clearInterval(introGuard);
        intro.classList.remove('ns-intro-active');
        queueMicrotask(sync);
      },{capture:true});
      const armCompletion=()=>{
        if(intro.dataset.nsIntroDeadline==='armed'||intro.dataset.nsIntroDeadline==='complete')return;
        intro.dataset.nsIntroDeadline='armed';
        requestAnimationFrame(()=>{
          const duration=reduced?120:3800;
          intro.dataset.nsIntroReadyAt=String(performance.now()+duration);
          keepIntroVisible();
          setTimeout(()=>{
            if(intro.dataset.nsIntroUserSkip==='1')return;
            intro.dataset.nsIntroDeadline='complete';
            clearInterval(introGuard);
            intro.classList.remove('ns-intro-active');
            if(!intro.classList.contains('ji-done'))intro.classList.add('ji-done');
            sync();
          },duration);
        });
      };
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',armCompletion,{once:true});
      else armCompletion();
    }
    sync();
  }

  function enforceCinematicRunway(){
    const film=document.getElementById('v20-story-film');
    if(!film)return;
    film.dataset.v36FastHarvest='0';
    if(innerWidth>980){
      film.dataset.desktopRunway='390vh';
      film.style.setProperty('display','block','important');
      film.style.setProperty('position','relative','important');
      film.style.setProperty('height','390vh','important');
      film.style.setProperty('min-height','390vh','important');
    }else{
      film.dataset.desktopRunway='touch-disabled';
      film.style.removeProperty('height');
      film.style.removeProperty('min-height');
    }
  }

  /* V36 owns only the structural desktop viewport contract. The authoritative
     V42.1 foreground choreography is created and animated by v421-visual-recovery.js. */
  function enforceCinematicViewport(){
    const film=document.getElementById('v20-story-film');
    if(!film||innerWidth<=980)return;
    const stage=film.querySelector('.v20-story-sticky');
    if(!stage)return;
    const rect=film.getBoundingClientRect();
    const active=rect.top<=0&&rect.bottom>=innerHeight;
    stage.style.setProperty('left','0','important');
    stage.style.setProperty('right','0','important');
    stage.style.setProperty('height','100vh','important');
    stage.style.setProperty('min-height','680px','important');
    stage.style.setProperty('overflow','hidden','important');
    stage.style.setProperty('isolation','isolate','important');
    stage.style.setProperty('transform','none','important');
    if(active){
      stage.style.setProperty('position','fixed','important');
      stage.style.setProperty('top','0','important');
      stage.style.setProperty('bottom','auto','important');
      stage.style.setProperty('width','100vw','important');
      film.dataset.nsViewportState='active';
    }else{
      stage.style.setProperty('position','absolute','important');
      stage.style.setProperty('width','100%','important');
      if(rect.top>0){
        stage.style.setProperty('top','0','important');
        stage.style.setProperty('bottom','auto','important');
        film.dataset.nsViewportState='before';
      }else{
        stage.style.setProperty('top','auto','important');
        stage.style.setProperty('bottom','0','important');
        film.dataset.nsViewportState='after';
      }
    }
    film.dataset.nsLayerContract='v421-visual-recovery';
    film.dataset.nsViewportContract='v36-fixed-stage';
  }

  function ensureCinematicOwner(){
    if(window.__NS_V421_VISUAL_RECOVERY__||document.getElementById('ns-v421-visual-recovery-runtime'))return;
    const script=document.createElement('script');
    script.id='ns-v421-visual-recovery-runtime';
    script.src='assets/js/v421-visual-recovery.js';
    script.async=false;
    script.onload=()=>{enforceCinematicRunway();enforceCinematicViewport();};
    document.head.appendChild(script);
  }

  function assignDistinctProductImages(){
    const map={
      tender:'/assets/images/nariyal-product-collection.webp',
      green:'/assets/images/green-round-coconut.jpg',
      bulk:'/assets/images/bulk-coconut-pack.jpg'
    };
    Object.entries(map).forEach(([key,src])=>{
      const img=document.querySelector(`[data-product-card="${key}"] .pc-img-wrap img`);
      if(!img)return;
      img.src=src;
      img.removeAttribute('srcset');
      img.dataset.nsProductAsset=key;
    });
  }

  function validatePeopleRail(){
    const rail=document.getElementById('nsPeopleMarquee');if(!rail)return;
    const imgs=[...rail.querySelectorAll('img')].filter(img=>{const s=getComputedStyle(img),r=img.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2;});
    if(!imgs.length)return;
    const healthy=imgs.filter(img=>img.complete&&img.naturalWidth>0);
    rail.dataset.nsPeopleRailState=healthy.length?'ready':'awaiting-approved-homepage-media';
  }

  function stabilize(){
    restoreIntro();
    enforceCinematicRunway();
    enforceCinematicViewport();
    assignDistinctProductImages();
    guardMedia();
  }

  document.documentElement.classList.add('ns-runtime-stabilized');
  installExperienceCorrections();
  ensureCinematicOwner();
  stabilize();

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stabilize,{once:true});
  [0,120,450,1000,2200].forEach(ms=>setTimeout(stabilize,ms));
  let cinematicViewportRaf=0;
  const requestCinematicViewport=()=>{if(cinematicViewportRaf||innerWidth<=980)return;cinematicViewportRaf=requestAnimationFrame(()=>{cinematicViewportRaf=0;enforceCinematicViewport();});};
  addEventListener('scroll',requestCinematicViewport,{passive:true});
  addEventListener('resize',()=>{clearTimeout(enforceCinematicRunway.t);enforceCinematicRunway.t=setTimeout(()=>{enforceCinematicRunway();enforceCinematicViewport();},80);},{passive:true});

  const mo=new MutationObserver(records=>{
    let peopleChanged=false,introTouched=false,filmTouched=false;
    for(const r of records){
      for(const n of r.addedNodes){
        if(n.nodeType!==1)continue;
        guardMedia(n);
        if(n.id==='jungle-intro'||n.id==='ji-skip'||n.id==='main-site'||n.querySelector?.('#jungle-intro,#ji-skip,#main-site'))introTouched=true;
        if(n.id==='v20-story-film'||n.classList?.contains('v20-story-sticky')||n.querySelector?.('#v20-story-film,.v20-story-sticky'))filmTouched=true;
        if(n.closest?.('#nsPeopleMarquee')||n.querySelector?.('#nsPeopleMarquee,.ns-face-rows'))peopleChanged=true;
      }
    }
    if(introTouched)setTimeout(restoreIntro,0);
    if(filmTouched)setTimeout(()=>{enforceCinematicRunway();enforceCinematicViewport();},0);
    if(peopleChanged)setTimeout(validatePeopleRail,120);
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});

  setTimeout(validatePeopleRail,900);
  setTimeout(validatePeopleRail,2400);

  const sticky=document.querySelector('.sticky-bar');
  if(sticky){
    document.addEventListener('focusin',e=>{if(innerWidth<=768&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))sticky.classList.add('is-hidden');});
    document.addEventListener('focusout',()=>setTimeout(()=>sticky.classList.remove('is-hidden'),120));
  }

  window.NS_V421_STABILIZATION={
    build:'2026-09-13-bounded-intro-guard',
    guardedMedia:document.querySelectorAll('img,video').length,
    introDisabled:false,
    introDurationMs:3800,
    introAsset:'/assets/images/nariyal-coconut-grove.webp',
    homepageHeroAsset:'/assets/images/nariyal-premium-hero.webp',
    desktopRunway:'390vh',
    cinematicLayerContract:'v421-visual-recovery',
    cinematicViewportContract:'v36-fixed-stage',
    viewport:{w:innerWidth,h:innerHeight}
  };
})();