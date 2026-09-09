(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* Keep the richer cinematic source-to-cut film lower on the storefront by default.
   This migration runs once; after that, Admin owns the order. */
function migrateCinematicPlacement(){
  const Store=window.NSV421Store;if(!Store)return;
  const s=Store.load();if(!s||s.v31CinematicPlacementDone)return;
  const list=Array.isArray(s.sections)?s.sections.slice().sort((a,b)=>(+a.order||999)-(+b.order||999)):[];
  const ix=list.findIndex(x=>x.id==='cinematic');
  if(ix>=0){
    const [cin]=list.splice(ix,1);
    let insert=list.findIndex(x=>x.id==='faq');
    if(insert<0)insert=Math.max(0,list.length-2);
    list.splice(insert,0,cin);
    list.forEach((x,i)=>x.order=i+1);
    s.sections=list;
  }
  s.v31CinematicPlacementDone=true;
  try{Store.audit?.(s,'V31 default placement','Cinematic story moved lower; Admin retains sequencing control.');}catch(e){}
  Store.save(s);
}

function applySectionOrder(){
  const Store=window.NSV421Store;if(!Store||!/(^|\/)index\.html$|\/$/.test(location.pathname))return;
  const s=Store.load(),footer=document.querySelector('body>footer')||$('footer');if(!footer||!Array.isArray(s.sections))return;
  const map={
    hero:()=>[$('#home')],cinematic:()=>[$('#v20-story-film'),$('.mobile-story-reel')],sourcing:()=>[$('#grove-story')],
    'fresh-cut':()=>[$('#cut-story')],collection:()=>[$('#collection')],'brand-moment':()=>[$('.brand-moment')],
    harvest:()=>[$('#harvest-film')],'live-motion':()=>[$('#live-motion')],pricing:()=>[$('#price-list')],
    'our-story':()=>[$('#our-story')],'people-teaser':()=>[$('#people-of-nariyal')],'people-marquee':()=>[$('#nsPeopleMarquee')],
    'how-to-order':()=>[$('#how-to-order')],uses:()=>[$('#coconut-uses')],faq:()=>[$('#faq')],order:()=>[$('#order')],contact:()=>[$('#contact')]
  };
  [...s.sections].sort((a,b)=>(+a.order||999)-(+b.order||999)).forEach(sec=>{
    (map[sec.id]?.()||[]).filter(Boolean).forEach(node=>{node.hidden=sec.visible===false;if(sec.visible!==false)footer.parentNode.insertBefore(node,footer);});
  });
}

/* Stronger natural silhouette mix. Still one approved photographic coconut source, but the harvest no longer reads as 100 identical circles. */
function strengthenCoconutVariety(){
  const rain=$('.v21-real-rain');if(!rain)return;
  const types=['v31-type-slender','v31-type-pear','v31-type-dwarf','v31-type-oval','v31-type-bulb','v31-type-small',''];
  $$('.v21-real-rain img').forEach((im,i)=>{
    types.forEach(c=>c&&im.classList.remove(c));
    const t=types[i%types.length];if(t)im.classList.add(t);
    im.classList.toggle('v31-hero-size',i%17===0||i%23===4);
    /* A few foreground fruit are intentionally larger; most remain moderate. */
    const size=(i%17===0?260:(i%23===4?225:68+((i*47)%150)));
    im.style.setProperty('--w',size+'px');
  });
}

function burstMarkup(){
  const specs=[
    [-78,-86,280,-102,-132,420,8,1.7,2.25,-18,.00,.72],
    [-46,-118,360,-66,-168,510,7,1.8,2.45,-8,.03,.78],
    [-18,-142,430,-26,-190,590,6,1.95,2.65,7,.05,.82],
    [18,-132,390,29,-184,540,8,1.85,2.5,16,.02,.80],
    [48,-104,330,72,-154,475,7,1.75,2.35,26,.06,.74],
    [78,-76,260,108,-118,390,6,1.65,2.15,34,.08,.70],
    [-96,-46,230,-130,-78,345,5,1.6,2.0,-32,.07,.68],
    [95,-42,220,132,-70,330,5,1.55,1.95,38,.09,.66],
    [-34,-64,510,-45,-92,680,4,2.05,2.9,-14,.10,.72],
    [34,-58,470,48,-88,640,4,2.0,2.8,19,.11,.70],
    [-8,-78,620,-12,-112,780,4,2.2,3.15,5,.12,.76],
    [9,-46,560,14,-78,720,3,2.15,3.05,12,.13,.68]
  ];
  return specs.map(s=>`<i style="--dx:${s[0]}px;--dy:${s[1]}px;--dz:${s[2]}px;--dx2:${s[3]}px;--dy2:${s[4]}px;--dz2:${s[5]}px;--size:${s[6]}px;--zoom:${s[7]};--zoom2:${s[8]};--rot:${s[9]}deg;--delay:${s[10]}s;--dur:${s[11]}s"></i>`).join('');
}

function attachSplash(host){
  if(!host||host.querySelector(':scope > .v31-splash-burst'))return null;
  const b=document.createElement('span');b.className='v31-splash-burst';b.setAttribute('aria-hidden','true');b.innerHTML=burstMarkup();host.appendChild(b);return b;
}
function fireBurst(b){
  if(!b)return;b.classList.remove('is-splashing');void b.offsetWidth;b.classList.add('is-splashing');
  clearTimeout(b._v31t);b._v31t=setTimeout(()=>b.classList.remove('is-splashing'),1050);
}
function watchOpening(host,root){
  if(!host||!root)return;const burst=attachSplash(host);if(!burst)return;
  let armed=true,raf=0;
  function tick(){
    raf=requestAnimationFrame(tick);
    const rr=root.getBoundingClientRect();
    if(rr.bottom<-innerHeight*.25||rr.top>innerHeight*1.25)return;
    const hs=getComputedStyle(host),rs=getComputedStyle(root);
    let opening=parseFloat(hs.getPropertyValue('--opening'))||parseFloat(rs.getPropertyValue('--opening'))||0;
    /* Legacy cut story is driven by the protected cinematic controller. If it exposes no variable, use section progress only as fallback. */
    if(opening<=0.001&&root.id==='cut-story'){
      const range=Math.max(1,root.offsetHeight-innerHeight),p=Math.max(0,Math.min(1,-rr.top/range));
      opening=(p>.43&&p<.68)?Math.min(1,(p-.43)/.08):0;
    }
    if(opening>.16&&armed){armed=false;fireBurst(burst);}
    if(opening<.035)armed=true;
  }
  tick();
  addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
}

function initSplash(){
  watchOpening($('#v20-story-coconut'),$('#v20-story-film'));
  watchOpening($('#hero-coconut'),$('#cut-story'));
}

function init(){
  /* V32 owns homepage sequencing. V31 keeps only the approved visual corrections. */
  setTimeout(()=>{strengthenCoconutVariety();initSplash();},260);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
