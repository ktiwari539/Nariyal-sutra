/* V42.1 legacy compact cinematic compatibility layer.
   The rebuilt V42.1 cinematic owns its own long-form runway. This file must
   never compress a rebuilt film back to the retired 235vh timeline. */
(function(){
  'use strict';
  if(window.__NS_V421_CINEMATIC_COMPACT__)return;
  window.__NS_V421_CINEMATIC_COMPACT__=true;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};

  function film(){return document.querySelector('#v20-story-film')}
  function progress(el){const r=el.getBoundingClientRect(),range=Math.max(1,el.offsetHeight-innerHeight);return clamp(-r.top/range)}

  function applyRunway(){
    const el=film();
    if(!el)return;

    /* The new cinematic rebuild owns the runway. Explicitly restore its
       intended height because older versions of this compatibility layer may
       already have written a 235vh inline !important style before rebuild. */
    if(el.dataset.rebuilt==='1'){
      const height=innerWidth<=980?'480vh':'620vh';
      el.style.setProperty('height',height,'important');
      el.style.setProperty('min-height',height,'important');
      return;
    }

    if(innerWidth<769)return;
    el.style.setProperty('height','235vh','important');
    el.style.setProperty('min-height','235vh','important');
  }

  function applyCompactTimeline(){
    const el=film();
    if(!el||innerWidth<769||el.dataset.rebuilt==='1')return;
    const p=progress(el);
    const waterIn=smooth((p-.745)/.035);
    const waterOut=1-smooth((p-.91)/.035);
    el.style.setProperty('--wa',(waterIn*waterOut).toFixed(4));
  }

  let raf=0;
  function update(){raf=0;applyRunway();applyCompactTimeline()}
  function request(){if(!raf)raf=requestAnimationFrame(update)}

  function init(){
    applyRunway();applyCompactTimeline();
    setTimeout(update,180);setTimeout(update,700);setTimeout(update,1400);
    addEventListener('scroll',request,{passive:true});
    addEventListener('resize',request,{passive:true});
    window.NSV421CinematicCompact={legacyHeightVh:235,rebuildDesktopVh:620,rebuildTouchVh:480,version:'rebuild-aware'};
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
