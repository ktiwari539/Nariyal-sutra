(function(){
'use strict';
if(window.__NS_V421_ADMIN_COMMUNICATION_RUNTIME__)return;
const Store=window.NSV421Store;
if(!Store){console.error('[Communication] Admin store is not ready.');return;}
window.__NS_V421_ADMIN_COMMUNICATION_RUNTIME__=true;
window.__NS_V421_ADMIN_COMMUNICATION__=true;
window.__NS_V421_ADMIN_V38__=true; // compatibility for older readiness checks

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const local=()=>/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
const role=()=>$('#apRole')?.value||Store.getSession?.()?.role||'Owner';
const actor=()=>$('#apUserName')?.textContent||role();
let readyState=false,repairTimer=0;

function state(){const s=Store.load();s.communications=Array.isArray(s.communications)?s.communications:[];return s;}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2800);}
function modal(title,sub,body){const box=$('#apModal');if(!box)return false;$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;box.classList.add('is-open','ap-modal-wide');return true;}
function close(){const box=$('#apModal');box?.classList.remove('is-open','ap-modal-wide');}
function uid(){return'COM-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
function canManage(){return['Owner','Admin','Manager','Support','Sales'].includes(role());}
function canApprove(){return['Owner','Admin','Manager'].includes(role());}
function destinationReady(c){if(c.channel==='Email')return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.destination||'');if(c.channel==='WhatsApp')return/^\d{8,15}$/.test(String(c.destination||'').replace(/\D/g,''));return/^@?[A-Za-z0-9_]{5,32}$/.test(c.destination||'');}
function providerPosture(c){if(!destinationReady(c))return'Blocked · valid destination required';if(c.channel==='WhatsApp')return'Ready · opens a prefilled WhatsApp handoff; final send remains with the user';if(c.channel==='Telegram')return'Ready · opens the exact Telegram username; no phone inference';if(local())return'Preview only · external email is blocked locally';return window.NS_ADMIN_EMAIL_ENDPOINT?'Ready · authenticated Admin email endpoint configured':'Gated · authenticated Admin email endpoint not configured';}
function statusClass(x){return/Sent|Approved/.test(x)?'green':/Failed|Needs review/.test(x)?'gold':'gray';}
function save(s,action,target){Store.audit?.(s,action,target||'');Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));toast(action);setTimeout(render,20);}

function render(){
 const host=$('#apCommunicationQueue');if(!host)return;
 const s=state();host.closest('.ap-card')?.style.setProperty('grid-column','1/-1');
 host.innerHTML='<div class="v38-toolbar"><input id="v38Q" class="ap-filter" placeholder="Search recipient, order or purpose"><select id="v38Status" class="ap-filter"><option>All statuses</option><option>Draft</option><option>Needs review</option><option>Approved</option><option>Sent</option><option>Failed</option></select><label><input id="v38Archived" type="checkbox"> Show archived</label></div><div id="v38Rows"></div>';
 function draw(){
  const q=($('#v38Q')?.value||'').toLowerCase(),filter=$('#v38Status')?.value||'All statuses',showArchived=!!$('#v38Archived')?.checked;
  const rows=s.communications.filter(c=>(showArchived||!c.archivedAt)&&(filter==='All statuses'||c.status===filter)&&(!q||[c.recipient,c.destination,c.orderId,c.purpose,c.subject,c.owner].join(' ').toLowerCase().includes(q)));
  $('#v38Rows').innerHTML=rows.map(c=>`<article class="v38-comm"><div class="v38-head"><div><strong>${esc(c.recipient||'Unnamed recipient')}</strong><span>${esc(c.channel||'—')} · ${esc(c.purpose||'General follow-up')}${c.orderId?' · '+esc(c.orderId):''}</span></div><span class="ap-status ${statusClass(c.status||'Draft')}">${esc(c.archivedAt?'Archived · '+(c.status||'Draft'):(c.status||'Draft'))}</span></div><div class="v38-meta"><span>${esc(c.destination||'No destination')}</span><span>Owner: ${esc(c.owner||'Unassigned')}</span>${c.scheduledAt?`<span>Scheduled: ${esc(c.scheduledAt)}</span>`:''}</div><div class="v38-provider">${esc(providerPosture(c))}</div><div class="v38-actions"><button class="ap-btn mini" type="button" data-comm-open="${c.id}">${['Draft','Failed'].includes(c.status)?'Edit':'Open'}</button><button class="ap-btn mini" type="button" data-comm-preview="${c.id}">Preview</button><button class="ap-btn mini" type="button" data-comm-dup="${c.id}">Duplicate</button>${c.status==='Draft'?`<button class="ap-btn mini" type="button" data-comm-review="${c.id}">Submit for review</button>`:''}${c.status==='Needs review'&&canApprove()?`<button class="ap-btn mini primary" type="button" data-comm-approve="${c.id}">Approve</button>`:''}${c.status==='Approved'?`<button class="ap-btn mini primary" type="button" data-comm-send="${c.id}">${c.channel==='Email'?'Send email':'Open '+esc(c.channel)}</button>`:''}<button class="ap-btn mini" type="button" data-comm-archive="${c.id}">${c.archivedAt?'Restore':'Archive'}</button>${c.status==='Draft'&&!c.sentAt&&role()==='Owner'?`<button class="ap-btn mini danger" type="button" data-comm-delete="${c.id}">Delete draft</button>`:''}</div></article>`).join('')||'<div class="ap-empty">No communication records match this view.</div>';
  bindRows(s);
 }
 $('#v38Q').oninput=draw;$('#v38Status').onchange=draw;$('#v38Archived').onchange=draw;draw();
}

