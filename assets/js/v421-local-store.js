(function(){
'use strict';
const KEY='ns-v421-local-state-v27';
const LEGACY_KEYS=['ns-v421-local-state-v26','ns-v421-local-state-v25','ns-v421-local-state-v23','ns-v421-local-state-v22','ns-v421-local-state-v21'];
const SCHEMA=27;
const PEOPLE_MEDIA_IDS=["G001","G002","G003","G004","G005","G006","G007","G008","G011","G012","G016","G021","G023","G024","G025","G026","G031","G034","G035","G036","G037","G039","G040","G041","G042","G044","G046","G047","G048","G049","G050","G051","G052","G055","G061","G064","G066","G067","G068","G069","G070","G072","G073","G074","G075","G077","G078"];
const FEATURED_FACE_IDS=["G001","G002","G004","G005","G006","G007","G008","G011","G012","G025","G026","G031","G034","G035","G036","G039","G040","G041","G042","G044","G046","G049","G052","G055","G069","G072","G073","G074","G075","G077","G078"];
const FACE_IDS=PEOPLE_MEDIA_IDS.slice();
const alias={G020:'G011',G058:'G026'};
function clone(v){return JSON.parse(JSON.stringify(v));}
function now(){return new Date().toISOString();}
function faceMedia(id,i){const featured=FEATURED_FACE_IDS.includes(id);return {id,name:'People reference '+id,cat:'People',status:featured?'Approved':'Needs review',visible:featured,publicAllowed:true,storyAllowed:true,homepageAllowed:featured,brandFit:featured?'Strong':'Review',placement:featured?'People':'Library only',faceGroup:id,src:'assets/images/ambassadors/'+id+'.webp',thumb:'assets/images/ambassadors/thumbs/'+id+'.webp',version:1,versions:[{version:1,src:'assets/images/ambassadors/'+id+'.webp',at:'Bundled V26'}],order:i+1};}
const defaults={
 schemaVersion:SCHEMA,
 products:[
  {sku:'TENDER',name:'Fresh Tender Coconut',retail:55,bulk:45,moq:10,priceVisible:true,state:'Active'},
  {sku:'GREEN',name:'Green Round Coconut',retail:55,bulk:48,moq:10,priceVisible:true,state:'Active'},
  {sku:'BULK',name:'Bulk Tender Coconut',retail:0,bulk:45,moq:50,priceVisible:true,state:'Quote'}
 ],
 inventory:[
  {sku:'TENDER',name:'Fresh Tender Coconut',node:'Jabalpur fulfilment',onHand:420,reserved:36,incoming:180,low:80,freshness:'Fresh intake',supplier:'Farmer / supplier network'},
  {sku:'GREEN',name:'Green Round Coconut',node:'MMR partner node',onHand:220,reserved:20,incoming:100,low:60,freshness:'Fresh intake',supplier:'Farmer / supplier network'},
  {sku:'BULK',name:'Bulk Tender Coconut',node:'Jabalpur fulfilment',onHand:160,reserved:40,incoming:300,low:100,freshness:'Commercial batch',supplier:'Farmer / supplier network'}
 ],
 warehouses:[
  {id:'NODE-JBP',name:'Jabalpur fulfilment',ownership:'Partner-operated',city:'Jabalpur, Madhya Pradesh',address:'Jabalpur, Madhya Pradesh',active:true},
  {id:'NODE-MMR',name:'MMR partner node',ownership:'Partner-operated',city:'Virar / Mumbai Metropolitan Region',address:'Virar, Maharashtra',active:true}
 ],
 deliveryServices:[
  {id:'DS-LOCAL',name:'Local partner delivery',type:'Local',coverage:'Jabalpur serviceable zones',sla:'Same / next day by confirmation',pricing:'Confirm by order/location',active:true},
  {id:'DS-MMR',name:'MMR partner delivery',type:'Regional',coverage:'Selected Mumbai MMR zones',sla:'By confirmed slot',pricing:'Confirm by order/location',active:true}
 ],
 orders:[
  {id:'NS-1048',customer:'Aarav Mehta',product:'Tender Coconut',qty:12,payment:'Awaiting',delivery:'Preparing',total:660},
  {id:'NS-1047',customer:'Riya Shah',product:'Tender Coconut',qty:18,payment:'Paid',delivery:'Confirmed',total:990},
  {id:'NS-1046',customer:'Guest · Jabalpur',product:'Green Round',qty:10,payment:'COD',delivery:'Out for delivery',total:550},
  {id:'NS-1042',customer:'Aarav Mehta',product:'Tender Coconut',qty:20,payment:'COD',delivery:'Out for delivery',total:900}
 ],
 deliveryLive:{orderId:'NS-1042',status:'out_for_delivery',eta:'Today · 4–6 PM',partnerName:'Example Partner',partnerMobile:'+91 98••• 1122',vehicle:'MP20-NS-42',locationLabel:'Near Civil Lines, Jabalpur',lat:23.1815,lng:79.9864,customerUpdate:'Fresh coconuts are on the way.',internalNote:'Private operations note — never public.',otp:'4821'},
 customer:{id:'C-001',name:'Aarav Mehta',email:'aarav@example.com',mobile:'+91 98••• 4821',location:'Jabalpur, MP',owner:'Krishna',followup:'2026-09-08T11:30',note:'Prefers afternoon delivery. Interested in recurring office order.',photoBlobKey:null},
 segments:[
  {id:'SEG-REPEAT',name:'Repeat customers',rule:'2+ completed orders',count:38,action:'Reorder / recurring follow-up'},
  {id:'SEG-HOSP',name:'Hospitality prospects',rule:'Event / café / hotel enquiry',count:16,action:'Commercial quote follow-up'},
  {id:'SEG-DUE',name:'Follow-up due',rule:'Next action within 48h',count:7,action:'Owner queue'}
 ],
 communications:[
  {id:'COM-1',channel:'WhatsApp',audience:'Aarav Mehta',subject:'Delivery update',state:'Draft'},
  {id:'COM-2',channel:'Email',audience:'Blue Mango Café',subject:'Hospitality quote follow-up',state:'Draft'}
 ],
 media:[
  {id:'M-ORIGIN-01',name:'Coastal coconut grove',cat:'Sourcing',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Homepage',faceGroup:null,src:'assets/images/review/coastal-grove.png',thumb:'assets/images/review/coastal-grove.png',version:1,versions:[{version:1,src:'assets/images/review/coastal-grove.png',at:'V20 review'}]},
  {id:'M-ORIGIN-02',name:'Backwater coconut grove',cat:'Sourcing',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Sourcing',faceGroup:null,src:'assets/images/review/backwater-grove.png',thumb:'assets/images/review/backwater-grove.png',version:1,versions:[{version:1,src:'assets/images/review/backwater-grove.png',at:'V20 review'}]},
  {id:'M-COCONUT-01',name:'Protected coconut hero',cat:'Product',status:'Approved',visible:true,publicAllowed:true,storyAllowed:true,homepageAllowed:true,brandFit:'Strong',placement:'Product',faceGroup:null,src:'https://nariyal-sutra.netlify.app/assets/images/story-coconut-hero.png',thumb:'https://nariyal-sutra.netlify.app/assets/images/story-coconut-hero.png',version:1,versions:[{version:1,src:'https://nariyal-sutra.netlify.app/assets/images/story-coconut-hero.png',at:'Protected V42'}]},
  ...PEOPLE_MEDIA_IDS.map(faceMedia),
  {id:'U001',name:'Uploaded people reference U001',cat:'People',status:'Needs review',visible:false,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Review',placement:'Library only',faceGroup:'U001',src:'assets/images/people-uploads/U001.jpeg',thumb:'assets/images/people-uploads/U001.jpeg',version:1,versions:[{version:1,src:'assets/images/people-uploads/U001.jpeg',at:'Bundled V26'}]},
  {id:'U002',name:'Uploaded people reference U002',cat:'People',status:'Needs review',visible:false,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Review',placement:'Library only',faceGroup:'U002',src:'assets/images/people-uploads/U002.png',thumb:'assets/images/people-uploads/U002.png',version:1,versions:[{version:1,src:'assets/images/people-uploads/U002.png',at:'Bundled V26'}]}
 ],
 faceMarquee:{enabled:true,homepage:true,peoplePage:false,title:'People in motion · Nariyal Sutra stories',subtitle:'A continuous full-picture gallery of approved customer, collaborator and community photographs. Admin controls the images, order, speed, direction, surfaces and placement.',rows:2,speed:42,direction:'alternate',selectedIds:FEATURED_FACE_IDS.slice(),pauseOnHover:false,placement:'after-uses',background:'#061004',background2:'#020801',accent:'#d4a843',edgeFade:true,cardStyle:'full-frame'},
 peopleStreams:{
  ambassadors:{enabled:true,title:'Brand Ambassadors',subtitle:'Curated ambassadors who have been explicitly approved for this public role. The label never implies employment.',speed:48,direction:'ltr',selectedIds:[],placement:'people-page'},
  promoters:{enabled:true,title:'Brand Promoters & Community Voices',subtitle:'Approved promoters, collaborators and community voices presented as full-picture stories, not cropped face badges.',speed:54,direction:'rtl',selectedIds:[],placement:'people-page'},
  community:{enabled:true,title:'Community Spotlight',subtitle:'Customer-submitted coconut moments appear here only after consent, review and Admin approval.',speed:50,direction:'ltr',selectedIds:[],placement:'people-page'}
 },
 harvest:{countEnabled:true,countTarget:100,countLabel:'coconuts moving through the harvest',rainEnabled:true,rainDensity:'adaptive'},
 sections:[
  {id:'hero',title:'Product hero',page:'homepage',visible:true,order:1,protected:false,motion:'Existing live hero'},
  {id:'ticker',title:'Freshness / service strip',page:'homepage',visible:true,order:2,protected:false,motion:'Information strip'},
  {id:'collection',title:'Product collection',page:'homepage',visible:true,order:3,protected:false,motion:'Product cards'},
  {id:'cinematic',title:'Source-to-cut cinematic journey',page:'homepage',visible:true,order:4,protected:false,motion:'Atomic cinematic · Sourcing + Fresh Cut chapters'},
  {id:'brand-moment',title:'Brand moment',page:'homepage',visible:true,order:5,protected:false,motion:'Editorial'},
  {id:'harvest',title:'Harvest film',page:'homepage',visible:true,order:6,protected:false,motion:'Adaptive coconut motion'},
  {id:'live-motion',title:'Freshness motion',page:'homepage',visible:true,order:7,protected:false,motion:'Video / fallback'},
  {id:'benefits',title:'Product benefits',page:'homepage',visible:true,order:8,protected:false,motion:'Proof strip'},
  {id:'quality',title:'Product quality / freshness',page:'homepage',visible:true,order:9,protected:false,motion:'Editorial facts'},
  {id:'pricing',title:'Pricing',page:'homepage',visible:true,order:10,protected:false,motion:'None'},
  {id:'our-story',title:'Why us / story',page:'homepage',visible:true,order:11,protected:false,motion:'Editorial'},
  {id:'how-to-order',title:'How to order',page:'homepage',visible:true,order:12,protected:false,motion:'Steps'},
  {id:'uses',title:'Coconut uses',page:'homepage',visible:true,order:13,protected:false,motion:'Cards'},
  {id:'people-teaser',title:'People teaser',page:'homepage',visible:true,order:14,protected:false,motion:'Editorial'},
  {id:'people-marquee',title:'Moving People full-picture rail',page:'homepage',visible:true,order:15,protected:false,motion:'Continuous marquee'},
  {id:'faq',title:'Quick Answers',page:'homepage',visible:true,order:16,protected:false,motion:'Accordion'},
  {id:'order',title:'Order flow',page:'homepage',visible:true,order:17,protected:false,motion:'Form + map'},
  {id:'contact',title:'Enquire / contact',page:'homepage',visible:true,order:18,protected:false,motion:'Commercial desk'}
 ],
 customSections:[
  {id:'CS-PEOPLE',page:'homepage',title:'Moving People full-picture rail',subtitle:'A living editorial rail controlled from Admin.',template:'Portrait rail',visible:true,mediaIds:FEATURED_FACE_IDS.slice(0,18),motion:'Marquee',schedule:''}
 ],
 stories:[
  {id:'ST-PEOPLE',surface:'people',title:'People & community',subtitle:'Faces, moments and collaborators around the product',visible:true,order:1,layout:'portrait-rail',mediaIds:FEATURED_FACE_IDS.slice(0,12)},
  {id:'ST-HOSP',surface:'people',title:'Hospitality moments',subtitle:'Serving, gatherings and product-connected stories',visible:true,order:2,layout:'editorial-grid',mediaIds:FEATURED_FACE_IDS.slice(12,20)}
 ],
 content:[
  {id:'CT-1',title:'People moving rail',state:'APPROVED',owner:'Content',page:'Homepage'},
  {id:'CT-2',title:'Hospitality story refresh',state:'IN_REVIEW',owner:'Content',page:'Hospitality'},
  {id:'CT-3',title:'Coastal sourcing scene',state:'LIVE',owner:'Owner',page:'Homepage'}
 ],
 schedule:[
  {id:'SCH-1',title:'Origin scene rotation',state:'Scheduled',page:'homepage',sectionId:'homepage-origin',mediaId:'M-ORIGIN-02',startAt:'2026-09-10T09:00',endAt:'2026-09-10T18:00',restoreDefault:true,notes:'When this window ends, the section automatically returns to its baseline image.'}
 ],
 communitySubmissions:[],
 notificationQueue:[],
 staffPhotos:{},
 teamMembers:[
  {id:'TM-OWNER',name:'Krishna Tiwari',email:'krishna@nariyalsutra.local',role:'Owner',status:'Active',inviteStatus:'Active'},
  {id:'TM-OPS',name:'Amit Sharma',email:'amit@nariyalsutra.local',role:'Operations',status:'Active',inviteStatus:'Active'},
  {id:'TM-CONTENT',name:'Riya Mehta',email:'riya@nariyalsutra.local',role:'Content',status:'Active',inviteStatus:'Active'},
  {id:'TM-SUPPORT',name:'Neha Verma',email:'neha@nariyalsutra.local',role:'Support',status:'Active',inviteStatus:'Active'},
  {id:'TM-SALES',name:'Arjun Rao',email:'arjun@nariyalsutra.local',role:'Sales',status:'Active',inviteStatus:'Active'}
 ],
 tasks:[
  {id:'TASK-1',title:'Review homepage people rail',owner:'Riya Mehta',due:'2026-09-09',state:'Open'},
  {id:'TASK-2',title:'Confirm Jabalpur delivery pin',owner:'Amit Sharma',due:'2026-09-08',state:'Open'}
 ],
 settings:{duplicateGuard:true,maxPublicFaceAppearances:1,defaultMediaFilter:'Approved',publicPeopleInternalLabels:false,allowReviewCropPublic:false,telegramEnabled:true,communitySubmissionsEnabled:true},
 audit:[{at:now(),action:'V27 professional polish + smart upload assist initialized',actor:'System'}]
};
function merge(base,old){if(!old||typeof old!=='object')return clone(base);const out=clone(base);for(const k of Object.keys(old)){if(k==='schemaVersion')continue;if(Array.isArray(old[k]))out[k]=old[k];else if(old[k]&&typeof old[k]==='object'&&!Array.isArray(old[k]))out[k]=Object.assign({},out[k]||{},old[k]);else out[k]=old[k];}out.schemaVersion=SCHEMA;return out;}
function reconcilePeople(s){
 s.media=s.media||[];const by=new Map(s.media.map(m=>[m.id,m]));
 PEOPLE_MEDIA_IDS.forEach((id,i)=>{const fresh=faceMedia(id,i),m=by.get(id);if(m){m.src=fresh.src;m.thumb=fresh.thumb;m.cat='People';m.faceGroup=id;if(m.status==='Approved'&&!FEATURED_FACE_IDS.includes(id)&&!m._adminReviewed){m.status='Needs review';m.visible=false;m.placement='Library only';} }else{s.media.push(fresh);}});
 const extras=[{id:'U001',src:'assets/images/people-uploads/U001.jpeg'},{id:'U002',src:'assets/images/people-uploads/U002.png'}];extras.forEach(x=>{if(!s.media.find(m=>m.id===x.id))s.media.push({id:x.id,name:'Uploaded people reference '+x.id,cat:'People',status:'Needs review',visible:false,publicAllowed:true,storyAllowed:true,homepageAllowed:false,brandFit:'Review',placement:'Library only',faceGroup:x.id,src:x.src,thumb:x.src,version:1,versions:[{version:1,src:x.src,at:'Bundled V26'}]});});
 s.faceMarquee=s.faceMarquee||clone(defaults.faceMarquee);const allowed=new Set(PEOPLE_MEDIA_IDS.concat((s.media||[]).filter(m=>String(m.id||'').startsWith('UGC-')).map(m=>m.id)));s.faceMarquee.selectedIds=(s.faceMarquee.selectedIds||[]).map(id=>alias[id]||id).filter((id,i,a)=>allowed.has(id)&&a.indexOf(id)===i);if(!s.faceMarquee.selectedIds.length)s.faceMarquee.selectedIds=FEATURED_FACE_IDS.slice();s.faceMarquee.pauseOnHover=s.faceMarquee.pauseOnHover===true;
 return s;
}
function normalizeState(s){
 const arrayKeys=['products','inventory','warehouses','deliveryServices','orders','segments','communications','media','sections','customSections','stories','content','schedule','communitySubmissions','notificationQueue','teamMembers','tasks','audit'];
 arrayKeys.forEach(k=>{if(!Array.isArray(s[k]))s[k]=clone(defaults[k]||[]);});
 const objectKeys=['deliveryLive','customer','faceMarquee','peopleStreams','harvest','staffPhotos','settings'];
 objectKeys.forEach(k=>{if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k]))s[k]=clone(defaults[k]||{});});
 if(!Array.isArray(s.faceMarquee.selectedIds))s.faceMarquee.selectedIds=clone(defaults.faceMarquee.selectedIds||[]);
 return s;
}
function load(){try{let raw=localStorage.getItem(KEY);if(!raw){for(const k of LEGACY_KEYS){const legacy=localStorage.getItem(k);if(legacy){raw=legacy;break;}}}if(!raw)return reconcilePeople(normalizeState(clone(defaults)));return reconcilePeople(normalizeState(merge(defaults,JSON.parse(raw))));}catch(e){return reconcilePeople(normalizeState(clone(defaults)));}}
function save(s){s.schemaVersion=SCHEMA;try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}window.dispatchEvent(new CustomEvent('nsv421:change',{detail:s}));return s;}
function reset(){try{localStorage.removeItem(KEY);}catch(e){}const s=load();window.dispatchEvent(new CustomEvent('nsv421:change',{detail:s}));return s;}
function audit(s,action,target){s.audit=s.audit||[];s.audit.unshift({at:now(),action,target:target||'',actor:(getSession()||{}).name||'Local preview'});s.audit=s.audit.slice(0,200);return s;}
function mediaById(s,id){id=alias[id]||id;return (s.media||[]).find(x=>x.id===id)||null;}
function eligibleForPublic(s,m){return !!(m&&m.visible&&m.publicAllowed!==false&&m.status==='Approved'&&m.brandFit!=='Weak');}
function setSession(x){try{sessionStorage.setItem('ns_v10_admin_session',JSON.stringify(x||{}));}catch(e){}}
function getSession(){try{return JSON.parse(sessionStorage.getItem('ns_v10_admin_session')||'null');}catch(e){return null;}}
function publicFaces(s){const cfg=s.faceMarquee||{},seen=new Set();return (cfg.selectedIds||[]).map(id=>mediaById(s,id)).filter(m=>{if(!eligibleForPublic(s,m)||seen.has(m.id))return false;seen.add(m.id);return true;});}
window.NSV421Store={KEY,SCHEMA,FACE_IDS,PEOPLE_MEDIA_IDS,FEATURED_FACE_IDS,defaults,load,save,reset,audit,mediaById,eligibleForPublic,setSession,getSession,publicFaces,resolveAlias:id=>alias[id]||id};
})();
