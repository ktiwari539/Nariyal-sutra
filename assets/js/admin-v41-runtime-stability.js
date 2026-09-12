(function(){
'use strict';
if(window.__NS_V421_ADMIN_RUNTIME_STABILITY__)return;window.__NS_V421_ADMIN_RUNTIME_STABILITY__=true;
const Store=window.NSV421Store;if(!Store)return;
const TARGETS=[
 ['homepage-hero','Homepage hero','Main product/lifestyle hero','/assets/images/nariyal-premium-hero.webp'],
 ['homepage-brand','Brand moment','Immersive brand background','/assets/images/brand/coconut-premium.webp'],
 ['homepage-harvest-1','Harvest film · frame 1','First harvest editorial frame','/assets/images/review/coastal-grove.png'],
 ['homepage-harvest-2','Harvest film · frame 2','Second harvest editorial frame','/assets/images/review/backwater-grove.png'],
 ['homepage-harvest-3','Harvest film · frame 3','Third harvest editorial frame','/assets/images/nariyal-product-collection.webp'],
 ['homepage-people-teaser','People teaser','People of Nariyal Sutra editorial image','/assets/images/ambassadors/G031.webp'],
 ['homepage-cinematic-grove','Cinematic grove','Current source-to-cut grove background','/assets/images/review/coastal-grove.png'],
 ['homepage-cinematic-canopy','Cinematic canopy','Current source-to-cut canopy','/assets/images/review/backwater-grove.png'],
 ['people-hero','People page hero','People of Nariyal Sutra hero','/assets/images/ambassadors/G031.webp'],
 ['fresh-tender-hero','Fresh tender page hero','Fresh tender coconut hero','/assets/images/nariyal-premium-hero.webp'],
 ['green-hero','Green coconut page hero','Green coconut hero','/assets/images/green-round-coconut.jpg'],
 ['bulk-hero','Bulk supply page hero','Bulk supply hero','/assets/images/bulk-coconut-pack.jpg']
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let repairTimer=0;
function largeReady(m){if(!m||m.status!=='Approved'||m.visible===false||m.publicAllowed===false||m.brandFit==='Weak'||!(m.src||m.thumb))return false;if(m.largeSurfaceAllowed===false)return false;const w=Number(m.width||0),h=Number(m.height||0);return !w||!h||(Math.max(w,h)>=1000&&Math.min(w,h)>=600);}
function configured(s,id){const mid=s.sectionMedia?.[id],m=mid?Store.mediaById(s,mid):null;return m&&(m.thumb||m.src)?{mid,m,src:m.thumb||m.src}:null;}
function decorate(panel){if(!panel)return;const s=Store.load();TARGETS.forEach(([id])=>{const b=panel.querySelector(`[data-v38-target="${CSS.escape(id)}"]`),card=b?.closest('article');if(!card)return;const c=configured(s,id);card.dataset.v38PlacementCard=id;card.dataset.v38Status=c?'custom':'default';const status=card.querySelector('[data-v38-status]')||card.querySelector('img + div');if(status){status.dataset.v38Status=c?'custom':'default';status.textContent=c?`Custom · ${c.m.name||c.mid}`:'Default image';}});}
function buildPanel(view){const s=Store.load();s.sectionMedia=s.sectionMedia||{};const panel=document.createElement('div');panel.id='apV38ImageTargets';panel.className='ap-card ap-panel';panel.style.marginTop='16px';panel.dataset.v41Recovered='1';panel.innerHTML=`<div class="ap-panel-head"><div><h2>Live image placement map</h2><span>Preview and change storefront imagery. Large surfaces only offer media that is suitable for large display.</span></div><button class="ap-btn" type="button" data-v38-preview>Open storefront ↗</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px">${TARGETS.map(([id,name,desc,def])=>{const c=configured(s,id),src=c?.src||def,state=c?'custom':'default',label=c?`Custom · ${esc(c.m.name||c.mid)}`:'Default image';return `<article data-v38-placement-card="${esc(id)}" data-v38-status="${state}" style="border:1px solid rgba(212,168,67,.14);padding:12px;background:rgba(255,255,255,.02)"><img src="${esc(src)}" alt="${esc(name)}" style="width:100%;height:150px;object-fit:cover;margin-bottom:10px"><div data-v38-status="${state}" style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:${c?'#d4a843':'var(--muted)'};margin-bottom:6px">${label}</div><strong>${esc(name)}</strong><p style="font-size:10px;color:var(--muted);line-height:1.5;margin:5px 0 10px">${esc(desc)}</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="ap-btn mini" type="button" data-v38-target="${esc(id)}">Change image</button>${c?`<button class="ap-btn mini" type="button" data-v38-clear="${esc(id)}">Use default</button>`:''}</div></article>`}).join('')}</div>`;view.insertBefore(panel,view.firstChild);return panel;}
function ensurePanel(){const view=document.querySelector('.ap-view[data-view="pages"]');if(!view)return null;let panel=document.getElementById('apV38ImageTargets');if(!panel)panel=buildPanel(view);decorate(panel);return panel;}
function scheduleRepair(ms=20){clearTimeout(repairTimer);repairTimer=setTimeout(ensurePanel,ms);}
function prunePicker(target){const modal=document.getElementById('apModal');if(!modal?.classList.contains('is-open'))return;const s=Store.load();let kept=0;modal.querySelectorAll('[data-v38-pick]').forEach(btn=>{const m=Store.mediaById(s,btn.getAttribute('data-v38-pick'));if(!largeReady(m))btn.remove();else kept++;});let note=modal.querySelector('[data-v41-quality-note]');if(!note){note=document.createElement('p');note.dataset.v41QualityNote='1';note.style.cssText='grid-column:1/-1;margin:0 0 10px;color:rgba(255,255,255,.55);font-size:10px;line-height:1.6';const body=document.getElementById('apModalBody');body?.prepend(note);}if(note)note.textContent=kept?`${kept} approved large-surface image${kept===1?'':'s'} available for this placement.`:'No approved large-surface image is available. Upload/approve a higher-resolution source before replacing this section.';modal.dataset.v41Target=target;}
function bind(){
 ensurePanel();[100,350,900,1800].forEach(ms=>setTimeout(ensurePanel,ms));
 document.addEventListener('click',e=>{const pages=e.target?.closest?.('#apNav [data-view="pages"]');if(pages){scheduleRepair(0);setTimeout(ensurePanel,100);return;}const target=e.target?.closest?.('[data-v38-target]');if(target)setTimeout(()=>prunePicker(target.dataset.v38Target),0);const clear=e.target?.closest?.('[data-v38-clear]');if(clear)setTimeout(()=>{ensurePanel();decorate(document.getElementById('apV38ImageTargets'));},0);},true);
 window.addEventListener('nsv421:change',()=>{scheduleRepair(0);setTimeout(()=>decorate(document.getElementById('apV38ImageTargets')),30);});
 window.addEventListener('nsv421:production-ready',()=>scheduleRepair(0));
 new MutationObserver(()=>{if(document.querySelector('.ap-view[data-view="pages"]')&&!document.getElementById('apV38ImageTargets'))scheduleRepair(0);}).observe(document.body||document.documentElement,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
window.NSV421AdminRuntimeStability={ensurePanel,largeReady};
})();