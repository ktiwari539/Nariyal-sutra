(function(){
'use strict';
if(window.__NS_V421_ADMIN_FOLLOWUPS_RUNTIME__)return;
const Store=window.NSV421Store;
if(!Store){console.error('[Follow-ups] Admin store is not ready.');return;}
window.__NS_V421_ADMIN_FOLLOWUPS_RUNTIME__=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WRITE_ROLES=new Set(['Owner','Admin','Manager','Support','Sales']);
const READ_ROLES=new Set([...WRITE_ROLES,'Operations']);
const STATUSES=['open','in_progress','completed','cancelled'];
const PRIORITIES=['normal','high','urgent','opportunity'];
let repairTimer=0;
function bridge(){return window.NSV421ProductionBridge;}
function production(){return !!bridge()?.isProduction;}
function role(){return production()?(bridge()?.role||'Unknown'):($('#apRole')?.value||Store.getSession?.()?.role||'Owner');}
function actor(){const d=bridge()?.identityDiagnostic?.()||{};return production()?(d.email||d.uid||role()):($('#apUserName')?.textContent||role());}
function state(){const s=Store.load();s.followups=Array.isArray(s.followups)?s.followups:[];s.followupEvents=Array.isArray(s.followupEvents)?s.followupEvents:[];return s;}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),3400);}
function modal(title,sub,body){const box=$('#apModal');if(!box)return false;$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;box.classList.add('is-open','ap-modal-wide');return true;}
function close(){const box=$('#apModal');box?.classList.remove('is-open','ap-modal-wide');}
function uid(prefix='FU'){return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();}
function iso(v){try{return v?.toDate?v.toDate().toISOString():(v instanceof Date?v.toISOString():v?new Date(v).toISOString():'');}catch{return '';}}
function localInput(v){const d=new Date(iso(v)||Date.now()+86400000);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);}
function label(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
function normalize(x={}){return {...x,id:String(x.id||''),customerKey:String(x.customerKey||''),customerName:String(x.customerName||x.customer||'').trim(),orderId:String(x.orderId||'').trim(),reason:String(x.reason||x.nextAction||'').trim(),assignee:String(x.assignee||x.owner||'Unassigned').trim(),assigneeUid:String(x.assigneeUid||''),priority:PRIORITIES.includes(String(x.priority||'').toLowerCase())?String(x.priority).toLowerCase():'normal',dueAt:iso(x.dueAt||x.due),status:STATUSES.includes(x.status)?x.status:'open',createdAt:iso(x.createdAt),updatedAt:iso(x.updatedAt),completedAt:iso(x.completedAt)};}
function canRead(){return READ_ROLES.has(role());}
function canWrite(){return WRITE_ROLES.has(role());}
function saveLocal(next,before=null){
 const s=state(),now=new Date().toISOString(),who=actor();
 if(before){const i=s.followups.findIndex(x=>x.id===before.id);next={...before,...next,updatedAt:now,updatedBy:who,updatedByEmail:who};if(i<0)throw new Error('Follow-up no longer exists.');s.followups[i]=next;}
 else{next={...next,id:next.id||uid(),status:'open',createdAt:now,createdBy:who,createdByEmail:who,updatedAt:now,updatedBy:who,updatedByEmail:who};s.followups.unshift(next);}
 const action=!before?'created':before.status!==next.status?'status_changed':before.assignee!==next.assignee?'reassigned':before.dueAt!==next.dueAt?'rescheduled':'updated';
 const details=action==='status_changed'?`Status changed from ${label(before.status)} to ${label(next.status)}.`:action==='created'?'Follow-up created.':action==='reassigned'?`Assignee changed from ${before.assignee||'Unassigned'} to ${next.assignee||'Unassigned'}.`:action==='rescheduled'?`Due date changed to ${new Date(next.dueAt).toLocaleString()}.`:'Follow-up details updated.';
 s.followupEvents.unshift({id:uid('FUE'),followupId:next.id,action,details,actorEmail:who,actorRole:role(),createdAt:now});
 Store.audit?.(s,`Follow-up ${action.replaceAll('_',' ')}`,next.id);Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));return next;
}
async function persist(next,before=null){
 if(!canWrite())throw new Error('This role has read-only access to follow-ups.');
 if(production()){
  if(!bridge()?.saveFollowup)throw new Error('Secure Follow-ups service is still loading. Try again.');
  return bridge().saveFollowup({...next,id:before?.id||next.id||''});
 }
 return saveLocal(next,before);
}
function customerOptions(s){const rows=[];for(const x of s.customerProfiles||[])rows.push({key:x.uid||x.id||'',name:x.name||x.displayName||x.email||x.phone||'Customer'});for(const x of s.orders||[])rows.push({key:x.customerUid||'',name:x.customerName||x.customer||'Customer'});const seen=new Set();return rows.filter(x=>{const k=(x.key+'|'+x.name).toLowerCase();if(!x.name||seen.has(k))return false;seen.add(k);return true;}).slice(0,400);}
function assignees(s){const values=(s.teamMembers||[]).filter(x=>x.active!==false&&x.status!=='Inactive').map(x=>x.name||x.email||x.role).filter(Boolean);for(const x of s.followups||[])values.push(normalize(x).assignee);return [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
function editor(id=''){
 if(!canWrite())return toast('Operations can review follow-ups but cannot change them.');
 const s=state(),before=id?normalize(s.followups.find(x=>x.id===id)):null;
 if(id&&!before?.id)return toast('Follow-up no longer exists.');
 const x=before||{customerKey:'',customerName:'',orderId:'',reason:'',assignee:actor(),priority:'normal',dueAt:new Date(Date.now()+86400000).toISOString(),status:'open'};
 const customers=customerOptions(s),owners=assignees(s);
 if(!modal(before?'Edit follow-up':'Add follow-up',before?'Update the linked action. The change is appended to history.':'Creates an open, owned customer-success action.',`<form class="ap-form" id="nsFollowupForm"><div class="ap-row"><div class="ap-field"><label>Customer / account *</label><input name="customerName" list="nsFollowupCustomers" required maxlength="160" value="${esc(x.customerName)}"><datalist id="nsFollowupCustomers">${customers.map(c=>`<option value="${esc(c.name)}">${esc(c.key)}</option>`).join('')}</datalist></div><div class="ap-field"><label>Customer key (optional)</label><input name="customerKey" maxlength="128" value="${esc(x.customerKey)}"></div></div><div class="ap-row"><div class="ap-field"><label>Order ID (optional)</label><input name="orderId" maxlength="80" value="${esc(x.orderId)}"></div><div class="ap-field"><label>Assignee *</label><input name="assignee" list="nsFollowupOwners" required maxlength="120" value="${esc(x.assignee)}"><datalist id="nsFollowupOwners">${owners.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist></div></div><div class="ap-field"><label>Next action *</label><textarea name="reason" required maxlength="500">${esc(x.reason)}</textarea></div><div class="ap-row"><div class="ap-field"><label>Due date *</label><input name="dueAt" type="datetime-local" required value="${esc(localInput(x.dueAt))}"></div><div class="ap-field"><label>Priority</label><select name="priority">${PRIORITIES.map(v=>`<option value="${v}" ${x.priority===v?'selected':''}>${label(v)}</option>`).join('')}</select></div></div><div class="ns-fu-impact">Saving writes one secured Follow-up record and one append-only history event. It does not contact the customer.</div><div class="ns-fu-actions"><button type="button" class="ap-btn" data-followup-cancel>Cancel</button><button class="ap-btn primary" type="submit">${before?'Save changes':'Add follow-up'}</button></div></form>`))return;
 const form=$('#nsFollowupForm');form.querySelector('[data-followup-cancel]')?.addEventListener('click',close);
 form.addEventListener('submit',async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form).entries());v.customerName=String(v.customerName||'').trim();v.customerKey=String(v.customerKey||'').trim();v.orderId=String(v.orderId||'').trim();v.reason=String(v.reason||'').trim();v.assignee=String(v.assignee||'').trim();v.dueAt=new Date(String(v.dueAt)).toISOString();v.status=before?.status||'open';if(!v.customerName||!v.reason||!v.assignee)return toast('Customer, next action and assignee are required.');const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Saving…';try{await persist(v,before);close();toast(before?'Follow-up updated':'Follow-up created');render();}catch(err){submit.disabled=false;submit.textContent=before?'Save changes':'Add follow-up';toast(String(err?.message||err));}});
}
async function setStatus(id,status){
 if(!canWrite())return toast('Operations can review follow-ups but cannot change them.');
 const before=normalize(state().followups.find(x=>x.id===id));if(!before.id)return;
 if(!STATUSES.includes(status))return;
 const next={...before,status,completedAt:status==='completed'?new Date().toISOString():'',completedBy:status==='completed'?actor():''};
 try{await persist(next,before);toast(`Follow-up ${label(status).toLowerCase()}`);render();}catch(e){toast(String(e?.message||e));}
}
function history(id){const s=state(),x=normalize(s.followups.find(v=>v.id===id)),events=(s.followupEvents||[]).filter(v=>v.followupId===id).sort((a,b)=>new Date(iso(b.createdAt)||0)-new Date(iso(a.createdAt)||0));if(!x.id)return;modal('Follow-up history',`${x.customerName}${x.orderId?' · '+x.orderId:''}`,events.length?`<div class="ns-fu-history">${events.map(v=>`<article><strong>${esc(label(v.action))}</strong><span>${esc(v.details||'Change recorded.')}</span><small>${esc(v.actorEmail||v.actorUid||'Staff')} · ${esc(v.actorRole||'')} · ${esc(iso(v.createdAt)?new Date(iso(v.createdAt)).toLocaleString():'Pending server time')}</small></article>`).join('')}</div>`:'<div class="ap-empty">No history events are available.</div>');}
function communication(id){const x=normalize(state().followups.find(v=>v.id===id));if(!x.id)return;const open=()=>window.NSV421CommunicationAdmin?.composer?.(null,{purpose:'General follow-up',recipient:x.customerName,orderId:x.orderId,owner:x.assignee,message:`Following up regarding: ${x.reason}`});if(window.NSV421CommunicationAdmin?.ready)return open();toast('Communication composer is still loading.');setTimeout(open,500);}
function statusClass(v){return v==='completed'?'green':v==='cancelled'?'gray':v==='in_progress'?'gold':'gray';}
function render(){
 const host=$('#apFollowupRows');if(!host)return;const s=state(),access=$('#apFollowupAccess'),summary=$('#apFollowupSummary'),add=claimAdd();
 const allowed=canRead(),editable=canWrite();if(add){add.disabled=!editable;add.title=editable?'Create a linked follow-up':'This role has read-only access';}
 if(access){access.textContent=!allowed?'No access':editable?'Create and update':'Read only';access.className='ap-status '+(editable?'green':allowed?'gold':'red');}
 if(!allowed){host.innerHTML='<tr><td colspan="7"><div class="ap-empty">This role cannot access customer follow-ups.</div></td></tr>';if(summary)summary.textContent='Restricted by role';return;}
 const q=String($('#apFollowupSearch')?.value||'').toLowerCase(),sf=$('#apFollowupStatusFilter')?.value||'active',af=$('#apFollowupAssigneeFilter')?.value||'all';
 const select=$('#apFollowupAssigneeFilter');if(select){const keep=select.value||'all',items=assignees(s);select.innerHTML='<option value="all">All assignees</option>'+items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');select.value=items.includes(keep)?keep:'all';}
 const all=(s.followups||[]).map(normalize).sort((a,b)=>new Date(a.dueAt||8640000000000000)-new Date(b.dueAt||8640000000000000));
 const rows=all.filter(x=>(sf==='all'||(sf==='active'&&['open','in_progress'].includes(x.status))||x.status===sf)&&(af==='all'||x.assignee===af)&&(!q||[x.customerName,x.customerKey,x.orderId,x.reason,x.assignee,x.priority].join(' ').toLowerCase().includes(q)));
 const active=all.filter(x=>['open','in_progress'].includes(x.status)).length,overdue=all.filter(x=>['open','in_progress'].includes(x.status)&&x.dueAt&&new Date(x.dueAt)<new Date()).length;if(summary)summary.textContent=`${rows.length} shown · ${active} active${overdue?' · '+overdue+' overdue':''}`;
 host.innerHTML=rows.map(x=>{const overdueNow=['open','in_progress'].includes(x.status)&&x.dueAt&&new Date(x.dueAt)<new Date();const actions=editable?`<button class="ap-btn mini" type="button" data-fu-edit="${esc(x.id)}">Edit</button>${x.status==='open'?`<button class="ap-btn mini" type="button" data-fu-status="in_progress" data-fu-id="${esc(x.id)}">Start</button>`:''}${x.status!=='completed'&&x.status!=='cancelled'?`<button class="ap-btn mini primary" type="button" data-fu-status="completed" data-fu-id="${esc(x.id)}">Complete</button>`:''}${['completed','cancelled'].includes(x.status)?`<button class="ap-btn mini" type="button" data-fu-status="open" data-fu-id="${esc(x.id)}">Reopen</button>`:''}${x.status!=='cancelled'?`<button class="ap-btn mini" type="button" data-fu-status="cancelled" data-fu-id="${esc(x.id)}">Cancel</button>`:''}`:'';return `<tr data-followup-id="${esc(x.id)}"><td><strong class="${overdueNow?'ns-fu-overdue':''}">${esc(x.dueAt?new Date(x.dueAt).toLocaleString():'No date')}</strong>${overdueNow?'<small class="ns-fu-block">Overdue</small>':''}</td><td><strong>${esc(x.customerName||'Customer')}</strong>${x.customerKey?`<small class="ns-fu-block">${esc(x.customerKey)}</small>`:''}${x.orderId?`<small class="ns-fu-block">Order ${esc(x.orderId)}</small>`:''}</td><td>${esc(x.reason||'—')}</td><td>${esc(x.assignee||'Unassigned')}</td><td><span class="ap-status ${x.priority==='urgent'?'red':x.priority==='high'||x.priority==='opportunity'?'gold':'gray'}">${esc(label(x.priority))}</span></td><td><span class="ap-status ${statusClass(x.status)}">${esc(label(x.status))}</span></td><td><div class="ns-fu-row-actions">${actions}<button class="ap-btn mini" type="button" data-fu-history="${esc(x.id)}">History</button><button class="ap-btn mini" type="button" data-fu-communication="${esc(x.id)}">Draft message</button></div></td></tr>`;}).join('')||'<tr><td colspan="7"><div class="ap-empty">No follow-ups match this view.</div></td></tr>';
 $$('[data-fu-edit]',host).forEach(b=>b.onclick=()=>editor(b.dataset.fuEdit));$$('[data-fu-status]',host).forEach(b=>b.onclick=()=>setStatus(b.dataset.fuId,b.dataset.fuStatus));$$('[data-fu-history]',host).forEach(b=>b.onclick=()=>history(b.dataset.fuHistory));$$('[data-fu-communication]',host).forEach(b=>b.onclick=()=>communication(b.dataset.fuCommunication));
}
function claimAdd(){const current=$('#apFollowupAdd');if(!current)return null;if(current.dataset.nsFollowupOwner==='1')return current;const owned=current.cloneNode(true);owned.dataset.nsFollowupOwner='1';current.replaceWith(owned);owned.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();editor();},true);return owned;}
function repair(){clearTimeout(repairTimer);repairTimer=setTimeout(()=>{claimAdd();render();},0);}
function installStyle(){if($('#nsFollowupStyle'))return;const css=document.createElement('style');css.id='nsFollowupStyle';css.textContent='.ns-fu-row-actions,.ns-fu-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.ns-fu-actions{justify-content:flex-end;margin-top:12px}.ns-fu-block{display:block;color:#697168;margin-top:3px}.ns-fu-overdue{color:#ad2f25}.ns-fu-impact{padding:10px;border-radius:10px;background:#f7f3e8;color:#5e665d;font-size:11px}.ns-fu-history{display:grid;gap:8px}.ns-fu-history article{display:grid;gap:3px;padding:11px;border:1px solid #dfe5dd;border-radius:10px}.ns-fu-history span,.ns-fu-history small{color:#667064}.ap-view[data-view="followups"] .ap-table-wrap{overflow:auto}.ap-view[data-view="followups"] .ap-table{min-width:980px}@media(max-width:760px){#apFollowupToolbar{align-items:stretch}#apFollowupToolbar .ap-filter{width:100%}}';document.head.appendChild(css);}
function init(){installStyle();claimAdd();['#apFollowupSearch','#apFollowupStatusFilter','#apFollowupAssigneeFilter'].forEach(sel=>$(sel)?.addEventListener(sel.includes('Search')?'input':'change',render));$('#apRole')?.addEventListener('change',render);['nsv421:change','nsv421:operational-synced','nsv421:followups-synced','nsv421:production-ready'].forEach(name=>window.addEventListener(name,repair));const root=$('.ap-content')||document.body;new MutationObserver(()=>{const b=$('#apFollowupAdd');if(b&&b.dataset.nsFollowupOwner!=='1')repair();}).observe(root,{childList:true,subtree:true});render();window.NSV421Followups.ready=true;window.dispatchEvent(new CustomEvent('nsv421:followups-ready'));}
window.NSV421Followups={ready:false,render,editor,history,setStatus,get role(){return role();},get canWrite(){return canWrite();}};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
