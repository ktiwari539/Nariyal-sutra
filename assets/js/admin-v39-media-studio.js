(function(){
'use strict';
if(window.__NS_V421_ADMIN_MEDIA_STUDIO__)return;window.__NS_V421_ADMIN_MEDIA_STUDIO__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function canonicalizeAdminUrl(){
 if(/\/admin-preview\.html$/i.test(location.pathname)){
  try{history.replaceState(history.state,'',location.pathname.replace(/admin-preview\.html$/i,'admin.html')+location.search+location.hash);}catch(_e){}
 }
}
function installStyle(){
 if($('#apV39MediaStyle'))return;
 const st=document.createElement('style');st.id='apV39MediaStyle';st.textContent=`
 #apMediaGrid{grid-template-columns:repeat(auto-fit,minmax(270px,1fr))!important;gap:16px!important}
 #apMediaGrid .ap-media-card{overflow:hidden;border-color:rgba(212,168,67,.20)!important;box-shadow:0 12px 34px rgba(0,0,0,.16);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
 #apMediaGrid .ap-media-card:hover{transform:translateY(-2px);border-color:rgba(212,168,67,.42)!important;box-shadow:0 18px 42px rgba(0,0,0,.24)}
 #apMediaGrid .ap-media-visual{height:220px!important;min-height:220px!important;background:#061006;overflow:hidden}
 #apMediaGrid .ap-media-img{width:100%!important;height:100%!important;object-fit:cover!important;cursor:zoom-in;display:block!important}
 #apMediaGrid .ap-media-body{padding:14px!important}
 .ap-v39-details{width:100%;margin-top:10px!important;justify-content:center!important}
 #apV39MediaInspector{position:fixed;inset:0;z-index:2147483000;background:rgba(1,8,4,.86);backdrop-filter:blur(16px);display:none;align-items:center;justify-content:center;padding:22px}
 #apV39MediaInspector.is-open{display:flex}
 .ap-v39-dialog{width:min(1220px,96vw);max-height:92vh;overflow:auto;background:#071107;border:1px solid rgba(212,168,67,.32);box-shadow:0 32px 90px rgba(0,0,0,.58);display:grid;grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr)}
 .ap-v39-preview{min-height:620px;background:#020702;position:relative;display:grid;place-items:center;overflow:hidden}
 .ap-v39-preview img{width:100%;height:100%;max-height:82vh;object-fit:contain;background:#020702}
 .ap-v39-preview-meta{position:absolute;left:16px;bottom:16px;padding:8px 10px;background:rgba(1,8,4,.78);border:1px solid rgba(212,168,67,.20);font:600 10px/1.4 Inter,sans-serif;color:#f6e7ba;letter-spacing:.04em}
 .ap-v39-editor{padding:24px;display:flex;flex-direction:column;gap:16px}
 .ap-v39-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ap-v39-head h2{margin:0;font:500 30px/1.05 'Playfair Display',serif}.ap-v39-close{border:1px solid rgba(255,255,255,.16);background:transparent;color:white;width:34px;height:34px;cursor:pointer;font-size:22px}
 .ap-v39-id{font:700 10px/1 Inter,sans-serif;letter-spacing:.14em;color:#d4a843;text-transform:uppercase}.ap-v39-path{font:500 10px/1.5 ui-monospace,monospace;color:rgba(255,255,255,.48);word-break:break-all}
 .ap-v39-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ap-v39-field{display:flex;flex-direction:column;gap:6px}.ap-v39-field.wide{grid-column:1/-1}.ap-v39-field label{font:700 9px/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.58)}
 .ap-v39-field input,.ap-v39-field select,.ap-v39-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.14);background:#0a1709;color:#fff;padding:10px 11px;font:500 12px/1.4 Inter,sans-serif}.ap-v39-field textarea{min-height:86px;resize:vertical}
 .ap-v39-checks{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ap-v39-checks label{display:flex;gap:8px;align-items:center;padding:9px;border:1px solid rgba(255,255,255,.10);font-size:11px;color:rgba(255,255,255,.72)}
 .ap-v39-usage{display:flex;flex-wrap:wrap;gap:6px}.ap-v39-chip{padding:6px 8px;border:1px solid rgba(212,168,67,.18);background:rgba(212,168,67,.06);color:#e8cd80;font-size:10px}.ap-v39-empty{font-size:11px;color:rgba(255,255,255,.46)}
 .ap-v39-actions{display:flex;gap:8px;flex-wrap:wrap}.ap-v39-actions button{min-height:38px}.ap-v39-primary{background:#d4a843!important;color:#071107!important;border-color:#d4a843!important;font-weight:800!important}
 @media(max-width:860px){.ap-v39-dialog{grid-template-columns:1fr}.ap-v39-preview{min-height:360px}.ap-v39-fields{grid-template-columns:1fr}.ap-v39-field.wide{grid-column:auto}}
 `;document.head.appendChild(st);
}
function usageFor(s,id){
 const out=[];
 Object.entries(s.sectionMedia||{}).forEach(([key,val])=>{if(val===id)out.push('Section · '+key);});
 if((s.faceMarquee?.selectedIds||[]).includes(id))out.push('Homepage people rail');
 Object.entries(s.peopleStreams||{}).forEach(([key,v])=>{if((v?.selectedIds||[]).includes(id))out.push('People · '+key);});
 (s.customSections||[]).forEach(sec=>{if((sec.mediaIds||[]).includes(id))out.push('Custom section · '+(sec.title||sec.id));});
 (s.schedule||[]).forEach(item=>{if(item.mediaId===id)out.push('Schedule · '+(item.sectionId||item.id));});
 return [...new Set(out)];
}
function ensureInspector(){
 let root=$('#apV39MediaInspector');if(root)return root;
 root=document.createElement('div');root.id='apV39MediaInspector';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Media details');document.body.appendChild(root);
 root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-v39-close]'))closeInspector();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('is-open'))closeInspector();});
 return root;
}
function closeInspector(){const root=$('#apV39MediaInspector');if(root){root.classList.remove('is-open');root.innerHTML='';}}
function openInspector(id){
 const s=Store.load(),m=Store.mediaById(s,id);if(!m)return;
 const root=ensureInspector(),src=m.src||m.thumb||'',usage=usageFor(s,id);
 root.innerHTML=`<div class="ap-v39-dialog"><div class="ap-v39-preview"><img id="apV39PreviewImg" src="${esc(src)}" alt="${esc(m.name||id)}"><div class="ap-v39-preview-meta" id="apV39Dimensions">Loading dimensions…</div></div><form class="ap-v39-editor" id="apV39MediaForm"><div class="ap-v39-head"><div><div class="ap-v39-id">${esc(id)} · Media inspector</div><h2>${esc(m.name||id)}</h2></div><button class="ap-v39-close" type="button" data-v39-close aria-label="Close">×</button></div><div class="ap-v39-path">${esc(src)}</div><div class="ap-v39-fields"><div class="ap-v39-field wide"><label>Display title</label><input name="name" value="${esc(m.name||'')}" required></div><div class="ap-v39-field"><label>Category</label><input name="cat" value="${esc(m.cat||'Other')}"></div><div class="ap-v39-field"><label>Placement / purpose</label><input name="placement" value="${esc(m.placement||'Library only')}"></div><div class="ap-v39-field"><label>Status</label><select name="status">${['Approved','Needs review','Rejected'].map(v=>`<option ${m.status===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="ap-v39-field"><label>Image focus</label><select name="focus">${[['50% 50%','Center'],['50% 30%','Top'],['50% 70%','Bottom'],['30% 50%','Left'],['70% 50%','Right']].map(([v,n])=>`<option value="${v}" ${(m.focus||'50% 50%')===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="ap-v39-field wide"><label>Admin notes</label><textarea name="notes" placeholder="Usage notes, crop guidance, campaign context…">${esc(m.notes||'')}</textarea></div></div><div class="ap-v39-checks"><label><input name="visible" type="checkbox" ${m.visible!==false?'checked':''}>Visible in Admin/public eligibility</label><label><input name="publicAllowed" type="checkbox" ${m.publicAllowed!==false?'checked':''}>Can be used on website</label><label><input name="storyAllowed" type="checkbox" ${m.storyAllowed!==false?'checked':''}>Can be used in stories</label><label><input name="homepageAllowed" type="checkbox" ${m.homepageAllowed===true?'checked':''}>Can be used on homepage</label></div><div><div class="ap-v39-id" style="margin-bottom:9px">Where this media is used</div><div class="ap-v39-usage">${usage.length?usage.map(x=>`<span class="ap-v39-chip">${esc(x)}</span>`).join(''):'<span class="ap-v39-empty">Not currently assigned to a live section.</span>'}</div></div><div class="ap-v39-actions"><button class="ap-btn ap-v39-primary" type="submit">Save media details</button><button class="ap-btn" type="button" data-v39-close>Close</button></div></form></div>`;
 root.classList.add('is-open');
 const img=$('#apV39PreviewImg');if(img){const show=()=>{$('#apV39Dimensions').textContent=(img.naturalWidth&&img.naturalHeight)?`${img.naturalWidth} × ${img.naturalHeight} · ${m.cat||'Other'} · ${m.status||'—'}`:'Preview unavailable';};img.complete?show():img.addEventListener('load',show,{once:true});img.addEventListener('error',show,{once:true});}
 const form=$('#apV39MediaForm');form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form),x=Store.load(),target=Store.mediaById(x,id);if(!target)return;target.name=String(fd.get('name')||'').trim()||id;target.cat=String(fd.get('cat')||'Other').trim()||'Other';target.placement=String(fd.get('placement')||'Library only').trim()||'Library only';target.status=String(fd.get('status')||target.status||'Needs review');target.notes=String(fd.get('notes')||'').trim();target.focus=String(fd.get('focus')||'50% 50%');target.visible=fd.has('visible');target.publicAllowed=fd.has('publicAllowed');target.storyAllowed=fd.has('storyAllowed');target.homepageAllowed=fd.has('homepageAllowed');Store.audit?.(x,'Media details updated',id);Store.save(x);window.dispatchEvent(new CustomEvent('nsv421:change'));closeInspector();setTimeout(enhanceCards,80);};
}
function enhanceCards(){
 const grid=$('#apMediaGrid');if(!grid)return;
 $$('.ap-media-card',grid).forEach(card=>{
  const id=card.dataset.id||$('.ap-media-id',card)?.textContent?.trim();if(!id)return;
  const img=$('.ap-media-img',card);if(img&&!img.dataset.v39Bound){img.dataset.v39Bound='1';img.title='Open large preview and edit details';img.addEventListener('click',e=>{e.preventDefault();openInspector(id);});}
  const body=$('.ap-media-body',card);if(body&&!$('[data-v39-inspect]',card)){const b=document.createElement('button');b.type='button';b.className='ap-btn mini ap-v39-details';b.dataset.v39Inspect=id;b.textContent='View / edit details';b.onclick=()=>openInspector(id);body.appendChild(b);}
 });
}
function bind(){
 installStyle();canonicalizeAdminUrl();ensureInspector();enhanceCards();
 const grid=$('#apMediaGrid');if(grid)new MutationObserver(()=>enhanceCards()).observe(grid,{childList:true,subtree:true});
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-view="media"]');if(b)setTimeout(enhanceCards,80);});
 window.addEventListener('nsv421:change',()=>setTimeout(enhanceCards,100));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
window.NSV421AdminMediaStudio={open:openInspector,enhance:enhanceCards};
})();