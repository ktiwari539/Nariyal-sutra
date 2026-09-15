(function(){
'use strict';
if(window.__NS_V421_ADMIN_REVIEW_QUEUE__)return;
window.__NS_V421_ADMIN_REVIEW_QUEUE__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function role(){const b=window.NSV421ProductionBridge,d=b?.identityDiagnostic?.()||{};return b?.isProduction?(d.role||b.role||'Unknown'):($('#apRole')?.value||'Owner');}
function canReview(){return ['Owner','Admin','Manager'].includes(role());}
function canSubmitMedia(){return ['Owner','Admin','Manager','Content'].includes(role());}
function canSubmitCommunication(){return ['Owner','Admin','Manager','Support','Sales'].includes(role());}
function canView(){return ['Owner','Admin','Manager','Content'].includes(role());}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),3600);}
function actor(){const b=window.NSV421ProductionBridge,d=b?.identityDiagnostic?.()||{};return d.email||d.uid||$('#apUserName')?.textContent||role();}
function reviewState(v){v=String(v||'').toLowerCase();if(v==='in_review'||v==='needs review'||v==='needs enhancement'||v==='needs changes')return'Needs review';if(v==='rejected')return'Rejected';if(v==='approved'||v==='live')return'Approved';return'Draft';}
function pending(s){
 const out=[];
 (s.media||[]).forEach(m=>{const st=reviewState(m.status);if(st==='Needs review')out.push({type:'Media',id:m.id,title:m.name||m.id,status:m.status||st,preview:m.thumb||m.src||'',target:m.reviewTarget||m.placement||'Library only',impact:m.publicAllowed===false?'Blocked from public use':'Can publish only after approval',submittedBy:m.reviewSubmittedBy||m.owner||'—',submittedAt:m.reviewSubmittedAt||'—',raw:m});});
 (s.content||[]).forEach(c=>{if(reviewState(c.state)==='Needs review')out.push({type:'Content',id:c.id,title:c.title||c.id,status:c.state,target:c.page||'—',impact:'Content remains unpublished until approval',submittedBy:c.reviewSubmittedBy||c.owner||'—',submittedAt:c.reviewSubmittedAt||'—',raw:c});});
 (s.communications||[]).forEach(c=>{if(c.status==='Needs review')out.push({type:'Communication',id:c.id,title:[c.recipient,c.purpose].filter(Boolean).join(' · ')||c.id,status:c.status,target:[c.channel,c.destination,c.orderId].filter(Boolean).join(' → '),impact:'Cannot send or open an external channel until approved',submittedBy:c.reviewSubmittedBy||c.updatedBy||c.owner||'—',submittedAt:c.reviewSubmittedAt||c.updatedAt||'—',raw:c});});
 return out;
}
function ensureStyle(){if($('#apV44ReviewStyle'))return;const st=document.createElement('style');st.id='apV44ReviewStyle';st.textContent='.ap-v44-review-list{display:grid;gap:12px}.ap-v44-review-row{display:grid;grid-template-columns:92px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,.1)}.ap-v44-review-preview{width:92px;height:92px;display:grid;place-items:center;background:#061006;overflow:hidden}.ap-v44-review-preview img{width:100%;height:100%;object-fit:contain}.ap-v44-review-preview .ap-v44-type{font-size:22px}.ap-v44-review-meta{font-size:9px;line-height:1.6;color:rgba(255,255,255,.55)}.ap-v44-review-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ap-v44-review-badge{margin-left:auto}@media(max-width:760px){.ap-v44-review-row{grid-template-columns:72px 1fr}.ap-v44-review-preview{width:72px;height:82px}.ap-v44-review-actions{grid-column:1/-1;justify-content:flex-start}}';document.head.appendChild(st);}
function activate(){if(!canView()){toast(role()+' cannot access publishing reviews.');return false;}ensureSurface();$$('.ap-view').forEach(v=>v.classList.toggle('is-active',v.dataset.view==='reviews'));$$('#apNav button[data-view]').forEach(b=>b.classList.toggle('is-active',b.dataset.view==='reviews'));if(innerWidth<860)$('#apSidebar')?.classList.remove('is-open');render();return true;}
function ensureSurface(){
 ensureStyle();const nav=$('#apNav');
 if(nav&&!nav.querySelector('[data-view="reviews"]')){const media=nav.querySelector('[data-view="media"]');const b=document.createElement('button');b.type='button';b.dataset.view='reviews';b.innerHTML='<span class="ico">✓</span>Reviews <span class="pill ap-v44-review-badge" id="apReviewPill">0</span>';media?.parentElement?.insertBefore(b,media);}
 const navButton=nav?.querySelector('[data-view="reviews"]');if(navButton)navButton.hidden=!canView();
 let view=$('.ap-view[data-view="reviews"]');
 if(!view){view=document.createElement('section');view.className='ap-view';view.dataset.view='reviews';view.innerHTML='<div class="ap-page-head"><div><h1>Publishing Reviews</h1><p>One authoritative queue for submitted media, content and communications. Nothing awaiting review can publish or send until an authorized reviewer decides it.</p></div><button class="ap-btn" type="button" data-review-go="media">Open Media Library</button></div><div class="ap-card ap-panel"><div class="ap-panel-head"><div><h2>Needs review</h2><span id="apReviewSummary"></span></div></div><div class="ap-v44-review-list" id="apReviewList"></div></div>';$('.ap-content')?.appendChild(view);}return view;
}
function iconFor(x){if(x.preview)return`<img src="${esc(x.preview)}" alt="">`;return`<span class="ap-v44-type" aria-hidden="true">${x.type==='Communication'?'✉':'✦'}</span>`;}
function render(){
 ensureSurface();const s=Store.load(),items=pending(s),pill=$('#apReviewPill'),sum=$('#apReviewSummary'),list=$('#apReviewList');
 if(pill)pill.textContent=String(items.length);
 if(sum)sum.textContent=items.length+' pending · '+role()+(canReview()?' can decide':' can submit/view');
 if(!list)return;
 list.innerHTML=items.map(x=>`<article class="ap-v44-review-row" data-review-type="${esc(x.type)}" data-review-id="${esc(x.id)}"><div class="ap-v44-review-preview">${iconFor(x)}</div><div><strong>${esc(x.type+' · '+x.id+' · '+x.title)}</strong><div class="ap-v44-review-meta">Status: ${esc(x.status)} · Submitted by: ${esc(x.submittedBy)} · Submitted: ${esc(x.submittedAt)}<br>Target: ${esc(x.target||'—')} · Impact: ${esc(x.impact)}</div>${x.raw.reviewNote?`<div class="ap-v44-review-meta">Reviewer note: ${esc(x.raw.reviewNote)}</div>`:''}</div><div class="ap-v44-review-actions"><button class="ap-btn mini" data-review-open>Open workspace</button>${canReview()?'<button class="ap-btn mini primary" data-review-action="approve">Approve</button><button class="ap-btn mini" data-review-action="changes">Request changes</button><button class="ap-btn mini danger" data-review-action="reject">Reject</button>':'<span class="ap-status gold">Awaiting reviewer</span>'}</div></article>`).join('')||'<div class="ap-empty">Nothing is waiting for review.</div>';
}
function persist(s,action,target){Store.audit?.(s,action,target);Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));}
function findTarget(s,type,id){if(type==='Media')return Store.mediaById(s,id);if(type==='Content')return(s.content||[]).find(x=>x.id===id);if(type==='Communication')return(s.communications||[]).find(x=>x.id===id);return null;}
function decide(type,id,action){
 if(!canReview())return toast('Only Owner/Admin/Manager can approve or reject publishing reviews.');
 const s=Store.load(),obj=findTarget(s,type,id);if(!obj)return toast('Review item no longer exists.');
 let note='';if(action!=='approve')note=window.prompt(action==='reject'?'Reason for rejection':'Changes requested (optional note):','')||'';
 const now=new Date().toISOString(),who=actor();obj.reviewedBy=who;obj.reviewedAt=now;obj.reviewNote=note;obj.reviewOutcome=action==='approve'?'Approved':action==='reject'?'Rejected':'Needs changes';
 if(type==='Media'){
  if(action==='approve'){obj.status='Approved';obj.visible=true;}else if(action==='reject'){obj.status='Rejected';obj.visible=false;}else{obj.status='Needs review';obj.visible=false;}
 }else if(type==='Content'){
  obj.state=action==='approve'?'APPROVED':action==='reject'?'REJECTED':'IN_REVIEW';
 }else if(type==='Communication'){
  obj.status=action==='approve'?'Approved':action==='reject'?'Rejected':'Needs changes';obj.updatedAt=now;obj.updatedBy=who;
  if(action==='approve'){obj.approvedAt=now;obj.approvedBy=who;}else{obj.approvedAt=null;obj.approvedBy=null;}
 }
 persist(s,'Publishing review '+action,type+' '+id+(note?' · '+note:''));toast(type+' '+id+' '+(action==='approve'?'approved':action==='reject'?'rejected':'returned for changes')+'.');render();
}
function openWorkspace(type,id){
 if(type==='Communication'){document.querySelector('#apNav button[data-view="communication"]')?.click();setTimeout(()=>window.NSV421CommunicationAdmin?.preview?.(id),30);return;}
 if(type==='Content'){document.querySelector('#apNav button[data-view="content"]')?.click();return;}
 document.querySelector('#apNav button[data-view="media"]')?.click();
}
function openMedia(){const media=$('#apNav [data-view="media"]');if(!media)return toast('Media Library navigation is unavailable.');media.click();}
document.addEventListener('click',e=>{
 const a=e.target.closest?.('[data-review-action]');if(a){const row=a.closest('[data-review-id]');decide(row.dataset.reviewType,row.dataset.reviewId,a.dataset.reviewAction);return;}
 const o=e.target.closest?.('[data-review-open]');if(o){const row=o.closest('[data-review-id]');e.preventDefault();openWorkspace(row.dataset.reviewType,row.dataset.reviewId);return;}
 const nav=e.target.closest?.('#apNav [data-view="reviews"]');if(nav){e.preventDefault();e.stopImmediatePropagation();activate();return;}
 if(e.target.closest?.('[data-review-go="media"]')){e.preventDefault();openMedia();}
},true);
function submitMedia(id,target){if(!canSubmitMedia())return{ok:false,reason:'Current role cannot submit publishing reviews.'};const s=Store.load(),m=Store.mediaById(s,id);if(!m)return{ok:false,reason:'Media not found.'};m.status='Needs review';m.visible=false;m.reviewSubmittedBy=actor();m.reviewSubmittedAt=new Date().toISOString();m.reviewTarget=target||m.placement||'Library only';persist(s,'Media submitted for review',id+' → '+m.reviewTarget);render();return{ok:true};}
function submitCommunication(id){if(!canSubmitCommunication())return{ok:false,reason:'Current role cannot submit communication reviews.'};const s=Store.load(),c=(s.communications||[]).find(x=>x.id===id);if(!c)return{ok:false,reason:'Communication not found.'};if(!['Draft','Failed','Rejected','Needs changes'].includes(c.status))return{ok:false,reason:'Communication is not in a reviewable state.'};if(!String(c.message||'').trim()||!String(c.destination||'').trim())return{ok:false,reason:'Recipient destination and message are required before review.'};const now=new Date().toISOString();c.status='Needs review';c.reviewSubmittedBy=actor();c.reviewSubmittedAt=now;c.updatedAt=now;c.updatedBy=actor();c.approvedAt=null;c.approvedBy=null;persist(s,'Communication submitted for review',id);render();return{ok:true};}
function reason(m){if(!m)return'Media not found.';if(m.cat!=='People')return'Wrong category: this rail accepts People media only.';if(m.status!=='Approved')return m.status==='Needs review'||m.status==='Needs enhancement'?'Needs review before it can be published.':'Status '+m.status+' is not publishable.';if(m.visible===false)return'Media is hidden. Make it visible after approval.';if(m.publicAllowed===false)return'Website use is disabled for this media.';if(!(m.src||m.thumb))return'Media has no usable image source.';return'';}
window.NSV421ReviewQueue={open(type,id){if(!activate())return false;if(type&&id)setTimeout(()=>$('#apReviewList [data-review-type="'+CSS.escape(type)+'"][data-review-id="'+CSS.escape(id)+'"]')?.scrollIntoView({block:'center'}),30);return true;},submitMedia,submitCommunication,reason,render,activate,pending:()=>pending(Store.load())};
window.addEventListener('nsv421:change',()=>setTimeout(render,20));window.addEventListener('nsv421:production-ready',()=>setTimeout(render,20));document.addEventListener('change',e=>{if(e.target?.id==='apRole')setTimeout(render,0)},true);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',render,{once:true}):render();
})();
