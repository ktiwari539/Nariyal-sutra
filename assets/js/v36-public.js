(function(){
  'use strict';

  const INTRO_MS=3800;
  const MOBILE_INTRO_MS=2400;
  const REDUCED_INTRO_MS=900;
  const DEPLOY_HOST_RE=/^[a-f0-9]{20,}--nariyal-sutra\.netlify\.app$/i;

  function isDeployScoped(url){try{return DEPLOY_HOST_RE.test(new URL(url,location.href).hostname);}catch(_){return false;}}
  function sameOriginCandidate(url){try{const u=new URL(url,location.href);return u.pathname+(u.search||'');}catch(_){return null;}}
  function normalizeMediaUrl(el,attr){const raw=el.getAttribute(attr)||'';if(!raw||!isDeployScoped(raw))return false;const local=sameOriginCandidate(raw);if(!local)return false;el.setAttribute(attr,local);return true;}
  function installImageFallback(img){if(!img||img.dataset.nsMediaGuard==='1')return;img.dataset.nsMediaGuard='1';const original=img.currentSrc||img.getAttribute('src')||'';if(original)img.dataset.nsOriginalSrc=original;normalizeMediaUrl(img,'src');if(img.hasAttribute('srcset'))img.setAttribute('srcset',(img.getAttribute('srcset')||'').split(',').map(part=>{const bits=part.trim().split(/\s+/);if(bits[0]&&isDeployScoped(bits[0])){const local=sameOriginCandidate(bits[0]);if(local)bits[0]=local;}return bits.join(' ');}).join(', '));let retriedLocal=false;const recover=()=>{const current=img.currentSrc||img.getAttribute('src')||'';if(!retriedLocal&&isDeployScoped(current)){retriedLocal=true;const local=sameOriginCandidate(current);if(local&&local!==current){img.src=local;return;}}img.classList.add('ns-media-failed');img.dataset.nsMediaFailure='unrecovered';};img.addEventListener('error',recover);if(img.complete&&img.naturalWidth===0)setTimeout(recover,0);}
  function installVideoFallback(video){if(!video||video.dataset.nsMediaGuard==='1')return;video.dataset.nsMediaGuard='1';normalizeMediaUrl(video,'poster');video.querySelectorAll('source').forEach(s=>normalizeMediaUrl(s,'src'));const fallback=()=>{video.classList.add('ns-video-failed');video.dataset.nsMediaFailure='unrecovered';try{video.pause?.();}catch(_){}};video.addEventListener('error',fallback,{once:true});video.querySelectorAll('source').forEach(s=>s.addEventListener('error',fallback,{once:true}));if(video.error)setTimeout(fallback,0);}
  function guardMedia(root=document){if(root.matches?.('img'))installImageFallback(root);if(root.matches?.('video'))installVideoFallback(root);root.querySelectorAll?.('img').forEach(installImageFallback);root.querySelectorAll?.('video').forEach(installVideoFallback);}

  function installExperienceCorrections(){
    if(document.getElementById('ns-v421-user-corrections'))return;
    const style=document.createElement('style');style.id='ns-v421-user-corrections';style.textContent=`
      body.ns-intro-owned{overflow:hidden!important;height:auto!important}
      #jungle-intro.ns-intro-owned{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#031003!important}
      #jungle-intro.ns-intro-owned::before{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(2,8,1,.16),rgba(2,8,1,.34) 58%,rgba(2,8,1,.78)),url('/assets/images/nariyal-coconut-grove.webp') center 46%/cover no-repeat;transform:scale(1.015);animation:nsIntroFocus 3.6s cubic-bezier(.2,.75,.2,1) both}
      @keyframes nsIntroFocus{from{transform:scale(1.075);filter:brightness(.66)}to{transform:scale(1.015);filter:brightness(.9)}}
      #jungle-intro.ns-intro-owned .ji-sky,#jungle-intro.ns-intro-owned #starCanvas,#jungle-intro.ns-intro-owned .ji-moon,#jungle-intro.ns-intro-owned .ji-mist,#jungle-intro.ns-intro-owned .ji-layer,#jungle-intro.ns-intro-owned #fireflies{display:none!important}
      #jungle-intro.ns-intro-owned .ji-cinematic-wash{display:block!important;opacity:.42!important}
      #jungle-intro.ns-intro-owned .ji-title-wrap{display:block!important;visibility:visible!important;opacity:1!important;z-index:8!important}
      #jungle-intro.ns-intro-owned .ji-logo,#jungle-intro.ns-intro-owned .ji-eyebrow,#jungle-intro.ns-intro-owned .ji-tagline{display:block!important;visibility:visible!important;opacity:1!important}
      body.ns-intro-owned #ji-skip{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:9999!important}
      body.ns-intro-owned #main-site{opacity:0!important;visibility:visible!important;pointer-events:none!important}
      .hero-visual{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.52)),url('/assets/images/nariyal-premium-hero.webp')!important}
      [data-product-card='tender'] .pc-img-wrap{background-image:url('/assets/images/nariyal-product-collection.webp')!important}
      [data-product-card='green'] .pc-img-wrap{background-image:url('/assets/images/green-round-coconut.jpg')!important}
      [data-product-card='bulk'] .pc-img-wrap{background-image:url('/assets/images/brand/coconut-premium.webp')!important}
      #harvest-film .film-frame{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.45)),url('/assets/images/harvest-wall-organic.jpg')!important}
      .water-window{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.38)),url('/assets/images/freshness-coconut-splash.webp')!important}
      #live-motion{background-image:linear-gradient(145deg,rgba(5,18,4,.14),rgba(2,8,1,.55)),url('/assets/images/nariyal-hospitality.webp')!important;background-size:cover!important;background-position:center!important}
      @media(min-width:981px){#v20-story-film .v421-local-knife{width:clamp(210px,20vw,320px)!important;height:44px!important}#v20-story-film .v421-local-knife .blade{height:24px!important}#v20-story-film .v421-local-knife .handle{height:34px!important}#v20-story-film .v421-water-finish img{filter:saturate(1.08) contrast(1.05) brightness(.86)!important}}
      @media(max-width:980px){
        #jungle-intro.ns-intro-owned::before{background-position:60% center;animation-duration:2.15s}
        #jungle-intro.ns-intro-owned .ji-cinematic-wash{display:none!important}
        .orb{display:none!important}
        nav.solid{backdrop-filter:none!important}
        .btn-gold,.nav-cta{animation:none!important}
        .pc:hover,.pc.is-showcased{transform:none!important}
        .pc:hover .pc-img-wrap img{transform:none!important}
        input,select,textarea{font-size:16px!important}
        button,a{touch-action:manipulation}
        #jungle-intro.ns-intro-owned .ji-title-wrap{left:20px!important;right:20px!important;width:auto!important;max-width:none!important;top:auto!important;bottom:14%!important;transform:none!important;text-align:left!important;box-sizing:border-box!important;overflow:visible!important}
        #jungle-intro.ns-intro-owned .ji-eyebrow{font-size:clamp(9px,2.25vw,11px)!important;letter-spacing:clamp(2px,.8vw,5px)!important;line-height:1.5!important;max-width:100%!important;white-space:normal!important}
        #jungle-intro.ns-intro-owned .ji-logo{font-size:clamp(42px,12.5vw,84px)!important;line-height:.9!important;letter-spacing:clamp(3px,1.4vw,8px)!important;width:100%!important;max-width:100%!important;white-space:normal!important;overflow:visible!important}
        #jungle-intro.ns-intro-owned .ji-tagline{font-size:clamp(9px,2.45vw,12px)!important;letter-spacing:clamp(1.5px,.72vw,4px)!important;line-height:1.65!important;max-width:100%!important;white-space:normal!important;margin-top:16px!important}
        #jungle-intro.ns-intro-owned .ji-scroll-hint{justify-content:flex-start!important;gap:10px!important;flex-wrap:wrap!important;margin-top:24px!important;max-width:100%!important}
        #jungle-intro.ns-intro-owned .ji-scroll-hint span{font-size:9px!important;letter-spacing:clamp(1.5px,.6vw,3px)!important;white-space:normal!important}
        #jungle-intro.ns-intro-owned .ji-scroll-line{width:clamp(22px,7vw,40px)!important;flex:0 0 auto!important}
      }
      @media(max-width:430px){
        #jungle-intro.ns-intro-owned .ji-title-wrap{left:18px!important;right:18px!important;bottom:13%!important}
        #jungle-intro.ns-intro-owned .ji-logo{font-size:clamp(40px,12vw,52px)!important;letter-spacing:clamp(2px,1.05vw,4px)!important}
      }
      @media(prefers-reduced-motion:reduce){#jungle-intro.ns-intro-owned::before{animation:none!important;transform:scale(1.015)!important;filter:brightness(.9)!important}}
    `;document.head.appendChild(style);
  }

  function applyIntroComposition(intro){
    if(!intro||innerWidth>980)return;
    const title=intro.querySelector('.ji-title-wrap'),logo=intro.querySelector('.ji-logo'),eyebrow=intro.querySelector('.ji-eyebrow'),tagline=intro.querySelector('.ji-tagline'),hint=intro.querySelector('.ji-scroll-hint');
    if(!title)return;
    const edge=innerWidth<=430?'18px':'20px';
    title.style.setProperty('left',edge,'important');title.style.setProperty('right',edge,'important');title.style.setProperty('width','auto','important');title.style.setProperty('max-width','none','important');title.style.setProperty('top','auto','important');title.style.setProperty('bottom',innerWidth<=430?'13%':'14%','important');title.style.setProperty('transform','none','important');title.style.setProperty('text-align','left','important');title.style.setProperty('box-sizing','border-box','important');
    if(eyebrow){eyebrow.style.setProperty('font-size','clamp(9px,2.25vw,11px)','important');eyebrow.style.setProperty('letter-spacing','clamp(2px,.8vw,5px)','important');eyebrow.style.setProperty('line-height','1.5','important');eyebrow.style.setProperty('max-width','100%','important');eyebrow.style.setProperty('white-space','normal','important');}
    if(logo){logo.style.setProperty('font-size',innerWidth<=430?'clamp(40px,12vw,52px)':'clamp(42px,12.5vw,84px)','important');logo.style.setProperty('letter-spacing',innerWidth<=430?'clamp(2px,1.05vw,4px)':'clamp(3px,1.4vw,8px)','important');logo.style.setProperty('line-height','.9','important');logo.style.setProperty('width','100%','important');logo.style.setProperty('max-width','100%','important');logo.style.setProperty('white-space','normal','important');logo.style.setProperty('overflow','visible','important');}
    if(tagline){tagline.style.setProperty('font-size','clamp(9px,2.45vw,12px)','important');tagline.style.setProperty('letter-spacing','clamp(1.5px,.72vw,4px)','important');tagline.style.setProperty('line-height','1.65','important');tagline.style.setProperty('max-width','100%','important');tagline.style.setProperty('white-space','normal','important');tagline.style.setProperty('margin-top','16px','important');}
    if(hint){hint.style.setProperty('justify-content','flex-start','important');hint.style.setProperty('gap','10px','important');hint.style.setProperty('flex-wrap','wrap','important');hint.style.setProperty('margin-top','24px','important');hint.style.setProperty('max-width','100%','important');}
  }

  const introOwner={started:false,finished:false,timer:0,reduced:false,legacyRetired:false};
  function holdIntro(intro,skip,main){
    if(introOwner.finished)return;
    intro.classList.add('ns-intro-owned');intro.classList.remove('ji-done');intro.dataset.nsIntroDeadline='armed';intro.dataset.nsIntroOwner='v36-single-owner';
    document.body?.classList.add('ns-intro-owned');document.body?.classList.remove('v30-intro-done');
    intro.style.setProperty('display','block','important');intro.style.setProperty('visibility','visible','important');intro.style.setProperty('opacity','1','important');intro.style.setProperty('pointer-events','auto','important');applyIntroComposition(intro);
    if(skip){skip.style.setProperty('display','block','important');skip.style.setProperty('visibility','visible','important');skip.style.setProperty('opacity','1','important');skip.style.setProperty('pointer-events','auto','important');}
    main.classList.remove('visible');main.style.setProperty('opacity','0','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('pointer-events','none','important');
  }
  function releaseScrollAndMain(){const main=document.getElementById('main-site');if(!main)return;['height','overflow'].forEach(p=>document.body?.style.removeProperty(p));document.body?.classList.remove('ns-intro-owned','ns-intro-mobile');document.body?.classList.add('v30-intro-done');main.classList.add('visible');main.style.setProperty('transition','none','important');main.style.setProperty('opacity','1','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('pointer-events','auto','important');}
  function finishIntro(reason){if(introOwner.finished)return;introOwner.finished=true;clearTimeout(introOwner.timer);const intro=document.getElementById('jungle-intro'),skip=document.getElementById('ji-skip');if(!intro)return;intro.dataset.nsIntroDeadline='complete';intro.classList.remove('ns-intro-owned');intro.classList.add('ji-done');intro.style.setProperty('display','none','important');intro.style.setProperty('visibility','hidden','important');intro.style.setProperty('opacity','0','important');intro.style.setProperty('pointer-events','none','important');releaseScrollAndMain();if(skip){skip.style.setProperty('opacity','0','important');skip.style.setProperty('visibility','hidden','important');skip.style.setProperty('pointer-events','none','important');skip.style.setProperty('display','none','important');}requestAnimationFrame(()=>{enforceCinematicRunway();enforceCinematicViewport();});}
  const ownedSkip=()=>finishIntro('skip');
  function neutralizeLegacyIntent(){window.skipIntro=ownedSkip;const swallowIntent=e=>{if(!introOwner.finished)e.stopImmediatePropagation();};addEventListener('wheel',swallowIntent,{capture:true,passive:true});addEventListener('touchmove',swallowIntent,{capture:true,passive:true});addEventListener('keydown',swallowIntent,{capture:true});}
  function retireLegacyIntro(){
    if(introOwner.legacyRetired)return;introOwner.legacyRetired=true;
    const legacySkip=window.skipIntro;
    if(typeof legacySkip==='function'&&legacySkip!==ownedSkip){try{legacySkip();}catch(_){}}
    window.skipIntro=ownedSkip;
    const intro=document.getElementById('jungle-intro'),skip=document.getElementById('ji-skip'),main=document.getElementById('main-site');if(intro&&main&&!introOwner.finished)holdIntro(intro,skip,main);
  }
  function startIntroOwner(){
    if(introOwner.started)return;const intro=document.getElementById('jungle-intro'),skip=document.getElementById('ji-skip'),main=document.getElementById('main-site');if(!intro||!main)return;
    introOwner.started=true;introOwner.reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);neutralizeLegacyIntent();holdIntro(intro,skip,main);
    const duration=introOwner.reduced?REDUCED_INTRO_MS:(innerWidth<=980?MOBILE_INTRO_MS:INTRO_MS);
    introOwner.timer=setTimeout(()=>finishIntro(introOwner.reduced?'reduced':'timer'),duration);
    skip?.addEventListener('click',e=>{if(introOwner.finished)return;e.preventDefault();e.stopImmediatePropagation();finishIntro('skip');},{capture:true});
  }

  function enforceCinematicRunway(){const film=document.getElementById('v20-story-film');if(!film)return;film.dataset.v36FastHarvest='0';if(innerWidth>980){film.dataset.desktopRunway='390vh';film.style.setProperty('display','block','important');film.style.setProperty('position','relative','important');film.style.setProperty('height','390vh','important');film.style.setProperty('min-height','390vh','important');}else{film.dataset.desktopRunway='touch-disabled';film.style.removeProperty('height');film.style.removeProperty('min-height');}}
  function enforceCinematicViewport(){const film=document.getElementById('v20-story-film');if(!film||innerWidth<=980)return;const stage=film.querySelector('.v20-story-sticky');if(!stage)return;const rect=film.getBoundingClientRect(),active=rect.top<=0&&rect.bottom>=innerHeight;stage.style.setProperty('left','0','important');stage.style.setProperty('right','0','important');stage.style.setProperty('height','100vh','important');stage.style.setProperty('min-height','680px','important');stage.style.setProperty('overflow','hidden','important');stage.style.setProperty('isolation','isolate','important');stage.style.setProperty('transform','none','important');if(active){stage.style.setProperty('position','fixed','important');stage.style.setProperty('top','0','important');stage.style.setProperty('bottom','auto','important');stage.style.setProperty('width','100vw','important');film.dataset.nsViewportState='active';}else{stage.style.setProperty('position','absolute','important');stage.style.setProperty('width','100%','important');if(rect.top>0){stage.style.setProperty('top','0','important');stage.style.setProperty('bottom','auto','important');film.dataset.nsViewportState='before';}else{stage.style.setProperty('top','auto','important');stage.style.setProperty('bottom','0','important');film.dataset.nsViewportState='after';}}film.dataset.nsLayerContract='v421-visual-recovery';film.dataset.nsViewportContract='v36-fixed-stage';}
  function ensureCinematicOwner(){if(window.__NS_V421_VISUAL_RECOVERY__||document.getElementById('ns-v421-visual-recovery-runtime'))return;const script=document.createElement('script');script.id='ns-v421-visual-recovery-runtime';script.src='assets/js/v421-visual-recovery.js';script.async=false;script.onload=()=>{enforceCinematicRunway();enforceCinematicViewport();};document.head.appendChild(script);}
  function assignDistinctProductImages(){const map={tender:'/assets/images/nariyal-product-collection.webp',green:'/assets/images/green-round-coconut.jpg',bulk:'/assets/images/brand/coconut-premium.webp'};Object.entries(map).forEach(([key,src])=>{const img=document.querySelector(`[data-product-card="${key}"] .pc-img-wrap img`);if(!img)return;img.src=src;img.removeAttribute('srcset');img.dataset.nsProductAsset=key;});}
  function validatePeopleRail(){const rail=document.getElementById('nsPeopleMarquee');if(!rail)return;const imgs=[...rail.querySelectorAll('img')].filter(img=>{const s=getComputedStyle(img),r=img.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2;});if(!imgs.length)return;rail.dataset.nsPeopleRailState=imgs.some(img=>img.complete&&img.naturalWidth>0)?'ready':'awaiting-approved-homepage-media';}
  function installMobileVideoGovernor(){
    if(innerWidth>980||window.__NS_MOBILE_VIDEO_GOVERNOR__)return;
    window.__NS_MOBILE_VIDEO_GOVERNOR__=true;
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData=!!(navigator.connection&&navigator.connection.saveData);
    const videos=[...document.querySelectorAll('video')];
    videos.forEach(v=>{v.preload='metadata';if(!v.closest('#jungle-intro')){try{v.pause();}catch(_){}}});
    if(reduce||saveData){videos.forEach(v=>{if(!v.closest('#jungle-intro')){v.removeAttribute('autoplay');try{v.pause();}catch(_){}}});return;}
    if(!('IntersectionObserver' in window))return;
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const v=entry.target;if(v.closest('#jungle-intro'))return;
      if(entry.isIntersecting&&entry.intersectionRatio>=.6){v.play?.().catch(()=>{});}
      else{try{v.pause();}catch(_){}}
    }),{threshold:[0,.2,.6,.85],rootMargin:'60px 0px'});
    videos.forEach(v=>io.observe(v));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>{if(!v.closest('#jungle-intro'))try{v.pause();}catch(_){}});});
  }

  function stabilize(){startIntroOwner();enforceCinematicRunway();enforceCinematicViewport();assignDistinctProductImages();guardMedia();installMobileVideoGovernor();}

  document.documentElement.classList.add('ns-runtime-stabilized');installExperienceCorrections();ensureCinematicOwner();stabilize();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{retireLegacyIntro();stabilize();},{once:true});else{retireLegacyIntro();stabilize();}
  [120,450,1000,2200].forEach(ms=>setTimeout(stabilize,ms));
  let cinematicViewportRaf=0;const requestCinematicViewport=()=>{if(cinematicViewportRaf||innerWidth<=980)return;cinematicViewportRaf=requestAnimationFrame(()=>{cinematicViewportRaf=0;enforceCinematicViewport();});};addEventListener('scroll',requestCinematicViewport,{passive:true});addEventListener('resize',()=>{clearTimeout(enforceCinematicRunway.t);enforceCinematicRunway.t=setTimeout(()=>{applyIntroComposition(document.getElementById('jungle-intro'));enforceCinematicRunway();enforceCinematicViewport();},80);},{passive:true});
  const mo=new MutationObserver(records=>{let peopleChanged=false,filmTouched=false;for(const r of records){for(const n of r.addedNodes){if(n.nodeType!==1)continue;guardMedia(n);if(n.id==='v20-story-film'||n.classList?.contains('v20-story-sticky')||n.querySelector?.('#v20-story-film,.v20-story-sticky'))filmTouched=true;if(n.closest?.('#nsPeopleMarquee')||n.querySelector?.('#nsPeopleMarquee,.ns-face-rows'))peopleChanged=true;}}if(filmTouched)setTimeout(()=>{enforceCinematicRunway();enforceCinematicViewport();},0);if(peopleChanged)setTimeout(validatePeopleRail,120);});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(validatePeopleRail,900);setTimeout(validatePeopleRail,2400);
  const sticky=document.querySelector('.sticky-bar');if(sticky){document.addEventListener('focusin',e=>{if(innerWidth<=768&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))sticky.classList.add('is-hidden');});document.addEventListener('focusout',()=>setTimeout(()=>sticky.classList.remove('is-hidden'),120));}
  window.NS_V421_STABILIZATION={build:'2026-09-13-intro-safe-bounds-inline',guardedMedia:document.querySelectorAll('img,video').length,introDisabled:false,introDurationMs:3800,mobileIntroDurationMs:MOBILE_INTRO_MS,reducedIntroDurationMs:REDUCED_INTRO_MS,introOwner:'v36-single-owner',introAsset:'/assets/images/nariyal-coconut-grove.webp',homepageHeroAsset:'/assets/images/nariyal-premium-hero.webp',desktopRunway:'390vh',cinematicLayerContract:'v421-visual-recovery',cinematicViewportContract:'v36-fixed-stage',viewport:{w:innerWidth,h:innerHeight}};
})();