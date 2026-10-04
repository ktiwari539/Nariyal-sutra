/* Shared presentation only. Authentication and authorization remain in their adapters.
   The animation boundary consumes focus/type/enum state, never input values or lengths. */
(function () {
  'use strict';
  var soundOn = false, serial = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var copy = {
    customer: { context: 'My Account', access: 'Customer Access', title: 'A little nature.<br><em>A daily ritual.</em>', detail: 'Fresh beginnings. Familiar details. A place that feels like you.', foot: 'Rooted in nature. Made for your everyday.' },
    admin: { context: 'Business Command Center', access: 'Admin Access', title: 'Thoughtful care.<br><em>In every detail.</em>', detail: 'A considered space for the people behind Nariyal Sutra.', foot: 'Good things begin with care.' }
  };
  function brand() { return '<a class="ns-auth-brand" href="/index.html" aria-label="Nariyal Sutra home"><strong>NARIYAL SUTRA</strong><span>THE SCIENCE OF PURITY</span></a>'; }
  function object(context) {
    var id = 'ns-guardian-' + (++serial);
    function eye(x, y, side) {
      var opening = 'M-33 1 Q-18 -15 0 -12 Q19 -14 33 0 Q16 14 -1 11 Q-20 11 -33 1Z';
      return '<g class="ns-guardian-eye ns-guardian-eye-'+side+'" transform="translate('+x+' '+y+')">'+
        '<ellipse rx="37" ry="20" fill="#171c10" opacity=".19" filter="url(#'+id+'-shadow)"/>'+
        '<g class="ns-guardian-blink"><clipPath id="'+id+'-'+side+'"><path d="'+opening+'"/></clipPath>'+
        '<path d="'+opening+'" fill="#11190f" opacity=".82"/>'+
        '<g class="ns-guardian-iris" clip-path="url(#'+id+'-'+side+')"><ellipse cx="3" cy="0" rx="11" ry="13" fill="url(#'+id+'-iris)"/><ellipse cx="4" cy="0" rx="4" ry="8" fill="#11180f"/>'+
        '<ellipse class="ns-nariyal-glint" cx="6" cy="-4" rx="2.5" ry="1.4" fill="#efdfb1" opacity=".72"/></g>'+
        '<path d="M-34 0 Q-18 -16 0 -13 Q20 -15 34 -1" stroke="var(--guardian-eye-rim)" stroke-width="1.8" opacity=".62"/>'+
        '<path d="M-32 3 Q-16 15 1 12 L26 6" stroke="var(--guardian-eye-rim)" stroke-width="1.2" opacity=".5"/>'+
        '<path d="M-28 -3l8 -4M18 -5l9 1M-18 11l8 2" stroke="var(--guardian-eye-rim)" opacity=".4" stroke-width=".8"/></g></g>';
    }
    function product(role) { return '<span class="ns-grove-product" data-guardian-product="'+role+'"></span>'; }
    return '<div class="ns-nariyal-scene" data-guardian-ready="false" aria-hidden="true"><div class="ns-nariyal-orbit"></div><div class="ns-grove-ground"></div>'+
      '<div class="ns-grove-secondary">'+(context==='admin'?'':product('secondary'))+'</div><div class="ns-nariyal-object"><div class="ns-guardian-core">'+product('primary')+
      '<svg class="ns-nariyal-face" viewBox="0 0 400 400" fill="none" focusable="false"><defs>'+
      '<radialGradient id="'+id+'-iris"><stop stop-color="var(--guardian-iris)"/><stop offset=".6" stop-color="#34432a"/><stop offset="1" stop-color="#172012"/></radialGradient>'+
      '<filter id="'+id+'-shadow"><feGaussianBlur stdDeviation="2.2"/></filter>'+
      '<filter id="'+id+'-texture" x="-10%" y="-15%" width="120%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="2" seed="17" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale=".8" xChannelSelector="R" yChannelSelector="G"/></filter></defs>'+
      '<g class="ns-nariyal-eyes" filter="url(#'+id+'-texture)">'+eye(198,164,'far')+eye(286,158,'near')+'</g>'+
      '<g class="ns-nariyal-lids" stroke="var(--guardian-eye-rim)" stroke-width="2"><path class="ns-guardian-lid-far" d="M166 165Q198 183 230 163"/><path class="ns-guardian-lid-near" d="M254 159Q286 177 318 157"/></g></svg>'+
      '<div class="ns-nariyal-light"></div></div></div><div class="ns-grove-leaf-rig">'+
      '<span class="ns-grove-leaf-shadow" data-guardian-leaf></span>'+
      '<span class="ns-grove-privacy-leaf" data-guardian-leaf></span></div>'+
      '<div class="ns-nariyal-fallback">Rooted in nature.</div><span class="ns-nariyal-caption">Naturally considered.</span></div>';
  }
  function hydrateArt(shell) {
    var scene = shell.querySelector('.ns-nariyal-scene');
    var theme = window.NSAuthTheme, ready = theme && theme.ready ? theme.ready : Promise.resolve('nariyal-signature');
    ready.then(function (id) {
      if (!shell.isConnected) return;
      var pairs = {'nariyal-signature':['signature','golden'],'fresh-grove':['fresh','coastal'],'coastal-premium':['coastal','fresh'],'golden-harvest':['golden','signature']};
      var pair = pairs[id] || pairs['nariyal-signature'], images = Array.from(scene.querySelectorAll('[data-guardian-product],[data-guardian-leaf]')), remaining = images.length;
      function done(failed) { if (failed) shell.dataset.nariyalAsset = 'fallback'; if (--remaining === 0) scene.dataset.guardianReady = 'true'; }
      images.forEach(function (slot) {
        // Insert a fully sourced image so storefront media guards never see an empty img.
        var img = document.createElement('img'); img.className = slot.className;
        img.alt = ''; img.width = 960; img.height = slot.hasAttribute('data-guardian-leaf') ? 480 : 960;
        img.decoding = 'async'; img.draggable = false;
        if (slot.dataset.guardianProduct) img.dataset.guardianProduct = slot.dataset.guardianProduct;
        else img.dataset.guardianLeaf = '';
        img.onload = function () { done(false); }; img.onerror = function () { done(true); };
        var role = img.dataset.guardianProduct, file = role ? pair[role==='primary'?0:1] : 'palm';
        img.src = '/assets/images/brand/guardian/'+file+'.webp';
        slot.replaceWith(img);
      });
    });
  }
  function markup(context, content, mode) {
    var c = copy[context] || copy.customer;
    return '<section class="ns-auth-shell" data-auth-context="'+context+'" data-auth-state="'+(mode||'signin')+'" data-nariyal-pose="idle">'+
      '<div class="ns-auth-art"><div class="ns-auth-art-copy"><span class="ns-auth-eyebrow">'+c.access+'</span><h2>'+c.title+'</h2><p>'+c.detail+'</p></div>'+object(context)+'<div class="ns-auth-art-foot"><span class="ns-auth-line"></span>'+c.foot+'</div></div>'+
      '<div class="ns-auth-content"><div class="ns-auth-topline"><span>'+c.context+'</span><button type="button" class="ns-auth-sound" data-auth-sound aria-pressed="'+soundOn+'" aria-label="'+(soundOn?'Turn sound off':'Turn sound on')+'">Sound '+(soundOn?'on':'off')+'</button></div><div class="ns-auth-stage">'+content+'</div></div><div class="ns-auth-sweep-track" aria-hidden="true"><div class="ns-auth-sweep"></div></div></section>';
  }
  function cue(kind, shell) {
    if (soundOn && window.NSAuthSonics) window.NSAuthSonics.play(kind, shell && shell.dataset.authContext==='admin' ? .35 : 1);
  }
  function setPose(shell, next) {
    if (!shell || !['idle','email','privacy','peek','error','success'].includes(next) || shell.dataset.nariyalPose===next) return;
    var previous = shell.dataset.nariyalPose;
    shell.dataset.guardianPrivacy = previous==='peek' ? 'return' : 'enter';
    shell.dataset.nariyalPose = next;
    if (next==='privacy') {
      var now = Date.now();
      if (!shell._guardianRustleAt || now-shell._guardianRustleAt>900) { cue('privacy', shell); shell._guardianRustleAt=now; }
    } else if (next==='peek') cue('peek', shell);
  }
  function shellOf(root) { return root && (root.matches('.ns-auth-shell') ? root : root.querySelector('.ns-auth-shell')); }
  function pose(shell, userFocus) {
    if (!shell) return;
    if (shell.dataset.authFeedback==='error' && !userFocus) return;
    if (userFocus) shell.dataset.authFeedback='idle';
    var focused = document.activeElement, password = focused && focused.closest('.ns-auth-password');
    // The reveal button remains within this wrapper, so keyboard toggling preserves privacy.
    var hiddenPassword = password && password.querySelector('input[type="password"]');
    setPose(shell, password ? (hiddenPassword ? 'privacy' : 'peek') :
      focused && focused.matches('input[type="email"]') ? 'email' : 'idle');
  }
  function signal(root, name, quiet) {
    var shell = shellOf(root);
    if (!shell || !['idle', 'loading', 'error', 'success'].includes(name)) return;
    var changed = shell.dataset.authFeedback !== name;
    if (name==='idle' && shell.querySelector('.nsacct-msg.show.err,.msg.err')) return;
    shell.dataset.authFeedback = name;
    if (name==='error' || name==='success') setPose(shell, name);
    if (name === 'success' && changed && !quiet) cue('signature', shell);
    if (name === 'success') {
      var panel = shell.closest('#nsacct-panel');
      if (panel) { panel.classList.add('ns-auth-acknowledged'); setTimeout(function () { panel.classList.remove('ns-auth-acknowledged'); }, 650); }
    }
  }
  function bind(shell) {
    if (shell.dataset.authBound) return;
    shell.dataset.authBound = 'true';
    shell.addEventListener('focusin', function () { pose(shell, true); });
    shell.addEventListener('input', function () { pose(shell, true); });
    shell.addEventListener('pointerdown', function (event) {
      if (event.target === document.activeElement && event.target.matches('input')) pose(shell, true);
    });
    shell.addEventListener('focusout', function (event) {
      // Moving to Show/Hide stays in the same privacy region; avoid a transient idle cue.
      var wrapper = event.target.closest('.ns-auth-password');
      if (wrapper && event.relatedTarget && wrapper.contains(event.relatedTarget)) return;
      queueMicrotask(function () { pose(shell); });
    });
    // Native validation also covers autofill, paste and password-manager insertion.
    shell.addEventListener('invalid', function () { signal(shell, 'error'); }, true);
    shell.addEventListener('submit', function () {
      signal(shell, 'loading');
      var password = shell.querySelector('.ns-auth-password input:not(:disabled)');
      if (password) setPose(shell, password.type==='password' ? 'privacy' : 'peek');
    }, true);
    hydrateArt(shell);
    // Observe status CLASSES, not messages (which may contain account details).
    var observer = new MutationObserver(function () {
      var message = shell.querySelector('.nsacct-msg.show,.msg.err,.msg.ok');
      if (message) signal(shell, message.classList.contains('err') ? 'error' : message.classList.contains('ok') ? 'success' : 'idle', true);
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
        var shell = shellOf(root); if (shell) { shell.dataset.authFeedback='idle'; setPose(shell, reveal ? 'peek' : 'privacy'); }
      });
      wrap.appendChild(toggle);
    });
    root.querySelectorAll('[data-auth-sound]').forEach(function (button) {
      button.onclick = function () {
        soundOn = !soundOn;
        if (window.NSAuthSonics) window.NSAuthSonics.setEnabled(soundOn);
        document.querySelectorAll('[data-auth-sound]').forEach(function (b) { b.textContent='Sound '+(soundOn?'on':'off'); b.setAttribute('aria-pressed',String(soundOn)); b.setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on'); });
        if (soundOn) cue('signature', shellOf(root));
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
    // State changes remain silent; only explicitly opted-in Guardian cues use sound.
  }
  window.NSAuthShell = { brand:brand, markup:markup, enhance:enhance, transition:transition, signal:signal };
})();
