(function(){
'use strict';

/* V42.1 stabilization bootstrap: every page that already loads V30 also gets the
   stable-asset recovery layer. This keeps legacy deploy-specific media/script
   references from becoming customer-visible failures while source cleanup is
   completed page by page. */
if(!window.__NS_V421_STABLE_ASSETS__ && !document.querySelector('script[data-ns-stable-assets]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-stable-assets.js';
  s.defer=true;
  s.dataset.nsStableAssets='1';
  document.head.appendChild(s);
}

function file(){let f=(location.pathname.split('/').pop()||'index.html').toLowerCase();return f||'index.html'}

/* Base recovery removes known broken legacy composites and normalizes trade media. */
if(!window.__NS_V421_VISUAL_RECOVERY__ && !document.querySelector('script[data-ns-visual-recovery]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-visual-recovery.js';
  s.defer=true;
  s.dataset.nsVisualRecovery='1';
  document.head.appendChild(s);
}

/* Final accepted homepage cinematic: 100-coconut rain -> one selected coconut ->
   knife/open -> visible water/splash. Loaded after base recovery so it owns the
   visible harvest stage and cannot be overwritten by the earlier recovery layer. */
if(file()==='index.html' && !window.__NS_V421_CINEMATIC_FINAL__ && !document.querySelector('script[data-ns-cinematic-final]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-cinematic-final.js';
  s.defer=true;
  s.dataset.nsCinematicFinal='1';
  document.body.appendChild(s);
}

/* Keep the cinematic compact for customers. The full story still plays, but the
   section does not force an excessively long scroll before the next content. */
if(file()==='index.html' && !window.__NS_V421_CINEMATIC_COMPACT__ && !document.querySelector('script[data-ns-cinematic-compact]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-cinematic-compact.js';
  s.defer=true;
  s.dataset.nsCinematicCompact='1';
  document.body.appendChild(s);
}

/* Professional first-party acquisition attribution belongs only to the checkout
   storefront. It is deliberately loaded here rather than hard-coded into the
   large homepage so the capture layer remains isolated, testable and removable. */
if(file()==='index.html' && !window.NSAttribution && !document.querySelector('script[data-ns-attribution]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-attribution.js';
  s.defer=true;
  s.dataset.nsAttribution='1';
  document.head.appendChild(s);
}

/* Customer account presentation is kept separate from customer-account.js so
   Firebase/auth/order behavior remains untouched while the premium drawer UI
   can evolve and be regression-tested independently. */
if(file()==='index.html' && !window.__NS_V421_ACCOUNT_UI__ && !document.querySelector('script[data-ns-account-ui]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-account-ui.js';
  s.defer=true;
  s.dataset.nsAccountUi='1';
  document.head.appendChild(s);
}

/* Explicit localhost-only My Account visual preview for automated/manual QA.
   This never runs on production and never writes to Firebase. */
if(file()==='index.html' && /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname) && new URLSearchParams(location.search).get('accountPreview')==='1' && !document.querySelector('script[data-ns-account-preview-stabilizer]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-account-preview-stabilizer.js';
  s.defer=true;
  s.dataset.nsAccountPreviewStabilizer='1';
  document.head.appendChild(s);
}

const Store=window.NSV421Store;
function eligible(){const main=document.querySelector('main');let a=main?[...main.children].filter(x=>x.tagName==='SECTION'):[];if(!a.length)a=[...document.body.children].filter(x=>x.tagName==='SECTION'&&!x.matches('#jungle-intro'));return a;}
function apply(){if(!Store)return;const f=file();if(f==='index.html')return;const secs=eligible();if(secs.length<2)return;secs.forEach((s,i)=>{if(!s.dataset.v30SeqKey)s.dataset.v30SeqKey='s'+String(i+1).padStart(2,'0')});const state=Store.load(),cfg=state.pageSequences&&state.pageSequences[f];if(!cfg)return;const by=new Map(secs.map(x=>[x.dataset.v30SeqKey,x]));const ordered=(cfg.order||[]).map(k=>by.get(k)).filter(Boolean);secs.forEach(x=>{if(!ordered.includes(x))ordered.push(x)});const parent=secs[0].parentNode,anchor=secs[secs.length-1].nextSibling;ordered.forEach(x=>parent.insertBefore(x,anchor));ordered.forEach(x=>{const k=x.dataset.v30SeqKey,hide=cfg.hidden&&cfg.hidden[k]===true;x.hidden=hide;x.dataset.v30SectionHidden=hide?'true':'false'});}
function init(){apply();window.addEventListener('nsv421:change',()=>setTimeout(apply,20));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
