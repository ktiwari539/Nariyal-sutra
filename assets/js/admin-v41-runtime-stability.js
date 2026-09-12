(function(){
'use strict';
if(window.__NS_V421_ADMIN_RUNTIME_STABILITY__)return;window.__NS_V421_ADMIN_RUNTIME_STABILITY__=true;
let savedImagePanel=null,repairTimer=0;
function remember(){const panel=document.getElementById('apV38ImageTargets');if(panel)savedImagePanel=panel;return panel||savedImagePanel;}
function ensurePagesPanel(){
 const view=document.querySelector('.ap-view[data-view="pages"]');if(!view)return;
 let panel=document.getElementById('apV38ImageTargets');
 if(panel){savedImagePanel=panel;return;}
 panel=remember();
 if(panel&&!panel.isConnected){view.insertBefore(panel,view.firstChild);window.dispatchEvent(new CustomEvent('nsv421:change'));}
}
function scheduleRepair(delay=30){clearTimeout(repairTimer);repairTimer=setTimeout(ensurePagesPanel,delay);}
function bind(){
 remember();
 [100,350,900,1800].forEach(ms=>setTimeout(()=>{remember();ensurePagesPanel();},ms));
 document.addEventListener('click',e=>{if(e.target?.closest?.('#apNav [data-view="pages"]')){scheduleRepair(40);setTimeout(ensurePagesPanel,220);}},true);
 window.addEventListener('nsv421:change',()=>{remember();scheduleRepair(40);});
 const root=document.body||document.documentElement;
 if(root)new MutationObserver(records=>{
  let relevant=false;
  for(const r of records){if(r.type!=='childList')continue;for(const n of [...r.addedNodes,...r.removedNodes]){if(n.nodeType!==1)continue;if(n.id==='apV38ImageTargets'||n.matches?.('.ap-view[data-view="pages"]')||n.querySelector?.('#apV38ImageTargets,.ap-view[data-view="pages"]')){relevant=true;break;}}if(relevant)break;}
  if(relevant){remember();scheduleRepair(20);}
 }).observe(root,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();