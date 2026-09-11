/* Nariyal Sutra V42.1 unified production Admin shell.
   The production logic remains in admin.html. This layer provides one Admin
   navigation, a complete website inventory and opt-in reporting modules. */
const READY='NS_V421_ADMIN_READY';
if(!window[READY]){
  window[READY]=true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const PUBLIC_PAGES=[
    ['Homepage','index.html','Core storefront'],['About Nariyal Sutra / Story Worlds','about-nariyal-sutra.html','Editorial hub'],
    ['Fresh Tender Coconut','fresh-tender-coconut.html','Product page'],['Green Round Coconut','green-coconut.html','Product page'],
    ['Bulk Coconut Supply','bulk-coconut-supply.html','Product / commercial'],['Coconut Water Guide','coconut-water.html','Product education'],
    ['Events & Hospitality','coconut-events-hospitality.html','Commercial story'],['Wholesale / Export','coconut-wholesale-export.html','Commercial story'],
    ['Direct Sourcing','direct-farm.html','Sourcing story'],['Gujarat Coast','gujarat-coast.html','Origin story'],
    ['South India Groves','south-india-groves.html','Origin story'],['Freshness First','freshness-first.html','Freshness story'],
    ['People of Nariyal Sutra','people-of-nariyal-sutra.html','People / community'],['Supplier Partnership','supplier-partnership.html','Supplier acquisition'],
    ['Delivery & Cancellation','delivery-policy.html','Policy'],['Privacy Policy','privacy.html','Policy'],['Terms','terms.html','Policy'],['Track Order','track.html','Customer utility']
  ];
  const SYSTEM_PAGES=[['Admin','admin.html','Single production Admin'],['Admin Login','admin-login.html','Authentication'],['Admin Set Password','admin-set-password.html','Authentication'],['Staff Sign In','staff-sign-in.html','Authentication']];
  const HOME_SECTIONS=['Product hero','Freshness / service ticker','Product collection','Source-to-cut cinematic','Brand moment','Harvest film','Freshness motion','Product benefits','Product quality / freshness','Pricing','Our Story / Why Us','How to Order','Coconut Uses','People teaser','Moving People rail','FAQ / Quick Answers','Order flow + delivery map','Enquiry / Contact'];

  function styles(){
    if($('#nsUnifiedAdminStyles'))return;
    const s=document.createElement('style');s.id='nsUnifiedAdminStyles';s.textContent=`
      .ns-unified-nav{position:sticky;top:57px;z-index:28;display:flex;gap:7px;overflow-x:auto;padding:10px clamp(12px,4vw,42px);background:rgba(7,16,4,.94);backdrop-filter:blur(16px);border-bottom:1px solid rgba(212,168,67,.12)}
      .ns-unified-nav button{flex:0 0 auto;border:1px solid rgba(212,168,67,.16);background:rgba(255,255,255,.025);color:rgba(255,255,255,.68);padding:8px 11px;font:600 9px/1 Jost,sans-serif;letter-spacing:1.25px;text-transform:uppercase;cursor:pointer}.ns-unified-nav button:hover{border-color:#d4a843;color:#f5d17e}
      .ns-admin-directory{margin-top:30px;border:1px solid var(--line);background:rgba(10,23,6,.83)}.ns-admin-directory-head{padding:20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}.ns-admin-directory-head h2{font-family:'Playfair Display',serif;font-size:30px;font-weight:500;margin:4px 0 7px}.ns-admin-directory-head p{max-width:800px;color:var(--muted);font-size:11px;line-height:1.7}.ns-one-admin{padding:10px 12px;border:1px solid rgba(111,211,79,.2);color:#b8efa8;font-size:9px;line-height:1.6}
      .ns-admin-directory-grid{display:grid;grid-template-columns:1.2fr .8fr}.ns-admin-directory-col{padding:18px}.ns-admin-directory-col+.ns-admin-directory-col{border-left:1px solid var(--line)}.ns-admin-directory h3{font-family:'Playfair Display',serif;font-size:20px;font-weight:500;margin:0 0 8px}.ns-scroll{overflow:auto}.ns-page-table{width:100%;border-collapse:collapse;min-width:650px}.ns-page-table th,.ns-page-table td{padding:9px;border-bottom:1px solid rgba(255,255,255,.045);font-size:10px;text-align:left}.ns-page-table th{font-size:8px;letter-spacing:1.3px;text-transform:uppercase;color:rgba(245,209,126,.64)}.ns-page-table code{color:var(--muted);font-size:9px}.ns-page-table a{color:#f5d17e;text-decoration:none}.ns-home-list{display:grid;gap:6px}.ns-home-row{display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:center;padding:8px;border:1px solid rgba(255,255,255,.055)}.ns-home-row b{color:#d4a843;font-size:9px}.ns-home-row span{font-size:10px;color:rgba(255,255,255,.72)}.ns-system-list{display:grid;gap:6px;margin-top:10px}.ns-system-row{display:flex;justify-content:space-between;gap:10px;padding:8px;border:1px solid rgba(255,255,255,.055);font-size:9px}.ns-system-row a{color:#f5d17e;text-decoration:none}
      @media(max-width:900px){.ns-admin-directory-grid{grid-template-columns:1fr}.ns-admin-directory-col+.ns-admin-directory-col{border-left:0;border-top:1px solid var(--line)}}`;
    document.head.appendChild(s);
  }
  function heading(text){const n=text.toLowerCase();return $$('h1,h2,h3').find(x=>x.textContent.toLowerCase().includes(n))||null;}
  function target(text){const h=heading(text);return h?.closest('section,.catalog-head,.hero')||h?.parentElement||null;}
  function mark(){[['ns-admin-overview',$('.hero')],['ns-admin-orders',$('main.shell > section.panel')],['ns-admin-customers',target('Customers & guest buyers')],['ns-admin-enquiries',target('Enquiries & custom quotes')],['ns-admin-audit',target('Admin audit trail')],['ns-admin-products',target('Products & inventory')]].forEach(([id,el])=>{if(el&&!el.id)el.id=id;});}
  function directory(){
    if($('#nsAdminWebsiteDirectory'))return;
    const shell=$('main.shell');if(!shell)return;
    const p=document.createElement('section');p.id='nsAdminWebsiteDirectory';p.className='ns-admin-directory';
    p.innerHTML=`<div class="ns-admin-directory-head"><div><div class="eyebrow">Website & Content</div><h2>Pages & sections.</h2><p>Complete storefront inventory inside the production Admin. Customer-facing content remains controllable here while authentication, security and protected application logic stay code-controlled.</p></div><div class="ns-one-admin"><b>ONE ADMIN</b><br>admin.html is the production Admin.</div></div><div class="ns-admin-directory-grid"><div class="ns-admin-directory-col"><h3>Public website pages</h3><div class="ns-scroll"><table class="ns-page-table"><thead><tr><th>Page</th><th>File</th><th>Purpose</th><th></th></tr></thead><tbody>${PUBLIC_PAGES.map(([n,f,t])=>`<tr><td><strong>${n}</strong></td><td><code>${f}</code></td><td>${t}</td><td><a href="${f}" target="_blank" rel="noopener">Open ↗</a></td></tr>`).join('')}</tbody></table></div></div><div class="ns-admin-directory-col"><h3>Homepage sections</h3><div class="ns-home-list">${HOME_SECTIONS.map((n,i)=>`<div class="ns-home-row"><b>${String(i+1).padStart(2,'0')}</b><span>${n}</span></div>`).join('')}</div><h3 style="margin-top:18px">System / access pages</h3><div class="ns-system-list">${SYSTEM_PAGES.map(([n,f,t])=>`<div class="ns-system-row"><span><b>${n}</b> · ${t}</span><a href="${f}" target="_blank" rel="noopener">Open ↗</a></div>`).join('')}</div></div></div>`;
    shell.appendChild(p);
  }
  function nav(){
    if($('#nsUnifiedAdminNav'))return;
    const app=$('#appView'),top=$('#appView .topbar');if(!app||!top)return;
    const n=document.createElement('nav');n.id='nsUnifiedAdminNav';n.className='ns-unified-nav';n.setAttribute('aria-label','Admin sections');
    [['Overview','ns-admin-overview'],['Orders','ns-admin-orders'],['Customers','ns-admin-customers'],['Enquiries','ns-admin-enquiries'],['Audit','ns-admin-audit'],['Products & Inventory','ns-admin-products'],['Website & Content','nsAdminWebsiteDirectory']].forEach(([label,id])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.nsAdminTarget=id;b.onclick=()=>$('#'+id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});n.appendChild(b);});
    top.insertAdjacentElement('afterend',n);
  }
  function loadModules(){
    if(!document.querySelector('script[data-ns-admin-attribution]')){const s=document.createElement('script');s.src='/assets/js/v421-admin-attribution.js';s.defer=true;s.dataset.nsAdminAttribution='1';document.head.appendChild(s);}
  }
  function init(){styles();mark();directory();nav();loadModules();window.NSV421Admin={ready:true,version:'42.1-unified-admin',publicPages:PUBLIC_PAGES.map(x=>({name:x[0],file:x[1],type:x[2]})),homepageSections:[...HOME_SECTIONS],refresh:()=>{mark();directory();nav();}};window.dispatchEvent(new CustomEvent('ns:admin-ready',{detail:{version:'42.1-unified-admin'}}));}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
}
export {};
