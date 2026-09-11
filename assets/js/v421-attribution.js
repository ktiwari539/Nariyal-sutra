/* Nariyal Sutra V42.1 — customer discovery attribution.
   Captures a short self-reported acquisition source at checkout and keeps
   campaign/referrer metadata private with the order. No contact details are
   sent as analytics event parameters. */
(function(){
  'use strict';

  const OPTIONS=[
    ['google_search','Google Search'],
    ['ai_assistant','AI assistant (ChatGPT, Gemini, Perplexity, etc.)'],
    ['word_of_mouth','Word of mouth / referral'],
    ['social_media','Social media'],
    ['whatsapp_telegram','WhatsApp / Telegram'],
    ['returning_customer','Returning customer'],
    ['business_event_referral','Business, event or hospitality referral'],
    ['other','Other'],
    ['prefer_not_to_say','Prefer not to say']
  ];
  const LABELS=Object.fromEntries(OPTIONS);
  const SESSION_KEY='ns-v421-attribution-session';
  const $=s=>document.querySelector(s);
  const clean=(v,max=180)=>String(v||'').trim().replace(/\s+/g,' ').slice(0,max);

  function initialSession(){
    let saved=null;
    try{ saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null'); }catch(_e){}
    if(saved&&typeof saved==='object') return saved;
    const qs=new URLSearchParams(location.search);
    const next={
      landingPath:location.pathname||'/',
      landingReferrer:clean(document.referrer,500),
      utmSource:clean(qs.get('utm_source'),120),
      utmMedium:clean(qs.get('utm_medium'),120),
      utmCampaign:clean(qs.get('utm_campaign'),160),
      utmContent:clean(qs.get('utm_content'),160),
      capturedAt:new Date().toISOString()
    };
    try{ sessionStorage.setItem(SESSION_KEY,JSON.stringify(next)); }catch(_e){}
    return next;
  }
  const sessionAttribution=initialSession();

  function style(){
    if($('#nsDiscoveryStyle')) return;
    const el=document.createElement('style');
    el.id='nsDiscoveryStyle';
    el.textContent=`
      .ns-discovery-field{position:relative}
      .ns-discovery-field select,.ns-discovery-field input{width:100%;border:1px solid rgba(212,168,67,.22);background:rgba(255,255,255,.035);color:#fff;padding:13px 14px;outline:none;font:inherit}
      .ns-discovery-field select:focus,.ns-discovery-field input:focus{border-color:#d4a843;box-shadow:0 0 0 3px rgba(212,168,67,.08)}
      .ns-discovery-field select option{background:#0c1807;color:#fff}
      .ns-discovery-help{display:block;margin-top:7px;color:rgba(255,255,255,.38);font-size:10px;line-height:1.55}
      .ns-discovery-detail{margin-top:9px}
      .ns-discovery-error{border-color:#ff8b8b!important;box-shadow:0 0 0 3px rgba(255,139,139,.08)!important}
    `;
    document.head.appendChild(el);
  }

  function detailPrompt(source){
    if(source==='ai_assistant') return 'Which AI assistant? (optional — e.g. ChatGPT, Gemini, Perplexity)';
    if(source==='word_of_mouth') return 'Optional detail (friend, family, colleague, customer referral…)';
    if(source==='social_media') return 'Which platform? (optional — Instagram, Facebook, YouTube…)';
    if(source==='business_event_referral') return 'Optional detail (event, hotel, café, business contact…)';
    if(source==='other') return 'Please tell us where you heard about us (optional)';
    return '';
  }

  function read(){
    const select=$('#nsDiscoverySource');
    const detail=$('#nsDiscoveryDetail');
    const source=clean(select?.value,80);
    const label=LABELS[source]||'';
    const ctx={
      source,
      label,
      detail:clean(detail?.value,180),
      landingPath:sessionAttribution.landingPath||'',
      landingReferrer:sessionAttribution.landingReferrer||'',
      utmSource:sessionAttribution.utmSource||'',
      utmMedium:sessionAttribution.utmMedium||'',
      utmCampaign:sessionAttribution.utmCampaign||'',
      utmContent:sessionAttribution.utmContent||'',
      capturedAtClient:new Date().toISOString(),
      version:1
    };
    window.NS_ATTRIBUTION_CONTEXT=ctx;
    return ctx;
  }

  function updateDetail(){
    const source=$('#nsDiscoverySource')?.value||'';
    const wrap=$('#nsDiscoveryDetailWrap');
    const input=$('#nsDiscoveryDetail');
    const prompt=detailPrompt(source);
    if(!wrap||!input) return;
    wrap.hidden=!prompt;
    input.placeholder=prompt;
    if(!prompt) input.value='';
    read();
  }

  function mount(){
    if($('#nsDiscoverySource')) return true;
    const fields=$('#order .ofields');
    if(!fields) return false;
    style();
    const row=document.createElement('div');
    row.className='of full ns-discovery-field';
    row.id='nsDiscoveryField';
    row.innerHTML=`
      <label for="nsDiscoverySource">How did you hear about Nariyal Sutra?</label>
      <select id="nsDiscoverySource" required aria-describedby="nsDiscoveryHelp">
        <option value="">Select one</option>
        ${OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
      <span class="ns-discovery-help" id="nsDiscoveryHelp">This helps us understand which channels are bringing customers to Nariyal Sutra.</span>
      <div class="ns-discovery-detail" id="nsDiscoveryDetailWrap" hidden>
        <input id="nsDiscoveryDetail" type="text" maxlength="180" autocomplete="off" />
      </div>`;
    fields.appendChild(row);
    $('#nsDiscoverySource').addEventListener('change',()=>{ $('#nsDiscoverySource').classList.remove('ns-discovery-error'); updateDetail(); });
    $('#nsDiscoveryDetail').addEventListener('input',read);
    read();
    return true;
  }

  function validate(){
    const select=$('#nsDiscoverySource');
    if(!select) return true;
    if(select.value) return true;
    select.classList.add('ns-discovery-error');
    select.focus({preventScroll:true});
    select.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    const msg='Please tell us how you heard about Nariyal Sutra.';
    if(typeof window.toast==='function') window.toast(msg); else alert(msg);
    return false;
  }

  function patchOrder(attempt=0){
    if(window.__NS_ATTRIBUTION_ORDER_PATCHED__) return;
    if(typeof window.placeOrder!=='function'){
      if(attempt<50) setTimeout(()=>patchOrder(attempt+1),200);
      return;
    }
    const original=window.placeOrder;
    window.placeOrder=function(){
      if(!mount()||!validate()) return;
      const ctx=read();
      try{
        if(typeof window.nsAnalyticsEvent==='function'){
          window.nsAnalyticsEvent('customer_discovery_source',{discovery_source:ctx.source});
        }
      }catch(_e){}
      return original.apply(this,arguments);
    };
    window.__NS_ATTRIBUTION_ORDER_PATCHED__=true;
  }

  function init(){
    mount();
    patchOrder();
    window.NSAttribution={read,validate,options:OPTIONS.slice(),session:{...sessionAttribution}};
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
