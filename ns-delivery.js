/**
 * ns-delivery.js  —  Nariyal Sutra Delivery & Tracking Module
 * Version: 1.1
 *
 * RULES:
 * - All CSS class names prefixed .ns-del-* or .ns-hub-* or .ns-track-*
 * - Never touches existing cinematic CSS/JS
 * - Never modifies body, .hero, nav, img globally
 * - Inserts delivery choices after product selection, before address details
 * - Patches placeOrder() non-destructively via wrapper
 * - Customer chooses a preferred handover method; availability and charges remain subject to confirmation
 */

(function(){
'use strict';

/* ─── Helpers ─── */
function el(id){ return document.getElementById(id); }
function esc(s){ return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]);}); }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function genToken(){
  var a=new Uint8Array(24);
  try{ crypto.getRandomValues(a); }catch(e){ for(var i=0;i<24;i++) a[i]=rand(0,255); }
  return Array.from(a,function(b){return b.toString(16).padStart(2,'0')}).join('');
}
function genOTP(len){
  var digits='';
  var a=new Uint8Array(len);
  try{ crypto.getRandomValues(a); }catch(e){ for(var i=0;i<len;i++) a[i]=rand(0,9); }
  for(var i=0;i<len;i++) digits+=String(a[i]%10);
  return digits;
}

/* ─── Quantity bands (internal) ─── */
function qtyBand(q){
  if(q<10) return 'retail';
  if(q<25) return 'value';
  if(q<50) return 'small_event';
  if(q<100) return 'mini_bulk';
  if(q<250) return 'commercial';
  if(q<500) return 'regional_bulk';
  return 'wholesale';
}

/* ─── Delivery estimate logic ─── */
/* NOTE: These are illustrative ranges only.
   Real rates must be obtained from actual carrier quotes
   after physical pack/measure sessions. */
function deliveryEstimates(qty, isInternational){
  /* Customer chooses a preferred handover mode. Availability, fees and timing
     remain subject to stock, destination and the confirmed logistics plan. */
  if(isInternational){
    return [{ id:'trade', label:'International Trade Review', icon:'🌐',
      desc:'Destination, packaging, documentation, freight and timing are confirmed by quote', rangeMin:null, rangeMax:null,
      eta:'Confirmed after review', note:'Commercial quote required' }];
  }
  return [
    { id:'door', label:'Door Delivery', icon:'🏠',
      desc:'Deliver to your address, subject to serviceability and final logistics confirmation', rangeMin:null, rangeMax:null,
      eta:'Confirmed before dispatch', note:'Door serviceability review' },
    { id:'pickup_hub', label:'Pickup from Handover Hub', icon:'📦',
      desc:'Collect from a confirmed Nariyal Sutra or partner handover point in your area', rangeMin:null, rangeMax:null,
      eta:'Pickup point confirmed after review', note:'Pickup point confirmation required' },
    { id:'railway_station', label:'Railway Station Handover', icon:'🚆',
      desc:'Choose a convenient railway station; handover feasibility is confirmed before acceptance', rangeMin:null, rangeMax:null,
      eta:'Station and timing confirmed after review', note:'Station handover review' },
    { id:'bus_stop', label:'Bus Stand / Stop Handover', icon:'🚌',
      desc:'Choose a convenient bus stand or stop; handover feasibility is confirmed before acceptance', rangeMin:null, rangeMax:null,
      eta:'Stop and timing confirmed after review', note:'Bus handover review' }
  ];
}

