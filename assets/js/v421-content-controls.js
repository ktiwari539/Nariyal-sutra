(function(){
'use strict';
if(window.__NS_V421_CONTENT_CONTROLS__)return;window.__NS_V421_CONTENT_CONTROLS__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const PAGE_IDS={
 'index.html':'homepage','':'homepage','people-of-nariyal-sutra.html':'people','coconut-events-hospitality.html':'hospitality','direct-farm.html':'sourcing','fresh-tender-coconut.html':'fresh-tender-coconut','green-coconut.html':'green-coconut','bulk-coconut-supply.html':'bulk'
};
const TARGETS={
 'homepage-hero':{page:'homepage',sel:'.hero-visual img',kind:'img'},
 'homepage-brand':{page:'homepage',sel:'.brand-moment-bg',kind:'bg',overlay:'linear-gradient(90deg,rgba(2,9,2,.90) 0%,rgba(2,9,2,.40) 48%,rgba(2,9,2,.72) 100%)'},
 'homepage-harvest-1':{page:'homepage',sel:'#harvest-film .harvest-scene:nth-child(1)',kind:'img'},
 'homepage-harvest-2':{page:'homepage',sel:'#harvest-film .harvest-scene:nth-child(2)',kind:'img'},
 'homepage-harvest-3':{page:'homepage',sel:'#harvest-film .harvest-scene:nth-child(3)',kind:'img'},
 'homepage-people-teaser':{page:'homepage',sel:'#people-of-nariyal .ns-people-visual img',kind:'img'},
 'homepage-cinematic-grove':{page:'homepage',sel:'#v421-cinematic-film-pro .nspro-bg',kind:'img'},
 'homepage-cinematic-canopy':{page:'homepage',sel:'#v421-cinematic-film-pro .nspro-canopy-photo',kind:'img'},
 'people-hero':{page:'people',sel:'#peopleHeroImg',kind:'img'},
 'fresh-tender-hero':{page:'fresh-tender-coconut',sel:'.w-hero-media img',kind:'img'},
 'green-hero':{page:'green-coconut',sel:'.w-hero-media img',kind:'img'},
 'bulk-hero':{page:'bulk',sel:'.w-hero-media img',kind:'img'}
};
function file(){return (location.pathname.split('/').pop()||'index.html').toLowerCase();}
function pageId(){return PAGE_IDS[file()]||file().replace(/\.html$/,'');}
function mediaURL(s,id){const m=Store.mediaById(s,id);return m&&Store.eligibleForPublic(s,m)?(m.src||m.thumb||''):'';}
function applyImages(){
 const s=Store.load(),map=s.sectionMedia||{};
 for(const [id,mId] of Object.entries(map)){
  const t=TARGETS[id];if(!t||t.page!==pageId())continue;const src=mediaURL(s,mId);if(!src)continue;
  const el=$(t.sel);if(!el)continue;
  if(t.kind==='img'){if(el.getAttribute('src')!==src){el.src=src;el.removeAttribute('srcset');el.dataset.adminMedia=mId;}}
  else{el.style.backgroundImage=(t.overlay?t.overlay+',':'')+`url("${String(src).replace(/"/g,'')}")`;el.dataset.adminMedia=mId;}
 }
}
function ensureStyle(){if($('#nsAdminCustomStyle'))return;const st=document.createElement('style');st.id='nsAdminCustomStyle';st.textContent='.ns-admin-custom-section{position:relative;padding:clamp(72px,8vw,120px) clamp(20px,6vw,88px);background:linear-gradient(145deg,#061004,#0d1c08);border-top:1px solid rgba(212,168,67,.14);border-bottom:1px solid rgba(212,168,67,.10);color:#fdf7e8;overflow:hidden}.ns-admin-custom-inner{max-width:1240px;margin:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);gap:clamp(32px,6vw,80px);align-items:center}.ns-admin-custom-copy small{display:block;color:#d4a843;letter-spacing:.32em;text-transform:uppercase;font:600 9px/1.4 Jost,sans-serif;margin-bottom:16px}.ns-admin-custom-copy h2{font:400 clamp(44px,6vw,86px)/.96 "Playfair Display",serif;margin:0}.ns-admin-custom-copy p{max-width:650px;color:rgba(255,255,255,.6);line-height:1.8;margin:22px 0 0}.ns-admin-custom-media{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ns-admin-custom-media img{width:100%;height:260px;object-fit:cover;border:1px solid rgba(212,168,67,.18)}.ns-admin-custom-media img:first-child:last-child{grid-column:1/-1;height:360px}@media(max-width:800px){.ns-admin-custom-inner{grid-template-columns:1fr}.ns-admin-custom-media img{height:220px}}';document.head.appendChild(st);}
function customHost(){return document.querySelector('footer')?.parentElement||document.querySelector('main')||document.body;}
function renderCustom(){
 const s=Store.load(),pid=pageId();ensureStyle();
 if(pid==='homepage'){
  const meta=(s.customSections||[]).find(x=>x.id==='CS-PEOPLE');if(meta){const title=$('#ns-face-title'),sub=$('[data-face-sub]');if(title&&meta.title)title.textContent=meta.title;if(sub&&meta.subtitle)sub.textContent=meta.subtitle;}
 }
 const wanted=(s.customSections||[]).filter(x=>x.id!=='CS-PEOPLE'&&x.page===pid&&x.visible!==false);const ids=new Set(wanted.map(x=>x.id));
 $$('[data-admin-custom-section]').forEach(el=>{if(!ids.has(el.dataset.adminCustomSection))el.remove();});
 const host=customHost(),footer=document.querySelector('footer');if(!host)return;
 for(const sec of wanted){let el=document.querySelector(`[data-admin-custom-section="${CSS.escape(sec.id)}"]`);if(!el){el=document.createElement('section');el.className='ns-admin-custom-section';el.dataset.adminCustomSection=sec.id;if(footer&&footer.parentElement===host)host.insertBefore(el,footer);else host.appendChild(el);}
  const media=(sec.mediaIds||[]).map(id=>({id,src:mediaURL(s,id)})).filter(x=>x.src).slice(0,4);
  el.innerHTML=`<div class="ns-admin-custom-inner"><div class="ns-admin-custom-copy"><small>${String(sec.template||'Nariyal Sutra').replace(/[<>]/g,'')}</small><h2>${String(sec.title||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h2><p>${String(sec.subtitle||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>${media.length?`<div class="ns-admin-custom-media">${media.map(m=>`<img src="${m.src.replace(/"/g,'&quot;')}" alt="">`).join('')}</div>`:''}</div>`;
 }
}
let t=0;function apply(){clearTimeout(t);t=setTimeout(()=>{applyImages();renderCustom();},30);}
function init(){apply();setTimeout(apply,400);setTimeout(apply,1200);window.addEventListener('nsv421:change',apply);window.addEventListener('nsv421:production-ready',apply);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
window.NSV421ContentControls={apply,TARGETS};
})();
