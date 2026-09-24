# Nariyal Sutra pre-release optimization report

Date: 2026-09-23

Development branch: `improvement/pre-release-optimization`
Verified baseline: `4b55587a8c7f67b1b6a94b179b0485a9ec3fa821`

## Executive summary

- `origin/main` exactly matched the approved baseline. It had not advanced, and the working tree was clean before this branch was created.
- No production deployment, production Firebase mutation, real communication, order, enquiry, DNS change, or merge to `main` was performed.
- Sixteen files with no current HTML, JavaScript loader, Admin entry-point, QA, workflow, or compatibility reference were removed.
- The original three large PNGs were preserved. WebP variants reduce those files by 90.9% to 96.0% with identical dimensions and no transparency loss.
- Homepage transfer fell 46.3% on desktop and 58.0% on mobile in the same cache-disabled local laboratory harness.
- Leaflet is no longer requested during the initial homepage load. It loads when the checkout map approaches the viewport or a map control is used.
- The public People page sitemap/indexing conflict was fixed by adding an indexable robots directive, canonical URL, and matching social metadata.
- The approved Media Library layout and all storefront/admin visual behavior were preserved. The current regression matrix, supplemental visual/content checks, and both Firestore emulator suites pass.

## Repository preparation

| Check | Result |
|---|---|
| Remote | `origin` → `ktiwari539/Nariyal-sutra` |
| Approved baseline | `4b55587a8c7f67b1b6a94b179b0485a9ec3fa821` |
| Fetched `origin/main` | `4b55587a8c7f67b1b6a94b179b0485a9ec3fa821` |
| Baseline vs current main | `0 0` ahead/behind; no differences |
| Initial working tree | Clean |
| Development branch | `improvement/pre-release-optimization` |
| Main/history | Unchanged; no branch or backup deletion |

The Firebase configuration, Firestore strict and cutover rules, Netlify Functions, QA scripts, prior acceptance gates, GitHub Actions workflow, and production cutover runbook were reviewed before changes.

## Dependency and unused-file audit

Evidence used for each classification:

1. exact-name reverse-reference search across all tracked HTML, CSS, JavaScript, JSON, Markdown, Netlify configuration, QA scripts, and workflows;
2. inspection of dynamic script/link loaders;
3. inspection of Admin/public entry points;
4. Git history search for former loader references;
5. syntax and full current regression execution after removal.

### Requested files

| File | Classification | Evidence and disposition |
|---|---|---|
| `assets/js/admin-v35.js` | Confirmed Unused | No current or historical entry-point/loader reference; superseded Admin overlays provide the live workflows. Deleted. |
| `assets/js/admin-v38.js` | Confirmed Unused | Former experimental Admin overlay; historical loader was removed. Current runtime uses `admin-v38-production.js`, review contracts, stability, and later Admin modules. Deleted. |
| `assets/js/v35-public.js` | Confirmed Unused | No reference from public pages, dynamic loaders, tests, or workflows. Deleted. |
| `assets/js/v421-ambassador-campaign-seed.js` | Confirmed Unused | One-time local seed with no loader, test, migration invocation, or entry-point reference. Deleted. |
| `assets/js/v421-cinematic-compact.js` | Confirmed Unused | Historical compact override; loader removed when the professional cinematic became authoritative. Deleted. |
| `assets/js/v421-cinematic-final.js` | Confirmed Unused | Historical override that formerly loaded the rebuild runtime; no current reference. Deleted. |
| `assets/js/v421-cinematic-isolated.js` | Confirmed Unused | Historical isolated film; replaced by `v421-cinematic-professional.js` and no longer loaded or tested. Deleted. |
| `assets/js/v421-gold-master-correction.js` | Confirmed Unused | Historical correction layer; its loader was removed and accepted behavior now lives in the active professional/final-polish stack. Deleted. |
| `assets/css/admin-v35.css` | Confirmed Unused | No stylesheet entry, loader, or test reference. Deleted. |
| `assets/css/v35-public.css` | Confirmed Unused | No stylesheet entry, loader, or test reference. Deleted. |
| `assets/css/v421-cinematic-rebuild.css` | Confirmed Unused | Unreferenced 132-byte placeholder; runtime styles are injected by JavaScript. Deleted. |
| `assets/css/v421-public.css` | Confirmed Unused | No stylesheet entry or dynamic loader; selectors are not part of the active public shell. Deleted. |
| `scripts/.qa-trigger-2` | Confirmed Unused | Four-byte historical CI trigger, not read by code or workflow. Deleted. |
| `scripts/.qa-trigger-3` | Confirmed Unused | Four-byte historical CI trigger, not read by code or workflow. Deleted. |
| `scripts/.qa-trigger-4` | Confirmed Unused | Four-byte historical CI trigger, not read by code or workflow. Deleted. |
| `scripts/.qa-trigger-5` | Confirmed Unused | Four-byte historical CI trigger, not read by code or workflow. Deleted. |

