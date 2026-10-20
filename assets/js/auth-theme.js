/* Pre-login presentation only. No Firebase SDK, private documents or auth dependency. */
(function () {
  'use strict';
  var ids = ['nariyal-signature', 'fresh-grove', 'coastal-premium', 'golden-harvest'];
  var root = document.documentElement, settled = false, resolveReady, storefrontId, storefrontReady = false;
  var ready = new Promise(function (resolve) { resolveReady = resolve; });
  var api = { id: ids[0], ready: ready, status: 'pending' };
  window.NSAuthTheme = api;
  root.dataset.authThemeStatus = 'pending';
  function apply(id, status) {
    api.id = ids.includes(id) ? id : ids[0];
    api.status = status;
    root.dataset.authTheme = api.id;
    root.dataset.authThemeStatus = status;
    resolveReady(api.id);
    window.dispatchEvent(new CustomEvent('ns:auth-theme-ready', { detail: { id: api.id } }));
  }
  function finish(id, status) {
    if (settled) return; // A slow response must never recolor an already usable auth screen.
    settled = true;
    apply(id, status);
  }
  // The storefront's first pass can use placeholder config. Initial login still
  // resolves the sanitized public endpoint; later published/scheduled changes
  // (or an explicit storefront preview) keep an open account panel in sync.
  function storefrontChanged(event) {
    var detail = event.detail || {}, id = detail.id;
    if (!ids.includes(id) || root.dataset.nsTheme !== id) return;
    var changed = storefrontId !== undefined && storefrontId !== id;
    storefrontId = id;
    if ((!changed && !detail.preview && !storefrontReady) || (settled && api.id === id)) return;
    settled = true;
    apply(id, detail.preview ? 'storefront-preview' : 'storefront');
  }
  window.addEventListener('ns:theme-applied', storefrontChanged);
  window.addEventListener('nsv421:production-ready', function (event) {
    if (!event.detail || event.detail.mode !== 'public') return;
    storefrontReady = true;
    // The public runtime handles this same event. Read its allowlisted result
    // after its synchronous resolver, never its documents or private identity.
    queueMicrotask(function () { storefrontChanged({detail:{id:root.dataset.nsTheme}}); });
  });
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
