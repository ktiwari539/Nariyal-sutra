(function(){
'use strict';
const Store=window.NSV421Store;
if(!Store)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(){return Store.load();}
function commit(s,action,target){try{Store.audit(s,action,target||'');}catch(e){}Store.save(s);}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2400);}
function modal(title,sub,body){const box=$('#apModal');if(!box)return;$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;box.classList.add('is-open');}
function closeModal(){$('#apModal')?.classList.remove('is-open');}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:type||'text/plain;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
function downloadCSV(name,rows,cols){const out='\uFEFF'+[cols.join(','),...rows.map(r=>cols.map(c=>csvCell(r[c])).join(','))].join('\n');download(name,out,'text/csv;charset=utf-8');}
function nowStamp(){return new Date().toISOString().replace(/[:.]/g,'-');}

function orderFilter(){
 const s=state(), q=($('#apOrderSearch')?.value||'').trim().toLowerCase(), status=$('#apOrderStatusFilter')?.value||'All statuses', pay=$('#apOrderPaymentFilter')?.value||'All payment states';
 return (s.orders||[]).filter(o=>(!q||[o.id,o.customer,o.product,o.delivery,o.payment].join(' ').toLowerCase().includes(q))&&(status==='All statuses'||String(o.delivery).toLowerCase()===status.toLowerCase())&&(pay==='All payment states'||String(o.payment).toLowerCase()===pay.toLowerCase()));
}
function applyOrderFilter(){
 const rows=orderFilter();const wanted=new Set(rows.map(o=>o.id));
 $$('#apOrdersBody tr').forEach(tr=>{const id=tr.querySelector('td')?.textContent?.trim();tr.hidden=id&&!wanted.has(id);});
 return rows;
}
function bindOrderFilters(){
 ['apOrderSearch','apOrderStatusFilter','apOrderPaymentFilter'].forEach(id=>{const e=$('#'+id);if(!e)return;e.addEventListener(e.tagName==='INPUT'?'input':'change',()=>{clearDateButtons();applyOrderFilter();});});
}
function clearDateButtons(){$('#apOrderToday')?.classList.remove('is-active');$('#apOrderWeek')?.classList.remove('is-active');}
function historyModal(kind){
 const s=state(), terms=kind==='price'?['product','price']:['inventory','stock','sku'];
 const arr=(s.audit||[]).filter(a=>terms.some(t=>String(a.action||'').toLowerCase().includes(t))).slice(0,60);
 modal(kind==='price'?'Price history':'Stock history','Recent local Admin change history',arr.length?`<div class="ap-v35-history">${arr.map(a=>`<div><strong>${esc(a.action)}</strong><span>${esc(a.target||'')} · ${new Date(a.at).toLocaleString()} · ${esc(a.actor||'Admin')}</span></div>`).join('')}</div>`:'<div class="ap-v35-empty">No matching changes yet. Make an edit and it will appear here.</div>');
}
function exportSnapshot(){
 const s=state();
 const snapshot={exportedAt:new Date().toISOString(),schemaVersion:s.schemaVersion,homepageSections:(s.sections||[]).map(({id,title,visible,order,motion})=>({id,title,visible,order,motion})),pageSequences:s.pageSequences||{},mediaStatusCounts:(s.media||[]).reduce((a,m)=>(a[m.status]=(a[m.status]||0)+1,a),{}),schedule:(s.schedule||[]).map(({id,title,state,page,sectionId,mediaId,startAt,endAt})=>({id,title,state,page,sectionId,mediaId,startAt,endAt})),publishing:{content:(s.content||[]).map(({id,title,state,page})=>({id,title,state,page})),settings:{duplicateGuard:s.settings?.duplicateGuard,defaultMediaFilter:s.settings?.defaultMediaFilter,telegramEnabled:s.settings?.telegramEnabled,communitySubmissionsEnabled:s.settings?.communitySubmissionsEnabled}}};
 download('nariyal-sutra-config-'+nowStamp()+'.json',JSON.stringify(snapshot,null,2),'application/json');toast('Configuration snapshot exported.');
}
function assistedOrder(){
 const s=state(), options=(s.products||[]).map(p=>`<option value="${esc(p.sku)}">${esc(p.name)}</option>`).join('');
 modal('Create assisted order','Creates a local Admin order draft; customer login is not required.',`<form class="ap-form" id="v35OrderForm"><div class="ap-field"><label>Customer</label><input name="customer" required placeholder="Customer / guest name"></div><div class="ap-row"><div class="ap-field"><label>Product</label><select name="sku">${options}</select></div><div class="ap-field"><label>Quantity</label><input name="qty" type="number" min="1" value="1" required></div></div><div class="ap-row"><div class="ap-field"><label>Payment</label><select name="payment"><option>Awaiting</option><option>Paid</option><option>COD</option></select></div><div class="ap-field"><label>Delivery</label><select name="delivery"><option>Preparing</option><option>Confirmed</option><option>Out for delivery</option></select></div></div><button class="ap-btn primary" type="submit">Create order</button></form>`);
 $('#v35OrderForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),sku=f.get('sku'),p=(s.products||[]).find(x=>x.sku===sku)||s.products?.[0],qty=Math.max(1,+f.get('qty')||1),unit=+p?.retail||+p?.bulk||0,id='NS-'+String(Date.now()).slice(-6);s.orders.unshift({id,customer:f.get('customer'),product:p?.name||sku,qty,payment:f.get('payment'),delivery:f.get('delivery'),total:unit*qty,createdAt:new Date().toISOString()});commit(s,'Assisted order created',id);closeModal();toast(id+' created.');};
}
function followup(){
 const s=state();s.followups=s.followups||[];
 modal('Add follow-up','Creates an owned customer-success action.',`<form class="ap-form" id="v35FollowupForm"><div class="ap-field"><label>Customer / account</label><input name="customer" required></div><div class="ap-field"><label>Reason</label><input name="reason" required></div><div class="ap-row"><div class="ap-field"><label>Owner</label><select name="owner"><option>Sales</option><option>Support</option><option>Krishna</option><option>Operations</option></select></div><div class="ap-field"><label>Due</label><input name="due" type="datetime-local" required></div></div><div class="ap-field"><label>Priority</label><select name="priority"><option>Normal</option><option>High</option><option>Opportunity</option></select></div><button class="ap-btn primary" type="submit">Add follow-up</button></form>`);
 $('#v35FollowupForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),x={id:'FU-'+Date.now(),customer:f.get('customer'),reason:f.get('reason'),owner:f.get('owner'),due:f.get('due'),priority:f.get('priority'),status:'Open'};s.followups.unshift(x);s.tasks=s.tasks||[];s.tasks.unshift({id:x.id,title:x.reason+' · '+x.customer,owner:x.owner,due:String(x.due).slice(0,10),state:'Open'});commit(s,'Follow-up created',x.customer);closeModal();toast('Follow-up added.');};
}
function notifications(){
 const s=state(), q=s.notificationQueue||[], pending=(s.content||[]).filter(x=>['DRAFT','IN_REVIEW','SCHEDULED'].includes(x.state));
 const items=[...q.map(x=>({t:x.subject||x.title||'Publication notice',m:x.channel||x.state||'Queued'})),...pending.map(x=>({t:x.title,m:'Content · '+x.state}))];
 modal('Notifications',items.length?items.length+' item(s) need attention':'Nothing pending',items.length?`<div class="ap-v35-history">${items.slice(0,30).map(x=>`<div><strong>${esc(x.t)}</strong><span>${esc(x.m)}</span></div>`).join('')}</div>`:'<div class="ap-v35-empty">No pending notifications.</div>');
}
function seoExport(){
 const rows=[{page:'/coconut-water',score:96,indexing:'Indexable'},{page:'/fresh-tender-coconut.html',score:93,indexing:'Indexable'},{page:'/green-coconut.html',score:91,indexing:'Indexable'},{page:'/people-of-nariyal-sutra.html',score:88,indexing:'Indexable'}];
 downloadCSV('nariyal-sutra-seo-audit-'+nowStamp()+'.csv',rows,['page','score','indexing']);toast('SEO audit exported.');
}
function report(type){
 const s=state();
 if(type==='orders') return downloadCSV('nariyal-sutra-orders-'+nowStamp()+'.csv',s.orders||[],['id','customer','product','qty','payment','delivery','total']);
 if(type==='customers') return downloadCSV('nariyal-sutra-customers-'+nowStamp()+'.csv',[s.customer||{}],['id','name','email','mobile','location','owner','followup']);
 const rows=(s.audit||[]).map(a=>({at:a.at,action:a.action,target:a.target||'',actor:a.actor||''}));return downloadCSV('nariyal-sutra-audit-'+nowStamp()+'.csv',rows,['at','action','target','actor']);
}
function quickCreate(e){
 const b=e.target.closest('[data-q]');if(!b)return;
 const q=b.dataset.q;closeModal();
 if(q==='order')assistedOrder();
 else if(q==='media')$('#apNewMediaPicker')?.click();
 else if(q==='content')$('#apNewContent')?.click();
 else if(q==='task')$('#apTaskAdd')?.click();
}
function bind(){
 $('#apExportSnapshot')?.addEventListener('click',exportSnapshot);
 $('#apOrdersExport')?.addEventListener('click',()=>{const rows=applyOrderFilter();downloadCSV('nariyal-sutra-orders-filtered-'+nowStamp()+'.csv',rows,['id','customer','product','qty','payment','delivery','total']);toast(rows.length+' order(s) exported.');});
 $('#apAssistedOrder')?.addEventListener('click',assistedOrder);
 $('#apProductAudit')?.addEventListener('click',()=>historyModal('price'));
 $('#apInventoryAudit')?.addEventListener('click',()=>historyModal('stock'));
 $('#apNotifications')?.addEventListener('click',notifications);
 $('#apFollowupAdd')?.addEventListener('click',followup);
 $('#apPreviewSite')?.addEventListener('click',()=>window.open('index.html','_blank','noopener'));
 $('#apSeoExport')?.addEventListener('click',seoExport);
 $('#apReportOrders')?.addEventListener('click',()=>{report('orders');toast('Orders report downloaded.');});
 $('#apReportCustomers')?.addEventListener('click',()=>{report('customers');toast('Customer report downloaded.');});
 $('#apReportAudit')?.addEventListener('click',()=>{report('audit');toast('Audit report downloaded.');});
 $('#apOrderToday')?.addEventListener('click',e=>{clearDateButtons();e.currentTarget.classList.add('is-active');applyOrderFilter();toast('Showing current local order set for today.');});
 $('#apOrderWeek')?.addEventListener('click',e=>{clearDateButtons();e.currentTarget.classList.add('is-active');applyOrderFilter();toast('Showing current local order set for this week.');});
 bindOrderFilters();
 document.addEventListener('click',quickCreate);
 /* No silent decorative buttons: any remaining enabled Admin button without a known action explains itself. */
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.closest('#apModal')||b.dataset.view||b.dataset.go||b.dataset.q)return;const known=b.id||b.hasAttribute('data-prod')||b.hasAttribute('data-stock')||b.hasAttribute('data-node')||b.hasAttribute('data-service')||b.hasAttribute('data-content')||b.hasAttribute('data-story')||b.hasAttribute('data-media')||b.hasAttribute('data-v29-up')||b.hasAttribute('data-v29-down')||b.hasAttribute('data-v29-vis')||b.hasAttribute('data-up')||b.hasAttribute('data-down')||b.hasAttribute('data-vis');if(known)return;if(!b.dataset.v35Notified){b.dataset.v35Notified='1';toast('This control is display-only in this preview.');}},true);
}
function init(){bind();setTimeout(applyOrderFilter,100);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