/* ─── CSS injection (namespaced) ─── */
var CSS=`
.ns-del-section{margin-top:28px;border-top:1px solid rgba(212,168,67,0.12);padding-top:24px}
.ns-del-label{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(212,168,67,0.65);margin-bottom:12px;display:block}
.ns-del-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.ns-del-row.full{grid-template-columns:1fr}
.ns-del-field{display:grid;gap:6px}
.ns-del-field label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.38)}
.ns-del-field input,.ns-del-field select{width:100%;border:1px solid rgba(212,168,67,0.18);background:rgba(255,255,255,0.04);color:#fff;padding:11px 13px;font-family:'Jost',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
.ns-del-field input:focus,.ns-del-field select:focus{border-color:rgba(212,168,67,0.5)}
.ns-del-field select option{background:#0d1f09;color:#fff}
.ns-gps-btn{display:flex;align-items:center;gap:8px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.25);color:rgba(255,255,255,0.8);padding:10px 16px;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:1px;cursor:pointer;transition:.2s;margin-bottom:12px}
.ns-gps-btn:hover{background:rgba(212,168,67,0.15);color:#fff}
.ns-gps-status{font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:10px;min-height:16px}
.ns-gps-status.found{color:#a8e89a}
.ns-gps-status.error{color:#ffb0a8}.ns-gps-status.notice{color:rgba(245,209,126,.78)}
.ns-del-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px}
.ns-del-opt{width:100%;min-height:92px;border:1px solid rgba(212,168,67,0.15);background:rgba(255,255,255,0.025);padding:16px 18px;cursor:pointer;transition:.2s;display:flex;align-items:center;gap:14px;text-align:left;font-family:'Jost',sans-serif;color:inherit}
.ns-del-opt:hover{border-color:rgba(212,168,67,0.4);background:rgba(212,168,67,0.04)}
.ns-del-opt.selected{border-color:var(--gold);background:rgba(212,168,67,0.07)}
.ns-del-opt-icon{font-size:22px;flex-shrink:0}
.ns-del-opt-body{flex:1}
.ns-del-opt-name{font-size:13px;font-weight:500;color:#fff;margin-bottom:3px}
.ns-del-opt-desc{font-size:11px;color:rgba(255,255,255,0.38)}
.ns-del-opt-price{text-align:right;flex-shrink:0}
.ns-del-opt-range{font-family:'Playfair Display',serif;font-size:18px;color:var(--gold)}
.ns-del-opt-eta{font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px}
.ns-del-note{font-size:10px;color:rgba(255,255,255,0.42);margin-top:10px;line-height:1.65}
.ns-handover-panel{display:none;margin-top:14px;padding:16px;border:1px solid rgba(212,168,67,.18);background:rgba(212,168,67,.035)}
.ns-handover-panel.show{display:block}
.ns-handover-title{font-size:12px;font-weight:600;color:#fff;margin-bottom:4px}
.ns-handover-help{font-size:10px;line-height:1.65;color:rgba(255,255,255,.48);margin-bottom:12px}
.ns-handover-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.ns-find-btn{border:1px solid rgba(212,168,67,.28);background:rgba(212,168,67,.08);color:#f5d17e;padding:10px 13px;font:600 10px/1.2 'Jost',sans-serif;letter-spacing:.6px;cursor:pointer}
.ns-place-results{display:grid;gap:7px;margin-top:10px}
.ns-place-choice{width:100%;text-align:left;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#fff;padding:11px 12px;cursor:pointer;font:400 11px/1.45 'Jost',sans-serif}
.ns-place-choice:hover,.ns-place-choice:focus-visible{border-color:rgba(212,168,67,.48);background:rgba(212,168,67,.07)}
.ns-place-choice small{display:block;color:rgba(255,255,255,.58);margin-top:3px}
.ns-place-distance{display:block;margin-top:6px;color:#f0cf84;font-weight:650;font-size:11px}
.ns-handover-distance{display:block;margin-top:6px;color:#f0cf84;font-size:11px;line-height:1.45}
.ns-handover-status{min-height:16px;margin-top:8px;font-size:10px;color:rgba(255,255,255,.48);line-height:1.5}
.ns-handover-status.ok{color:#a8e89a}.ns-handover-status.warn{color:#f5d17e}.ns-handover-status.error{color:#ffb0a8}
.ns-recurring-opts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ns-recur-btn{border:1px solid rgba(212,168,67,0.2);background:transparent;color:rgba(255,255,255,0.6);padding:8px 14px;font-family:'Jost',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;transition:.2s}
.ns-recur-btn:hover,.ns-recur-btn.sel{border-color:var(--gold);color:var(--gold);background:rgba(212,168,67,0.06)}
.ns-summary-box{background:rgba(212,168,67,0.06);border:1px solid rgba(212,168,67,0.2);padding:16px 18px;margin-top:16px;font-size:13px;line-height:2;color:rgba(255,255,255,0.7)}
.ns-summary-box strong{color:#fff}
.ns-map-placeholder{background:rgba(255,255,255,0.03);border:1px solid rgba(212,168,67,0.1);padding:20px;text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:10px;display:none}
@media(max-width:680px){
  .ns-del-row,.ns-del-opts{grid-template-columns:1fr}
  .ns-del-opt{min-height:82px;padding:14px}
  .ns-del-field input,.ns-del-field select{font-size:16px;min-height:46px}
  .ns-gps-btn,.ns-find-btn,.ns-recur-btn{min-height:44px;touch-action:manipulation}
}

/* Checkout delivery choice: a distinct step, not a list of uniform admin-style rows. */
#ns-del-root{grid-column:1/-1;min-width:0;display:grid;gap:24px;margin:6px 0}
#ns-del-root .ns-del-section{margin:0;padding:24px;border:1px solid rgba(212,168,67,.2);background:linear-gradient(145deg,rgba(212,168,67,.075),rgba(7,21,9,.48) 58%,rgba(255,255,255,.015));border-radius:18px}
#ns-del-root .ns-del-section.ns-del-choice{border-color:rgba(212,168,67,.42);background:linear-gradient(120deg,rgba(212,168,67,.12),rgba(9,28,14,.75) 60%,rgba(255,255,255,.025));box-shadow:0 16px 44px rgba(0,0,0,.12)}
#ns-del-root .ns-step-tag{display:inline-block;color:#dfbb67;font:700 10px/1.5 'Jost',sans-serif;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}
#ns-del-root .ns-step-heading{font:400 clamp(25px,3.2vw,35px)/1.16 'Playfair Display',Georgia,serif;color:#f8f4e7;margin:0 0 10px;letter-spacing:-.01em}
#ns-del-root .ns-step-intro{font:400 13px/1.65 'Jost',sans-serif;color:rgba(255,255,255,.7);max-width:590px;margin:0 0 18px}
#ns-del-root .ns-del-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;max-width:none;min-width:0;justify-self:stretch;align-items:stretch;gap:14px}
#ns-del-root .ns-del-section.ns-del-choice{display:block;width:100%;min-width:0;box-sizing:border-box}
#ns-del-root .ns-del-opt{box-sizing:border-box;min-width:0;width:100%;height:100%;min-height:126px;display:grid;grid-template-columns:42px minmax(0,1fr);align-content:start;align-items:start;padding:20px 44px 18px 18px}
#ns-del-root .ns-del-opt-icon{grid-column:1;width:40px;height:40px}
#ns-del-root .ns-del-opt-body{grid-column:2;min-width:0;overflow-wrap:anywhere}
#ns-del-root .ns-del-opt-name{font-size:16px;line-height:1.35;margin:0 0 6px}
#ns-del-root .ns-del-opt-desc{font-size:12px;line-height:1.55;max-width:45ch}
#ns-del-root .ns-del-opt-state{margin-top:10px}
@media(max-width:680px){#ns-del-root .ns-del-opts{grid-template-columns:minmax(0,1fr)}#ns-del-root .ns-del-opt{min-height:104px;padding:16px 42px 15px 14px}}
#ns-del-root .ns-del-opt{position:relative;min-height:138px;border:1px solid rgba(236,207,138,.22);border-radius:13px;padding:20px 18px;align-items:flex-start;gap:12px;background:rgba(4,18,9,.54);overflow:hidden}
#ns-del-root .ns-del-opt:hover{border-color:rgba(236,207,138,.65);background:rgba(236,207,138,.065);transform:translateY(-1px)}
#ns-del-root .ns-del-opt:focus-visible{outline:2px solid #f4d17e;outline-offset:3px}
#ns-del-root .ns-del-opt.selected{background:linear-gradient(120deg,rgba(221,182,90,.19),rgba(18,40,22,.8));border-color:#e0ba68;box-shadow:inset 0 0 0 1px rgba(224,186,104,.28)}
#ns-del-root .ns-del-opt-icon{font-size:25px;line-height:1.2;display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:rgba(232,197,117,.13)}
#ns-del-root .ns-del-opt-name{font-size:15px;letter-spacing:.1px;margin:2px 0 7px;font-weight:600}
#ns-del-root .ns-del-opt-desc{font-size:12px;line-height:1.65;color:rgba(255,255,255,.7)}
#ns-del-root .ns-del-opt-state{display:flex;align-items:center;gap:4px;margin-top:12px;color:rgba(255,255,255,.6);font-size:10px;font-weight:600;letter-spacing:.4px}
#ns-del-root .ns-del-opt.selected .ns-del-opt-state{color:#f2d78f}
#ns-del-root .ns-del-opt-check{position:absolute;top:13px;right:13px;width:19px;height:19px;border:1px solid rgba(224,186,104,.5);border-radius:50%;display:grid;place-items:center;color:transparent;font-size:12px}
#ns-del-root .ns-del-opt.selected .ns-del-opt-check{background:#e6c476;color:#102015;border-color:#e6c476}
#ns-del-root .ns-del-result{margin-top:15px;padding:13px 15px;border-left:3px solid #ddb66c;border-radius:0 8px 8px 0;background:rgba(221,182,108,.07);font:400 12px/1.55 'Jost',sans-serif;color:rgba(255,255,255,.75)}
#ns-del-root .ns-del-result strong{color:#f2d78f}
#ns-del-root .ns-del-result small{display:block;font-size:11px;color:rgba(255,255,255,.55);margin-top:4px}
#ns-del-root .ns-recurring-opts{gap:9px}
#ns-del-root .ns-recur-btn{border-radius:24px;letter-spacing:.2px;font-size:12px;padding:12px 16px;min-height:44px}
#ns-del-root .ns-recur-btn.sel{background:rgba(218,179,90,.18);color:#f6db9f}
#ns-del-root .ns-handover-panel{border-radius:10px;background:rgba(2,15,7,.5)}
#ns-del-root .ns-del-field label{color:rgba(251,225,166,.82);font-size:10px;letter-spacing:1px}
#ns-del-root .ns-del-field input,#ns-del-root .ns-del-field select{min-height:46px;border-radius:7px;background:rgba(0,0,0,.15);border-color:rgba(212,168,67,.35)}
#ns-del-root .ns-del-field input:focus-visible,#ns-del-root .ns-del-field select:focus-visible{outline:2px solid #d4a843;outline-offset:2px}
.ns-summary-box{grid-column:1/-1;border-radius:10px}
#order .ofields>.of.full:has(#oA),#order .ofields>.of.full:has(#oCity){min-width:0}
@media(max-width:680px){
  #ns-del-root{gap:16px}
  #ns-del-root .ns-del-section{padding:18px 14px;border-radius:12px}
  #ns-del-root .ns-del-opt{min-height:106px;padding:17px 15px}
  #ns-del-root .ns-del-opts{grid-template-columns:1fr}
  #ns-del-root .ns-del-opt-desc{font-size:12px}
  #ns-del-root .ns-del-opt-name{font-size:14px}
  #ns-del-root .ns-del-opt-check{top:10px;right:10px}
}

/* Order Hub */
.ns-hub-overlay{display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);align-items:center;justify-content:center;padding:16px}
.ns-hub-overlay.open{display:flex}
.ns-hub-card{background:#0d1f09;border:1px solid rgba(212,168,67,0.2);width:min(560px,100%);max-height:90vh;overflow-y:auto;padding:32px;position:relative}
.ns-hub-close{position:absolute;top:14px;right:16px;background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;cursor:pointer;font-size:14px;border-radius:50%}
.ns-hub-title{font-family:'Playfair Display',serif;font-size:28px;color:var(--gold);margin-bottom:4px}
.ns-hub-subtitle{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:24px}
.ns-hub-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px}
.ns-hub-row:last-of-type{border-bottom:none}
.ns-hub-key{color:rgba(255,255,255,0.4)}
.ns-hub-val{color:#fff;font-weight:500;text-align:right;max-width:60%}
.ns-hub-otp{background:rgba(212,168,67,0.1);border:1px solid rgba(212,168,67,0.3);padding:16px;text-align:center;margin:16px 0}
.ns-hub-otp-num{font-family:'Playfair Display',serif;font-size:36px;color:var(--gold);letter-spacing:8px}
.ns-hub-otp-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-top:6px}
.ns-hub-timeline{display:flex;flex-direction:column;gap:0;margin:20px 0}
.ns-hub-step{display:flex;gap:14px;align-items:flex-start}
.ns-hub-step-dot{width:12px;height:12px;border-radius:50%;border:2px solid rgba(212,168,67,0.3);background:transparent;flex-shrink:0;margin-top:3px}
.ns-hub-step-dot.done{background:var(--gold);border-color:var(--gold)}
.ns-hub-step-dot.active{background:rgba(212,168,67,0.4);border-color:var(--gold);box-shadow:0 0 0 4px rgba(212,168,67,0.1)}
.ns-hub-step-line{width:2px;background:rgba(212,168,67,0.15);height:24px;margin:0 0 0 5px}
.ns-hub-step-label{font-size:12px;color:rgba(255,255,255,0.5)}
.ns-hub-step-label.active{color:#fff;font-weight:500}
.ns-hub-step-label.done{color:rgba(212,168,67,0.7)}
.ns-hub-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.ns-hub-act{flex:1;min-width:120px;border:1px solid rgba(212,168,67,0.25);background:transparent;color:rgba(255,255,255,0.75);padding:11px 14px;font-family:'Jost',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:.2s}
.ns-hub-act:hover{border-color:var(--gold);color:#fff}
.ns-hub-act.primary{background:var(--gold);color:#060e03;border-color:var(--gold)}
.ns-track-link{font-size:11px;color:rgba(212,168,67,0.6);word-break:break-all;margin-top:8px;display:block}
`;
var styleEl=document.createElement('style');
styleEl.textContent=CSS;
document.head.appendChild(styleEl);

