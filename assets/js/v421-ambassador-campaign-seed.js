(function(){
'use strict';
const Store=window.NSV421Store;
if(!Store)return;
const MIG='ns-v421-ambassador-campaign-seed-v1';
if(localStorage.getItem(MIG)==='1')return;
const items=[
 {id:'AMB101-P',name:'Ambassador portrait · white shirt',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB101',src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB101-portrait.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',at:'V42.1 ambassador campaign'}]},
 {id:'AMB101-POST',name:'Ambassador campaign poster · Freshness You Can Trust',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Media Library',faceGroup:'AMB101',src:'assets/images/ambassadors/campaign/AMB101-poster.webp',thumb:'assets/images/ambassadors/campaign/AMB101-poster.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/campaign/AMB101-poster.webp',at:'V42.1 ambassador campaign'}]},
 {id:'AMB102-P',name:'Ambassador portrait · beige vest',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB102',src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB102-portrait.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',at:'V42.1 ambassador campaign'}]},
 {id:'AMB102-POST',name:'Ambassador campaign poster · Pure Goodness',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Media Library',faceGroup:'AMB102',src:'assets/images/ambassadors/campaign/AMB102-poster.webp',thumb:'assets/images/ambassadors/campaign/AMB102-poster.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/campaign/AMB102-poster.webp',at:'V42.1 ambassador campaign'}]},
 {id:'AMB201-P',name:'Product promoter portrait · blue linen',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB201',src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',thumb:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',at:'V42.1 ambassador campaign'}]},
 {id:'AMB201-POST',name:'Product promoter campaign poster · blue linen',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Media Library',faceGroup:'AMB201',src:'assets/images/ambassadors/campaign/AMB201-poster-blue.webp',thumb:'assets/images/ambassadors/campaign/AMB201-poster-blue.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/campaign/AMB201-poster-blue.webp',at:'V42.1 ambassador campaign'}]}
];
const s=Store.load();
s.media=Array.isArray(s.media)?s.media:[];
for(const m of items){if(!s.media.some(x=>x.id===m.id))s.media.push(m);}
s.faceMarquee=s.faceMarquee||{};
s.faceMarquee.selectedIds=Array.isArray(s.faceMarquee.selectedIds)?s.faceMarquee.selectedIds:[];
for(const id of ['AMB101-P','AMB201-P'])if(!s.faceMarquee.selectedIds.includes(id))s.faceMarquee.selectedIds.push(id);
s.peopleStreams=s.peopleStreams||{};
s.peopleStreams.ambassadors=s.peopleStreams.ambassadors||{enabled:true,title:'Brand Ambassadors',subtitle:'Approved ambassador campaign portraits.',speed:48,direction:'ltr',selectedIds:[],placement:'people-page'};
s.peopleStreams.ambassadors.selectedIds=Array.isArray(s.peopleStreams.ambassadors.selectedIds)?s.peopleStreams.ambassadors.selectedIds:[];
for(const id of ['AMB101-P','AMB102-P','AMB201-P'])if(!s.peopleStreams.ambassadors.selectedIds.includes(id))s.peopleStreams.ambassadors.selectedIds.push(id);
Store.audit?.(s,'Added approved ambassador campaign media','AMB101 / AMB102 / AMB201');
Store.save(s);
localStorage.setItem(MIG,'1');
})();
