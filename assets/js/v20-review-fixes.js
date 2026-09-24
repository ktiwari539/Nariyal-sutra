(function(){
'use strict';
const FALLBACK=['/assets/images/review/coastal-grove.webp','/assets/images/review/backwater-grove.webp','/assets/images/nariyal-coconut-grove.webp'];
function largeReady(m){if(!m||m.status!=='Approved'||m.visible===false||m.publicAllowed===false||m.brandFit==='Weak'||!(m.src||m.thumb))return false;if(m.largeSurfaceAllowed===false)return false;const w=Number(m.width||0),h=Number(m.height||0);return !w||!h||(Math.max(w,h)>=1000&&Math.min(w,h)>=600);}
function eligibleOriginMedia(s){
  const Store=window.NSV421Store;if(!Store)return [];
  return (s.media||[]).filter(m=>Store.eligibleForPublic(s,m)&&m.cat!=='People'&&['Homepage','Sourcing','Origin / Grove'].includes(m.placement)&&largeReady(m)).slice(0,3);
}
function safeImg(img,fallback){img.addEventListener('error',()=>{if(img.dataset.reviewFallback)return;img.dataset.reviewFallback='1';img.src=fallback;},{once:true});}
function configuredSource(s,id){const Store=window.NSV421Store,mid=s.sectionMedia?.[id],m=mid&&Store?.mediaById?.(s,mid);return largeReady(m)?(m.src||m.thumb||''):'';}
function init(){
 document.querySelectorAll('#v20-story-film img,.hero-visual .hero-scene,#harvest-film img').forEach((img,i)=>{const src=img.getAttribute('src')||'';if(src.includes('6a9bfce')||src.startsWith('assets/images/')||src.startsWith('/assets/images/'))safeImg(img,FALLBACK[i%FALLBACK.length]);});
 const film=document.getElementById('v20-story-film');if(!film)return;
 const sticky=film.querySelector('.v20-story-sticky');if(!sticky)return;
 let scenes=film.querySelector('.v20-origin-scenes');if(!scenes){scenes=document.createElement('div');scenes.className='v20-origin-scenes';sticky.insertBefore(scenes,sticky.firstChild);}
 function renderScenes(){
   const Store=window.NSV421Store,s=Store?Store.load():{media:[],sectionMedia:{}},media=eligibleOriginMedia(s);
   const srcs=[
     configuredSource(s,'homepage-cinematic-grove')||media[0]?.src||FALLBACK[0],
     configuredSource(s,'homepage-cinematic-canopy')||media[1]?.src||FALLBACK[1],
     media[2]?.src||FALLBACK[2]
   ];
   const slots=['grove','canopy','handoff'];
   scenes.innerHTML=srcs.map((src,i)=>`<img class="v20-origin-scene${i===0?' is-active':''}" data-cinematic-slot="${slots[i]}" src="${src}" alt="">`).join('');
   [...scenes.querySelectorAll('img')].forEach((img,i)=>safeImg(img,FALLBACK[i]));
   film.dataset.nsCurrentCinematicMedia='1';
 }
 renderScenes();
 let note=film.querySelector('.v20-origin-note');if(!note){note=document.createElement('div');note.className='v20-origin-note';sticky.appendChild(note);}note.textContent='Coastal source · backwater · grove · selected coconut · fresh cut';
 const grove=film.querySelector('.v20-story-copy-grove');if(grove){const idx=grove.querySelector('.story-index'),h=grove.querySelector('h2'),p=grove.querySelector('p');if(idx)idx.textContent='CHAPTER 01 · THE ORIGIN';if(h)h.innerHTML='From the coast,<br><em>into the grove.</em>';if(p)p.textContent='Nariyal Sutra sources through farmer and supplier partners. The visual journey moves from growing-region context to one coconut selected for fresh preparation.'}
 const cut=film.querySelector('.v20-story-copy-cut p');if(cut)cut.textContent='One selected coconut carries the story forward into a clean cut and fresh pour.';
 const handoff=document.getElementById('v20-handoff-text');if(handoff)handoff.textContent='ONE SELECTED FOR THE CUT';
 function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
 let ticking=false;function update(){ticking=false;if(innerWidth<981)return;const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight),p=clamp(-r.top/range,0,1);const list=[...scenes.querySelectorAll('.v20-origin-scene')];const ix=p<.20?0:p<.42?1:2;list.forEach((x,i)=>x.classList.toggle('is-active',i===ix));film.style.setProperty('--origin-note-alpha',p<.62&&p>.03?'1':'0')}
 function req(){if(!ticking){ticking=true;requestAnimationFrame(update)}}addEventListener('scroll',req,{passive:true});addEventListener('resize',req,{passive:true});update();
 window.addEventListener('nsv421:change',()=>{renderScenes();update();});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