/* ─── State ─── */
var nsDelivery={
  country:'India',
  state:'', city:'', pin:'', address2:'',
  landmark:'',
  lat:null, lng:null, accuracy:null,
  selectedDelivery:'door',
  handoverPointType:'door',
  handoverPointName:'',
  handoverPointAddress:'',
  handoverPointLat:null,
  handoverPointLng:null,
  handoverSearchSource:'',
  handoverNote:'',
  recurring:'onetime',
  trackingToken:null,
  deliveryOTP:null,
  isInternational:false
};
window.NSDeliveryState=nsDelivery;

/* ─── Inject delivery fields into order form ─── */
function injectDeliveryFields(){
  var product=el('oPr');
  if(!product){ console.warn('[ns-delivery] product selector not found'); return; }
  var wrapper=product.closest('.of');
  if(!wrapper) return;

  /* Check if already injected */
  if(el('ns-del-root')) return;

  var html=`
<div id="ns-del-root">

  <!-- Delivery preference: presented BEFORE location and address fields -->
  <div class="ns-del-section ns-del-choice" id="ns-del-opts-section" aria-labelledby="ns-del-choice-title" style="display:none">
    <span class="ns-step-tag">STEP 02 · YOUR DELIVERY PREFERENCE</span>
    <h3 class="ns-step-heading" id="ns-del-choice-title">How would you like to receive your order?</h3>
    <p class="ns-step-intro">Choose what is convenient for you. We will check availability, any additional charges and timing before confirming your order.</p>
    <div class="ns-del-opts" id="ns-del-opts-list"></div>
    <div class="ns-del-result" id="ns-del-choice-status" role="status" aria-live="polite"></div>

    <div class="ns-handover-panel" id="ns-handover-panel">
      <div class="ns-handover-title" id="ns-handover-title">Handover point</div>
      <div class="ns-handover-help" id="ns-handover-help"></div>
      <div class="ns-del-field">
        <label for="ns-handover-name" id="ns-handover-label">Preferred point</label>
        <input type="text" id="ns-handover-name" placeholder="Enter a station, stop or preferred area" oninput="nsHandoverInput()">
      </div>
      <div class="ns-handover-actions" id="ns-handover-actions"></div>
      <div class="ns-place-results" id="ns-place-results"></div>
      <div class="ns-handover-status" id="ns-handover-status"></div>
      <div class="ns-del-field" style="margin-top:10px">
        <label for="ns-handover-note">Handover note (optional)</label>
        <input type="text" id="ns-handover-note" maxlength="240" placeholder="e.g. East entrance, call 15 minutes before arrival" oninput="nsHandoverNote()">
      </div>
    </div>
  </div>

  <!-- Optional recurring preference -->
  <div class="ns-del-section ns-del-frequency">
    <span class="ns-step-tag">YOUR ORDER PLAN · OPTIONAL</span>
    <h3 class="ns-step-heading">Just once or regularly?</h3>
    <p class="ns-step-intro">Planning regular coconut deliveries? Tell us how often you would like to order. This is only a preference — no automatic orders or payments.</p>
    <div class="ns-recurring-opts">
      <button type="button" class="ns-recur-btn sel" onclick="nsSetRecurring('onetime',this)">One time</button>
      <button type="button" class="ns-recur-btn" onclick="nsSetRecurring('weekly',this)">Weekly</button>
      <button type="button" class="ns-recur-btn" onclick="nsSetRecurring('fortnightly',this)">Every 2 weeks</button>
      <button type="button" class="ns-recur-btn" onclick="nsSetRecurring('monthly',this)">Monthly</button>
      <button type="button" class="ns-recur-btn" onclick="nsSetRecurring('flexible',this)">Regular / Flexible</button>
    </div>
  </div>

  <!-- Location / serviceability details (after handover preference) -->
  <div class="ns-del-section ns-del-location" id="ns-del-location-step">
    <span class="ns-step-tag">STEP 03 · LOCATION DETAILS</span>
    <h3 class="ns-step-heading">Where should we arrange it?</h3>
    <p class="ns-step-intro" id="ns-address-help">Enter your delivery address or locality so we can check availability. You can refine your location with a map pin below.</p>

    <button type="button" class="ns-gps-btn" onclick="nsDelGPS()">
      📍 Use my current location
    </button>
    <div class="ns-gps-status" id="ns-gps-status"></div>

    <div class="ns-del-row">
      <div class="ns-del-field">
        <label for="ns-country">Country</label>
        <select id="ns-country" onchange="nsDelCountryChange()">
          <option value="India" selected>India</option>
          <option value="UAE">UAE</option>
          <option value="UK">UK</option>
          <option value="USA">USA</option>
          <option value="Australia">Australia</option>
          <option value="Canada">Canada</option>
          <option value="Singapore">Singapore</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Saudi Arabia">Saudi Arabia</option>
          <option value="Qatar">Qatar</option>
          <option value="Kuwait">Kuwait</option>
          <option value="Other">Other (enter below)</option>
        </select>
      </div>
      <div class="ns-del-field" id="ns-state-field">
        <label for="ns-state">State / Province</label>
        <input type="text" id="ns-state" placeholder="e.g. Maharashtra" autocomplete="address-level1" oninput="nsDelUpdate()">
      </div>
    </div>

    <div class="ns-del-row">
      <div class="ns-del-field">
        <label for="ns-pin">PIN / Postal Code</label>
        <input type="text" id="ns-pin" placeholder="e.g. 400001" inputmode="numeric" autocomplete="postal-code" oninput="nsDelUpdate()">
      </div>
      <div class="ns-del-field">
        <label for="ns-landmark">Landmark (optional)</label>
        <input type="text" id="ns-landmark" placeholder="e.g. Near railway station">
      </div>
    </div>

    <div class="ns-del-row full">
      <div class="ns-del-field">
        <label for="ns-country-other" id="ns-other-label" style="display:none">Enter Country</label>
        <input type="text" id="ns-country-other" placeholder="Enter your country" style="display:none" oninput="nsDelUpdate()">
      </div>
    </div>

    <div class="ns-map-placeholder" id="ns-map-ph">
      📌 Location pin set — <span id="ns-coords-display"></span><br>
      <small style="color:rgba(255,255,255,0.25)">Precise coordinates saved with your order</small>
    </div>
  </div>

  <!-- International notice -->
  <div id="ns-intl-notice" style="display:none;background:rgba(157,223,255,0.06);border:1px solid rgba(157,223,255,0.2);padding:14px 16px;margin:16px 0;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.8">
    🌐 <strong style="color:#fff">International / Trade Enquiry</strong><br>
    International orders are handled as a review process. Our team will contact you to confirm supply availability, freight, and a formal quote. No automatic delivery pricing applies for international shipments.
  </div>

  <!-- Delivery summary -->
  <div class="ns-summary-box" id="ns-del-summary" style="display:none"></div>

</div>
`;
  /* The choice step sits after product selection and BEFORE address/locality. */
  wrapper.insertAdjacentHTML('afterend', html);
  /* Keep the live summary after the address and order note, before payment. */
  var recap=el('ns-del-summary'),notes=el('oX')?.closest('.of.full');
  if(recap&&notes) notes.insertAdjacentElement('afterend',recap);
  try{window.dispatchEvent(new CustomEvent('nsv21:delivery-fields-ready'));}catch(e){}
}

