(function(){
  'use strict';

  const film=document.getElementById('v20-story-film');
  if(film){
    film.dataset.v36FastHarvest='0';
    film.dataset.desktopRunway='360vh';
  }

  const SAFE_IMAGE='/assets/images/nariyal-coconut-grove.webp';
  const SAFE_IMAGE_ALT='/assets/images/harvest-wall-organic.jpg';
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
    let stage=0;
    const recover=()=>{
      const current=img.currentSrc||img.getAttribute('src')||'';
      if(stage===0 && isDeployScoped(current)){stage=1;const local=sameOriginCandidate(current);if(local&&local!==current){img.src=local;return;}}
      if(stage<=1){stage=2;if(current!==SAFE_IMAGE){img.src=SAFE_IMAGE;return;}}
      if(stage===2){stage=3;if(current!==SAFE_IMAGE_ALT){img.src=SAFE_IMAGE_ALT;return;}}
      img.classList.add('ns-media-failed');img.removeAttribute('src');
    };
    img.addEventListener('error',recover);
    if(img.complete && img.naturalWidth===0)setTimeout(recover,0);
  }
  function installVideoFallback(video){
    if(!video || video.dataset.nsMediaGuard==='1')return;
    video.dataset.nsMediaGuard='1';normalizeMediaUrl(video,'poster');
    video.querySelectorAll('source').forEach(s=>normalizeMediaUrl(s,'src'));
    const fallback=()=>{
      video.classList.add('ns-video-failed');video.pause?.();video.hidden=true;
      const card=video.closest('.msr-card,.film-frame,.sp-video,.water-window,.motion-fold-media,.motion-fold-stage')||video.parentElement;
      if(card){
        card.classList.add('ns-video-fallback-active');
        card.style.setProperty('background-image',"linear-gradient(145deg,rgba(3,12,2,.12),rgba(2,8,1,.45)),url('/assets/images/freshness-coconut-splash.webp')",'important');
        card.style.setProperty('background-size','cover','important');
        card.style.setProperty('background-position','center','important');
      }
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
    const normalized=imgs.map(img=>{try{return new URL(img.currentSrc||img.src,location.href).pathname;}catch(_){return img.currentSrc||img.src||'';}}).filter(Boolean);
    const distinct=new Set(normalized);
    const genericOnly=normalized.length>1&&normalized.every(src=>src.endsWith('/assets/images/nariyal-coconut-grove.webp')||src.endsWith('/assets/images/harvest-wall-organic.jpg'));
    if(genericOnly||(normalized.length>=4&&distinct.size===1)){rail.hidden=true;rail.style.setProperty('display','none','important');rail.dataset.nsPeopleRailState='awaiting-approved-homepage-media';}
  }

  function installExperienceCorrections(){
    if(document.getElementById('ns-v421-user-corrections'))return;
    const style=document.createElement('style');
    style.id='ns-v421-user-corrections';
    style.textContent=`
      /* Branded photographic opening: keep the title, remove the rejected cartoon layers. */
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

      /* One deliberate image per merchandising context — no repeated grove fallback wall. */
      .hero-visual{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.52)),url('/assets/images/nariyal-premium-hero.webp')!important}
      [data-product-card='tender'] .pc-img-wrap{background-image:url('/assets/images/nariyal-product-collection.webp')!important}
      [data-product-card='green'] .pc-img-wrap{background-image:url('/assets/images/green-round-coconut.jpg')!important}
      [data-product-card='bulk'] .pc-img-wrap{background-image:url('/assets/images/bulk-coconut-pack.jpg')!important}
      #harvest-film .film-frame{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.45)),url('/assets/images/harvest-wall-organic.jpg')!important}
      .water-window{background-image:linear-gradient(145deg,rgba(5,18,4,.08),rgba(2,8,1,.38)),url('/assets/images/freshness-coconut-splash.webp')!important}
      #live-motion{background-image:linear-gradient(145deg,rgba(5,18,4,.14),rgba(2,8,1,.55)),url('/assets/images/nariyal-hospitality.webp')!important;background-size:cover!important;background-position:center!important}

      /* Give the source-to-cut film enough physical scroll distance to read as a film. */
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
    intro.removeAttribute('aria-hidden');
    intro.style.removeProperty('display');intro.style.removeProperty('visibility');intro.style.removeProperty('opacity');intro.style.removeProperty('pointer-events');
    skip?.removeAttribute('aria-hidden');skip?.style.removeProperty('display');skip?.style.removeProperty('pointer-events');
    const sync=()=>{
      const done=intro.classList.contains('ji-done');
      if(done){main.style.setProperty('opacity','1','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('pointer-events','auto','important');document.body.style.removeProperty('overflow');document.body.style.removeProperty('height');}
      else{main.style.setProperty('opacity','0','important');main.style.setProperty('visibility','visible','important');main.style.setProperty('pointer-events','none','important');}
    };
    sync();new MutationObserver(sync).observe(intro,{attributes:true,attributeFilter:['class']});
    setTimeout(()=>{if(!intro.classList.contains('ji-done')){intro.classList.add('ji-done');sync();}},4200);
  }

  function assignDistinctProductImages(){
    const map={tender:'/assets/images/nariyal-product-collection.webp',green:'/assets/images/green-round-coconut.jpg',bulk:'/assets/images/bulk-coconut-pack.jpg'};
    Object.entries(map).forEach(([key,src])=>{
      const img=document.querySelector(`[data-product-card="${key}"] .pc-img-wrap img`);if(!img)return;
      img.src=src;img.removeAttribute('srcset');img.dataset.nsProductAsset=key;
    });
  }

  function repairLiveMotion(){
    const section=document.getElementById('live-motion');if(!section)return;
    const candidates=[...section.querySelectorAll('video,canvas,.motion-film,.motion-loop,.motion-fold-media,.motion-fold-stage')];
    candidates.forEach(el=>{
      const isVideo=el.tagName==='VIDEO';
      if(isVideo && (!el.currentSrc||el.error)){el.hidden=true;}
      const host=isVideo?el.parentElement:el;if(!host)return;
      host.style.setProperty('background-image',"linear-gradient(145deg,rgba(4,13,3,.12),rgba(2,8,1,.30)),url('/assets/images/freshness-coconut-splash.webp')",'important');
      host.style.setProperty('background-size','cover','important');host.style.setProperty('background-position','center','important');
    });
  }

  document.documentElement.classList.add('ns-runtime-stabilized');
  installExperienceCorrections();guardMedia();assignDistinctProductImages();repairLiveMotion();restoreIntro();

  const mo=new MutationObserver(records=>{let peopleChanged=false;for(const r of records){for(const n of r.addedNodes){if(n.nodeType!==1)continue;guardMedia(n);if(n.closest?.('#nsPeopleMarquee')||n.querySelector?.('#nsPeopleMarquee,.ns-face-rows'))peopleChanged=true;}}if(peopleChanged)setTimeout(validatePeopleRail,180);});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(validatePeopleRail,900);setTimeout(validatePeopleRail,2600);setTimeout(assignDistinctProductImages,450);setTimeout(repairLiveMotion,850);

  const sticky=document.querySelector('.sticky-bar');
  if(sticky){document.addEventListener('focusin',e=>{if(innerWidth<=768&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))sticky.classList.add('is-hidden');});document.addEventListener('focusout',()=>setTimeout(()=>sticky.classList.remove('is-hidden'),120));}

  window.NS_V421_STABILIZATION={build:'2026-09-11-cinematic-admin-correction',guardedMedia:document.querySelectorAll('img,video').length,introDisabled:false,viewport:{w:innerWidth,h:innerHeight}};
})();
