(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

function initMenu(){
  const btn=$('.sp-menu'), nav=$('.sp-links'); if(!btn||!nav)return;
  btn.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(open));});
  nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('is-open');btn.setAttribute('aria-expanded','false');}});
}

function initReveal(){
  const els=$$('.sp-reveal'); if(!els.length)return;
  if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('is-visible'));return;}
  const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('is-visible');io.unobserve(x.target);}}),{threshold:.12,rootMargin:'0px 0px -6%'});
  els.forEach(e=>io.observe(e));
}

function initStoryModal(){
  const modal=$('.sp-story-modal'); if(!modal)return;
  const img=$('.sp-story-modal-media img',modal),k=$('[data-modal-kicker]',modal),t=$('[data-modal-title]',modal),p=$('[data-modal-text]',modal);
  const close=()=>{modal.hidden=true;document.body.style.removeProperty('overflow');};
  $$('.sp-chapter').forEach(card=>card.addEventListener('click',()=>{
    if(img){img.src=card.dataset.storyImage||$('img',card)?.src||'';img.alt=card.dataset.storyTitle||'';}
    if(k)k.textContent=card.dataset.storyKicker||'Story';
    if(t)t.textContent=card.dataset.storyTitle||$('h3',card)?.textContent||'Story';
    if(p)p.textContent=card.dataset.storyText||$('p',card)?.textContent||'';
    modal.hidden=false;document.body.style.overflow='hidden';
  }));
  $('.sp-story-close',modal)?.addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
}

function initScenes(){
  const scenes=$$('.sp-scene'); if(scenes.length<2)return;
  let i=0;scenes.forEach((s,n)=>s.classList.toggle('is-active',n===0));
  setInterval(()=>{scenes[i].classList.remove('is-active');i=(i+1)%scenes.length;scenes[i].classList.add('is-active');},5200);
}

function initVideoFallback(){
  $$('video').forEach(v=>{
    const fail=()=>{v.hidden=true;const wrap=v.closest('.sp-video');const img=wrap?.querySelector('img');if(img){img.hidden=false;img.style.display='block';}};
    v.addEventListener('error',fail,{once:true});v.querySelectorAll('source').forEach(s=>s.addEventListener('error',fail,{once:true}));
  });
}

function init(){initMenu();initReveal();initStoryModal();initScenes();initVideoFallback();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
