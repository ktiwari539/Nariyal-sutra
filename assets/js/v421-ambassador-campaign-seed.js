(function(){
'use strict';
const Store=window.NSV421Store;
if(!Store)return;
const MIG='ns-v421-ambassador-campaign-seed-v2';
if(localStorage.getItem(MIG)==='1')return;
const items=[
 {id:'AMB101-P',name:'Brand ambassador · white shirt',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB101',src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB101-portrait.webp',version:2,versions:[{version:2,src:'assets/images/ambassadors/campaign/AMB101-portrait.webp',at:'V42.1 approved ambassador reel'}]},
 {id:'AMB102-P',name:'Brand ambassador · beige vest',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB102',src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',thumb:'assets/images/ambassadors/campaign/AMB102-portrait.webp',version:2,versions:[{version:2,src:'assets/images/ambassadors/campaign/AMB102-portrait.webp',at:'V42.1 approved ambassador reel'}]},
 {id:'AMB201-P',name:'Product promoter · blue linen',cat:'People',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Ambassadors',faceGroup:'AMB201',src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',thumb:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',version:2,versions:[{version:2,src:'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp',at:'V42.1 approved ambassador reel'}]}
];
const s=Store.load();
s.media=Array.isArray(s.media)?s.media:[];
/* Remove older campaign records whose poster files were never approved for the public build. */
s.media=s.media.filter(m=>!['AMB101-POST','AMB102-POST','AMB201-POST'].includes(m.id));
for(const m of items){const i=s.media.findIndex(x=>x.id===m.id);if(i>=0)s.media[i]=Object.assign({},s.media[i],m);else s.media.push(m);}
s.faceMarquee=s.faceMarquee||{};
s.faceMarquee.selectedIds=Array.isArray(s.faceMarquee.selectedIds)?s.faceMarquee.selectedIds:[];
/* Keep one strong frame from each main face in the homepage holding reel. */
for(const id of ['AMB101-P','AMB201-P'])if(!s.faceMarquee.selectedIds.includes(id))s.faceMarquee.selectedIds.push(id);
s.peopleStreams=s.peopleStreams||{};
s.peopleStreams.ambassadors=s.peopleStreams.ambassadors||{enabled:true,title:'Brand Ambassadors',subtitle:'Approved ambassador portraits.',speed:48,direction:'ltr',selectedIds:[],placement:'people-page'};
s.peopleStreams.ambassadors.selectedIds=Array.isArray(s.peopleStreams.ambassadors.selectedIds)?s.peopleStreams.ambassadors.selectedIds:[];
for(const id of ['AMB101-P','AMB102-P','AMB201-P'])if(!s.peopleStreams.ambassadors.selectedIds.includes(id))s.peopleStreams.ambassadors.selectedIds.push(id);
Store.audit?.(s,'Added approved ambassador portraits to Admin and rotating reel','AMB101 / AMB102 / AMB201');
Store.save(s);
localStorage.setItem(MIG,'1');
})();
