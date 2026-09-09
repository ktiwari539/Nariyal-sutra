(function(){
'use strict';
const IMM='https://nariyal-sutra.netlify.app/';
const FALLBACK=['assets/images/review/coastal-grove.png','assets/images/review/backwater-grove.png',IMM+'assets/images/nariyal-coconut-grove.webp'];
function eligibleOriginMedia(){
  const Store=window.NSV421Store;if(!Store)return [];
  const s=Store.load();
  return (s.media||[]).filter(m=>Store.eligibleForPublic(s,m)&&m.cat!=='People'&&['Homepage','Sourcing','Origin / Grove'].includes(m.placement)).slice(0,3);
}
function safeImg(img,fallback){img.addEventListener('error',()=>{if(img.dataset.reviewFallback)return;img.dataset.reviewFallback='1';img.src=fallback;},{once:true});}
function init(){
 document.querySelectorAll('#v20-story-film img,.hero-visual .hero-scene,#harvest-film img').forEach((img,i)=>{const src=img.getAttribute('src')||'';if(src.includes('6a9bfce')||src.startsWith('assets/images/'))safeImg(img,FALLBACK[i%2]);});
 const film=document.getElementById('v20-story-film');if(!film)return;
 const sticky=film.querySelector('.v20-story-sticky');if(!sticky)return;
 let scenes=film.querySelector('.v20-origin-scenes');if(!scenes){scenes=document.createElement('div');scenes.className='v20-origin-scenes';sticky.insertBefore(scenes,sticky.firstChild);}
 function renderScenes(){
   const media=eligibleOriginMedia();const srcs=[0,1,2].map(i=>media[i]?.src||FALLBACK[i]);
   scenes.innerHTML=srcs.map((src,i)=>`<img class="v20-origin-scene${i===0?' is-active':''}" src="${src}" alt="">`).join('');
   [...scenes.querySelectorAll('img')].forEach((img,i)=>safeImg(img,FALLBACK[i]));
 }
 renderScenes();
 let note=film.querySelector('.v20-origin-note');if(!note){note=document.createElement('div');note.className='v20-origin-note';sticky.appendChild(note);}note.textContent='Coastal source · backwater · grove · selected coconut · fresh cut';
 const grove=film.querySelector('.v20-story-copy-grove');if(grove){const idx=grove.querySelector('.story-index'),h=grove.querySelector('h2'),p=grove.querySelector('p');if(idx)idx.textContent='CHAPTER 01 · THE ORIGIN';if(h)h.innerHTML='From the coast,<br><em>into the grove.</em>';if(p)p.textContent='Nariyal Sutra sources through farmer and supplier partners. The visual journey moves from growing-region context to one coconut selected for fresh preparation.'}
 const cut=film.querySelector('.v20-story-copy-cut p');if(cut)cut.textContent='One selected coconut carries the story forward into a clean cut and fresh pour.';
 const handoff=document.getElementById('v20-handoff-text');if(handoff)handoff.textContent='ONE SELECTED FOR THE CUT';
 function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
 let ticking=false;function update(){ticking=false;if(innerWidth<981)return;const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight),p=clamp(-r.top/range,0,1);const list=[...scenes.querySelectorAll('.v20-origin-scene')];const ix=p<.20?0:p<.42?1:2;list.forEach((x,i)=>x.classList.toggle('is-active',i===ix));film.style.setProperty('--origin-note-alpha',p<.62&&p>.03?'1':'0')}
 function req(){if(!ticking){ticking=true;requestAnimationFrame(update)}}addEventListener('scroll',req,{passive:true});addEventListener('resize',req);update();
 window.addEventListener('nsv421:change',renderScenes);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
