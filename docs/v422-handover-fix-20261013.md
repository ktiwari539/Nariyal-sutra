# V42.2 railway / bus handover continuation — 13 October 2026

This fix continues PR #13 on `fix/v422-admin-login-checkout-preview-20261012`, based on verified parent `2740ea4c3db408602ff215b3776c3e96cc9b8062`. Preserve the Owner/authentication and coconut-theme work already in that parent. Do not merge another PR, roll back as a routine response, or run concurrent deployments.

## Defects and resulting behaviour

- Legacy injected dark panel gradients overrode the light-theme surfaces, while the text used light-theme brown/green ink. Checkout, frequency and handover panels now pair their surfaces with the active theme; labels, entered text, placeholders and dropdown options remain readable.
- The former railway/bus search used five general text matches, without a city-only distance origin. Explicit city/PIN lookup now resolves a locality centre; a map/GPS pin takes precedence. Public Overpass queries retrieve mapped railway stations/halts within 30 km and bus stands/stops/platforms within 15 km. Every valid returned point in range appears in a native dropdown, sorted by locally calculated distance; the first three are quick choices. Optional station codes are retained. Approximate straight-line distances are disclosed; road distance and handover feasibility are separate.
- A locality centre is never written as the customer's exact delivery coordinates. Location permission remains optional and requires the existing explicit GPS action. Typing does not query the geocoder. Results/locality centres are cached in memory; failed service calls have one bounded alternate endpoint and a retry/manual-entry fallback. Partial service responses are rejected.
- Re-rendering product/quantity controls no longer clears the dropdown. Manual entry/clearing the dropdown clears the prior selected point coordinates. Location changes remove stale results/distances; late responses cannot replace the active method. Selection uses the existing order name/address/coordinate/source fields and appears in the recap.
- Repeated homepage sequence application used to detach the entire order section even when its order was correct, interrupting city focus/entry. Sequencing now moves only misplaced sections. Real published reorder/hide operations remain effective and a moved focused input retains its focus when still connected.

## Verified locally

- Actual shipped storefront with production CSP and isolated public-map fixtures: **645 assertions / 24 mode-theme-viewport cases**, all four themes on desktop/tablet/mobile. Covers missing location, city-only origin, all nine station results beyond the former five-result cap, station code, three bus types, sorted distances, dropdown and keyboard selection, clear/manual override, quantity re-render, location invalidation, late response, bounded service fallback, failure/empty results, no automatic GPS, zero order/notification/payment writes, and >=4.5:1 input/placeholder/copy contrast.
- Actual published sequence reapplication/reorder/hide/restore preserves the city element/value/focus.
- Existing checkout delivery-step, live storefront preview (36 checks), GPS/map synchronization, delivery preference contract, quantity/subtotal and availability regression checks pass.
- Startup, theme/auth/Firebase contracts pass. Netlify build retains **306 public files / five Functions**. Release boundary passes 68 assertions. Syntax and whitespace checks pass.
- `index.html`, both Admin login HTML files, production auth bridge, Firebase config/rules, all Functions and `ns-order-patch.js` remain byte-identical to the parent. No production/private data or runtime service settings changed.

## Remaining acceptance and release control

This is a code/fixture checkpoint, not a production certification. CI must pass on the exact successor commit recorded in PR #13. Real hosted candidate and real Owner/login/session/permissions/data/Functions acceptance are still required.

Public live probes from the work environment returned six mapped bus points from `overpass-api.de`, but railway requests returned a gateway timeout and the alternate endpoint timed out. Fixture success does not certify live provider availability. Check both modes from the hosted candidate and retain usable manual entry if providers or mapped coverage are unavailable; do not fabricate choices or distances.

Production remains deployment `6acbcf29be4bd8572496a8ce` (V42.1). Retained emergency deployment is `6aabbbb1784e0d2d89174d0d`. Keep `[skip netlify]` on the commit/PR, preserve recovery bundles and prior failure evidence, and coordinate the single gated forward production release with the existing authenticated Work session. Netlify authentication is separate from Firebase Owner authentication.

Provider implementation references: [Nominatim Search](https://nominatim.org/release-docs/latest/api/Search/), [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/), [Overpass coordinate search](https://dev.overpass-api.de/overpass-doc/en/full_data/polygon.html), [public Overpass instances](https://wiki.openstreetmap.org/wiki/Overpass_API). The existing geocoder is used only for explicit locality resolution, with a per-locality cache and request spacing; no POI enumeration or autocomplete uses Nominatim.
