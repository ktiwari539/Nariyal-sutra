(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const Store=window.NSV421Store;

/* V32 owns the approved default homepage order and Admin owns all later sequencing.
   V33 must not move the cinematic again after an Admin change. */
function repairCinematicPlacement(){
  if(!Store||!/(^|\/)index\.html$|\/$/.test(location.pathname))return;
  const s=Store.load();
  if(!s||s.v33CinematicPlacementSchema===1)return;
  s.v33CinematicPlacementSchema=1;
  try{Store.audit?.(s,'V33 cinematic placement adopted','Accepted the V32/Admin-managed homepage sequence without overriding it.');}catch(e){}
  Store.save(s);
}

function premiumHarvest(){
  const film=$('#v20-story-film');
  const rain=$('.v21-real-rain');
  if(!film||!rain)return;
  rain.classList.add('v33-premium-rain');
  const imgs=$$('img',rain);
  if(!imgs.length)return;
  const shapes=['v33-shape-natural','v33-shape-oval','v33-shape-pear','v33-shape-compact','v33-shape-natural'];
  const tones=['v33-tone-green','v33-tone-lime','v33-tone-gold','v33-tone-deep','v33-tone-pale'];
  imgs.forEach((im,i)=>{
    [...im.classList].forEach(c=>{if(/^v(?:27|28|30|31)-(?:shape|type|tone|near|far|hero|cluster)/.test(c))im.classList.remove(c);});
    shapes.forEach(c=>im.classList.remove(c));tones.forEach(c=>im.classList.remove(c));
    im.classList.add(shapes[i%shapes.length]);im.classList.add(tones[(i*3)%tones.length]);
    const depth=i%10,near=(depth===0||depth===6),far=(depth===3||depth===8||depth===9);
    im.classList.toggle('v33-near',near);im.classList.toggle('v33-far',far);
    const x=3+((i*37.73 + (i%9)*4.7)%94),cluster=i%14===0||i%14===1,clusterOffset=cluster?(i%14===0?-1.6:1.8):0;
    im.style.setProperty('--v33-x',(x+clusterOffset).toFixed(2)+'%');
    let w;if(near)w=136+((i*17)%58);else if(far)w=60+((i*13)%40);else w=82+((i*19)%64);
    im.style.setProperty('--v33-w',w+'px');im.style.setProperty('--v33-base-rot',(((i*29)%34)-17)+'deg');im.style.setProperty('--v33-drift',(((i*23)%70)-35)+'px');im.style.setProperty('--v33-delay',((i%7)*0.006).toFixed(3));
  });
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduce){rain.style.setProperty('--v33-rain-alpha','0');return;}
  let raf=0;
  function render(){
    raf=0;const rr=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight),p=Math.max(0,Math.min(1,-rr.top/range)),activeWindow=p<.03?0:(p<.58?1:Math.max(0,1-(p-.58)/.12));rain.style.setProperty('--v33-rain-alpha',activeWindow.toFixed(3));
    imgs.forEach((im,i)=>{const start=.025+(i/Math.max(1,imgs.length-1))*.48,duration=.092+(i%5)*.004,phase=(p-start)/duration,visible=phase>0&&phase<1&&activeWindow>0;if(!visible){im.style.setProperty('--v33-alpha','0');return;}const q=Math.max(0,Math.min(1,phase)),y=-24+q*136,drift=parseFloat(im.style.getPropertyValue('--v33-drift'))||0,sway=Math.sin((q*Math.PI*1.22)+(i%9)*.37)*drift,rot=(parseFloat(im.style.getPropertyValue('--v33-base-rot'))||0)+(q-.5)*18,far=im.classList.contains('v33-far'),near=im.classList.contains('v33-near'),edge=Math.min(1,q/.13,(1-q)/.13),alpha=Math.max(0,Math.min(1,edge))*(far?.74:(near?.98:.91)),scale=far?.78:(near?1.06:.92);im.style.setProperty('--v33-y',y.toFixed(2)+'vh');im.style.setProperty('--v33-sway',sway.toFixed(1)+'px');im.style.setProperty('--v33-rot',rot.toFixed(2)+'deg');im.style.setProperty('--v33-scale',scale.toFixed(3));im.style.setProperty('--v33-alpha',alpha.toFixed(3));});
  }
  const request=()=>{if(!raf)raf=requestAnimationFrame(render);};addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});render();
}

/* Keep the deployed desktop wordmark untouched. Only normalize the known mobile/tablet child-line bug. */
function stabilizeIntroWordmark(){
  if(!matchMedia('(max-width:980px)').matches)return;
  const intro=$('#jungle-intro'),logo=$('.ji-logo',intro||document);if(!intro||!logo)return;
  if(!logo.dataset.nsWordmarkStable){logo.innerHTML='<span class="ns-wordmark-line ns-wordmark-nariyal"><span class="ji-logo-n">N</span>ARIYAL</span><span class="ns-wordmark-line ns-wordmark-sutra"><span class="ji-logo-s">S</span>UTRA</span>';logo.dataset.nsWordmarkStable='1';}
  if(!document.getElementById('ns-v33-wordmark-guard')){const style=document.createElement('style');style.id='ns-v33-wordmark-guard';style.textContent=`@media(max-width:980px){html body #jungle-intro .ji-logo[data-ns-wordmark-stable="1"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:.08em!important;line-height:1!important;overflow:visible!important;white-space:normal!important}html body #jungle-intro .ji-logo[data-ns-wordmark-stable="1"] .ns-wordmark-line{display:block!important;position:static!important;width:max-content!important;max-width:100%!important;height:auto!important;min-height:1em!important;margin:0!important;padding:0!important;opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;clip:auto!important;clip-path:none!important;overflow:visible!important;white-space:nowrap!important;line-height:1!important}html body #jungle-intro .ji-logo[data-ns-wordmark-stable="1"] .ns-wordmark-sutra{margin-top:.04em!important}html body #jungle-intro .ji-logo[data-ns-wordmark-stable="1"] .ji-logo-n,html body #jungle-intro .ji-logo[data-ns-wordmark-stable="1"] .ji-logo-s{display:inline!important;position:static!important;opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;clip:auto!important;clip-path:none!important}}`;document.head.appendChild(style);}
}
function init(){repairCinematicPlacement();stabilizeIntroWordmark();setTimeout(premiumHarvest,420);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