No requested file was classified Active or Legacy/Compatibility after the full reference and history review.

### Important retained dependencies

| Classification | Retained items | Reason |
|---|---|---|
| Active | `v421-cinematic-professional.js`, `v421-cinematic-professional.css`, `v29-public.js`, `v36-public.js`, `v421-visual-recovery.js`, `v421-storefront-final-polish.js` | Current approved cinematic ownership, sequence, viewport, and final media behavior. |
| Active | `admin-v21.js`, `admin-v29.js`, `admin-v30.js`, `admin-v36.js`, `admin-v37.js`, dynamically loaded production/admin overlays | Current Business Command Center UI and protected production bridge. |
| Active | Firebase 12.18.0 modules, EmailJS browser/server integration, Google Analytics, Nominatim, Cloudinary upload path | Current customer, Admin, analytics, geocoding, media, and communication contracts. |
| Active, lazy | Leaflet 1.9.4 | Required for checkout map interaction, now excluded from the initial homepage request path. |
| Legacy/Compatibility | `admin-live-legacy.html` | Rejected as the canonical Admin, not routed by `admin.html`, but retained pending explicit approval to retire the standalone compatibility page. |
| Legacy/QA | `admin-login.html`, `admin-set-password.html`, `staff-sign-in.html` | Local preview invitation, password, and role-flow QA. They are not production authorization controls. |
| Legacy/Compatibility | `v421-cinematic-rebuild.js` and other unlisted versioned layers | Not deleted because a complete compatibility proof was outside the targeted suspect set; retained for a later module-by-module consolidation. |

## Files deleted, added, and modified

### Deleted

The 16 Confirmed Unused files listed above.

### Added

- `assets/images/review/coastal-grove.webp` — optimized equivalent, original retained.
- `assets/images/review/backwater-grove.webp` — optimized equivalent, original retained.
- `assets/images/people-uploads/U002.webp` — optimized equivalent, original retained.
- `assets/js/homepage-analytics.js` — cacheable extraction of the non-visual analytics bootstrap.
- `scripts/pre-release-optimization-qa.mjs` — guards dead-code removal, image preservation/optimization, lazy Leaflet, SEO, and Admin auth-chain contracts.
- This report.

### Modified by purpose

- Homepage/performance: `index.html`, `assets/js/v21-public.js`, `assets/js/v20-review-fixes.js`, `assets/js/v23-public.js`, `assets/js/v421-cinematic-professional.js`, `assets/js/v421-storefront-final-polish.js`.
- Optimized media defaults/migration: `assets/js/v421-local-store.js`, `assets/js/store.js`, `assets/js/people.js`, `assets/js/v421-media-integrity.js`, `assets/js/admin-v38-production.js`, `assets/js/admin-v40-owner-control.js`, `assets/js/v421-cinematic-rebuild.js`, `assets/css/v25-public.css`.
- Customer pages using grove media: `about-nariyal-sutra.html`, `direct-farm.html`, `gujarat-coast.html`, `south-india-groves.html`, `people-of-nariyal-sutra.html`.
- SEO: `people-of-nariyal-sutra.html`, `sitemap.xml`.
- QA/CI: `.github/workflows/cinematic-rebuild-qa.yml`, `scripts/netlify-dev-contract-qa.mjs`, `scripts/prepare-netlify-dev.mjs`.

## Performance comparison

Method: a new headless Chromium context per viewport, local static server, service workers blocked, HTTP cache disabled, 6.5-second observation window, PerformanceObserver for paint/LCP/CLS/event/long-task entries, then one navigation interaction. External requests were not used as production field data. Results are laboratory values, not real-user monitoring.

