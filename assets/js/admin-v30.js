(function(){
'use strict';
const Store=window.NSV421Store,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
if(!Store)return;
const PAGES={
 'about-nariyal-sutra.html':['Opening / story world hero','Five coconut journeys','Story transition','Final CTA'],
 'bulk-coconut-supply.html':['Bulk supply hero','Volume planning','Commercial requirements','Final CTA'],
 'coconut-events-hospitality.html':['Hospitality hero','Story chapter','Motion / film','Facts / proof','Enquiry CTA'],
 'coconut-water.html':['Coconut water hero','What customers receive','Freshness / handling','Product choices','Use cases / proof','Final CTA'],
 'coconut-wholesale-export.html':['Trade hero','Routes / destinations','Commercial process','Final CTA'],
 'direct-farm.html':['Sourcing hero','Business truth','Source proof','Sourcing chain','Final CTA'],
 'fresh-tender-coconut.html':['Product hero','Product story','Motion / serving','Facts / details','Order CTA'],
 'freshness-first.html':['Freshness hero','Water / motion story','Freshness proof','Final CTA'],
 'green-coconut.html':['Product hero','Product story','Motion / serving','Facts / details','Order CTA'],
 'gujarat-coast.html':['Coastal hero','Tide / sourcing story','Final CTA'],
 'people-of-nariyal-sutra.html':['Editorial stories','Ambassador / promoter rails','People story grid','Community / values','Share your story'],
 'south-india-groves.html':['Grove hero','Canopy story','Source proof','Final CTA'],
 'supplier-partnership.html':['Supplier hero','Supplier requirements','Final CTA']
};
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function ensure(){const pages=$('.ap-view[data-view="pages"]');if(!pages||$('#apV30PageSequencing'))return;const box=document.createElement('div');box.className='ap-card ap-panel';box.style.marginTop='16px';box.id='apV30PageSequencing';box.innerHTML=`<div class="ap-panel-head"><h2>All public page section sequencing</h2><span>Admin-only · reorder + show/hide</span></div><div class="ap-v30-page-seq"><div class="ap-v30-page-head"><select id="apV30PageSelect"></select><button class="ap-btn" id="apV30PreviewPage">Preview selected page</button></div><div class="ap-v30-note">Homepage sequencing stays in the panel above. This panel controls every other section-based public page. Changes are stored as content configuration; customers never see these controls.</div><div id="apV30PageRows"></div></div>`;pages.appendChild(box);const sel=$('#apV30PageSelect');sel.innerHTML=Object.entries(PAGES).map(([f])=>`<option value="${esc(f)}">${esc(f.replace('.html','').replaceAll('-',' '))}</option>`).join('');sel.onchange=render;$('#apV30PreviewPage').onclick=()=>window.open(sel.value,'_blank');render();}
function cfg(file){const s=Store.load();s.pageSequences=s.pageSequences||{};const labels=PAGES[file]||[];const def=labels.map((_,i)=>'s'+String(i+1).padStart(2,'0'));let c=s.pageSequences[file];if(!c){c={order:def.slice(),hidden:{}};s.pageSequences[file]=c;Store.save(s);}def.forEach(k=>{if(!c.order.includes(k))c.order.push(k)});c.order=c.order.filter(k=>def.includes(k));return {s,c,labels,def};}
function save(s,what,file){Store.audit(s,what,file);Store.save(s);window.dispatchEvent(new CustomEvent('nsv421:change'));render();}
function render(){const sel=$('#apV30PageSelect'),host=$('#apV30PageRows');if(!sel||!host)return;const file=sel.value,{s,c,labels}=cfg(file);host.innerHTML=c.order.map((k,i)=>{const idx=parseInt(k.slice(1),10)-1;return `<div class="ap-v30-seq-row"><div><strong>${String(i+1).padStart(2,'0')} · ${esc(labels[idx]||k)}</strong><small>${esc(file)} · ${c.hidden[k]?'Hidden':'Visible'}</small></div><div class="ap-v30-seq-actions"><button class="ap-btn mini" data-up="${k}" ${i===0?'disabled':''}>↑</button><button class="ap-btn mini" data-down="${k}" ${i===c.order.length-1?'disabled':''}>↓</button><button class="ap-btn mini" data-vis="${k}">${c.hidden[k]?'Show':'Hide'}</button></div></div>`}).join('');$$('[data-up]',host).forEach(b=>b.onclick=()=>move(file,b.dataset.up,-1));$$('[data-down]',host).forEach(b=>b.onclick=()=>move(file,b.dataset.down,1));$$('[data-vis]',host).forEach(b=>b.onclick=()=>toggle(file,b.dataset.vis));}
function move(file,k,d){const {s,c}=cfg(file),i=c.order.indexOf(k),j=i+d;if(i<0||j<0||j>=c.order.length)return;[c.order[i],c.order[j]]=[c.order[j],c.order[i]];save(s,'Public page section moved',file)}
function toggle(file,k){const {s,c}=cfg(file);c.hidden[k]=!c.hidden[k];save(s,'Public page section visibility changed',file)}
function init(){setTimeout(ensure,120);window.addEventListener('nsv421:change',()=>setTimeout(ensure,20));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
