(function(){
  'use strict';
  if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  window.NS_LOCAL_PREVIEW=true;
  document.documentElement.classList.add('ns-local-preview');
  const bar=document.createElement('div');
  bar.id='ns-local-preview-banner';
  bar.textContent='LOCAL PREVIEW · production writes, real orders/messages and provider sign-in are disabled';
  bar.style.cssText='position:fixed;z-index:2147483647;left:0;right:0;top:0;padding:7px 12px;text-align:center;background:#f1cf79;color:#061004;font:700 10px/1.2 system-ui;letter-spacing:1.4px;text-transform:uppercase';
  addEventListener('DOMContentLoaded',()=>document.body.appendChild(bar),{once:true});
  const blocked=()=>alert('Local preview only — this live/production action is intentionally disabled. Local Admin and demo-profile workflows remain available.');
  function safeLocalContext(el){
    /* Consolidated admin.html is the one Admin now. Permit its local UI/auth form
       to function for testing while this script still blocks external provider,
       WhatsApp/mail and production-facing actions elsewhere. */
    if(/(?:^|\/)(?:admin|admin-login|admin-set-password|staff-sign-in)\.html$/i.test(location.pathname)) return true;
    if(el&&el.closest&&el.closest('[data-local-demo="1"]')) return true;
    if(el&&el.getAttribute&&String(el.getAttribute('data-nsacct-action')||'').startsWith('local-')) return true;
    return false;
  }
  document.addEventListener('submit',e=>{
    if(safeLocalContext(e.target)) return;
    e.preventDefault();e.stopImmediatePropagation();blocked();
  },true);
  document.addEventListener('click',e=>{
    const a=e.target.closest('a'); const b=e.target.closest('button'); const t=b||a;
    if(safeLocalContext(t)) return;
    const href=a?.getAttribute('href')||''; const txt=(b?.textContent||a?.textContent||'').toLowerCase();
    if(/wa\.me|mailto:|t\.me|whatsapp/.test(href.toLowerCase())||/continue to whatsapp|open whatsapp|submit privately|publish v|sign in with|continue with google|continue with apple|send otp/.test(txt)){
      e.preventDefault();e.stopImmediatePropagation();blocked();
    }
  },true);
})();