| Metric | Desktop before | Desktop after | Mobile before | Mobile after |
|---|---:|---:|---:|---:|
| Total transfer | 20,192,564 B | 10,834,739 B (-46.3%) | 17,639,998 B | 7,402,899 B (-58.0%) |
| Requests completed in window | 112 | 121 | 92 | 96 |
| Document transfer | 264,532 B | 262,999 B | 264,532 B | 262,999 B |
| JavaScript transfer | 404,986 B | 408,940 B | 404,986 B | 408,940 B |
| CSS transfer | 172,890 B | 172,891 B | 172,890 B | 172,891 B |
| Image transfer | 19,350,156 B | 9,989,909 B (-48.4%) | 16,797,590 B | 6,558,069 B (-61.0%) |
| First Contentful Paint | 1,164 ms | 1,012 ms | 432 ms | 332 ms |
| Largest Contentful Paint | 1,540 ms | 1,352 ms | 732 ms | 628 ms |
| Cumulative Layout Shift | 0.630227 | 0.630228 | 0.043089 | 0.043132 |
| Lab interaction max | 984 ms | 864 ms | 128 ms | 88 ms |

The cache-disabled request count is timing-sensitive: more smaller images completed within the fixed after-run window. Initial Leaflet requests were separately instrumented as 0 before checkout visibility and 2 (CSS + JavaScript) after the checkout map entered the lazy-load margin. The two grove PNG transfers disappeared from the final homepage run.

No production RUM dataset was available, so INP is not claimed. The event-duration measurement above is explicitly laboratory interaction latency.

Desktop CLS remains high but unchanged. It comes from the accepted intro/main cinematic transition and is recorded as future performance work rather than altered during this no-redesign phase.

## Image preservation and quality evidence

| Asset | Original | WebP | Reduction | Dimensions | Alpha/transparency | PSNR |
|---|---:|---:|---:|---|---|---:|
| `coastal-grove` | 2,925,094 B | 266,814 B | 90.88% | 1672×941 → 1672×941 | Original opaque; unchanged | 32.2411 dB |
| `backwater-grove` | 2,857,029 B | 250,616 B | 91.23% | 1672×941 → 1672×941 | Original opaque; unchanged | 32.4618 dB |
| `U002` | 2,824,598 B | 113,848 B | 95.97% | 1122×1402 → 1122×1402 | PNG has an alpha channel but every pixel is fully opaque; no visible transparency was lost | 36.2102 dB |

All originals remain in the repository. Browser image decode checks, Media Quality Gate, media-integrity checks, gold-master visual QA, full visual scroll/reveal QA, and desktop/tablet/mobile screenshot QA pass. AVIF was not added because the available encoder was read-only; adding another build dependency solely for AVIF was not justified after the WebP result and would expand release risk.

## Admin security and entry-point findings

| Entry point | Runtime purpose | Access/auth behavior | Finding |
|---|---|---|---|
| `admin.html` | Canonical Business Command Center URL | Redirects to `admin-preview.html`, preserving query/hash | Required and Active. The production bridge enforces auth after the shared shell loads. |
| `admin-preview.html` | Shared local preview and production Admin shell | Localhost uses isolated local data; non-local runtime dynamically loads the Firebase production bridge, which redirects unauthenticated/unauthorized users | Required and Active. Public shell visibility is not treated as authorization; Firestore rules and role checks protect data/actions. |
| `admin-bcc-login.html` | Production Firebase sign-in | Requires verified email; Owner requires configured UID + email; staff requires an Active `adminRoles` record, `active=true`, allowed role, and matching email | Required and Active. |
| `admin-login.html` | Local preview staff login | Local-store password verifier and session only | Legacy/QA. Not production authentication. Retained because current Admin QA/invite flows link to it. |
| `admin-set-password.html` | Local preview invitation/reset completion | Expiring local token, minimum password length, salted SHA-256 verifier | Legacy/QA. Retained for local staff workflow tests. |
| `staff-sign-in.html` | Simplified role-preview entry | Demo identities and any non-empty local password, then redirects to shared Admin shell | Legacy/QA. It cannot grant production data access, but public production exposure is confusing; restrict/redirect only after explicit workflow approval. |
| `admin-live-legacy.html` | Older standalone Firebase Admin | Contains its own Firebase sign-in and role lookup; no canonical redirect points to it | Obsolete/Compatibility. It is not the approved production entry and is explicitly rejected by current readiness tests. Retained pending manual retirement approval. |

`noindex` is present on Admin/support pages for search hygiene only. It is not counted as authentication or authorization. Production enforcement remains Firebase identity, verified email/role checks, protected server functions, and Firestore Security Rules.

## SEO findings and fixes

