(function(){
'use strict';
const Store=window.NSV421Store;
const $=(s,r=document)=>r.querySelector(s);

/* Canonical storefront order. Only true top-level modules are movable.
   The source-to-cut cinematic remains atomic so its internal chapters can never be torn apart. */
const DEFS=[
 ['hero','Product hero','Existing live hero'],
 ['ticker','Freshness / service strip','Information strip'],
 ['collection','Product collection','Product cards'],
 ['cinematic','Source-to-cut cinematic journey','Atomic cinematic · Sourcing + Fresh Cut chapters'],
 ['brand-moment','Brand moment','Editorial'],
 ['harvest','Harvest film','Adaptive coconut motion'],
 ['live-motion','Freshness motion','Video / fallback'],
 ['benefits','Product benefits','Proof strip'],
 ['quality','Product quality / freshness','Editorial facts'],
 ['pricing','Pricing','None'],
 ['our-story','Why us / story','Editorial'],
 ['how-to-order','How to order','Steps'],
 ['uses','Coconut uses','Cards'],
 ['people-teaser','People teaser','Editorial'],
 ['people-marquee','Moving People full-picture rail','Continuous marquee'],
 ['faq','Quick Answers','Accordion'],
 ['order','Order flow','Form + map'],
 ['contact','Enquire / contact','Commercial desk']
];
const DEFAULTS=DEFS.map((x,i)=>({id:x[0],title:x[1],page:'homepage',visible:true,order:i+1,protected:false,motion:x[2]}));
const MAP={
 hero:()=>$('#home'),
 ticker:()=>$('#main-site > .ticker'),
 collection:()=>$('#collection'),
 'brand-moment':()=>$('#main-site > .brand-moment'),
 harvest:()=>$('#harvest-film'),
 'live-motion':()=>$('#live-motion'),
 benefits:()=>$('#main-site > .benefits'),
 quality:()=>$('#main-site > .nutrition'),
 pricing:()=>$('#price-list'),
 'our-story':()=>$('#our-story'),
 'how-to-order':()=>$('#how-to-order'),
 uses:()=>$('#coconut-uses'),
 'people-teaser':()=>$('#people-of-nariyal'),
 'people-marquee':()=>$('#nsPeopleMarquee'),
 cinematic:()=>$('#scroll-cinema'),
 faq:()=>$('#faq'),
 order:()=>$('#order'),
 contact:()=>$('#contact')
};
function isHome(){return /(^|\/)index\.html$|\/$/.test(location.pathname);}
function migrateState(){
 if(!Store)return null;
 const s=Store.load();
 const old=new Map((s.sections||[]).map(x=>[x.id,x]));
 /* One-time repair: V29/V31 could physically reorder nested chapters. Reset to the approved V32 order once.
    Future Admin moves are preserved because this marker prevents a second reset. */
 if(s.v32HomepageSequenceSchema!==1){
   s.sections=DEFAULTS.map(d=>{const o=old.get(d.id);return {...d,visible:o?o.visible!==false:true};});
   s.sections.forEach((x,i)=>x.order=i+1);
   s.v32HomepageSequenceSchema=1;
   s.v31CinematicPlacementDone=true;
   try{Store.audit?.(s,'V32 homepage sequence repaired','Reset unsafe legacy nested-section order to approved top-level sequence.');}catch(e){}
   Store.save(s);
 }else{
   const current=new Map((s.sections||[]).map(x=>[x.id,x]));
   s.sections=DEFAULTS.map(d=>({...d,...(current.get(d.id)||{}),protected:false}));
   s.sections.sort((a,b)=>(+a.order||999)-(+b.order||999)).forEach((x,i)=>x.order=i+1);
 }
 return s;
}
let applying=false;
function applySequence(){
 if(!Store||!isHome()||applying)return;
 const main=$('#main-site'),footer=$('#main-site > footer');if(!main||!footer)return;
 const s=migrateState();if(!s||!Array.isArray(s.sections))return;
 applying=true;
 try{
   [...s.sections].sort((a,b)=>(+a.order||999)-(+b.order||999)).forEach(sec=>{
     const node=MAP[sec.id]?.();
     if(!node)return;
     node.hidden=sec.visible===false;
     node.dataset.v32Section=sec.id;
     if(sec.visible!==false)main.insertBefore(node,footer);
   });
 }finally{applying=false;}
}

/* Opening animation: the photography stays spatially stable. The ALPHABETS zoom in instead. */
function prepareIntroLetters(){
 const logo=$('#jungle-intro .ji-logo');if(!logo||logo.dataset.v32Letters==='1')return;
 logo.dataset.v32Letters='1';logo.setAttribute('aria-label','Nariyal Sutra');
 const words=['NARIYAL','SUTRA'];let index=0;
 logo.innerHTML=words.map((word,wi)=>`<span class="v32-logo-line">${[...word].map((ch,ci)=>{
   const cls=(ci===0?(wi===0?' ji-logo-n':' ji-logo-s'):'');
   return `<span class="v32-logo-letter${cls}" style="--letter-i:${index++}">${ch}</span>`;
 }).join('')}</span>`).join('');
}
function init(){
 prepareIntroLetters();
 migrateState();
 setTimeout(applySequence,80);
 setTimeout(applySequence,360);
 window.addEventListener('nsv421:change',()=>setTimeout(applySequence,25));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