function bindRows(s){
 $$('[data-comm-open]').forEach(b=>b.onclick=()=>composer(b.dataset.commOpen));
 $$('[data-comm-preview]').forEach(b=>b.onclick=()=>preview(b.dataset.commPreview));
 $$('[data-comm-dup]').forEach(b=>b.onclick=()=>{const c=s.communications.find(x=>x.id===b.dataset.commDup);if(!c)return;const n={...c,id:uid(),status:'Draft',sentAt:null,failedAt:null,archivedAt:null,approvedAt:null,approvedBy:null,createdAt:new Date().toISOString(),createdBy:actor(),updatedAt:new Date().toISOString(),updatedBy:actor()};s.communications.unshift(n);save(s,'Communication duplicated',n.id);});
 $$('[data-comm-review]').forEach(b=>b.onclick=()=>{const c=s.communications.find(x=>x.id===b.dataset.commReview);if(!c)return;if(!destinationReady(c)||!String(c.message||'').trim())return toast('Complete a valid destination and message before review.');c.status='Needs review';c.updatedAt=new Date().toISOString();c.updatedBy=actor();save(s,'Communication submitted for review',c.id);});
 $$('[data-comm-approve]').forEach(b=>b.onclick=()=>{const c=s.communications.find(x=>x.id===b.dataset.commApprove);if(!c||!canApprove())return toast('This role cannot approve communications.');c.status='Approved';c.approvedAt=new Date().toISOString();c.approvedBy=actor();save(s,'Communication approved',c.id);});
 $$('[data-comm-send]').forEach(b=>b.onclick=()=>send(b.dataset.commSend));
 $$('[data-comm-archive]').forEach(b=>b.onclick=()=>{const c=s.communications.find(x=>x.id===b.dataset.commArchive);if(!c)return;c.archivedAt=c.archivedAt?null:new Date().toISOString();save(s,c.archivedAt?'Communication archived':'Communication restored',c.id);});
 $$('[data-comm-delete]').forEach(b=>b.onclick=()=>{const c=s.communications.find(x=>x.id===b.dataset.commDelete);if(!c)return;if(role()!=='Owner'||c.status!=='Draft'||c.sentAt)return toast('Only Owner can delete an unsent draft.');if(!confirm(`Delete unsent draft for ${c.recipient||'this recipient'}?`))return;s.communications=s.communications.filter(x=>x.id!==c.id);save(s,'Unsent communication draft deleted',c.id);});
}

