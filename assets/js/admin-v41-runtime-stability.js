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

/* Delivery Services corrective runtime. The base V21 renderer owns the table shell; this layer
   makes Add/Edit real, role-safe and production-persistent without changing checkout pricing. */
const DS_EDIT_ROLES=new Set(['Owner','Admin','Manager']);
function dsStore(){return window.NSV421Store||null;}
function dsBridge(){return window.NSV421ProductionBridge||null;}
function dsRole(){return document.getElementById('apRole')?.value||dsStore()?.getSession?.()?.role||'';}
function dsProduction(){return !!dsBridge()?.isProduction;}
function dsEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function dsToast(msg){const e=document.getElementById('apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(dsToast.t);dsToast.t=setTimeout(()=>e.classList.remove('is-show'),3200);}
function dsCanEdit(){return DS_EDIT_ROLES.has(dsRole());}
function dsStatusHost(){
  const view=document.querySelector('.ap-view[data-view="delivery-services"]');if(!view)return null;
  let e=document.getElementById('apDeliveryServicesAccess');
  if(!e){e=document.createElement('div');e.id='apDeliveryServicesAccess';e.className='ap-version-note';e.style.marginBottom='12px';const panel=view.querySelector('.ap-card.ap-panel');panel?.parentElement?.insertBefore(e,panel);}
  return e;
}
function dsSetAccessNote(){const e=dsStatusHost();if(!e)return;const role=dsRole();e.innerHTML=dsCanEdit()?`<strong>Delivery service configuration</strong><span>${dsProduction()?'Live Admin':'Local preview'} · ${dsEsc(role)} can add and edit serviceability, SLA, pricing rule and active state. Order-level delivery-charge logic is unchanged.</span>`:`<strong>Read-only delivery service access</strong><span>${dsEsc(role||'This role')} can view delivery services, but only Owner, Admin or Manager can change this configuration.</span>`;}
function dsRenderRows(){
  const store=dsStore(),body=document.getElementById('apDeliveryServicesBody');if(!store||!body)return;
  const state=store.load(),rows=Array.isArray(state.deliveryServices)?state.deliveryServices:[],editable=dsCanEdit();
  body.innerHTML=rows.map((s,i)=>`<tr data-ds-row="${i}"><td>${dsEsc(s.name)}</td><td>${dsEsc(s.type)}</td><td>${dsEsc(s.coverage)}</td><td>${dsEsc(s.sla)}</td><td>${dsEsc(s.pricing)}</td><td><span class="ap-status ${s.active?'green':'gray'}">${s.active?'Active':'Inactive'}</span></td><td><button class="ap-btn mini" type="button" data-ds-edit="${i}" ${editable?'':`disabled title="${dsEsc(dsRole())} has read-only access"`}>Edit</button></td></tr>`).join('');
  body.querySelectorAll('[data-ds-edit]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!dsCanEdit())return dsToast('Delivery Services is read-only for '+dsRole()+'.');dsOpenEditor(Number(btn.dataset.dsEdit));}));
  dsSetAccessNote();
}
function dsModal(title,sub,body){const modal=document.getElementById('apModal');if(!modal)return false;document.getElementById('apModalTitle').textContent=title;document.getElementById('apModalSub').textContent=sub||'';document.getElementById('apModalBody').innerHTML=body;modal.classList.add('is-open');return true;}
function dsCloseModal(){document.getElementById('apModal')?.classList.remove('is-open');}
function dsFormMarkup(item,isNew){const x=item||{name:'',type:'Local',coverage:'',sla:'',pricing:'Confirm by order/location',active:true};return `<form class="ap-form" id="apDeliveryServiceForm" novalidate><div class="ap-version-note"><strong>${isNew?'New delivery service':'Edit delivery service'}</strong><span>Configure operational serviceability only. This does not replace the existing order-level delivery-charge logic.</span></div><div class="ap-row"><div class="ap-field"><label>Service name *</label><input name="name" maxlength="120" required value="${dsEsc(x.name)}" placeholder="e.g. Jabalpur local partner"></div><div class="ap-field"><label>Type *</label><input name="type" maxlength="60" required value="${dsEsc(x.type||'Local')}" placeholder="Local / Regional / Courier"></div></div><div class="ap-field"><label>Coverage *</label><input name="coverage" maxlength="180" required value="${dsEsc(x.coverage)}" placeholder="Cities, zones or serviceability rule"></div><div class="ap-field"><label>SLA *</label><input name="sla" maxlength="180" required value="${dsEsc(x.sla)}" placeholder="e.g. Same / next day by confirmation"></div><div class="ap-field"><label>Pricing rule *</label><input name="pricing" maxlength="180" required value="${dsEsc(x.pricing)}" placeholder="e.g. Confirm by order/location"></div><label class="ap-radio-card"><input type="checkbox" name="active" ${x.active!==false?'checked':''}><span><strong>Service active</strong><small>Inactive services remain in Admin history but should not be treated as available.</small></span></label><div id="apDeliveryServiceSaveState" class="ap-version-note" hidden></div><div class="ap-head-actions" style="margin-top:14px"><button class="ap-btn" type="button" data-ds-cancel>Cancel</button><button class="ap-btn primary" type="submit">${isNew?'Add service':'Save changes'}</button></div></form>`;}
async function dsPersist(next,action,target,form,isNew){
  const store=dsStore();if(!store)throw new Error('Admin store is unavailable.');store.audit?.(next,action,target);store.save(next);dsRenderRows();
  if(!dsProduction()){dsCloseModal();dsToast(action+' — local preview saved.');return true;}
  const bridge=dsBridge(),status=form?.querySelector('#apDeliveryServiceSaveState'),submit=form?.querySelector('button[type="submit"]');if(submit)submit.disabled=true;if(status){status.hidden=false;status.innerHTML='<strong>Saving live configuration…</strong><span>Waiting for Firebase-backed Admin persistence.</span>';}
  try{const ready=await bridge?.ready;if(ready?.error)throw new Error(ready.error);if(!bridge?.persist)throw new Error('Production persistence bridge is unavailable.');await bridge.persist();if(status){status.innerHTML='<strong>Saved live.</strong><span>Delivery service configuration is persisted.</span>';}dsToast(action+' — saved live.');setTimeout(dsCloseModal,250);return true;}catch(err){console.error('[Delivery Services live save]',err);try{await bridge?.reload?.();}catch(reloadErr){console.warn('[Delivery Services rollback reload]',reloadErr);}dsRenderRows();if(submit)submit.disabled=false;if(status){status.hidden=false;status.innerHTML=`<strong>Live save failed.</strong><span>${dsEsc(err?.message||err||'Remote persistence failed.')} The live-backed state was reloaded where possible; retry after resolving the permission/configuration error.</span>`;}dsToast('Live save failed: '+String(err?.message||err||'remote persistence error'));return false;}
}
function dsOpenEditor(index=null){
  if(!dsCanEdit()){dsToast('Delivery Services is read-only for '+dsRole()+'.');return;}
  const store=dsStore(),state=store?.load?.()||{},rows=Array.isArray(state.deliveryServices)?state.deliveryServices:[],isNew=index===null||!Number.isInteger(index),item=isNew?null:rows[index];if(!isNew&&!item){dsToast('Delivery service no longer exists.');return;}
  const id=item?.id||'',title=isNew?'Add delivery service':'Edit delivery service',sub=isNew?'Create only after Save — Cancel leaves the list unchanged.':(id||item?.name||'Delivery service');if(!dsModal(title,sub,dsFormMarkup(item,isNew)))return;
  const form=document.getElementById('apDeliveryServiceForm');form?.querySelector('[data-ds-cancel]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();dsCloseModal();});
  if(!form)return;form.addEventListener('submit',async e=>{e.preventDefault();e.stopPropagation();const fd=new FormData(form),name=String(fd.get('name')||'').trim(),type=String(fd.get('type')||'').trim(),coverage=String(fd.get('coverage')||'').trim(),sla=String(fd.get('sla')||'').trim(),pricing=String(fd.get('pricing')||'').trim();if(!name||!type||!coverage||!sla||!pricing){const status=form.querySelector('#apDeliveryServiceSaveState');status.hidden=false;status.innerHTML='<strong>Complete required fields.</strong><span>Name, type, coverage, SLA and pricing rule are required before saving.</span>';return;}const next=store.load();next.deliveryServices=Array.isArray(next.deliveryServices)?next.deliveryServices:[];const row={id:isNew?'DS-'+Date.now():(item.id||'DS-'+Date.now()),name:name.slice(0,120),type:type.slice(0,60),coverage:coverage.slice(0,180),sla:sla.slice(0,180),pricing:pricing.slice(0,180),active:fd.get('active')==='on'};if(isNew)next.deliveryServices.push(row);else next.deliveryServices[index]=row;await dsPersist(next,isNew?'Delivery service added':'Delivery service updated',row.id,form,isNew);});
}
function dsBind(){
  const add=document.getElementById('apAddDeliveryService');if(add&&!add.dataset.v41DeliveryBound){add.dataset.v41DeliveryBound='1';add.onclick=e=>{e.preventDefault();e.stopPropagation();if(!dsCanEdit())return dsToast('Delivery Services is read-only for '+dsRole()+'.');dsOpenEditor(null);};}
  if(add){add.disabled=!dsCanEdit();add.title=dsCanEdit()?'Add a delivery service after completing the form':dsRole()+' has read-only access';}
  dsRenderRows();
}
function dsRepairBurst(){[0,80,220,500,1000].forEach(ms=>setTimeout(dsBind,ms));}

function bind(){
  ensurePeopleStreamsControl();ensureMediaGuidance();repairBurst();dsRepairBurst();
  document.addEventListener('click',e=>{if(e.target?.closest?.('#apNav [data-view="pages"]'))repairBurst();if(e.target?.closest?.('#apNav [data-view="delivery-services"]'))dsRepairBurst();if(e.target?.closest?.('[data-v40-target],[data-v38-target],[data-v40-clear],[data-v38-clear],[data-v40-pick],[data-v38-pick]')){setTimeout(stabilizePlacement,40);setTimeout(stabilizePlacement,140);setTimeout(stabilizePlacement,320);}},true);
  document.getElementById('apRole')?.addEventListener('change',()=>setTimeout(dsBind,20));
  window.addEventListener('nsv421:change',()=>{ensureMediaGuidance();setTimeout(stabilizePlacement,40);setTimeout(stabilizePlacement,160);setTimeout(stabilizePlacement,420);setTimeout(dsBind,80);});
  window.addEventListener('nsv421:production-ready',()=>{repairBurst();dsRepairBurst();});
  const root=document.querySelector('.ap-content')||document.body||document.documentElement;
  new MutationObserver(()=>{ensurePeopleStreamsControl();ensureMediaGuidance();const view=document.querySelector('.ap-view[data-view="pages"]');if(view&&!view.querySelector('#apV38ImageTargets'))scheduleRepair(20);else if(view)setTimeout(stabilizePlacement,20);const dsBody=document.getElementById('apDeliveryServicesBody'),dsAdd=document.getElementById('apAddDeliveryService');if(dsBody&&(!dsAdd?.dataset.v41DeliveryBound||(dsBody.children.length>0&&!dsBody.querySelector('[data-ds-edit]'))))setTimeout(dsBind,20);}).observe(root,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
window.NSV421AdminRuntimeStability={ensurePanel:ensureHost,largeReady,repairBurst,decorateCompatibility,stabilizePlacement,ensurePeopleStreamsControl,ensureMediaGuidance};
window.NSV421DeliveryServicesAdmin={refresh:dsBind,openAdd:()=>dsOpenEditor(null),openEdit:i=>dsOpenEditor(Number(i)),canEdit:dsCanEdit,get role(){return dsRole();},get isProduction(){return dsProduction();}};
})();