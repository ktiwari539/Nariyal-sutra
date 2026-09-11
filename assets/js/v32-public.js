(function(){
'use strict';
const Store=window.NSV421Store;
const $=(s,r=document)=>r.querySelector(s);
const DEFS=[['hero','Product hero','Existing live hero'],['ticker','Freshness / service strip','Information strip'],['collection','Product collection','Product cards'],['cinematic','Source-to-cut cinematic journey','Atomic cinematic · Sourcing + Fresh Cut chapters'],['brand-moment','Brand moment','Editorial'],['harvest','Harvest film','Adaptive coconut motion'],['live-motion','Freshness motion','Video / fallback'],['benefits','Product benefits','Proof strip'],['quality','Product quality / freshness','Editorial facts'],['pricing','Pricing','None'],['our-story','Why us / story','Editorial'],['how-to-order','How to order','Steps'],['uses','Coconut uses','Cards'],['people-teaser','People teaser','Editorial'],['people-marquee','Moving People full-picture rail','Continuous marquee'],['faq','Quick Answers','Accordion'],['order','Order flow','Form + map'],['contact','Enquire / contact','Commercial desk']];
const DEFAULTS=DEFS.map((x,i)=>({id:x[0],title:x[1],page:'homepage',visible:true,order:i+1,protected:false,motion:x[2]}));
const MAP={hero:()=>$('#home'),ticker:()=>$('#main-site > .ticker'),collection:()=>$('#collection'),cinematic:()=>$('#v421-cinematic-film-pro')||$('#v421-cinematic-film')||$('#scroll-cinema'),'brand-moment':()=>$('#main-site > .brand-moment'),harvest:()=>$('#harvest-film'),'live-motion':()=>$('#live-motion'),benefits:()=>$('#main-site > .benefits'),quality:()=>$('#main-site > .nutrition'),pricing:()=>$('#price-list'),'our-story':()=>$('#our-story'),'how-to-order':()=>$('#how-to-order'),uses:()=>$('#coconut-uses'),'people-teaser':()=>$('#people-of-nariyal'),'people-marquee':()=>$('#nsPeopleMarquee'),faq:()=>$('#faq'),order:()=>$('#order'),contact:()=>$('#contact')};
function isHome(){return /(^|\/)index\.html$|\/$/.test(location.pathname);}
function normalizeKnownSections(list){
 const current=new Map((Array.isArray(list)?list:[]).map(x=>[x.id,x]));
 const merged=DEFAULTS.map(d=>({...d,...(current.get(d.id)||{}),protected:false}));
 merged.sort((a,b)=>(+a.order||999)-(+b.order||999)).forEach((x,i)=>x.order=i+1);
 return merged;
}
function migrateState(){
 if(!Store)return null;
 const s=Store.load(),old=new Map((s.sections||[]).map(x=>[x.id,x]));
 if(s.v32HomepageSequenceSchema!==1){
  const hasCompleteTopLevel=DEFAULTS.every(d=>old.has(d.id));
  if(hasCompleteTopLevel){
   /* A complete Admin order is already authoritative. Never reset it just because
      this browser has not yet written the V32 schema marker. */
   s.sections=normalizeKnownSections(s.sections);
   try{Store.audit?.(s,'V32 homepage sequence adopted','Preserved complete Admin-managed top-level order.');}catch(e){}
  }else{
   s.sections=DEFAULTS.map(d=>{const o=old.get(d.id);return {...d,visible:o?o.visible!==false:true};});
   s.sections.forEach((x,i)=>x.order=i+1);
   try{Store.audit?.(s,'V32 homepage sequence repaired','Reset incomplete/unsafe legacy nested-section order to approved top-level sequence.');}catch(e){}
  }
  s.v32HomepageSequenceSchema=1;s.v31CinematicPlacementDone=true;Store.save(s);
 }else s.sections=normalizeKnownSections(s.sections);
 return s;
}
let applying=false;
function applySequence(){if(!Store||!isHome()||applying)return;const main=$('#main-site'),footer=$('#main-site > footer');if(!main||!footer)return;const s=migrateState();if(!s||!Array.isArray(s.sections))return;applying=true;try{[...s.sections].sort((a,b)=>(+a.order||999)-(+b.order||999)).forEach(sec=>{const node=MAP[sec.id]?.();if(!node)return;node.hidden=sec.visible===false;node.dataset.v32Section=sec.id;if(sec.visible!==false)main.insertBefore(node,footer);});}finally{applying=false;}}
function watchDynamicModules(){if(!isHome()||!document.body)return;const mo=new MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes){if(n.nodeType===1&&(n.id==='v421-cinematic-film-pro'||n.querySelector?.('#v421-cinematic-film-pro'))){setTimeout(applySequence,0);return;}}}});mo.observe(document.body,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),12000);}
function prepareIntroLetters(){const logo=$('#jungle-intro .ji-logo');if(!logo||logo.dataset.v32Letters==='1')return;logo.dataset.v32Letters='1';logo.setAttribute('aria-label','Nariyal Sutra');const words=['NARIYAL','SUTRA'];let index=0;logo.innerHTML=words.map((word,wi)=>`<span class="v32-logo-line">${[...word].map((ch,ci)=>{const cls=(ci===0?(wi===0?' ji-logo-n':' ji-logo-s'):'');return `<span class="v32-logo-letter${cls}" style="--letter-i:${index++}">${ch}</span>`;}).join('')}</span>`).join('');}
function init(){prepareIntroLetters();migrateState();watchDynamicModules();[80,360,900,1800,3200].forEach(ms=>setTimeout(applySequence,ms));window.addEventListener('nsv421:change',()=>setTimeout(applySequence,25));window.addEventListener('nsv421:production-ready',()=>setTimeout(applySequence,25));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();