(function(){
'use strict';
if(window.__NS_V421_ADMIN_DASHBOARD_V2__)return;
const Store=window.NSV421Store;if(!Store)return;
window.__NS_V421_ADMIN_DASHBOARD_V2__=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const bridge=()=>window.NSV421ProductionBridge||null;
const local=()=>!bridge()?.isProduction;
const role=()=>$('#apRole')?.value||Store.getSession?.()?.role||'Owner';
const norm=v=>String(v||'').toLowerCase();
const money=v=>Number(v||0).toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
function dateOf(x){const raw=x?.createdAt||x?.created_at||x?.orderDate||x?.date||x?.timestamp;const d=raw?new Date(raw):null;return d&&!Number.isNaN(+d)?d:null;}
function isToday(d){if(!d)return false;const n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();}
function state(){return Store.load();}
function sourceLabel(){return local()?'Preview data · local Admin state':'Admin source · production bridge';}
function payment(o){return norm(o.payment||o.paymentState||o.payment_status);}
function orderStatus(o){return norm(o.status||o.delivery||o.state);}
function available(i){return Math.max(0,Number(i.onHand||0)-Number(i.reserved||0));}
function reviewCount(s){return arr(s.media).filter(m=>/needs review|needs enhancement/i.test(m.status||'')).length+arr(s.content).filter(c=>/in_review|needs review|needs changes/i.test(c.state||'')).length+arr(s.communications).filter(c=>c.status==='Needs review').length;}
function metrics(s){
 const orders=arr(s.orders),dated=orders.filter(o=>dateOf(o)),today=dated.filter(o=>isToday(dateOf(o))),todayKnown=dated.length>0;
 const paidToday=today.filter(o=>payment(o)==='paid').reduce((n,o)=>n+Number(o.total||o.amount||0),0);
 const pending=orders.filter(o=>/pending|awaiting|review/.test(orderStatus(o)));
 const deliveries=orders.filter(o=>!/delivered|cancelled|rejected/.test(orderStatus(o))&&/delivery|dispatch|transit|out for/.test(orderStatus(o)));
 const low=arr(s.inventory).filter(i=>available(i)<=Number(i.low??i.lowStockThreshold??0));
 const comm=arr(s.communications).filter(c=>['Draft','Needs review','Failed'].includes(c.status)||(!c.sentAt&&c.scheduledAt&&new Date(c.scheduledAt)<=new Date()));
 return {orders,today,todayKnown,paidToday,pending,deliveries,low,comm,reviews:reviewCount(s)};
}
function nav(view,label,apply){
 if(view==='reviews'&&window.NSV421ReviewQueue?.open){window.NSV421ReviewQueue.open();}
 else document.querySelector(`#apNav button[data-view="${view}"]`)?.click();
 setTimeout(()=>{apply?.();context(view,label);},60);
}
function context(view,label){
 const v=document.querySelector(`.ap-view[data-view="${view}"]`);if(!v)return;
 let c=v.querySelector('.ns-dash-context');if(!c){c=document.createElement('div');c.className='ns-dash-context';v.querySelector('.ap-page-head')?.after(c);}
 c.innerHTML=`<span>Dashboard context</span><strong>${esc(label||'Current work')}</strong><button type="button">Clear dashboard filter</button>`;
 c.querySelector('button').onclick=()=>{c.remove();resetFilters(view);};
}
function resetFilters(view){
 if(view==='orders'){for(const id of ['apOrderSearch']){const e=$('#'+id);if(e){e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));}}for(const id of ['apOrderStatusFilter','apOrderPaymentFilter']){const e=$('#'+id);if(e){e.selectedIndex=0;e.dispatchEvent(new Event('change',{bubbles:true}));}}}
 if(view==='communication'){const e=$('#v38Status');if(e){e.selectedIndex=0;e.dispatchEvent(new Event('change',{bubbles:true}));}}
}
function setSelect(id,text){const e=$('#'+id);if(!e)return;const opt=[...e.options].find(o=>norm(o.textContent)===norm(text));if(opt){e.value=opt.value;e.dispatchEvent(new Event('change',{bubbles:true}));}}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2800);}
function quick(name){
 const go=(view,selector,label)=>{nav(view,label);setTimeout(()=>{const b=$(selector);if(b&&!b.disabled)b.click();else toast(label+' workspace opened.');},100)};
 if(name==='order')return go('orders','#apAssistedOrder','Create assisted order');
 if(name==='communication')return go('communication','#apCommunicationNew','New communication');
 if(name==='review')return nav('reviews','Review pending content');
 if(name==='people')return nav('ambassadors','People / Ambassador profiles');
 if(name==='inventory')return nav('inventory','Low stock / inventory adjustment');
 if(name==='delivery')return nav('delivery-services','Delivery service configuration');
 if(name==='media')return nav('media','Upload / manage media');
 if(name==='export'){const b=$('#apExportSnapshot');if(b)return b.click();return toast('Export action is unavailable.');}
}
function actionItems(s,m){
 const out=[];
 if(m.pending.length)out.push({sev:'high',title:`${m.pending.length} order${m.pending.length===1?'':'s'} need a decision`,why:'Pending order state is blocking fulfilment.',view:'orders',label:'Pending order decisions',apply:()=>setSelect('apOrderStatusFilter','Pending')});
 const awaiting=m.orders.filter(o=>payment(o)==='awaiting');if(awaiting.length)out.push({sev:'high',title:`${awaiting.length} payment${awaiting.length===1?'':'s'} awaiting confirmation`,why:'Confirm references before fulfilment.',view:'orders',label:'Awaiting payments',apply:()=>setSelect('apOrderPaymentFilter','Awaiting')});
 if(m.reviews)out.push({sev:'medium',title:`${m.reviews} publishing item${m.reviews===1?'':'s'} need review`,why:'These items remain blocked until the Review Queue is resolved.',view:'reviews',label:'Publishing Review Queue'});
 if(m.low.length)out.push({sev:'medium',title:`${m.low.length} SKU${m.low.length===1?'':'s'} at or below low-stock threshold`,why:'Available stock has reached its configured threshold.',view:'inventory',label:'Low stock'});
 if(m.comm.length)out.push({sev:'medium',title:`${m.comm.length} communication follow-up${m.comm.length===1?'':'s'} need attention`,why:'Draft, failed, review, or due communications remain open.',view:'communication',label:'Communication follow-ups',apply:()=>setSelect('v38Status','Failed')});
 const mediaBlocked=arr(s.media).filter(x=>x.publicAllowed===false||/rejected|needs review|needs enhancement/i.test(x.status||''));if(mediaBlocked.length)out.push({sev:'low',title:`${mediaBlocked.length} media item${mediaBlocked.length===1?'':'s'} blocked from public use`,why:'Approval, visibility, or website-use policy is preventing publication.',view:'media',label:'Blocked media'});
 return out.slice(0,8);
}
function search(q){
 q=norm(q).trim();if(!q)return;
 const s=state(),sets=[['orders',arr(s.orders)],['customers',arr(s.customers)],['media',arr(s.media)],['stories',arr(s.stories)],['communication',arr(s.communications)]];
 for(const [view,items] of sets){const hit=items.find(x=>Object.values(x||{}).some(v=>['string','number'].includes(typeof v)&&norm(v).includes(q)));if(hit){nav(view,`Search: ${q}`);return;}}
 toast('No matching Admin record found.');
}
function readiness(){
 const b=bridge(),d=b?.identityDiagnostic?.()||{};
 return [
  ['Firebase persistence',local()?'Preview only · no production writes':(b?.user?'Authenticated Admin session':'Authentication required'),local()?'preview':b?.user?'ready':'gate'],
  ['Cloudinary upload',local()?'Preview only · signed upload not exercised':'Server-signed upload · verify on upload action','gate'],
  ['Admin email',local()?'Preview only · external sends blocked':(window.NS_ADMIN_EMAIL_ENDPOINT?'Authenticated endpoint configured':'Provider endpoint/config required'),local()?'preview':window.NS_ADMIN_EMAIL_ENDPOINT?'ready':'gate'],
  ['Owner delete OTP',local()?'Preview simulation only':'Server-gated OTP flow · env verified on request','gate'],
  ['Public projection',local()?'Preview data only':(d.role?`Production bridge active · ${d.role}`:'Production bridge active · identity check required'),local()?'preview':'ready']
 ];
}
function render(){
 const view=$('.ap-view[data-view="overview"]');if(!view)return;
 const s=state(),m=metrics(s),actions=actionItems(s,m),audit=arr(s.auditHistory||s.audit||s.auditLog).slice(-6).reverse();
 let root=$('#nsDashboardV2');if(!root){root=document.createElement('div');root.id='nsDashboardV2';view.querySelector('.ap-page-head')?.after(root);}
 $$('.ap-kpis,.ap-grid-2',view).forEach(x=>{if(!x.closest('#nsDashboardV2'))x.hidden=true;});
 const orderToday=m.todayKnown?m.today.length:'—',revenue=m.todayKnown?money(m.paidToday):'—';
 const payCounts=['paid','cod','awaiting'].map(k=>[k,m.orders.filter(o=>payment(o)===k).length]);const maxPay=Math.max(1,...payCounts.map(x=>x[1]));
 const incompletePeople=arr(s.media).filter(x=>norm(x.cat).includes('people')&&(!x.personName||!x.personCity||!x.personAbout)).length;
 const hiddenSections=arr(s.sections).filter(x=>x.visible===false||x.hidden===true).length;
 root.innerHTML=`
 <section class="ns-dash-command"><div><span class="ns-eyebrow">BUSINESS COMMAND CENTER V2</span><h2>Today / Needs action</h2><p>${esc(sourceLabel())}. Counts below come from the current Admin source; unavailable fields stay unavailable rather than being fabricated.</p></div><div class="ns-command-actions"><button data-dash-public>View public site</button><button data-dash-review>Open Review Queue</button><button data-dash-quick>Quick create</button></div></section>
 <section class="ns-dash-search"><input id="nsDashSearch" placeholder="Search orders, customers, media, stories, communication"><button id="nsDashSearchBtn">Search</button></section>
 <section class="ns-dash-kpis">
  ${[['Orders today',orderToday,m.todayKnown?'Timestamped orders today':'Order timestamps unavailable','orders','Orders today'],['Revenue today',revenue,m.todayKnown?'Paid timestamped orders today':'Order timestamps unavailable','payments','Revenue today'],['Pending decisions',m.pending.length,'Current pending / awaiting / review states','orders','Pending order decisions'],['Active deliveries',m.deliveries.length,'Current non-complete delivery states','delivery','Active deliveries'],['Review queue',m.reviews,'Media + content + communication','reviews','Publishing Review Queue'],['Low stock',m.low.length,'At/below configured threshold','inventory','Low stock'],['Communication',m.comm.length,'Draft / review / failed / due','communication','Communication follow-ups']].map(x=>`<button class="ns-kpi" data-dash-view="${x[3]}" data-dash-label="${esc(x[4])}"><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong><small>${esc(x[2])}</small></button>`).join('')}
 </section>
 <section class="ns-dash-grid"><article class="ns-panel"><div class="ns-panel-head"><div><h3>Action Center</h3><span>Ranked from actual open state</span></div></div><div class="ns-actions">${actions.map((a,i)=>`<div class="ns-action ${a.sev}"><div><strong>${esc(a.title)}</strong><span>${esc(a.why)}</span></div><button data-action-index="${i}">Resolve</button></div>`).join('')||'<div class="ns-empty">No actionable items are derived from the current source.</div>'}</div></article>
 <article class="ns-panel"><div class="ns-panel-head"><div><h3>Quick Actions</h3><span>Open existing real workflows</span></div></div><div class="ns-quick">${[['order','Create assisted order'],['media','Upload / manage media'],['people','Add / edit person'],['communication','New communication'],['review','Review pending'],['inventory','Adjust inventory'],['delivery','Delivery services'],['export','Export snapshot']].map(x=>`<button data-quick="${x[0]}">${esc(x[1])}</button>`).join('')}</div></article></section>
 <section class="ns-dash-grid"><article class="ns-panel"><div class="ns-panel-head"><div><h3>Business pulse</h3><span>${esc(sourceLabel())} · payment-state distribution</span></div></div><div class="ns-bars">${payCounts.map(([k,n])=>`<button data-pulse="${k}"><span>${esc(k)}</span><i style="--w:${Math.round(n/maxPay*100)}%"></i><b>${n}</b></button>`).join('')}</div></article>
 <article class="ns-panel"><div class="ns-panel-head"><div><h3>Publishing & Brand health</h3><span>Derived from current configured state</span></div></div><div class="ns-health-links"><button data-health="reviews"><strong>${m.reviews}</strong><span>Pending reviews</span></button><button data-health="media"><strong>${arr(s.media).filter(x=>x.publicAllowed===false).length}</strong><span>Website-blocked media</span></button><button data-health="ambassadors"><strong>${incompletePeople}</strong><span>Incomplete People profiles</span></button><button data-health="pages"><strong>${hiddenSections}</strong><span>Hidden sections</span></button></div></article></section>
 <section class="ns-dash-grid"><article class="ns-panel"><div class="ns-panel-head"><div><h3>Recent activity</h3><span>Existing Admin audit source</span></div><button data-dash-audit>Open Audit</button></div><div class="ns-activity">${audit.length?audit.map(a=>`<div><strong>${esc(a.action||a.event||a.type||'Admin change')}</strong><span>${esc(a.target||a.detail||a.message||'')} ${esc(a.timestamp||a.at||a.createdAt||'')}</span></div>`).join(''):'<div class="ns-empty">No audit entries are available in the current source.</div>'}</div></article>
 <article class="ns-panel"><div class="ns-panel-head"><div><h3>System readiness</h3><span>No provider is marked ready from frontend assumption alone</span></div><button data-dash-settings>Open Settings</button></div><div class="ns-readiness">${readiness().map(x=>`<div><span class="${x[2]}"></span><div><strong>${esc(x[0])}</strong><small>${esc(x[1])}</small></div></div>`).join('')}</div></article></section>`;
 bind(root,actions);
}
function bind(root,actions){
 root.querySelector('[data-dash-public]')?.addEventListener('click',()=>window.open('index.html','_blank','noopener'));
 root.querySelector('[data-dash-review]')?.addEventListener('click',()=>nav('reviews','Publishing Review Queue'));
 root.querySelector('[data-dash-quick]')?.addEventListener('click',()=>$('#apQuickCreate')?.click());
 const runSearch=()=>search($('#nsDashSearch')?.value);$('#nsDashSearchBtn')?.addEventListener('click',runSearch);$('#nsDashSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});
 $$('[data-dash-view]',root).forEach(b=>b.onclick=()=>nav(b.dataset.dashView,b.dataset.dashLabel));
 $$('[data-action-index]',root).forEach(b=>b.onclick=()=>{const a=actions[Number(b.dataset.actionIndex)];if(a)nav(a.view,a.label,a.apply)});
 $$('[data-quick]',root).forEach(b=>b.onclick=()=>quick(b.dataset.quick));
 $$('[data-pulse]',root).forEach(b=>b.onclick=()=>nav('orders',`${b.dataset.pulse} payment orders`,()=>setSelect('apOrderPaymentFilter',b.dataset.pulse)));
 $$('[data-health]',root).forEach(b=>b.onclick=()=>nav(b.dataset.health,`Publishing health · ${b.dataset.health}`));
 root.querySelector('[data-dash-audit]')?.addEventListener('click',()=>nav('audit','Recent activity / Audit'));
 root.querySelector('[data-dash-settings]')?.addEventListener('click',()=>nav('settings','System readiness'));
}
function style(){if($('#nsDashboardV2Style'))return;const s=document.createElement('style');s.id='nsDashboardV2Style';s.textContent=`
#nsDashboardV2{display:grid;gap:16px;margin-bottom:18px}.ns-dash-command,.ns-dash-search,.ns-panel,.ns-kpi{border:1px solid rgba(31,76,45,.16);background:rgba(255,255,255,.88);border-radius:14px}.ns-dash-command{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px}.ns-dash-command h2,.ns-panel h3{margin:2px 0 4px}.ns-dash-command p,.ns-panel-head span,.ns-action span,.ns-activity span,.ns-readiness small,.ns-kpi small{font-size:10px;color:#697468;line-height:1.45}.ns-eyebrow{font-size:9px;font-weight:800;letter-spacing:.15em;color:#9b7426}.ns-command-actions,.ns-quick{display:flex;gap:8px;flex-wrap:wrap}.ns-command-actions button,.ns-quick button,.ns-panel button,.ns-dash-search button,.ns-action button{border:1px solid rgba(31,76,45,.18);background:#f8faf7;border-radius:8px;padding:9px 11px;cursor:pointer}.ns-dash-search{display:flex;padding:10px;gap:8px}.ns-dash-search input{flex:1;border:0;background:transparent;min-width:0;outline:none}.ns-dash-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}.ns-kpi{text-align:left;padding:13px;cursor:pointer;display:grid;gap:5px}.ns-kpi strong{font-size:22px}.ns-kpi span{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.ns-dash-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:16px}.ns-panel{padding:15px}.ns-panel-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}.ns-actions,.ns-activity,.ns-readiness{display:grid;gap:8px}.ns-action{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px;border-left:3px solid #809186;background:#f7f9f6}.ns-action.high{border-color:#a84d4d}.ns-action.medium{border-color:#c18b2d}.ns-action>div{display:grid;gap:3px}.ns-quick{display:grid;grid-template-columns:1fr 1fr}.ns-bars{display:grid;gap:10px}.ns-bars button{display:grid;grid-template-columns:72px 1fr 32px;align-items:center;gap:8px;text-align:left}.ns-bars i{height:8px;background:#e3e9e1;border-radius:8px;position:relative;overflow:hidden}.ns-bars i:after{content:'';position:absolute;inset:0 auto 0 0;width:var(--w);background:#315f3e}.ns-health-links{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ns-health-links button{display:grid;text-align:left;gap:2px}.ns-health-links strong{font-size:20px}.ns-health-links span{font-size:10px;color:#697468}.ns-activity>div,.ns-readiness>div{padding:9px;background:#f7f9f6;border-radius:8px;display:grid;gap:2px}.ns-readiness>div{grid-template-columns:10px 1fr;align-items:start}.ns-readiness>div>span{width:8px;height:8px;border-radius:50%;margin-top:4px;background:#b78b2d}.ns-readiness>div>span.ready{background:#3c7950}.ns-readiness>div>span.preview{background:#6581a1}.ns-empty{padding:14px;font-size:11px;color:#697468}.ns-dash-context{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 12px;margin:0 0 12px;border:1px solid rgba(155,116,38,.25);background:#fbf7ed;border-radius:10px;font-size:10px}.ns-dash-context span{color:#7a7569}.ns-dash-context button{margin-left:auto;border:0;background:transparent;text-decoration:underline;cursor:pointer}@media(max-width:1100px){.ns-dash-kpis{grid-template-columns:repeat(3,1fr)}.ns-dash-grid{grid-template-columns:1fr}}@media(max-width:700px){.ns-dash-command{align-items:flex-start;flex-direction:column}.ns-dash-kpis{grid-template-columns:1fr 1fr}.ns-quick,.ns-health-links{grid-template-columns:1fr}.ns-dash-search{flex-direction:column}.ns-kpi{min-height:92px}}
`;document.head.appendChild(s);}
function init(){style();render();window.addEventListener('nsv421:change',()=>setTimeout(render,30));document.addEventListener('change',e=>{if(e.target?.id==='apRole')setTimeout(render,20)},true);window.NSV421DashboardV2={render,metrics:()=>metrics(state()),open:nav,ready:true};window.dispatchEvent(new CustomEvent('nsv421:dashboard-v2-ready'));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
