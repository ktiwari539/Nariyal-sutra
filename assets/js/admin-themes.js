(function(){
'use strict';
const Store=window.NSV421Store,$=(s,r=document)=>r.querySelector(s);
if(!Store)return;
const FALLBACK='nariyal-signature';
const THEMES=[
 {id:FALLBACK,name:'Nariyal Signature',tone:'signature',description:'Approved deep forest foundation with premium dark surfaces, cream typography, cinematic photography and gold accents.'},
 {id:'fresh-grove',name:'Fresh Grove',tone:'fresh',description:'Bright coconut-cream surfaces, botanical greens and a clean farm-fresh presentation with restrained depth.'},
 {id:'coastal-premium',name:'Coastal Premium',tone:'coastal',description:'Luxury editorial styling with deep coastal green, warm ivory, muted gold and refined photographic framing.'}
];
let selected=FALLBACK,device='desktop';
const theme=id=>THEMES.find(x=>x.id===id)||THEMES[0];
const cfg=()=>Store.load().themeConfig||Store.defaults.themeConfig;
function canPublish(){const role=$('#apRole')?.value||Store.getSession?.()?.role||'Owner';return ['Owner','Admin','Manager','Content'].includes(role);}
function toast(msg){const e=$('#apToast');if(!e)return;e.textContent=msg;e.classList.add('is-show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-show'),3000);}
function saveConfig(next,action){const s=Store.load();s.themeConfig={...Store.defaults.themeConfig,...s.themeConfig,...next};Store.audit?.(s,action,theme(s.themeConfig.publishedTheme).name);Store.save(s);}
function previewUrl(id){const u=new URL('index.html',location.href);u.searchParams.set('themePreview',id);return u.href;}
function setPreview(id){selected=theme(id).id;render();}
function saveDraft(){saveConfig({draftTheme:selected},'Theme draft saved');toast(`${theme(selected).name} saved as draft. Customers are unchanged.`);render();}
function publish(){
 if(!canPublish())return toast('Your role cannot publish storefront themes.');
 const current=cfg().publishedTheme||FALLBACK;if(current===selected)return toast(`${theme(selected).name} is already live.`);
 const message=`Publish ${theme(selected).name}?\n\nCurrent live theme: ${theme(current).name}\nNew live theme: ${theme(selected).name}\n\n${theme(current).name} will be retained for one-step rollback.`;
 if(!confirm(message))return;
 try{saveConfig({publishedTheme:selected,previousPublishedTheme:current,draftTheme:null,publishedAt:new Date().toISOString(),publishedBy:Store.getSession?.()?.name||'Local Admin preview'},'Storefront theme published');toast(`${theme(selected).name} is now published.`);render();}
 catch(e){toast('Publish failed. The last known-good theme remains live.');}
}
function restore(){
 if(!canPublish())return toast('Your role cannot restore storefront themes.');
 const c=cfg(),previous=theme(c.previousPublishedTheme||FALLBACK).id,current=theme(c.publishedTheme).id;
 if(previous===current)return toast('No different previous theme is available.');
 if(!confirm(`Restore ${theme(previous).name}?\n\n${theme(current).name} will be retained for rollback.`))return;
 saveConfig({publishedTheme:previous,previousPublishedTheme:current,draftTheme:null,publishedAt:new Date().toISOString(),publishedBy:Store.getSession?.()?.name||'Local Admin preview'},'Previous storefront theme restored');selected=previous;toast(`${theme(previous).name} restored.`);render();
}
function card(t,c){const flags=[c.publishedTheme===t.id?'LIVE':null,c.draftTheme===t.id?'DRAFT':null,c.previousPublishedTheme===t.id?'PREVIOUS':null].filter(Boolean);return `<article class="ap-card ns-theme-card ${selected===t.id?'is-selected':''} ${c.publishedTheme===t.id?'is-live':''}" data-theme-card="${t.id}"><div class="ns-theme-swatch ${t.tone}"><span>${t.name}</span></div><div class="ns-theme-card-body"><h2 style="font-size:18px">${t.name}</h2><p>${t.description}</p><div class="ns-theme-flags">${flags.map(x=>`<span class="ns-theme-flag">${x}</span>`).join('')||'<span class="ns-theme-flag">AVAILABLE</span>'}</div><div class="ns-theme-actions"><button class="ap-btn ${selected===t.id?'primary':''}" type="button" data-theme-select="${t.id}">Select & preview</button></div></div></article>`;}
function render(){
 const root=$('#nsThemesApp');if(!root)return;const c=cfg(),live=theme(c.publishedTheme),draft=c.draftTheme?theme(c.draftTheme):null,previous=c.previousPublishedTheme?theme(c.previousPublishedTheme):null;
 if(!THEMES.some(t=>t.id===selected))selected=live.id;
 root.innerHTML=`<div class="ns-themes-summary"><div class="ns-theme-stat"><span>Currently published</span><strong>${live.name}</strong></div><div class="ns-theme-stat"><span>Saved draft</span><strong>${draft?.name||'No draft'}</strong></div><div class="ns-theme-stat"><span>Rollback theme</span><strong>${previous?.name||'Nariyal Signature fallback'}</strong></div></div><div class="ns-theme-grid">${THEMES.map(t=>card(t,c)).join('')}</div><div class="ns-preview-toolbar"><div><strong>${theme(selected).name} preview</strong><div style="font-size:9px;color:var(--muted);margin-top:3px">Isolated preview — customer storefront state is not changed.</div></div><div class="ns-preview-switch"><button class="ap-btn ${device==='desktop'?'primary':''}" data-preview-device="desktop">Desktop</button><button class="ap-btn ${device==='mobile'?'primary':''}" data-preview-device="mobile">Mobile</button></div></div><div class="ns-theme-stage"><iframe class="ns-theme-frame ${device}" id="nsThemeFrame" title="${theme(selected).name} ${device} storefront preview" src="${previewUrl(selected)}"></iframe></div><div class="ns-theme-warning"><strong>Safe publishing:</strong> Preview and Save Draft never change the customer storefront. Publish updates only the controlled theme identifier. Invalid or unavailable identifiers fall back to Nariyal Signature.</div><div class="ns-publish-row"><div><strong>Ready to prepare this theme?</strong><p>Save it as a draft for review, or publish after confirming the current and replacement themes.</p></div><div class="ns-theme-actions"><button class="ap-btn" id="nsSaveThemeDraft">Save Draft</button><button class="ap-btn" id="nsRestoreTheme" ${previous?'':'disabled'}>Restore Previous Theme</button><button class="ap-btn primary" id="nsPublishTheme" ${canPublish()?'':'disabled'}>Publish</button></div></div>`;
 root.querySelectorAll('[data-theme-select]').forEach(b=>b.onclick=()=>setPreview(b.dataset.themeSelect));root.querySelectorAll('[data-preview-device]').forEach(b=>b.onclick=()=>{device=b.dataset.previewDevice;render();});$('#nsSaveThemeDraft').onclick=saveDraft;$('#nsPublishTheme').onclick=publish;$('#nsRestoreTheme').onclick=restore;
}
function init(){selected=theme(cfg().draftTheme||cfg().publishedTheme).id;render();window.addEventListener('nsv421:change',render);window.addEventListener('nsv421:production-ready',render);$('#apRole')?.addEventListener('change',render);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
window.NSAdminThemes={themes:THEMES,get selected(){return selected},preview:setPreview,saveDraft,publish,restore,render};
})();
