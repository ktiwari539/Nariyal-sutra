(function(){
'use strict';
if(window.__NS_V421_ADMIN_RUNTIME_STABILITY__)return;
window.__NS_V421_ADMIN_RUNTIME_STABILITY__=true;

let repairTimer=0;
function ensureHost(){
  const view=document.querySelector('.ap-view[data-view="pages"]');
  if(!view)return null;
  let host=[...document.querySelectorAll('#apV38ImageTargets')].find(x=>x.parentElement===view)||null;
  document.querySelectorAll('#apV38ImageTargets').forEach(x=>{if(x!==host)x.remove();});
  let created=false;
  if(!host){
    host=document.createElement('div');
    host.id='apV38ImageTargets';
    host.className='ap-card ap-panel';
    host.style.marginTop='16px';
    view.insertBefore(host,view.firstChild);
    created=true;
  }
  host.dataset.v41Recovered='1';
  if(created){
    /* V38/V40 own the panel contents. V41 only restores the mount point and then
       asks the registered Admin owners to render it. This avoids competing renderers. */
    setTimeout(()=>window.dispatchEvent(new CustomEvent('nsv421:change')),0);
  }
  return host;
}

function decorateCompatibility(){
  const host=ensureHost();
  if(!host)return null;
  const state=window.NSV421Store?.load?.()||{};

  host.querySelectorAll('[data-v40-target]').forEach(btn=>{
    const id=btn.dataset.v40Target;
    btn.dataset.v38Target=id;
    const card=btn.closest('article');
    if(card){
      card.dataset.v38PlacementCard=id;
      card.dataset.v38Status=state.sectionMedia?.[id]?'custom':'default';
    }
  });
  host.querySelectorAll('[data-v40-clear]').forEach(btn=>{btn.dataset.v38Clear=btn.dataset.v40Clear;});

  const modal=document.getElementById('apModal');
  if(modal?.classList.contains('is-open')){
    modal.querySelectorAll('[data-v40-pick]').forEach(btn=>{
      /* Alias only selectable large-surface choices. Small reference media remains
         visible in V40 but is intentionally not exposed through the legacy V38 API. */
      if(btn.disabled){delete btn.dataset.v38Pick;delete btn.dataset.v38PickTarget;return;}
      btn.dataset.v38Pick=btn.dataset.v40Pick;
      btn.dataset.v38PickTarget=btn.dataset.v40PickTarget||'';
    });
  }
  return host;
}

function scheduleRepair(ms=20){
  clearTimeout(repairTimer);
  repairTimer=setTimeout(()=>{ensureHost();setTimeout(decorateCompatibility,30);},ms);
}
function repairBurst(){
  [0,80,220,550,1100].forEach(ms=>setTimeout(()=>{ensureHost();decorateCompatibility();},ms));
}
function largeReady(m){
  if(!m||m.status!=='Approved'||m.visible===false||m.publicAllowed===false||m.brandFit==='Weak'||!(m.src||m.thumb))return false;
  if(m.largeSurfaceAllowed===false)return false;
  const w=Number(m.width||0),h=Number(m.height||0);
  return !w||!h||(Math.max(w,h)>=1000&&Math.min(w,h)>=600);
}

function bind(){
  repairBurst();
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#apNav [data-view="pages"]'))repairBurst();
    if(e.target?.closest?.('[data-v40-target],[data-v38-target],[data-v40-clear],[data-v38-clear],[data-v40-pick],[data-v38-pick]')){
      setTimeout(decorateCompatibility,40);
      setTimeout(decorateCompatibility,140);
    }
  },true);
  window.addEventListener('nsv421:change',()=>{setTimeout(decorateCompatibility,40);setTimeout(decorateCompatibility,160);});
  window.addEventListener('nsv421:production-ready',repairBurst);

  const root=document.querySelector('.ap-content')||document.body||document.documentElement;
  new MutationObserver(()=>{
    const view=document.querySelector('.ap-view[data-view="pages"]');
    if(view&&!view.querySelector('#apV38ImageTargets'))scheduleRepair(20);
    else if(view)setTimeout(decorateCompatibility,20);
  }).observe(root,{childList:true,subtree:true});
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
window.NSV421AdminRuntimeStability={ensurePanel:ensureHost,largeReady,repairBurst,decorateCompatibility};
})();