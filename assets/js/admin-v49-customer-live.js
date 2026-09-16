(function(){
'use strict';
if(window.__NS_V421_ADMIN_CUSTOMER_LIVE__)return;
window.__NS_V421_ADMIN_CUSTOMER_LIVE__=true;
const Store=window.NSV421Store;
if(!Store)return;
const bridge=window.NSV421ProductionBridge;
if(!bridge?.isProduction)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN');
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});};
let selectedKey='';
let directory={people:[],stats:{}};

function injectStyle(){
 if($('#apV49CustomerStyle'))return;
 const s=document.createElement('style');s.id='apV49CustomerStyle';s.textContent=`
 .ap-v49-customer-shell{display:grid;grid-template-columns:minmax(280px,.78fr) minmax(0,1.22fr);gap:14px}.ap-v49-customer-list{display:flex;flex-direction:column;gap:7px;max-height:70vh;overflow:auto}.ap-v49-customer-row{width:100%;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);color:inherit;text-align:left;padding:11px;cursor:pointer}.ap-v49-customer-row.is-active{border-color:rgba(212,168,67,.55);background:rgba(212,168,67,.07)}.ap-v49-customer-row strong,.ap-v49-customer-row span,.ap-v49-customer-row small{display:block}.ap-v49-customer-row span{font-size:10px;color:var(--muted);margin-top:4px}.ap-v49-customer-row small{font-size:9px;color:#d4a843;margin-top:5px}.ap-v49-customer-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px}.ap-v49-kpi{padding:10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.02)}.ap-v49-kpi small{display:block;color:var(--muted);font-size:8px;text-transform:uppercase;letter-spacing:.1em}.ap-v49-kpi strong{display:block;margin-top:5px;font-size:16px}.ap-v49-badges{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.ap-v49-badge{font-size:8px;border:1px solid rgba(212,168,67,.22);padding:4px 6px;color:#d4a843}.ap-v49-order{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;gap:12px}.ap-v49-order:last-child{border-bottom:0}.ap-v49-order span{font-size:10px;color:var(--muted);text-align:right}.ap-v49-empty{padding:28px 16px;text-align:center;color:var(--muted);border:1px dashed rgba(255,255,255,.12)}@media(max-width:880px){.ap-v49-customer-shell{grid-template-columns:1fr}.ap-v49-customer-kpis{grid-template-columns:repeat(2,1fr)}}`;
 document.head.appendChild(s);
}
function state(){return Store.load();}
function crmFor(person){
 const rows=state().customerAdminRecords||[];
 return rows.find(x=>String(x.personKey||x.id||'')===String(person?.key||''))||{};
}
function build(){
 const api=window.NS_ADMIN_CUSTOMERS,s=state();
 if(!api?.buildDirectory){directory={people:[],stats:{}};return directory;}
 directory=api.buildDirectory(Array.isArray(s.customerProfiles)?s.customerProfiles:[],Array.isArray(s.orders)?s.orders:[]);
 if(selectedKey&&!directory.people.some(x=>x.key===selectedKey))selectedKey='';
 if(!selectedKey&&directory.people.length)selectedKey=directory.people[0].key;
 return directory;
}
function person(){return directory.people.find(x=>x.key===selectedKey)||directory.people[0]||null;}
function renderDetail(host,p){
 if(!p){host.innerHTML='<div class="ap-v49-empty"><strong>No production customers yet.</strong><br>Customer 360 will populate automatically from real customer profiles and guest orders.</div>';return;}
 const crm=crmFor(p),orders=p.orders||[],status=p.typeLabel||'Customer';
 host.innerHTML=`<div class="ap-panel-head"><div><h2>${esc(p.name||'Customer')}</h2><span>${esc(status)} · ${esc(p.uid||'guest checkout')}</span></div><span class="ap-status ${p.type==='registered'?'green':'gold'}">${esc(status)}</span></div>
 <div class="ap-v49-customer-kpis"><div class="ap-v49-kpi"><small>Total orders</small><strong>${Number(p.orderCount||0)}</strong></div><div class="ap-v49-kpi"><small>Lifetime value</small><strong>${money(p.lifetimeValue)}</strong></div><div class="ap-v49-kpi"><small>Active</small><strong>${Number(p.activeCount||0)}</strong></div><div class="ap-v49-kpi"><small>Delivered</small><strong>${Number(p.deliveredCount||0)}</strong></div></div>
 <div class="ap-detail-grid"><div class="ap-detail"><label>Email</label><span>${esc(p.email||'—')}</span></div><div class="ap-detail"><label>Phone / WhatsApp</label><span>${esc(p.phone||'—')}</span></div><div class="ap-detail"><label>Location</label><span>${esc([p.city,p.state,p.country,p.pin].filter(Boolean).join(', ')||'—')}</span></div><div class="ap-detail"><label>Preferred channel</label><span>${esc(p.preferredChannel||'—')}</span></div><div class="ap-detail"><label>Last activity</label><span>${esc(fmt(p.lastActivityAt))}</span></div><div class="ap-detail"><label>Assigned owner</label><span>${esc(crm.owner||crm.assignedOwner||'Unassigned')}</span></div></div>
 ${(p.signals||[]).length?`<div class="ap-v49-badges">${p.signals.map(x=>`<span class="ap-v49-badge">${esc(x)}</span>`).join('')}</div>`:''}
 <div class="ap-divider"></div><div class="ap-panel-head"><h2>Real order history</h2><span>${orders.length} order${orders.length===1?'':'s'}</span></div>
 <div>${orders.length?orders.map(o=>`<div class="ap-v49-order"><div><strong>${esc(o.orderId||o.id||'Order')}</strong><small>${esc(o.productName||o.product||o.productKey||'Order')} · ${Number(o.quantity||o.qty||0)} pcs</small></div><span>${esc(String(o.status||o.delivery||'pending').replaceAll('_',' '))}<br>${money(o.total)} · ${esc(fmt(o.createdAt))}</span></div>`).join(''):'<div class="ap-v49-empty">This registered profile has no orders yet.</div>'}</div>
 ${crm.note?`<div class="ap-divider"></div><div class="ap-detail"><label>Private CRM note</label><span>${esc(crm.note)}</span></div>`:''}`;
}
function render(){
 const view=$('.ap-view[data-view="customers"]');if(!view)return;
 injectStyle();build();
 const stats=directory.stats||{};
 view.innerHTML=`<div class="ap-page-head"><div><h1>Customer 360</h1><p>Live production customer directory derived from Firebase customer profiles and private orders. No demo customer records are used in production.</p></div></div>
 <div class="ap-v49-customer-kpis"><div class="ap-v49-kpi"><small>People</small><strong>${Number(stats.totalPeople||0)}</strong></div><div class="ap-v49-kpi"><small>Registered</small><strong>${Number(stats.registered||0)}</strong></div><div class="ap-v49-kpi"><small>Guests</small><strong>${Number(stats.guests||0)}</strong></div><div class="ap-v49-kpi"><small>Needs review</small><strong>${Number(stats.unresolved||0)+Number(stats.ambiguousGuestOrders||0)}</strong></div></div>
 <div class="ap-v49-customer-shell"><article class="ap-card ap-panel"><div class="ap-panel-head"><div><h2>Customer directory</h2><span>Firebase-backed</span></div></div><div class="ap-toolbar"><input class="ap-filter" id="apV49CustomerSearch" placeholder="Search name, email, phone, order, location"></div><div class="ap-v49-customer-list" id="apV49CustomerList"></div></article><article class="ap-card ap-panel" id="apV49CustomerDetail"></article></div>`;
 const search=$('#apV49CustomerSearch',view),list=$('#apV49CustomerList',view),detail=$('#apV49CustomerDetail',view);
 function drawList(){const q=String(search?.value||'').trim().toLowerCase();const rows=directory.people.filter(p=>!q||String(p.searchText||'').includes(q));list.innerHTML=rows.length?rows.map(p=>`<button type="button" class="ap-v49-customer-row ${p.key===selectedKey?'is-active':''}" data-v49-customer="${esc(p.key)}"><strong>${esc(p.name)}</strong><span>${esc(p.email||p.phone||p.uid||'Guest checkout')}</span><small>${esc(p.typeLabel)} · ${p.orderCount} order${p.orderCount===1?'':'s'} · ${money(p.lifetimeValue)}</small></button>`).join(''):'<div class="ap-v49-empty">No customer matches this search.</div>';list.querySelectorAll('[data-v49-customer]').forEach(b=>b.onclick=()=>{selectedKey=b.dataset.v49Customer;drawList();renderDetail(detail,person());});}
 search?.addEventListener('input',drawList);drawList();renderDetail(detail,person());
 window.NSV421LiveCustomerDirectory={directory,selectedKey,refresh:render};
}
function schedule(){setTimeout(render,0);}
window.addEventListener('nsv421:operational-synced',schedule);
window.addEventListener('nsv421:production-ready',schedule);
document.addEventListener('click',e=>{if(e.target.closest?.('#apNav button[data-view="customers"]'))schedule();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
