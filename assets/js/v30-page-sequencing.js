(function(){
'use strict';

/* V42.1 stabilization bootstrap: every page that already loads V30 also gets the
   stable-asset recovery layer. */
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

/* IMPORTANT: do not load v421-cinematic-final.js or v421-cinematic-compact.js here.
   The homepage now has one cinematic owner: v421-cinematic-professional.js, loaded
   by v29-public.js. Keeping the retired loaders active caused multiple runtimes to
   move/resize the same cinematic area and reset scroll progress during playback. */

/* Professional first-party acquisition attribution belongs only to the checkout storefront. */
if(file()==='index.html' && !window.NSAttribution && !document.querySelector('script[data-ns-attribution]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-attribution.js';
  s.defer=true;
  s.dataset.nsAttribution='1';
  document.head.appendChild(s);
}

/* Customer account presentation stays isolated from customer-account.js. */
if(file()==='index.html' && !window.__NS_V421_ACCOUNT_UI__ && !document.querySelector('script[data-ns-account-ui]')){
  const s=document.createElement('script');
  s.src='/assets/js/v421-account-ui.js';
  s.defer=true;
  s.dataset.nsAccountUi='1';
  document.head.appendChild(s);
}

/* Explicit localhost-only My Account visual preview for automated/manual QA. */
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