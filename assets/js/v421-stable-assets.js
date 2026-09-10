(function(){
'use strict';
if(window.__NS_V421_STABLE_ASSETS__)return;
window.__NS_V421_STABLE_ASSETS__=true;

const DEPLOY_HOST=/^[0-9a-f]{12,}--nariyal-sutra\.netlify\.app$/i;
const SAFE_IMAGE='/assets/images/nariyal-coconut-grove.webp';
const knownRuntime={
  '/assets/js/story-pages.js':'NS_STORY_PAGES_READY',
  '/assets/js/v35-worlds.js':'NS_V35_WORLDS_READY',
  '/assets/js/v421-catalog.js':'NS_V421_CATALOG_READY'
};

function parse(raw){try{return new URL(raw,location.href)}catch(_){return null}}
function isLegacy(raw){const u=parse(raw);return !!u&&DEPLOY_HOST.test(u.hostname)}
function localPath(raw){const u=parse(raw);return u?u.pathname+(u.search||''):raw}
function stableAbsolute(raw){const u=parse(raw);return u?location.origin+u.pathname+(u.search||''):raw}

function guardImage(img){
  if(!img||img.dataset.nsStableGuard==='1')return;
  img.dataset.nsStableGuard='1';
  let stage=0;
  const original=img.getAttribute('src')||'';
  if(isLegacy(original)){
    stage=1;
    img.src=localPath(original);
  }
  img.addEventListener('error',()=>{
    const current=img.getAttribute('src')||'';
    if(stage===0&&isLegacy(current)){
      stage=1;img.src=localPath(current);return;
    }
    if(stage<=1&&current!==SAFE_IMAGE){stage=2;img.src=SAFE_IMAGE;return;}
    img.classList.add('ns-media-failed');
  });
}

function guardVideo(video){
  if(!video||video.dataset.nsStableGuard==='1')return;
  video.dataset.nsStableGuard='1';
  const poster=video.getAttribute('poster');
  if(poster&&isLegacy(poster))video.setAttribute('poster',localPath(poster));
  video.querySelectorAll('source').forEach(source=>{
    const src=source.getAttribute('src')||'';
    if(isLegacy(src))source.setAttribute('src',localPath(src));
  });
  const src=video.getAttribute('src')||'';
  if(isLegacy(src))video.setAttribute('src',localPath(src));
  video.addEventListener('error',()=>{
    video.classList.add('ns-video-failed');
    video.hidden=true;
    const host=video.closest('.sp-video,.water-window,.msr-card,.film-frame');
    if(host)host.classList.add('ns-video-fallback-active');
  });
}

function guardMeta(){
  document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>{
    const value=meta.getAttribute('content')||'';
    if(isLegacy(value))meta.setAttribute('content',stableAbsolute(value));
  });
  document.querySelectorAll('link[rel="preload"][as="image"]').forEach(link=>{
    const href=link.getAttribute('href')||'';
    if(isLegacy(href))link.setAttribute('href',localPath(href));
  });
}

function guardInlineStyle(el){
  const style=el.getAttribute?.('style');
  if(!style||!style.includes('--nariyal-sutra.netlify.app'))return;
  el.setAttribute('style',style.replace(/https:\/\/[0-9a-f]{12,}--nariyal-sutra\.netlify\.app/ig,''));
}

function guard(root=document){
  root.querySelectorAll?.('img').forEach(guardImage);
  root.querySelectorAll?.('video').forEach(guardVideo);
  root.querySelectorAll?.('[style*="--nariyal-sutra.netlify.app"]').forEach(guardInlineStyle);
  guardMeta();
}

function recoverRuntimeScripts(){
  const legacy=[...document.scripts].filter(s=>isLegacy(s.src));
  for(const old of legacy){
    const u=parse(old.src);if(!u)continue;
    const marker=knownRuntime[u.pathname];
    if(!marker||window[marker])continue;
    if(document.querySelector(`script[data-ns-recovered="${u.pathname}"]`))continue;
    const replacement=document.createElement('script');
    replacement.src=u.pathname;
    replacement.defer=true;
    replacement.dataset.nsRecovered=u.pathname;
    replacement.addEventListener('error',()=>console.error('[NS V42.1] local runtime recovery failed',u.pathname));
    document.body.appendChild(replacement);
  }
}

guard();
const observer=new MutationObserver(records=>{
  for(const r of records){
    for(const node of r.addedNodes){
      if(node.nodeType!==1)continue;
      if(node.matches?.('img'))guardImage(node);
      if(node.matches?.('video'))guardVideo(node);
      guard(node);
    }
  }
});
observer.observe(document.documentElement,{childList:true,subtree:true});

setTimeout(recoverRuntimeScripts,50);
setTimeout(recoverRuntimeScripts,700);

window.NS_V421_ASSET_STATUS={
  active:true,
  legacyHostPattern:String(DEPLOY_HOST),
  safeImage:SAFE_IMAGE
};
})();
