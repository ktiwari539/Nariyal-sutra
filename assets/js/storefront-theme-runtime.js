(function(){
'use strict';
const FALLBACK='nariyal-signature';
const THEMES={
 'nariyal-signature':{name:'Nariyal Signature',description:'The approved deep-forest storefront with premium dark surfaces, cream typography and restrained gold accents.'},
 'fresh-grove':{name:'Fresh Grove',description:'A bright botanical storefront with airy spacing, farm-fresh framing and natural green details.'},
 'golden-harvest':{name:'Golden Harvest',description:'Warm ivory, coconut gold and earth tones for considered celebrations and seasonal hospitality.'},
 'coastal-premium':{name:'Coastal Premium',description:'A refined oceanic editorial storefront with deep teal surfaces, sand accents and framed photography.'}
};
const valid=id=>Object.prototype.hasOwnProperty.call(THEMES,id)?id:FALLBACK;
function parts(date,timeZone){
 try{const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),o={};p.forEach(x=>o[x.type]=x.value);return {date:`${o.year}-${o.month}-${o.day}`,time:`${o.hour}:${o.minute}`,day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday)};}catch(_){return parts(date,'UTC');}
}
function stamp(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:null;}
function active(schedule,now,timezone){
 if(!schedule||schedule.enabled===false||!THEMES[schedule.themeId])return false;
 const type=schedule.type||'once',ms=now.getTime(),start=stamp(schedule.startAt),end=stamp(schedule.endAt);
 if(type!=='weekly')return (start===null||ms>=start)&&(end===null||ms<end);
 if((start!==null&&ms<start)||(end!==null&&ms>=end))return false;
 const z=parts(now,schedule.timezone||timezone||'Asia/Kolkata'),days=Array.isArray(schedule.daysOfWeek)?schedule.daysOfWeek:[];
 if(!days.includes(z.day))return false;
 const from=String(schedule.dailyStart||'00:00'),to=String(schedule.dailyEnd||'23:59');
 return from<=to?z.time>=from&&z.time<to:z.time>=from||z.time<to;
}
function nextChange(config,now=new Date()){
 const times=[];(config.schedules||[]).filter(x=>x.enabled!==false&&THEMES[x.themeId]).forEach(x=>{for(const k of ['startAt','endAt']){const v=stamp(x[k]);if(v!==null&&v>now.getTime())times.push({at:new Date(v).toISOString(),scheduleId:x.id,type:k==='startAt'?'start':'end'});}if(x.type==='weekly'){let was=active(x,now,config.businessTimezone);for(let i=1;i<=8*24*60;i++){const probe=new Date(now.getTime()+i*60000),is=active(x,probe,config.businessTimezone);if(is!==was){times.push({at:probe.toISOString(),scheduleId:x.id,type:is?'recurrence-start':'recurrence-end'});break;}}}});
 return times.sort((a,b)=>a.at.localeCompare(b.at))[0]||null;
}
function resolve(config={},now=new Date()){
 const base=valid(config.publishedTheme);
 if(config.manualOverride?.active!==false&&THEMES[config.manualOverride?.themeId])return {id:valid(config.manualOverride.themeId),source:'manual-override',base,activeSchedule:null,nextChange:nextChange(config,now)};
 const matches=(config.schedules||[]).filter(x=>active(x,now,config.businessTimezone)).sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0)||String(a.id).localeCompare(String(b.id)));
 const chosen=matches[0]||null;
 return {id:chosen?valid(chosen.themeId):base,source:chosen?'schedule':'published-base',base,activeSchedule:chosen,nextChange:nextChange(config,now),conflict:matches.length>1};
}
function requestedPreview(){try{const id=new URLSearchParams(location.search).get('themePreview');return id&&THEMES[id]?id:null;}catch(_){return null;}}
function config(){try{return window.NSV421Store?.load?.()?.themeConfig||{};}catch(_){return {};}}
function apply(){
 const preview=requestedPreview(),result=resolve(config()),id=preview||result.id,root=document.documentElement;
 root.dataset.nsTheme=id;root.dataset.nsThemeMode=preview?'preview':result.source;root.style.colorScheme=['fresh-grove','golden-harvest'].includes(id)?'light':'dark';
 window.NSStorefrontTheme={id,mode:root.dataset.nsThemeMode,isPreview:!!preview,themes:THEMES,fallback:FALLBACK,result,apply,resolve,active,nextChange,valid};
 window.dispatchEvent(new CustomEvent('ns:theme-applied',{detail:{id,preview:!!preview,source:root.dataset.nsThemeMode}}));
}
window.NSThemeResolver={themes:THEMES,fallback:FALLBACK,valid,active,resolve,nextChange,parts};
apply();setInterval(apply,30000);window.addEventListener('nsv421:change',apply);window.addEventListener('nsv421:production-ready',apply);
})();
