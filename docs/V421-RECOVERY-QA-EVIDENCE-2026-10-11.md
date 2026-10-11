# Nariyal Sutra V42.1 — recovery QA evidence

**Date:** 2026-10-11 (Asia/Kolkata)  
**Repository:** `ktiwari539/Nariyal-sutra`  
**Recovery branch:** `fix/v421-prod-logout-loop-20261011`  
**Validated source commit:** `2f8a5df421e03520139d5c562f1fdb59f7a0acc1`  
**GitHub Actions result:** [V42.1 recovery safe QA, run 38140613386](https://github.com/ktiwari539/Nariyal-sutra/actions/runs/38140613386) — **SUCCESS**, both jobs completed.

## Checks completed

- Targeted mocked Firebase Owner sign-out/login lifecycle regression. This **does not** prove a real Firebase session is invalidated in the deployed website.
- Checkout recap regression for product/quantity, including authoritative example prices tender ₹77, green ₹70, bulk ₹72.
- Delivery source contracts covering explicit destination country, state/province, postal code, private order/notification payload, public tracking and WhatsApp message.
- Production Firebase environment fail-closed and configuration contracts; Netlify Functions safe request/production hostname boundaries.
- Price synchronization and static SEO acceptance contracts.
- Real headless Chromium on a local HTTP origin: mandatory customer-attribution guard rejected the incomplete order; an international UAE 10-piece checkout used a synthetic ₹77/unit source, and verified mocked order/email projections and WhatsApp quote content.
- Browser intercepted **all** non-local requests; mock save/email/WhatsApp handlers prevented customer data writes, external provider sends, or payment initiation.
- The focused GitHub workflow uses standard `ubuntu-latest` runners on a public repository, uploads no artifacts, and contains no deployment commands or live credentials.

## Code preserved

- Destination fields added to `index.html` notification order record: country/state/postal code.
- `scripts/v421-destination-data-qa.mjs` and `scripts/v421-browser-checkout-local-qa.mjs` committed.
- `.github/workflows/v421-recovery-qa.yml` added to run branch-scoped tests.

## Production remains deliberately unchanged

Netlify site ID: `231fa72c-f358-4efe-b8e6-3ca41a0932b5`  
Production URL: https://nariyal-sutra.netlify.app/  
Published/rolled-back deployment: `6aabbbb1784e0d2d89174d0d` (READY).

No production deploy, staging build, Firestore rules change, credential change, PR #10 merge, real email or customer order was undertaken during this verification.

## Release gates not yet satisfied

1. Actual **Owner logout** against a real Firebase session on the corrected deployed candidate; refresh and fresh-tab must remain signed out; new Owner sign-in must succeed. The production Firebase bridge intentionally runs only on the production hostname. Localhost and Netlify draft previews fail closed and therefore cannot demonstrate this genuine production-auth behavior.
2. Production-connected checkout and Functions/end-to-end delivery confirmation using controlled test records and cleanup, if approved.
3. One separately authorized production deployment with rollback ready, subject to the user's zero-additional-credit restriction.
4. Live post-release acceptance checks and the publication/reinspection of updated SEO resources (`llms.txt`, sitemap, canonical content); Google indexing and AI answers remain controlled by their providers.

**Decision: HOLD production** until explicit approval, an acceptable cost model and a trustworthy authenticated release-validation path are in place.

## Cost posture

This evidence was gathered through source reviews and GitHub Actions on free public-repository standard runners. No third-party metered browser automation was run. Do not create Netlify deploys, switch billing, or publish production without authorization.


## October 11 — subsequent auth hardening and extended CI

Following the initial green release checks, a deeper auth lifecycle review identified two additional fail-closed requirements and implemented them in the recovery branch:

- `assets/js/v421-production-bridge.js`: subscribe to Firebase `onAuthStateChanged` after initial authorization. If an already-open Admin tab loses its session or switches identity, block remote writes, cancel queued saves, hide the Admin UI, clear cached session indicators and redirect to explicit sign-out login. Initial-session race and repeated events are handled.
- `admin-preview.html`: hide the production Admin shell during first paint and Firebase bootstrap; the shell is released only by successful authorization. Local preview mode remains unchanged.
- `scripts/v421-admin-auth-session-qa.mjs`: seven mock-auth lifecycle scenarios (same user, cross-tab logout, duplicate event, identity switch, in-progress logout, initial session loss, non-admin).
- `scripts/v421-browser-checkout-local-qa.mjs`: Chromium now also loads the canonical production Admin HTML from a **local** repository fixture, intercepts all network traffic and verifies the first-paint gate stays closed before authorization.
- `.github/workflows/v421-recovery-qa.yml`: invokes the new auth-event regression.

**Authoritative latest CI:** [GitHub Actions run 38141302024](https://github.com/ktiwari539/Nariyal-sutra/actions/runs/38141302024): `completed / success`, `offline-regression=success`, `local-browser-checkout=success`. Tested code SHA: `c6acc7f66f7958fb3b0ca9e8642b5fc1890c59ef`.

**Release decision remains HOLD:** This is compelling simulated and local-browser evidence, **not** authenticated Firebase Owner proof. Real Firebase logout and fresh Owner sign-in require an authenticated real session with the corrected candidate under the permitted production hostname. The existing production deployment remains `6aabbbb1784e0d2d89174d0d`, with no redeploy and no Netlify usage initiated here. Post-deploy live checkout and SEO indexing verification also remain pending.

**Cost restriction:** no metered TinyFish automation, Netlify deployment, Firestore modification, or real outgoing email during these checks. Public GitHub Actions standard runners were used.


## October 11 — final additional source hardening and buyer discovery

**Latest passing tested source commit:** `4f925f87a76a9522d9a6733e570bdd04e6e16f70`  
**CI:** [Recovery QA run 38142484137](https://github.com/ktiwari539/Nariyal-sutra/actions/runs/38142484137), **SUCCESS** (offline-regression and local-browser-checkout).

### Newly completed

- Fixed Netlify clean-route Admin mismatch: `/admin-preview` and `/admin-preview/` rewrite to the Admin HTML but the bridge previously only recognized `/admin-preview.html`. All three are now covered by the production Firebase Admin route predicate. Non-Admin URLs stay excluded.
- Extended actual production-bridge regression to assert the path matrix.
- Updated the buying guide with real, customer-visible guidance for search expressions “nariyal pani,” “narial paani,” “नारियल पानी” and “tender coconut delivery.” Added links to the product selection, order enquiry and trade pages. It states serviceability and final charges need confirmation and **does not promise worldwide delivery or hard-code volatile prices**.
- Added dedicated source/sitemap/`llms.txt` discovery QA and workflow coverage.
- Stabilized the synthetic Chromium checkout test by waiting for deferred scripts/attribution controls and installing mocks after page readiness. A transient test timeout was investigated; the final corrected run is fully green.
- No production site or Firebase configuration was changed. Verified the rollback deployment remains `6aabbbb1784e0d2d89174d0d`.

### Still genuine external gates — do not mislabel them as passed

1. **Real authenticated Owner logout and fresh login** on a deployed build containing the new code. Verify no bounce back into Admin, including refresh and a second tab, and confirm the Owner can sign in again.
2. **Production checkout/read/write/e-mail/Functions** acceptance with strictly controlled test identity, order, cleanup and consent; local browser tests only used mocked callbacks.
3. **One expressly authorized Netlify production release** with rollback preserved, acknowledging possible usage/deployment credits. The zero-additional-credit instruction remains active.
4. **Google Search Console follow-through after release:** check live `robots.txt`, `sitemap.xml`, `llms.txt`, canonical URLs and structured data; re-submit the current sitemap and inspect the homepage and buyer landing pages. Crawling/indexing and AI search citations are not instant or guaranteed.

**Decision stays HOLD for production** until #1 can be verified safely after an explicitly authorized release. The GitHub work is checkpointed and tested.

## October 11 — final packaged release gate closed

**Package-tested commit:** `6f13a3504dd20dfb8af3b6a4f0135e3d7b5cefcb`

**Verified CI:** [Run 38146555381](https://github.com/ktiwari539/Nariyal-sutra/actions/runs/38146555381): all **three** jobs success (`release-package`, `offline-regression`, `local-browser-checkout`).

The new CI release-package job executed the real static build locally with the exact Netlify publish script, asserted `dist-site/index.html`, `llms.txt`, `robots.txt`, `sitemap.xml`, and absence of docs/scripts/netlify internals in the static publish output. It installed the ephemeral bundler and executed `scripts/netlify-function-package-qa.mjs`, which packaged exactly **five callable Function handlers** and required bundled shared helpers. Packaged Function release-boundary QA passed **68 assertions**. No Netlify deployment or Function invocation against live providers occurred.

The production rollback remained `6aabbbb1784e0d2d89174d0d` when checked; PR #10 remained unmerged.

**Live release still not authorized or proven:** real Firebase Owner login/logout/refresh/new-tab/login, and production checkout, pricing, email, Functions and live SEO acceptance require a controlled authorized release and genuine Owner session. The user's zero-additional-credit restriction still applies.

## October 11 — explicit V17/V18 reported-image and map regression gate

**Tested commit:** `f64f11fb95d693940f4498004261a29d461b351a`  
**Verified CI:** [Run 38147924302](https://github.com/ktiwari539/Nariyal-sutra/actions/runs/38147924302), **3/3 jobs passed**: release-package, offline-regression, local-browser-checkout.

The earlier V17/V18 incident report described missing `rain-coconut-*.png` references causing blue broken-image boxes, missing map styles, and pin moves that did not update the address/tracking preview. Rechecked the **current recovery branch** (not the old downloadable V18 archive).

- Current homepage has **31 locally referenced image tags**, **13 distinct first-party image paths**, **0 missing** in the GitHub tree. The 3 story-coconut PNG pieces exist. The 4 removed rain-coconut asset names are still absent from the repository but are not active `img src` values; legacy rain drops remain disabled.
- Verified source paths for Admin **Street / Satellite / Terrain** and **Open in Google Maps**, plus drag/click reverse-geocoding to update location label and coordinates and refresh tracking preview. Tested selected-pin Google Maps URL and reverse lookup against a fully mocked geocoder.
- Verified customer map includes a drag handler, click handler, address update through shared delivery state and **Street / Satellite** options in tracking. No Google Maps billing/key setup was introduced.
- Added and passed `scripts/v421-media-map-regression-qa.mjs` as an ongoing offline gate.
- Added and passed `scripts/checkout-location-sync-qa.mjs` to the Chromium job with **all nonlocal requests blocked** (Nominatim reverse-geocoding mocked). Verified GPS precision/address fields, manually selected pin address/coordinates/source, and geolocation-permission denial fallback.
- Existing Chromium checkout and Admin first-paint checks passed; the initial checkout test timeout was corrected through deterministic destination-first form setup.
- Static Netlify package and exactly five callable bundled Functions passed again.

**What is not proven:** physical touch/drag interactions on real iOS/Android, map tile-provider reachability in production, protected external asset loading, and **real authenticated Firebase Owner logout and refresh/fresh sign-in** on the undeployed corrected build. The current production site remains the restored deployment `6aabbbb1784e0d2d89174d0d`.

The verified conclusion is **recovery source + offline/local-browser tests ready for further development**. This is **not** permission to publish, and does not certify the reported incidents are repaired on the live rolled-back site.


## October 11 — Owner login HTML, mobile acceptance and Google Search Console baseline

**Current tested application commit:** `c7cf0603ed2b0afbda295dfddd66a1bd55463b01`  
**Green CI:** [run `38148989521`](https://github.com/ktiwari539/Nariyal-sutra/actions/runs/38148989521): **all three jobs success**, including local-browser-checkout, offline-regression, and release-package.

### Real login HTML — isolated Firebase browser acceptance

`scripts/v421-owner-login-browser-qa.mjs` loads the actual `admin-bcc-login.html` inline module on a synthetic production origin. Firebase ES modules are replaced with fully isolated mocks; every other network request is blocked. Six scenarios passed:

1. An existing authenticated Owner visiting `?signed_out=1` stays on sign-in, clears the mock session, and remains there after refresh.
2. Explicit manual Owner login succeeds after confirmed sign-out and reaches the Admin route.
3. A failed Firebase sign-out leaves login disabled and reports an error.
4. A normal valid persisted session may intentionally resume the Admin route (only without the explicit signed-out flag).
5. A verified Owner email with incorrect Firebase UID cannot enter Admin.
6. External `next=` URLs are rejected, keeping redirects on the same site.

**This is not a genuine production Firebase Owner login/logout test.** The exact old production failure is still subject to live Owner acceptance.

### Mobile layout QA

`scripts/v421-mobile-visual-qa.mjs` tested 10 pages at **390×844 and 430×932** (20 view combinations) in headless Chromium against localhost. All non-local network calls were blocked; the public Netlify theme endpoint was replaced with a safe local fixture.

- No page-wide horizontal overflow.
- No broken local `<img>` sources.
- No missing local resources beyond the locally mocked Function.
- No unexpected inaccessible/offscreen controls after properly excluding intentionally clipped carousel slides and the closed Admin sidebar.
- Fixed a genuine mobile Admin issue in `assets/css/admin-command-center-v52.css`: narrow top bar now wraps search into a second row and retains role/profile controls within the viewport.
- Screenshot files were captured only on the ephemeral CI runner; **they were not visually reviewed by a human and were not uploaded**. Real Safari/iOS/Android/manual visual acceptance remains open.

### Search Console current baseline (prior to release)

Verified via the connected Google Search Console property:
- Homepage: **Submitted and indexed**, mobile crawl recorded.
- `/coconut-water` and `/fresh-tender-coconut.html`: **Discovered — currently not indexed**.
- `/bulk-coconut-supply.html`, `/green-coconut.html`, and `/coconut-wholesale-export.html`: **Unknown to Google** in the last stored inspections.
- Submitted sitemap: `https://nariyal-sutra.netlify.app/sitemap.xml`, last submitted 2026-10-08, **zero parsing errors/warnings**. The sitemap reporting index counts should not be confused with the homepage's separate inspection verdict.
- Updated SEO pages, canonical declarations, crawl directives, and `llms.txt` have passed static acceptance but are **not live yet**.
- After approved deployment, run `node scripts/seo-go-live-acceptance.mjs --live`, check the hosted sitemap/robots and critical landing URLs, then resubmit the **new hosted sitemap** through Search Console and inspect/track the pages. Google indexing and third-party AI citation are not guaranteed or immediate.

### Final release dependencies

1. Explicitly authorized deployment to `nariyal-sutra` while preserving rollback deployment `6aabbbb1784e0d2d89174d0d`, with approval of any applicable Netlify credits. **No deployment happened during this QA.**
2. Secure genuine Firebase Owner login -> logout -> signed-out refresh -> new Admin tab remains blocked -> fresh Owner login. Restore rollback if any critical path fails.
3. Controlled live checkout/Firestore/email/Netlify Functions smoke checks without corrupting customer data; confirm SEO resources on the published build.
4. Physical mobile device and final image/interaction review at normal scale.

**Production remains HOLD until the real Owner authentication gate is satisfied.**