/* ─── GPS ─── */
window.nsDelGPS = function(){
  var statusEl=el('ns-gps-status');
  if(!statusEl) return;
  statusEl.textContent='Requesting location…';
  statusEl.className='ns-gps-status';

  if(!navigator.geolocation){
    statusEl.textContent='Geolocation not supported by your browser. Please enter address manually.';
    statusEl.className='ns-gps-status error';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function(pos){
      nsDelivery.lat=pos.coords.latitude;
      nsDelivery.lng=pos.coords.longitude;
      nsDelivery.accuracy=pos.coords.accuracy;

      statusEl.textContent='Location found (±'+Math.round(pos.coords.accuracy)+'m) — confirm or edit below';
      statusEl.className='ns-gps-status found';

      var coordEl=el('ns-coords-display');
      var mapPh=el('ns-map-ph');
      if(coordEl) coordEl.textContent=pos.coords.latitude.toFixed(5)+', '+pos.coords.longitude.toFixed(5);
      if(mapPh) mapPh.style.display='block';

      /* Try reverse geocode via open API */
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+pos.coords.latitude+'&lon='+pos.coords.longitude+'&zoom=14&addressdetails=1',
        {headers:{'User-Agent':'NariyalSutra/1.0'}})
      .then(function(r){return r.json();})
      .then(function(d){
        var addr=d.address||{};
        var state=addr.state||addr.state_district||'';
        var city=addr.city||addr.town||addr.village||addr.county||'';
        var pin=addr.postcode||'';
        var suburb=addr.suburb||addr.neighbourhood||addr.locality||'';

        if(el('ns-state')) el('ns-state').value=state;
        if(el('ns-pin'))   el('ns-pin').value=pin;
        if(el('oCity') && city) el('oCity').value=city;
        if(el('ns-landmark') && suburb && !el('ns-landmark').value) el('ns-landmark').value=suburb;

        nsDelivery.state=state;
        nsDelivery.city=city;
        nsDelivery.pin=pin;

        statusEl.textContent='✓ Location found: '+[city,state].filter(Boolean).join(', ')+(pin?' — '+pin:'')+'  — confirm or edit';
        statusEl.className='ns-gps-status found';
        nsDelShowOptions();
      })
      .catch(function(){
        statusEl.textContent='✓ Coordinates captured. Please confirm state, city and PIN manually.';
        statusEl.className='ns-gps-status found';
      });
    },
    function(err){
      var msgs={1:'Location is optional. Continue with the address fields below, or allow Location in your browser\'s site settings if you want to use GPS.',2:'Current location is unavailable. You can continue with the address fields below.',3:'Location request timed out — please enter address manually.'};
      statusEl.textContent=msgs[err.code]||'Location unavailable. Please enter manually.';
      statusEl.className=err.code===1?'ns-gps-status notice':'ns-gps-status error';
    },
    {enableHighAccuracy:true,timeout:12000,maximumAge:0}
  );
};

