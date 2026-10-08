/* Pre-login presentation only. No Firebase SDK, private documents or auth dependency. */
(function () {
  'use strict';
  var ids = ['nariyal-signature', 'fresh-grove', 'coastal-premium', 'golden-harvest'];
  var root = document.documentElement, settled = false, resolveReady;
  var ready = new Promise(function (resolve) { resolveReady = resolve; });
  var api = { id: ids[0], ready: ready, status: 'pending' };
  window.NSAuthTheme = api;
  root.dataset.authThemeStatus = 'pending';
  function finish(id, status) {
    if (settled) return; // A slow response must never recolor an already usable auth screen.
    settled = true;
    api.id = ids.includes(id) ? id : ids[0];
    api.status = status;
    root.dataset.authTheme = api.id;
    root.dataset.authThemeStatus = status;
    resolveReady(api.id);
    window.dispatchEvent(new CustomEvent('ns:auth-theme-ready', { detail: { id: api.id } }));
  }
  // Explicit local visual previews cannot alter the published theme or escape the allowlist.
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    var preview = new URLSearchParams(location.search).get('themePreview');
    if (ids.includes(preview)) { finish(preview, 'local-preview'); return; }
  }
  var controller = new AbortController();
  var timeout = setTimeout(function () { finish(ids[0], 'fallback'); controller.abort(); }, 650);
  fetch('/.netlify/functions/published-auth-theme', {
    method: 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal
  }).then(function (response) {
    if (!response.ok) throw new Error('Theme unavailable');
    return response.json();
  }).then(function (data) {
    finish(data.themeId, ids.includes(data.themeId) ? 'published' : 'fallback');
  }).catch(function () { finish(ids[0], 'fallback'); }).finally(function () { clearTimeout(timeout); });
})();
