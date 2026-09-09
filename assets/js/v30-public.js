(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);

function restoreIntroExperience(){
  const intro=$('#jungle-intro'),main=$('#main-site');
  if(!intro||!main)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){document.body.classList.add('v30-intro-done');return;}
  document.body.classList.remove('v30-intro-done');
  const finish=()=>{document.body.classList.add('v30-intro-done');};
  const obs=new MutationObserver(()=>{if(intro.style.display==='none'||main.classList.contains('visible')){finish();obs.disconnect();}});
  obs.observe(intro,{attributes:true,attributeFilter:['style','class']});obs.observe(main,{attributes:true,attributeFilter:['class']});
}

function enrichRainVariety(){
  const rain=$('.v21-real-rain');if(!rain)return;
  const imgs=[...rain.querySelectorAll('img')];
  const shapes=['v30-shape-tall','v30-shape-pear','v30-shape-wide','v30-shape-oval','v30-shape-small',''];
  imgs.forEach((im,i)=>{
    shapes.forEach(c=>c&&im.classList.remove(c));
    const shape=shapes[i%shapes.length];if(shape)im.classList.add(shape);
    im.classList.toggle('v30-near',i%9===0||i%13===2);
    im.classList.toggle('v30-far',i%8===3||i%17===5);
    im.classList.toggle('v30-cluster',i%12<3);
    // Increase visual size substantially while maintaining mobile caps in CSS.
    const base=72+((i*41)%146);im.style.setProperty('--w',base+'px');
    im.style.setProperty('--rx',((i%2?-1:1)*(2+(i%7)))+'deg');
    im.style.setProperty('--ry',((i%3-1)*(3+(i%6)))+'deg');
    if(!im.style.getPropertyValue('--s'))im.style.setProperty('--s',(.72+((i*11)%42)/100).toFixed(2));
  });
}

function addCutDroplets(){
  const coconut=$('#v20-story-coconut'),film=$('#v20-story-film');if(!coconut||!film||coconut.querySelector('.v30-cut-droplets'))return;
  const box=document.createElement('span');box.className='v30-cut-droplets';box.setAttribute('aria-hidden','true');
  const specs=[[-54,-82,-18,9,.94],[-31,-112,-7,7,.88],[-9,-92,10,6,.82],[17,-118,18,8,.9],[38,-86,28,7,.78],[59,-105,34,5,.72],[-42,-58,-24,5,.72],[48,-62,25,6,.76],[2,-142,4,5,.68],[-70,-72,-32,5,.62],[72,-76,35,5,.6],[24,-54,16,4,.58]];
  box.innerHTML=specs.map(s=>`<i style="--dx:${s[0]}px;--dy:${s[1]}px;--dr:${s[2]}deg;--d:${s[3]}px;--da:${s[4]}"></i>`).join('');
  coconut.appendChild(box);
  /* The existing scroll-film controller drives --cut-droplet-p / --cut-droplet-alpha in sync with the real cap lift. */
}

function tightenLayout(){
  const root=$('#ns-del-root');if(root)root.classList.add('v30-full-grid');
  document.querySelectorAll('section').forEach(sec=>{if(sec.hidden)return;const rect=sec.getBoundingClientRect();if(rect.height>900&&!sec.querySelector('img,video,canvas,iframe,form,.order-card,.faq-list,.story-stage,.cinema'))sec.classList.add('v30-tight-section');});
}

function init(){restoreIntroExperience();setTimeout(()=>{enrichRainVariety();addCutDroplets();tightenLayout();},120);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
