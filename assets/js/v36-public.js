(function(){
  'use strict';

  const film=document.getElementById('v20-story-film');
  if(film){
    film.dataset.v36FastHarvest='0';
    film.dataset.desktopRunway='360vh';
  }

  const DEPLOY_HOST_RE=/^[a-f0-9]{20,}--nariyal-sutra\.netlify\.app$/i;

  function isDeployScoped(url){
    try{return DEPLOY_HOST_RE.test(new URL(url,location.href).hostname);}catch(_){return false;}
  }
  function sameOriginCandidate(url){
    try{const u=new URL(url,location.href);return u.pathname+(u.search||'');}catch(_){return null;}
  }
  function normalizeMediaUrl(el,attr){
    const raw=el.getAttribute(attr)||'';
    if(!raw || !isDeployScoped(raw))return false;
    const local=sameOriginCandidate(raw);if(!local)return false;
    el.setAttribute(attr,local);return true;
  }
  function installImageFallback(img){
    if(!img || img.dataset.nsMediaGuard==='1')return;
    img.dataset.nsMediaGuard='1';
    const original=img.currentSrc||img.getAttribute('src')||'';
    if(original)img.dataset.nsOriginalSrc=original;
    normalizeMediaUrl(img,'src');
    if(img.hasAttribute('srcset')){
      const rewritten=(img.getAttribute('srcset')||'').split(',').map(part=>{
        const bits=part.trim().split(/\s+/);
        if(bits[0] && isDeployScoped(bits[0])){const local=sameOriginCandidate(bits[0]);if(local)bits[0]=local;}
        return bits.join(' ');
      }).join(', ');
      img.setAttribute('srcset',rewritten);
    }
    let retriedLocal=false;
    const recover=()=>{
      const current=img.currentSrc||img.getAttribute('src')||'';
      if(!retriedLocal && isDeployScoped(current)){
        retriedLocal=true;
        const local=sameOriginCandidate(current);
        if(local&&local!==current){img.src=local;return;}
      }
      /* Do not repaint unrelated failures with a generic grove. The media-integrity
         runtime owns contextual recovery; if none exists this asset stays failed. */
      img.classList.add('ns-media-failed');
      img.dataset.nsMediaFailure='unrecovered';
    };
    img.addEventListener('error',recover);
    if(img.complete && img.naturalWidth===0)setTimeout(recover,0);
  }
  function installVideoFallback(video){
    if(!video || video.dataset.nsMediaGuard==='1')return;
    video.dataset.nsMediaGuard='1';normalizeMediaUrl(video,'poster');
    video.querySelectorAll('source').forEach(s=>normalizeMediaUrl(s,'src'));
    const fallback=()=>{
      /* No universal coconut-water poster. Page-specific media integrity owns
         product/story recovery so one broken motion asset cannot repaint every page. */
      video.classList.add('ns-video-failed');
      video.dataset.nsMediaFailure='unrecovered';
      try{video.pause?.();}catch(_){ }
    };
    video.addEventListener('error',fallback,{once:true});
    video.querySelectorAll('source').forEach(s=>s.addEventListener('error',fallback,{once:true}));
    if(video.error)setTimeout(fallback,0);
  }
  function guardMedia(root=document){
    if(root.matches?.('img'))installImageFallback(root);if(root.matches?.('video'))installVideoFallback(root);
    root.querySelectorAll?.('img').forEach(installImageFallback);root.querySelectorAll?.('video').forEach(installVideoFallback);
  }
  function validatePeopleRail(){
    const rail=document.getElementById('nsPeopleMarquee');if(!rail)return;
    const imgs=[...rail.querySelectorAll('img')].filter(img=>{const s=getComputedStyle(img),r=img.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>2&&r.height>2;});
    if(!imgs.length)return;
    const healthy=imgs.filter(img=>img.complete&&img.naturalWidth>0);
    if(!healthy.length){rail.dataset.nsPeopleRailState='awaiting-approved-homepage-media';}
  }

  function installExperienceCorrections(){
    if(document.getElementById('ns-v421-user-corrections'))return;
    const style=document.createElement('style');
    style.id='ns-v421-user-corrections';
    style.textContent=`
      #jungle-intro:not(.ji-done){display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#031003!important}
      #jungle-intro.ji-done{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #jungle-intro:not(.ji-done)::before{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(2,8,1,.18),rgba(2,8,1,.38) 58%,rgba(2,8,1,.78)),url('/assets/images/nariyal-premium-hero.webp') center 42%/cover no-repeat;transform:scale(1.015);animation:nsIntroFocus 3.2s cubic-bezier(.2,.75,.2,1) both}
      @keyframes nsIntroFocus{from{transform:scale(1.08);filter:brightness(.68)}to{transform:scale(1.015);filter:brightness(.88)}}
      #jungle-intro .ji-sky,#jungle-intro #starCanvas,#jungle-intro .ji-moon,#jungle-intro .ji-mist,#jungle-intro .ji-layer,#jungle-intro #fireflies{display:none!important}
      #jungle-intro .ji-cinematic-wash{display:block!important;opacity:.42!important}
      #jungle-intro .ji-title-wrap{display:block!important;visibility:visible!important;opacity:1!important;z-index:8!important}
      #jungle-intro .ji-logo,#jungle-intro .ji-eyebrow,#jungle-intro .ji-tagline{visibility:visible!important;opacity:1!important}
      #ji-skip{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:9999!important}
      #jungle-intro.ji-done + #ji-skip,#jungle-intro.ji-done~#ji-skip{display:none!important}

      .hero-visual{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.52)),url('/assets/images/nariyal-premium-hero.webp')!important}
      [data-product-card='tender'] .pc-img-wrap{background-image:url('/assets/images/nariyal-product-collection.webp')!important}
      [data-product-card='green'] .pc-img-wrap{background-image:url('/assets/images/green-round-coconut.jpg')!important}
      [data-product-card='bulk'] .pc-img-wrap{background-image:url('/assets/images/bulk-coconut-pack.jpg')!important}
      #harvest-film .film-frame{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.45)),url('/assets/images/harvest-wall-organic.jpg')!important}
      .water-window{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.38)),url('/assets/images/freshness-coconut-splash.webp')!important}
      #live-motion{background-image:linear-gradient(145deg,rgba(5,18,4,.14),rgba(2,8,1,.55)),url('/assets/images/nariyal-hospitality.webp')!important;background-size:cover!important;background-position:center!important}

      @media(min-width:981px){
        #v20-story-film{height:360vh!important;min-height:360vh!important}
        #v20-story-film .v421-local-knife{width:clamp(210px,20vw,320px)!important;height:44px!important}
        #v20-story-film .v421-local-knife .blade{height:24px!important}
        #v20-story-film .v421-local-knife .handle{height:34px!important}
        #v20-story-film .v421-water-finish img{filter:saturate(1.08) contrast(1.05) brightness(.86)!important}
      }
      @media(max-width:980px){
        #jungle-intro:not(.ji-done)::before{background-position:62% center;animation-duration:2.5s}
        #jungle-intro .ji-title-wrap{width:calc(100% - 36px)!important;left:18px!important;right:auto!important;top:auto!important;bottom:14%!important;transform:none!important;text-align:left!important}
      }
    `;
    document.head.appendChild(style);
  }

  function restoreIntro(){
    const intro=document.getElementById('jungle-intro'),main=document.getElementById('main-site'),skip=document.getElementById('ji-skip');
    if(!intro||!main)return;
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finished=()=>intro.classList.contains('ji-done')||document.body.classList.contains('v30-intro-done')||intro.style.display==='none';
    const revealMain=()=>{
      if(!intro.classList.contains('ji-done'))intro.classList.add('ji-done');
      document.body.classList.remove('ns-intro-mobile');
      main.classList.add('visible');
      main.style.setProperty('opacity','1','important');
      main.style.setProperty('visibility','visible','important');
      main.style.setProperty('pointer-events','auto','important');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('height');
      if(skip){skip.style.setProperty('display','none','important');skip.style.setProperty('pointer-events','none','important');}
    };
    intro.removeAttribute('aria-hidden');
    if(!finished()){
      intro.style.removeProperty('display');intro.style.removeProperty('visibility');intro.style.removeProperty('opacity');intro.style.removeProperty('pointer-events');
      skip?.removeAttribute('aria-hidden');skip?.style.removeProperty('display');skip?.style.removeProperty('pointer-events');
      if(innerWidth<=980&&!reduced)document.body.classList.add('ns-intro-mobile');
    }
    const sync=()=>{
      if(finished()){revealMain();return;}
      main.style.setProperty('opacity','0','important');
      main.style.setProperty('visibility','visible','important');
      main.style.setProperty('pointer-events','none','important');
    };
    sync();
    new MutationObserver(sync).observe(intro,{attributes:true,attributeFilter:['class','style']});
    new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
    setTimeout(()=>{if(!finished())revealMain();else sync();},4300);
  }

  function assignDistinctProductImages(){
    const map={tender:'/assets/images/nariyal-product-collection.webp',green:'/assets/images/green-round-coconut.jpg',bulk:'/assets/images/bulk-coconut-pack.jpg'};
    Object.entries(map).forEach(([key,src])=>{
      const img=document.querySelector(`[data-product-card="${key}"] .pc-img-wrap img`);if(!img)return;
      img.src=src;img.removeAttribute('srcset');img.dataset.nsProductAsset=key;
    });
  }

  document.documentElement.classList.add('ns-runtime-stabilized');
  installExperienceCorrections();guardMedia();assignDistinctProductImages();restoreIntro();

  const mo=new MutationObserver(records=>{let peopleChanged=false;for(const r of records){for(const n of r.addedNodes){if(n.nodeType!==1)continue;guardMedia(n);if(n.closest?.('#nsPeopleMarquee')||n.querySelector?.('#nsPeopleMarquee,.ns-face-rows'))peopleChanged=true;}}if(peopleChanged)setTimeout(validatePeopleRail,180);});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(validatePeopleRail,900);setTimeout(validatePeopleRail,2600);setTimeout(assignDistinctProductImages,450);

  const sticky=document.querySelector('.sticky-bar');
  if(sticky){document.addEventListener('focusin',e=>{if(innerWidth<=768&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))sticky.classList.add('is-hidden');});document.addEventListener('focusout',()=>setTimeout(()=>sticky.classList.remove('is-hidden'),120));}

  window.NS_V421_STABILIZATION={build:'2026-09-12-mobile-tablet-entry-hardened',guardedMedia:document.querySelectorAll('img,video').length,introDisabled:false,viewport:{w:innerWidth,h:innerHeight}};
})();
