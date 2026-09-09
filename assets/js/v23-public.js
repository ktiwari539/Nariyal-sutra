(function(){
'use strict';
const Store=window.NSV421Store, MediaDB=window.NSV421MediaDB;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function mediaURL(s,id){const m=Store&&Store.mediaById(s,id);if(!m)return '';if(m.localBlobKey&&MediaDB&&MediaDB.get){try{const b=await MediaDB.get(m.localBlobKey);if(b)return URL.createObjectURL(b);}catch(e){}}return m.src||m.thumb||'';}

function realisticIntro(){
 const intro=$('#jungle-intro'); if(!intro) return;
 const shots=$$('.ji-cinema-shot',intro);
 const srcs=['assets/images/review/coastal-grove.png','assets/images/review/backwater-grove.png','assets/images/nariyal-coconut-grove.webp'];
 shots.forEach((img,i)=>{img.src=srcs[i%srcs.length];img.removeAttribute('height');img.removeAttribute('width');});
 const status=$('.ji-film-status span',intro); if(status)status.textContent='COAST · BACKWATER · GROVE';
}

function ringStory(){
 const film=$('#v20-story-film'), ring=$('.v22-focus-ring',film||document); if(!film||!ring)return;
 let raf=0;
 function update(){raf=0;const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight),p=Math.max(0,Math.min(1,-r.top/range));ring.classList.remove('v23-ring-orbit','v23-ring-cut','v23-ring-water');ring.classList.add(p<.48?'v23-ring-orbit':p<.67?'v23-ring-cut':'v23-ring-water');const label=ring.querySelector('span');if(label)label.textContent=p<.48?'ONE · SELECTED AT HARVEST':p<.67?'CUT · PREPARE':'POUR · FRESH WATER';}
 function req(){if(!raf)raf=requestAnimationFrame(update);} addEventListener('scroll',req,{passive:true});addEventListener('resize',req,{passive:true});update();
}

function scheduleTargets(){
 const path=(location.pathname||'').split('/').pop().toLowerCase();
 const home=!path||path==='index.html';
 return {
  'homepage-hero':home?'.hero-visual .hero-scene-1':null,
  'homepage-origin':home?'#v20-story-film .v20-bg-grove':null,
  'homepage-fresh-cut':home?'#v20-story-film .v20-bg-cut':null,
  'people-hero':path==='people-of-nariyal-sutra.html'?'#peopleHeroImg':null,
  'fresh-tender-hero':path==='fresh-tender-coconut.html'?'.w-hero-media img':null,
  'green-hero':path==='green-coconut.html'?'.w-hero-media img':null,
  'bulk-hero':path==='bulk-coconut-supply.html'?'.w-hero-media img':null
 };
}
const scheduleDefaults=new WeakMap();
async function clearScheduleOverrides(){document.querySelectorAll('[data-schedule-active]').forEach(el=>{const d=scheduleDefaults.get(el);if(!d)return;if(d.kind==='src')el.setAttribute('src',d.value);else el.style.backgroundImage=d.value;el.removeAttribute('data-schedule-active');});document.querySelectorAll('.ns-face-card[data-scheduled-card]').forEach(x=>x.remove());}
async function applyScheduledContent(){
 if(!Store)return;await clearScheduleOverrides();const s=Store.load(),now=Date.now(),targets=scheduleTargets();
 for(const item of (s.schedule||[])){
  if(item.state!=='Scheduled'||!item.sectionId||!item.mediaId)continue;
  const start=item.startAt?new Date(item.startAt).getTime():0,end=item.endAt?new Date(item.endAt).getTime():Infinity;
  if(now<start||now>end)continue;const src=await mediaURL(s,item.mediaId);if(!src)continue;
  if(item.sectionId==='people-marquee'){
   document.querySelectorAll('.ns-face-row').forEach((row,ri)=>{const card=document.createElement('a');card.className='ns-face-card';card.dataset.scheduledCard=item.id;card.href='people-of-nariyal-sutra.html#people-moving';card.innerHTML=`<img src="${src}" alt="Scheduled community story" style="object-fit:contain"><span class="ns-face-missing-label">Scheduled</span>`;row.prepend(card);});continue;
  }
  const sel=targets[item.sectionId];if(!sel)continue;const el=$(sel);if(!el)continue;
  if(el.tagName==='IMG'||el.tagName==='VIDEO'){if(!scheduleDefaults.has(el))scheduleDefaults.set(el,{kind:'src',value:el.getAttribute('src')||''});el.setAttribute('src',src);}else{if(!scheduleDefaults.has(el))scheduleDefaults.set(el,{kind:'bg',value:el.style.backgroundImage||''});el.style.backgroundImage=`linear-gradient(90deg,rgba(1,8,1,.64),rgba(1,8,1,.2)),url("${src.replace(/"/g,'')}")`;}
  el.dataset.scheduleActive=item.id;
 }
}

function setupWaterPlayer(){
 const video=$('.water-window video'); if(!video)return; const win=video.closest('.water-window');
 video.removeAttribute('autoplay'); video.muted=true; video.playsInline=true;
 let btn=$('.v23-water-play',win);if(!btn){btn=document.createElement('button');btn.type='button';btn.className='v23-water-play';btn.setAttribute('aria-label','Play coconut motion');btn.innerHTML='<span>▶</span>';win.appendChild(btn);}
 let status=$('.v23-motion-status',win);if(!status){status=document.createElement('div');status.className='v23-motion-status';status.textContent='Motion study · ready';win.appendChild(status);}
 let fallback=$('.v23-water-fallback',win);if(!fallback){fallback=document.createElement('div');fallback.className='v23-water-fallback';fallback.innerHTML='<img class="is-active" src="https://nariyal-sutra.netlify.app/assets/images/story-coconut-hero.png" alt="Fresh tender coconut"><img src="https://nariyal-sutra.netlify.app/assets/images/story-coconut-body-cut.png" alt="Fresh coconut opening"><img src="https://images.pexels.com/photos/4395019/pexels-photo-4395019.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Fresh coconut water pour">';win.insertBefore(fallback,video);}
 let ft=null,fi=0;
 function startFallback(){fallback.classList.add('is-active');video.style.display='none';status.textContent='Motion preview · image sequence';btn.classList.add('is-playing');btn.querySelector('span').textContent='❚❚';clearInterval(ft);ft=setInterval(()=>{const imgs=$$('img',fallback);imgs.forEach((x,i)=>x.classList.toggle('is-active',i===fi%imgs.length));fi++;},1800);}
 function stopFallback(){clearInterval(ft);fallback.classList.remove('is-active');btn.classList.remove('is-playing');btn.querySelector('span').textContent='▶';status.textContent='Motion study · paused';}
 async function toggle(){
  if(fallback.classList.contains('is-active')){stopFallback();return;}
  if(!video.paused){video.pause();btn.classList.remove('is-playing');btn.querySelector('span').textContent='▶';status.textContent='Motion study · paused';return;}
  try{await video.play();btn.classList.add('is-playing');btn.querySelector('span').textContent='❚❚';status.textContent='Motion study · playing';}
  catch(e){startFallback();}
 }
 btn.onclick=toggle;video.addEventListener('ended',()=>{btn.classList.remove('is-playing');btn.querySelector('span').textContent='▶';status.textContent='Motion study · ready';});video.addEventListener('error',startFallback,{once:true});
}

async function submitCommunity(e){
 e.preventDefault();if(!Store)return false;const form=e.currentTarget,result=$('.v23-community-result',form),fd=new FormData(form),file=form.querySelector('input[type=file]')?.files?.[0];
 if(!fd.get('consent')){result.textContent='Please confirm publication consent before submitting.';return false;}if(!file){result.textContent='Please choose the photo you want us to review.';return false;}if(file.size>8*1024*1024){result.textContent='Please use an image up to 8 MB.';return false;}
 const s=Store.load(),id='SUB-'+Date.now(),blobKey='community-'+id;
 try{if(MediaDB&&MediaDB.put)await MediaDB.put(blobKey,file);}catch(err){result.textContent='Could not store this photo in local preview.';return false;}
 s.communitySubmissions=s.communitySubmissions||[];s.communitySubmissions.unshift({id,name:String(fd.get('name')||'').trim(),email:String(fd.get('email')||'').trim(),whatsapp:String(fd.get('whatsapp')||'').trim(),telegram:String(fd.get('telegram')||'').trim().replace(/^@/,''),story:String(fd.get('story')||'').trim(),requestedRole:String(fd.get('requestedRole')||'community'),consent:true,status:'IN_REVIEW',submittedAt:new Date().toISOString(),blobKey,fileName:file.name,publicMediaId:null,placement:null,notificationState:'Not sent'});
 Store.audit(s,'Community submission received',id);Store.save(s);form.reset();result.textContent='Thank you. Your photo is private and awaiting review. Nothing is public until the Nariyal Sutra team approves it.';return false;
}
function setupCommunityForm(){const f=$('#v23CommunityForm');if(f)f.addEventListener('submit',submitCommunity);}

function telegramCleanup(){
 // V25: Telegram is intentionally retained as a contact preference.
 // Outbound Telegram remains gated until the official bot/chat-ID link exists.
 const wrap=$('#eTelegramWrap');if(wrap)wrap.hidden=false;
}

function hideMissingPeople(){
 document.addEventListener('error',e=>{const img=e.target;if(!(img instanceof HTMLImageElement))return;const card=img.closest('.ns-face-card');if(card){card.remove();}},true);
}
function init(){realisticIntro();ringStory();applyScheduledContent();setInterval(applyScheduledContent,30000);setupWaterPlayer();setupCommunityForm();telegramCleanup();hideMissingPeople();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
