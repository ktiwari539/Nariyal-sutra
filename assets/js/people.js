(function(){
'use strict';
function init(){
  const Store=window.NSV421Store;
  const MediaDB=window.NSV421MediaDB;
  const legacy=window.NSStore;
  const s=Store?Store.load():(legacy?legacy.load():{media:[]});
  const eligible=Store?((s.media||[]).filter(m=>Store.eligibleForPublic(s,m))):((s.media||[]).filter(m=>m.status==='Approved'&&m.visible));
  const people=eligible.filter(m=>m.cat==='People'&&m.placement!=='Library only');
  const byAnyId=id=>eligible.find(m=>m.id===id);
  const largeReady=m=>MediaDB?.largeSurfaceReady?MediaDB.largeSurfaceReady(m):!!(m&&m.largeSurfaceAllowed!==false&&m.qualityTier!=='card-only');
  const editorialPeople=people.filter(largeReady);
  const byEditorialId=id=>editorialPeople.find(m=>m.id===id);
  /* Campaign Ambassador portraits are intentionally card-only. The shared media policy
     keeps them in the dedicated Ambassador rail and out of large editorial surfaces. */
  const storyPreference=['G078','G077','G052','G046','G075','G073','G034','G001','G002','G031','G023','G040'];
  const orderedStories=[...storyPreference.map(byEditorialId).filter(Boolean),...editorialPeople.filter(m=>!storyPreference.includes(m.id))];
  document.querySelectorAll('[data-story-img]').forEach((el,i)=>{
    const m=orderedStories[i];
    if(!m){const card=el.closest('.story-card');if(card)card.hidden=true;return;}
    el.src=m.src||m.thumb||'assets/images/upload-placeholder.svg';
    if(m.localBlobKey)el.setAttribute('data-local-blob-key',m.localBlobKey);else el.removeAttribute('data-local-blob-key');
    el.addEventListener('load',()=>{const portrait=el.naturalHeight>el.naturalWidth*1.08;el.classList.toggle('v28-portrait-media',portrait);},{once:true});
    el.onerror=()=>{const card=el.closest('.story-card');if(card)card.hidden=true;};
  });
  const hero=document.getElementById('peopleHeroImg');
  if(hero){
    const selectedId=s.sectionMedia&&s.sectionMedia['people-hero'];
    const selected=selectedId?byAnyId(selectedId):null;
    const selectedAllowed=selected&&(!Store||Store.eligibleForPublic(s,selected))&&largeReady(selected);
    const src=selectedAllowed?(selected.src||selected.thumb):'assets/images/review/coastal-grove.png';
    hero.src=src;
    if(selectedAllowed&&selected.localBlobKey)hero.setAttribute('data-local-blob-key',selected.localBlobKey);else hero.removeAttribute('data-local-blob-key');
    hero.onerror=()=>{hero.onerror=null;hero.src='assets/images/review/coastal-grove.png';hero.removeAttribute('data-local-blob-key');};
  }
  if(MediaDB&&MediaDB.hydrate)MediaDB.hydrate(document);
}
window.addEventListener('nsv421:change',init);
window.addEventListener('nsv421:production-ready',init);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();