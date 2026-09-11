(function(){
'use strict';
var menu=document.querySelector('.sp-menu');
var links=document.querySelector('.sp-links');
if(menu&&links)menu.addEventListener('click',function(){var open=links.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false');});
var io=('IntersectionObserver'in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('is-visible');});},{threshold:.12}):null;
document.querySelectorAll('.sp-reveal').forEach(function(el){if(io)io.observe(el);else el.classList.add('is-visible');});
var modal=document.querySelector('.sp-story-modal'),mi=modal&&modal.querySelector('img'),mk=modal&&modal.querySelector('[data-modal-kicker]'),mt=modal&&modal.querySelector('[data-modal-title]'),mx=modal&&modal.querySelector('[data-modal-text]');
function close(){if(modal){modal.hidden=true;document.body.style.overflow='';}}
document.querySelectorAll('.sp-chapter').forEach(function(btn){btn.addEventListener('click',function(){if(!modal)return;if(mi)mi.src=btn.getAttribute('data-story-image')||btn.querySelector('img')?.src||'';if(mk)mk.textContent=btn.getAttribute('data-story-kicker')||'Story';if(mt)mt.textContent=btn.getAttribute('data-story-title')||'';if(mx)mx.textContent=btn.getAttribute('data-story-text')||'';modal.hidden=false;document.body.style.overflow='hidden';});});
modal&&modal.querySelector('.sp-story-close')?.addEventListener('click',close);modal&&modal.addEventListener('click',function(e){if(e.target===modal)close();});addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
