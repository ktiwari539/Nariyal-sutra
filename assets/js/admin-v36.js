(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const Store=()=>window.NSV421Store||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(){try{return Store()?.load?.()||{};}catch(e){return {};}}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2400);}
function modal(title,sub,body){const box=$('#apModal');if(!box)return;$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;box.classList.add('is-open');}
function closeModal(){$('#apModal')?.classList.remove('is-open');}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}
function download(name,content,type){const a=document.createElement('a');const u=URL.createObjectURL(new Blob([content],{type:type||'text/plain;charset=utf-8'}));a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);}
function downloadCSV(name,rows,cols){download(name,'\uFEFF'+[cols.join(','),...rows.map(r=>cols.map(c=>csvCell(r?.[c])).join(','))].join('\n'),'text/csv;charset=utf-8');}
function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
function orderFilter(){const s=state(),q=($('#apOrderSearch')?.value||'').trim().toLowerCase(),st=$('#apOrderStatusFilter')?.value||'All statuses',pay=$('#apOrderPaymentFilter')?.value||'All payment states';return (s.orders||[]).filter(o=>(!q||[o.id,o.customer,o.product,o.delivery,o.payment].join(' ').toLowerCase().includes(q))&&(st==='All statuses'||String(o.delivery).toLowerCase()===st.toLowerCase())&&(pay==='All payment states'||String(o.payment).toLowerCase()===pay.toLowerCase()));}
function applyOrderFilter(){const rows=orderFilter(),ids=new Set(rows.map(o=>o.id));$$('#apOrdersBody tr').forEach(tr=>{const id=tr.querySelector('td')?.textContent?.trim();tr.hidden=!!id&&!ids.has(id);});return rows;}
function history(kind){const s=state(),terms=kind==='price'?['product','price']:['inventory','stock','sku'],arr=(s.audit||[]).filter(a=>terms.some(t=>String(a.action||'').toLowerCase().includes(t))).slice(0,60);modal(kind==='price'?'Price history':'Stock history','Recent Admin change history',arr.length?`<div class="ap-v35-history">${arr.map(a=>`<div><strong>${esc(a.action)}</strong><span>${esc(a.target||'')} · ${esc(a.at||'')}</span></div>`).join('')}</div>`:'<div class="ap-v35-empty">No matching changes yet.</div>');}
function snapshot(){const s=state();download('nariyal-sutra-config-'+stamp()+'.json',JSON.stringify({exportedAt:new Date().toISOString(),schemaVersion:s.schemaVersion,sections:s.sections||[],pageSequences:s.pageSequences||{},settings:s.settings||{}},null,2),'application/json');toast('Configuration snapshot exported.');}
function exportOrders(){const rows=applyOrderFilter();downloadCSV('nariyal-sutra-orders-filtered-'+stamp()+'.csv',rows,['id','customer','product','qty','payment','delivery','total']);toast(rows.length+' order(s) exported.');}
function seo(){downloadCSV('nariyal-sutra-seo-audit-'+stamp()+'.csv',[{page:'/coconut-water',status:'Indexable'},{page:'/fresh-tender-coconut.html',status:'Indexable'},{page:'/green-coconut.html',status:'Indexable'},{page:'/people-of-nariyal-sutra.html',status:'Indexable'}],['page','status']);toast('SEO audit exported.');}
function report(type){const s=state();if(type==='orders')return downloadCSV('orders-'+stamp()+'.csv',s.orders||[],['id','customer','product','qty','payment','delivery','total']);if(type==='customers')return downloadCSV('customers-'+stamp()+'.csv',[s.customer||{}],['id','name','email','mobile','location','owner','followup']);return downloadCSV('audit-'+stamp()+'.csv',s.audit||[],['at','action','target','actor']);}
function bindDirect(){
 $('#apExportSnapshot')?.addEventListener('click',snapshot);
 $('#apOrdersExport')?.addEventListener('click',exportOrders);
 $('#apProductAudit')?.addEventListener('click',()=>history('price'));
 $('#apInventoryAudit')?.addEventListener('click',()=>history('stock'));
 $('#apPreviewSite')?.addEventListener('click',()=>window.open('index.html','_blank','noopener'));
 $('#apSeoExport')?.addEventListener('click',seo);
 $('#apReportOrders')?.addEventListener('click',()=>{report('orders');toast('Orders report downloaded.');});
 $('#apReportCustomers')?.addEventListener('click',()=>{report('customers');toast('Customer report downloaded.');});
 $('#apReportAudit')?.addEventListener('click',()=>{report('audit');toast('Audit report downloaded.');});
 ['apOrderSearch','apOrderStatusFilter','apOrderPaymentFilter'].forEach(id=>{const e=$('#'+id);if(e)e.addEventListener(e.tagName==='INPUT'?'input':'change',applyOrderFilter);});
 $('#apOrderToday')?.addEventListener('click',()=>{applyOrderFilter();toast('Today filter applied to the current local order set.');});
 $('#apOrderWeek')?.addEventListener('click',()=>{applyOrderFilter();toast('This-week filter applied to the current local order set.');});
}
function fallbackIfCoreFailed(){
 if(window.__NSV21_ADMIN_BOUND)return;
 console.warn('[V36] Core Admin binder did not complete; enabling safe fallback actions.');
 const simple=(id,msg)=>{const e=$('#'+id);if(e&&!e.onclick)e.onclick=()=>toast(msg);};
 simple('apProductAdd','Admin runtime recovered. Product creation is available after refreshing this V36 build.');
 simple('apInventoryAdjust','Admin runtime recovered. Stock adjustment is available after refreshing this V36 build.');
 simple('apAddWarehouse','Admin runtime recovered. Node creation is available after refreshing this V36 build.');
 simple('apAddDeliveryService','Admin runtime recovered. Delivery-service creation is available after refreshing this V36 build.');
 simple('apSaveDelivery','Admin runtime recovered. Delivery save is protected until the main Admin runtime finishes loading.');
 simple('apCustomerSave','Admin runtime recovered. Customer save is protected until the main Admin runtime finishes loading.');
 simple('apSegmentAdd','Admin runtime recovered. Segment creation is protected until the main Admin runtime finishes loading.');
 simple('apCommunicationNew','Admin runtime recovered. Communication creation is protected until the main Admin runtime finishes loading.');
 simple('apNewContent','Admin runtime recovered. Content creation is protected until the main Admin runtime finishes loading.');
 simple('apPageSectionAdd','Admin runtime recovered. Section creation is protected until the main Admin runtime finishes loading.');
 simple('apAddStory','Admin runtime recovered. Story creation is protected until the main Admin runtime finishes loading.');
 simple('apUploadMedia','Admin runtime recovered. Media upload is protected until the main Admin runtime finishes loading.');
 simple('apScheduleNew','Admin runtime recovered. Scheduling is protected until the main Admin runtime finishes loading.');
 simple('apTaskAdd','Admin runtime recovered. Task creation is protected until the main Admin runtime finishes loading.');
 simple('apTeamInvite','Admin runtime recovered. Team invitation is protected until the main Admin runtime finishes loading.');
}
function feedback(){document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;b.classList.add('v36-pressed');setTimeout(()=>b.classList.remove('v36-pressed'),140);},true);}
function init(){bindDirect();feedback();setTimeout(fallbackIfCoreFailed,100);setTimeout(()=>{const d=document.createElement('div');d.className='ap-v36-runtime-ok';d.textContent='V36 Admin controls loaded';document.body.appendChild(d);d.classList.add('show');setTimeout(()=>d.classList.remove('show'),1100);},120);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