function composer(id){
 if(!canManage())return toast('This role cannot create or edit communications.');
 const s=state(),existing=id?s.communications.find(x=>x.id===id):null;
 if(existing&&!['Draft','Failed'].includes(existing.status))return preview(existing.id);
 const c=existing||{id:uid(),purpose:'General follow-up',recipient:'',destination:'',orderId:'',channel:'WhatsApp',subject:'',message:'',owner:actor(),scheduledAt:'',status:'Draft'};
 if(!modal(existing?'Edit communication':'New communication','Nothing is created or sent until Save draft.',`<form class="ap-form" id="v38Form"><div class="ap-row"><div class="ap-field"><label>Purpose / type</label><select name="purpose">${['Order follow-up','Delivery update','Payment reminder','Hospitality quote','Customer support','General follow-up'].map(x=>`<option ${x===c.purpose?'selected':''}>${x}</option>`).join('')}</select></div><div class="ap-field"><label>Channel</label><select name="channel">${['Email','WhatsApp','Telegram'].map(x=>`<option ${x===c.channel?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="ap-row"><div class="ap-field"><label>Recipient *</label><input name="recipient" required maxlength="160" value="${esc(c.recipient)}"></div><div class="ap-field"><label>Destination *</label><input name="destination" required maxlength="180" value="${esc(c.destination)}"></div></div><div class="ap-row"><div class="ap-field"><label>Order ID (optional)</label><input name="orderId" maxlength="80" value="${esc(c.orderId)}"></div><div class="ap-field"><label>Owner / assignee</label><input name="owner" maxlength="120" value="${esc(c.owner||actor())}"></div></div><div class="ap-field"><label>Schedule (optional)</label><input name="scheduledAt" type="datetime-local" value="${esc(c.scheduledAt||'')}"></div><div class="ap-field"><label>Subject</label><input name="subject" maxlength="200" value="${esc(c.subject)}"></div><div class="ap-field"><label>Message *</label><textarea name="message" required maxlength="2000">${esc(c.message)}</textarea></div><div class="v38-impact"><strong>Impact</strong><span>Save creates or updates an internal Draft only. Review and explicit approval are required before any send/handoff action.</span></div><div class="v38-actions"><button type="button" class="ap-btn" data-comm-cancel>Cancel</button><button type="button" class="ap-btn" id="v38PreviewDraft">Preview</button><button class="ap-btn primary" type="submit">Save draft</button></div></form>`))return;
 const form=$('#v38Form');if(!form)return;
 const values=()=>Object.fromEntries(new FormData(form).entries());
 form.querySelector('[data-comm-cancel]')?.addEventListener('click',e=>{e.preventDefault();close();});
 $('#v38PreviewDraft')?.addEventListener('click',()=>show({...c,...values()}));
 form.addEventListener('submit',e=>{e.preventDefault();const v=values();if(v.channel==='Email'&&!String(v.subject||'').trim())return toast('Email subject is required.');if(!String(v.recipient||'').trim()||!String(v.destination||'').trim()||!String(v.message||'').trim())return toast('Recipient, destination and message are required.');Object.assign(c,v,{status:'Draft',updatedAt:new Date().toISOString(),updatedBy:actor()});if(!existing){c.createdAt=c.updatedAt;c.createdBy=actor();s.communications.unshift(c);}close();save(s,existing?'Communication draft updated':'Communication draft created',c.id);});
}

function show(c){modal('Communication preview',`${c.channel||'Channel'} · zero automatic sends`,`<div class="v38-preview"><small>Recipient</small><strong>${esc(c.recipient||'—')}</strong><span>${esc(c.destination||'—')}</span>${c.orderId?`<span>Order: ${esc(c.orderId)}</span>`:''}${c.subject?`<h3>${esc(c.subject)}</h3>`:''}<p>${esc(c.message||'No message yet').split('\n').join('<br>')}</p><div class="v38-provider">${esc(providerPosture(c))}</div></div>`);}
function preview(id){const c=state().communications.find(x=>x.id===id);if(c)show(c);}
async function send(id){const s=state(),c=s.communications.find(x=>x.id===id);if(!c||c.status!=='Approved')return toast('Communication must be approved first.');if(!destinationReady(c))return toast('Destination is not ready.');if(c.channel==='WhatsApp'){window.open(`https://wa.me/${String(c.destination).replace(/\D/g,'')}?text=${encodeURIComponent(c.message||'')}`,'_blank','noopener');return save(s,'Approved WhatsApp handoff opened',c.id);}if(c.channel==='Telegram'){window.open(`https://t.me/${encodeURIComponent(String(c.destination).replace(/^@/,''))}`,'_blank','noopener');return save(s,'Approved Telegram handoff opened',c.id);}if(local())return toast('Preview only · external email is blocked locally.');if(!window.NS_ADMIN_EMAIL_ENDPOINT)return toast('Gated · authenticated Admin email endpoint not configured.');toast('Email endpoint is configured; provider send remains protected by the production bridge.');}

function claimNewCommunicationControl(){
 const current=$('#apCommunicationNew');if(!current)return null;
 if(current.dataset.nsCommunicationOwner==='1')return current;
 const owned=current.cloneNode(true);
 owned.dataset.nsCommunicationOwner='1';
 current.replaceWith(owned); // removes legacy target listeners instead of racing them
 owned.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();composer();},true);
 return owned;
}
function repairOwnership(){clearTimeout(repairTimer);repairTimer=setTimeout(()=>{claimNewCommunicationControl();render();},0);}
function installStyle(){if($('#nsCommunicationStyle'))return;const css=document.createElement('style');css.id='nsCommunicationStyle';css.textContent='.v38-toolbar,.v38-head,.v38-meta,.v38-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.v38-toolbar{margin-bottom:12px}.v38-comm{border:1px solid #dfe5dd;border-radius:12px;padding:12px;margin:8px 0;background:#fff}.v38-head{justify-content:space-between}.v38-head div{display:grid;gap:3px}.v38-head span,.v38-meta,.v38-provider{font-size:10px;color:#667064}.v38-meta{margin:8px 0}.v38-provider{padding:7px 9px;background:#f5f7f4;border-radius:8px;margin:7px 0}.v38-impact{display:grid;gap:3px;padding:10px;border-radius:10px;background:#f7f3e8;font-size:10px;margin:10px 0}';document.head.appendChild(css);}
function init(){installStyle();claimNewCommunicationControl();render();window.addEventListener('nsv421:change',repairOwnership);const root=$('.ap-content')||document.body;new MutationObserver(()=>{const b=$('#apCommunicationNew');if(b&&b.dataset.nsCommunicationOwner!=='1')repairOwnership();}).observe(root,{childList:true,subtree:true});readyState=true;window.NSV421CommunicationAdmin.ready=true;window.dispatchEvent(new CustomEvent('nsv421:communication-ready'));}

window.NSV421CommunicationAdmin={ready:false,composer,preview,render,claimNewCommunicationControl,repairOwnership,get role(){return role();}};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
