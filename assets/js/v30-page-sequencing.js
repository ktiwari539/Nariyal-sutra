(function(){
'use strict';
function loadOnce(src,attr){if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'1');document.head.appendChild(s);}
if(!window.__NS_V421_STABLE_ASSETS__)loadOnce('/assets/js/v421-stable-assets.js','data-ns-stable-assets');
function file(){let f=(location.pathname.split('/').pop()||'index.html').toLowerCase();return f||'index.html'}
if(!window.__NS_V421_VISUAL_RECOVERY__)loadOnce('/assets/js/v421-visual-recovery.js','data-ns-visual-recovery');
if(!window.__NS_V421_CONTENT_CONTROLS__)loadOnce('/assets/js/v421-content-controls.js','data-ns-content-controls');
if(!/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname) && !window.__NS_V421_PRODUCTION_BRIDGE__)loadOnce('/assets/js/v421-production-bridge.js','data-ns-production-bridge');
/* Retired cinematic runtimes are deliberately not loaded here. */
if(file()==='index.html' && !window.NSAttribution)loadOnce('/assets/js/v421-attribution.js','data-ns-attribution');
if(file()==='index.html' && !window.__NS_V421_ACCOUNT_UI__)loadOnce('/assets/js/v421-account-ui.js','data-ns-account-ui');
if(file()==='index.html' && /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname) && new URLSearchParams(location.search).get('accountPreview')==='1')loadOnce('/assets/js/v421-account-preview-stabilizer.js','data-ns-account-preview-stabilizer');
const Store=window.NSV421Store;
function eligible(){const main=document.querySelector('main');let a=main?[...main.children].filter(x=>x.tagName==='SECTION'):[];if(!a.length)a=[...document.body.children].filter(x=>x.tagName==='SECTION'&&!x.matches('#jungle-intro'));return a;}
function apply(){if(!Store)return;const f=file();if(f==='index.html')return;const secs=eligible();if(secs.length<2)return;secs.forEach((s,i)=>{if(!s.dataset.v30SeqKey)s.dataset.v30SeqKey='s'+String(i+1).padStart(2,'0')});const state=Store.load(),cfg=state.pageSequences&&state.pageSequences[f];if(!cfg)return;const by=new Map(secs.map(x=>[x.dataset.v30SeqKey,x]));const ordered=(cfg.order||[]).map(k=>by.get(k)).filter(Boolean);secs.forEach(x=>{if(!ordered.includes(x))ordered.push(x)});const parent=secs[0].parentNode,anchor=secs[secs.length-1].nextSibling;ordered.forEach(x=>parent.insertBefore(x,anchor));ordered.forEach(x=>{const k=x.dataset.v30SeqKey,hide=cfg.hidden&&cfg.hidden[k]===true;x.hidden=hide;x.dataset.v30SectionHidden=hide?'true':'false'});}
function init(){apply();window.addEventListener('nsv421:change',()=>setTimeout(apply,20));window.addEventListener('nsv421:production-ready',()=>setTimeout(apply,20));setTimeout(apply,700);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