- All structured-data blocks parse as JSON.
- No duplicate canonical URL declarations were found.
- Sitemap entries, canonical host, redirects, internal assets, and local links passed the static/content-integrity audits.
- Fixed the People page contradiction: it was included in `sitemap.xml` while declaring `noindex,nofollow` and lacking a canonical URL.
- Added the People canonical, indexable robots directive, Open Graph URL/title/description/type/site name, and Twitter card metadata.
- Updated the homepage and People sitemap `lastmod` dates to 2026-09-23.
- Existing `/people` and `/coconut-water` rewrites remain to preserve incoming URLs. Canonicals identify the preferred URL. Converting all historical aliases to permanent redirects is deferred until access-log and backlink review.
- Production domain and DNS were unchanged.

## Architecture assessment

After cleanup the repository still has 25 HTML pages, 32 CSS files, 67 JavaScript files, 6 Netlify Functions, and multiple layered versioned runtimes. The homepage contains approximately 113 KB of inline CSS and 67 KB of inline JavaScript. Much of this code is page-specific and cascade/order-sensitive.

Small refactors completed:

- extracted the reusable/non-visual analytics bootstrap into a cacheable asset without changing initialization order;
- added a single Leaflet loader contract and removed eager homepage Leaflet tags;
- added known-image path migration for existing local state so old PNG references do not defeat the optimized defaults;
- added a focused optimization/entry/security regression gate to CI.

Recommended future module boundaries:

| Area | Proposed modules |
|---|---|
| Public bootstrap | `public/bootstrap`, `public/analytics`, `public/catalog` |
| Commerce | `checkout/form`, `checkout/delivery-preferences`, `checkout/location-map`, `checkout/order-submit` |
| Experience | `experience/intro`, `experience/cinematic`, `experience/media-placement`, `experience/people-rail` |
| Admin platform | `admin/auth-gate`, `admin/data-source`, `admin/permissions`, `admin/shell` |
| Admin features | `admin/orders`, `admin/customers`, `admin/followups`, `admin/content-media`, `admin/communications` |
| Shared | `shared/roles`, `shared/media-policy`, `shared/validation`, `shared/events` |

Migration approach:

1. create an explicit entry-point manifest and runtime ownership map;
2. move one functional slice at a time behind compatibility wrappers;
3. add contract tests before removing each versioned layer;
4. consolidate CSS by component/layer with computed-style screenshot parity, not a bulk concatenation;
5. retire legacy Admin pages only after production auth/role smoke tests and explicit approval.

A complete rewrite or wholesale merge of versioned files was intentionally not attempted.

## Regression and safety results

Applicable current gates:

- 40/40 unique workflow-equivalent static/browser checks passed after the U002 assertion was updated to require the WebP runtime path and both preserved image files.
- Supplemental full visual QA: pass, 0 failures, 0 warnings; desktop, laptop, tablet, two mobile widths, People rail, and account screenshots captured.
- Supplemental storefront content-integrity QA: pass, 0 failures.
- Firestore strict rules emulator: pass.
- Firestore zero-downtime cutover rules emulator: pass.
- Netlify Functions/security, App Check, Admin role, Owner OTP, communication, follow-up, order lifecycle, media, acquisition, checkout delivery/location, and production readiness contracts passed.
- Communication acceptance recorded zero external mutations.

`scripts/admin-functional-qa.mjs` was also inspected/executed as a supplemental legacy check. It fails on the approved baseline architecture because it requires `admin.html` itself to contain the old standalone `admin-live-legacy.html` Firebase UI. Current `admin-production-readiness-qa.mjs` and `release-candidate-qa.mjs` explicitly require the opposite: canonical `admin.html` must route to the shared Business Command Center and must not route to the rejected legacy Admin. Its assertions were not weakened or removed; it is documented as a superseded, non-workflow test.

GitHub Actions is configured to run the full three-job workflow on this development branch. The final run URL and exact commit SHA are provided in the handoff after push.

## Remaining blockers and approval items

- Production RUM/INP, authenticated production Admin smoke tests, App Check console state, and real provider health require production access and were not executed.
- Desktop CLS is an existing accepted-animation issue and remains approximately 0.63 in the local lab. Reducing it requires a separately approved intro/cinematic behavior change.
- Decide whether to redirect or remove `admin-live-legacy.html` and public local-QA staff pages after confirming no operational bookmarks or training workflow depends on them.
- Continue module consolidation incrementally; do not delete remaining versioned layers solely because their names look old.
- No deployment or merge should occur until visual/report review is approved.
