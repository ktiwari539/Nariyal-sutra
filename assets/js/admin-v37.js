(function(){
'use strict';
const Store=window.NSV421Store, MediaDB=window.NSV421MediaDB;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(){return Store.load();}
function role(){return $('#apRole')?.value||Store.getSession()?.role||'Owner';}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2600);}
function modal(title,sub,body,wide=false){$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;$('#apModal').classList.toggle('ap-modal-wide',!!wide);$('#apModal').classList.add('is-open');}
function closeModal(){$('#apModal')?.classList.remove('is-open','ap-modal-wide');}
function save(s,action,target){Store.audit(s,action,target);Store.save(s);toast(action);}

const DEST={
 'Library only':{path:null,fit:'contain',ratio:'4/3',label:'Keep safely in Media Library only'},
 'Homepage':{path:'index.html',fit:'cover',ratio:'16/7',label:'Homepage approved editorial zone'},
 'People':{path:'people-of-nariyal-sutra.html',fit:'contain',ratio:'4/5',label:'People story / portrait rail'},
 'Ambassadors':{path:'people-of-nariyal-sutra.html#ambassadors',fit:'contain',ratio:'4/5',label:'Explicitly approved ambassador only'},
 'Community':{path:'people-of-nariyal-sutra.html#community',fit:'contain',ratio:'4/5',label:'Community story area'},
 'Coconut Water Moments':{path:'coconut-water.html',fit:'cover',ratio:'16/10',label:'Coconut-water lifestyle moments'},
 'Hospitality':{path:'coconut-events-hospitality.html',fit:'cover',ratio:'16/9',label:'Hospitality / event story'},
 'Sourcing':{path:'direct-farm.html',fit:'cover',ratio:'16/9',label:'Sourcing story'},
 'Product':{path:'green-coconut.html',fit:'contain',ratio:'4/3',label:'Product presentation'},
 'Bulk':{path:'bulk-coconut-supply.html',fit:'cover',ratio:'16/9',label:'Bulk / commercial supply'},
 'Fresh Cut':{path:'freshness-first.html',fit:'cover',ratio:'16/9',label:'Cut / opening / water sequence'},
 'Origin / Grove':{path:'gujarat-coast.html',fit:'cover',ratio:'16/9',label:'Origin / grove / coastal sourcing'}
};
const TYPES={
 'people-portrait':'People / portrait',
 'people-lifestyle':'People + coconut / lifestyle',
 'product':'Product close-up',
 'fresh-cut':'Fresh cut / coconut water',
 'sourcing':'Sourcing / grove / coast',
 'hospitality':'Hospitality / event',
 'bulk':'Bulk / logistics',
 'community':'Community / customer moment',
 'other':'Other / needs classification'
};
const ALLOW={
 'people-portrait':['Library only','People','Community','Ambassadors'],
 'people-lifestyle':['Library only','People','Community','Coconut Water Moments','Hospitality','Ambassadors','Homepage'],
 'product':['Library only','Product','Coconut Water Moments','Homepage'],
 'fresh-cut':['Library only','Fresh Cut','Coconut Water Moments','Product','Homepage'],
 'sourcing':['Library only','Sourcing','Origin / Grove','Homepage'],
 'hospitality':['Library only','Hospitality','Community','Coconut Water Moments','Homepage'],
 'bulk':['Library only','Bulk','Product','Sourcing'],
 'community':['Library only','Community','People','Coconut Water Moments','Hospitality'],
 'other':['Library only']
};
function inferType(m){
 if(m.mediaType&&TYPES[m.mediaType])return m.mediaType;
 const cat=String(m.cat||'').toLowerCase(),p=String(m.placement||'').toLowerCase(),n=String(m.name||'').toLowerCase();
 if(p.includes('fresh')||/cut|open|water|drink/.test(n))return 'fresh-cut';
 if(p.includes('bulk')||/bulk|crate|logistic|wholesale/.test(n))return 'bulk';
 if(cat.includes('people')||cat.includes('ambassador'))return /coconut|drink|serve|event/.test(n)?'people-lifestyle':'people-portrait';
 if(cat.includes('product'))return 'product';
 if(cat.includes('sourc')||p.includes('grove')||/grove|farm|coast|source/.test(n))return 'sourcing';
 if(cat.includes('event')||/hospitality|hotel|event|serve/.test(n))return 'hospitality';
 if(cat.includes('community'))return 'community';
 return 'other';
}
function compatibility(m,type,dest,ambOK){
 if(dest==='Library only')return {ok:true,kind:'safe',msg:'Stored in the library; it will not appear on the public website.'};
 if(['Rejected','Archived'].includes(m.status))return {ok:false,msg:`${m.status} media cannot be placed on a public surface.`};
 if(!(ALLOW[type]||[]).includes(dest))return {ok:false,msg:`${TYPES[type]} media is not approved for ${dest}. Change the image type only if this classification is wrong.`};
 if(dest==='Ambassadors'&&!ambOK)return {ok:false,msg:'Ambassador placement requires explicit role approval. A portrait is never treated as an ambassador automatically.'};
 if(dest==='Homepage' && m.brandFit!=='Strong')return {ok:false,msg:'Homepage placement requires Strong brand fit. Review this asset first or choose a deeper story page.'};
 if(m.status!=='Approved')return {ok:true,kind:'draft',msg:`This can be saved as a draft placement, but it will remain hidden until status becomes Approved.`};
 return {ok:true,kind:'public',msg:'Placement is compatible. Existing visibility is preserved; saving does not auto-publish a hidden image.'};
}
function mediaImg(m){const src=(m.localBlobKey||m.thumbBlobKey)?'assets/images/upload-placeholder.svg':(m.src||m.thumb||'assets/images/upload-placeholder.svg');const key=m.localBlobKey||m.thumbBlobKey;return `<img id="v37PlacementImg" src="${esc(src)}" ${key?`data-local-blob-key="${esc(key)}"`:''} alt="${esc(m.name||m.id)}">`;}
function openPlacement(m){
 const type=inferType(m),current=DEST[m.placement]?m.placement:'Library only';
 modal('Place media safely',`${m.id} · ${m.name||'Media'}`,`
 <div class="v37-place-layout">
  <section class="v37-place-controls">
   <div class="v37-field"><label>What is this image?</label><select id="v37MediaType">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${k===type?'selected':''}>${esc(v)}</option>`).join('')}</select><small>This classification controls where the image is allowed to appear.</small></div>
   <div class="v37-statusline"><span class="v37-pill">${esc(m.status||'Needs review')}</span><span class="v37-pill">Brand fit: ${esc(m.brandFit||'Review')}</span></div>
   <div class="v37-placement-grid" id="v37PlacementGrid"></div>
   <label class="v37-amb-confirm" id="v37AmbConfirm" hidden><input type="checkbox" id="v37AmbApproved"> I confirm this person is explicitly approved to be presented as a Nariyal Sutra Ambassador.</label>
  </section>
  <section class="v37-place-preview">
   <div class="v37-preview-head"><div><strong>Placement preview</strong><small id="v37PreviewDest">${esc(current)}</small></div><div class="v37-device-tabs"><button type="button" data-device="desktop" class="is-active">Desktop</button><button type="button" data-device="tablet">Tablet</button><button type="button" data-device="mobile">Mobile</button></div></div>
   <div class="v37-device desktop" id="v37Device"><div class="v37-preview-slot" id="v37PreviewSlot">${mediaImg(m)}<span class="v37-preview-caption">${esc(m.name||m.id)}</span></div></div>
   <div class="v37-placement-message" id="v37PlacementMessage"></div>
   <div class="v37-place-actions"><button class="ap-btn" type="button" id="v37OpenTarget">Open target page</button><button class="ap-btn primary" type="button" id="v37PlaceSave">Save placement</button></div>
  </section>
 </div>`,true);
 const body=$('#apModalBody'); if(MediaDB?.hydrate)MediaDB.hydrate(body);
 let selected=current;
 const typeEl=$('#v37MediaType'),ambBox=$('#v37AmbApproved'),ambWrap=$('#v37AmbConfirm');
 function draw(){
  const t=typeEl.value,ambOK=!!ambBox?.checked;
  $('#v37PlacementGrid').innerHTML=Object.entries(DEST).map(([d,meta])=>{const c=compatibility(m,t,d,ambOK);return `<label class="v37-dest ${selected===d?'is-selected':''} ${c.ok?'':'is-blocked'}"><input type="radio" name="v37dest" value="${esc(d)}" ${selected===d?'checked':''} ${c.ok?'':'disabled'}><span><strong>${esc(d)}</strong><small>${esc(meta.label)}</small>${c.ok?'':`<em>${esc(c.msg)}</em>`}</span></label>`}).join('');
  $$('input[name="v37dest"]').forEach(r=>r.onchange=()=>{selected=r.value;draw();});
  ambWrap.hidden=selected!=='Ambassadors';
  const c=compatibility(m,t,selected,ambOK),meta=DEST[selected]||DEST['Library only'];
  $('#v37PreviewDest').textContent=selected;
  const slot=$('#v37PreviewSlot');slot.style.aspectRatio=meta.ratio;const img=$('#v37PlacementImg');if(img)img.style.objectFit=meta.fit;
  const msg=$('#v37PlacementMessage');msg.className='v37-placement-message '+(c.ok?(c.kind==='draft'?'draft':'ok'):'blocked');msg.innerHTML=`<strong>${c.ok?'Safe placement check':'Placement blocked'}</strong><span>${esc(c.msg)}</span>`;
  $('#v37PlaceSave').disabled=!c.ok;
  $('#v37OpenTarget').disabled=!meta.path;$('#v37OpenTarget').onclick=()=>meta.path&&window.open(meta.path,'_blank','noopener');
 }
 typeEl.onchange=()=>{if(!(ALLOW[typeEl.value]||[]).includes(selected))selected='Library only';draw();}; if(ambBox)ambBox.onchange=draw;
 $$('.v37-device-tabs button').forEach(b=>b.onclick=()=>{$$('.v37-device-tabs button').forEach(x=>x.classList.toggle('is-active',x===b));$('#v37Device').className='v37-device '+b.dataset.device;});
 $('#v37PlaceSave').onclick=()=>{const s=state(),live=(s.media||[]).find(x=>x.id===m.id);if(!live)return toast('Media record is no longer available.');const c=compatibility(live,typeEl.value,selected,!!ambBox?.checked);if(!c.ok)return toast(c.msg);live.mediaType=typeEl.value;live.placement=selected;live.homepageAllowed=selected==='Homepage';if(selected==='Ambassadors')live.publicRole='ambassador';if(live.status!=='Approved')live.visible=false;save(s,'Media placement updated',live.id);closeModal();};
 draw();
}

function assistedOrder(){
 const s=state(),products=s.products||[];
 modal('Create assisted order','For phone / WhatsApp assisted orders. Guest checkout remains available.',`<form class="ap-form" id="v37OrderForm"><div class="ap-row"><div class="ap-field"><label>Customer</label><input name="customer" required placeholder="Customer or Guest · City"></div><div class="ap-field"><label>Product</label><select name="product">${products.map(p=>`<option value="${esc(p.name)}" data-price="${Number(p.retail||0)}">${esc(p.name)}</option>`).join('')}</select></div></div><div class="ap-row"><div class="ap-field"><label>Quantity</label><input name="qty" type="number" min="1" value="10" required></div><div class="ap-field"><label>Payment</label><select name="payment"><option>Awaiting</option><option>COD</option><option>Paid</option></select></div></div><button class="ap-btn primary">Create assisted order</button></form>`);
 $('#v37OrderForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),opt=e.currentTarget.elements.product.selectedOptions[0],qty=Math.max(1,+f.get('qty')||1),price=+opt?.dataset.price||0,id='NS-'+Date.now().toString().slice(-6);s.orders.unshift({id,customer:f.get('customer'),product:f.get('product'),qty,payment:f.get('payment'),delivery:'Pending',total:price*qty});save(s,'Assisted order created',id);closeModal();};
}
function taskForm(){const s=state();modal('Assign task','Give one clear owner and due date.',`<form class="ap-form" id="v37TaskForm"><div class="ap-field"><label>Task</label><input name="title" required></div><div class="ap-row"><div class="ap-field"><label>Owner</label><select name="owner">${(s.teamMembers||[]).filter(x=>x.status==='Active').map(x=>`<option>${esc(x.name)}</option>`).join('')}<option>Operations</option><option>Content</option><option>Support</option><option>Sales</option></select></div><div class="ap-field"><label>Due</label><input name="due" type="date" value="${new Date(Date.now()+86400000).toISOString().slice(0,10)}"></div></div><button class="ap-btn primary">Assign task</button></form>`);$('#v37TaskForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),t={id:'TASK-'+Date.now(),title:f.get('title'),owner:f.get('owner'),due:f.get('due'),state:'Open'};s.tasks.push(t);save(s,'Task assigned',t.title);closeModal();};}
function followupForm(){const s=state();s.followups=s.followups||[];modal('Add follow-up','Create a clear next action for Sales or Support.',`<form class="ap-form" id="v37FollowupForm"><div class="ap-row"><div class="ap-field"><label>Customer</label><input name="customer" required></div><div class="ap-field"><label>Owner</label><select name="owner"><option>Sales</option><option>Support</option><option>Krishna</option><option>Operations</option></select></div></div><div class="ap-field"><label>Reason / next action</label><input name="reason" required></div><div class="ap-row"><div class="ap-field"><label>Due</label><input name="due" type="datetime-local" required></div><div class="ap-field"><label>Priority</label><select name="priority"><option>Normal</option><option>High</option><option>Opportunity</option></select></div></div><button class="ap-btn primary">Save follow-up</button></form>`);$('#v37FollowupForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),x={id:'FU-'+Date.now(),customer:f.get('customer'),owner:f.get('owner'),reason:f.get('reason'),due:f.get('due'),priority:f.get('priority'),status:'Open'};s.followups.push(x);save(s,'Follow-up created',x.customer);closeModal();};}
function notifications(){const s=state(),items=[['Orders','8 orders need review','orders'],['Delivery','3 active deliveries','delivery'],['Content','2 content items waiting for approval','content'],['Media',(s.media||[]).filter(m=>m.status==='Needs review').length+' media items need review','media']];modal('Notifications','Open the relevant work queue',`<div class="v37-notify-list">${items.map(([a,b,v])=>`<button type="button" data-v37-go="${v}"><strong>${a}</strong><span>${b}</span><b>Open →</b></button>`).join('')}</div>`);$$('[data-v37-go]').forEach(b=>b.onclick=()=>{closeModal();document.querySelector(`#apNav button[data-view="${b.dataset.v37Go}"]`)?.click();});}
function quickCreateAction(q){closeModal();if(q==='order')assistedOrder();else if(q==='content')$('#apNewContent')?.click();else if(q==='media')$('#apNewMediaPicker')?.click();else if(q==='task')taskForm();}

