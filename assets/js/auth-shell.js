/* Shared presentation only. Authentication and authorization remain in their adapters.
   The animation boundary consumes focus/type/enum state, never input values or lengths. */
(function () {
  'use strict';
  var soundOn = false, soundEpoch = 0, audio = null, voices = new Set();
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var copy = {
    customer: { context: 'My Account', access: 'Customer Access', title: 'A little nature.<br><em>A daily ritual.</em>', detail: 'Fresh beginnings. Familiar details. A place that feels like you.', foot: 'Rooted in nature. Made for your everyday.' },
    admin: { context: 'Business Command Center', access: 'Admin Access', title: 'Thoughtful care.<br><em>In every detail.</em>', detail: 'A considered space for the people behind Nariyal Sutra.', foot: 'Good things begin with care.' }
  };
  function brand() { return '<a class="ns-auth-brand" href="/index.html" aria-label="Nariyal Sutra home"><strong>NARIYAL SUTRA</strong><span>THE SCIENCE OF PURITY</span></a>'; }
  function object() {
    return '<div class="ns-nariyal-scene" aria-hidden="true"><div class="ns-nariyal-orbit"></div><div class="ns-nariyal-object">'+
      '<div class="ns-nariyal-fallback"></div><img class="ns-nariyal-husk" src="/assets/images/brand/auth-nariyal.svg" alt="" width="400" height="400" decoding="async" draggable="false">'+
      '<img class="ns-nariyal-young" src="/assets/images/brand/auth-nariyal-young.svg" alt="" width="400" height="400" decoding="async" draggable="false">'+
      '<svg class="ns-nariyal-face" viewBox="0 0 400 400" fill="none" focusable="false"><g class="ns-nariyal-eyes">'+
      '<g class="ns-nariyal-eye"><path d="M149 181 Q164 172 179 181 Q166 189 149 181Z" fill="#2a2117"/><ellipse class="ns-nariyal-glint" cx="165" cy="180" rx="3" ry="2" fill="#e1cfa7" opacity=".78"/></g>'+
      '<g class="ns-nariyal-eye"><path d="M218 180 Q232 171 246 180 Q233 188 218 180Z" fill="#221e17"/><ellipse class="ns-nariyal-glint" cx="233" cy="179" rx="3" ry="2" fill="#e1cfa7" opacity=".7"/></g></g>'+
      '<g class="ns-nariyal-lids" stroke="#2a2117" stroke-width="2.4" stroke-linecap="round"><path d="M149 181 Q164 189 179 181"/><path d="M218 180 Q232 188 246 180"/></g></svg>'+
      '<div class="ns-nariyal-light"></div></div><span class="ns-nariyal-caption">Naturally considered.</span></div>';
  }
  function markup(context, content, mode) {
    var c = copy[context] || copy.customer;
    return '<section class="ns-auth-shell" data-auth-context="'+context+'" data-auth-state="'+(mode||'signin')+'" data-nariyal-pose="idle">'+
      '<div class="ns-auth-art"><div class="ns-auth-art-copy"><span class="ns-auth-eyebrow">'+c.access+'</span><h2>'+c.title+'</h2><p>'+c.detail+'</p></div>'+object()+'<div class="ns-auth-art-foot"><span class="ns-auth-line"></span>'+c.foot+'</div></div>'+
      '<div class="ns-auth-content"><div class="ns-auth-topline"><span>'+c.context+'</span><button type="button" class="ns-auth-sound" data-auth-sound aria-pressed="'+soundOn+'" aria-label="'+(soundOn?'Turn sound off':'Turn sound on')+'">Sound '+(soundOn?'on':'off')+'</button></div><div class="ns-auth-stage">'+content+'</div></div><div class="ns-auth-sweep-track" aria-hidden="true"><div class="ns-auth-sweep"></div></div></section>';
  }
  function chime() {
    if (!soundOn) return;
    try {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      var epoch = soundEpoch;
      var play = function () {
        if (!soundOn || epoch !== soundEpoch) return;
        [659.25, 987.77].forEach(function (frequency, i) {
          var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * .075;
          o.type = 'sine'; o.frequency.value = frequency;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.025, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + .28);
          o.connect(g); g.connect(audio.destination); voices.add(o);
          o.onended = function () { voices.delete(o); o.disconnect(); g.disconnect(); };
          o.start(t); o.stop(t + .3);
        });
      };
      if (audio.state === 'suspended') audio.resume().then(play).catch(function () {}); else play();
    } catch (_) { /* Sound is optional and never blocks access. */ }
  }
  function shellOf(root) { return root && (root.matches('.ns-auth-shell') ? root : root.querySelector('.ns-auth-shell')); }
  function pose(shell) {
    if (!shell) return;
    var focused = document.activeElement, password = focused && focused.closest('.ns-auth-password');
    // The reveal button remains within this wrapper, so keyboard toggling preserves privacy.
    var hiddenPassword = password && password.querySelector('input[type="password"]');
    shell.dataset.nariyalPose = password ? (hiddenPassword ? 'privacy' : 'peek') :
      focused && focused.matches('input[type="email"]') ? 'email' : 'idle';
  }
  function signal(root, name) {
    var shell = shellOf(root);
    if (!shell || !['idle', 'loading', 'error', 'success'].includes(name)) return;
    shell.dataset.authFeedback = name;
    if (name === 'success') {
      var panel = shell.closest('#nsacct-panel');
      if (panel) { panel.classList.add('ns-auth-acknowledged'); setTimeout(function () { panel.classList.remove('ns-auth-acknowledged'); }, 650); }
    }
  }
  function bind(shell) {
    if (shell.dataset.authBound) return;
    shell.dataset.authBound = 'true';
    shell.addEventListener('focusin', function () { pose(shell); });
    shell.addEventListener('focusout', function () { queueMicrotask(function () { pose(shell); }); });
    // Native validation also covers autofill, paste and password-manager insertion.
    shell.addEventListener('invalid', function () { signal(shell, 'error'); }, true);
    shell.addEventListener('submit', function () { signal(shell, 'loading'); });
    shell.querySelectorAll('.ns-nariyal-object img').forEach(function (img) {
      img.addEventListener('error', function () { shell.dataset.nariyalAsset = 'fallback'; });
      if (img.complete && !img.naturalWidth) shell.dataset.nariyalAsset = 'fallback';
    });
    // Observe status CLASSES, not messages (which may contain account details).
    var observer = new MutationObserver(function () {
      var message = shell.querySelector('.nsacct-msg.show,.msg.err,.msg.ok');
      if (message) signal(shell, message.classList.contains('err') ? 'error' : message.classList.contains('ok') ? 'success' : 'idle');
    });
    observer.observe(shell.querySelector('.ns-auth-stage'), {subtree:true, attributes:true, attributeFilter:['class']});
  }
  function enhance(root, focus) {
    root.querySelectorAll('input[type="password"]').forEach(function (input) {
      if (input.parentElement.classList.contains('ns-auth-password')) return;
      var wrap = document.createElement('div'), toggle = document.createElement('button');
      wrap.className = 'ns-auth-password'; input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
      toggle.type = 'button'; toggle.className = 'ns-auth-reveal'; toggle.textContent = 'Show';
      toggle.setAttribute('aria-controls', input.id);
      toggle.setAttribute('aria-label', 'Show '+(input.autocomplete==='new-password'?'new password':'password')); toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', function () {
        var reveal = input.type === 'password'; input.type = reveal ? 'text' : 'password';
        toggle.textContent = reveal ? 'Hide' : 'Show'; toggle.setAttribute('aria-pressed', String(reveal));
        toggle.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
        // Mobile Safari does not focus a clicked button; explicitly use the toggle's state.
        var shell = shellOf(root); if (shell) shell.dataset.nariyalPose = reveal ? 'peek' : 'privacy';
      });
      wrap.appendChild(toggle);
    });
    root.querySelectorAll('[data-auth-sound]').forEach(function (button) {
      button.onclick = function () {
        soundOn = !soundOn; soundEpoch++;
        document.querySelectorAll('[data-auth-sound]').forEach(function (b) { b.textContent='Sound '+(soundOn?'on':'off'); b.setAttribute('aria-pressed',String(soundOn)); b.setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on'); });
        if (soundOn) chime();
        else if (audio) {
          voices.forEach(function (voice) { try { voice.stop(); } catch (_) {} }); voices.clear();
          audio.suspend().catch(function () {});
        }
      };
    });
    var shell = shellOf(root); if (shell) { bind(shell); pose(shell); }
    if (focus) { var target=root.querySelector('h1,h2.ns-auth-title'); if(target){target.tabIndex=-1;target.focus({preventScroll:true});} }
  }
  function transition(root, mode, userInitiated) {
    var shell = shellOf(root);
    if (shell) {
      shell.dataset.authState = mode; shell.dataset.authFeedback = 'idle'; shell.dataset.nariyalPose = 'idle';
      shell.classList.remove('ns-auth-transition'); void shell.offsetWidth;
      if (!reduced.matches) shell.classList.add('ns-auth-transition');
    }
    if (userInitiated) chime();
  }
  window.NSAuthShell = { brand:brand, markup:markup, enhance:enhance, transition:transition, signal:signal };
})();
