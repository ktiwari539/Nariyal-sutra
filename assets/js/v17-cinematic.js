(function(){
'use strict';
if(window.__NS_V17_CINEMATIC__) return;
window.__NS_V17_CINEMATIC__=true;

const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealMain(){
  const main=document.getElementById('main-site');
  if(main){ main.style.opacity='1'; main.style.pointerEvents='auto'; }
  const intro=document.getElementById('jungle-intro');
  if(reduce&&intro) intro.style.display='none';
}

function initHarvest(){
  const scenes=[...document.querySelectorAll('#harvest-film .harvest-scene')];
  if(!scenes.length) return;
  scenes.forEach((s,i)=>s.classList.toggle('is-active',i===0));
  if(reduce||scenes.length<2) return;
  let i=0;
  const timer=setInterval(()=>{
    if(document.hidden) return;
    scenes[i].classList.remove('is-active');
    i=(i+1)%scenes.length;
    scenes[i].classList.add('is-active');
  },6200);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}

function initReveal(){
  const nodes=[...document.querySelectorAll('.r,.rl,.rr')];
  if(!nodes.length) return;
  if(reduce||!('IntersectionObserver' in window)){
    nodes.forEach(n=>{n.style.opacity='1';n.style.transform='none';});
    return;
  }
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  nodes.forEach(n=>io.observe(n));
}

function initMediaSafety(){
  document.querySelectorAll('video').forEach(v=>{
    v.addEventListener('error',()=>{v.hidden=true;const p=v.getAttribute('poster');if(p&&v.parentElement){v.parentElement.style.backgroundImage=`url("${p}")`;v.parentElement.style.backgroundSize='cover';v.parentElement.style.backgroundPosition='center';}}, {once:true});
    if(reduce){try{v.pause();}catch(_){}}
  });
}

function boot(){ revealMain(); initHarvest(); initReveal(); initMediaSafety(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
setTimeout(revealMain,4500);
window.NS_V17_CINEMATIC_STATUS={active:true,reducedMotion:!!reduce};
})();
