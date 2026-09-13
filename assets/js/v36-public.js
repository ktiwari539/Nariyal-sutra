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
    `;
    document.head.appendChild(style);
  }

  function disableLegacyIntro(){
    const intro=document.getElementById('jungle-intro');
    const skip=document.getElementById('ji-skip');
    const main=document.getElementById('main-site');
    if(intro){
      intro.classList.add('ji-done');
      intro.setAttribute('aria-hidden','true');
      intro.style.setProperty('display','none','important');
      intro.style.setProperty('visibility','hidden','important');
      intro.style.setProperty('opacity','0','important');
      intro.style.setProperty('pointer-events','none','important');
    }
    if(skip){
      skip.setAttribute('aria-hidden','true');
      skip.style.setProperty('display','none','important');
      skip.style.setProperty('visibility','hidden','important');
      skip.style.setProperty('opacity','0','important');
      skip.style.setProperty('pointer-events','none','important');
    }
    if(main){
      main.classList.add('visible');
      main.style.setProperty('opacity','1','important');
      main.style.setProperty('visibility','visible','important');
      main.style.setProperty('pointer-events','auto','important');
      main.style.setProperty('transition','none','important');
    }
    document.body?.classList.remove('ns-intro-mobile');
    document.body?.classList.add('v30-intro-done');
    document.body?.style.removeProperty('height');
    document.body?.style.removeProperty('overflow');
  }

  function enforceCinematicRunway(){
    const film=document.getElementById('v20-story-film');
    if(!film)return;
    film.dataset.v36FastHarvest='0';
    if(innerWidth>980){
      film.dataset.desktopRunway='390vh';
      /* Some deferred legacy runtimes write a shorter inline height after the final CSS.
         The release owner therefore sets the one authoritative desktop runway inline, last. */
      film.style.setProperty('height','390vh','important');
      film.style.setProperty('min-height','390vh','important');
    }else{
      film.dataset.desktopRunway='touch-disabled';
      film.style.removeProperty('height');
      film.style.removeProperty('min-height');
    }
  }

  function setImportant(el,prop,value){if(el)el.style.setProperty(prop,value,'important');}
  function enforceCinematicLayers(){
    const film=document.getElementById('v20-story-film');
    if(!film||innerWidth<=980)return;
    const hero=document.getElementById('v20-story-coconut');
    const knife=film.querySelector('.v20-knife');
    const water=film.querySelector('.v20-water-fill');
    const stream=hero?.querySelector('.water-stream');
    if(hero){
      hero.hidden=false;
      setImportant(hero,'display','block');setImportant(hero,'visibility','visible');setImportant(hero,'position','absolute');
      setImportant(hero,'left','var(--hero-x,58%)');setImportant(hero,'top','var(--hero-y,56vh)');
      setImportant(hero,'width','clamp(320px,23.2vw,430px)');setImportant(hero,'height','clamp(440px,31.9vw,592px)');
      setImportant(hero,'z-index','24');setImportant(hero,'transform','translate(-50%,-50%) rotate(var(--hero-rot,-1.2deg)) scale(var(--hero-scale,.98))');
      setImportant(hero,'opacity','var(--hero-alpha,0)');
      hero.querySelectorAll(':scope > img').forEach(img=>{
        img.hidden=false;setImportant(img,'display','block');setImportant(img,'visibility','visible');setImportant(img,'position','absolute');
        setImportant(img,'inset','0');setImportant(img,'width','100%');setImportant(img,'height','100%');setImportant(img,'object-fit','contain');
      });
    }
    if(knife){
      knife.hidden=false;setImportant(knife,'display','block');setImportant(knife,'visibility','visible');setImportant(knife,'position','absolute');
      setImportant(knife,'left','50%');setImportant(knife,'top','49.6%');setImportant(knife,'width','clamp(310px,40vw,620px)');
      setImportant(knife,'height','clamp(90px,9vw,145px)');setImportant(knife,'z-index','25');
      setImportant(knife,'opacity','var(--knife-alpha,0)');setImportant(knife,'transform','translate3d(calc(-50% + var(--knife-x,-78vw)),calc(var(--knife-y,0)*1px),0) rotate(-9deg)');
    }
    if(stream){
      stream.hidden=false;setImportant(stream,'display','block');setImportant(stream,'visibility','visible');setImportant(stream,'position','absolute');
      setImportant(stream,'left','54.6%');setImportant(stream,'top','52.9%');setImportant(stream,'width','clamp(34px,2.55vw,52px)');
      setImportant(stream,'height','76vh');setImportant(stream,'transform-origin','50% 0');
      setImportant(stream,'transform','translateX(-50%) rotate(var(--stream-counter,0deg)) scaleY(var(--stream-scale,0))');
      setImportant(stream,'opacity','var(--stream-alpha,0)');
    }
    if(water){
      water.hidden=false;setImportant(water,'display','block');setImportant(water,'visibility','visible');setImportant(water,'position','absolute');
      setImportant(water,'left','-10%');setImportant(water,'right','-10%');setImportant(water,'bottom','-12%');setImportant(water,'min-height','0');
      setImportant(water,'height','var(--water-height,0)');setImportant(water,'z-index','30');setImportant(water,'opacity','var(--water-alpha,0)');
    }
    film.dataset.nsLayerContract='v36-authoritative';
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
    disableLegacyIntro();
    enforceCinematicRunway();
    enforceCinematicLayers();
    assignDistinctProductImages();
    guardMedia();
  }

  document.documentElement.classList.add('ns-runtime-stabilized');
  installExperienceCorrections();
  stabilize();

  /* Deferred V21/V23/V25/V27 runtimes execute after this script tag. Re-assert the final
     release contract after DOMContentLoaded and once more after their delayed enrichers. */
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stabilize,{once:true});
  [0,120,450,1000,2200].forEach(ms=>setTimeout(stabilize,ms));
  addEventListener('resize',()=>{clearTimeout(enforceCinematicRunway.t);enforceCinematicRunway.t=setTimeout(()=>{enforceCinematicRunway();enforceCinematicLayers();},80);},{passive:true});
  let cinematicLayerRaf=0;
  addEventListener('scroll',()=>{if(cinematicLayerRaf||innerWidth<=980)return;cinematicLayerRaf=requestAnimationFrame(()=>{cinematicLayerRaf=0;enforceCinematicLayers();});},{passive:true});

  const mo=new MutationObserver(records=>{
    let peopleChanged=false,introTouched=false,filmTouched=false;
    for(const r of records){
      for(const n of r.addedNodes){
        if(n.nodeType!==1)continue;
        guardMedia(n);
        if(n.id==='jungle-intro'||n.id==='ji-skip'||n.id==='main-site'||n.querySelector?.('#jungle-intro,#ji-skip,#main-site'))introTouched=true;
        if(n.id==='v20-story-film'||n.querySelector?.('#v20-story-film'))filmTouched=true;
        if(n.closest?.('#nsPeopleMarquee')||n.querySelector?.('#nsPeopleMarquee,.ns-face-rows'))peopleChanged=true;
      }
    }
    if(introTouched)setTimeout(disableLegacyIntro,0);
    if(filmTouched)setTimeout(()=>{enforceCinematicRunway();enforceCinematicLayers();},0);
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
    build:'2026-09-13-authoritative-cinematic-layer-contract',
    guardedMedia:document.querySelectorAll('img,video').length,
    introDisabled:true,
    desktopRunway:'390vh',
    cinematicLayerContract:'v36-authoritative',
    viewport:{w:innerWidth,h:innerHeight}
  };
})();