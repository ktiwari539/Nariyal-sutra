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

const Store=window.NSV421Store;
function file(){let f=(location.pathname.split('/').pop()||'index.html').toLowerCase();return f||'index.html'}
function eligible(){const main=document.querySelector('main');let a=main?[...main.children].filter(x=>x.tagName==='SECTION'):[];if(!a.length)a=[...document.body.children].filter(x=>x.tagName==='SECTION'&&!x.matches('#jungle-intro'));return a;}
function apply(){if(!Store)return;const f=file();if(f==='index.html')return;const secs=eligible();if(secs.length<2)return;secs.forEach((s,i)=>{if(!s.dataset.v30SeqKey)s.dataset.v30SeqKey='s'+String(i+1).padStart(2,'0')});const state=Store.load(),cfg=state.pageSequences&&state.pageSequences[f];if(!cfg)return;const by=new Map(secs.map(x=>[x.dataset.v30SeqKey,x]));const ordered=(cfg.order||[]).map(k=>by.get(k)).filter(Boolean);secs.forEach(x=>{if(!ordered.includes(x))ordered.push(x)});const parent=secs[0].parentNode,anchor=secs[secs.length-1].nextSibling;ordered.forEach(x=>parent.insertBefore(x,anchor));ordered.forEach(x=>{const k=x.dataset.v30SeqKey,hide=cfg.hidden&&cfg.hidden[k]===true;x.hidden=hide;x.dataset.v30SectionHidden=hide?'true':'false'});}
function init(){apply();window.addEventListener('nsv421:change',()=>setTimeout(apply,20));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