function profileMenu(){const s=state(),sess=Store.getSession(),member=sess?.id?(s.teamMembers||[]).find(x=>x.id===sess.id):null,r=role(),name=member?.name||$('#apUserName')?.textContent||'Preview User',email=member?.email||'Role preview mode';modal('My Admin profile',r,`<div class="v37-profile-card"><div class="v37-profile-avatar" id="v37ProfileAvatar">${esc(name.split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</div><div><strong>${esc(name)}</strong><span>${esc(email)}</span><span>${esc(r)}</span></div></div><div class="v37-profile-actions"><button class="ap-btn" id="v37ChangePhoto">Change profile photo</button>${['Owner','Admin'].includes(r)?'<button class="ap-btn" id="v37TeamAccess">Team & access</button>':''}<button class="ap-btn" id="v37StaffLogin">Open staff sign-in</button>${sess?'<button class="ap-btn danger" id="v37SignOut">Sign out</button>':'<span class="v37-preview-note">You are using local role-preview mode. Sign in as an invited staff member to test a real session.</span>'}</div>`);$('#v37ChangePhoto').onclick=()=>$('#apStaffPhotoPicker')?.click();$('#v37TeamAccess')?.addEventListener('click',()=>{closeModal();document.querySelector('#apNav button[data-view="team"]')?.click();});$('#v37StaffLogin').onclick=()=>location.href='admin-login.html';$('#v37SignOut')?.addEventListener('click',()=>{Store.setSession?.(null);try{sessionStorage.removeItem('ns_v10_admin_session')}catch(e){}location.href='admin-login.html';});}
function installProfileButton(){const actions=$('.ap-top-actions');if(!actions||$('#apProfileMenu'))return;const b=document.createElement('button');b.id='apProfileMenu';b.type='button';b.className='v37-profile-button';b.innerHTML='<span class="v37-profile-dot">KT</span><span class="v37-profile-copy"><strong>My profile</strong><small>Account & access</small></span><span>⌄</span>';actions.appendChild(b);b.onclick=profileMenu;}

