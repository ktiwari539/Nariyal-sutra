(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function initMenu(){const b=$('.w-menu'),n=$('.w-links');if(!b||!n)return;b.addEventListener('click',()=>{const o=n.classList.toggle('is-open');b.setAttribute('aria-expanded',String(o));});n.addEventListener('click',e=>{if(e.target.closest('a')){n.classList.remove('is-open');b.setAttribute('aria-expanded','false');}});}
function initReveal(){const els=$$('.w-reveal');if(!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('is-visible'));return;}const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('is-visible');io.unobserve(x.target);}}),{threshold:.12});els.forEach(e=>io.observe(e));}
function initProgress(){const p=$('.w-progress');if(!p)return;const run=()=>{const d=document.documentElement,max=Math.max(1,d.scrollHeight-innerHeight),v=Math.min(100,Math.max(0,scrollY/max*100));p.style.setProperty('--progress',v+'%');};addEventListener('scroll',run,{passive:true});run();}
function initParallax(){if(matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(max-width: 980px)').matches)return;const imgs=$$('[data-parallax]');if(!imgs.length)return;let raf=0;const run=()=>{raf=0;const y=Math.max(-18,Math.min(18,scrollY*.025));imgs.forEach(i=>i.style.setProperty('--hero-y',y+'px'));};addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(run)},{passive:true});run();}
function init(){initMenu();initReveal();initProgress();initParallax();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
