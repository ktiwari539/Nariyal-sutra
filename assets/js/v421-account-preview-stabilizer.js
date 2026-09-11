/* Local-only My Account visual QA stabilizer.
   Never runs on production/preview domains and never calls Firebase. */
(function(){
  'use strict';
  const local=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
  const preview=new URLSearchParams(location.search).get('accountPreview')==='1';
  if(!local||!preview)return;

  const markup=`<div class="nsacct-v421-demo">
    <div class="demo-note"><strong>LOCAL VISUAL PREVIEW</strong> · No Firebase writes, order updates or notifications.</div>
    <div class="demo-identity"><div class="demo-avatar">AP</div><div><div class="nsacct-kicker">Valued customer</div><h3>Aarav Patel</h3><p>aarav.patel@example.com · +91 98765 43210 · Bengaluru, Karnataka</p></div><button class="demo-edit" type="button">Edit profile</button></div>
    <div class="demo-section"><h3>Order Update Channels</h3><p>Choose how you'd like to receive updates about orders, deliveries and important notifications.</p></div>
    <div class="demo-channels"><div class="demo-channel on"><i>☎</i><div><b>WhatsApp</b><p>Real-time order updates</p></div></div><div class="demo-channel"><i>➤</i><div><b>Telegram</b><p>Saved preference; automation only when configured</p></div></div><div class="demo-channel on"><i>✉</i><div><b>Email</b><p>Receipts and order-status updates</p></div></div></div>
    <div class="demo-section"><h3>Delivery Preferences</h3><p>Your primary saved delivery location for quicker checkout.</p></div>
    <div class="demo-location"><div class="demo-pin">⌖</div><div><b>Primary Delivery Location</b><p>123, Koramangala 5th Block<br>Bengaluru, Karnataka 560095</p></div><button class="demo-edit" type="button">Edit address</button></div>
    <button class="demo-save" type="button">Save Changes</button>
  </div>`;

  let tries=0;
  function apply(){
    tries++;
    const overlay=document.getElementById('nsacct-overlay');
    const panel=document.getElementById('nsacct-panel');
    const body=document.getElementById('nsacct-body');
    if(!overlay||!panel||!body){if(tries<80)setTimeout(apply,100);return;}
    panel.classList.add('nsacct-v421-panel','nsacct-v421-preview');
    overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('nsacct-lock');
    if(!body.querySelector('.nsacct-v421-demo')||body.querySelectorAll('.demo-channel').length!==3){
      body.dataset.v421Demo='1';body.innerHTML=markup;
    }
    if(tries<35)setTimeout(apply,120);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply,{once:true}):apply();
})();