function manageTeamV37(idx){const s=state(),m=s.teamMembers[idx],actor=role();if(!m||!['Owner','Admin'].includes(actor))return toast('Only Owner/Admin can manage staff access.');const roles=actor==='Owner'?['Owner','Admin','Manager','Operations','Content','Support','Sales']:['Admin','Manager','Operations','Content','Support','Sales'];modal('Manage staff access',m.name,`<form class="ap-form" id="v37ManageTeam"><div class="ap-field"><label>Role</label><select name="role">${roles.map(v=>`<option ${v===m.role?'selected':''}>${v}</option>`).join('')}</select><small>${actor==='Admin'?'Admin can manage Admin and lower roles, but cannot assign Owner.':'Owner can assign all authorized roles.'}</small></div><div class="ap-field"><label>Account status</label><select name="status">${['Active','Suspended','Revoked'].map(v=>`<option ${v===m.status?'selected':''}>${v}</option>`).join('')}</select></div><button class="ap-btn primary">Save access</button></form>`);$('#v37ManageTeam').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),next=f.get('role');if(actor==='Admin'&&next==='Owner')return toast('Admin cannot assign Owner.');m.role=next;m.status=f.get('status');save(s,'Staff access updated',m.email);closeModal();};}
function inviteV37(){const actor=role();if(!['Owner','Admin'].includes(actor))return toast('Only Owner/Admin can invite staff.');const roleList=actor==='Owner'?['Admin','Manager','Operations','Content','Support','Sales']:['Admin','Manager','Operations','Content','Support','Sales'];modal('Invite staff member','Staff set their own password from an expiring invitation link.',`<form class="ap-form" id="v37Invite"><div class="ap-row"><div class="ap-field"><label>Name</label><input name="name" required></div><div class="ap-field"><label>Email / login ID</label><input name="email" type="email" required></div></div><div class="ap-field"><label>Role</label><select name="role">${roleList.map(v=>`<option>${v}</option>`).join('')}</select></div><button class="ap-btn primary">Create invitation</button></form>`);$('#v37Invite').onsubmit=e=>{e.preventDefault();const s=state(),f=new FormData(e.currentTarget),token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),m={id:'TM-'+Date.now(),name:f.get('name'),email:String(f.get('email')).toLowerCase(),role:f.get('role'),status:'Pending',inviteStatus:'Invite ready',inviteToken:token,inviteExpiresAt:Date.now()+86400000};s.teamMembers.push(m);save(s,'Staff invitation created',m.email);const link=location.origin+location.pathname.replace(/admin-preview\.html.*$/,'')+'admin-set-password.html?token='+encodeURIComponent(token);modal('Invitation ready',m.email,`<div class="ap-invite-preview"><strong>24-hour setup link</strong><code>${esc(link)}</code><button class="ap-btn primary" id="v37CopyInvite">Copy link</button></div>`);$('#v37CopyInvite').onclick=async()=>{try{await navigator.clipboard.writeText(link);toast('Invite link copied.');}catch(e){toast('Copy the setup link shown above.');}};};}

