(function(){
'use strict';
function init(){
  const Store=window.NSV421Store;
  const MediaDB=window.NSV421MediaDB;
  const legacy=window.NSStore;
  const s=Store?Store.load():(legacy?legacy.load():{media:[]});
  const eligible=Store?((s.media||[]).filter(m=>Store.eligibleForPublic(s,m))):((s.media||[]).filter(m=>m.status==='Approved'&&m.visible));
  const people=eligible.filter(m=>m.cat==='People'&&m.placement!=='Library only');
  const byId=id=>people.find(m=>m.id===id);
  const storyPreference=['G078','G077','G052','G046','G075','G073','G034','G001','G002'];
  const orderedStories=[...storyPreference.map(byId).filter(Boolean),...people.filter(m=>!storyPreference.includes(m.id))];
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
    const heroIds=['G078','G077','G052','G046','G075','G073','G034'];
    const m=heroIds.map(byId).find(Boolean)||people[0];
    hero.src=(m&&(m.src||m.thumb))||'assets/images/review/backwater-grove.png';
    if(m&&m.localBlobKey)hero.setAttribute('data-local-blob-key',m.localBlobKey);else hero.removeAttribute('data-local-blob-key');
    hero.onerror=()=>{hero.onerror=null;hero.src='assets/images/review/backwater-grove.png';hero.removeAttribute('data-local-blob-key');};
  }
  if(MediaDB&&MediaDB.hydrate)MediaDB.hydrate(document);
}
window.addEventListener('nsv421:change',init);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
