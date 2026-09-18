/* Nariyal Sutra V42.1 — privacy-safe customer acquisition attribution.
   Keeps first/last touch context in this browser tab only, persists a compact
   business-facing snapshot with an order or enquiry, and never stores a full
   external referrer URL or arbitrary query-string values. */
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
  const SESSION_KEY='ns-attribution-v2';
  const VERSION=2;
  const SEARCH_HOSTS=[
    ['google.','google'],['bing.com','bing'],['duckduckgo.com','duckduckgo'],
    ['search.yahoo.','yahoo'],['yandex.','yandex'],['ecosia.org','ecosia']
  ];
  const SOCIAL_HOSTS=[
    ['instagram.com','instagram'],['facebook.com','facebook'],['fb.com','facebook'],
    ['t.co','x'],['twitter.com','x'],['x.com','x'],['linkedin.com','linkedin'],
    ['youtube.com','youtube'],['youtu.be','youtube'],['pinterest.','pinterest'],
    ['reddit.com','reddit']
  ];
  const $=s=>document.querySelector(s);
  const clean=(v,max=180)=>String(v==null?'':v).trim().replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').slice(0,max);

  function safeCampaignValue(value,max){
    const raw=clean(value,max);
    if(!raw||/@|:\/\/|\b(?:password|passwd|pwd|token|otp)\b/i.test(raw)||/\d{7,}/.test(raw))return '';
    const safe=raw.replace(/[^A-Za-z0-9._ -]/g,'').replace(/\s+/g,' ').trim();
    return safe.slice(0,max);
  }
  function safePath(value){
    try{
      const u=new URL(value||'/',location.origin);
      if(u.origin!==location.origin)return '/';
      return (u.pathname||'/').slice(0,300);
    }catch(_e){return '/';}
  }
  function referrerHost(){
    try{
      const host=new URL(document.referrer).hostname.toLowerCase().replace(/^(?:www\.|m\.|amp\.)/,'').slice(0,253);
      const own=location.hostname.toLowerCase().replace(/^(?:www\.|m\.|amp\.)/,'');
      return host&&host!==own?host:'';
    }catch(_e){return '';}
  }
  function knownHost(host,list){
    const row=list.find(([part])=>host===part.replace(/\.$/,'')||host.includes(part));
    return row?row[1]:'';
  }
  function canonicalSource(source,host){
    const value=String(source||'').toLowerCase();
    if(/google/.test(value))return 'google';
    if(/bing/.test(value))return 'bing';
    if(/duckduckgo/.test(value))return 'duckduckgo';
    if(/instagram|\binsta\b/.test(value))return 'instagram';
    if(/facebook|\bfb\b/.test(value))return 'facebook';
    if(/whatsapp|\bwa\b/.test(value))return 'whatsapp';
    if(/linkedin/.test(value))return 'linkedin';
    if(/youtube|youtu\.be/.test(value))return 'youtube';
    if(/twitter|\bx\b/.test(value))return 'x';
    if(source)return source;
    if(host.includes('google.'))return 'google';
    if(host.includes('bing.com'))return 'bing';
    if(host.includes('duckduckgo.com'))return 'duckduckgo';
    if(host.includes('instagram.com'))return 'instagram';
    if(host.includes('facebook.com'))return 'facebook';
    if(host==='wa.me'||host.includes('whatsapp.com'))return 'whatsapp';
    if(host.includes('linkedin.com'))return 'linkedin';
    if(host.includes('youtube.com')||host==='youtu.be')return 'youtube';
    if(['t.co','x.com','twitter.com'].includes(host))return 'x';
    return knownHost(host,SEARCH_HOSTS)||knownHost(host,SOCIAL_HOSTS)||host.split('.')[0]||'direct';
  }
  function classify(source,medium,campaign,host){
    const signal=[source,medium].join(' ').toLowerCase();
    const canonical=canonicalSource(source,host);
    if(/cpc|ppc|paid|display|retarget|affiliate|sponsor/.test(signal))return ['paid_campaign',canonical,medium||'paid'];
    if(canonical==='whatsapp')return ['whatsapp','whatsapp',medium||'shared_link'];
    if(/email|newsletter/.test(signal)||/mail\.|outlook\.|proton\.me/.test(host))return ['email',source||'email',medium||'email'];
    if(knownHost(host,SOCIAL_HOSTS)||['instagram','facebook','linkedin','youtube','x'].includes(canonical)||/social/.test(signal))return ['social',canonical,medium||'social'];
    if(knownHost(host,SEARCH_HOSTS)||['google','bing','duckduckgo','yahoo','yandex','ecosia'].includes(canonical)||/organic|search/.test(signal))return ['organic_search',canonical,medium||'organic'];
    if(source||medium||campaign)return ['paid_campaign',canonical||'campaign',medium||'campaign'];
    if(host)return ['referral',canonical||host.split('.')[0],medium||'referral'];
    return ['direct','direct','none'];
  }
  function touchFromPage(){
    const params=new URLSearchParams(location.search);
    const source=safeCampaignValue(params.get('utm_source'),120);
    const medium=safeCampaignValue(params.get('utm_medium'),120);
    const campaign=safeCampaignValue(params.get('utm_campaign'),160);
    const content=safeCampaignValue(params.get('utm_content'),160);
    const host=referrerHost();
    const [classification,normalizedSource,normalizedMedium]=classify(source,medium,campaign,host);
    return {
      classification,
      source:safeCampaignValue(normalizedSource,120)||'direct',
      medium:safeCampaignValue(normalizedMedium,120)||'none',
      campaign,
      content,
      referrerHost:host,
      landingPath:safePath(location.pathname),
      capturedAtClient:new Date().toISOString()
    };
  }
  function validTouch(t){
    return !!t&&typeof t==='object'&&typeof t.classification==='string'&&typeof t.landingPath==='string';
  }
  function sessionId(){
    try{return crypto.randomUUID();}catch(_e){return 'ns-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,14);}
  }
  function captureSession(){
    let saved=null;
    try{saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch(_e){}
    const incoming=touchFromPage(),now=new Date().toISOString();
    if(!saved||saved.version!==VERSION||!validTouch(saved.firstTouch)||!validTouch(saved.lastTouch)){
      saved={version:VERSION,sessionId:sessionId(),sessionStartedAtClient:now,firstTouch:incoming,lastTouch:incoming};
    }else if(incoming.classification!=='direct'){
      saved.lastTouch=incoming;
    }
    saved.currentPath=safePath(location.pathname);
    saved.observedAtClient=now;
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(saved));}catch(_e){}
    return saved;
  }
  const sessionAttribution=captureSession();

  function style(){
    if($('#nsDiscoveryStyle'))return;
    const el=document.createElement('style');
    el.id='nsDiscoveryStyle';
    el.textContent=`
      .ns-discovery-field{position:relative}
      .ns-discovery-field select,.ns-discovery-field input{width:100%;border:1px solid rgba(212,168,67,.22);background:rgba(255,255,255,.035);color:#fff;padding:13px 14px;outline:none;font:inherit}
      .ns-discovery-field select:focus,.ns-discovery-field input:focus{border-color:#d4a843;box-shadow:0 0 0 3px rgba(212,168,67,.08)}
      .ns-discovery-field select option{background:#0c1807;color:#fff}
      .ns-discovery-help{display:block;margin-top:7px;color:rgba(255,255,255,.48);font-size:10px;line-height:1.55}
      .ns-discovery-detail{margin-top:9px}.ns-discovery-error{border-color:#ff8b8b!important;box-shadow:0 0 0 3px rgba(255,139,139,.08)!important}
    `;
    document.head.appendChild(el);
  }
  function detailPrompt(source){
    if(source==='ai_assistant')return 'Which AI assistant? (optional — e.g. ChatGPT, Gemini, Perplexity)';
    if(source==='word_of_mouth')return 'Optional detail (friend, family, colleague or customer referral)';
    if(source==='social_media')return 'Which platform? (optional — Instagram, Facebook, YouTube)';
    if(source==='business_event_referral')return 'Optional detail (event, hotel, café or business contact)';
    if(source==='other')return 'Please tell us where you heard about us (optional)';
    return '';
  }
  function copyTouch(t){
    return {
      classification:clean(t?.classification,40),source:safeCampaignValue(t?.source,120),medium:safeCampaignValue(t?.medium,120),
      campaign:safeCampaignValue(t?.campaign,160),content:safeCampaignValue(t?.content,160),
      referrerHost:clean(t?.referrerHost,253).toLowerCase().replace(/[^a-z0-9.-]/g,''),landingPath:safePath(t?.landingPath),
      capturedAtClient:clean(t?.capturedAtClient,40)
    };
  }
  function read(){
    const source=clean($('#nsDiscoverySource')?.value,80);
    const ctx={
      version:VERSION,
      reportedSource:source,
      reportedSourceLabel:LABELS[source]||'',
      reportedDetail:clean($('#nsDiscoveryDetail')?.value,180),
      firstTouch:copyTouch(sessionAttribution.firstTouch),
      lastTouch:copyTouch(sessionAttribution.lastTouch),
      sessionId:clean(sessionAttribution.sessionId,64),
      sessionStartedAtClient:clean(sessionAttribution.sessionStartedAtClient,40),
      capturedAtClient:new Date().toISOString()
    };
    window.NS_ATTRIBUTION_CONTEXT=ctx;
    return ctx;
  }
  function updateDetail(){
    const source=$('#nsDiscoverySource')?.value||'',wrap=$('#nsDiscoveryDetailWrap'),input=$('#nsDiscoveryDetail'),prompt=detailPrompt(source);
    if(!wrap||!input)return;
    wrap.hidden=!prompt;input.placeholder=prompt;if(!prompt)input.value='';read();
  }
  function mount(){
    if($('#nsDiscoverySource'))return true;
    const fields=$('#order .ofields');if(!fields)return false;
    style();
    const row=document.createElement('div');row.className='of full ns-discovery-field';row.id='nsDiscoveryField';
    row.innerHTML=`<label for="nsDiscoverySource">How did you hear about Nariyal Sutra?</label><select id="nsDiscoverySource" required aria-describedby="nsDiscoveryHelp"><option value="">Select one</option>${OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><span class="ns-discovery-help" id="nsDiscoveryHelp">Your answer helps us improve where customers discover us. Technical source details are limited to campaign labels, the referring domain and landing page.</span><div class="ns-discovery-detail" id="nsDiscoveryDetailWrap" hidden><input id="nsDiscoveryDetail" type="text" maxlength="180" autocomplete="off"></div>`;
    fields.appendChild(row);
    $('#nsDiscoverySource').addEventListener('change',()=>{$('#nsDiscoverySource').classList.remove('ns-discovery-error');updateDetail();});
    $('#nsDiscoveryDetail').addEventListener('input',read);read();return true;
  }
  function validate(){
    const select=$('#nsDiscoverySource');if(!select||select.value)return true;
    select.classList.add('ns-discovery-error');select.focus({preventScroll:true});select.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    const msg='Please tell us how you heard about Nariyal Sutra.';if(typeof window.toast==='function')window.toast(msg);else alert(msg);return false;
  }
  function patchOrder(attempt=0){
    if(window.__NS_ATTRIBUTION_ORDER_PATCHED__)return;
    if(typeof window.placeOrder!=='function'){if(attempt<50)setTimeout(()=>patchOrder(attempt+1),200);return;}
    const original=window.placeOrder;
    window.placeOrder=function(){
      if(!mount()||!validate())return;
      const ctx=read();
      try{if(typeof window.nsAnalyticsEvent==='function')window.nsAnalyticsEvent('customer_discovery_source',{discovery_source:ctx.reportedSource,acquisition_classification:ctx.firstTouch.classification});}catch(_e){}
      return original.apply(this,arguments);
    };
    window.__NS_ATTRIBUTION_ORDER_PATCHED__=true;
  }
  function init(){mount();patchOrder();window.NSAttribution={read,validate,options:OPTIONS.slice(),session:{...sessionAttribution}};read();}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
