(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const RAIN_SRC='/assets/images/story-coconut-hero.png';
let rainMotionBound=false;
function cleanTelegram(){
 const card=[...document.querySelectorAll('.ci')].find(x=>/Telegram/i.test(x.querySelector('.ci-lbl')?.textContent||''));
 if(card){card.classList.add('v28-telegram-contact');const val=card.querySelector('.ci-val');if(val)val.innerHTML='<span>Use your Telegram @username</span><small>Select Telegram as preferred reply in the enquiry form.</small>';}
 document.querySelectorAll('footer span').forEach(x=>{if(/^Telegram:\s*\+?91\s*9203831705/i.test((x.textContent||'').trim()))x.remove();});
}
function ensureBaseRain(){
 const film=$('#v20-story-film');if(!film||innerWidth<981)return null;
 const sticky=$('.v20-story-sticky',film)||film;
 let rain=$('.v21-real-rain',film);
 if(!rain){rain=document.createElement('div');rain.className='v21-real-rain';rain.setAttribute('aria-hidden','true');sticky.appendChild(rain);}
 if(!rain.querySelector('img')){
  const vals=[['13%',94,-6,.78,.45],['28%',112,5,.92,.6],['43%',78,-11,.72,.38],['58%',128,7,1,.7],['72%',88,-5,.82,.5],['84%',118,10,.96,.66],['20%',70,14,.68,.34],['51%',96,-8,.86,.55],['92%',76,4,.7,.38]];
  rain.innerHTML=vals.map((v,i)=>`<img src="${RAIN_SRC}" alt="" aria-hidden="true" style="--x:${v[0]};--w:${v[1]}px;--r:${v[2]}deg;--s:${v[3]};--a:${v[4]}" data-rain="${i}">`).join('');
 }
 rain.querySelectorAll('img').forEach(img=>{
  if(img.dataset.nsRainGuard==='1')return;img.dataset.nsRainGuard='1';
  img.addEventListener('error',()=>{if(img.dataset.nsRainRetry==='1'){img.hidden=true;return;}img.dataset.nsRainRetry='1';img.src=RAIN_SRC+'?v=20260912';});
  img.addEventListener('load',()=>{img.hidden=false;});
 });
 film.dataset.nsRainRuntime='ready';
 return rain;
}
function buildHarvest100(){
 const rain=ensureBaseRain();if(!rain)return null;
 const first=rain.querySelector('img');if(!first)return null;
 const src=first.getAttribute('src')||RAIN_SRC;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const saveData=!!(navigator.connection&&navigator.connection.saveData);
 const mem=Number(navigator.deviceMemory||8);
 const w=Math.max(document.documentElement.clientWidth||0,innerWidth||0);
 const target=reduced?0:(saveData?22:(w<=600?28:(w<=980?48:(mem<=4?64:100))));
 const frag=document.createDocumentFragment();
 for(let i=rain.children.length;i<target;i++){
   const im=document.createElement('img');im.src=src;im.alt='';im.setAttribute('aria-hidden','true');im.dataset.rain=String(i);
   const cycle=i%11,cluster=cycle<3,anchor=(9+((Math.floor(i/11)*13)%84));
   const x=cluster?anchor+(cycle-1)*2.2:(4+((i*29)%93));
   const width=42+((i*37)%112),scale=.55+((i*19)%57)/100,alpha=.22+((i*13)%55)/100,z=(i%8===0?70:(i%7===0?-90:-22+((i*31)%70)));
   im.style.setProperty('--x',x.toFixed(1)+'%');im.style.setProperty('--w',width+'px');im.style.setProperty('--r',((i%2?-1:1)*(3+(i%23))).toFixed(1)+'deg');im.style.setProperty('--s',scale.toFixed(2));im.style.setProperty('--a',Math.min(.86,alpha).toFixed(2));im.style.setProperty('--z',z+'px');
   im.style.setProperty('--sx',(.72+((i*17)%45)/100).toFixed(2));
   if(cluster)im.classList.add('v28-cluster');if(i%8===0)im.classList.add('v28-near');if(i%7===0)im.classList.add('v28-far');
   const tone=['v28-tone-lime','v28-tone-gold','v28-tone-olive','v28-tone-pale','v28-tone-deep',''][i%6];if(tone)im.classList.add(tone);
   frag.appendChild(im);
 }
 rain.appendChild(frag);
 [...rain.querySelectorAll('img')].forEach((im,i)=>{
   ['v27-tone-yellow','v27-tone-olive','v27-tone-pale','v27-tone-deep','v27-near','v27-far'].forEach(c=>im.classList.remove(c));
   if(!im.style.getPropertyValue('--sx'))im.style.setProperty('--sx',(.74+((i*17)%43)/100).toFixed(2));if(!im.style.getPropertyValue('--z'))im.style.setProperty('--z',(i%8===0?70:(i%7===0?-90:-22+((i*31)%70)))+'px');
   const tone=['v28-tone-lime','v28-tone-gold','v28-tone-olive','v28-tone-pale','v28-tone-deep',''][i%6];if(tone)im.classList.add(tone);
   if(i%8===0)im.classList.add('v28-near');if(i%7===0)im.classList.add('v28-far');if(i%11<3)im.classList.add('v28-cluster');
 });
 const p=$('.v20-story-copy-grove p');if(p)p.textContent='A fuller harvest moves through the grove: varied coconuts, natural clusters and one selected fruit carried forward to the cut.';
 const lab=$('#v20-count-label');if(lab)lab.textContent='coconuts moving through the harvest';
 document.getElementById('v20-story-film')?.setAttribute('data-ns-harvest-count',String(rain.querySelectorAll('img').length));
 return rain;
}
function retimeRain(){
 if(rainMotionBound)return;
 const film=$('#v20-story-film'),rain=$('.v21-real-rain',film||document);if(!film||!rain)return;
 rainMotionBound=true;let raf=0;
 function tick(){raf=0;const r=film.getBoundingClientRect();if(r.bottom<-innerHeight*.5||r.top>innerHeight*1.65){film.style.setProperty('--v21-rain-alpha','0');return;}const range=Math.max(1,film.offsetHeight-innerHeight),p=Math.max(0,Math.min(1,-r.top/range));const a=p<.05?0:p<.55?Math.min(1,(p-.05)/.075):Math.max(0,1-(p-.55)/.14);film.style.setProperty('--v21-rain-alpha',a.toFixed(3));
   rain.querySelectorAll('img').forEach((img,i)=>{const cluster=i%11<3,group=Math.floor(i/11),slot=cluster?((group*4)%34):(i%34),wave=Math.floor(i/34),phase=Math.max(0,Math.min(1,(p-(.045+slot*.010+wave*.018))/.40));let y=-30+phase*120+(slot%5)*2;if(cluster)y+=(i%3-1)*2.4;img.style.setProperty('--y',y.toFixed(1)+'vh');img.style.setProperty('--r',(cluster?(i%3-1)*(8+phase*5):((i%2?-1:1)*(4+phase*(12+(i%9))))).toFixed(1)+'deg');});
 }
 function req(){if(!raf)raf=requestAnimationFrame(tick);}addEventListener('scroll',req,{passive:true});addEventListener('resize',req,{passive:true});tick();
}
function ensureHarvest(){const rain=buildHarvest100();if(!rain)return false;retimeRain();window.dispatchEvent(new CustomEvent('nsv421:cinematic-rain-ready',{detail:{count:rain.querySelectorAll('img').length}}));return true;}
function init(){
 cleanTelegram();
 [0,80,320,900].forEach(ms=>setTimeout(ensureHarvest,ms));
 window.addEventListener('load',()=>setTimeout(ensureHarvest,0),{once:true});
 window.addEventListener('nsv421:change',()=>setTimeout(ensureHarvest,40));
 window.addEventListener('resize',()=>setTimeout(ensureHarvest,100),{passive:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();