/* ─── Country change ─── */
window.nsDelCountryChange = function(){
  var sel=el('ns-country');
  var other=el('ns-country-other');
  var otherLabel=el('ns-other-label');
  var intlNotice=el('ns-intl-notice');
  if(!sel) return;
  var v=sel.value;
  nsDelivery.country=v;
  nsDelivery.isInternational=(v!=='India');

  if(other){
    var showOther=(v==='Other');
    other.style.display=showOther?'block':'none';
    if(otherLabel) otherLabel.style.display=showOther?'block':'none';
    if(showOther) nsDelivery.isInternational=true;
  }
  if(intlNotice) intlNotice.style.display=nsDelivery.isInternational?'block':'none';

  nsDelivery.selectedDelivery=nsDelivery.isInternational?'trade':'door';
  nsDelivery.handoverPointType=nsDelivery.selectedDelivery;
  if(nsDelivery.isInternational){
    nsDelivery.handoverPointName='';
    nsDelivery.handoverPointAddress='';
    nsDelivery.handoverPointLat=null;
    nsDelivery.handoverPointLng=null;
    nsDelivery.handoverSearchSource='';
  }
  nsDelShowOptions();
};

/* ─── Show delivery options ─── */
function nsDelShowOptions(){
  var q=parseInt((el('oQ')||{}).value)||1;
  var optsSection=el('ns-del-opts-section');
  var optsList=el('ns-del-opts-list');
  if(!optsSection||!optsList) return;

  var opts=deliveryEstimates(q, nsDelivery.isInternational);
  /* A later checkout layout stylesheet forces this section to a two-column grid. Keep the four delivery cards across the full section, not inside its first column. */
  optsSection.style.setProperty('display','block','important');
  if(!opts.some(function(o){return o.id===nsDelivery.selectedDelivery;})){
    nsDelivery.selectedDelivery=opts[0]?opts[0].id:null;
  }
  optsList.innerHTML=opts.map(function(opt){
    return '<button type="button" class="ns-del-opt'+(nsDelivery.selectedDelivery===opt.id?' selected':'')+'" id="ns-opt-'+opt.id+'" onclick="nsSelectDelivery(\''+opt.id+'\')" aria-pressed="'+(nsDelivery.selectedDelivery===opt.id?'true':'false')+'">'+
      '<div class="ns-del-opt-icon">'+opt.icon+'</div>'+
      '<div class="ns-del-opt-body">'+
        '<div class="ns-del-opt-name">'+esc(opt.label)+'</div>'+
        '<div class="ns-del-opt-desc">'+esc(opt.desc)+'</div>'+
        '<span class="ns-del-opt-state" aria-hidden="true">'+(nsDelivery.selectedDelivery===opt.id?'✓ Selected':'Select this option')+'</span>'+
      '</div>'+
      '<span class="ns-del-opt-check" aria-hidden="true">✓</span>'+

    '</button>';
  }).join('');

  nsRenderHandoverPanel();
  nsUpdateAddressPrompt();
  nsDelUpdateSummary();
}

function handoverConfig(id){
  if(id==='pickup_hub')return {
    title:'Preferred pickup area',
    label:'Preferred city / area',
    placeholder:'e.g. Andheri East, Mumbai',
    help:'Tell us the area that is easiest for you. If pickup is available, we will confirm the exact Nariyal Sutra or partner handover point before you travel.',
    find:false
  };
  if(id==='railway_station')return {
    title:'Preferred railway station',
    label:'Railway station',
    placeholder:'e.g. Jabalpur Junction',
    help:'Choose or enter the station that is most convenient for you. Station handover is confirmed only when the route and timing are workable.',
    find:true,
    kind:'railway_station',
    button:'Find nearby railway stations'
  };
  if(id==='bus_stop')return {
    title:'Preferred bus stand / stop',
    label:'Bus stand / stop',
    placeholder:'e.g. ISBT Bhopal',
    help:'Choose or enter a convenient bus stand or stop. Bus handover is confirmed only when the route and timing are workable.',
    find:true,
    kind:'bus_stop',
    button:'Find nearby bus stands'
  };
  return null;
}

function nsRenderHandoverPanel(){
  var panel=el('ns-handover-panel'),cfg=handoverConfig(nsDelivery.selectedDelivery);
  if(!panel)return;
  if(!cfg||nsDelivery.isInternational){
    panel.classList.remove('show');
    if(nsDelivery.selectedDelivery==='door'||nsDelivery.selectedDelivery==='trade'){
      nsDelivery.handoverPointType=nsDelivery.selectedDelivery;
      nsDelivery.handoverPointName='';
      nsDelivery.handoverPointAddress='';
      nsDelivery.handoverPointLat=null;
      nsDelivery.handoverPointLng=null;
      nsDelivery.handoverSearchSource='';
      nsDelivery.handoverNote='';
    }
    return;
  }
  panel.classList.add('show');
  nsDelivery.handoverPointType=nsDelivery.selectedDelivery;
  if(el('ns-handover-title'))el('ns-handover-title').textContent=cfg.title;
  if(el('ns-handover-label'))el('ns-handover-label').textContent=cfg.label;
  if(el('ns-handover-help'))el('ns-handover-help').textContent=cfg.help;
  var input=el('ns-handover-name');
  if(input){input.placeholder=cfg.placeholder;input.value=nsDelivery.handoverPointName||'';}
  var note=el('ns-handover-note');if(note)note.value=nsDelivery.handoverNote||'';
  var actions=el('ns-handover-actions');
  if(actions)actions.innerHTML=cfg.find?'<button type="button" class="ns-find-btn" onclick="nsFindHandover(\''+cfg.kind+'\')">'+cfg.button+'</button>':'';
  var results=el('ns-place-results');if(results)results.innerHTML='';
  var status=el('ns-handover-status');if(status){status.textContent='';status.className='ns-handover-status';}
}

window.nsSelectDelivery = function(id){
  if(nsDelivery.handoverPointType!==id){
    nsDelivery.handoverPointName='';
    nsDelivery.handoverPointAddress='';
    nsDelivery.handoverPointLat=null;
    nsDelivery.handoverPointLng=null;
    nsDelivery.handoverSearchSource='';
    nsDelivery.handoverNote='';
  }
  nsDelivery.selectedDelivery=id;
  nsDelivery.handoverPointType=id;
  document.querySelectorAll('.ns-del-opt').forEach(function(o){
    var on=o.id==='ns-opt-'+id;
    o.classList.toggle('selected',on);
    o.setAttribute('aria-pressed',on?'true':'false');
  });
  nsRenderHandoverPanel();
  document.querySelectorAll('.ns-del-opt').forEach(function(card){
    var state=card.querySelector('.ns-del-opt-state');
    if(state) state.textContent=card.classList.contains('selected')?'✓ Selected':'Select this option';
  });
  nsUpdateAddressPrompt();
  nsDelUpdateSummary();
};

window.nsHandoverInput=function(){
  nsDelivery.handoverPointName=((el('ns-handover-name')||{}).value||'').trim();
  /* Manual name edits supersede a previously selected search result. */
  nsDelivery.handoverPointAddress='';
  nsDelivery.handoverPointLat=null;
  nsDelivery.handoverPointLng=null;
  nsDelivery.handoverSearchSource=nsDelivery.handoverPointName?'manual':'';
  nsUpdateDisplayedDistances();
  nsDelUpdateSummary();
};

