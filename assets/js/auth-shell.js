/* Shared presentation only. Authentication and authorization remain in their adapters. */
(function () {
  'use strict';
  var soundOn = false, audio = null;
  var copy = {
    customer: { context: 'My Account', access: 'Customer Access', title: 'Your daily ritual.<br><em>Beautifully simple.</em>', detail: 'Fresh beginnings. Familiar details. One place for every order.', foot: 'From the grove to your everyday.' },
    admin: { context: 'Business Command Center', access: 'Admin Access', title: 'Thoughtful care.<br><em>Behind every order.</em>', detail: 'A considered space for the people who keep Nariyal Sutra moving.', foot: 'Good things begin with care.' }
  };
  function brand() { return '<a class="ns-auth-brand" href="/index.html" aria-label="Nariyal Sutra home"><strong>NARIYAL SUTRA</strong><span>THE SCIENCE OF PURITY</span></a>'; }
  function markup(context, content, mode) {
    var c = copy[context] || copy.customer;
    return '<section class="ns-auth-shell" data-auth-context="'+context+'" data-auth-state="'+(mode||'signin')+'">'+
      '<div class="ns-auth-art"><img src="/assets/images/brand/coconut-premium.webp" alt="" decoding="async"><div class="ns-auth-art-copy"><span class="ns-auth-eyebrow">'+c.access+'</span><h2>'+c.title+'</h2><p>'+c.detail+'</p></div><div class="ns-auth-art-foot"><span class="ns-auth-line"></span>'+c.foot+'</div></div>'+
      '<div class="ns-auth-content"><div class="ns-auth-topline"><span>'+c.context+'</span><button type="button" class="ns-auth-sound" data-auth-sound aria-pressed="'+soundOn+'" aria-label="'+(soundOn?'Turn sound off':'Turn sound on')+'">Sound '+(soundOn?'on':'off')+'</button></div><div class="ns-auth-stage">'+content+'</div></div></section>';
  }
  function chime() {
    if (!soundOn) return;
    try {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      var play = function () {
        if (!soundOn) return;
        [659.25, 987.77].forEach(function (frequency, i) {
          var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * .075;
          o.type = 'sine'; o.frequency.value = frequency;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.025, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + .28);
          o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + .3);
        });
      };
      if (audio.state === 'suspended') audio.resume().then(play).catch(function () {}); else play();
    } catch (_) { /* Sound is optional and never blocks access. */ }
  }
  function enhance(root, focus) {
    root.querySelectorAll('input[type="password"]').forEach(function (input) {
      if (input.parentElement.classList.contains('ns-auth-password')) return;
      var wrap = document.createElement('div'), toggle = document.createElement('button');
      wrap.className = 'ns-auth-password'; input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
      toggle.type = 'button'; toggle.className = 'ns-auth-reveal'; toggle.textContent = 'Show';
      toggle.setAttribute('aria-label', 'Show '+(input.autocomplete==='new-password'?'new password':'password')); toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', function () { var reveal=input.type==='password';input.type=reveal?'text':'password';toggle.textContent=reveal?'Hide':'Show';toggle.setAttribute('aria-pressed',String(reveal));toggle.setAttribute('aria-label',reveal?'Hide password':'Show password'); });
      wrap.appendChild(toggle);
    });
    root.querySelectorAll('[data-auth-sound]').forEach(function (button) {
      button.onclick = function () { soundOn=!soundOn;document.querySelectorAll('[data-auth-sound]').forEach(function (b) {b.textContent='Sound '+(soundOn?'on':'off');b.setAttribute('aria-pressed',String(soundOn));b.setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');});if(soundOn)chime();else if(audio)audio.suspend().catch(function(){}); };
    });
    if (focus) { var target=root.querySelector('h1,h2.ns-auth-title');if(target){target.tabIndex=-1;target.focus({preventScroll:true});} }
  }
  function transition(root, mode, userInitiated) {
    var shell=root.matches('.ns-auth-shell')?root:root.querySelector('.ns-auth-shell');
    if(shell){shell.dataset.authState=mode;var stage=shell.querySelector('.ns-auth-stage');stage.classList.remove('ns-auth-enter');void stage.offsetWidth;stage.classList.add('ns-auth-enter');}
    if(userInitiated)chime();
  }
  window.NSAuthShell = { brand:brand, markup:markup, enhance:enhance, transition:transition };
})();
