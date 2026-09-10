/* V42.1 compact cinematic runway.
   Keeps the full 100-coconut -> one -> cut -> splash -> water story without
   forcing customers through a long scroll section.

   This layer deliberately applies the final runway with an inline !important
   style after the other cinematic scripts have initialized, so script download
   order cannot accidentally restore the old long 300/500vh runway.
*/
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
    if(!el||innerWidth<769)return;
    el.style.setProperty('height','235vh','important');
    el.style.setProperty('min-height','235vh','important');
  }

  /* With the shorter runway the water finish needs to arrive before the film is
     close to handing off to the next section. This keeps it visible on laptops
     and prevents customers from needing extra scrolling just to see the payoff. */
  function applyCompactTimeline(){
    const el=film();
    if(!el||innerWidth<769)return;
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
    /* Re-apply after dynamic cinematic scripts have had time to initialize. */
    setTimeout(update,700);setTimeout(update,1400);
    addEventListener('scroll',request,{passive:true});
    addEventListener('resize',request,{passive:true});
    window.NSV421CinematicCompact={heightVh:235,waterStart:.745,version:'compact-235vh'};
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
