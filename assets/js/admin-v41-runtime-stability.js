(function(){
'use strict';
if(window.__NS_V421_ADMIN_RUNTIME_STABILITY__)return;
window.__NS_V421_ADMIN_RUNTIME_STABILITY__=true;

let repairTimer=0,authoritativeTimer=0;
function ensurePeopleStreamsControl(){
  if(window.__NS_V421_ADMIN_V42_PEOPLE_STREAMS__||document.getElementById('ns-v42-people-stream-control'))return;
  const script=document.createElement('script');
  script.id='ns-v42-people-stream-control';
  script.src='assets/js/admin-v42-people-streams.js';
  script.async=false;
  document.head.appendChild(script);
}
function ensureMediaGuidance(){
  if(window.__NS_V421_ADMIN_V43_MEDIA_GUIDANCE__||document.getElementById('ns-v43-media-guidance'))return;
  const script=document.createElement('script');
  script.id='ns-v43-media-guidance';
  script.src='assets/js/admin-v43-media-guidance.js';
  script.async=false;
  document.head.appendChild(script);
}
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
  host.dataset.nsPlacementContract='v1';
  if(created)requestAuthoritativeRender(0);
  return host;
}
function requestAuthoritativeRender(ms=0){if(!window.__NS_V421_ADMIN_V40__)return;clearTimeout(authoritativeTimer);authoritativeTimer=setTimeout(()=>window.dispatchEvent(new CustomEvent('nsv421:change')),ms);}
function ensureAuthoritativeHost(){const host=ensureHost();if(!host)return null;if(window.__NS_V421_ADMIN_V40__&&(host.dataset.v40Owned!=='1'||!host.querySelector('[data-v40-target]'))){requestAuthoritativeRender(0);return host;}return host;}
function decorateCompatibility(){
  const host=ensureAuthoritativeHost();if(!host)return null;
  if(window.__NS_V421_ADMIN_V40__&&(host.dataset.v40Owned!=='1'||!host.querySelector('[data-v40-target]')))return host;
  const state=window.NSV421Store?.load?.()||{};
  host.querySelectorAll('[data-v40-target],[data-v38-target]').forEach(btn=>{const id=btn.dataset.v40Target||btn.dataset.v38Target||'';if(!id)return;btn.dataset.v40Target=btn.dataset.v40Target||id;btn.dataset.v38Target=id;btn.dataset.nsPlacementTarget=id;const card=btn.closest('article');if(card){const status=state.sectionMedia?.[id]?'custom':'default';const src=card.querySelector('img')?.getAttribute('src')||'';card.dataset.v38PlacementCard=id;card.dataset.v38Status=status;card.dataset.nsPlacementTarget=id;card.dataset.nsPlacementState=status;card.dataset.nsPlacementPreview=src;}});
  host.querySelectorAll('[data-v40-clear],[data-v38-clear]').forEach(btn=>{const id=btn.dataset.v40Clear||btn.dataset.v38Clear||'';if(!id)return;btn.dataset.v38Clear=id;btn.dataset.nsPlacementClear=id;});
  const modal=document.getElementById('apModal');
  if(modal?.classList.contains('is-open'))modal.querySelectorAll('[data-v40-pick],[data-v38-pick]').forEach(btn=>{if(btn.disabled){delete btn.dataset.v38Pick;delete btn.dataset.v38PickTarget;delete btn.dataset.nsPlacementPick;delete btn.dataset.nsPlacementPickTarget;return;}const id=btn.dataset.v40Pick||btn.dataset.v38Pick||'',target=btn.dataset.v40PickTarget||btn.dataset.v38PickTarget||'';if(!id)return;btn.dataset.v38Pick=id;btn.dataset.v38PickTarget=target;btn.dataset.nsPlacementPick=id;btn.dataset.nsPlacementPickTarget=target;});
  return host;
}
function stabilizePlacement(){const host=ensureAuthoritativeHost();if(!host)return;if(window.__NS_V421_ADMIN_V40__&&(host.dataset.v40Owned!=='1'||!host.querySelector('[data-v40-target]'))){requestAuthoritativeRender(10);setTimeout(decorateCompatibility,60);return;}decorateCompatibility();}
function scheduleRepair(ms=20){clearTimeout(repairTimer);repairTimer=setTimeout(stabilizePlacement,ms);}
function repairBurst(){[0,80,220,550,1100,1800,2800].forEach(ms=>setTimeout(stabilizePlacement,ms));}
function largeReady(m){const s=window.NSV421Store?.load?.()||{};const policy=window.NSV421MediaDB?.eligibleForLargePublic;if(policy)return policy(s,m);if(!m||m.status!=='Approved'||m.visible===false||m.publicAllowed===false||m.brandFit==='Weak'||!(m.src||m.thumb))return false;if(m.largeSurfaceAllowed===false||m.qualityTier==='card-only')return false;const w=Number(m.width||0),h=Number(m.height||0);return !w||!h||(Math.max(w,h)>=1000&&Math.min(w,h)>=600);}
function bind(){
  ensurePeopleStreamsControl();ensureMediaGuidance();repairBurst();
  document.addEventListener('click',e=>{if(e.target?.closest?.('#apNav [data-view="pages"]'))repairBurst();if(e.target?.closest?.('[data-v40-target],[data-v38-target],[data-v40-clear],[data-v38-clear],[data-v40-pick],[data-v38-pick]')){setTimeout(stabilizePlacement,40);setTimeout(stabilizePlacement,140);setTimeout(stabilizePlacement,320);}},true);
  window.addEventListener('nsv421:change',()=>{ensureMediaGuidance();setTimeout(stabilizePlacement,40);setTimeout(stabilizePlacement,160);setTimeout(stabilizePlacement,420);});
  window.addEventListener('nsv421:production-ready',repairBurst);
  const root=document.querySelector('.ap-content')||document.body||document.documentElement;
  new MutationObserver(()=>{ensurePeopleStreamsControl();ensureMediaGuidance();const view=document.querySelector('.ap-view[data-view="pages"]');if(view&&!view.querySelector('#apV38ImageTargets'))scheduleRepair(20);else if(view)setTimeout(stabilizePlacement,20);}).observe(root,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
window.NSV421AdminRuntimeStability={ensurePanel:ensureHost,largeReady,repairBurst,decorateCompatibility,stabilizePlacement,ensurePeopleStreamsControl,ensureMediaGuidance};
})();