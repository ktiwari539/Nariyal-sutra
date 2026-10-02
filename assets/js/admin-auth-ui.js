(function () {
  'use strict';
  var root=document.getElementById('ns-admin-auth'), content=root.innerHTML;
  root.innerHTML='<header class="ns-auth-header">'+NSAuthShell.brand()+'<a href="/index.html">Back to the storefront ↗</a></header>'+NSAuthShell.markup('admin',content,'signin');
  NSAuthShell.enhance(root);
  document.getElementById('forgot').addEventListener('click',function () { setMode('reset'); });
  document.getElementById('ns-admin-back').addEventListener('click',function () { setMode('signin'); });
  function setMode(mode) {
    var reset=mode==='reset', form=document.getElementById('login');
    if(form.getAttribute('aria-busy')==='true')return;
    form.dataset.authMode=mode;
    document.getElementById('ns-admin-password').hidden=reset;
    document.getElementById('pw').required=!reset;
    document.getElementById('pw').disabled=reset;
    document.getElementById('pw').value='';
    document.getElementById('ns-admin-title').textContent=reset?'A fresh start.':'Welcome back.';
    document.getElementById('ns-admin-sub').textContent=reset?'Enter your staff email. We’ll help you get back to your workspace.':'Sign in to your Nariyal Sutra workspace.';
    document.getElementById('submit').textContent=reset?'Send reset link':'Sign in';
    document.getElementById('forgot').hidden=reset;
    document.getElementById('ns-admin-back').hidden=!reset;
    document.getElementById('msg').textContent='';
    NSAuthShell.transition(root,mode,true);NSAuthShell.enhance(root,true);
  }
})();
