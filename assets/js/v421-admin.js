/* Nariyal Sutra V42.1 unified production-admin layer.
   admin.html remains the only Admin product/entry point. This module adds
   navigation plus the complete website/page inventory without replacing the
   Firebase-authenticated production order/customer/catalog logic in admin.html. */
const READY='NS_V421_ADMIN_READY';
if(!window[READY]){
  window[READY]=true;
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  const PUBLIC_PAGES=[
    ['Homepage','index.html','Core storefront'],
    ['About Nariyal Sutra / Story Worlds','about-nariyal-sutra.html','Editorial hub'],
    ['Fresh Tender Coconut','fresh-tender-coconut.html','Product page'],
    ['Green Round Coconut','green-coconut.html','Product page'],
    ['Bulk Coconut Supply','bulk-coconut-supply.html','Product / commercial'],
    ['Coconut Water Guide','coconut-water.html','Product education'],
    ['Events & Hospitality','coconut-events-hospitality.html','Commercial story'],
    ['Wholesale / Export','coconut-wholesale-export.html','Commercial story'],
    ['Direct Sourcing','direct-farm.html','Sourcing story'],
    ['Gujarat Coast','gujarat-coast.html','Origin story'],
    ['South India Groves','south-india-groves.html','Origin story'],
    ['Freshness First','freshness-first.html','Freshness story'],
    ['People of Nariyal Sutra','people-of-nariyal-sutra.html','People / community'],
    ['Supplier Partnership','supplier-partnership.html','Supplier acquisition'],
    ['Delivery & Cancellation','delivery-policy.html','Policy'],
    ['Privacy Policy','privacy.html','Policy'],
    ['Terms','terms.html','Policy'],
    ['Track Order','track.html','Customer utility']
  ];
  const SYSTEM_PAGES=[
    ['Admin','admin.html','Single production Admin'],
    ['Admin Login','admin-login.html','Authentication'],
    ['Admin Set Password','admin-set-password.html','Authentication'],
    ['Staff Sign In','staff-sign-in.html','Authentication']
  ];
  const HOME_SECTIONS=[
    'Product hero',
    'Freshness / service ticker',
    'Product collection',
    'Source-to-cut cinematic',
    'Brand moment',
    'Harvest film',
    'Freshness motion',
    'Product benefits',
    'Product quality / freshness',
    'Pricing',
    'Our Story / Why Us',
    'How to Order',
    'Coconut Uses',
    'People teaser',
    'Moving People rail',
    'FAQ / Quick Answers',
    'Order flow + delivery map',
    'Enquiry / Contact'
  ];

  function announce(message,type='info'){
    const box=q('#adminAlert,.admin-alert');
    if(box){box.textContent=message;box.classList.add('show');box.classList.toggle('error',type==='error');}
    else if(type==='error') console.error('[Nariyal Sutra Admin]',message);
  }

  function guardDeadButtons(){
    qa('button').forEach(btn=>{
      if(btn.disabled||btn.dataset.nsGuarded==='1') return;
      btn.dataset.nsGuarded='1';
      btn.addEventListener('click',()=>{
        setTimeout(()=>{
          if(btn.matches(':disabled')) return;
          const href=btn.getAttribute('data-href');
          if(href) location.href=href;
        },0);
      });
    });
  }

  function injectStyles(){
    if(q('#nsUnifiedAdminStyles')) return;
    const style=document.createElement('style');
    style.id='nsUnifiedAdminStyles';
    style.textContent=`
      .ns-unified-nav{position:sticky;top:57px;z-index:28;display:flex;gap:7px;overflow-x:auto;padding:10px clamp(12px,4vw,42px);background:rgba(7,16,4,.94);backdrop-filter:blur(16px);border-bottom:1px solid rgba(212,168,67,.12);scrollbar-width:thin}
      .ns-unified-nav button{flex:0 0 auto;border:1px solid rgba(212,168,67,.16);background:rgba(255,255,255,.025);color:rgba(255,255,255,.68);padding:8px 11px;font:600 9px/1 Jost,sans-serif;letter-spacing:1.35px;text-transform:uppercase;cursor:pointer}
      .ns-unified-nav button:hover,.ns-unified-nav button:focus{border-color:#d4a843;color:#f5d17e;outline:none}
      .ns-admin-directory{margin-top:34px;border:1px solid rgba(212,168,67,.15);background:rgba(10,23,6,.83);box-shadow:0 28px 80px rgba(0,0,0,.22)}
      .ns-admin-directory-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:22px;border-bottom:1px solid rgba(212,168,67,.12);flex-wrap:wrap}
      .ns-admin-directory-head h2{font:500 clamp(26px,3vw,36px)/1.1 'Playfair Display',serif;margin:3px 0 7px}.ns-admin-directory-head p{max-width:820px;color:rgba(255,255,255,.48);font-size:11px;line-height:1.7}
      .ns-admin-directory-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:0}.ns-admin-directory-col{padding:18px}.ns-admin-directory-col+ .ns-admin-directory-col{border-left:1px solid rgba(212,168,67,.10)}
      .ns-admin-directory h3{font:500 20px/1.2 'Playfair Display',serif;margin:0 0 10px}.ns-admin-directory small{color:rgba(255,255,255,.4)}
      .ns-page-table{width:100%;border-collapse:collapse;min-width:720px}.ns-page-table th,.ns-page-table td{padding:10px 9px;text-align:left;border-bottom:1px solid rgba(255,255,255,.045);font-size:10px;vertical-align:middle}.ns-page-table th{color:rgba(245,209,126,.64);font-size:8px;letter-spacing:1.4px;text-transform:uppercase}.ns-page-table strong{color:#fff}.ns-page-table code{color:rgba(255,255,255,.52);font-size:9px}.ns-page-table a{display:inline-flex;border:1px solid rgba(212,168,67,.18);padding:6px 8px;color:#f5d17e;text-decoration:none;font-size:8px;letter-spacing:1px;text-transform:uppercase}
      .ns-page-scroll{overflow:auto}.ns-home-sections{display:grid;gap:6px}.ns-home-section{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;padding:9px 10px;border:1px solid rgba(255,255,255,.055);background:rgba(255,255,255,.018)}.ns-home-section b{display:grid;place-items:center;width:28px;height:28px;border:1px solid rgba(212,168,67,.18);color:#d4a843;font-size:9px}.ns-home-section span{font-size:10px;color:rgba(255,255,255,.7)}
      .ns-system-list{display:grid;gap:6px;margin-top:18px}.ns-system-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 10px;border:1px solid rgba(255,255,255,.055)}.ns-system-row div{display:grid;gap:2px}.ns-system-row b{font-size:10px}.ns-system-row span{font-size:8px;color:rgba(255,255,255,.4)}.ns-system-row a{color:#f5d17e;font-size:8px;text-decoration:none}
      .ns-single-admin-note{padding:10px 12px;border:1px solid rgba(111,211,79,.2);background:rgba(111,211,79,.035);color:#b8efa8;font-size:9px;line-height:1.6;max-width:430px}
      @media(max-width:900px){.ns-admin-directory-grid{grid-template-columns:1fr}.ns-admin-directory-col+ .ns-admin-directory-col{border-left:0;border-top:1px solid rgba(212,168,67,.10)}.ns-unified-nav{top:55px}}
    `;
    document.head.appendChild(style);
  }

  function findHeading(text){
    const needle=text.toLowerCase();
    return qa('h1,h2,h3').find(el=>el.textContent.trim().toLowerCase().includes(needle))||null;
  }
  function sectionForHeading(text){
    const h=findHeading(text); if(!h) return null;
    return h.closest('section,.catalog-head,.hero')||h.parentElement;
  }
  function markTargets(){
    const map=[
      ['ns-admin-overview',q('.hero')],
      ['ns-admin-orders',q('main.shell > section.panel')],
      ['ns-admin-customers',sectionForHeading('Customers & guest buyers')],
      ['ns-admin-enquiries',sectionForHeading('Enquiries & custom quotes')],
      ['ns-admin-audit',sectionForHeading('Admin audit trail')],
      ['ns-admin-products',sectionForHeading('Products & inventory')]
    ];
    map.forEach(([id,el])=>{if(el&&!el.id)el.id=id;});
  }

  function pageRows(){
    return PUBLIC_PAGES.map(([name,file,type])=>`<tr><td><strong>${name}</strong></td><td><code>${file}</code></td><td>${type}</td><td><a href="${file}" target="_blank" rel="noopener">Open ↗</a></td></tr>`).join('');
  }
  function systemRows(){
    return SYSTEM_PAGES.map(([name,file,type])=>`<div class="ns-system-row"><div><b>${name}</b><span>${type} · ${file}</span></div><a href="${file}" target="_blank" rel="noopener">Open ↗</a></div>`).join('');
  }
  function sectionRows(){
    return HOME_SECTIONS.map((name,i)=>`<div class="ns-home-section"><b>${String(i+1).padStart(2,'0')}</b><span>${name}</span></div>`).join('');
  }

  function injectDirectory(){
    if(q('#nsAdminWebsiteDirectory')) return;
    const shell=q('main.shell'); if(!shell) return;
    const block=document.createElement('section');
    block.id='nsAdminWebsiteDirectory';
    block.className='ns-admin-directory';
    block.innerHTML=`
      <div class="ns-admin-directory-head">
        <div><div class="eyebrow">Website & Content</div><h2>Pages & sections.</h2><p>Complete candidate-site inventory inside the production Admin. This keeps one Admin product while letting Owner/Admin review every public page and every homepage section from the same authenticated portal.</p></div>
        <div class="ns-single-admin-note"><b>ONE ADMIN</b><br>admin.html is the production Admin. The old admin-preview URL is retired and redirects here.</div>
      </div>
      <div class="ns-admin-directory-grid">
        <div class="ns-admin-directory-col"><h3>Public website pages</h3><small>${PUBLIC_PAGES.length} customer-facing pages</small><div class="ns-page-scroll" style="margin-top:10px"><table class="ns-page-table"><thead><tr><th>Page</th><th>File</th><th>Purpose</th><th></th></tr></thead><tbody>${pageRows()}</tbody></table></div></div>
        <div class="ns-admin-directory-col"><h3>Homepage section inventory</h3><small>${HOME_SECTIONS.length} storefront sections</small><div class="ns-home-sections" style="margin-top:10px">${sectionRows()}</div><h3 style="margin-top:20px">System / access pages</h3><small>Not storefront content</small><div class="ns-system-list">${systemRows()}</div></div>
      </div>`;
    shell.appendChild(block);
  }

  function scrollToTarget(id){
    const el=q('#'+id); if(!el) return;
    el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function injectNav(){
    if(q('#nsUnifiedAdminNav')) return;
    const app=q('#appView'); const top=q('#appView .topbar'); if(!app||!top) return;
    const nav=document.createElement('nav');
    nav.id='nsUnifiedAdminNav'; nav.className='ns-unified-nav'; nav.setAttribute('aria-label','Admin sections');
    const items=[['Overview','ns-admin-overview'],['Orders','ns-admin-orders'],['Customers','ns-admin-customers'],['Enquiries','ns-admin-enquiries'],['Audit','ns-admin-audit'],['Products & Inventory','ns-admin-products'],['Website & Content','nsAdminWebsiteDirectory']];
    nav.innerHTML=items.map(([label,id])=>`<button type="button" data-ns-admin-target="${id}">${label}</button>`).join('');
    top.insertAdjacentElement('afterend',nav);
    nav.addEventListener('click',e=>{const b=e.target.closest('[data-ns-admin-target]');if(b)scrollToTarget(b.dataset.nsAdminTarget);});
  }

  function unify(){
    injectStyles();
    markTargets();
    injectDirectory();
    injectNav();
    guardDeadButtons();
  }

  function expose(){
    window.NSV421Admin={
      ready:true,
      announce,
      refresh:()=>{unify();window.dispatchEvent(new CustomEvent('ns:admin-refresh'));},
      publicPages:PUBLIC_PAGES.map(x=>({name:x[0],file:x[1],type:x[2]})),
      homepageSections:[...HOME_SECTIONS],
      version:'42.1-unified-admin'
    };
    window.dispatchEvent(new CustomEvent('ns:admin-ready',{detail:{version:'42.1-unified-admin'}}));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{unify();expose();},{once:true});
  else {unify();expose();}
}
export {};