window.nsHandoverNote=function(){
  nsDelivery.handoverNote=((el('ns-handover-note')||{}).value||'').trim();
  nsDelUpdateSummary();
};

function placeLabel(result){
  var name=String(result.display_name||'').split(',')[0].trim();
  return name||String(result.name||'').trim()||'Selected location';
}

/* Straight-line (not road) distance, calculated locally only from an explicitly
   selected checkout location and a returned handover-point coordinate. */
function nsValidCoordinates(lat,lng){
  return lat!==null&&lat!==undefined&&lat!==''&&lng!==null&&lng!==undefined&&lng!==''&&
    Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&
    Math.abs(Number(lat))<=90&&Math.abs(Number(lng))<=180;
}
function nsStraightLineKm(lat,lng){
  if(!nsValidCoordinates(nsDelivery.lat,nsDelivery.lng)||!nsValidCoordinates(lat,lng))return null;
  var rad=Math.PI/180,a1=Number(nsDelivery.lat)*rad,a2=Number(lat)*rad,deltaLat=(Number(lat)-Number(nsDelivery.lat))*rad,deltaLng=(Number(lng)-Number(nsDelivery.lng))*rad;
  var a=Math.sin(deltaLat/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(deltaLng/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(a)));
}
function nsDistanceText(lat,lng){
  var km=nsStraightLineKm(lat,lng);
  return km===null?'':'Approx. '+(km<1?Math.round(km*1000/50)*50+' m':km.toFixed(1)+' km')+' straight-line · road distance may differ';
}
function nsUpdateDisplayedDistances(){
  var results=el('ns-place-results'),items=results&&results._nsPlaces||[];
  if(results)Array.from(results.querySelectorAll('[data-ns-place]')).forEach(function(button){
    var idx=Number(button.dataset.nsPlace),point=items[idx],label=button.querySelector('.ns-place-distance');
    if(label&&point){var value=nsDistanceText(point.lat,point.lon);label.textContent=value;label.hidden=!value;}
  });
  var selected=el('ns-handover-distance');
  if(selected){
    var text=nsDistanceText(nsDelivery.handoverPointLat,nsDelivery.handoverPointLng);
    selected.textContent=text;selected.hidden=!text;
  }
}
window.addEventListener('ns:location-updated',function(){
  nsUpdateDisplayedDistances();
  nsDelUpdateSummary();
});

window.nsFindHandover=async function(kind){
  var status=el('ns-handover-status'),results=el('ns-place-results');
  if(status){status.textContent=kind==='railway_station'?'Finding railway stations…':'Finding bus stands…';status.className='ns-handover-status';}
  if(results){results.innerHTML='';results._nsPlaces=[];}
  try{
    var city=((el('oCity')||{}).value||nsDelivery.city||'').trim();
    var state=((el('ns-state')||{}).value||nsDelivery.state||'').trim();
    var q=kind==='railway_station'?'railway station':'bus station';
    var params=new URLSearchParams({format:'jsonv2',limit:'5',addressdetails:'1',countrycodes:'in'});
    if(nsDelivery.lat!==null&&nsDelivery.lng!==null){
      var d=.32,lat=Number(nsDelivery.lat),lng=Number(nsDelivery.lng);
      params.set('q',q);
      params.set('viewbox',[lng-d,lat+d,lng+d,lat-d].join(','));
      params.set('bounded','1');
    }else{
      if(!city&&!state){
        if(status){status.textContent='Add your city or use current location first, then search again.';status.className='ns-handover-status warn';}
        return;
      }
      params.set('q',[q,city,state,'India'].filter(Boolean).join(', '));
    }
    var response=await fetch('https://nominatim.openstreetmap.org/search?'+params.toString(),{headers:{'Accept-Language':'en'}});
    if(!response.ok)throw new Error('Location search returned '+response.status);
    var items=await response.json();
    if(!Array.isArray(items)||!items.length){
      if(status){status.textContent='No nearby result was found. You can enter the station or stop manually.';status.className='ns-handover-status warn';}
      return;
    }
    if(results){
      results.innerHTML=items.slice(0,5).map(function(item,idx){
        var label=placeLabel(item),detail=String(item.display_name||'');
        return '<button type="button" class="ns-place-choice" onclick="nsChooseHandover('+idx+')" data-ns-place="'+idx+'"><strong>'+esc(label)+'</strong><small>'+esc(detail)+'</small><span class="ns-place-distance"'+(nsDistanceText(item.lat,item.lon)?'':' hidden')+'>'+esc(nsDistanceText(item.lat,item.lon))+'</span></button>';
      }).join('');
      results._nsPlaces=items.slice(0,5);
      nsUpdateDisplayedDistances();
    }
    if(status){status.textContent='Choose the most convenient location below, or type another one manually.';status.className='ns-handover-status ok';}
  }catch(err){
    console.warn('[ns-delivery] handover search failed',err);
    if(status){status.textContent='Nearby search is unavailable right now. Enter the station or stop manually and we will confirm it with you.';status.className='ns-handover-status warn';}
  }
};

window.nsChooseHandover=function(idx){
  var results=el('ns-place-results'),items=results&&results._nsPlaces||[],item=items[idx];
  if(!item)return;
  nsDelivery.handoverPointName=placeLabel(item);
  nsDelivery.handoverPointAddress=String(item.display_name||'').slice(0,300);
  nsDelivery.handoverPointLat=Number(item.lat);
  nsDelivery.handoverPointLng=Number(item.lon);
  nsDelivery.handoverSearchSource='nominatim';
  var input=el('ns-handover-name');if(input)input.value=nsDelivery.handoverPointName;
  if(results){results.innerHTML='';results._nsPlaces=[];}
  var status=el('ns-handover-status');if(status){status.textContent='✓ Preferred handover point selected. We will confirm feasibility and timing before fulfilment.';status.className='ns-handover-status ok';}
  nsUpdateDisplayedDistances();
  nsDelUpdateSummary();
};

/* ─── Update on any change ─── */
window.nsDelUpdate = function(){
  nsDelivery.state=(el('ns-state')||{}).value||'';
  nsDelivery.city=(el('oCity')||{}).value||'';
  nsDelivery.pin=(el('ns-pin')||{}).value||'';
  nsDelivery.landmark=(el('ns-landmark')||{}).value||'';
  nsDelivery.handoverNote=((el('ns-handover-note')||{}).value||nsDelivery.handoverNote||'').trim();
  nsDelShowOptions();
};

/* ─── Recurring ─── */
window.nsSetRecurring = function(val, btn){
  nsDelivery.recurring=val;
  document.querySelectorAll('.ns-recur-btn').forEach(function(b){b.classList.remove('sel');});
  if(btn) btn.classList.add('sel');
  nsDelUpdateSummary();
};


/* A collection request still needs the customer's locality to check feasibility;
   never imply they must supply the handover point's street address. */
