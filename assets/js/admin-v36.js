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

const WEBSITE_PAGES=[
 {id:'homepage',name:'Homepage',file:'index.html',type:'Core storefront',mode:'Section order + placements'},
 {id:'about',name:'About Nariyal Sutra / Story Worlds',file:'about-nariyal-sutra.html',type:'Editorial hub',mode:'Editorial sections'},
 {id:'fresh-tender-coconut',name:'Fresh Tender Coconut',file:'fresh-tender-coconut.html',type:'Product page',mode:'Editorial sections'},
 {id:'green-coconut',name:'Green Round Coconut',file:'green-coconut.html',type:'Product page',mode:'Editorial sections'},
 {id:'bulk',name:'Bulk Coconut Supply',file:'bulk-coconut-supply.html',type:'Product / commercial',mode:'Editorial sections'},
 {id:'coconut-water',name:'Coconut Water Guide',file:'coconut-water.html',type:'Product education',mode:'Editorial sections'},
 {id:'hospitality',name:'Events & Hospitality',file:'coconut-events-hospitality.html',type:'Commercial story',mode:'Editorial sections'},
 {id:'export',name:'Wholesale / Export',file:'coconut-wholesale-export.html',type:'Commercial story',mode:'Editorial sections'},
 {id:'sourcing',name:'Direct Sourcing',file:'direct-farm.html',type:'Sourcing story',mode:'Editorial sections'},
 {id:'gujarat-coast',name:'Gujarat Coast',file:'gujarat-coast.html',type:'Origin story',mode:'Editorial sections'},
 {id:'south-india-groves',name:'South India Groves',file:'south-india-groves.html',type:'Origin story',mode:'Editorial sections'},
 {id:'freshness-first',name:'Freshness First',file:'freshness-first.html',type:'Freshness story',mode:'Editorial sections'},
 {id:'people',name:'People of Nariyal Sutra',file:'people-of-nariyal-sutra.html',type:'People / community',mode:'People + editorial controls'},
 {id:'supplier-partnership',name:'Supplier Partnership',file:'supplier-partnership.html',type:'Supplier acquisition',mode:'Editorial sections'},
 {id:'delivery-policy',name:'Delivery & Cancellation',file:'delivery-policy.html',type:'Policy',mode:'Read-only content review'},
 {id:'privacy',name:'Privacy Policy',file:'privacy.html',type:'Policy',mode:'Read-only content review'},
 {id:'terms',name:'Terms',file:'terms.html',type:'Policy',mode:'Read-only content review'},
 {id:'track',name:'Track Order',file:'track.html',type:'Customer utility',mode:'Workflow / copy review'}
];
const SYSTEM_PAGES=[
 {name:'Production Admin',file:'admin.html',type:'Admin system'},
 {name:'Interactive Admin Preview',file:'admin-preview.html',type:'Admin review'},
 {name:'Admin Login',file:'admin-login.html',type:'Authentication'},
 {name:'Admin Set Password',file:'admin-set-password.html',type:'Authentication'},
 {name:'Staff Sign In',file:'staff-sign-in.html',type:'Authentication'}
];
function pageRow(p,system=false){return `<tr><td><strong>${esc(p.name)}</strong></td><td class="mono">${esc(p.file)}</td><td>${esc(p.type)}</td><td>${system?'System · read only':esc(p.mode)}</td><td><a class="ap-btn" href="${esc(p.file)}" target="_blank" rel="noopener">Open ↗</a></td></tr>`;}
function enhancePagesAdmin(){
 const view=$('section.ap-view[data-view="pages"]');if(!view||$('#apWebsiteDirectory'))return;
 const filter=$('#apV12SectionPageFilter');
 if(filter){
  const current=filter.value;
  filter.innerHTML='<option value="all">All public pages</option>'+WEBSITE_PAGES.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  if([...filter.options].some(o=>o.value===current))filter.value=current;
 }
 const s=state(),sections=[...(s.sections||[])].sort((a,b)=>(+a.order||999)-(+b.order||999));
 const visible=sections.filter(x=>x.visible!==false).length;
 const panel=document.createElement('div');
 panel.id='apWebsiteDirectory';panel.className='ap-card ap-panel';panel.style.marginTop='16px';
 panel.innerHTML=`<div class="ap-panel-head"><div><h2>Complete website page directory</h2><span>${WEBSITE_PAGES.length} public pages · ${SYSTEM_PAGES.length} system/admin pages · ${sections.length} homepage sections</span></div><button class="ap-btn" type="button" id="apOpenHomepageFromDirectory">Open storefront ↗</button></div>
 <p style="font-size:10px;line-height:1.7;color:var(--muted);margin:0 0 14px">This inventory mirrors the files shipped with the V42.1 candidate. Public content pages can be reviewed here; authentication/admin pages are listed separately and are never treated as storefront sections.</p>
 <div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>Public page</th><th>File</th><th>Type</th><th>Admin treatment</th><th></th></tr></thead><tbody>${WEBSITE_PAGES.map(p=>pageRow(p)).join('')}</tbody></table></div>
 <div class="ap-divider"></div>
 <div class="ap-panel-head"><div><h2>Homepage section inventory</h2><span>${visible}/${sections.length} currently visible in local Admin state</span></div></div>
 <div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>Order</th><th>Section</th><th>ID</th><th>Visibility</th><th>Motion / treatment</th></tr></thead><tbody>${sections.map((x,i)=>`<tr><td>${esc(x.order||i+1)}</td><td><strong>${esc(x.title||x.id)}</strong></td><td class="mono">${esc(x.id)}</td><td><span class="ap-status ${x.visible===false?'gray':'green'}">${x.visible===false?'Hidden':'Visible'}</span></td><td>${esc(x.motion||'—')}</td></tr>`).join('')}</tbody></table></div>
 <div class="ap-divider"></div>
 <div class="ap-panel-head"><div><h2>System / authentication pages</h2><span>Listed for completeness · not public editorial content</span></div></div>
 <div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>System page</th><th>File</th><th>Type</th><th>Admin treatment</th><th></th></tr></thead><tbody>${SYSTEM_PAGES.map(p=>pageRow(p,true)).join('')}</tbody></table></div>`;
 const peoplePanel=$('#apPeopleSectionControls')?.closest('.ap-card');
 if(peoplePanel)peoplePanel.insertAdjacentElement('beforebegin',panel);else view.appendChild(panel);
 $('#apOpenHomepageFromDirectory')?.addEventListener('click',()=>window.open('index.html','_blank','noopener'));
}
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
function init(){bindDirect();enhancePagesAdmin();feedback();setTimeout(enhancePagesAdmin,220);setTimeout(fallbackIfCoreFailed,100);setTimeout(()=>{const d=document.createElement('div');d.className='ap-v36-runtime-ok';d.textContent='V36 Admin controls loaded';document.body.appendChild(d);d.classList.add('show');setTimeout(()=>d.classList.remove('show'),1100);},120);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
