(function(){
'use strict';
if(window.__NS_BCC_V52__)return;window.__NS_BCC_V52__=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],Store=window.NSV421Store;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let palette=null,activity=null,activeIndex=0,items=[];
function navButton(view){return $('#apNav button[data-view="'+view+'"]')}
function openView(view){const b=navButton(view);if(b&&!b.hidden&&!b.disabled){b.click();return true}return false}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),2600)}
function moduleCommands(){
 return $$('#apNav button[data-view]').filter(b=>!b.hidden).map(b=>({group:'Modules',icon:b.querySelector('.ico')?.textContent?.trim()||'•',title:b.textContent.replace(/\s+\d+\s*$/,'').trim(),sub:'Open Admin workspace',run:()=>b.click()}));
}
function actionCommands(){
 return [
  ['＋','Create assisted order','Orders · create operational draft',()=>{openView('orders');setTimeout(()=>$('#apAssistedOrder')?.click(),90)}],
  ['✉','New customer campaign','Communication · select audience first',()=>{openView('communication');setTimeout(()=>$('#nsCampaignNew')?.click(),120)}],
  ['▧','Upload media','Media Library · upload and place',()=>{openView('media');setTimeout(()=>$('#apUploadMedia')?.click(),100)}],
  ['⌁','Update delivery','Delivery Hub · map, ETA and tracking',()=>openView('delivery')],
  ['▦','Schedule content','Schedule · date/time placement',()=>{openView('schedule');setTimeout(()=>$('#apScheduleNew')?.click(),90)}],
  ['≡','Open audit history','Audit · complete change history',()=>openView('audit')],
  ['↗','Open public website','Storefront · new tab',()=>window.open('index.html','_blank','noopener')]
 ].map(x=>({group:'Quick actions',icon:x[0],title:x[1],sub:x[2],run:x[3]}));
}
function commands(){return [...actionCommands(),...moduleCommands()]}
function createPalette(){
 if(palette)return palette;
 palette=document.createElement('div');palette.id='nsCommandPalette';palette.className='ns-cmd-layer';palette.innerHTML='<section class="ns-cmd-card" role="dialog" aria-modal="true" aria-label="Command Center search"><div class="ns-cmd-head"><span>⌕</span><input id="nsCmdInput" autocomplete="off" placeholder="Search modules and actions…"><kbd>Esc</kbd></div><div class="ns-cmd-results" id="nsCmdResults"></div></section>';
 document.body.appendChild(palette);
 palette.addEventListener('mousedown',e=>{if(e.target===palette)closePalette()});
 $('#nsCmdInput',palette).addEventListener('input',()=>renderCommands());
 $('#nsCmdInput',palette).addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}else if(e.key==='Enter'){e.preventDefault();runActive()}else if(e.key==='Escape')closePalette()});
 return palette;
}
function renderCommands(seed){
 const q=String(seed??$('#nsCmdInput',palette)?.value??'').toLowerCase().trim();
 items=commands().filter(x=>!q||[x.title,x.sub,x.group].some(v=>String(v).toLowerCase().includes(q)));
 activeIndex=Math.min(activeIndex,Math.max(0,items.length-1));
 const host=$('#nsCmdResults',palette);if(!host)return;
 if(!items.length){host.innerHTML='<div class="ns-cmd-empty">No Admin command matches this search.</div>';return}
 let last='';host.innerHTML=items.map((x,i)=>{const g=x.group!==last?'<div class="ns-cmd-group">'+esc(x.group)+'</div>':'';last=x.group;return g+'<button type="button" class="ns-cmd-item '+(i===activeIndex?'is-active':'')+'" data-cmd-index="'+i+'"><span class="ns-cmd-icon">'+esc(x.icon)+'</span><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub)+'</small></span><em>Open</em></button>'}).join('');
 $$('[data-cmd-index]',host).forEach(b=>b.onclick=()=>{activeIndex=Number(b.dataset.cmdIndex);runActive()});
 const a=host.querySelector('.is-active');a?.scrollIntoView({block:'nearest'});
}
function move(d){if(!items.length)return;activeIndex=(activeIndex+d+items.length)%items.length;renderCommands()}
function runActive(){const x=items[activeIndex];if(!x)return;closePalette();setTimeout(()=>x.run(),20)}
function openPalette(seed=''){createPalette();palette.classList.add('is-open');const i=$('#nsCmdInput',palette);i.value=seed;activeIndex=0;renderCommands(seed);setTimeout(()=>{i.focus();i.select()},20)}
function closePalette(){palette?.classList.remove('is-open')}
function auditRows(){
 const s=Store?.load?.()||{},rows=Array.isArray(s.audit)?s.audit.slice(0,35):[];
 return rows.length?rows:[{action:'No recent local audit entries',actor:'Local preview',at:'',target:'Actions appear here as Admin state changes are made.'}];
}
function createActivity(){
 if(activity)return activity;
 activity=document.createElement('div');activity.id='nsActivityLayer';activity.className='ns-activity-layer';activity.innerHTML='<aside class="ns-activity-drawer" role="dialog" aria-modal="true" aria-label="Recent Admin activity"><div class="ns-activity-head"><div><h2>Recent activity</h2><p>Universal operational history from the current Admin audit source.</p></div><button type="button" data-activity-close aria-label="Close activity drawer">×</button></div><div class="ns-activity-body" id="nsActivityBody"></div><div class="ns-activity-foot"><button class="ap-btn" type="button" data-activity-refresh>Refresh</button><button class="ap-btn primary" type="button" data-activity-full>Open full audit</button></div></aside>';
 document.body.appendChild(activity);
 activity.addEventListener('mousedown',e=>{if(e.target===activity)closeActivity()});
 $('[data-activity-close]',activity).onclick=closeActivity;$('[data-activity-refresh]',activity).onclick=renderActivity;$('[data-activity-full]',activity).onclick=()=>{closeActivity();openView('audit')};
 return activity;
}
function renderActivity(){
 createActivity();const host=$('#nsActivityBody',activity);
 host.innerHTML=auditRows().map(a=>'<article class="ns-activity-row"><strong>'+esc(a.action||a.event||a.type||'Admin change')+'</strong><span>'+esc([a.actor||'Local preview',a.target||a.detail||a.message||'',a.at?new Date(a.at).toLocaleString():a.timestamp||''].filter(Boolean).join(' · '))+'</span></article>').join('');
}
function openActivity(){createActivity();renderActivity();activity.classList.add('is-open')}
function closeActivity(){activity?.classList.remove('is-open')}
function enhanceTopbar(){
 const search=$('.ap-search');if(search&&!$('#nsCommandHint')){const b=document.createElement('button');b.id='nsCommandHint';b.type='button';b.textContent=(/Mac|iPhone|iPad/.test(navigator.platform)?'⌘ K':'Ctrl K');b.title='Open Command Center';b.onclick=()=>openPalette();search.appendChild(b)}
 const actions=$('.ap-top-actions');if(actions&&!$('#nsActivityToggle')){const b=document.createElement('button');b.className='ap-icon-btn';b.id='nsActivityToggle';b.type='button';b.title='Recent activity';b.setAttribute('aria-label','Open recent activity');b.textContent='◴';actions.insertBefore(b,actions.firstChild);b.onclick=openActivity}
 const g=$('#apGlobalSearch');if(g&&!g.dataset.bccBound){g.dataset.bccBound='1';g.addEventListener('keydown',e=>{if(e.key==='Enter'&&g.value.trim()){e.preventDefault();openPalette(g.value.trim())}})}
}
function enhanceSemantics(){
 document.documentElement.dataset.bccV52='1';
 $$('.ap-table-wrap').forEach(x=>x.setAttribute('tabindex','0'));
 $$('.ap-view').forEach(v=>v.setAttribute('aria-label',(v.querySelector('.ap-page-head h1')?.textContent||v.dataset.view||'Admin')+' workspace'));
}
function activeView(){return $('.ap-view.is-active')?.dataset.view||'overview'}
function updateDocumentTitle(){const title=$('.ap-view.is-active .ap-page-head h1')?.textContent?.trim();if(title)document.title='Nariyal Sutra · '+title+' · Business Command Center'}
function watchView(){
 let last='';const sync=()=>{const v=activeView();if(v!==last){last=v;updateDocumentTitle()}};
 sync();new MutationObserver(sync).observe($('.ap-content')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});
}
function bindKeys(){
 document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}else if(e.key==='Escape'){if(palette?.classList.contains('is-open'))closePalette();else if(activity?.classList.contains('is-open'))closeActivity()}});
}
function init(){
 enhanceSemantics();enhanceTopbar();bindKeys();watchView();
 window.addEventListener('nsv421:change',()=>{if(activity?.classList.contains('is-open'))renderActivity()});
 window.NSBCCV52={ready:true,openPalette,openActivity,commands:()=>commands().map(x=>({group:x.group,title:x.title,sub:x.sub}))};
 window.dispatchEvent(new CustomEvent('nariyal:bcc-v52-ready'));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();