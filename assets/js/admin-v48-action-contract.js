(function(){
'use strict';
if(window.__NS_V421_ADMIN_V48_ACTION_CONTRACT__)return;
window.__NS_V421_ADMIN_V48_ACTION_CONTRACT__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const role=()=>$('#apRole')?.value||Store.getSession?.()?.role||'Owner';
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),3000);}
function modal(title,sub,body){const box=$('#apModal');if(!box)return false;$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;box.classList.add('is-open');return true;}
function close(){const box=$('#apModal');box?.classList.remove('is-open','ap-modal-wide');}
function save(s,action,target){Store.audit?.(s,action,target||'');Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));toast(action);}
function allowed(set){return set.has(role());}
const WAREHOUSE_ROLES=new Set(['Owner','Admin','Manager','Operations']);
const SEGMENT_ROLES=new Set(['Owner','Admin','Manager','Sales']);
const CONTENT_ROLES=new Set(['Owner','Admin','Manager','Content']);
function cancelButton(){return '<button class="ap-btn" type="button" data-v48-cancel>Cancel</button>';}
function bindCancel(form){form?.querySelector('[data-v48-cancel]')?.addEventListener('click',e=>{e.preventDefault();close();});}
function addWarehouse(){
 if(!allowed(WAREHOUSE_ROLES))return toast(role()+' cannot add fulfilment nodes.');
 if(!modal('Add fulfilment node','Nothing is created until Save node.',`<form class="ap-form" id="v48WarehouseForm"><div class="ap-row"><div class="ap-field"><label>Name *</label><input name="name" required maxlength="120"></div><div class="ap-field"><label>Ownership</label><select name="ownership"><option>Partner-operated</option><option>Rented</option><option>Owned</option></select></div></div><div class="ap-row"><div class="ap-field"><label>City *</label><input name="city" required maxlength="100"></div><div class="ap-field"><label>Address *</label><input name="address" required maxlength="240"></div></div><label class="ap-radio-card"><input name="active" type="checkbox" checked><span><strong>Node active</strong><small>Active nodes can be used for operational stock planning.</small></span></label><div class="ap-head-actions">${cancelButton()}<button class="ap-btn primary" type="submit">Save node</button></div></form>`))return;
 const f=$('#v48WarehouseForm');bindCancel(f);f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),name=String(fd.get('name')||'').trim(),city=String(fd.get('city')||'').trim(),address=String(fd.get('address')||'').trim();if(!name||!city||!address)return toast('Complete the required node fields.');const s=Store.load();s.warehouses=s.warehouses||[];const x={id:'NODE-'+Date.now(),name,ownership:String(fd.get('ownership')||'Partner-operated'),city,address,active:fd.get('active')==='on'};s.warehouses.push(x);close();save(s,'Fulfilment node added',x.id);};
}
function addSegment(){
 if(!allowed(SEGMENT_ROLES))return toast(role()+' cannot create customer segments.');
 if(!modal('Create customer segment','Define the segment before it is added.',`<form class="ap-form" id="v48SegmentForm"><div class="ap-field"><label>Segment name *</label><input name="name" required maxlength="120"></div><div class="ap-field"><label>Rule / definition *</label><input name="rule" required maxlength="240" placeholder="Example: Hospitality enquiries in the last 30 days"></div><div class="ap-field"><label>Next action</label><input name="action" maxlength="180" placeholder="Review / follow up / campaign"></div><div class="ap-head-actions">${cancelButton()}<button class="ap-btn primary" type="submit">Create segment</button></div></form>`))return;
 const f=$('#v48SegmentForm');bindCancel(f);f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),name=String(fd.get('name')||'').trim(),rule=String(fd.get('rule')||'').trim();if(!name||!rule)return toast('Name and rule are required.');const s=Store.load();s.segments=s.segments||[];const x={id:'SEG-'+Date.now(),name,rule,count:0,action:String(fd.get('action')||'Review').trim()||'Review'};s.segments.push(x);close();save(s,'Customer segment created',x.id);};
}
function addContent(){
 if(!allowed(CONTENT_ROLES))return toast(role()+' cannot create content drafts.');
 if(!modal('Create content draft','A draft is created only after Save draft. It is not public.',`<form class="ap-form" id="v48ContentForm"><div class="ap-field"><label>Title *</label><input name="title" required maxlength="160"></div><div class="ap-row"><div class="ap-field"><label>Page</label><select name="page"><option>Homepage</option><option>People</option><option>Fresh Tender Coconut</option><option>Green Coconut</option><option>Bulk Supply</option><option>Hospitality</option><option>Sourcing</option></select></div><div class="ap-field"><label>Owner</label><input name="owner" maxlength="120" value="${esc($('#apUserName')?.textContent||role())}"></div></div><div class="ap-version-note"><strong>Public impact</strong><span>Saved content starts in DRAFT and remains unpublished until the existing review/publishing workflow advances it.</span></div><div class="ap-head-actions">${cancelButton()}<button class="ap-btn primary" type="submit">Save draft</button></div></form>`))return;
 const f=$('#v48ContentForm');bindCancel(f);f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),title=String(fd.get('title')||'').trim();if(!title)return toast('Content title is required.');const s=Store.load();s.content=s.content||[];const x={id:'CT-'+Date.now(),title,state:'DRAFT',owner:String(fd.get('owner')||role()).trim()||role(),page:String(fd.get('page')||'Homepage')};s.content.push(x);close();save(s,'Content draft created',x.id);};
}
function addStory(){
 if(!allowed(CONTENT_ROLES))return toast(role()+' cannot create public-story drafts.');
 if(!modal('Create People story','Nothing is added until Save story. New stories start hidden.',`<form class="ap-form" id="v48StoryForm"><div class="ap-field"><label>Story title *</label><input name="title" required maxlength="160"></div><div class="ap-field"><label>Subtitle</label><input name="subtitle" maxlength="220"></div><div class="ap-row"><div class="ap-field"><label>Surface</label><select name="surface"><option value="people">People</option><option value="community">Community</option></select></div><div class="ap-field"><label>Layout</label><select name="layout"><option value="editorial-grid">Editorial grid</option><option value="portrait-rail">Portrait rail</option><option value="feature-story">Feature story</option></select></div></div><div class="ap-version-note"><strong>Publishing safety</strong><span>The new story is saved hidden. Approved media can be added and visibility enabled after review.</span></div><div class="ap-head-actions">${cancelButton()}<button class="ap-btn primary" type="submit">Save story</button></div></form>`))return;
 const f=$('#v48StoryForm');bindCancel(f);f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),title=String(fd.get('title')||'').trim();if(!title)return toast('Story title is required.');const s=Store.load();s.stories=s.stories||[];const x={id:'ST-'+Date.now(),surface:String(fd.get('surface')||'people'),title,subtitle:String(fd.get('subtitle')||'').trim(),visible:false,order:s.stories.length+1,layout:String(fd.get('layout')||'editorial-grid'),mediaIds:[]};s.stories.push(x);close();save(s,'Story draft created',x.id);};
}
function intercept(e){
 const t=e.target.closest?.('button');if(!t)return;
 if(t.id==='apAddWarehouse'){e.preventDefault();e.stopImmediatePropagation();addWarehouse();return;}
 if(t.id==='apSegmentAdd'){e.preventDefault();e.stopImmediatePropagation();addSegment();return;}
 if(t.id==='apNewContent'){e.preventDefault();e.stopImmediatePropagation();addContent();return;}
 if(t.id==='apAddStory'){e.preventDefault();e.stopImmediatePropagation();addStory();}
}
function init(){document.addEventListener('click',intercept,true);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
window.NSV421AdminActionContracts={addWarehouse,addSegment,addContent,addStory};
})();
