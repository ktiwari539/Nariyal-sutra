(function(){
'use strict';
if(window.__NS_V421_ADMIN_V43_MEDIA_GUIDANCE__)return;
window.__NS_V421_ADMIN_V43_MEDIA_GUIDANCE__=true;
const $=(s,r=document)=>r.querySelector(s);
function goMedia(openUpload){
  const nav=$('#apNav button[data-view="media"]');
  if(!nav)return;
  nav.click();
  setTimeout(()=>{installMediaNotice();if(openUpload)$('#apUploadMedia')?.click();},120);
}
function installPeopleHelp(){
  const host=$('#apV42PeopleStreams');if(!host||$('#apV43PeopleHelp',host))return;
  const box=document.createElement('div');box.id='apV43PeopleHelp';box.style.cssText='margin:12px 0;padding:14px 16px;border:1px solid rgba(212,168,67,.28);background:rgba(212,168,67,.07);border-radius:10px;font-size:11px;line-height:1.65;color:inherit';
  box.innerHTML='<strong style="display:block;margin-bottom:5px">How to add more Ambassador / People photos</strong><span>1. Upload the original photo in <b>Media Library</b>. 2. Set Category to <b>People</b>, Status to <b>Approved</b>, and keep it Visible. 3. Return here, choose the photo under “Add approved People image”, set its order/device visibility, then Save. The three campaign portraits are starter items, not a limit.</span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="ap-btn primary" data-v43-upload-people>＋ Upload new People photo</button><button type="button" class="ap-btn" data-v43-open-media>Open Media Library</button></div>';
  const head=host.querySelector('.ap-panel-head');(head?.nextSibling?host.insertBefore(box,head.nextSibling):host.prepend(box));
}
function installMediaNotice(){
  const view=$('.ap-view[data-view="media"]');if(!view||$('#apV43MediaNotice',view))return;
  const head=view.querySelector('.ap-page-head');if(!head)return;
  const box=document.createElement('div');box.id='apV43MediaNotice';box.style.cssText='margin:0 0 16px;padding:14px 16px;border:1px solid rgba(212,168,67,.28);background:rgba(212,168,67,.06);border-radius:10px;font-size:11px;line-height:1.65';
  box.innerHTML='<strong style="display:block;margin-bottom:5px">Media quality and People publishing</strong><span>The existing WS/Cinematic cards are legacy/reference library assets; several are intentionally blocked from large public surfaces because their resolution is too small. For a new Ambassador, Promoter, story or homepage image, use <b>＋ Upload + place media</b> with the highest-resolution original available (preferably 1200px+ on the long edge). New People photos do not appear publicly until they are Approved + Visible and explicitly added to a People rail.</span>';
  head.insertAdjacentElement('afterend',box);
}
function refresh(){installPeopleHelp();installMediaNotice();}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-v43-upload-people]')){e.preventDefault();goMedia(true);}else if(e.target.closest?.('[data-v43-open-media]')){e.preventDefault();goMedia(false);}else if(e.target.closest?.('#apNav button[data-view="ambassadors"],#apNav button[data-view="media"]'))setTimeout(refresh,100);},true);
window.addEventListener('nsv421:change',()=>setTimeout(refresh,80));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{refresh();new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});},{once:true}):(()=>{refresh();new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});})();
})();
