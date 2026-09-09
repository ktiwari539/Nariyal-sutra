/* Nariyal Sutra V42.1 production-admin compatibility layer.
   The main owner portal logic is intentionally kept in admin.html and the
   versioned admin runtimes. This module only supplies safe shared hooks. */
const READY='NS_V421_ADMIN_READY';
if(!window[READY]){
  window[READY]=true;
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

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

  function expose(){
    window.NSV421Admin={
      ready:true,
      announce,
      refresh:()=>{guardDeadButtons();window.dispatchEvent(new CustomEvent('ns:admin-refresh'));},
      version:'42.1-stabilized'
    };
    window.dispatchEvent(new CustomEvent('ns:admin-ready',{detail:{version:'42.1-stabilized'}}));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{guardDeadButtons();expose();},{once:true});
  else {guardDeadButtons();expose();}
}
export {};