function intercept(){
 document.addEventListener('click',e=>{
  const place=e.target.closest('[data-media][data-ma="place"]');if(place){e.preventDefault();e.stopImmediatePropagation();const m=(state().media||[]).find(x=>x.id===place.dataset.media);if(m)openPlacement(m);return;}
  const q=e.target.closest('[data-q]');if(q){e.preventDefault();e.stopImmediatePropagation();quickCreateAction(q.dataset.q);return;}
  const team=e.target.closest('[data-team]');if(team){e.preventDefault();e.stopImmediatePropagation();manageTeamV37(+team.dataset.team);return;}
 },true);
}
function directFixes(){
 $('#apAssistedOrder')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();assistedOrder();},true);
 $('#apTaskAdd')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();taskForm();},true);
 $('#apFollowupAdd')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();followupForm();},true);
 $('#apNotifications')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();notifications();},true);
 $('#apTeamInvite')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();inviteV37();},true);
}
function updateQuickCreate(){const b=$('#apQuickCreate');if(!b)return;b.onclick=()=>modal('Quick create','Start a complete workflow',`<div class="v37-quick-grid"><button type="button" data-q="order"><strong>Assisted order</strong><span>Create a real local order draft</span></button><button type="button" data-q="content"><strong>Content draft</strong><span>Start in DRAFT</span></button><button type="button" data-q="media"><strong>Upload media</strong><span>Optimize → review → place</span></button><button type="button" data-q="task"><strong>Assign task</strong><span>Owner + due date</span></button></div>`);}
function markBuild(){let d=$('#apV37Build');if(!d){d=document.createElement('div');d.id='apV37Build';d.className='v37-build';d.textContent='V37 · placement safety + interaction repair';document.body.appendChild(d);}}
function init(){installProfileButton();intercept();directFixes();updateQuickCreate();markBuild();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
