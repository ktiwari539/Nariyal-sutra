/* Nariyal Sutra V42.1 — Admin customer acquisition reporting.
   Reads the same private /orders collection already used by the Owner Portal and
   summarizes the self-reported checkout source. Legacy orders remain visible as
   Unattributed rather than being guessed. */
(function(){
  'use strict';
  if(window.__NS_ADMIN_ATTRIBUTION__) return;
  window.__NS_ADMIN_ATTRIBUTION__=true;

  const SDK='12.18.0';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LABELS={
    google_search:'Google Search',
    ai_assistant:'AI assistant',
    word_of_mouth:'Word of mouth / referral',
    social_media:'Social media',
    whatsapp_telegram:'WhatsApp / Telegram',
    returning_customer:'Returning customer',
    business_event_referral:'Business / event / hospitality referral',
    other:'Other',
    prefer_not_to_say:'Prefer not to say',
    unattributed:'Unattributed / legacy'
  };
  let stopOrders=null;

  function ensureStyles(){
    if($('#nsAttributionAdminStyle')) return;
    const s=document.createElement('style');
    s.id='nsAttributionAdminStyle';
    s.textContent=`
      .ns-acq-panel{margin-top:22px;border:1px solid var(--line);background:linear-gradient(150deg,rgba(17,37,11,.84),rgba(8,18,5,.96));overflow:hidden}
      .ns-acq-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:20px;border-bottom:1px solid var(--line);flex-wrap:wrap}
      .ns-acq-head h2{font-family:'Playfair Display',serif;font-size:30px;font-weight:500;margin:4px 0 7px}.ns-acq-head p{font-size:11px;line-height:1.7;color:var(--muted);max-width:760px}
      .ns-acq-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line)}
      .ns-acq-kpi{background:#0b1807;padding:16px}.ns-acq-kpi small{display:block;font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted)}.ns-acq-kpi strong{display:block;margin-top:7px;font:500 24px/1 'Playfair Display',serif;color:#fff}.ns-acq-kpi span{display:block;margin-top:5px;font-size:9px;color:rgba(255,255,255,.38)}
      .ns-acq-body{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(340px,.95fr);gap:0}.ns-acq-col{padding:18px}.ns-acq-col+.ns-acq-col{border-left:1px solid var(--line)}
      .ns-acq-row{display:grid;grid-template-columns:minmax(150px,1fr) 2fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.045)}.ns-acq-row:last-child{border-bottom:0}.ns-acq-label{font-size:10px;color:rgba(255,255,255,.75)}.ns-acq-bar{height:7px;background:rgba(255,255,255,.055);overflow:hidden}.ns-acq-bar i{display:block;height:100%;background:linear-gradient(90deg,#8fae50,#d4a843);min-width:2px}.ns-acq-count{font-size:10px;color:#f5d17e;white-space:nowrap}
      .ns-acq-recent{display:grid;gap:7px}.ns-acq-order{padding:10px;border:1px solid rgba(255,255,255,.055);display:grid;grid-template-columns:1fr auto;gap:7px}.ns-acq-order b{font-size:10px}.ns-acq-order span{font-size:9px;color:var(--muted)}.ns-acq-order em{font-style:normal;color:#f5d17e;font-size:9px;text-align:right}.ns-acq-empty{padding:16px;color:var(--muted);font-size:11px;line-height:1.7}
      @media(max-width:900px){.ns-acq-kpis{grid-template-columns:1fr 1fr}.ns-acq-body{grid-template-columns:1fr}.ns-acq-col+.ns-acq-col{border-left:0;border-top:1px solid var(--line)}}
    `;
    document.head.appendChild(s);
  }

  function ensurePanel(){
    if($('#nsAdminAcquisition')) return $('#nsAdminAcquisition');
    const shell=$('main.shell'); if(!shell) return null;
    ensureStyles();
    const panel=document.createElement('section');
    panel.id='nsAdminAcquisition';panel.className='ns-acq-panel';
    panel.innerHTML=`<div class="ns-acq-head"><div><div class="eyebrow">Customer Acquisition</div><h2>How customers found Nariyal Sutra.</h2><p>Self-reported source captured at checkout, combined with private campaign/referrer metadata on the order. We do not infer a source for historical orders that did not answer the question.</p></div></div><div id="nsAcqContent" class="ns-acq-empty">Waiting for authenticated order data…</div>`;
    const firstPanel=shell.querySelector('section.panel');
    if(firstPanel) firstPanel.insertAdjacentElement('afterend',panel); else shell.prepend(panel);
    const nav=$('#nsUnifiedAdminNav');
    if(nav&&!nav.querySelector('[data-ns-admin-target="nsAdminAcquisition"]')){
      const b=document.createElement('button');b.type='button';b.dataset.nsAdminTarget='nsAdminAcquisition';b.textContent='Acquisition';b.addEventListener('click',()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));nav.appendChild(b);
    }
    return panel;
  }

  function createdMs(o){
    const t=o?.createdAt;
    if(t&&typeof t.toMillis==='function') return t.toMillis();
    if(t&&typeof t.seconds==='number') return t.seconds*1000;
    const d=Date.parse(t||'');return Number.isFinite(d)?d:0;
  }
  function sourceOf(o){return String(o?.acquisitionSource||o?.acquisition?.source||'unattributed')||'unattributed';}
  function labelOf(o){const s=sourceOf(o);return o?.acquisitionSourceLabel||o?.acquisition?.label||LABELS[s]||s.replaceAll('_',' ');}
  function detailOf(o){return String(o?.acquisitionDetail||o?.acquisition?.detail||'').trim();}

  function render(orders){
    const root=$('#nsAcqContent');if(!root)return;
    const total=orders.length;
    const attributed=orders.filter(o=>sourceOf(o)!=='unattributed');
    const counts={};attributed.forEach(o=>{const s=sourceOf(o);counts[s]=(counts[s]||0)+1;});
    const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const top=ranked[0]||['unattributed',0];
    const now=Date.now(),since30=now-30*86400000;
    const last30=orders.filter(o=>createdMs(o)>=since30);
    const last30Attr=last30.filter(o=>sourceOf(o)!=='unattributed');
    const responseRate=total?Math.round(attributed.length/total*100):0;
    const max=Math.max(1,...ranked.map(x=>x[1]));
    const rows=ranked.length?ranked.map(([s,n])=>`<div class="ns-acq-row"><div class="ns-acq-label">${esc(LABELS[s]||s.replaceAll('_',' '))}</div><div class="ns-acq-bar"><i style="width:${Math.max(2,n/max*100)}%"></i></div><div class="ns-acq-count">${n} · ${attributed.length?Math.round(n/attributed.length*100):0}%</div></div>`).join(''):'<div class="ns-acq-empty">No attributed orders yet.</div>';
    const recent=orders.filter(o=>sourceOf(o)!=='unattributed').sort((a,b)=>createdMs(b)-createdMs(a)).slice(0,8);
    const recentHtml=recent.length?recent.map(o=>`<div class="ns-acq-order"><div><b>${esc(o.orderId||o.id||'Order')} · ${esc(o.customerName||o.name||'Customer')}</b><span>${esc(labelOf(o))}${detailOf(o)?' · '+esc(detailOf(o)):''}</span></div><em>${esc(o.city||o.destinationDisplay||'')}</em></div>`).join(''):'<div class="ns-acq-empty">New checkout answers will appear here.</div>';
    root.className='';
    root.innerHTML=`<div class="ns-acq-kpis"><div class="ns-acq-kpi"><small>Orders reviewed</small><strong>${total}</strong><span>Latest private order set</span></div><div class="ns-acq-kpi"><small>Source response rate</small><strong>${responseRate}%</strong><span>${attributed.length} attributed orders</span></div><div class="ns-acq-kpi"><small>Top source</small><strong style="font-size:17px;line-height:1.15">${esc(LABELS[top[0]]||top[0].replaceAll('_',' '))}</strong><span>${top[1]} attributed orders</span></div><div class="ns-acq-kpi"><small>Last 30 days</small><strong>${last30Attr.length}</strong><span>${last30.length} total orders in window</span></div></div><div class="ns-acq-body"><div class="ns-acq-col"><div class="eyebrow">Channel mix</div>${rows}</div><div class="ns-acq-col"><div class="eyebrow">Recent attributed orders</div><div class="ns-acq-recent">${recentHtml}</div></div></div>`;
  }

  async function connect(){
    ensurePanel();
    try{
      const [{getApps,getApp},{getAuth,onAuthStateChanged},{getFirestore,collection,query,orderBy,limit,onSnapshot}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-firestore.js')
      ]);
      let tries=0;
      while(!getApps().length&&tries<40){await new Promise(r=>setTimeout(r,250));tries++;}
      if(!getApps().length) throw new Error('Firebase app not initialized');
      const app=getApp(),auth=getAuth(app),db=getFirestore(app);
      onAuthStateChanged(auth,user=>{
        if(stopOrders){stopOrders();stopOrders=null;}
        if(!user){const r=$('#nsAcqContent');if(r){r.className='ns-acq-empty';r.textContent='Sign in to view private customer acquisition reporting.';}return;}
        const q=query(collection(db,'orders'),orderBy('createdAt','desc'),limit(500));
        stopOrders=onSnapshot(q,snap=>render(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>{const r=$('#nsAcqContent');if(r){r.className='ns-acq-empty';r.textContent='Acquisition reporting is unavailable for this role/session: '+String(err?.message||err);}});
      });
    }catch(err){const r=$('#nsAcqContent');if(r){r.className='ns-acq-empty';r.textContent='Acquisition reporting could not initialize: '+String(err?.message||err);}}
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',connect,{once:true}):connect();
})();
