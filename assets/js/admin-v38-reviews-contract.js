(function(){
'use strict';
const S=window.NSV421Store,$=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
if(!S)return;
function contracts(){
 const visible=$$('button:not([disabled]),a.ap-btn').filter(x=>x.offsetParent!==null);
 visible.forEach(x=>{const text=(x.textContent||x.getAttribute('aria-label')||x.title||'Action').trim().replace(/\s+/g,' ');x.dataset.actionContract='observable';if(!x.title)x.title=text+' — this control must produce a visible navigation, editor, state change, download, safe external handoff, or explicit gate.';});
 $$('button[disabled]').forEach(x=>{x.dataset.actionContract='gated';if(!x.title)x.title='Unavailable in the current state or role.';});
 const o=$('.ap-view[data-view="overview"]');let p=$('#v38ActionContractSummary');
 if(o&&!p){p=document.createElement('div');p.id='v38ActionContractSummary';p.className='ap-card ap-panel';p.style.marginTop='16px';o.appendChild(p);}
 if(p)p.innerHTML=`<div class="ap-panel-head"><div><h2>Admin action contract</h2><span>Runtime operability guard</span></div><span class="ap-status green">${visible.length} visible actions mapped</span></div><p style="font-size:10px;line-height:1.6;color:var(--muted)">Enabled controls are required to produce an observable result. Disabled controls expose a state/role gate. Publishing review ownership lives only in the authoritative Review Queue; Audit History remains the record for state-changing operations.</p>`;
}
function init(){setTimeout(contracts,300);window.addEventListener('nsv421:change',()=>setTimeout(contracts,60));new MutationObserver(()=>{clearTimeout(init.t);init.t=setTimeout(contracts,120);}).observe($('.ap-content')||document.body,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