function nsUpdateAddressPrompt(){
  var label=document.querySelector('label[for="oA"]'),address=el('oA'),help=el('ns-address-help');
  var collection=['pickup_hub','railway_station','bus_stop'].includes(nsDelivery.selectedDelivery);
  if(label)label.textContent=collection?'Your locality / contact address for serviceability':nsDelivery.isInternational?'Destination / contact address for trade review':'Address / locality for serviceability';
  if(address)address.placeholder=collection?'Your locality, city, state and PIN code (not the pickup-point address)':nsDelivery.isInternational?'Destination city, region, country and contact address':'House / street or locality, city, state and PIN code';
  if(help)help.textContent=collection?'Tell us your area or contact address for serviceability. Your chosen handover point will be confirmed separately before you travel.':nsDelivery.isInternational?'Provide the destination and your contact address for a formal trade quote.': 'Provide your delivery address or locality. We will confirm the delivery slot and charges before fulfilment.';
}

/* ─── Summary ─── */
function nsDelUpdateSummary(){
  var summaryEl=el('ns-del-summary');
  if(!summaryEl)return;
  var q=parseInt((el('oQ')||{}).value)||1;
  var price=typeof getCurrentPrice==='function'?getCurrentPrice():(window.ot==='bulk'?45:55);
  var subtotal=q*price;
  var opts=deliveryEstimates(q,nsDelivery.isInternational);
  var chosen=opts.find(function(o){return o.id===nsDelivery.selectedDelivery;});
  var freq={onetime:'One-time order',weekly:'Weekly (preference)',fortnightly:'Every 2 weeks (preference)',monthly:'Monthly (preference)',flexible:'Flexible repeat order (preference)'};
  var choiceStatus=el('ns-del-choice-status');
  if(choiceStatus)choiceStatus.innerHTML='<strong>✓ '+esc(chosen?.label||'Preferred method')+' selected</strong><small>Availability, charges and timing will be confirmed before your order is accepted.'+(nsDelivery.isInternational?' International requests are reviewed by our Trade Desk.':'')+'</small>';
  summaryEl.style.display='block';
  summaryEl.innerHTML=
    '<strong>Your request at a glance</strong><br>'+
    'Products: <strong>₹'+subtotal.toLocaleString('en-IN')+'</strong> ('+q+' pieces)<br>'+
    (chosen?'Preferred handover: <strong>'+esc(chosen.label)+'</strong><br>':'')+
    (nsDelivery.handoverPointName?'Preferred point: <strong>'+esc(nsDelivery.handoverPointName)+'</strong><br>':'')+
    (['railway_station','bus_stop'].includes(nsDelivery.selectedDelivery)&&nsDistanceText(nsDelivery.handoverPointLat,nsDelivery.handoverPointLng)?'Approx. distance to handover point: <strong>'+esc(nsDistanceText(nsDelivery.handoverPointLat,nsDelivery.handoverPointLng))+'</strong><br>':'')+
    'Order plan: <strong>'+esc(freq[nsDelivery.recurring]||'One-time order')+'</strong><br>'+
    'Delivery / handover charge: <strong>Confirmed after serviceability review</strong><br>'+
    '<small style="display:block;line-height:1.5;color:rgba(255,255,255,.57);margin-top:5px">₹'+subtotal.toLocaleString('en-IN')+' is the product subtotal, not a final delivery-inclusive price. Repeat selections do not create an automatic subscription.</small>';
}

/* ─── Patch placeOrder to include delivery data ─── */
function patchPlaceOrder(){
  if(typeof window.placeOrder!=='function') return;
  var orig=window.placeOrder;
  window.placeOrder=function(){
    /* Build delivery data before calling original */
    var q=parseInt((el('oQ')||{}).value)||1;
    var opts=deliveryEstimates(q, nsDelivery.isInternational);
    var chosen=opts.find(function(o){return o.id===nsDelivery.selectedDelivery;});
    var token=genToken();
    var otp=genOTP(6);
    var needsNamedPoint=nsDelivery.selectedDelivery==='railway_station'||nsDelivery.selectedDelivery==='bus_stop';
    if(needsNamedPoint&&!String(nsDelivery.handoverPointName||'').trim()){
      var handoverStatus=el('ns-handover-status'),handoverPanel=el('ns-handover-panel');
      if(handoverStatus){handoverStatus.textContent='Choose or enter your preferred station / stop before continuing.';handoverStatus.className='ns-handover-status warn';}
      if(handoverPanel)handoverPanel.scrollIntoView({behavior:'smooth',block:'center'});
      var handoverInput=el('ns-handover-name');if(handoverInput)handoverInput.focus();
      return;
    }
    nsDelivery.trackingToken=token;
    nsDelivery.deliveryOTP=otp;

    /* Attach extra data to NS_SAVE_ORDER via window.NS_DELIVERY_EXTRA */
    window.NS_DELIVERY_EXTRA={
      country:nsDelivery.country==='Other'?((el('ns-country-other')||{}).value||'Other'):nsDelivery.country,
      state:nsDelivery.state,
      pin:nsDelivery.pin,
      landmark:nsDelivery.landmark,
      deliveryLat:nsDelivery.lat,
      deliveryLng:nsDelivery.lng,
      deliveryAccuracy:nsDelivery.accuracy,
      deliveryMethod:nsDelivery.selectedDelivery||'pending',
      deliveryLabel:chosen?chosen.label:'Pending confirmation',
      deliveryEtaMin:chosen?chosen.rangeMin:null,
      deliveryEtaMax:chosen?chosen.rangeMax:null,
      deliveryEta:chosen?chosen.eta:'TBD',
      deliveryPreference:nsDelivery.selectedDelivery||'pending',
      handoverPointType:nsDelivery.handoverPointType||nsDelivery.selectedDelivery||'pending',
      handoverPointName:String(nsDelivery.handoverPointName||'').slice(0,180),
      handoverPointAddress:String(nsDelivery.handoverPointAddress||'').slice(0,300),
      handoverPointLat:nsDelivery.handoverPointLat!==null&&nsDelivery.handoverPointLat!==''&&Number.isFinite(Number(nsDelivery.handoverPointLat))?Number(nsDelivery.handoverPointLat):null,
      handoverPointLng:nsDelivery.handoverPointLng!==null&&nsDelivery.handoverPointLng!==''&&Number.isFinite(Number(nsDelivery.handoverPointLng))?Number(nsDelivery.handoverPointLng):null,
      handoverSearchSource:String(nsDelivery.handoverSearchSource||'').slice(0,40),
      handoverNote:String(nsDelivery.handoverNote||'').slice(0,240),
      isInternational:nsDelivery.isInternational,
      recurringPreference:nsDelivery.recurring,
      trackingToken:token,
      deliveryOTP:otp,
      qtyBand:qtyBand(q)
    };

    /* Call original placeOrder. Prefer showing the Order Hub after the online
       order projections commit; fall back to the visible confirmation modal if
       storage is unavailable but the customer can still continue on WhatsApp. */
    var hubShown=false;
    var onCommitted=function(){hubShown=true;nsShowOrderHub();};
    window.addEventListener('ns:order-projections-committed',onCommitted,{once:true});
    orig.apply(this, arguments);
    setTimeout(function(){
      if(hubShown)return;
      var modal=el('confirmModal');
      if(modal&&getComputedStyle(modal).display!=='none')nsShowOrderHub();
    },1800);
  };
}

