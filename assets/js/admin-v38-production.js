(function(){
'use strict';
if(window.__NS_V421_ADMIN_V38__)return;window.__NS_V421_ADMIN_V38__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TARGETS=[
 ['homepage-hero','Homepage hero','Main product/lifestyle hero','/assets/images/nariyal-premium-hero.webp'],
 ['homepage-brand','Brand moment','Immersive brand background','/assets/images/website-media/ws010-coast-sunset-grove.webp'],
 ['homepage-harvest-1','Harvest film · frame 1','First harvest editorial frame','/assets/images/review/coastal-grove.png'],
 ['homepage-harvest-2','Harvest film · frame 2','Second harvest editorial frame','/assets/images/website-media/ws005-field-harvest-workers.webp'],
 ['homepage-harvest-3','Harvest film · frame 3','Third harvest editorial frame','/assets/images/website-media/ws006-tender-coconut-basket.webp'],
 ['homepage-people-teaser','People teaser','People of Nariyal Sutra editorial image','/assets/images/ambassadors/G001.webp'],
 ['homepage-cinematic-grove','Cinematic grove','Professional cinematic background','/assets/images/review/coastal-grove.png'],
 ['homepage-cinematic-canopy','Cinematic canopy','Professional cinematic upper canopy','/assets/images/review/coastal-grove.png'],
 ['people-hero','People page hero','People of Nariyal Sutra hero','/assets/images/review/coastal-grove.png'],
 ['fresh-tender-hero','Fresh tender page hero','Fresh tender coconut hero','/assets/images/nariyal-premium-hero.webp'],
 ['green-hero','Green coconut page hero','Green coconut hero','/assets/images/green-round-coconut.jpg'],
 ['bulk-hero','Bulk supply page hero','Bulk supply hero','/assets/images/nariyal-product-collection.webp']
];
let sequenceObserverBound=false,sequenceRepairTimer=null,customEditorBound=false,taskCreateBound=false,targetActionBound=false;
function state(){return Store.load();}
function toast(msg){const e=$('#apToast');if(!e){console.log(msg);return;}e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2700);}
function modal(title,sub,body){const box=$('#apModal');if(!box)return;$('#apModalTitle').textContent=title;$('#apModalSub').textContent=sub||'';$('#apModalBody').innerHTML=body;box.classList.add('is-open');}
function closeModal(){$('#apModal')?.classList.remove('is-open','ap-modal-wide');}
function targetPanel(){const view=$('.ap-view[data-view="pages"]');if(!view||$('#apV38ImageTargets'))return;const card=document.createElement('div');card.id='apV38ImageTargets';card.className='ap-card ap-panel';card.style.marginTop='16px';view.insertBefore(card,view.firstChild);renderTargets();}
function targetMeta(id){return TARGETS.find(x=>x[0]===id)||null;}
function renderTargets(){
 const host=$('#apV38ImageTargets');if(!host)return;const s=state();s.sectionMedia=s.sectionMedia||{};
 host.innerHTML=`<div class="ap-panel-head"><div><h2>Live image placement map</h2><span>Preview the image currently used by each storefront section. Change once; the same saved configuration is read by the storefront.</span></div><button class="ap-btn" type="button" id="apV38PreviewImages" data-v38-preview>Open storefront ↗</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px">${TARGETS.map(([id,name,desc,def])=>{const mid=s.sectionMedia[id],m=mid?Store.mediaById(s,mid):null,configured=m&&(m.thumb||m.src),src=configured||def,status=configured?`Custom · ${esc(m.name||mid)}`:'Default image';return `<article style="border:1px solid rgba(212,168,67,.14);padding:12px;background:rgba(255,255,255,.02)"><img src="${esc(src)}" alt="${esc(name)}" style="width:100%;height:150px;object-fit:cover;margin-bottom:10px"><div style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:${configured?'#d4a843':'var(--muted)'};margin-bottom:6px">${status}</div><strong>${esc(name)}</strong><p style="font-size:10px;color:var(--muted);line-height:1.5;margin:5px 0 10px">${esc(desc)}</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="ap-btn mini" type="button" data-v38-target="${id}">Change image</button>${configured?`<button class="ap-btn mini" type="button" data-v38-clear="${id}">Use default</button>`:''}</div></article>`}).join('')}</div>`;
}
function chooseImage(target){
 const s=state(),meta=targetMeta(target),approved=(s.media||[]).filter(m=>m.status==='Approved'&&m.visible!==false&&m.publicAllowed!==false&&m.brandFit!=='Weak'&&(m.src||m.thumb));
 if(!approved.length){modal('Change section image',meta?.[1]||target,'<p style="color:var(--muted)">No approved public images are available yet. Approve an image in Media Library first.</p>');return;}
 modal('Change section image',meta?.[1]||target,`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-height:58vh;overflow:auto">${approved.map(m=>`<button type="button" data-v38-pick="${esc(m.id)}" data-v38-pick-target="${esc(target)}" style="padding:0;border:1px solid rgba(212,168,67,.16);background:#0a1506;color:white;text-align:left;cursor:pointer"><img src="${esc(m.thumb||m.src)}" alt="" style="width:100%;height:130px;object-fit:cover;display:block"><span style="display:block;padding:8px;font-size:10px">${esc(m.name||m.id)}</span></button>`).join('')}</div>`);
}
function bindTargetActions(){
 if(targetActionBound)return;targetActionBound=true;
 document.addEventListener('click',e=>{
  const targetBtn=e.target?.closest?.('[data-v38-target]');
  if(targetBtn){e.preventDefault();e.stopPropagation();chooseImage(targetBtn.dataset.v38Target);return;}
  const clearBtn=e.target?.closest?.('[data-v38-clear]');
  if(clearBtn){e.preventDefault();e.stopPropagation();const x=state();x.sectionMedia=x.sectionMedia||{};delete x.sectionMedia[clearBtn.dataset.v38Clear];Store.audit(x,'Section image restored to default',clearBtn.dataset.v38Clear);Store.save(x);renderTargets();toast('Default image restored.');return;}
  const pick=e.target?.closest?.('[data-v38-pick]');
  if(pick){e.preventDefault();e.stopPropagation();const target=pick.dataset.v38PickTarget,id=pick.dataset.v38Pick;if(!target||!id)return;const x=state();x.sectionMedia=x.sectionMedia||{};x.sectionMedia[target]=id;Store.audit(x,'Section image changed',target+' → '+id);Store.save(x);closeModal();renderTargets();toast('Section image saved.');window.dispatchEvent(new CustomEvent('nsv421:change'));return;}
  const preview=e.target?.closest?.('[data-v38-preview]');
  if(preview){e.preventDefault();e.stopPropagation();window.open('/','_blank','noopener');}
 },true);
}
function saveHomepage(s,action,target){Store.audit(s,action,target);Store.save(s);toast(action);}
function renderHomepageSequence(){
 const host=$('#apPageSectionList');if(!host)return;
 const s=state(),sections=[...(s.sections||[])].sort((a,b)=>(+a.order||999)-(+b.order||999));
 host.innerHTML=`<span data-v38-sequence-owner hidden></span>`+sections.map((sec,i)=>`<div class="ap-section-row"><div><strong>${String(i+1).padStart(2,'0')} · ${esc(sec.title||sec.id)}</strong>${sec.id==='cinematic'?'<span class="ap-protected" style="margin-left:8px">Professional cinematic</span>':''}<div class="ap-task-meta"><span>${esc(sec.page||'homepage')}</span><span>${sec.visible===false?'Hidden':'Visible'}</span><span>${esc(sec.motion||'—')}</span></div></div><div class="ap-section-actions"><button class="ap-btn mini" type="button" data-sec-up="${esc(sec.id)}" ${i===0?'disabled':''}>↑</button><button class="ap-btn mini" type="button" data-sec-down="${esc(sec.id)}" ${i===sections.length-1?'disabled':''}>↓</button><button class="ap-btn mini" type="button" data-sec-vis="${esc(sec.id)}">${sec.visible===false?'Show':'Hide'}</button></div></div>`).join('');
 $$('[data-sec-up]',host).forEach(b=>b.onclick=()=>moveHomepage(b.dataset.secUp,-1));
 $$('[data-sec-down]',host).forEach(b=>b.onclick=()=>moveHomepage(b.dataset.secDown,1));
 $$('[data-sec-vis]',host).forEach(b=>b.onclick=()=>toggleHomepage(b.dataset.secVis));
}
function bindSequenceOwnership(){
 if(sequenceObserverBound)return;const host=$('#apPageSectionList');if(!host)return;sequenceObserverBound=true;
 const observer=new MutationObserver(()=>{if(host.querySelector('[data-v38-sequence-owner]'))return;clearTimeout(sequenceRepairTimer);sequenceRepairTimer=setTimeout(()=>{if(!host.querySelector('[data-v38-sequence-owner]'))renderHomepageSequence();},0);});
 observer.observe(host,{childList:true,subtree:false});
}
function moveHomepage(id,dir){
 const s=state(),sections=[...(s.sections||[])].sort((a,b)=>(+a.order||999)-(+b.order||999)),i=sections.findIndex(x=>x.id===id),j=i+dir;
 if(i<0||j<0||j>=sections.length)return;
 const a=sections[i],b=sections[j],tmp=+a.order||i+1;a.order=+b.order||j+1;b.order=tmp;
 saveHomepage(s,'Homepage section moved',id);renderHomepageSequence();
}
function toggleHomepage(id){const s=state(),sec=(s.sections||[]).find(x=>x.id===id);if(!sec)return;sec.visible=sec.visible===false;saveHomepage(s,'Homepage section visibility changed',id);renderHomepageSequence();}
function openCustomSectionEditor(id){
 const s=state(),sec=(s.customSections||[]).find(x=>x.id===id);if(!sec)return toast('Section configuration is unavailable.');
 modal('Edit website section',sec.page||'homepage',`<form class="ap-form" id="v21SectionForm"><div class="ap-field"><label>Title</label><input name="title" value="${esc(sec.title||'')}" required></div><div class="ap-field"><label>Subtitle</label><textarea name="subtitle">${esc(sec.subtitle||'')}</textarea></div><div class="ap-row"><div class="ap-field"><label>Template</label><select name="template">${['Feature story','Editorial grid','Portrait rail','Motion campaign','Product feature','Trust strip','Proof strip'].map(v=>`<option ${v===sec.template?'selected':''}>${v}</option>`).join('')}</select></div><div class="ap-field"><label>Motion</label><select name="motion">${['None','Slow crossfade','Marquee','Ken Burns','Masked reveal'].map(v=>`<option ${v===sec.motion?'selected':''}>${v}</option>`).join('')}</select></div></div><button class="ap-btn primary" type="submit">Save section</button></form>`);
 const form=$('#v21SectionForm');if(!form)return;
 form.onsubmit=e=>{e.preventDefault();const f=new FormData(form),x=state(),target=(x.customSections||[]).find(v=>v.id===id);if(!target)return toast('Section configuration changed. Reopen the editor.');const title=String(f.get('title')||'').trim(),subtitle=String(f.get('subtitle')||'').trim();if(!title)return toast('Section title is required.');Object.assign(target,{title,subtitle,template:f.get('template'),motion:f.get('motion')});if(id==='CS-PEOPLE'){x.faceMarquee=x.faceMarquee||{};x.faceMarquee.title=title;x.faceMarquee.subtitle=subtitle;}Store.audit(x,'Website section updated',id);Store.save(x);closeModal();toast('Website section updated.');};
}
function bindCustomSectionOwnership(){
 if(customEditorBound)return;customEditorBound=true;
 document.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-custom-edit]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();openCustomSectionEditor(btn.dataset.customEdit);},true);
}
function addTask(){
 const title=String(window.prompt('Task')||'').trim();if(!title)return;
 const x=state();x.tasks=Array.isArray(x.tasks)?x.tasks:[];
 const session=Store.getSession?.()||{},owner=String(session.name||$('#apUserName')?.textContent||$('#apRole')?.value||'Owner').trim()||'Owner';
 const due=new Date(Date.now()+86400000).toISOString().slice(0,10);
 x.tasks.push({id:'TASK-'+Date.now(),title,owner,due,state:'Open'});
 Store.audit(x,'Task assigned',title);Store.save(x);toast('Task assigned.');
}
function bindTaskOwnership(){
 if(taskCreateBound)return;taskCreateBound=true;
 document.addEventListener('click',e=>{const btn=e.target?.closest?.('#apTaskAdd');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();addTask();},true);
}
function productionNotice(){const bridge=window.NSV421ProductionBridge;if(!bridge?.isProduction)return;const e=$('.ap-env');if(e)e.innerHTML='LIVE SECURE ADMIN<br>Firebase-backed content, media and workflow configuration.';const reset=$('#apResetLocal');if(reset){reset.disabled=true;reset.title='Reset is disabled in production';reset.textContent='Production state protected';}const login=$('#apV12AdminLogin');if(login){login.textContent='Signed-in staff';login.disabled=true;}}
async function productionUpload(e){const files=[...(e.target.files||[])];e.target.value='';if(!files.length)return;const bridge=window.NSV421ProductionBridge;if(!bridge?.isProduction||!bridge.uploadMedia)return;let added=0;for(const f of files){if(f.size>8*1024*1024){toast(f.name+' exceeds 8 MB.');continue;}try{toast('Uploading '+f.name+'…');const id='U'+Date.now()+String(added),out=await bridge.uploadMedia(f,{publicId:id,tags:'nariyal-sutra,admin-media',context:'caption='+String(f.name).replace(/[|=]/g,' ')});const s=state();s.media=s.media||[];s.media.push({id,name:f.name,cat:'Other',status:'Needs review',visible:false,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Review',placement:'Library only',faceGroup:null,src:out.secure_url,thumb:out.secure_url,provider:'cloudinary',providerPublicId:out.public_id||'',width:out.width||null,height:out.height||null,version:1,versions:[{version:1,src:out.secure_url,provider:'cloudinary',publicId:out.public_id||'',at:new Date().toISOString()}]});Store.audit(s,'Production media uploaded',id);Store.save(s);added++;}catch(err){console.error('[Production media upload]',err);toast('Upload failed: '+(err?.message||err));}}if(added){window.dispatchEvent(new CustomEvent('nsv421:change'));toast(added+' image'+(added===1?'':'s')+' uploaded for review.');}}
function bindUpload(){const picker=$('#apNewMediaPicker');if(!picker)return;const bridge=window.NSV421ProductionBridge;if(!bridge?.isProduction)return;picker.onchange=productionUpload;const b=$('#apUploadMedia');if(b)b.title='Production uploads are signed and stored in Cloudinary.';}
function bindSaveStatus(){window.addEventListener('nsv421:remote-saved',()=>toast('Saved to live Admin configuration.'));window.addEventListener('nsv421:remote-error',e=>toast('Live save failed: '+String(e.detail||'unknown error')));}
async function init(){targetPanel();renderHomepageSequence();bindSequenceOwnership();bindTargetActions();bindCustomSectionOwnership();bindTaskOwnership();setTimeout(()=>{targetPanel();renderTargets();renderHomepageSequence();bindSequenceOwnership();},250);setTimeout(()=>{targetPanel();renderTargets();renderHomepageSequence();bindSequenceOwnership();},900);productionNotice();bindSaveStatus();const bridge=window.NSV421ProductionBridge;if(bridge?.isProduction){const r=await bridge.ready;if(r?.error)return;productionNotice();bindUpload();renderTargets();setTimeout(bindUpload,800);}window.addEventListener('nsv421:change',()=>{renderTargets();renderHomepageSequence();setTimeout(renderHomepageSequence,0);if(window.NSV421ProductionBridge?.isProduction)setTimeout(bindUpload,20);});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
