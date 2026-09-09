/**
 * Nariyal Sutra — optional customer account layer (V42)
 *
 * Design goals:
 * - The storefront remains fully usable without signing in.
 * - Customer authentication never blocks guest checkout.
 * - Signed-in customers get profile, saved addresses, My Orders and secure guest-order claiming.
 * - Customer-facing order data lives in a sanitized /customerOrders/{uid}/orders subcollection.
 * - The private operational /orders collection is never directly exposed to customers.
 */
(function(){
  'use strict';

  var SDK='12.18.0';
  var OWNER_WHATSAPP='919203831705';
  var ACCOUNT_HASH='#account';
  var MAX_ORDERS=25;

  var state={
    app:null,auth:null,db:null,authMod:null,fs:null,appMod:null,storage:null,storageMod:null,photoObjectUrl:'',
    user:null,profile:null,addresses:[],orders:[],
    authReady:false,authError:'',
    authTab:'signin',panelTab:'overview',
    orderUnsub:null,addressUnsub:null,
    drawerOpen:false,lastFocus:null,
    phoneStage:'',phoneConfirmation:null,phoneVerifier:null,phoneNumber:'',phonePendingName:''
  };

  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function clean(v,max){return String(v==null?'':v).trim().slice(0,max||500)}
  function digits(v){return String(v||'').replace(/\D/g,'')}
  function money(v){return '₹'+Number(v||0).toLocaleString('en-IN')}
  function siteOrigin(){return window.location.origin||'https://nariyal-sutra.netlify.app'}
  function accountUrl(){return siteOrigin()+'/#account'}
  function trackingUrl(token){return token?siteOrigin()+'/track?t='+encodeURIComponent(token):siteOrigin()+'/track'}
  function initials(name,email){var s=clean(name||email||'NS',80);var parts=s.split(/\s+/).filter(Boolean);return (parts.slice(0,2).map(function(x){return x.charAt(0).toUpperCase()}).join('')||'NS').slice(0,2)}
  function friendlyStatus(s){
    var map={pending:'Pending',confirmed:'Confirmed',preparing:'Preparing',ready_for_dispatch:'Ready for dispatch',out_for_delivery:'Out for delivery',arrived:'Almost there',delivered:'Delivered',cancelled:'Cancelled'};
    return map[s]||String(s||'Pending').replaceAll('_',' ');
  }
  function statusDetail(s){
    var map={pending:'Request received and awaiting review.',confirmed:'Confirmed and queued for preparation.',preparing:'Your coconuts are being selected and packed.',ready_for_dispatch:'Packed and ready to leave.',out_for_delivery:'Your order is on the way.',arrived:'Your delivery is nearby.',delivered:'Order delivered.',cancelled:'This order was cancelled.'};
    return map[s]||'Order status available.';
  }
  function fmtDate(v){try{var d=v&&v.toDate?v.toDate():new Date(v);return new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(d)}catch(e){return '—'}}
  function analytics(name,params){try{if(typeof window.nsAnalyticsEvent==='function')window.nsAnalyticsEvent(name,params||{})}catch(e){}}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg)}catch(e){}}

  function injectStyles(){
    if(byId('nsacct-style'))return;
    var style=document.createElement('style');style.id='nsacct-style';style.textContent=`
      .nsacct-overlay,.nsacct-overlay *,.nsacct-trigger,.nsacct-trigger *{box-sizing:border-box}
      .nsacct-trigger{border:1px solid rgba(212,168,67,.28);background:rgba(212,168,67,.06);color:#fff;min-height:40px;padding:0 14px;border-radius:999px;font:500 10px/1 'Jost',sans-serif;letter-spacing:1.2px;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.2s;white-space:nowrap;flex:0 0 auto}
      .nsacct-trigger:hover,.nsacct-trigger:focus-visible{border-color:rgba(212,168,67,.7);background:rgba(212,168,67,.13);outline:none;transform:translateY(-1px)}
      .nsacct-trigger .nsacct-dot{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#D4A843,#F5D17E);color:#071104;font-size:10px;font-weight:700;letter-spacing:0;text-transform:none;box-shadow:0 5px 18px rgba(212,168,67,.22)}
      .nsacct-trigger .nsacct-trigger-text{max-width:90px;overflow:hidden;text-overflow:ellipsis}
      html.nsacct-lock,html.nsacct-lock body{overflow:hidden!important}
      .nsacct-overlay{position:fixed;inset:0;z-index:12000;display:none}
      .nsacct-overlay.open{display:block}
      .nsacct-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);animation:nsacctFade .18s ease-out}
      .nsacct-panel{position:absolute;top:0;right:0;width:min(520px,100%);height:100%;background:radial-gradient(circle at 95% 0,rgba(212,168,67,.12),transparent 32%),linear-gradient(180deg,#0b1b07 0%,#061103 100%);border-left:1px solid rgba(212,168,67,.18);box-shadow:-28px 0 90px rgba(0,0,0,.5);overflow:auto;color:#fdf7e8;animation:nsacctSlide .24s ease-out}
      @keyframes nsacctFade{from{opacity:0}to{opacity:1}} @keyframes nsacctSlide{from{transform:translateX(26px);opacity:.2}to{transform:none;opacity:1}}
      .nsacct-head{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;padding:19px 22px;background:rgba(7,17,4,.9);backdrop-filter:blur(16px);border-bottom:1px solid rgba(212,168,67,.12)}
      .nsacct-brand{font:600 10px/1 'Jost',sans-serif;letter-spacing:3px;text-transform:uppercase;color:#D4A843}.nsacct-brand b{display:block;margin-top:7px;font:400 19px/1.15 'Playfair Display',serif;letter-spacing:.2px;color:#fff;text-transform:none}
      .nsacct-close{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:#fff;font-size:20px;cursor:pointer;transition:.2s}.nsacct-close:hover,.nsacct-close:focus-visible{border-color:#D4A843;color:#D4A843;outline:none}
      .nsacct-body{padding:22px 22px 38px}.nsacct-kicker{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#D4A843;margin-bottom:8px}.nsacct-title{font:400 31px/1.1 'Playfair Display',serif;color:#fff}.nsacct-sub{font-size:12px;line-height:1.8;color:rgba(255,255,255,.58);margin-top:10px}
      .nsacct-card{background:rgba(255,255,255,.035);border:1px solid rgba(212,168,67,.13);border-radius:16px;padding:18px;margin-top:16px}.nsacct-card.soft{background:rgba(212,168,67,.055)}
      .nsacct-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.nsacct-benefit{padding:12px 9px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.025);text-align:center;font-size:10px;line-height:1.45;color:rgba(255,255,255,.62)}.nsacct-benefit b{display:block;color:#fff;font-size:11px;margin-top:6px}
      .nsacct-visual{position:relative;height:150px;margin-top:16px;overflow:hidden;border-radius:14px;border:1px solid rgba(212,168,67,.16);background:#050b04}.nsacct-visual img{width:100%;height:100%;object-fit:cover;object-position:center 57%;display:block}.nsacct-visual:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,10,2,.78),rgba(3,10,2,.1) 72%)}.nsacct-visual-copy{position:absolute;z-index:2;left:16px;bottom:14px;right:16px;color:#fff;font:400 17px/1.1 'Playfair Display',serif}.nsacct-visual-copy span{display:block;margin-bottom:5px;color:#D4A843;font:600 8px/1 'Jost',sans-serif;letter-spacing:2px;text-transform:uppercase}
      .nsacct-switch,.nsacct-tabs{display:flex;gap:7px;padding:5px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.07);border-radius:12px;margin-top:18px}.nsacct-switch button,.nsacct-tabs button{flex:1;border:0;background:transparent;color:rgba(255,255,255,.5);padding:10px 8px;border-radius:8px;font:600 9px/1 'Jost',sans-serif;letter-spacing:1.3px;text-transform:uppercase;cursor:pointer}.nsacct-switch button.active,.nsacct-tabs button.active{background:rgba(212,168,67,.14);color:#F5D17E;box-shadow:inset 0 0 0 1px rgba(212,168,67,.18)}
      .nsacct-provider-stack{display:grid;gap:8px;margin-top:18px}.nsacct-provider{width:100%;min-height:46px;border:1px solid rgba(255,255,255,.13);border-radius:11px;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;gap:10px;font:600 11px/1 'Jost',sans-serif;letter-spacing:.25px;cursor:pointer;transition:.2s}.nsacct-provider:hover,.nsacct-provider:focus-visible{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,.2);outline:none}.nsacct-provider.google{background:#fff;color:#202124}.nsacct-provider.apple{background:#050505;color:#fff;border-color:rgba(255,255,255,.3)}.nsacct-provider.phone{background:rgba(212,168,67,.09);color:#F5D17E;border-color:rgba(212,168,67,.28)}.nsacct-provider-mark{width:20px;height:20px;display:grid;place-items:center;font:700 15px/1 Arial,sans-serif}.nsacct-or{display:flex;align-items:center;gap:10px;margin:16px 0 2px;color:rgba(255,255,255,.35);font-size:8px;letter-spacing:1.5px;text-transform:uppercase}.nsacct-or:before,.nsacct-or:after{content:"";height:1px;background:rgba(255,255,255,.08);flex:1}.nsacct-phone-card{margin-top:14px;padding:14px;border:1px solid rgba(212,168,67,.16);border-radius:12px;background:rgba(212,168,67,.045)}#nsacct-recaptcha{min-height:1px}.nsacct-provider-note{font-size:9px;line-height:1.55;color:rgba(255,255,255,.38);text-align:center;margin-top:10px}.nsacct-id-badge{display:inline-flex;align-items:center;gap:6px;margin:5px 5px 0 0;padding:5px 8px;border:1px solid rgba(255,255,255,.08);border-radius:999px;color:rgba(255,255,255,.58);font-size:8px;letter-spacing:.7px;text-transform:uppercase}
      .nsacct-form{display:grid;gap:11px;margin-top:15px}.nsacct-grid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}.nsacct-field label{display:block;margin-bottom:6px;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.48)}.nsacct-field input,.nsacct-field select,.nsacct-field textarea{width:100%;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(0,0,0,.22);color:#fff;padding:12px 13px;font:400 13px/1.3 'Jost',sans-serif;outline:none}.nsacct-field textarea{min-height:82px;resize:vertical}.nsacct-field input:focus,.nsacct-field select:focus,.nsacct-field textarea:focus{border-color:rgba(212,168,67,.6);box-shadow:0 0 0 3px rgba(212,168,67,.08)}
      .nsacct-check{display:flex;gap:9px;align-items:flex-start;font-size:11px;line-height:1.55;color:rgba(255,255,255,.55)}.nsacct-check input{margin-top:3px}.nsacct-check a,.nsacct-link{color:#F5D17E;text-decoration:none}.nsacct-link:hover{text-decoration:underline}
      .nsacct-btn{border:1px solid rgba(212,168,67,.26);background:rgba(212,168,67,.09);color:#fff;border-radius:10px;padding:12px 14px;font:600 9px/1 'Jost',sans-serif;letter-spacing:1.4px;text-transform:uppercase;cursor:pointer;transition:.2s}.nsacct-btn:hover,.nsacct-btn:focus-visible{background:rgba(212,168,67,.16);border-color:rgba(212,168,67,.65);outline:none}.nsacct-btn.primary{background:linear-gradient(90deg,#D4A843,#F5D17E);color:#071104;border-color:transparent}.nsacct-btn.ghost{background:transparent;border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.72)}.nsacct-btn.danger{background:rgba(255,92,92,.07);border-color:rgba(255,92,92,.2);color:#ffb0b0}.nsacct-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}.nsacct-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.nsacct-actions .nsacct-btn{flex:1;min-width:125px}
      .nsacct-msg{display:none;margin-top:12px;padding:11px 12px;border-radius:10px;font-size:11px;line-height:1.55}.nsacct-msg.show{display:block}.nsacct-msg.ok{background:rgba(82,174,57,.09);border:1px solid rgba(82,174,57,.22);color:#cdebc4}.nsacct-msg.warn{background:rgba(212,168,67,.08);border:1px solid rgba(212,168,67,.2);color:#f5d99d}.nsacct-msg.err{background:rgba(255,92,92,.08);border:1px solid rgba(255,92,92,.2);color:#ffc0c0}
      .nsacct-divider{height:1px;background:rgba(255,255,255,.07);margin:17px 0}.nsacct-mini{font-size:10px;line-height:1.65;color:rgba(255,255,255,.42)}
      .nsacct-userhead{display:flex;gap:13px;align-items:center}.nsacct-avatar{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;background:linear-gradient(135deg,#D4A843,#F5D17E);color:#071104;font:700 16px/1 'Jost',sans-serif;box-shadow:0 8px 26px rgba(212,168,67,.18);overflow:hidden}.nsacct-avatar img{width:100%;height:100%;object-fit:cover;display:block}.nsacct-photo-row{display:flex;align-items:center;gap:14px;padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}.nsacct-photo-preview{width:74px;height:74px;border-radius:50%;overflow:hidden;background:rgba(212,168,67,.12);display:grid;place-items:center;color:#F5D17E;font-weight:700;flex:0 0 auto}.nsacct-photo-preview img{width:100%;height:100%;object-fit:cover}.nsacct-prefgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.nsacct-prefgrid label{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.02);font-size:10px;color:rgba(255,255,255,.65);display:flex;align-items:center;gap:7px}.nsacct-profile-note{padding:11px 12px;border-left:2px solid #D4A843;background:rgba(212,168,67,.05);font-size:10px;line-height:1.6;color:rgba(255,255,255,.5)}.nsacct-userhead h2{font:400 24px/1.15 'Playfair Display',serif}.nsacct-userhead p{font-size:11px;color:rgba(255,255,255,.5);margin-top:5px}.nsacct-verify{display:inline-flex;margin-top:7px;padding:5px 8px;border-radius:999px;font-size:8px;letter-spacing:1px;text-transform:uppercase;background:rgba(212,168,67,.09);color:#F5D17E;border:1px solid rgba(212,168,67,.18)}.nsacct-verify.ok{background:rgba(82,174,57,.09);border-color:rgba(82,174,57,.2);color:#bce3b0}
      .nsacct-sectiontitle{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 10px}.nsacct-sectiontitle h3{font:400 18px/1.2 'Playfair Display',serif}.nsacct-sectiontitle span{font-size:9px;color:rgba(255,255,255,.4);letter-spacing:1px;text-transform:uppercase}
      .nsacct-order{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:15px;background:rgba(255,255,255,.025);margin-top:9px}.nsacct-order.active{border-color:rgba(212,168,67,.24);background:linear-gradient(135deg,rgba(212,168,67,.07),rgba(255,255,255,.02))}.nsacct-order-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.nsacct-order-id{font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:#D4A843}.nsacct-order-name{font-size:13px;color:#fff;margin-top:5px;line-height:1.35}.nsacct-order-meta{font-size:10px;color:rgba(255,255,255,.45);margin-top:6px;line-height:1.5}.nsacct-status{flex:0 0 auto;padding:6px 8px;border-radius:999px;font-size:8px;letter-spacing:.9px;text-transform:uppercase;background:rgba(212,168,67,.09);border:1px solid rgba(212,168,67,.18);color:#F5D17E}.nsacct-status.delivered{background:rgba(82,174,57,.08);border-color:rgba(82,174,57,.2);color:#bce3b0}.nsacct-status.cancelled{background:rgba(255,92,92,.08);border-color:rgba(255,92,92,.2);color:#ffc0c0}
      .nsacct-order-progress{display:flex;gap:4px;margin-top:12px}.nsacct-order-progress i{height:3px;flex:1;border-radius:5px;background:rgba(255,255,255,.08)}.nsacct-order-progress i.done{background:#D4A843}.nsacct-order-progress i.cancelled{background:#d75e5e}
      .nsacct-order-actions{display:flex;gap:7px;margin-top:12px}.nsacct-order-actions .nsacct-btn{padding:9px 10px;font-size:8px;flex:1}
      .nsacct-empty{padding:24px 14px;text-align:center;border:1px dashed rgba(255,255,255,.12);border-radius:14px;color:rgba(255,255,255,.5);font-size:11px;line-height:1.7}.nsacct-empty b{display:block;color:#fff;font:400 17px/1.2 'Playfair Display',serif;margin-bottom:7px}
      .nsacct-address{padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:13px;margin-top:9px;background:rgba(255,255,255,.025)}.nsacct-address-head{display:flex;justify-content:space-between;gap:10px}.nsacct-address-title{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#D4A843}.nsacct-address p{font-size:11px;color:rgba(255,255,255,.55);line-height:1.6;margin-top:6px}.nsacct-default{font-size:8px;padding:4px 7px;border-radius:999px;background:rgba(82,174,57,.08);color:#bce3b0;border:1px solid rgba(82,174,57,.16)}
      .nsacct-order-context{display:none;margin:0 0 18px;padding:11px 13px;border-radius:10px;border:1px solid rgba(212,168,67,.16);background:rgba(212,168,67,.045);font-size:11px;color:rgba(255,255,255,.62);align-items:center;justify-content:space-between;gap:10px}.nsacct-order-context.show{display:flex}.nsacct-order-context b{color:#fff}.nsacct-order-context button{border:0;background:transparent;color:#F5D17E;font:600 9px/1 'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;white-space:nowrap}
      .nsacct-skeleton{height:12px;border-radius:8px;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.11),rgba(255,255,255,.04));background-size:200% 100%;animation:nsacctShimmer 1.3s linear infinite;margin:11px 0}@keyframes nsacctShimmer{to{background-position:-200% 0}}
      @media(max-width:1100px){.nsacct-trigger{padding:0 10px}.nsacct-trigger-text{display:none}.nsacct-trigger .nsacct-dot{width:27px;height:27px}}
      @media(max-width:760px){.nsacct-trigger{width:40px;height:40px;padding:0;justify-content:center;background:rgba(9,21,5,.78)}.nsacct-panel{width:100%}.nsacct-body{padding:19px 16px 34px}.nsacct-head{padding:16px}.nsacct-title{font-size:27px}.nsacct-benefits{grid-template-columns:1fr}.nsacct-grid2{grid-template-columns:1fr}.nsacct-tabs{overflow:auto}.nsacct-tabs button{min-width:88px}.nsacct-order-context{align-items:flex-start;flex-direction:column}}
      @media(prefers-reduced-motion:reduce){.nsacct-backdrop,.nsacct-panel,.nsacct-skeleton{animation:none!important}.nsacct-trigger,.nsacct-btn{transition:none!important}}
    `;document.head.appendChild(style);
  }

  function injectShell(){
    if(!byId('nsacct-trigger')){
      var nav=document.getElementById('nav');var cta=nav&&nav.querySelector('.nav-cta');
      if(nav){
        var trigger=document.createElement('button');trigger.type='button';trigger.id='nsacct-trigger';trigger.className='nsacct-trigger';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','nsacct-panel');trigger.setAttribute('aria-label','Open My Account');trigger.innerHTML='<span class="nsacct-dot">👤</span><span class="nsacct-trigger-text">My Account</span>';
        if(cta)nav.insertBefore(trigger,cta);else nav.appendChild(trigger);
      }
    }
    if(!byId('nsacct-overlay')){
      var wrap=document.createElement('div');wrap.id='nsacct-overlay';wrap.className='nsacct-overlay';wrap.setAttribute('aria-hidden','true');wrap.innerHTML='\
        <div class="nsacct-backdrop" data-nsacct-close></div>\
        <aside class="nsacct-panel" id="nsacct-panel" role="dialog" aria-modal="true" aria-labelledby="nsacct-dialog-title" tabindex="-1">\
          <div class="nsacct-head"><div class="nsacct-brand">Nariyal Sutra<b id="nsacct-dialog-title">My Account</b></div><button class="nsacct-close" type="button" data-nsacct-close aria-label="Close My Account">×</button></div>\
          <div class="nsacct-body" id="nsacct-body"></div>\
        </aside>';
      document.body.appendChild(wrap);
    }
    ensureOrderContext();
    bindShell();
  }

  function ensureOrderContext(){
    if(byId('nsacct-order-context'))return;
    var card=document.querySelector('#order .order-card');if(!card)return;
    var div=document.createElement('div');div.id='nsacct-order-context';div.className='nsacct-order-context';card.insertBefore(div,card.firstChild);
  }

  function bindShell(){
    var trigger=byId('nsacct-trigger');if(trigger&&!trigger.__nsacct){trigger.__nsacct=true;trigger.addEventListener('click',openDrawer)}
    var overlay=byId('nsacct-overlay');if(overlay&&!overlay.__nsacct){
      overlay.__nsacct=true;
      overlay.addEventListener('click',function(e){
        var close=e.target.closest('[data-nsacct-close]');if(close){closeDrawer();return}
        var action=e.target.closest('[data-nsacct-action]');if(action){handleAction(action.getAttribute('data-nsacct-action'),action);return}
        var authTab=e.target.closest('[data-nsacct-auth-tab]');if(authTab){state.authTab=authTab.getAttribute('data-nsacct-auth-tab');render();return}
        var panelTab=e.target.closest('[data-nsacct-tab]');if(panelTab){state.panelTab=panelTab.getAttribute('data-nsacct-tab');render();return}
      });
      overlay.addEventListener('submit',handleSubmit);
      overlay.addEventListener('change',function(e){if(e.target&&e.target.id==='nsacct-photo-input')handleProfilePhoto(e.target.files&&e.target.files[0]);});
    }
    document.addEventListener('keydown',function(e){
      if(!state.drawerOpen)return;
      if(e.key==='Escape'){e.preventDefault();closeDrawer();return}
      if(e.key==='Tab')trapFocus(e);
    });
    window.addEventListener('hashchange',function(){if(location.hash===ACCOUNT_HASH)openDrawer()});
    if(location.hash===ACCOUNT_HASH)setTimeout(openDrawer,450);
  }

  function openDrawer(){
    var overlay=byId('nsacct-overlay');if(!overlay)return;
    state.lastFocus=document.activeElement;state.drawerOpen=true;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.documentElement.classList.add('nsacct-lock');
    render();setTimeout(function(){var p=byId('nsacct-panel');if(p)p.focus({preventScroll:true})},0);analytics('customer_account_opened',{signed_in:!!state.user});
  }
  function closeDrawer(){
    var overlay=byId('nsacct-overlay');if(!overlay)return;state.drawerOpen=false;overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.documentElement.classList.remove('nsacct-lock');
    if(location.hash===ACCOUNT_HASH){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
    if(state.lastFocus&&typeof state.lastFocus.focus==='function')try{state.lastFocus.focus()}catch(e){}
  }
  function trapFocus(e){
    var panel=byId('nsacct-panel');if(!panel)return;var focusables=Array.from(panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function(x){return x.offsetParent!==null});if(!focusables.length)return;
    var first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }

  function renderBoot(){
    var body=byId('nsacct-body');if(!body)return;body.innerHTML='<div class="nsacct-kicker">Optional customer profile</div><div class="nsacct-title">Your Nariyal Sutra</div><p class="nsacct-sub">The full store stays available with or without an account. We are securely loading your profile options.</p><div class="nsacct-card"><div class="nsacct-skeleton" style="width:72%"></div><div class="nsacct-skeleton" style="width:92%"></div><div class="nsacct-skeleton" style="width:55%"></div></div>';
  }

  function render(){
    updateTrigger();updateOrderContext();
    if(!state.drawerOpen)return;
    if(!state.authReady&&!state.authError){renderBoot();return}
    if(state.authError&&!state.user){renderUnavailable();return}
    if(!state.user){renderSignedOut();return}
    renderSignedIn();
  }

  function renderUnavailable(){
    var body=byId('nsacct-body');if(!body)return;body.innerHTML='<div class="nsacct-kicker">Account service</div><div class="nsacct-title">Keep shopping normally</div><p class="nsacct-sub">Customer profiles are temporarily unavailable on this device. The storefront, guest checkout and WhatsApp ordering remain available.</p><div class="nsacct-card soft"><b style="font-size:13px">Nothing in your order journey is blocked.</b><p class="nsacct-mini" style="margin-top:8px">You can place an order as a guest and use your private tracking link. Try My Account again later.</p><div class="nsacct-actions"><button class="nsacct-btn primary" type="button" data-nsacct-action="continue-shopping">Continue shopping</button><a class="nsacct-btn ghost" style="text-align:center;text-decoration:none" href="/track">Track an order</a></div></div>';
  }

  function signedOutIntro(){return '<div class="nsacct-kicker">Optional customer profile</div><div class="nsacct-title">Your Nariyal Sutra</div><p class="nsacct-sub">The full storefront stays open to everyone. Sign in only when you want saved details, faster checkout and one place to manage your orders.</p><div class="nsacct-visual"><img src="assets/images/brand/coconut-premium.webp" alt="Fresh green coconut prepared for drinking" loading="lazy" decoding="async"><div class="nsacct-visual-copy"><span>One profile</span>Every order. Same storefront.</div></div>'}
  function accountBenefits(){return '<div class="nsacct-divider"></div><div class="nsacct-sectiontitle"><h3>Why create a profile?</h3><span>Optional convenience</span></div><div class="nsacct-benefits"><div class="nsacct-benefit">🥥<b>My Orders</b>Return anytime</div><div class="nsacct-benefit">📍<b>Saved Addresses</b>Faster checkout</div><div class="nsacct-benefit">↻<b>Reorder</b>Use today\'s price</div></div>'}
  function authProviderConfig(){return window.NS_CUSTOMER_AUTH_PROVIDERS||{}}
  function providerButtons(){
    var c=authProviderConfig(),buttons='';
    if(c.google)buttons+='<button type="button" class="nsacct-provider google" data-nsacct-action="google-signin"><span class="nsacct-provider-mark" aria-hidden="true">G</span><span>Continue with Google</span></button>';
    if(c.phone)buttons+='<button type="button" class="nsacct-provider phone" data-nsacct-action="phone-open"><span class="nsacct-provider-mark" aria-hidden="true">☎</span><span>Continue with Phone OTP</span></button>';
    if(c.apple)buttons+='<button type="button" class="nsacct-provider apple" data-nsacct-action="apple-signin"><span class="nsacct-provider-mark" aria-hidden="true"></span><span>Continue with Apple</span></button>';
    if(!buttons)return '';
    return '<div class="nsacct-provider-stack">'+buttons+'</div><div class="nsacct-provider-note">By continuing, you agree to our <a class="nsacct-link" href="/terms.html" target="_blank" rel="noopener">Terms</a> and <a class="nsacct-link" href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>. Guest shopping remains available.</div>';
  }
  function phoneAuthForm(){
    if(state.phoneStage==='code'){
      return '<div class="nsacct-phone-card"><div class="nsacct-kicker">Phone verification</div><b style="font-size:13px">Enter the 6-digit code sent to '+esc(state.phoneNumber)+'</b><form class="nsacct-form" id="nsacct-phone-code"><div class="nsacct-field"><label for="nsacct-phone-otp">Verification code</label><input id="nsacct-phone-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required placeholder="123456"></div><button class="nsacct-btn primary" type="submit">Verify & sign in</button><button class="nsacct-btn ghost" type="button" data-nsacct-action="phone-reset">Use another number</button></form></div>';
    }
    return '<div class="nsacct-phone-card"><div class="nsacct-kicker">Phone OTP</div><b style="font-size:13px">Sign in without a password.</b><p class="nsacct-mini" style="margin-top:7px">For Indian numbers you can enter a 10-digit mobile number; we will use +91 automatically.</p><form class="nsacct-form" id="nsacct-phone-send"><div class="nsacct-field"><label for="nsacct-phone-number">Mobile number</label><input id="nsacct-phone-number" type="tel" autocomplete="tel" maxlength="24" required placeholder="+91 98765 43210"></div><div class="nsacct-field"><label for="nsacct-phone-name">Full name <span style="opacity:.55">(first time only)</span></label><input id="nsacct-phone-name" type="text" autocomplete="name" maxlength="100" placeholder="Your name"></div><div id="nsacct-recaptcha"></div><button class="nsacct-btn primary" type="submit">Send OTP</button><button class="nsacct-btn ghost" type="button" data-nsacct-action="phone-reset">Use email instead</button></form></div>';
  }
  function renderSignedOut(){
    var body=byId('nsacct-body');if(!body)return;
    var login=state.authTab==='signin',providers=providerButtons();
    body.innerHTML=signedOutIntro()+providers+(state.phoneStage?phoneAuthForm():(providers?'<div class="nsacct-or">or use email</div>':'')+'<div class="nsacct-switch"><button type="button" data-nsacct-auth-tab="signin" class="'+(login?'active':'')+'">Sign in</button><button type="button" data-nsacct-auth-tab="signup" class="'+(!login?'active':'')+'">Create profile</button></div>'+(login?signinForm():signupForm()))+'<div id="nsacct-message" class="nsacct-msg"></div>'+accountBenefits()+'<div class="nsacct-divider"></div><div class="nsacct-card soft"><div class="nsacct-kicker">Already ordered as a guest?</div><b style="font-size:13px">Your private tracking link still works.</b><p class="nsacct-mini" style="margin-top:7px">You can track without an account. After creating a profile, you can also attach an existing guest order using that private link.</p><div class="nsacct-actions"><a href="/track" class="nsacct-btn ghost" style="text-align:center;text-decoration:none">Track order</a><button type="button" class="nsacct-btn ghost" data-nsacct-action="continue-shopping">Continue shopping</button></div></div>';
  }
  function signinForm(){return '<form class="nsacct-form" id="nsacct-signin"><div class="nsacct-field"><label for="nsacct-login-email">Email</label><input id="nsacct-login-email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="nsacct-field"><label for="nsacct-login-password">Password</label><input id="nsacct-login-password" type="password" autocomplete="current-password" required placeholder="Your password"></div><button class="nsacct-btn primary" type="submit">Sign in</button><button class="nsacct-btn ghost" type="button" data-nsacct-action="forgot-password">Forgot password?</button><p class="nsacct-mini">Signing in is optional. You can close this panel and continue shopping or ordering as a guest at any time.</p></form>'}
  function signupForm(){return '<form class="nsacct-form" id="nsacct-signup"><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-signup-name">Full name</label><input id="nsacct-signup-name" type="text" autocomplete="name" required maxlength="100" placeholder="Your name"></div><div class="nsacct-field"><label for="nsacct-signup-phone">Mobile / WhatsApp</label><input id="nsacct-signup-phone" type="tel" autocomplete="tel" required maxlength="24" placeholder="+91 ..."></div></div><div class="nsacct-field"><label for="nsacct-signup-email">Email</label><input id="nsacct-signup-email" type="email" autocomplete="email" required maxlength="160" placeholder="you@example.com"></div><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-signup-password">Password</label><input id="nsacct-signup-password" type="password" autocomplete="new-password" required minlength="8" placeholder="8+ characters"></div><div class="nsacct-field"><label for="nsacct-signup-confirm">Confirm password</label><input id="nsacct-signup-confirm" type="password" autocomplete="new-password" required minlength="8" placeholder="Repeat password"></div></div><label class="nsacct-check"><input id="nsacct-terms" type="checkbox" required><span>I agree to the <a href="/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label><button class="nsacct-btn primary" type="submit">Create my profile</button><p class="nsacct-mini">Your account is a convenience layer. The public website and guest checkout remain available even if you never create a profile.</p></form>'}


  function renderSignedIn(){
    var body=byId('nsacct-body');if(!body)return;var p=state.profile||{};var name=p.displayName||state.user.displayName||state.user.email||'Customer';
    var identity=state.user.email||state.user.phoneNumber||'';var hasEmail=!!state.user.email;var verified=hasEmail?!!state.user.emailVerified:!!state.user.phoneNumber;
    var avatar=(p.photoURL?'<img src="'+esc(p.photoURL)+'" alt="">':esc(initials(name,identity)));body.innerHTML='<div class="nsacct-userhead"><div class="nsacct-avatar" id="nsacct-avatar">'+avatar+'</div><div><div class="nsacct-kicker">Welcome back</div><h2>'+esc(name)+'</h2><p>'+esc(identity)+'</p><span class="nsacct-verify '+(verified?'ok':'')+'">'+(hasEmail?(verified?'Email verified':'Verify email'):'Phone verified')+'</span></div></div>'+(hasEmail&&!verified?'<div class="nsacct-msg warn show" style="margin-top:14px">Verify your email to strengthen account recovery. Your shopping and current orders are not blocked. <button type="button" data-nsacct-action="resend-verification" style="border:0;background:transparent;color:#F5D17E;cursor:pointer;padding:0;margin-left:4px">Resend verification</button></div>':'')+'<div class="nsacct-tabs"><button type="button" data-nsacct-tab="overview" class="'+(state.panelTab==='overview'?'active':'')+'">Overview</button><button type="button" data-nsacct-tab="orders" class="'+(state.panelTab==='orders'?'active':'')+'">Orders</button><button type="button" data-nsacct-tab="addresses" class="'+(state.panelTab==='addresses'?'active':'')+'">Addresses</button><button type="button" data-nsacct-tab="profile" class="'+(state.panelTab==='profile'?'active':'')+'">Profile</button></div><div id="nsacct-panel-content">'+renderPanelContent()+'</div><div id="nsacct-message" class="nsacct-msg"></div>';
  }

  function renderPanelContent(){
    if(state.panelTab==='orders')return ordersPanel();
    if(state.panelTab==='addresses')return addressesPanel();
    if(state.panelTab==='profile')return profilePanel();
    return overviewPanel();
  }
  function activeOrders(){return state.orders.filter(function(o){return !['delivered','cancelled'].includes(o.status)})}
  function overviewPanel(){
    var active=activeOrders()[0];var recent=state.orders.slice(0,3);var out='';
    out+='<div class="nsacct-sectiontitle"><h3>Your activity</h3><span>'+state.orders.length+' order'+(state.orders.length===1?'':'s')+'</span></div>';
    if(active)out+=orderCard(active,true);else out+='<div class="nsacct-empty"><b>No active order</b>When you place an order while signed in, it appears here automatically. Guest checkout remains available too.</div>';
    out+='<div class="nsacct-actions"><button class="nsacct-btn primary" type="button" data-nsacct-action="new-order">Place an order</button><button class="nsacct-btn ghost" type="button" data-nsacct-action="use-profile">Use saved details</button></div>';
    if(recent.length){out+='<div class="nsacct-sectiontitle"><h3>Recent orders</h3><button class="nsacct-btn ghost" style="padding:7px 9px" type="button" data-nsacct-action="show-orders">View all</button></div>'+recent.map(function(o){return orderCard(o,false)}).join('')}
    out+='<div class="nsacct-card soft"><div class="nsacct-kicker">Have an older guest order?</div><b style="font-size:13px">Attach it using its private tracking link.</b><p class="nsacct-mini" style="margin-top:7px">Only someone holding that unguessable private link can attach the order. Your internal order database stays private.</p><div class="nsacct-actions"><button class="nsacct-btn ghost" type="button" data-nsacct-action="show-orders">Add guest order</button><a class="nsacct-btn ghost" style="text-align:center;text-decoration:none" href="https://wa.me/'+OWNER_WHATSAPP+'" target="_blank" rel="noopener">WhatsApp support</a></div></div>';
    return out;
  }
  function ordersPanel(){
    var out='<div class="nsacct-sectiontitle"><h3>My Orders</h3><button class="nsacct-btn ghost" style="padding:7px 9px" type="button" data-nsacct-action="refresh-orders">Refresh status</button></div>';
    out+=state.orders.length?state.orders.map(function(o){return orderCard(o,false)}).join(''):'<div class="nsacct-empty"><b>No saved orders yet</b>Orders placed while signed in will appear here automatically.</div>';
    out+='<div class="nsacct-card soft"><div class="nsacct-kicker">Attach a guest order</div><p class="nsacct-mini">Paste the private tracking link from your order confirmation. We use the random tracking token as proof that you hold that order link.</p><form id="nsacct-claim" class="nsacct-form"><div class="nsacct-field"><label for="nsacct-claim-token">Private tracking link or token</label><input id="nsacct-claim-token" type="text" autocomplete="off" required placeholder="https://.../track?t=... or 48-character token"></div><button class="nsacct-btn primary" type="submit">Add to My Orders</button></form></div>';
    return out;
  }
  function progress(status){var steps=['pending','confirmed','preparing','ready_for_dispatch','out_for_delivery','delivered'];var idx=status==='arrived'?4:steps.indexOf(status);if(status==='cancelled')return '<div class="nsacct-order-progress">'+steps.map(function(){return '<i class="cancelled"></i>'}).join('')+'</div>';return '<div class="nsacct-order-progress">'+steps.map(function(_,i){return '<i class="'+(i<=idx?'done':'')+'"></i>'}).join('')+'</div>'}
  function orderCard(o,active){
    var st=o.status||'pending';var track=o.trackingToken?trackingUrl(o.trackingToken):'/track';var key=o.productKey||guessProductKey(o.productName);var totalText=Number(o.total||0)>0?money(o.total):(o.estimatedTotal||'Total confirmed separately');
    return '<div class="nsacct-order '+(active?'active':'')+'"><div class="nsacct-order-top"><div><div class="nsacct-order-id">'+esc(o.orderId||'Order')+'</div><div class="nsacct-order-name">'+esc(o.productName||'Nariyal Sutra order')+'</div><div class="nsacct-order-meta">'+esc(o.quantity||0)+' pieces · '+esc(totalText)+(o.createdAt?' · '+esc(fmtDate(o.createdAt)):'')+'</div></div><span class="nsacct-status '+(st==='delivered'?'delivered':st==='cancelled'?'cancelled':'')+'">'+esc(friendlyStatus(st))+'</span></div>'+progress(st)+'<div class="nsacct-order-meta" style="margin-top:9px">'+esc(statusDetail(st))+'</div><div class="nsacct-order-actions"><a class="nsacct-btn ghost" style="text-align:center;text-decoration:none" href="'+esc(track)+'" target="_blank" rel="noopener">Track</a>'+(st==='delivered'&&key?'<button class="nsacct-btn" type="button" data-nsacct-action="reorder" data-order-id="'+esc(o.orderId)+'">Reorder</button>':'')+'</div></div>';
  }
  function profilePanel(){
    var p=state.profile||{},loginIdentity=state.user.email||state.user.phoneNumber||'Authenticated account';
    var photo=p.photoURL?'<img src="'+esc(p.photoURL)+'" alt="Your profile photo">':esc(initials(p.displayName||state.user.displayName,loginIdentity));
    return '<div class="nsacct-sectiontitle"><h3>Your profile</h3><span>Contact · delivery · preferences</span></div>'+
      '<div class="nsacct-photo-row"><div class="nsacct-photo-preview" id="nsacct-photo-preview">'+photo+'</div><div style="flex:1"><b style="font-size:13px">Profile photo</b><p class="nsacct-mini" style="margin-top:5px">Visible only in your account and the private owner dashboard.</p><div class="nsacct-actions"><label class="nsacct-btn ghost" style="text-align:center;cursor:pointer">Upload photo<input id="nsacct-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>'+(p.photoPath?'<button class="nsacct-btn danger" type="button" data-nsacct-action="remove-photo">Remove</button>':'')+'</div></div></div>'+
      '<form id="nsacct-profile" class="nsacct-form"><div class="nsacct-field"><label>Login identity</label><input type="text" value="'+esc(loginIdentity)+'" readonly aria-readonly="true"></div>'+
      '<div class="nsacct-field"><label for="nsacct-profile-email">Contact email</label><input id="nsacct-profile-email" type="email" autocomplete="email" maxlength="160" placeholder="you@example.com" value="'+esc(p.contactEmail||p.email||state.user.email||'')+'"><p class="nsacct-mini" style="margin-top:5px">'+((p.emailVerified===true&&p.contactEmail&&p.email&&String(p.contactEmail).toLowerCase()===String(p.email).toLowerCase())?'Verified with your sign-in':'Saved for receipts and contact. A different contact email is not automatically verified.')+'</p></div>'+
      '<div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-profile-name">Full name</label><input id="nsacct-profile-name" type="text" autocomplete="name" maxlength="100" required value="'+esc(p.displayName||state.user.displayName||'')+'"></div><div class="nsacct-field"><label for="nsacct-profile-phone">Mobile / WhatsApp</label><input id="nsacct-profile-phone" type="tel" autocomplete="tel" maxlength="24" required value="'+esc(p.phone||state.user.phoneNumber||'')+'"></div></div>'+
      '<div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-pref-channel">Preferred contact</label><select id="nsacct-pref-channel"><option value="whatsapp" '+((p.preferredChannel||'whatsapp')==='whatsapp'?'selected':'')+'>WhatsApp</option><option value="email" '+(p.preferredChannel==='email'?'selected':'')+'>Email</option><option value="telegram" '+(p.preferredChannel==='telegram'?'selected':'')+'>Telegram</option><option value="any" '+(p.preferredChannel==='any'?'selected':'')+'>Any channel</option></select></div><div class="nsacct-field"><label for="nsacct-telegram">Telegram username <span style="opacity:.45">(optional)</span></label><input id="nsacct-telegram" type="text" maxlength="80" placeholder="@username" value="'+esc(p.telegramUsername||'')+'"><p class="nsacct-mini" style="margin-top:5px">Saved as a preference. Automated Telegram delivery remains disabled until a real Nariyal Sutra bot/chat link is connected.</p></div></div>'+
      '<div class="nsacct-field"><label>Order update channels</label><div class="nsacct-prefgrid"><label><input id="nsacct-notify-wa" type="checkbox" '+(p.notifyWhatsapp!==false?'checked':'')+'> WhatsApp</label><label><input id="nsacct-notify-email" type="checkbox" '+(p.notifyEmail!==false?'checked':'')+'> Email</label><label><input id="nsacct-notify-telegram" type="checkbox" '+(p.notifyTelegram===true?'checked':'')+'> Telegram preference</label></div></div>'+
      '<div class="nsacct-sectiontitle"><h3>Primary location</h3><span>For quicker delivery forms</span></div><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-primary-city">City</label><input id="nsacct-primary-city" type="text" maxlength="120" value="'+esc(p.primaryCity||'')+'"></div><div class="nsacct-field"><label for="nsacct-primary-state">State</label><input id="nsacct-primary-state" type="text" maxlength="100" value="'+esc(p.primaryState||'')+'"></div></div><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-primary-pin">PIN / Postal</label><input id="nsacct-primary-pin" type="text" maxlength="24" value="'+esc(p.primaryPin||'')+'"></div><div class="nsacct-field"><label for="nsacct-primary-country">Country</label><input id="nsacct-primary-country" type="text" maxlength="80" value="'+esc(p.primaryCountry||'India')+'"></div></div>'+
      '<div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-pref-product">Preferred product</label><select id="nsacct-pref-product"><option value="" '+(!p.preferredProduct?'selected':'')+'>No preference</option><option value="tender" '+(p.preferredProduct==='tender'?'selected':'')+'>Fresh Tender Coconut</option><option value="green" '+(p.preferredProduct==='green'?'selected':'')+'>Green Round Coconut</option><option value="bulk" '+(p.preferredProduct==='bulk'?'selected':'')+'>Bulk Pack</option></select></div><div class="nsacct-field"><label for="nsacct-pref-recurring">Ordering preference</label><select id="nsacct-pref-recurring"><option value="onetime" '+((p.recurringPreference||'onetime')==='onetime'?'selected':'')+'>One-time</option><option value="weekly" '+(p.recurringPreference==='weekly'?'selected':'')+'>Weekly</option><option value="fortnightly" '+(p.recurringPreference==='fortnightly'?'selected':'')+'>Fortnightly</option><option value="monthly" '+(p.recurringPreference==='monthly'?'selected':'')+'>Monthly</option><option value="flexible" '+(p.recurringPreference==='flexible'?'selected':'')+'>Flexible</option></select></div></div>'+
      '<div class="nsacct-profile-note">Payment methods will be handled through a payment provider in a later phase. Nariyal Sutra will never ask you to save a card number, CVV, UPI PIN or banking password in this profile.</div><button class="nsacct-btn primary" type="submit">Save profile</button></form>'+
      '<div class="nsacct-divider"></div><div class="nsacct-actions">'+(state.user.email&&!state.user.emailVerified?'<button class="nsacct-btn ghost" type="button" data-nsacct-action="resend-verification">Resend verification</button>':'')+'<button class="nsacct-btn danger" type="button" data-nsacct-action="signout">Sign out</button></div><p class="nsacct-mini" style="margin-top:12px">Your profile never gates the storefront. Signing out returns you to the same public shopping experience.</p>';
  }
  function addressesPanel(){
    var list=state.addresses.length?state.addresses.map(addressCard).join(''):'<div class="nsacct-empty"><b>No saved addresses</b>Add home, office or event addresses to make future orders faster.</div>';
    return '<div class="nsacct-sectiontitle"><h3>Saved addresses</h3><span>'+state.addresses.length+' saved</span></div>'+list+'<div class="nsacct-card soft"><div class="nsacct-kicker">Add an address</div><form id="nsacct-address" class="nsacct-form"><input type="hidden" id="nsacct-address-id"><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-address-label">Label</label><input id="nsacct-address-label" type="text" maxlength="40" required placeholder="Home, Office, Event"></div><div class="nsacct-field"><label for="nsacct-address-phone">Contact phone</label><input id="nsacct-address-phone" type="tel" maxlength="24" required value="'+esc((state.profile||{}).phone||'')+'"></div></div><div class="nsacct-field"><label for="nsacct-address-line">Full address</label><textarea id="nsacct-address-line" maxlength="500" required placeholder="Street, building, area"></textarea></div><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-address-city">City</label><input id="nsacct-address-city" type="text" maxlength="120" required></div><div class="nsacct-field"><label for="nsacct-address-state">State / Province</label><input id="nsacct-address-state" type="text" maxlength="100"></div></div><div class="nsacct-grid2"><div class="nsacct-field"><label for="nsacct-address-country">Country</label><input id="nsacct-address-country" type="text" maxlength="80" required value="India"></div><div class="nsacct-field"><label for="nsacct-address-pin">PIN / Postal</label><input id="nsacct-address-pin" type="text" maxlength="24"></div></div><div class="nsacct-field"><label for="nsacct-address-landmark">Landmark (optional)</label><input id="nsacct-address-landmark" type="text" maxlength="180"></div><label class="nsacct-check"><input id="nsacct-address-default" type="checkbox"><span>Use this as my default checkout address.</span></label><button class="nsacct-btn primary" type="submit">Save address</button></form></div>';
  }
  function addressCard(a){return '<div class="nsacct-address"><div class="nsacct-address-head"><div class="nsacct-address-title">'+esc(a.label||'Saved address')+'</div>'+(a.isDefault?'<span class="nsacct-default">Default</span>':'')+'</div><p>'+esc(a.address||'')+'<br>'+esc([a.city,a.state,a.pin,a.country].filter(Boolean).join(', '))+'</p><div class="nsacct-order-actions"><button class="nsacct-btn" type="button" data-nsacct-action="use-address" data-address-id="'+esc(a.id)+'">Use at checkout</button><button class="nsacct-btn ghost" type="button" data-nsacct-action="edit-address" data-address-id="'+esc(a.id)+'">Edit</button><button class="nsacct-btn danger" type="button" data-nsacct-action="delete-address" data-address-id="'+esc(a.id)+'">Remove</button></div></div>'}

  function updateTrigger(){
    var t=byId('nsacct-trigger');if(!t)return;var text=t.querySelector('.nsacct-trigger-text'),dot=t.querySelector('.nsacct-dot');if(state.user){var name=(state.profile&&state.profile.displayName)||state.user.displayName||state.user.email||'Account';if(text)text.textContent=clean(name.split(/\s+/)[0],20)||'Account';if(dot)dot.textContent=initials(name,state.user.email);t.setAttribute('aria-label','Open '+(clean(name,60)||'My Account'))}else{if(text)text.textContent='My Account';if(dot)dot.textContent='👤';t.setAttribute('aria-label','Open My Account')}
  }
  function updateOrderContext(){
    var el=byId('nsacct-order-context');if(!el)return;if(!state.user){el.classList.remove('show');el.innerHTML='';return}var name=(state.profile&&state.profile.displayName)||state.user.displayName||'your profile';el.classList.add('show');el.innerHTML='<span>Ordering as <b>'+esc(name)+'</b>. Saved details can prefill this order, but you can change them anytime.</span><button type="button" id="nsacct-use-details">Use saved details</button>';var b=byId('nsacct-use-details');if(b)b.onclick=function(){prefillCheckout(true);toast('Saved profile details applied where available')};
  }

  async function initAccount(){
    renderBoot();
    try{
      var ready=await waitFor(function(){return !!window.NS_FIREBASE_READY},15000,200);if(!ready)throw new Error('Firebase storefront initialization did not become ready.');
      var mods=await Promise.all([
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/'+SDK+'/firebase-storage.js')
      ]);
      state.appMod=mods[0];state.authMod=mods[1];state.fs=mods[2];state.storageMod=mods[3];state.app=mods[0].getApp();state.auth=mods[1].getAuth(state.app);state.db=mods[2].getFirestore(state.app);state.storage=mods[3].getStorage(state.app);
      try{await mods[1].setPersistence(state.auth,mods[1].browserLocalPersistence)}catch(e){console.warn('[customer-account] auth persistence setup skipped:',e)}
      try{var redirectResult=await mods[1].getRedirectResult(state.auth);if(redirectResult&&redirectResult.user)sessionStorage.setItem('nsacct_auth_return','1')}catch(redirectErr){console.warn('[customer-account] redirect result:',redirectErr)}
      window.NS_CUSTOMER_CONTEXT={ready:false,uid:'',user:null,profile:null};
      mods[1].onAuthStateChanged(state.auth,handleAuthState,function(err){state.authReady=true;state.authError=friendlyAuthError(err);render()});
    }catch(e){state.authReady=true;state.authError='Customer profiles are temporarily unavailable. Guest shopping and checkout are unaffected.';console.warn('[customer-account] initialization failed:',e);window.NS_CUSTOMER_CONTEXT={ready:false,uid:'',user:null,profile:null};render()}
  }
  function waitFor(fn,timeout,interval){return new Promise(function(resolve){var start=Date.now();(function check(){try{if(fn())return resolve(true)}catch(e){}if(Date.now()-start>=timeout)return resolve(false);setTimeout(check,interval)})()})}

  async function handleAuthState(user){
    state.authReady=true;state.authError='';state.user=user||null;state.profile=null;state.addresses=[];state.orders=[];cleanupSubs();
    window.NS_CUSTOMER_CONTEXT={ready:true,uid:user?user.uid:'',user:user||null,profile:null};
    if(user){
      try{await ensureProfile(user)}catch(e){console.warn('[customer-account] profile load failed:',e);showDeferredMessage('Your sign-in succeeded, but profile details could not be loaded yet. You can still shop and order.', 'warn')}
      subscribeAddresses();subscribeOrders();prefillCheckout(false);analytics('customer_account_ready',{email_verified:!!user.emailVerified});try{if(sessionStorage.getItem('nsacct_auth_return')){sessionStorage.removeItem('nsacct_auth_return');setTimeout(openDrawer,80)}}catch(e){}
    }
    render();
  }
  function cleanupSubs(){if(state.orderUnsub)try{state.orderUnsub()}catch(e){};if(state.addressUnsub)try{state.addressUnsub()}catch(e){};state.orderUnsub=null;state.addressUnsub=null}

  async function ensureProfile(user){
    var ref=state.fs.doc(state.db,'customers',user.uid),snap=await state.fs.getDoc(ref),now=state.fs.serverTimestamp();
    var defaults={uid:user.uid,email:user.email||'',contactEmail:user.email||'',emailVerified:!!user.emailVerified,phoneVerified:!!user.phoneNumber,displayName:user.displayName||'',phone:user.phoneNumber||'',photoURL:user.photoURL||'',photoPath:'',preferredProduct:'',recurringPreference:'onetime',telegramUsername:'',preferredChannel:'whatsapp',notifyEmail:true,notifyWhatsapp:true,notifyTelegram:false,primaryCity:'',primaryState:'',primaryCountry:'India',primaryPin:'',lastLoginAt:now,updatedAt:now};
    if(!snap.exists()){
      defaults.createdAt=now;await state.fs.setDoc(ref,defaults);state.profile=Object.assign({},defaults,{createdAt:null,updatedAt:null,lastLoginAt:null});
    }else{
      var current=Object.assign({},snap.data()),patch={lastLoginAt:now,updatedAt:now,emailVerified:!!user.emailVerified,phoneVerified:!!user.phoneNumber},keys=['contactEmail','photoPath','telegramUsername','preferredChannel','notifyEmail','notifyWhatsapp','notifyTelegram','primaryCity','primaryState','primaryCountry','primaryPin'];
      keys.forEach(function(k){if(current[k]===undefined)patch[k]=defaults[k]});
      if(current.photoURL===undefined)patch.photoURL=user.photoURL||'';
      await state.fs.setDoc(ref,patch,{merge:true});state.profile=Object.assign({},defaults,current,patch,{updatedAt:current.updatedAt,lastLoginAt:current.lastLoginAt});
    }
    window.NS_CUSTOMER_CONTEXT={ready:true,uid:user.uid,user:user,profile:state.profile};updateTrigger();updateOrderContext();loadPrivateAvatar();
  }

  function subscribeAddresses(){
    if(!state.user)return;try{
      var c=state.fs.collection(state.db,'customers',state.user.uid,'addresses');var q=state.fs.query(c,state.fs.orderBy('updatedAt','desc'));
      state.addressUnsub=state.fs.onSnapshot(q,function(snap){state.addresses=snap.docs.map(function(d){return Object.assign({id:d.id},d.data())});prefillCheckout(false);if(state.drawerOpen&&state.panelTab==='addresses')render();},function(e){console.warn('[customer-account] address subscription failed:',e)});
    }catch(e){console.warn('[customer-account] address subscription setup failed:',e)}
  }
  function subscribeOrders(){
    if(!state.user)return;try{
      var c=state.fs.collection(state.db,'customerOrders',state.user.uid,'orders');var q=state.fs.query(c,state.fs.orderBy('createdAt','desc'),state.fs.limit(MAX_ORDERS));
      state.orderUnsub=state.fs.onSnapshot(q,function(snap){state.orders=snap.docs.map(function(d){return Object.assign({id:d.id},d.data())});if(state.drawerOpen)render();refreshTrackingStatuses();},function(e){console.warn('[customer-account] order subscription failed:',e);if(state.drawerOpen)showMessage('My Orders could not refresh. Your storefront and private tracking links still work.','warn')});
    }catch(e){console.warn('[customer-account] order subscription setup failed:',e)}
  }

  async function refreshTrackingStatuses(showFeedback){
    if(!state.user||!state.db||!state.fs||!state.orders.length)return;
    try{
      var changed=false;
      var refreshed=await Promise.all(state.orders.map(async function(o){
        var token=clean(o.trackingToken,48);if(!/^[0-9a-f]{48}$/i.test(token))return o;
        try{
          var snap=await state.fs.getDoc(state.fs.doc(state.db,'publicTracking',token));if(!snap.exists())return o;
          var p=snap.data();changed=changed||p.status!==o.status;
          return Object.assign({},o,{status:p.status||o.status,deliveryMethod:p.deliveryMethod||o.deliveryMethod,deliveryEstimate:p.deliveryEstimate||o.deliveryEstimate,estimatedTotal:p.estimatedTotal||o.estimatedTotal,destinationDisplay:p.destinationDisplay||o.destinationDisplay});
        }catch(_e){return o}
      }));
      state.orders=refreshed;if(state.drawerOpen)render();if(showFeedback)showMessage(changed?'Order status refreshed.':'Your order status is already up to date.','ok');
    }catch(e){if(showFeedback)showMessage('We could not refresh tracking right now. Your saved orders are still available.','warn')}
  }

  async function handleSubmit(e){
    if(e.target.id==='nsacct-signin'){e.preventDefault();await signin(e.target)}
    else if(e.target.id==='nsacct-signup'){e.preventDefault();await signup(e.target)}
    else if(e.target.id==='nsacct-phone-send'){e.preventDefault();await sendPhoneOtp(e.target)}
    else if(e.target.id==='nsacct-phone-code'){e.preventDefault();await verifyPhoneOtp(e.target)}
    else if(e.target.id==='nsacct-profile'){e.preventDefault();await saveProfile(e.target)}
    else if(e.target.id==='nsacct-address'){e.preventDefault();await saveAddress(e.target)}
    else if(e.target.id==='nsacct-claim'){e.preventDefault();await claimGuestOrder(e.target)}
  }
  function setBusy(form,busy){var btn=form&&form.querySelector('button[type="submit"]');if(btn){if(!btn.dataset.label)btn.dataset.label=btn.textContent;btn.disabled=busy;btn.textContent=busy?'Please wait…':btn.dataset.label}}
  function normalizePhone(v){
    var raw=clean(v,30),d=digits(raw);
    if(d.length===10)return '+91'+d;
    if(d.length===12&&d.indexOf('91')===0)return '+'+d;
    if(raw.charAt(0)==='+'&&d.length>=8&&d.length<=15)return '+'+d;
    return '';
  }
  function oauthProvider(kind){
    if(kind==='google'){
      var gp=new state.authMod.GoogleAuthProvider();
      gp.setCustomParameters({prompt:'select_account'});
      return gp;
    }
    var ap=new state.authMod.OAuthProvider('apple.com');
    ap.addScope('email');ap.addScope('name');
    return ap;
  }
  async function oauthSignIn(kind){
    if(!state.auth||!state.authMod)return;clearMessage();
    try{
      var provider=oauthProvider(kind);
      await state.authMod.signInWithPopup(state.auth,provider);
      showDeferredMessage((kind==='google'?'Google':'Apple')+' sign-in complete. Your profile is loading.','ok');
      analytics('customer_oauth_login_success',{provider:kind});
    }catch(e){
      var code=String(e&&e.code||'');
      if(['auth/popup-blocked','auth/cancelled-popup-request'].includes(code)){
        try{sessionStorage.setItem('nsacct_auth_return','1');await state.authMod.signInWithRedirect(state.auth,oauthProvider(kind));return}catch(re){e=re}
      }
      if(code==='auth/popup-closed-by-user'){showMessage('Sign-in was closed before completion. Nothing changed; you can try again or continue as a guest.','warn')}
      else showMessage(friendlyAuthError(e),'err');
      analytics('customer_oauth_login_failed',{provider:kind,code:clean(e&&e.code,80)});
    }
  }
  function clearPhoneVerifier(){
    try{if(state.phoneVerifier&&typeof state.phoneVerifier.clear==='function')state.phoneVerifier.clear()}catch(e){}
    state.phoneVerifier=null;
  }
  async function sendPhoneOtp(form){
    if(!state.auth||!state.authMod)return;setBusy(form,true);clearMessage();
    var phone=normalizePhone((byId('nsacct-phone-number')||{}).value),name=clean((byId('nsacct-phone-name')||{}).value,100);
    if(!phone){showMessage('Enter a valid mobile number, for example +91 98765 43210.','err');setBusy(form,false);return}
    try{
      clearPhoneVerifier();
      state.phoneVerifier=new state.authMod.RecaptchaVerifier(state.auth,'nsacct-recaptcha',{size:'invisible'});
      state.phoneConfirmation=await state.authMod.signInWithPhoneNumber(state.auth,phone,state.phoneVerifier);
      state.phoneNumber=phone;state.phonePendingName=name;state.phoneStage='code';render();
      showMessage('OTP sent. Enter the 6-digit code to continue.','ok');analytics('customer_phone_otp_sent',{});
    }catch(e){clearPhoneVerifier();showMessage(friendlyAuthError(e),'err');analytics('customer_phone_otp_failed',{code:clean(e&&e.code,80)})}
    finally{setBusy(form,false)}
  }
  async function verifyPhoneOtp(form){
    if(!state.phoneConfirmation)return;setBusy(form,true);clearMessage();var code=digits((byId('nsacct-phone-otp')||{}).value);
    if(code.length!==6){showMessage('Enter the 6-digit verification code.','err');setBusy(form,false);return}
    try{
      var cred=await state.phoneConfirmation.confirm(code);
      if(state.phonePendingName&&cred&&cred.user&&!cred.user.displayName)try{await state.authMod.updateProfile(cred.user,{displayName:state.phonePendingName})}catch(e){}
      if(cred&&cred.user)try{await ensureProfile(cred.user);if(state.phonePendingName&&state.profile&&!state.profile.displayName){await state.fs.updateDoc(state.fs.doc(state.db,'customers',cred.user.uid),{displayName:state.phonePendingName,updatedAt:state.fs.serverTimestamp()});state.profile.displayName=state.phonePendingName}}catch(profileErr){console.warn('[customer-account] phone profile sync:',profileErr)}
      state.phoneConfirmation=null;state.phoneStage='';clearPhoneVerifier();
      showDeferredMessage('Phone verified. Your profile and orders are loading.','ok');analytics('customer_phone_login_success',{});
    }catch(e){showMessage(friendlyAuthError(e),'err');analytics('customer_phone_login_failed',{code:clean(e&&e.code,80)})}
    finally{setBusy(form,false)}
  }

  async function signin(form){
    if(!state.auth)return;setBusy(form,true);clearMessage();var email=clean(byId('nsacct-login-email').value,160),password=byId('nsacct-login-password').value;
    try{await state.authMod.signInWithEmailAndPassword(state.auth,email,password);showDeferredMessage('Signed in. Your profile and orders are loading.','ok');analytics('customer_login_success',{})}
    catch(e){showMessage(friendlyAuthError(e),'err');analytics('customer_login_failed',{code:clean(e&&e.code,80)})}finally{setBusy(form,false)}
  }
  async function signup(form){
    if(!state.auth)return;setBusy(form,true);clearMessage();var name=clean(byId('nsacct-signup-name').value,100),phone=clean(byId('nsacct-signup-phone').value,24),email=clean(byId('nsacct-signup-email').value,160),password=byId('nsacct-signup-password').value,confirm=byId('nsacct-signup-confirm').value;
    if(name.length<2){showMessage('Please enter your full name.','err');setBusy(form,false);return}if(digits(phone).length<10||digits(phone).length>15){showMessage('Please enter a valid mobile / WhatsApp number.','err');setBusy(form,false);return}if(password.length<8){showMessage('Use at least 8 characters for your password.','err');setBusy(form,false);return}if(password!==confirm){showMessage('The two passwords do not match.','err');setBusy(form,false);return}
    var cred=null,profileSaved=false;
    try{
      cred=await state.authMod.createUserWithEmailAndPassword(state.auth,email,password);await state.authMod.updateProfile(cred.user,{displayName:name});
      var ref=state.fs.doc(state.db,'customers',cred.user.uid),now=state.fs.serverTimestamp();await state.fs.setDoc(ref,{uid:cred.user.uid,email:cred.user.email||email,contactEmail:cred.user.email||email,emailVerified:!!cred.user.emailVerified,phoneVerified:!!cred.user.phoneNumber,displayName:name,phone:phone,photoURL:'',photoPath:'',preferredProduct:'',recurringPreference:'onetime',telegramUsername:'',preferredChannel:'whatsapp',notifyEmail:true,notifyWhatsapp:true,notifyTelegram:false,primaryCity:'',primaryState:'',primaryCountry:'India',primaryPin:'',createdAt:now,updatedAt:now,lastLoginAt:now});profileSaved=true;
      try{await state.authMod.sendEmailVerification(cred.user)}catch(mailErr){console.warn('[customer-account] verification email not sent:',mailErr)}
      state.profile={uid:cred.user.uid,email:cred.user.email||email,contactEmail:cred.user.email||email,emailVerified:!!cred.user.emailVerified,phoneVerified:!!cred.user.phoneNumber,displayName:name,phone:phone,photoURL:'',photoPath:'',preferredProduct:'',recurringPreference:'onetime',telegramUsername:'',preferredChannel:'whatsapp',notifyEmail:true,notifyWhatsapp:true,notifyTelegram:false,primaryCity:'',primaryState:'',primaryCountry:'India',primaryPin:''};window.NS_CUSTOMER_CONTEXT={ready:true,uid:cred.user.uid,user:cred.user,profile:state.profile};prefillCheckout(false);showDeferredMessage('Profile created. We also requested a verification email.','ok');analytics('customer_signup_success',{});
    }catch(e){
      if(cred&&!profileSaved){try{await state.authMod.deleteUser(cred.user)}catch(cleanupErr){console.warn('[customer-account] incomplete signup cleanup failed:',cleanupErr)}}
      showMessage(profileSaved?friendlyAuthError(e):'We could not finish creating your profile. Nothing in checkout is blocked; please try creating the profile again.','err');analytics('customer_signup_failed',{code:clean(e&&e.code,80)})
    }finally{setBusy(form,false)}
  }
  async function saveProfile(form){
    if(!state.user)return;setBusy(form,true);clearMessage();
    var name=clean(byId('nsacct-profile-name').value,100),contactEmail=clean(byId('nsacct-profile-email').value,160).toLowerCase(),phone=clean(byId('nsacct-profile-phone').value,24),preferred=clean(byId('nsacct-pref-product').value,20),recurring=clean(byId('nsacct-pref-recurring').value,20),telegram=clean((byId('nsacct-telegram')||{}).value,80).replace(/^@/,''),channel=clean(byId('nsacct-pref-channel').value,20),city=clean(byId('nsacct-primary-city').value,120),region=clean(byId('nsacct-primary-state').value,100),country=clean(byId('nsacct-primary-country').value,80)||'India',pin=clean(byId('nsacct-primary-pin').value,24);
    var notifyEmail=!!byId('nsacct-notify-email').checked,notifyWhatsapp=!!byId('nsacct-notify-wa').checked,notifyTelegram=!!(byId('nsacct-notify-telegram')||{}).checked;
    if(name.length<2){showMessage('Please enter your full name.','err');setBusy(form,false);return}if(digits(phone).length<10||digits(phone).length>15){showMessage('Please enter a valid mobile / WhatsApp number.','err');setBusy(form,false);return}if(contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)){showMessage('Please enter a valid contact email.','err');setBusy(form,false);return}if((channel==='email'||notifyEmail)&&!contactEmail){showMessage('Add a contact email before selecting email updates.','err');setBusy(form,false);return}if((channel==='telegram'||notifyTelegram)&&!telegram){showMessage('Add your Telegram username before selecting Telegram as a preference.','err');setBusy(form,false);return}
    
    try{
      var payload={displayName:name,contactEmail:contactEmail,emailVerified:!!state.user.emailVerified,phoneVerified:!!state.user.phoneNumber,phone:phone,preferredProduct:preferred,recurringPreference:recurring,telegramUsername:telegram,preferredChannel:channel,notifyEmail:notifyEmail,notifyWhatsapp:notifyWhatsapp,notifyTelegram:notifyTelegram,primaryCity:city,primaryState:region,primaryCountry:country,primaryPin:pin,updatedAt:state.fs.serverTimestamp()};
      var ref=state.fs.doc(state.db,'customers',state.user.uid);await state.fs.updateDoc(ref,payload);
      if(state.user.displayName!==name)try{await state.authMod.updateProfile(state.user,{displayName:name})}catch(e){}
      state.profile=Object.assign({},state.profile,payload);window.NS_CUSTOMER_CONTEXT={ready:true,uid:state.user.uid,user:state.user,profile:state.profile};updateTrigger();updateOrderContext();prefillCheckout(false);showMessage('Profile saved.','ok');analytics('customer_profile_saved',{preferred_channel:channel});
    }catch(e){showMessage(friendlyDataError(e,'We could not save your profile right now.'),'err')}finally{setBusy(form,false)}
  }

  async function saveAddress(form){
    if(!state.user)return;setBusy(form,true);clearMessage();var id=clean(byId('nsacct-address-id').value,80);var isNew=!id;if(!id)id='addr_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
    var data={label:clean(byId('nsacct-address-label').value,40),recipientName:clean((state.profile&&state.profile.displayName)||state.user.displayName||'',100),phone:clean(byId('nsacct-address-phone').value,24),address:clean(byId('nsacct-address-line').value,500),city:clean(byId('nsacct-address-city').value,120),state:clean(byId('nsacct-address-state').value,100),country:clean(byId('nsacct-address-country').value,80),pin:clean(byId('nsacct-address-pin').value,24),landmark:clean(byId('nsacct-address-landmark').value,180),isDefault:!!byId('nsacct-address-default').checked,updatedAt:state.fs.serverTimestamp()};
    if(data.label.length<2||data.address.length<5||data.city.length<2||data.country.length<2||digits(data.phone).length<10){showMessage('Please complete the address, city, country and contact phone.','err');setBusy(form,false);return}
    if(isNew)data.createdAt=state.fs.serverTimestamp();
    try{await state.fs.setDoc(state.fs.doc(state.db,'customers',state.user.uid,'addresses',id),data,{merge:!isNew});showMessage(isNew?'Address saved.':'Address updated.','ok');form.reset();byId('nsacct-address-id').value='';if(byId('nsacct-address-country'))byId('nsacct-address-country').value='India';if(byId('nsacct-address-phone'))byId('nsacct-address-phone').value=(state.profile&&state.profile.phone)||'';analytics('customer_address_saved',{})}catch(e){showMessage(friendlyDataError(e,'We could not save this address right now.'),'err')}finally{setBusy(form,false)}
  }

  async function claimGuestOrder(form){
    if(!state.user)return;setBusy(form,true);clearMessage();var raw=clean(byId('nsacct-claim-token').value,600);var token=extractToken(raw);if(!token){showMessage('Paste the private tracking link or its 48-character tracking token.','err');setBusy(form,false);return}
    try{
      var pubRef=state.fs.doc(state.db,'publicTracking',token),pubSnap=await state.fs.getDoc(pubRef);if(!pubSnap.exists())throw new Error('TRACKING_NOT_FOUND');var p=pubSnap.data();var orderId=clean(p.orderId,40);if(!orderId)throw new Error('TRACKING_NOT_FOUND');var target=state.fs.doc(state.db,'customerOrders',state.user.uid,'orders',orderId);var existing=await state.fs.getDoc(target);if(existing.exists()){showMessage('This order is already in My Orders.','ok');setBusy(form,false);return}
      var now=state.fs.serverTimestamp();var payload={customerUid:state.user.uid,orderId:orderId,productKey:'',productName:clean(p.productName,120),quantity:Number(p.quantity||0),unitPrice:0,total:0,status:clean(p.status||'pending',40),paymentLabel:'',deliveryMethod:clean(p.deliveryMethod,120),deliveryEstimate:clean(p.deliveryEstimate,160),estimatedTotal:clean(p.estimatedTotal,160),destinationDisplay:clean(p.destinationDisplay,220),trackingToken:token,source:'claimed_tracking',createdAt:now,updatedAt:now};
      await state.fs.setDoc(target,payload);byId('nsacct-claim-token').value='';showMessage('Order added to My Orders.','ok');analytics('customer_guest_order_claimed',{});
    }catch(e){showMessage(e&&e.message==='TRACKING_NOT_FOUND'?'That private tracking link was not found. Check the link or contact us on WhatsApp.':friendlyDataError(e,'We could not attach this order right now.'),'err')}finally{setBusy(form,false)}
  }
  function extractToken(v){var direct=String(v||'').match(/^[0-9a-f]{48}$/i);if(direct)return direct[0];var m=String(v||'').match(/[?&]t=([0-9a-f]{48})/i);return m?m[1]:''}

  async function handleAction(action,el){
    if(action==='continue-shopping'){closeDrawer();return}
    if(action==='google-signin'){await oauthSignIn('google');return}
    if(action==='apple-signin'){await oauthSignIn('apple');return}
    if(action==='phone-open'){state.phoneStage='number';render();return}
    if(action==='phone-reset'){state.phoneStage='';state.phoneConfirmation=null;state.phoneNumber='';state.phonePendingName='';clearPhoneVerifier();render();return}
    if(action==='forgot-password'){await forgotPassword();return}
    if(action==='resend-verification'){await resendVerification();return}
    if(action==='signout'){await signout();return}
    if(action==='new-order'){closeDrawer();setTimeout(function(){if(typeof window.go==='function')window.go('order')},50);return}
    if(action==='use-profile'){prefillCheckout(true);closeDrawer();setTimeout(function(){if(typeof window.go==='function')window.go('order')},50);return}
    if(action==='show-orders'){state.panelTab='orders';render();return}
    if(action==='refresh-orders'){await refreshTrackingStatuses(true);return}
    if(action==='use-address'){var a=findAddress(el.getAttribute('data-address-id'));if(a){applyAddress(a,true);closeDrawer();setTimeout(function(){if(typeof window.go==='function')window.go('order')},50)}return}
    if(action==='edit-address'){editAddress(el.getAttribute('data-address-id'));return}
    if(action==='delete-address'){await deleteAddress(el.getAttribute('data-address-id'));return}
    if(action==='reorder'){reorder(el.getAttribute('data-order-id'));return}
    if(action==='remove-photo'){await removeProfilePhoto();return}
  }
  async function forgotPassword(){
    if(!state.auth)return;var email=clean((byId('nsacct-login-email')||{}).value,160);if(!email){showMessage('Enter your email above, then choose Forgot password.','warn');return}try{await state.authMod.sendPasswordResetEmail(state.auth,email);showMessage('Password reset instructions were requested. Check your inbox and spam folder.','ok');analytics('customer_password_reset_requested',{})}catch(e){showMessage(friendlyAuthError(e),'err')}
  }
  async function resendVerification(){
    if(!state.user)return;if(!state.user.email){showMessage('This account uses phone sign-in and does not need email verification.','ok');return}if(state.user.emailVerified){showMessage('Your email is already verified.','ok');return}try{await state.authMod.sendEmailVerification(state.user);showMessage('Verification email requested. Check your inbox and spam folder.','ok')}catch(e){showMessage(friendlyAuthError(e),'err')}
  }
  async function signout(){if(!state.auth)return;try{await state.authMod.signOut(state.auth);state.panelTab='overview';showDeferredMessage('Signed out. The storefront remains fully available.','ok');analytics('customer_logout',{})}catch(e){showMessage(friendlyAuthError(e),'err')}}

  function findAddress(id){return state.addresses.find(function(a){return a.id===id})}
  function editAddress(id){var a=findAddress(id);if(!a)return;state.panelTab='addresses';render();setTimeout(function(){var set=function(i,v){var x=byId(i);if(x)x.value=v||''};set('nsacct-address-id',a.id);set('nsacct-address-label',a.label);set('nsacct-address-phone',a.phone);set('nsacct-address-line',a.address);set('nsacct-address-city',a.city);set('nsacct-address-state',a.state);set('nsacct-address-country',a.country);set('nsacct-address-pin',a.pin);set('nsacct-address-landmark',a.landmark);if(byId('nsacct-address-default'))byId('nsacct-address-default').checked=!!a.isDefault;var f=byId('nsacct-address-label');if(f)f.focus()},0)}
  async function deleteAddress(id){var a=findAddress(id);if(!a||!state.user)return;if(!window.confirm('Remove this saved address from your profile?'))return;try{await state.fs.deleteDoc(state.fs.doc(state.db,'customers',state.user.uid,'addresses',id));showMessage('Address removed.','ok')}catch(e){showMessage(friendlyDataError(e,'We could not remove this address right now.'),'err')}}

  function prefillCheckout(force){
    if(!state.user)return;var p=state.profile||{};function set(id,val){var el=byId(id);if(!el||!val)return;if(force||!String(el.value||'').trim())el.value=val}
    set('oN',p.displayName||state.user.displayName||'');set('oP',p.phone||state.user.phoneNumber||'');set('oEmail',p.contactEmail||state.user.email||'');
    var a=state.addresses.find(function(x){return x.isDefault})||null;if(a)applyAddress(a,force);else{set('oCity',p.primaryCity||'');set('ns-state',p.primaryState||'');set('ns-pin',p.primaryPin||'');var country=byId('ns-country');if(country&&p.primaryCountry&&(!country.value||country.value==='India')){var opts=Array.from(country.options||[]),hit=opts.find(function(o){return o.value===p.primaryCountry});if(hit)country.value=p.primaryCountry}}
    if(p.preferredProduct&&typeof window.pickByKey==='function'&&force){try{var current=byId('oPr');if(current)current.value=p.preferredProduct;if(typeof window.syncProductSelection==='function')window.syncProductSelection()}catch(e){}}
    if(p.recurringPreference&&force&&typeof window.nsSetRecurring==='function'){try{var btn=document.querySelector('.ns-recur-btn[data-value="'+CSS.escape(p.recurringPreference)+'"]');window.nsSetRecurring(p.recurringPreference,btn)}catch(e){}}
    updateOrderContext();
  }
  function applyAddress(a,force){
    if(!a)return;function set(id,val){var el=byId(id);if(!el||val==null)return;if(force||!String(el.value||'').trim())el.value=val}
    set('oA',a.address);set('oCity',a.city);set('ns-state',a.state);set('ns-pin',a.pin);set('ns-landmark',a.landmark);
    var country=byId('ns-country');if(country&&a.country){var options=Array.from(country.options||[]);var exact=options.find(function(o){return o.value===a.country});if(exact){if(force||country.value==='India')country.value=a.country}else{country.value='Other';var other=byId('ns-country-other');if(other){other.style.display='block';other.value=a.country}var label=byId('ns-other-label');if(label)label.style.display='block'}}
    if(typeof window.nsDelCountryChange==='function')try{window.nsDelCountryChange()}catch(e){};set('ns-state',a.state);set('ns-pin',a.pin);set('ns-landmark',a.landmark);if(typeof window.nsDelUpdate==='function')try{window.nsDelUpdate()}catch(e){}
  }
  function guessProductKey(name){var s=String(name||'').toLowerCase();return s.includes('bulk')?'bulk':s.includes('green')?'green':s.includes('tender')?'tender':''}
  function reorder(orderId){
    var o=state.orders.find(function(x){return x.orderId===orderId||x.id===orderId});if(!o)return;var key=o.productKey||guessProductKey(o.productName);if(!key){showMessage('This older order does not contain enough product information for one-click reorder. Open the store and choose the product manually.','warn');return}closeDrawer();setTimeout(function(){try{if(typeof window.pickByKey==='function')window.pickByKey(key);var q=byId('oQ');var opt=byId('oPr')&&byId('oPr').options[byId('oPr').selectedIndex];var min=opt?Number(opt.dataset.min||1):1,stock=opt?Number(opt.dataset.stock||999999):999999;if(q)q.value=String(Math.min(stock,Math.max(min,Number(o.quantity||min))));if(typeof window.syncProductSelection==='function')window.syncProductSelection();prefillCheckout(false);toast('Previous quantity loaded with today\'s live price and stock');analytics('customer_reorder_started',{product_key:key})}catch(e){console.warn('[customer-account] reorder prefill failed:',e)}},80)
  }

  async function imageToWebp(file){
    if(!file)throw new Error('NO_FILE');if(file.size>5*1024*1024)throw new Error('TOO_LARGE');if(!/^image\/(jpeg|png|webp)$/.test(file.type||''))throw new Error('BAD_TYPE');
    var bmp=await createImageBitmap(file),size=Math.min(bmp.width,bmp.height),sx=Math.max(0,(bmp.width-size)/2),sy=Math.max(0,(bmp.height-size)/2),c=document.createElement('canvas');c.width=512;c.height=512;c.getContext('2d').drawImage(bmp,sx,sy,size,size,0,0,512,512);if(bmp.close)bmp.close();
    return await new Promise(function(resolve,reject){c.toBlob(function(b){b?resolve(b):reject(new Error('IMAGE_PROCESS_FAILED'))},'image/webp',0.86)});
  }
  async function handleProfilePhoto(file){
    if(!state.user||!file)return;clearMessage();showMessage('Preparing your profile photo…','warn');
    try{
      if(!state.storage||!state.storageMod)throw new Error('STORAGE_UNAVAILABLE');var blob=await imageToWebp(file),path='customer-profile-images/'+state.user.uid+'/avatar.webp',ref=state.storageMod.ref(state.storage,path);await state.storageMod.uploadBytes(ref,blob,{contentType:'image/webp',cacheControl:'private,max-age=3600'});
      await state.fs.updateDoc(state.fs.doc(state.db,'customers',state.user.uid),{photoPath:path,photoURL:'',updatedAt:state.fs.serverTimestamp()});state.profile=Object.assign({},state.profile,{photoPath:path,photoURL:''});await loadPrivateAvatar(true);showMessage('Profile photo saved.','ok');analytics('customer_profile_photo_saved',{});
    }catch(e){var msg=e&&e.message==='TOO_LARGE'?'Use an image smaller than 5 MB.':e&&e.message==='BAD_TYPE'?'Use a JPG, PNG or WebP image.':'We could not save that profile photo right now.';showMessage(msg,'err')}
  }
  async function loadPrivateAvatar(forceRender){
    if(!state.user||!state.profile||!state.profile.photoPath||!state.storage||!state.storageMod)return;
    try{var blob=await state.storageMod.getBlob(state.storageMod.ref(state.storage,state.profile.photoPath));if(state.photoObjectUrl)URL.revokeObjectURL(state.photoObjectUrl);state.photoObjectUrl=URL.createObjectURL(blob);state.profile.photoURL=state.photoObjectUrl;if(forceRender&&state.drawerOpen)render();else{var a=byId('nsacct-avatar');if(a)a.innerHTML='<img src="'+esc(state.photoObjectUrl)+'" alt="">'}}catch(e){console.warn('[customer-account] private avatar load failed:',e)}
  }
  async function removeProfilePhoto(){
    if(!state.user||!state.profile)return;try{var path=state.profile.photoPath||'';if(path&&state.storage&&state.storageMod)try{await state.storageMod.deleteObject(state.storageMod.ref(state.storage,path))}catch(_e){}await state.fs.updateDoc(state.fs.doc(state.db,'customers',state.user.uid),{photoPath:'',photoURL:'',updatedAt:state.fs.serverTimestamp()});if(state.photoObjectUrl){URL.revokeObjectURL(state.photoObjectUrl);state.photoObjectUrl=''}state.profile=Object.assign({},state.profile,{photoPath:'',photoURL:''});render();showMessage('Profile photo removed.','ok')}catch(e){showMessage('We could not remove the profile photo right now.','err')}
  }

  function friendlyAuthError(e){
    var code=String(e&&e.code||'');var map={
      'auth/invalid-credential':'Email or password is incorrect.',
      'auth/wrong-password':'Email or password is incorrect.',
      'auth/user-not-found':'Email or password is incorrect.',
      'auth/email-already-in-use':'This email already has an account. Sign in instead.',
      'auth/invalid-email':'Please enter a valid email address.',
      'auth/weak-password':'Use a stronger password with at least 8 characters.',
      'auth/too-many-requests':'Too many attempts. Please wait a little and try again.',
      'auth/network-request-failed':'We could not reach the sign-in service. Check your connection and try again, or continue as a guest.',
      'auth/operation-not-allowed':'Customer sign-up is not enabled yet. You can continue shopping as a guest.',
      'auth/requires-recent-login':'For security, sign in again before making this account change.',
      'auth/user-disabled':'This account is unavailable. Contact Nariyal Sutra support.',
      'auth/account-exists-with-different-credential':'An account already exists for this email with another sign-in method. Use that method first; we will keep it as one customer account.',
      'auth/popup-closed-by-user':'Sign-in was closed before completion.',
      'auth/popup-blocked':'Your browser blocked the sign-in window. Please allow the redirect and try again.',
      'auth/invalid-phone-number':'Please enter a valid mobile number with country code.',
      'auth/missing-phone-number':'Please enter your mobile number.',
      'auth/invalid-verification-code':'That OTP is incorrect. Check the 6-digit code and try again.',
      'auth/code-expired':'That OTP has expired. Request a new code.',
      'auth/quota-exceeded':'Phone verification is temporarily unavailable because the SMS limit was reached. Use Google, Apple, email, or try again later.',
      'auth/captcha-check-failed':'Phone verification could not confirm the security check. Please retry.',
      'auth/missing-client-type':'This sign-in provider is not fully configured yet. Guest shopping and other sign-in methods remain available.'
    };return map[code]||'We could not complete that account action. Please try again. Your shopping and guest checkout remain available.';
  }
  function friendlyDataError(e,fallback){var code=String(e&&e.code||'');if(code.includes('permission-denied'))return 'This account action was blocked by our security rules. Your private order data remains protected; please try again later.';if(code.includes('unavailable'))return 'The account service is temporarily unavailable. Please try again. Your storefront and guest checkout still work.';return fallback||'We could not complete that action right now.'}
  function clearMessage(){var m=byId('nsacct-message');if(m){m.className='nsacct-msg';m.textContent=''}}
  function showMessage(msg,type){var m=byId('nsacct-message');if(!m)return;m.className='nsacct-msg show '+(type||'warn');m.textContent=msg}
  var deferredMessage=null;function showDeferredMessage(msg,type){deferredMessage={msg:msg,type:type};setTimeout(function(){if(deferredMessage&&state.drawerOpen){showMessage(deferredMessage.msg,deferredMessage.type);deferredMessage=null}},100)}

  /* Called by ns-order-patch.js after the private /orders write succeeds. */
  window.NS_CUSTOMER_AFTER_ORDER_SAVED=async function(order){
    if(!order||!order.customerUid||!state.user||order.customerUid!==state.user.uid||!state.db||!state.fs)return {skipped:true};
    try{
      var token=clean(order.trackingToken,48);if(!/^[0-9a-f]{48}$/i.test(token))return {skipped:true,reason:'No valid tracking token'};
      var dest=[order.city,order.state,order.country].filter(Boolean).join(', ');var total=Number(order.total||0);var now=state.fs.serverTimestamp();
      var payload={customerUid:state.user.uid,orderId:clean(order.orderId,40),productKey:clean(order.productKey,20),productName:clean(order.productName,120),quantity:Number(order.quantity||0),unitPrice:Number(order.unitPrice||0),total:total,status:clean(order.status||'pending',40),paymentLabel:clean(order.paymentLabel||order.paymentType,80),deliveryMethod:clean(order.deliveryLabel||order.deliveryMethod,120),deliveryEstimate:clean(order.deliveryEta||'Confirmed on WhatsApp',160),estimatedTotal:money(total)+' + delivery (confirmed separately)',destinationDisplay:clean(dest||'India',220),trackingToken:token,source:'account_checkout',createdAt:now,updatedAt:now};
      await state.fs.setDoc(state.fs.doc(state.db,'customerOrders',state.user.uid,'orders',payload.orderId),payload);toast('Order added to My Orders');analytics('customer_order_attached',{source:'account_checkout'});return {skipped:false};
    }catch(e){console.warn('[customer-account] My Orders projection failed (order remains saved):',e);return {skipped:true,error:e}}
  };

  window.NS_CUSTOMER_OPEN_ACCOUNT=openDrawer;
  window.NS_CUSTOMER_ACCOUNT_URL=accountUrl();

  function boot(){injectStyles();injectShell();renderBoot();initAccount()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
