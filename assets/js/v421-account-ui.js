/* Nariyal Sutra V42.1 — customer account presentation recovery.
   Keeps customer-account.js as the data/auth source of truth and only improves
   layout/presentation. Includes a LOCALHOST-ONLY visual preview via
   ?accountPreview=1#account so the premium signed-in layout can be reviewed
   without writing customer data or bypassing Firebase security. */
(function(){
  'use strict';
  if(window.__NS_V421_ACCOUNT_UI__) return;
  window.__NS_V421_ACCOUNT_UI__=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isLocal=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
  const previewMode=isLocal && new URLSearchParams(location.search).get('accountPreview')==='1';

  function addStyles(){
    if($('#nsacct-v421-polish')) return;
    const style=document.createElement('style');
    style.id='nsacct-v421-polish';
    style.textContent=`
      /* Wider premium account drawer; never merge cards/steps. */
      #nsacct-panel.nsacct-v421-panel{width:min(720px,100%)!important;background:
        radial-gradient(circle at 88% 2%,rgba(212,168,67,.13),transparent 28%),
        radial-gradient(circle at 8% 88%,rgba(43,104,26,.18),transparent 32%),
        linear-gradient(180deg,#082006 0%,#061604 48%,#041003 100%)!important;
        border-left:1px solid rgba(212,168,67,.42)!important;box-shadow:-34px 0 110px rgba(0,0,0,.62)!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-head{min-height:118px;padding:22px 28px 20px!important;align-items:flex-start!important;background:
        linear-gradient(90deg,rgba(5,24,4,.96),rgba(5,24,4,.64)),
        url('/assets/images/freshness-coconut-splash.webp') center right 16%/44% auto no-repeat!important;
        border-bottom:1px solid rgba(212,168,67,.28)!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-brand{font-size:9px!important;letter-spacing:4px!important;text-shadow:0 1px 12px rgba(0,0,0,.6)}
      #nsacct-panel.nsacct-v421-panel .nsacct-brand b{font-size:28px!important;margin-top:10px!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-close{width:44px!important;height:44px!important;background:rgba(3,13,2,.48)!important;border-color:rgba(255,255,255,.2)!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-body{padding:22px 26px 38px!important}

      /* Signed-in identity card. */
      #nsacct-panel.nsacct-v421-panel .nsacct-userhead{position:relative;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;gap:16px!important;align-items:center!important;padding:19px 20px!important;margin:0 0 18px!important;border:1px solid rgba(212,168,67,.28);border-radius:16px;background:linear-gradient(135deg,rgba(23,73,18,.42),rgba(4,24,4,.42));box-shadow:inset 0 0 35px rgba(55,126,38,.07)}
      #nsacct-panel.nsacct-v421-panel .nsacct-avatar{width:64px!important;height:64px!important;font:500 20px/1 'Playfair Display',serif!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-userhead h2{font-size:24px!important;margin:0!important;white-space:normal;overflow-wrap:anywhere}
      #nsacct-panel.nsacct-v421-panel .nsacct-userhead p{font-size:10px!important;overflow-wrap:anywhere}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-edit-profile{border:1px solid rgba(212,168,67,.72);background:rgba(212,168,67,.06);color:#f5d17e;border-radius:8px;padding:10px 12px;font:600 8px/1 'Jost',sans-serif;letter-spacing:1.2px;text-transform:uppercase;cursor:pointer;white-space:nowrap}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-edit-profile:hover{background:rgba(212,168,67,.14)}

      /* Navigation stays discrete; it must never visually merge into content. */
      #nsacct-panel.nsacct-v421-panel .nsacct-tabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px!important;margin:0 0 20px!important;padding:6px!important;border:1px solid rgba(212,168,67,.12)!important;background:rgba(0,0,0,.22)!important;border-radius:12px!important;overflow:visible!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-tabs button{min-width:0!important;min-height:42px;padding:9px 7px!important;white-space:normal;line-height:1.25!important}

      /* Profile/settings cards. */
      #nsacct-panel.nsacct-v421-panel .nsacct-photo-row{padding:16px!important;margin-bottom:14px!important;border:1px solid rgba(212,168,67,.18)!important;background:rgba(255,255,255,.025)!important}
      #nsacct-panel.nsacct-v421-panel #nsacct-profile{gap:14px!important}
      #nsacct-panel.nsacct-v421-panel #nsacct-profile>.nsacct-field,
      #nsacct-panel.nsacct-v421-panel #nsacct-profile>.nsacct-grid2{margin:0!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-channel-card{padding:18px!important;margin:4px 0 2px!important;border:1px solid rgba(212,168,67,.24)!important;border-radius:15px!important;background:linear-gradient(135deg,rgba(19,61,14,.30),rgba(255,255,255,.018))!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-channel-card>label:first-child{font:400 19px/1.2 'Playfair Display',serif!important;letter-spacing:0!important;text-transform:none!important;color:#fff!important;margin-bottom:5px!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-channel-help{display:block;margin:0 0 13px;color:rgba(255,255,255,.45);font-size:10px;line-height:1.55}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label{position:relative;min-height:112px;padding:15px 13px!important;border:1px solid rgba(212,168,67,.18)!important;border-radius:13px!important;background:rgba(3,22,3,.5)!important;display:flex!important;flex-direction:column;align-items:flex-start!important;justify-content:flex-end;gap:8px!important;font-size:11px!important;color:#f7f4ea!important;cursor:pointer;overflow:hidden}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label:before{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;margin-bottom:auto;background:rgba(212,168,67,.12);font-size:19px}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label:has(#nsacct-notify-wa):before{content:'☎'}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label:has(#nsacct-notify-email):before{content:'✉'}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label:has(#nsacct-notify-telegram):before{content:'➤'}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid input{position:absolute;top:12px;right:12px;width:18px;height:18px;accent-color:#d4a843}
      #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label:has(input:checked){border-color:rgba(212,168,67,.78)!important;box-shadow:0 0 0 1px rgba(212,168,67,.15),inset 0 0 30px rgba(212,168,67,.045)}

      #nsacct-panel.nsacct-v421-panel .nsacct-v421-delivery-card{padding:18px;margin:4px 0 2px;border:1px solid rgba(212,168,67,.24);border-radius:15px;background:linear-gradient(135deg,rgba(17,56,13,.30),rgba(255,255,255,.018))}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-delivery-card .nsacct-sectiontitle{margin:0 0 13px!important;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.07)}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-delivery-card .nsacct-sectiontitle h3{font-size:20px!important}
      #nsacct-panel.nsacct-v421-panel .nsacct-v421-address-action{border:1px solid rgba(212,168,67,.55);background:transparent;color:#f5d17e;border-radius:8px;padding:8px 10px;font:600 8px/1 'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
      #nsacct-panel.nsacct-v421-panel #nsacct-profile>.nsacct-btn.primary{width:100%;min-height:50px;margin-top:3px;font-size:10px!important;letter-spacing:1.8px!important;border-radius:10px!important;box-shadow:0 12px 34px rgba(212,168,67,.14)}
      #nsacct-panel.nsacct-v421-panel .nsacct-profile-note{margin-top:2px!important;border-radius:0 10px 10px 0!important}

      /* Orders and addresses remain separate from profile/settings. */
      #nsacct-panel.nsacct-v421-panel .nsacct-order,
      #nsacct-panel.nsacct-v421-panel .nsacct-address{margin-top:11px!important;padding:16px!important;border-color:rgba(212,168,67,.12)!important;background:rgba(255,255,255,.025)!important}

      /* Local visual-reference snapshot only. */
      .nsacct-v421-demo{display:grid;gap:16px}.nsacct-v421-demo .demo-note{padding:9px 11px;border:1px solid rgba(212,168,67,.18);background:rgba(212,168,67,.05);color:#f5d17e;font-size:9px;line-height:1.55;border-radius:8px}.nsacct-v421-demo .demo-identity{display:grid;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;padding:18px;border:1px solid rgba(212,168,67,.32);border-radius:16px;background:rgba(20,70,16,.27)}.nsacct-v421-demo .demo-avatar{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#d4a843,#f5d17e);color:#071104;font:500 20px/1 'Playfair Display',serif}.nsacct-v421-demo h3{font:400 22px/1.2 'Playfair Display',serif;margin:0}.nsacct-v421-demo p{margin:5px 0 0;color:rgba(255,255,255,.5);font-size:10px;line-height:1.6}.nsacct-v421-demo .demo-edit{border:1px solid rgba(212,168,67,.65);background:transparent;color:#f5d17e;padding:9px 11px;border-radius:8px;font-size:9px}.nsacct-v421-demo .demo-section>h3{margin-bottom:5px}.nsacct-v421-demo .demo-channels{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.nsacct-v421-demo .demo-channel{min-height:120px;padding:15px;border:1px solid rgba(212,168,67,.2);border-radius:14px;background:rgba(4,27,4,.58);display:grid;align-content:space-between}.nsacct-v421-demo .demo-channel.on{border-color:rgba(212,168,67,.78)}.nsacct-v421-demo .demo-channel i{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(212,168,67,.12);font-style:normal;font-size:20px}.nsacct-v421-demo .demo-channel b{font-size:12px}.nsacct-v421-demo .demo-location{display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;padding:17px;border:1px solid rgba(212,168,67,.2);border-radius:14px;background:rgba(4,27,4,.58)}.nsacct-v421-demo .demo-pin{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(212,168,67,.12);font-size:20px}.nsacct-v421-demo .demo-save{min-height:50px;border:0;border-radius:10px;background:linear-gradient(90deg,#d4a843,#f5d17e);color:#071104;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}

      @media(max-width:760px){
        #nsacct-panel.nsacct-v421-panel .nsacct-head{min-height:94px;padding:17px!important;background-size:60% auto!important}
        #nsacct-panel.nsacct-v421-panel .nsacct-body{padding:16px 14px 30px!important}
        #nsacct-panel.nsacct-v421-panel .nsacct-userhead{grid-template-columns:auto minmax(0,1fr)!important;padding:15px!important}
        #nsacct-panel.nsacct-v421-panel .nsacct-v421-edit-profile{grid-column:1/-1;width:100%}
        #nsacct-panel.nsacct-v421-panel .nsacct-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid,.nsacct-v421-demo .demo-channels{grid-template-columns:1fr!important}
        #nsacct-panel.nsacct-v421-panel .nsacct-prefgrid label{min-height:88px!important}
        .nsacct-v421-demo .demo-identity,.nsacct-v421-demo .demo-location{grid-template-columns:auto 1fr}.nsacct-v421-demo .demo-edit{grid-column:1/-1;width:100%}
      }
      @media(max-width:420px){#nsacct-panel.nsacct-v421-panel .nsacct-brand b{font-size:23px!important}#nsacct-panel.nsacct-v421-panel .nsacct-avatar{width:54px!important;height:54px!important}}
    `;
    document.head.appendChild(style);
  }

  function clickTab(name){
    const b=$(`[data-nsacct-tab="${name}"]`); if(b) b.click();
  }

  function enhanceSignedIn(){
    const panel=$('#nsacct-panel'); const body=$('#nsacct-body');
    if(!panel||!body) return;
    panel.classList.add('nsacct-v421-panel');
    const head=$('.nsacct-userhead',body);
    if(!head) return;
    panel.classList.add('nsacct-v421-signed');

    if(!$('.nsacct-v421-edit-profile',head)){
      const b=document.createElement('button');
      b.type='button'; b.className='nsacct-v421-edit-profile'; b.textContent='Edit profile';
      b.addEventListener('click',()=>clickTab('profile'));
      head.appendChild(b);
    }

    const form=$('#nsacct-profile',body);
    if(!form) return;
    body.classList.add('nsacct-v421-profile-view');

    const pref=$$('.nsacct-field',form).find(el=>{
      const label=$(':scope > label',el); return label&&/order update channels/i.test(label.textContent||'');
    });
    if(pref&&!pref.classList.contains('nsacct-v421-channel-card')){
      pref.classList.add('nsacct-v421-channel-card');
      const help=document.createElement('span'); help.className='nsacct-v421-channel-help';
      help.textContent="Choose where you'd like to receive order and delivery updates.";
      const grid=$('.nsacct-prefgrid',pref); if(grid) pref.insertBefore(help,grid);
    }

    if(!$('.nsacct-v421-delivery-card',form)){
      const title=$$('.nsacct-sectiontitle',form).find(el=>/primary location/i.test(el.textContent||''));
      if(title){
        const card=document.createElement('section'); card.className='nsacct-v421-delivery-card';
        title.parentNode.insertBefore(card,title); card.appendChild(title);
        let next=card.nextElementSibling, moved=0;
        while(next&&moved<2&&next.classList.contains('nsacct-grid2')){const after=next.nextElementSibling;card.appendChild(next);next=after;moved++;}
        if(!$('.nsacct-v421-address-action',title)){
          const b=document.createElement('button'); b.type='button'; b.className='nsacct-v421-address-action'; b.textContent='Saved addresses';
          b.addEventListener('click',()=>clickTab('addresses')); title.appendChild(b);
        }
      }
    }
  }

  function demoMarkup(){
    return `<div class="nsacct-v421-demo">
      <div class="demo-note"><strong>LOCAL VISUAL PREVIEW</strong> · No Firebase write, login bypass, order change or notification is performed.</div>
      <div class="demo-identity"><div class="demo-avatar">AP</div><div><div class="nsacct-kicker">Valued customer</div><h3>Aarav Patel</h3><p>aarav.patel@example.com · +91 98765 43210 · Bengaluru, Karnataka</p></div><button class="demo-edit" type="button">Edit profile</button></div>
      <div class="demo-section"><h3>Order Update Channels</h3><p>Choose how you'd like to receive updates about orders, deliveries and important notifications.</p></div>
      <div class="demo-channels"><div class="demo-channel on"><i>☎</i><div><b>WhatsApp</b><p>Real-time order updates</p></div></div><div class="demo-channel"><i>➤</i><div><b>Telegram</b><p>Saved preference; automation connects only when configured</p></div></div><div class="demo-channel on"><i>✉</i><div><b>Email</b><p>Receipts and order-status updates</p></div></div></div>
      <div class="demo-section"><h3>Delivery Preferences</h3><p>Your primary saved delivery location for quicker checkout.</p></div>
      <div class="demo-location"><div class="demo-pin">⌖</div><div><b>Primary Delivery Location</b><p>123, Koramangala 5th Block<br>Bengaluru, Karnataka 560095</p></div><button class="demo-edit" type="button">Edit address</button></div>
      <button class="demo-save" type="button">Save Changes</button>
    </div>`;
  }

  function maybeRenderPreview(){
    if(!previewMode) return;
    const panel=$('#nsacct-panel'),body=$('#nsacct-body'); if(!panel||!body) return;
    panel.classList.add('nsacct-v421-panel','nsacct-v421-preview');
    if(body.dataset.v421Demo==='1') return;
    /* Only replace the signed-out/auth body in explicit localhost preview mode. */
    if(!$('.nsacct-userhead',body)){
      body.dataset.v421Demo='1'; body.innerHTML=demoMarkup();
    }
  }

  function sync(){
    addStyles();
    const panel=$('#nsacct-panel'); if(panel) panel.classList.add('nsacct-v421-panel');
    if(previewMode) maybeRenderPreview(); else enhanceSignedIn();
  }

  let observer=null;
  function observe(){
    sync();
    const overlay=$('#nsacct-overlay');
    if(!overlay){setTimeout(observe,160);return;}
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>requestAnimationFrame(sync));
    observer.observe(overlay,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',observe,{once:true}):observe();
  window.NSV421AccountUI={sync,previewMode,version:'42.1-account-polish'};
})();
