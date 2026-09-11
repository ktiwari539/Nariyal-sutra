(function(){
'use strict';
var menu=document.querySelector('.w-menu'),links=document.querySelector('.w-links');
if(menu&&links)menu.addEventListener('click',function(){var open=links.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false');});
var io=('IntersectionObserver'in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('is-visible');});},{threshold:.12}):null;
document.querySelectorAll('.w-reveal').forEach(function(el){if(io)io.observe(el);else el.classList.add('is-visible');});
var progress=document.querySelector('.w-progress');
function tick(){var d=document.documentElement,max=Math.max(1,d.scrollHeight-innerHeight),p=Math.max(0,Math.min(1,scrollY/max));if(progress)progress.style.transform='scaleX('+p+')';document.querySelectorAll('[data-parallax]').forEach(function(el){el.style.transform='translate3d(0,'+(p*-18).toFixed(1)+'px,0) scale(1.03)';});}
addEventListener('scroll',tick,{passive:true});tick();
})();
