(function(){
'use strict';
if(window.__NS_V421_CONTENT_CONTROLS__)return;window.__NS_V421_CONTENT_CONTROLS__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const PAGE_IDS={'index.html':'homepage','':'homepage','people-of-nariyal-sutra.html':'people','coconut-events-hospitality.html':'hospitality','direct-farm.html':'sourcing','fresh-tender-coconut.html':'fresh-tender-coconut','green-coconut.html':'green-coconut','bulk-coconut-supply.html':'bulk'};
const TARGETS={
 'homepage-hero':{page:'homepage',sel:'.hero-visual img',kind:'img',large:true,fit:'cover'},
 'homepage-brand':{page:'homepage',sel:'.brand-moment-bg',kind:'bg',large:true,fit:'cover',overlay:'linear-gradient(90deg,rgba(2,9,2,.90) 0%,rgba(2,9,2,.40) 48%,rgba(2,9,2,.72) 100%)'},
 'homepage-harvest-1':{page:'homepage',sel:'#harvest-film .harvest-scene:nth-child(1)',kind:'img',large:true,fit:'cover'},
 'homepage-harvest-2':{page:'homepage',sel:'#harvest-film .harvest-scene:nth-child(2)',kind:'img',large:true,fit:'cover'},
 'homepage-harvest-3':{page:'homepage',sel:'#harvest-film .harvest-scene:nth-child(3)',kind:'img',large:true,fit:'cover'},
 'homepage-people-teaser':{page:'homepage',sel:'#people-of-nariyal .ns-people-visual img',kind:'img',large:true,fit:'contain'},
 'homepage-cinematic-grove':{page:'homepage',sel:'#v20-story-film .v20-origin-scene[data-cinematic-slot="grove"]',kind:'img',large:true,fit:'cover'},
 'homepage-cinematic-canopy':{page:'homepage',sel:'#v20-story-film .v20-origin-scene[data-cinematic-slot="canopy"]',kind:'img',large:true,fit:'cover'},
 'people-hero':{page:'people',sel:'#peopleHeroImg',kind:'img',large:true,fit:'contain'},
 'fresh-tender-hero':{page:'fresh-tender-coconut',sel:'.sp-scenes .sp-scene:first-child',kind:'img',large:true,fit:'cover'},
 'green-hero':{page:'green-coconut',sel:'.sp-scenes .sp-scene:first-child',kind:'img',large:true,fit:'cover'},
 'bulk-hero':{page:'bulk',sel:'.w-hero-media img',kind:'img',large:true,fit:'cover'}
};
function file(){return (location.pathname.split('/').pop()||'index.html').toLowerCase();}
function pageId(){return PAGE_IDS[file()]||file().replace(/\.html$/,'');}
function mediaRecord(s,id){const m=Store.mediaById(s,id);return m&&Store.eligibleForPublic(s,m)?m:null;}
function largeReady(m){const policy=window.NSV421MediaDB?.largeSurfaceReady;if(policy)return policy(m);if(!m||m.largeSurfaceAllowed===false||m.qualityTier==='card-only')return false;const w=Number(m.width||0),h=Number(m.height||0);if(!w||!h)return true;return Math.max(w,h)>=1000&&Math.min(w,h)>=600;}
function applyImages(){
 const s=Store.load(),map=s.sectionMedia||{},layouts=s.sectionMediaLayout||{};
 for(const [id,mId] of Object.entries(map)){
   const t=TARGETS[id];if(!t||t.page!==pageId())continue;
   const m=mediaRecord(s,mId);if(!m)continue;
   if(t.large&&!largeReady(m)){console.warn('[Nariyal Sutra media quality] blocked low-resolution media from large section',id,mId,m.width,m.height);continue;}
   const src=m.src||m.thumb||'';if(!src)continue;const el=$(t.sel);if(!el)continue;
   const layout=layouts[id]||{},focus=layout.focus||m.focus||'50% 50%',fit=(id==='homepage-people-teaser'||id==='people-hero')?'contain':(layout.fit||m.fit||t.fit||'cover');
   if(t.kind==='img'){
     if(el.getAttribute('src')!==src){el.src=src;el.removeAttribute('srcset');el.dataset.adminMedia=mId;}
     el.style.objectPosition=focus;el.style.objectFit=fit;el.dataset.adminMediaFit=fit;el.dataset.adminMediaQuality='approved-large';if(id==='homepage-people-teaser'){const wrap=el.closest('.ns-people-visual');wrap?.style.setProperty('--ns-people-image',`url("${String(src).replace(/"/g,'\\\"')}")`);wrap?.setAttribute('data-media-fit','full');}if(id==='people-hero'){const wrap=el.closest('.people-hero');wrap?.style.setProperty('--people-hero-image',`url("${String(src).replace(/"/g,'\\\"')}")`);wrap?.setAttribute('data-media-fit','full');}
   }else{
     el.style.backgroundImage=(t.overlay?t.overlay+',':'')+`url("${String(src).replace(/"/g,'')}")`;el.style.backgroundPosition=focus;el.style.backgroundSize=fit==='contain'?'contain':'cover';el.style.backgroundRepeat='no-repeat';el.dataset.adminMedia=mId;el.dataset.adminMediaFit=fit;el.dataset.adminMediaQuality='approved-large';
   }
 }
}
function ensureStyle(){if($('#nsAdminCustomStyle'))return;const st=document.createElement('style');st.id='nsAdminCustomStyle';st.textContent='.ns-admin-custom-section{position:relative;padding:clamp(64px,7vw,104px) clamp(20px,5vw,72px);background:radial-gradient(circle at 86% 18%,rgba(70,142,72,.14),transparent 30%),linear-gradient(145deg,#061004,#0b1909);border-top:1px solid rgba(212,168,67,.14);border-bottom:1px solid rgba(212,168,67,.10);color:#fdf7e8;overflow:hidden}.ns-admin-custom-inner{max-width:1480px;margin:auto;display:grid;grid-template-columns:minmax(280px,.68fr) minmax(0,1.32fr);gap:clamp(28px,4.5vw,68px);align-items:center}.ns-admin-custom-copy small{display:block;color:#d4a843;letter-spacing:.30em;text-transform:uppercase;font:700 9px/1.4 Jost,sans-serif;margin-bottom:15px}.ns-admin-custom-copy h2{font:400 clamp(42px,5.4vw,78px)/.96 "Playfair Display",serif;margin:0;max-width:720px}.ns-admin-custom-copy p{max-width:620px;color:rgba(255,255,255,.62);line-height:1.75;margin:18px 0 0}.ns-admin-custom-media{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}.ns-admin-custom-media[data-count="4"]{grid-template-columns:repeat(4,minmax(0,1fr))}.ns-admin-custom-media-card{--ns-custom-fit:contain;--ns-custom-focus:50% 50%;position:relative;min-width:0;aspect-ratio:4/5;overflow:hidden;border:1px solid rgba(212,168,67,.20);border-radius:16px;background:#071208;box-shadow:0 18px 44px rgba(0,0,0,.24);isolation:isolate}.ns-admin-custom-media-card::before{content:"";position:absolute;inset:-18px;z-index:0;background-image:linear-gradient(rgba(2,10,3,.22),rgba(2,10,3,.44)),var(--ns-custom-image);background-size:cover;background-position:var(--ns-custom-focus);filter:blur(16px) saturate(.82);transform:scale(1.10);opacity:.72}.ns-admin-custom-media-card::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(2,8,2,.04),rgba(2,8,2,.18));box-shadow:inset 0 0 0 1px rgba(255,255,255,.025)}.ns-admin-custom-media-card img{position:relative;z-index:1;width:100%;height:100%;display:block;object-fit:var(--ns-custom-fit);object-position:var(--ns-custom-focus);background:transparent}.ns-admin-custom-media-card[data-fit="contain"] img{padding:8px}.ns-admin-custom-media-card:hover{transform:translateY(-3px);border-color:rgba(212,168,67,.42);box-shadow:0 24px 56px rgba(0,0,0,.30);transition:.22s ease}.ns-admin-custom-media[data-count="1"] .ns-admin-custom-media-card{aspect-ratio:16/10}@media(max-width:1120px){.ns-admin-custom-inner{grid-template-columns:1fr}.ns-admin-custom-media[data-count="4"]{grid-template-columns:repeat(4,minmax(150px,1fr))}}@media(max-width:780px){.ns-admin-custom-media[data-count="4"]{grid-template-columns:repeat(2,minmax(0,1fr))}.ns-admin-custom-media-card{aspect-ratio:4/5}}@media(max-width:460px){.ns-admin-custom-section{padding-left:14px;padding-right:14px}.ns-admin-custom-media{grid-template-columns:1fr 1fr!important;gap:8px}.ns-admin-custom-media-card{border-radius:12px}.ns-admin-custom-copy h2{font-size:42px}}';document.head.appendChild(st);}
function customHost(){return document.querySelector('footer')?.parentElement||document.querySelector('main')||document.body;}
function renderCustom(){
 const s=Store.load(),pid=pageId();ensureStyle();
 if(pid==='homepage'){const meta=(s.customSections||[]).find(x=>x.id==='CS-PEOPLE');const changed=meta&&(meta.title!=='Moving People full-picture rail'||!['A living editorial rail controlled from Admin.','A living collection of people and stories connected to Nariyal Sutra.'].includes(meta.subtitle));if(changed){const title=$('#ns-face-title'),sub=$('[data-face-sub]');if(title&&meta.title)title.textContent=meta.title;if(sub&&meta.subtitle)sub.textContent=meta.subtitle;}}
 const wanted=(s.customSections||[]).filter(x=>x.id!=='CS-PEOPLE'&&x.page===pid&&x.visible!==false),ids=new Set(wanted.map(x=>x.id));
 $$('[data-admin-custom-section]').forEach(el=>{if(!ids.has(el.dataset.adminCustomSection))el.remove();});
 const host=customHost(),footer=document.querySelector('footer');if(!host)return;
 for(const sec of wanted){
   let el=document.querySelector(`[data-admin-custom-section="${CSS.escape(sec.id)}"]`);if(!el){el=document.createElement('section');el.className='ns-admin-custom-section';el.dataset.adminCustomSection=sec.id;if(footer&&footer.parentElement===host)host.insertBefore(el,footer);else host.appendChild(el);}
   const requested=(sec.mediaIds||[]).slice(0,4),multi=requested.length>1,media=requested.map(id=>{const m=mediaRecord(s,id),explicit=m?.fit==='cover'||m?.fit==='contain';return {id,src:m&&(m.src||m.thumb||''),focus:m?.focus||'50% 50%',fit:explicit?m.fit:(multi?'contain':'cover'),ok:largeReady(m)};}).filter(x=>x.src&&x.ok);el.dataset.mediaCount=String(media.length);
   el.innerHTML=`<div class="ns-admin-custom-inner"><div class="ns-admin-custom-copy"><small>${String(sec.template||'Nariyal Sutra').replace(/[<>]/g,'')}</small><h2>${String(sec.title||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h2><p>${String(sec.subtitle||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>${media.length?`<div class="ns-admin-custom-media" data-count="${media.length}">${media.map(m=>`<figure class="ns-admin-custom-media-card" data-fit="${m.fit}" style="--ns-custom-image:url('${m.src.replace(/'/g,'%27')}');--ns-custom-focus:${m.focus};--ns-custom-fit:${m.fit}"><img src="${m.src.replace(/"/g,'&quot;')}" alt=""></figure>`).join('')}</div>`:''}</div>`;
 }
}
let t=0;function apply(){clearTimeout(t);t=setTimeout(()=>{applyImages();renderCustom();},30);}
function init(){apply();setTimeout(apply,250);setTimeout(apply,700);setTimeout(apply,1400);setTimeout(apply,2800);window.addEventListener('nsv421:change',apply);window.addEventListener('nsv421:production-ready',apply);const mo=new MutationObserver(records=>{for(const r of records){for(const n of r.addedNodes){if(n.nodeType!==1)continue;if(n.id==='v20-story-film'||n.matches?.('.v20-origin-scenes,.v20-origin-scene')||n.querySelector?.('#v20-story-film,.v20-origin-scenes,.v20-origin-scene')){apply();return;}}}});mo.observe(document.documentElement,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();window.NSV421ContentControls={apply,TARGETS,largeReady};
})();