/* ─── Order Hub ─── */
function nsShowOrderHub(){
  var hub=el('ns-order-hub');
  if(!hub) return;

  var n=(el('oN')||{}).value||'Customer';
  var q=parseInt((el('oQ')||{}).value)||1;
  var price=typeof getCurrentPrice==='function'?getCurrentPrice():55;
  var subtotal=q*price;
  var opts=deliveryEstimates(q, nsDelivery.isInternational);
  var chosen=opts.find(function(o){return o.id===nsDelivery.selectedDelivery;});
  var orderIdEl=el('confSummary');
  /* Get orderId from existing modal */
  var orderId=el('dConfOrderId')?el('dConfOrderId').textContent:'NS-'+Date.now().toString().slice(-6);

  var statuses=[
    {key:'pending',label:'Request received',done:false,active:true},
    {key:'confirmed',label:'Confirmed',done:false,active:false},
    {key:'preparing',label:'Preparing',done:false,active:false},
    {key:'ready_for_dispatch',label:'Ready for dispatch',done:false,active:false},
    {key:'out_for_delivery',label:'Out for delivery',done:false,active:false},
    {key:'delivered',label:'Delivered',done:false,active:false}
  ];

  var timelineHTML=statuses.map(function(s,i){
    var dotClass='ns-hub-step-dot'+(s.done?' done':s.active?' active':'');
    var labelClass='ns-hub-step-label'+(s.done?' done':s.active?' active':'');
    var lineHTML=i<statuses.length-1?'<div class="ns-hub-step-line"></div>':'';
    return '<div class="ns-hub-step"><div style="display:flex;flex-direction:column;align-items:center;gap:0"><div class="'+dotClass+'"></div>'+lineHTML+'</div><div class="'+labelClass+'" style="padding-top:1px">'+esc(s.label)+'</div></div>';
  }).join('');

  var savedTrackingToken=''; try{savedTrackingToken=sessionStorage.getItem('ns_tracking_token')||'';}catch(_e){}
  var trackUrl=savedTrackingToken?window.location.origin+'/track.html?t='+savedTrackingToken:'';
  var delivLine=chosen?(chosen.rangeMin!==null?'₹'+chosen.rangeMin+'–₹'+chosen.rangeMax:' — Confirmed after review'):' — Pending';

  hub.innerHTML=
    '<div class="ns-hub-title">Order Request Created</div>'+
    '<div class="ns-hub-subtitle">Continue on WhatsApp for stock and delivery confirmation</div>'+
    '<div class="ns-hub-row"><span class="ns-hub-key">Order ID</span><span class="ns-hub-val" id="ns-hub-order-id">—</span></div>'+
    '<div class="ns-hub-row"><span class="ns-hub-key">Product subtotal</span><span class="ns-hub-val">₹'+subtotal.toLocaleString('en-IN')+'</span></div>'+
    '<div class="ns-hub-row"><span class="ns-hub-key">Delivery preference</span><span class="ns-hub-val">'+(chosen?esc(chosen.label):'Pending')+'</span></div>'+
    (nsDelivery.handoverPointName?'<div class="ns-hub-row"><span class="ns-hub-key">Preferred handover point</span><span class="ns-hub-val">'+esc(nsDelivery.handoverPointName)+'</span></div>':'')+
    '<div class="ns-hub-row"><span class="ns-hub-key">Delivery charge</span><span class="ns-hub-val">'+esc(delivLine.replace(/^ — /,''))+'</span></div>'+
    '<div class="ns-hub-row"><span class="ns-hub-key">Timing</span><span class="ns-hub-val">'+(chosen?esc(chosen.eta):'Confirmed after review')+'</span></div>'+
    '<div class="ns-hub-row"><span class="ns-hub-key">Destination</span><span class="ns-hub-val">'+esc([nsDelivery.city,nsDelivery.state,nsDelivery.country].filter(Boolean).join(', '))+'</span></div>'+
    (nsDelivery.lat?'<div class="ns-hub-row"><span class="ns-hub-key">GPS pin</span><span class="ns-hub-val" style="font-size:11px">'+nsDelivery.lat.toFixed(5)+', '+nsDelivery.lng.toFixed(5)+'</span></div>':'')+
    '<div class="ns-hub-otp"><div class="ns-hub-otp-label" style="font-size:11px;letter-spacing:1.2px">Your delivery OTP is revealed in the tracking page only when the order is out for delivery.</div></div>'+
    '<div class="ns-del-label" style="margin:16px 0 8px">Order Timeline</div>'+
    '<div class="ns-hub-timeline">'+timelineHTML+'</div>'+
    '<div class="ns-del-label" style="margin:16px 0 8px">Tracking</div>'+
    (trackUrl?'<a class="ns-track-link" href="'+esc(trackUrl)+'" target="_blank" rel="noopener">Open private tracking link</a>':'<div style="font-size:11px;color:rgba(255,255,255,.42);line-height:1.6">Tracking activates after the online order record is saved. WhatsApp remains the confirmation channel.</div>')+
    '<div class="ns-hub-actions">'+
      '<button class="ns-hub-act primary" onclick="window.open(\'https://wa.me/919203831705\',\'_blank\',\'noopener\')">💬 WhatsApp Support</button>'+
      '<button class="ns-hub-act" onclick="document.getElementById(\'ns-order-hub-overlay\').classList.remove(\'open\')">Close</button>'+
    '</div>';

  /* Try to pull order ID from confirmation modal */
  var confSummary=el('confSummary');
  if(confSummary){
    var idMatch=confSummary.innerHTML.match(/NS-\d{4}-[A-Z0-9]+/i);
    if(idMatch){ var hubId=el('ns-hub-order-id'); if(hubId) hubId.textContent=idMatch[0]; }
  }

  el('ns-order-hub-overlay').classList.add('open');
}

/* ─── Hub HTML injection ─── */
function injectOrderHub(){
  if(el('ns-order-hub-overlay')) return;
  var hubHTML=`
<div class="ns-hub-overlay" id="ns-order-hub-overlay" role="dialog" aria-modal="true" aria-label="Order Hub">
  <div class="ns-hub-card">
    <button class="ns-hub-close" onclick="document.getElementById('ns-order-hub-overlay').classList.remove('open')" aria-label="Close">✕</button>
    <div id="ns-order-hub"></div>
  </div>
</div>
`;
  document.body.insertAdjacentHTML('beforeend', hubHTML);
}

/* ─── Listen for qty changes ─── */
function watchQty(){
  var oQ=el('oQ');
  if(!oQ) return;
  var mo=new MutationObserver(function(){ nsDelShowOptions(); nsDelUpdateSummary(); });
  mo.observe(oQ,{attributes:true,attributeFilter:['value']});
  oQ.addEventListener('change', function(){ nsDelShowOptions(); nsDelUpdateSummary(); });
}

/* ─── Init ─── */
function init(){
  injectDeliveryFields();
  injectOrderHub();
  patchPlaceOrder();
  watchQty();
  /* Initial state */
  nsDelShowOptions();
}

/* Wait for DOM */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
