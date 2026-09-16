(function(){
'use strict';
if(window.__NS_V421_MANUAL_ACCEPTANCE__)return;window.__NS_V421_MANUAL_ACCEPTANCE__=true;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function production(){return !!window.NSV421ProductionBridge?.isProduction;}
function role(){return $('#apRole')?.value||window.NSV421ProductionBridge?.role||window.NSV421Store?.getSession?.()?.role||'';}
function lifecycle(){return window.NSV421OrderOperations?.lifecycleV2?window.NSV421OrderOperations:null;}
async function decide(id,next,reason=''){
 const op=lifecycle();if(!op)throw new Error('Authoritative order lifecycle module is not ready.');
 return production()?op.transition(id,next,{reason,source:'manual-acceptance-shim'}):op.previewTransition(id,next,reason);
}
function previewDecision(id,next,reason=''){const op=lifecycle();if(!op)throw new Error('Authoritative order lifecycle module is not ready.');return op.previewTransition(id,next,reason);}
function renderOrderActions(){
 /* V47 used to own Accept/Reject and wrote fields that are not part of the hardened
    order contract. V44 lifecycle V2 is now the only order-transition owner. */
 $('#nsOrderDecisionControls')?.remove();
}
function installMediaContain(){if($('#nsV47MediaContain'))return;const s=document.createElement('style');s.id='nsV47MediaContain';s.textContent=`#apMediaGrid .ap-media-img,#apMediaGrid .ap-media-visual{background:#061006!important}#apMediaGrid .ap-media-img img,#apMediaGrid .ap-media-visual img{object-fit:contain!important;object-position:center center!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important}#apMediaGrid .ap-media-body{position:relative!important;z-index:2!important}.ns-v47-media-help{grid-column:1/-1;padding:9px 11px;border:1px solid rgba(212,168,67,.18);background:rgba(212,168,67,.05);font-size:10px;line-height:1.55;color:var(--muted,#7b8479)}.ns-v47-save-status{padding:10px;border:1px solid rgba(255,255,255,.12);font-size:10px;line-height:1.55}.ns-v47-save-status strong{display:block;color:#f0d889}`;document.head.appendChild(s);}
function mediaHelp(){const grid=$('#apMediaGrid');if(!grid||$('#nsV47MediaHelp'))return;const n=document.createElement('div');n.id='nsV47MediaHelp';n.className='ns-v47-media-help';n.innerHTML='<strong>Admin preview shows the complete source image.</strong> Empty space around portrait/landscape photos is intentional. Public website placements may crop according to the selected placement and focus.';grid.parentElement?.insertBefore(n,grid);}
function identity(){const b=window.NSV421ProductionBridge,s=window.NSV421Store?.getSession?.()||{},r=role(),d=b?.identityDiagnostic?.()||b?.identity||{};return {email:d.email||s.name||'Unavailable',uid:d.uid||s.id||'Unavailable',role:d.role||r||'Unavailable',owner:d.isConfiguredOwner===true?'Yes':d.isConfiguredOwner===false?'No':'Unknown'};}
function addMediaDiagnostic(){const form=$('#apV39MediaForm');if(!form||$('#nsV47MediaSaveStatus',form))return;const d=identity(),box=document.createElement('div');box.id='nsV47MediaSaveStatus';box.className='ns-v47-save-status';box.innerHTML=`<strong>Media save status / identity diagnostic</strong><span>${production()?'Live Admin: image replacement has two stages — (A) signed binary upload, then (B) Firestore metadata/placement save.':'Local preview: changes stay local; no Firebase or Cloudinary write is attempted.'}</span><br><span>Signed in: ${esc(d.email)} · UID: ${esc(d.uid)} · Role: ${esc(d.role)} · Configured Owner match: ${esc(d.owner)}</span><br><span data-ns-save-state>${production()?'No publish result yet. Save and wait for the remote confirmation.':'Local-only preview.'}</span>`;form.querySelector('.ap-v39-actions')?.before(box);}
function remoteSaved(){const e=$('[data-ns-save-state]');if(e)e.textContent='Saved to source configuration and public projection.';}
function remoteError(ev){const e=$('[data-ns-save-state]'),d=identity(),msg=String(ev?.detail||'Remote persistence failed');if(e)e.innerHTML=`<b>Not published / remote save failed.</b> ${esc(msg)}<br>Identity: ${esc(d.email)} · ${esc(d.uid)} · ${esc(d.role)} · Owner match: ${esc(d.owner)}. If the error is “Missing or insufficient permissions”, Firebase deployed rules/role mapping must be corrected; the UI will not bypass security.`;}
function bind(){installMediaContain();mediaHelp();renderOrderActions();new MutationObserver(()=>{mediaHelp();renderOrderActions();addMediaDiagnostic();}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('[data-v39-inspect],.ap-media-img,.ap-media-visual'))setTimeout(addMediaDiagnostic,30);},true);window.addEventListener('nsv421:remote-saved',remoteSaved);window.addEventListener('nsv421:remote-error',remoteError);window.addEventListener('nsv421:production-ready',()=>{mediaHelp();renderOrderActions();});}
window.NSV421ManualAcceptance={delegatesToLifecycleV2:true,decide,previewDecision,refresh:renderOrderActions};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();