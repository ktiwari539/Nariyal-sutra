(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const Store=window.NSV421Store;

/* V33 placement correction requested during review:
   keep the source-to-cut cinematic near the beginning of the storefront, not near the footer.
   This runs once. After it runs, Admin remains the source of truth for future sequencing. */
function repairCinematicPlacement(){
  if(!Store||!/(^|\/)index\.html$|\/$/.test(location.pathname))return;
  const s=Store.load();
  if(!s||s.v33CinematicPlacementSchema===1)return;
  const list=Array.isArray(s.sections)?s.sections.slice().sort((a,b)=>(+a.order||999)-(+b.order||999)):[];
  const ix=list.findIndex(x=>x.id==='cinematic');
  if(ix>=0){
    const [cinematic]=list.splice(ix,1);
    /* Position 4 = after hero, ticker and product collection. */
    list.splice(Math.min(3,list.length),0,cinematic);
    list.forEach((x,i)=>x.order=i+1);
    s.sections=list;
  }
  s.v33CinematicPlacementSchema=1;
  try{Store.audit?.(s,'V33 cinematic placement','Moved source-to-cut cinematic to storefront position 4; Admin retains future sequencing control.');}catch(e){}
  Store.save(s);
}

/* Premium harvest treatment.
   Keep the 100-item harvest concept, but never show 100 translucent clones at once.
   A limited number of opaque photographic fruit pass through the frame at any moment,
   with restrained natural size, tone and silhouette variation. */
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
    /* Remove the aggressive stretching classes from earlier review passes. */
    [...im.classList].forEach(c=>{if(/^v(?:27|28|30|31)-(?:shape|type|tone|near|far|hero|cluster)/.test(c))im.classList.remove(c);});
    shapes.forEach(c=>im.classList.remove(c));
    tones.forEach(c=>im.classList.remove(c));
    im.classList.add(shapes[i%shapes.length]);
    im.classList.add(tones[(i*3)%tones.length]);

    const depth=i%10;
    const near=(depth===0||depth===6);
    const far=(depth===3||depth===8||depth===9);
    im.classList.toggle('v33-near',near);
    im.classList.toggle('v33-far',far);

    /* Deterministic spread that avoids the obvious same-column clone look. */
    const x=3+((i*37.73 + (i%9)*4.7)%94);
    const cluster=i%14===0||i%14===1;
    const clusterOffset=cluster?(i%14===0?-1.6:1.8):0;
    im.style.setProperty('--v33-x',(x+clusterOffset).toFixed(2)+'%');

    let w;
    if(near)w=136+((i*17)%58);          // 136-193px
    else if(far)w=60+((i*13)%40);       // 60-99px
    else w=82+((i*19)%64);              // 82-145px
    im.style.setProperty('--v33-w',w+'px');
    im.style.setProperty('--v33-base-rot',(((i*29)%34)-17)+'deg');
    im.style.setProperty('--v33-drift',(((i*23)%70)-35)+'px');
    im.style.setProperty('--v33-delay',((i%7)*0.006).toFixed(3));
  });

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){rain.style.setProperty('--v33-rain-alpha','0');return;}

  let raf=0;
  function render(){
    raf=0;
    const rr=film.getBoundingClientRect();
    const range=Math.max(1,film.offsetHeight-innerHeight);
    const p=Math.max(0,Math.min(1,-rr.top/range));
    const activeWindow=p<.03?0:(p<.58?1:Math.max(0,1-(p-.58)/.12));
    rain.style.setProperty('--v33-rain-alpha',activeWindow.toFixed(3));

    imgs.forEach((im,i)=>{
      /* 100 fruit pass through over time; only ~14-18 occupy the viewport at once. */
      const start=.025 + (i/Math.max(1,imgs.length-1))*.48;
      const duration=.092 + (i%5)*.004;
      const phase=(p-start)/duration;
      const visible=phase>0&&phase<1&&activeWindow>0;
      if(!visible){im.style.setProperty('--v33-alpha','0');return;}

      const q=Math.max(0,Math.min(1,phase));
      const y=-24 + q*136;
      const drift=parseFloat(im.style.getPropertyValue('--v33-drift'))||0;
      const sway=Math.sin((q*Math.PI*1.22)+(i%9)*.37)*drift;
      const rot=(parseFloat(im.style.getPropertyValue('--v33-base-rot'))||0)+(q-.5)*18;
      const far=im.classList.contains('v33-far');
      const near=im.classList.contains('v33-near');
      const edge=Math.min(1,q/.13,(1-q)/.13);
      const alpha=Math.max(0,Math.min(1,edge))*(far?.74:(near?.98:.91));
      const scale=far?.78:(near?1.06:.92);

      im.style.setProperty('--v33-y',y.toFixed(2)+'vh');
      im.style.setProperty('--v33-sway',sway.toFixed(1)+'px');
      im.style.setProperty('--v33-rot',rot.toFixed(2)+'deg');
      im.style.setProperty('--v33-scale',scale.toFixed(3));
      im.style.setProperty('--v33-alpha',alpha.toFixed(3));
    });
  }
  const request=()=>{if(!raf)raf=requestAnimationFrame(render);};
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});
  render();
}

function init(){
  repairCinematicPlacement();
  /* V32 will react to the store change, then V33 applies the premium harvest after older harvest enrichers. */
  setTimeout(premiumHarvest,420);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
