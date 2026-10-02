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
    var products = ['signature','fresh','coastal','golden'].map(function (name) {
      return '<img class="ns-grove-product ns-grove-'+name+'" src="/assets/images/brand/grove/'+name+'.webp" alt="" width="1200" height="1200" decoding="async" draggable="false">';
    }).join('');
    return '<div class="ns-nariyal-scene" aria-hidden="true"><div class="ns-nariyal-orbit"></div><div class="ns-grove-ground"></div>'+
      '<div class="ns-grove-secondary">'+products+'</div><div class="ns-nariyal-object">'+products+
      '<svg class="ns-nariyal-face" viewBox="0 0 400 400" fill="none" focusable="false"><g class="ns-nariyal-eyes" fill="#181d10">'+
      '<path d="M210 158 Q222 153 236 156 L229 159 218 159Z"/><path d="M269 153 Q280 149 292 153 L283 156 274 155Z"/>'+
      '<g class="ns-nariyal-glint" stroke="#c7b988" stroke-width="1"><path d="M228 156l4 -.5M284 153l3 -.5"/></g></g>'+
      '<g class="ns-nariyal-lids" stroke="#272618" stroke-width="1.1"><path d="M211 158l12 2 12 -3M270 154l10 1 12 -3"/></g></svg>'+
      '<div class="ns-nariyal-light"></div></div>'+
      '<img class="ns-grove-privacy-leaf" src="/assets/images/brand/grove/palm.webp" alt="" width="1200" height="600" decoding="async" draggable="false">'+
      '<div class="ns-nariyal-fallback">Rooted in nature.</div><span class="ns-nariyal-caption">Naturally considered.</span></div>';
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
    shell.querySelectorAll('.ns-nariyal-scene img').forEach(function (img) {
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
