(function(){
'use strict';
const Store=window.NSV421Store, MediaDB=window.NSV421MediaDB;
const $=(s,r=document)=>r.querySelector(s);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function eligible(s,id){const m=Store?.mediaById(s,id);return Store?.eligibleForPublic(s,m)?m:null;}
function sources(m){const id=m?.id||'';return [...new Set([m?.thumb,m?.src,`assets/images/ambassadors/thumbs/${id}.webp`,`assets/images/ambassadors/${id}.webp`,`assets/images/ambassador-preview/${id}.jpg`,`media-reference/candidates/${id}.webp`].filter(Boolean))];}
function card(m){const ss=sources(m),src=ss[0]||'assets/images/upload-placeholder.svg',blob=m.localBlobKey?` data-local-blob-key="${esc(m.localBlobKey)}"`:'',quality=m.qualityTier||'',fit=m.fit||'contain';return `<article class="v25-story-person" data-id="${esc(m.id)}" data-quality="${esc(quality)}"><div class="v25-story-photo"><img src="${esc(src)}"${blob} alt="${esc(m.caption||m.name||'Nariyal Sutra community story')}" loading="eager" decoding="async" style="object-fit:${esc(fit)};object-position:${esc(m.focus||'50% 50%')}"></div><div class="v25-story-caption"><b>${esc(m.name||m.id)}</b>${m.caption?`<span>${esc(m.caption)}</span>`:''}</div></article>`;}
function device(){const w=innerWidth||1200;return w<=640?'mobile':w<=980?'tablet':'desktop';}
function visibleIds(st,items){
 const d=device(),vis=st.deviceVisibility||{},filtered=items.filter(m=>vis[m.id]?.[d]!==false),limit=d==='mobile'?+st.mobileLimit||0:d==='tablet'?+st.tabletLimit||0:+st.desktopLimit||0;
 return limit>0?filtered.slice(0,Math.max(1,limit)):filtered;
}
function streamSection(key,st,items){
 const reverse=st.direction==='rtl',anchor='people-'+key,list=visibleIds(st,items),inner=list.map(card).join('');
 if(!inner)return '';
 const mode=list.length<2?'static':'loop';
 return `<section class="v25-story-stream" id="${esc(anchor)}" data-stream="${esc(key)}" data-stream-mode="${mode}" data-device="${device()}" style="--v25-speed:${+st.speed||48}s"><div class="v25-story-stream-head"><div><small>${key==='ambassadors'?'Ambassadors':key==='promoters'?'Promoters':'Community'}</small><h3>${esc(st.title||key)}</h3></div><p>${esc(st.subtitle||'')}</p></div><div class="v25-story-viewport"><div class="v25-story-track ${reverse?'reverse':''} ${mode==='static'?'is-static':''}"><div class="v25-story-group">${inner}</div>${mode==='loop'?`<div class="v25-story-group" aria-hidden="true">${inner}</div>`:''}</div></div><div class="v25-story-stream-foot">Full-picture treatment · Admin controls image selection, order, speed, direction and device visibility</div></section>`;}
function normalizeAfterFailure(root,id){const cards=[...root.querySelectorAll(`.v25-story-person[data-id="${CSS.escape(id)}"]`)];cards.forEach(c=>c.remove());const groups=[...root.querySelectorAll('.v25-story-group')],live=groups[0]?.querySelectorAll('.v25-story-person').length||0;if(live<2){root.querySelector('.v25-story-track')?.classList.add('is-static');root.dataset.streamMode='static';if(groups.length>1)groups[1].remove();}if(!live)root.remove();}
function wireFallback(root,s){root.querySelectorAll('.v25-story-person img:not([data-local-blob-key])').forEach(img=>{const id=img.closest('.v25-story-person')?.dataset.id,m=Store.mediaById(s,id),ss=sources(m);let i=Math.max(0,ss.indexOf(img.getAttribute('src')));img.onerror=()=>{i++;if(i<ss.length){img.src=ss[i];return;}img.onerror=null;const stream=img.closest('.v25-story-stream');if(stream&&id)normalizeAfterFailure(stream,id);};});}
function render(){if(!Store||!$('#v25PeopleStreams'))return;const s=Store.load(),streams=s.peopleStreams||{},host=$('#v25PeopleStreams');let html='';for(const key of ['ambassadors','promoters','community']){const st=streams[key]||{};if(st.enabled===false)continue;const ids=[...new Set(st.selectedIds||[])],items=ids.map(id=>eligible(s,id)).filter(Boolean);if(!items.length)continue;html+=streamSection(key,st,items);}host.innerHTML=html;const world=host.closest('.v25-people-worlds');if(world)world.hidden=!html;if(MediaDB?.hydrate)MediaDB.hydrate(host);wireFallback(host,s);}
function addTelegramGateNote(){document.querySelectorAll('.v23-community-form').forEach(f=>{if(f.querySelector('.v25-telegram-note'))return;const t=document.createElement('div');t.className='v25-telegram-note';t.textContent='Telegram username is stored only as a contact preference until the official Nariyal Sutra bot/chat link is enabled.';const tg=f.querySelector('input[name=telegram]');tg?.parentElement?.appendChild(t);});}
function init(){render();addTelegramGateNote();addEventListener('nsv421:change',render);addEventListener('resize',()=>{clearTimeout(init.r);init.r=setTimeout(render,140);},{passive:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
