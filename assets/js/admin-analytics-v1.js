(function(){
'use strict';
if(window.__NS_ADMIN_ANALYTICS_V1__)return;
window.__NS_ADMIN_ANALYTICS_V1__=true;
const Store=window.NSV421Store;if(!Store)return;
const $=(s,r=document)=>r.querySelector(s),arr=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PROD_ORIGIN='https://nariyal-sutra.netlify.app';
const REPORTED={google_search:'Google Search',ai_assistant:'AI assistant',word_of_mouth:'Word of mouth / referral',social_media:'Social media',whatsapp_telegram:'WhatsApp / Telegram',returning_customer:'Returning customer',business_event_referral:'Business / event / hospitality referral',other:'Other',prefer_not_to_say:'Prefer not to say'};
function title(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
function touchLabel(t){
 if(!t)return'';
 const cls=String(t.classification||''),src=String(t.source||'');
 if(cls==='direct')return'Direct';
 if(cls==='organic_search')return(src==='google'?'Google':title(src||'Search'))+' Organic';
 if(cls==='paid_campaign')return title(src||'Campaign')+' Campaign';
 if(cls==='social')return title(src||'Social');
 if(cls==='whatsapp')return'WhatsApp';
 if(cls==='email')return'Email';
 if(cls==='referral')return title(src||'Website')+' Referral';
 return title(src||cls||'Other');
}
function acq(x){return x?.acquisition&&Number(x.acquisition.version)===2?x.acquisition:null;}
function sourceOf(x){const a=acq(x);if(a?.firstTouch)return touchLabel(a.firstTouch);const legacy=String(x?.acquisitionSource||'');return x?.acquisitionSourceLabel||x?.acquisition?.label||REPORTED[legacy]||'';}
function reportedOf(x){const a=acq(x);return a?.reportedSourceLabel||REPORTED[a?.reportedSource]||'';}
function createdMs(x){const v=x?.createdAt;if(v&&typeof v.toMillis==='function')return v.toMillis();if(v&&typeof v.seconds==='number')return v.seconds*1000;const n=Date.parse(v||'');return Number.isFinite(n)?n:0;}
function pageLabel(path){const p=String(path||'/').split(/[?#]/)[0];if(p==='/'||p==='/index.html')return'Home';return title((p.split('/').filter(Boolean).pop()||'Home').replace(/\.html$/,'').replaceAll('-',' '));}
function records(){
 const s=Store.load(),orders=arr(s.orders).map(x=>({...x,_kind:'Order',_id:x.orderId||x.id||'Order'})),inquiries=arr(s.inquiries).map(x=>({...x,_kind:'Enquiry',_id:x.inquiryId||x.id||'Enquiry'}));
 return {orders,inquiries,all:[...orders,...inquiries]};
}
function ranked(values){const m={};values.filter(Boolean).forEach(v=>m[v]=(m[v]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));}
function barRows(rows,total,empty){
 if(!rows.length)return '<div class="ns-ana-empty">'+esc(empty)+'</div>';
 const max=Math.max(1,...rows.map(x=>x[1]));
 return rows.slice(0,8).map(([label,n])=>'<div class="ns-ana-row"><span>'+esc(label)+'</span><i><b style="width:'+Math.max(3,n/max*100)+'%"></b></i><strong>'+n+' <small>· '+(total?Math.round(n/total*100):0)+'%</small></strong></div>').join('');
}
function ensureStyle(){
 if($('#nsAdminAnalyticsStyle'))return;
 const s=document.createElement('style');s.id='nsAdminAnalyticsStyle';s.textContent=`
 #nsAnalyticsApp{display:grid;gap:14px}.ns-ana-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.ns-ana-kpi,.ns-ana-panel{background:var(--panel);border:1px solid var(--line);color:var(--ink);border-radius:14px;padding:16px}.ns-ana-kpi small,.ns-ana-muted{color:var(--muted)}.ns-ana-kpi small{display:block;font-size:8px;letter-spacing:.12em;text-transform:uppercase}.ns-ana-kpi strong{display:block;margin:8px 0 5px;font:500 26px/1.05 'Playfair Display',Georgia,serif;color:var(--ink)}.ns-ana-kpi span{display:block;font-size:9px;color:var(--muted);line-height:1.45}.ns-ana-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ns-ana-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}.ns-ana-head h2{font:500 20px 'Playfair Display',Georgia,serif;color:var(--ink);margin:0}.ns-ana-head p{margin:4px 0 0;font-size:9px;color:var(--muted);line-height:1.55}.ns-ana-row{display:grid;grid-template-columns:minmax(120px,1fr) minmax(130px,2fr) auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);font-size:9px}.ns-ana-row:last-child{border-bottom:0}.ns-ana-row>span{color:var(--ink)}.ns-ana-row i{height:7px;background:var(--panel2);border-radius:99px;overflow:hidden}.ns-ana-row i b{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--gold2));border-radius:inherit}.ns-ana-row>strong{color:var(--ink);font-size:9px}.ns-ana-row small{color:var(--muted);font-weight:400}.ns-ana-empty{padding:12px;border:1px dashed var(--line);border-radius:9px;color:var(--muted);font-size:9px;line-height:1.55}.ns-ana-recent{display:grid;gap:7px}.ns-ana-recent article{display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px;border:1px solid var(--line);border-radius:9px;background:var(--panel2)}.ns-ana-recent b,.ns-ana-recent span{display:block}.ns-ana-recent b{font-size:9px;color:var(--ink)}.ns-ana-recent span,.ns-ana-recent em{font-size:8px;color:var(--muted);font-style:normal}.ns-ana-builder{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ns-ana-builder label{display:grid;gap:5px;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.ns-ana-builder input,.ns-ana-builder select{width:100%;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:9px}.ns-ana-builder .wide{grid-column:1/-1}.ns-ana-link{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:10px}.ns-ana-link input{background:var(--panel2)!important;color:var(--ink)!important}.ns-ana-note{padding:11px 13px;border:1px solid var(--line);background:var(--panel2);border-radius:9px;font-size:9px;color:var(--muted);line-height:1.6}.ns-ana-status{display:inline-flex;padding:5px 8px;border-radius:999px;background:var(--sage);color:var(--green);font-size:8px;font-weight:700}.ns-ana-status.gated{background:var(--panel2);color:var(--muted);border:1px solid var(--line)}@media(max-width:900px){.ns-ana-kpis{grid-template-columns:repeat(2,1fr)}.ns-ana-grid{grid-template-columns:1fr}}@media(max-width:560px){.ns-ana-kpis,.ns-ana-builder{grid-template-columns:1fr}.ns-ana-builder .wide{grid-column:auto}.ns-ana-row{grid-template-columns:1fr}.ns-ana-link{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function builderHtml(){
 return `<div class="ns-ana-builder"><label>Channel<select id="nsAnaSource"><option value="whatsapp">WhatsApp</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="email">Email</option><option value="google">Google</option><option value="linkedin">LinkedIn</option><option value="partner">Partner / referral</option></select></label><label>Landing page<select id="nsAnaLanding"><option value="/">Homepage</option><option value="/coconut-water">Coconut Water</option><option value="/fresh-tender-coconut.html">Fresh Tender Coconut</option><option value="/green-coconut.html">Green Coconut</option><option value="/bulk-coconut-supply.html">Bulk Supply</option><option value="/coconut-events-hospitality.html">Events & Hospitality</option></select></label><label class="wide">Campaign name<input id="nsAnaCampaign" maxlength="80" placeholder="e.g. whatsapp-october, youtube-description"></label></div><div class="ns-ana-link"><input id="nsAnaLink" readonly aria-label="Trackable campaign link"><button class="ap-btn" id="nsAnaCopy" type="button">Copy link</button></div><p class="ns-ana-muted" style="font-size:8px;margin-top:8px">Share this generated URL instead of a plain link. The existing privacy-safe attribution runtime records the source/campaign with a submitted order or enquiry.</p>`;
}
function buildLink(){
 const source=$('#nsAnaSource')?.value||'whatsapp',landing=$('#nsAnaLanding')?.value||'/',campaign=String($('#nsAnaCampaign')?.value||'').trim().replace(/[^A-Za-z0-9._ -]/g,'').replace(/\s+/g,'-').slice(0,80);
 const medium=source==='email'?'email':source==='google'?'organic':['youtube','instagram','facebook','linkedin'].includes(source)?'social':source==='whatsapp'?'shared_link':'referral';
 const u=new URL(landing,PROD_ORIGIN);u.searchParams.set('utm_source',source);u.searchParams.set('utm_medium',medium);if(campaign)u.searchParams.set('utm_campaign',campaign);
 const out=$('#nsAnaLink');if(out)out.value=u.toString();return u.toString();
}
async function copyLink(){
 const value=buildLink();try{await navigator.clipboard.writeText(value);}catch(_e){const e=$('#nsAnaLink');e?.select();try{document.execCommand('copy');}catch(_x){}}
 const b=$('#nsAnaCopy');if(b){const old=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=old,1200);}
}
function render(){
 const root=$('#nsAnalyticsApp');if(!root)return;ensureStyle();
 const {orders,inquiries,all}=records(),attributed=all.filter(sourceOf),coverage=all.length?Math.round(attributed.length/all.length*100):0;
 const sources=ranked(attributed.map(sourceOf)),reported=ranked(attributed.map(reportedOf)),landings=ranked(attributed.map(x=>pageLabel(acq(x)?.firstTouch?.landingPath||''))),campaigns=ranked(attributed.map(x=>String(acq(x)?.firstTouch?.campaign||'').trim()));
 const top=sources[0]||['No data',0],organic=attributed.filter(x=>acq(x)?.firstTouch?.classification==='organic_search').length,messaging=attributed.filter(x=>['whatsapp','email'].includes(acq(x)?.firstTouch?.classification)).length;
 const recent=attributed.slice().sort((a,b)=>createdMs(b)-createdMs(a)).slice(0,8);
 root.innerHTML=`<div class="ns-ana-kpis"><div class="ns-ana-kpi"><small>Submitted outcomes</small><strong>${all.length}</strong><span>${orders.length} orders · ${inquiries.length} enquiries</span></div><div class="ns-ana-kpi"><small>Attribution coverage</small><strong>${coverage}%</strong><span>${attributed.length} records include source context</span></div><div class="ns-ana-kpi"><small>Top source</small><strong style="font-size:18px">${esc(top[0])}</strong><span>${top[1]} submitted outcomes</span></div><div class="ns-ana-kpi"><small>Organic / messaging</small><strong>${organic} / ${messaging}</strong><span>Confirmed outcomes, not raw visits</span></div></div>
 <div class="ns-ana-grid"><section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>How customers found us</h2><p>Technical first-touch source attached to submitted orders and enquiries.</p></div><span class="ns-ana-status">First-party</span></div>${barRows(sources,attributed.length,'No submitted order or enquiry has attribution yet.')}</section>
 <section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>What customers told us</h2><p>Answer from “How did you hear about Nariyal Sutra?” at checkout.</p></div></div>${barRows(reported,attributed.filter(reportedOf).length,'No customer-reported discovery source yet.')}</section>
 <section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>Top landing pages</h2><p>The first Nariyal Sutra page seen in the attributed browser session.</p></div></div>${barRows(landings,attributed.length,'Landing-page attribution will appear with new submissions.')}</section>
 <section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>Campaigns</h2><p>UTM campaigns tied to submitted business outcomes.</p></div></div>${barRows(campaigns,campaigns.reduce((n,x)=>n+x[1],0),'No campaign-tagged submitted outcomes yet.')}</section></div>
 <div class="ns-ana-grid"><section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>Recent attributed outcomes</h2><p>Useful for checking whether a WhatsApp, YouTube, social or referral link converted.</p></div></div><div class="ns-ana-recent">${recent.length?recent.map(x=>`<article><div><b>${esc(x._kind)} · ${esc(x._id)} · ${esc(x.customerName||x.name||'Customer')}</b><span>${esc(sourceOf(x))}${reportedOf(x)?' · customer: '+esc(reportedOf(x)):''}</span></div><em>${esc(pageLabel(acq(x)?.firstTouch?.landingPath||'/'))}</em></article>`).join(''):'<div class="ns-ana-empty">No attributed submissions yet.</div>'}</div></section>
 <section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>Trackable link builder</h2><p>Create source-tagged links for WhatsApp, YouTube descriptions, Instagram, email and partners.</p></div></div>${builderHtml()}</section></div>
 <div class="ns-ana-grid"><section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>Visitor-level engagement</h2><p>Page views, sessions, engaged sessions and broader browsing behavior.</p></div><span class="ns-ana-status gated">GA4</span></div><div class="ns-ana-note">Production already has GA4 collection code. This Admin screen deliberately does not invent visitor/session totals from order data. A private GA4 reporting connection can be added later without changing the storefront tracking contract.</div></section>
 <section class="ns-ana-panel"><div class="ns-ana-head"><div><h2>Privacy boundary</h2><p>Source insight without copying sensitive browsing data into the business database.</p></div></div><div class="ns-ana-note">Stored attribution is limited to normalized source/medium, campaign label, referring domain, landing path and the customer’s optional discovery answer. Full referrer URLs and arbitrary query-string values are not stored.</div></section></div>`;
 ['nsAnaSource','nsAnaLanding','nsAnaCampaign'].forEach(id=>$('#'+id)?.addEventListener(id==='nsAnaCampaign'?'input':'change',buildLink));$('#nsAnaCopy')?.addEventListener('click',copyLink);buildLink();
}
function init(){ensureStyle();render();window.addEventListener('nsv421:change',()=>{clearTimeout(init.t);init.t=setTimeout(render,80);});window.addEventListener('nsv421:operational-synced',()=>setTimeout(render,80));window.addEventListener('nsv421:production-ready',()=>setTimeout(render,120));}
window.NSAdminAnalytics={render,sourceOf,reportedOf,buildLink};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();