/* Nariyal Sutra V42.1 — private Admin acquisition reporting.
   Counts submitted orders/enquiries only. It never presents these records as
   website visitors or sessions, and legacy records are never guessed. */
(function(){
  'use strict';
  if(window.__NS_ADMIN_ATTRIBUTION__)return;
  window.__NS_ADMIN_ATTRIBUTION__=true;

  const SDK='12.18.0';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LEGACY_LABELS={google_search:'Google Search',ai_assistant:'AI assistant',word_of_mouth:'Word of mouth / referral',social_media:'Social media',whatsapp_telegram:'WhatsApp / Telegram',returning_customer:'Returning customer',business_event_referral:'Business / event / hospitality referral',other:'Other',prefer_not_to_say:'Prefer not to say'};
  let stopOrders=null,stopInquiries=null,orders=[],inquiries=[],errors={};

  function ensureStyles(){
    if($('#nsAttributionAdminStyle'))return;
    const s=document.createElement('style');s.id='nsAttributionAdminStyle';s.textContent=`
      .ns-acq-panel{margin-top:22px;border:1px solid var(--line);background:linear-gradient(150deg,rgba(17,37,11,.84),rgba(8,18,5,.96));overflow:hidden}
      .ns-acq-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:20px;border-bottom:1px solid var(--line);flex-wrap:wrap}.ns-acq-head h2{font-family:'Playfair Display',serif;font-size:30px;font-weight:500;margin:4px 0 7px}.ns-acq-head p{font-size:11px;line-height:1.7;color:var(--muted);max-width:780px}
      .ns-acq-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line)}.ns-acq-kpi{background:#0b1807;padding:16px}.ns-acq-kpi small{display:block;font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted)}.ns-acq-kpi strong{display:block;margin-top:7px;font:500 24px/1 'Playfair Display',serif;color:#fff}.ns-acq-kpi span{display:block;margin-top:5px;font-size:9px;color:rgba(255,255,255,.38)}
      .ns-acq-body{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(340px,.95fr);gap:0}.ns-acq-col{padding:18px}.ns-acq-col+.ns-acq-col{border-left:1px solid var(--line)}.ns-acq-subhead{margin:17px 0 6px;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#d4a843}
      .ns-acq-row{display:grid;grid-template-columns:minmax(150px,1fr) 2fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.045)}.ns-acq-row:last-child{border-bottom:0}.ns-acq-label{font-size:10px;color:rgba(255,255,255,.75);text-transform:capitalize}.ns-acq-bar{height:7px;background:rgba(255,255,255,.055);overflow:hidden}.ns-acq-bar i{display:block;height:100%;background:linear-gradient(90deg,#8fae50,#d4a843);min-width:2px}.ns-acq-count{font-size:10px;color:#f5d17e;white-space:nowrap}
      .ns-acq-recent{display:grid;gap:7px}.ns-acq-order{padding:10px;border:1px solid rgba(255,255,255,.055);display:grid;grid-template-columns:1fr auto;gap:7px}.ns-acq-order b{font-size:10px}.ns-acq-order span{display:block;margin-top:3px;font-size:9px;color:var(--muted)}.ns-acq-order em{font-style:normal;color:#f5d17e;font-size:9px;text-align:right}.ns-acq-empty{padding:16px;color:var(--muted);font-size:11px;line-height:1.7}.ns-acq-note{padding:12px 18px;border-top:1px solid var(--line);font-size:9px;line-height:1.6;color:var(--muted)}
      @media(max-width:900px){.ns-acq-kpis{grid-template-columns:1fr 1fr}.ns-acq-body{grid-template-columns:1fr}.ns-acq-col+.ns-acq-col{border-left:0;border-top:1px solid var(--line)}}
    `;document.head.appendChild(s);
  }
  function ensurePanel(){
    if($('#nsAdminAcquisition'))return $('#nsAdminAcquisition');
    const shell=$('main.shell');if(!shell)return null;ensureStyles();
    const panel=document.createElement('section');panel.id='nsAdminAcquisition';panel.className='ns-acq-panel';
    panel.innerHTML=`<div class="ns-acq-head"><div><div class="eyebrow">Customer Acquisition</div><h2>How customers found Nariyal Sutra.</h2><p>Private first-touch, last-touch and customer-reported context attached to submitted orders and enquiries. Historical records without the contract remain clearly marked as unattributed.</p></div></div><div id="nsAcqContent" class="ns-acq-empty">Waiting for authenticated order and enquiry data…</div>`;
    const firstPanel=shell.querySelector('section.panel');if(firstPanel)firstPanel.insertAdjacentElement('afterend',panel);else shell.prepend(panel);
    const nav=$('#nsUnifiedAdminNav');if(nav&&!nav.querySelector('[data-ns-admin-target="nsAdminAcquisition"]')){const b=document.createElement('button');b.type='button';b.dataset.nsAdminTarget='nsAdminAcquisition';b.textContent='Acquisition';b.addEventListener('click',()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));nav.appendChild(b);}return panel;
  }
  function createdMs(o){const t=o?.createdAt;if(t&&typeof t.toMillis==='function')return t.toMillis();if(t&&typeof t.seconds==='number')return t.seconds*1000;const d=Date.parse(t||'');return Number.isFinite(d)?d:0;}
  function titleCase(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
  function landingLabel(path){const key=String(path||'/').split(/[?#]/)[0].split('/').filter(Boolean).pop()||'Home';return key==='index.html'?'Home':titleCase(key.replace(/\.html$/,'').replaceAll('-',' '));}
  function touchLabel(t){
    if(!t)return '';
    const source=String(t.source||'').trim(),classification=String(t.classification||'').trim();
    if(classification==='direct')return 'Direct';
    if(classification==='organic_search')return (source==='google'?'Google':titleCase(source||'Search'))+' Organic';
    if(classification==='paid_campaign')return titleCase(source||'Campaign')+' Campaign';
    if(classification==='social')return titleCase(source||'Social');
    if(classification==='whatsapp')return 'WhatsApp';
    if(classification==='email')return 'Email';
    if(classification==='referral')return titleCase(source||'Website')+' Referral';
    return titleCase(source||classification||'Other');
  }
  function acquisitionOf(o){return o?.acquisition&&Number(o.acquisition.version)===2?o.acquisition:null;}
  function sourceLabel(o){const a=acquisitionOf(o);if(a?.firstTouch)return touchLabel(a.firstTouch);const legacy=String(o?.acquisitionSource||'');return o?.acquisitionSourceLabel||o?.acquisition?.label||LEGACY_LABELS[legacy]||'';}
  function detailLine(o){
    const a=acquisitionOf(o);if(!a)return String(o?.acquisitionDetail||'').trim();
    const first=a.firstTouch||{},bits=[landingLabel(first.landingPath)];if(first.campaign)bits.push('Campaign: '+first.campaign);if(first.referrerHost)bits.push(first.referrerHost);if(a.reportedSourceLabel)bits.push('Customer: '+a.reportedSourceLabel+(a.reportedDetail?' · '+a.reportedDetail:''));return bits.filter(Boolean).join(' · ');
  }
  function records(){
    return [
      ...orders.map(o=>({...o,_kind:'Order',_id:o.orderId||o.id||'Order'})),
      ...inquiries.map(o=>({...o,_kind:'Enquiry',_id:o.inquiryId||o.id||'Enquiry'}))
    ];
  }
  function render(){
    const root=$('#nsAcqContent');if(!root)return;const all=records(),attributed=all.filter(sourceLabel),counts={};
    attributed.forEach(o=>{const key=sourceLabel(o);counts[key]=(counts[key]||0)+1;});
    const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),top=ranked[0]||['Unattributed',0],max=Math.max(1,...ranked.map(x=>x[1]));
    const now=Date.now(),last30=all.filter(o=>createdMs(o)>=now-30*86400000),last30Attr=last30.filter(sourceLabel),coverage=all.length?Math.round(attributed.length/all.length*100):0;
    const rows=ranked.length?ranked.map(([label,n])=>`<div class="ns-acq-row"><div class="ns-acq-label">${esc(label)}</div><div class="ns-acq-bar"><i style="width:${Math.max(2,n/max*100)}%"></i></div><div class="ns-acq-count">${n} · ${attributed.length?Math.round(n/attributed.length*100):0}%</div></div>`).join(''):'<div class="ns-acq-empty">No attributed orders or enquiries yet.</div>';
    const campaigns={};for(const o of attributed){const c=String(acquisitionOf(o)?.firstTouch?.campaign||'').trim();if(c)campaigns[c]=(campaigns[c]||0)+1;}const campaignRows=Object.entries(campaigns).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([c,n])=>`<div class="ns-acq-row"><div class="ns-acq-label">${esc(c)}</div><div class="ns-acq-bar"><i style="width:${Math.max(2,n/Math.max(1,...Object.values(campaigns))*100)}%"></i></div><div class="ns-acq-count">${n}</div></div>`).join('')||'<div class="ns-acq-empty">No submitted record contains a campaign label yet.</div>';
    const recent=attributed.sort((a,b)=>createdMs(b)-createdMs(a)).slice(0,10),recentHtml=recent.length?recent.map(o=>`<div class="ns-acq-order"><div><b>${esc(o._kind)} · ${esc(o._id)} · ${esc(o.customerName||o.name||'Customer')}</b><span>${esc(sourceLabel(o))}${detailLine(o)?' · '+esc(detailLine(o)):''}</span></div><em>${esc(o.city||o.destinationDisplay||o.destination||'')}</em></div>`).join(''):'<div class="ns-acq-empty">New attributed orders and enquiries will appear here.</div>';
    root.className='';root.innerHTML=`<div class="ns-acq-kpis"><div class="ns-acq-kpi"><small>Submitted records</small><strong>${all.length}</strong><span>${orders.length} orders · ${inquiries.length} enquiries</span></div><div class="ns-acq-kpi"><small>Attribution coverage</small><strong>${coverage}%</strong><span>${attributed.length} attributed records</span></div><div class="ns-acq-kpi"><small>Top source</small><strong style="font-size:17px;line-height:1.15">${esc(top[0])}</strong><span>${top[1]} submitted records</span></div><div class="ns-acq-kpi"><small>Last 30 days</small><strong>${last30Attr.length}</strong><span>${last30.length} submitted records</span></div></div><div class="ns-acq-body"><div class="ns-acq-col"><div class="eyebrow">Acquired orders & enquiries by source</div>${rows}<div class="ns-acq-subhead">Top campaigns</div>${campaignRows}</div><div class="ns-acq-col"><div class="eyebrow">Recent attributed records</div><div class="ns-acq-recent">${recentHtml}</div></div></div><div class="ns-acq-note">These figures count submitted orders and enquiries stored in the private business system. They are not website visitor, session or traffic totals. Use GA4 for visitor-level analytics.</div>`;
    if(errors.orders||errors.inquiries)root.insertAdjacentHTML('beforeend',`<div class="ns-acq-note">Partial data: ${esc([errors.orders,errors.inquiries].filter(Boolean).join(' · '))}</div>`);
  }
  function clearListeners(){if(stopOrders){stopOrders();stopOrders=null;}if(stopInquiries){stopInquiries();stopInquiries=null;}orders=[];inquiries=[];errors={};}
  async function connect(){
    ensurePanel();
    try{
      const [{getApps,getApp},{getAuth,onAuthStateChanged},{getFirestore,collection,query,orderBy,limit,onSnapshot}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-app.js'),import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-firestore.js')
      ]);
      let tries=0;while(!getApps().length&&tries<40){await new Promise(r=>setTimeout(r,250));tries++;}if(!getApps().length)throw new Error('Firebase app not initialized');
      const app=getApp(),auth=getAuth(app),db=getFirestore(app);
      onAuthStateChanged(auth,user=>{
        clearListeners();
        if(!user){const r=$('#nsAcqContent');if(r){r.className='ns-acq-empty';r.textContent='Sign in to view private customer acquisition reporting.';}return;}
        stopOrders=onSnapshot(query(collection(db,'orders'),orderBy('createdAt','desc'),limit(500)),snap=>{orders=snap.docs.map(d=>({id:d.id,...d.data()}));delete errors.orders;render();},err=>{errors.orders='Orders unavailable: '+String(err?.message||err);render();});
        stopInquiries=onSnapshot(query(collection(db,'inquiries'),orderBy('createdAt','desc'),limit(500)),snap=>{inquiries=snap.docs.map(d=>({id:d.id,...d.data()}));delete errors.inquiries;render();},err=>{errors.inquiries='Enquiries unavailable: '+String(err?.message||err);render();});
      });
    }catch(err){const r=$('#nsAcqContent');if(r){r.className='ns-acq-empty';r.textContent='Acquisition reporting could not initialize: '+String(err?.message||err);}}
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',connect,{once:true}):connect();
})();
