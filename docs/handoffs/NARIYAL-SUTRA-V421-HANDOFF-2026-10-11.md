# Nariyal Sutra V42.1 — Complete continuation handoff
**Snapshot:** 11 October 2026, approximately 13:30 IST.
**Purpose:** Paste or link this document in a fresh ChatGPT chat, retain every critical decision, complete the release without unnecessary repeated tasks or Netlify credits.

## 0. Mandatory first action for the next assistant
Continue existing work. DO NOT restart or rebuild the site. Check GitHub recovery branch and Netlify published-deploy ID before changing anything. Read the Oct 11 Production Release Result and Firestore Correction Approval report if available in Project/Library files. Inspect current GitHub source for checkout, Firebase login and delivery logic. Finish focused tests, address any actual remaining blockers, and prepare a single controlled production release. This handoff documents status at the timestamp above; re-check mutable state.

## 1. Business mission and non-negotiable owner expectations
Nariyal Sutra is an India-based, globally ambitious coconut supplier, NOT merely a local store. User requires worldwide supply/destination-led home, office, event, hospitality, retail, wholesale and trade orders. Customer chooses destination anywhere in the world; offer direct checkout only when serviceability, pricing and regulatory/logistics feasibility are confirmed. Otherwise capture complete enquiry and provide custom freight/delivery quotation through WhatsApp/email. Do not claim universally guaranteed doorstep delivery, exact freight charges, customs clearance, shipping time or product availability until verified for the destination.

Products: fresh tender coconuts, coconut water served inside the tender coconut (not bottled), green round coconuts and bulk/commercial requirements. Source through farmers/supplier partners. Preserve Admin ability to change authoritative product pricing, visibility, quantities, inventory and content. Show correct current catalog pricing everywhere; avoid hard-coded historic default numbers.

Worldwide search and AI discoverability are major outcomes. Users should find the website for phrases like coconut water delivery, tender coconut supplier, nariyal pani, narial pani, नारियल पानी, worldwide coconut supply, coconut wholesale/export, and localized valid equivalents. Geographic/global strategy is primary; a local Google Business Profile is optional and not the foundation. Do not promise top ranking or automatic indexing/AI citations. Only make location and delivery claims that reflect actual serviceability. User is frustrated by ~30 Netlify credits spent without a durable production upgrade; minimize repeat tasks and deployments.

Business public contacts displayed on website: nariyalsutra@gmail.com, WhatsApp +91 9203831705, Telegram @krishna31. Do not confuse these with the user's unrelated contact numbers from other projects.

## 2. GitHub source of truth and release identity
Repository: https://github.com/ktiwari539/Nariyal-sutra
Original release PR: https://github.com/ktiwari539/Nariyal-sutra/pull/10
PR #10: OPEN, DRAFT, UNMERGED; head branch fix/v421-safe-production-auth-cutover-20261010, head SHA 3a810777c92f7f24da14af190aee1f50a63302d1. Base main SHA 9cdc75cdfa9c006205ff1eb804a94538baf183c9. No merge authorized.

Original approved release SHA: 3a810777c92f7f24da14af190aee1f50a63302d1. Existing GitHub CI 6/6 successful at run 38109961208: function-packaging-isolation, themes-pricing-water, media-targeted, auth-experience, firebase-contract, qa. The 6/6 status ONLY applies to original SHA, NOT to the newer recovery-branch changes. Do not repeat historical CI jobs gratuitously, but validate all changed files and needed new candidate CI.

NEW ISOLATED RECOVERY BRANCH: fix/v421-prod-logout-loop-20261011
https://github.com/ktiwari539/Nariyal-sutra/tree/fix/v421-prod-logout-loop-20261011
Latest code HEAD at handoff authoring (before the handoff-only documentation commit): bfde75342d18602e326f69eddb6644541a3f3ede. Because this handoff itself is being committed to that branch, branch HEAD will become the separate documentation commit. Verify latest HEAD via GitHub; distinguish documentation-only commits from implementation commits. There have been NO new Netlify deployments for these recovery-branch changes. Do not mistake branch code for live production.

Recovery-branch implementation commits, chronological:
- afe5059de3d2ffab8db5aca1d42d0c8326526dd5 — admin-bcc-login.html: explicit signed_out=1 state prevents automatic Owner redirect, re-clears Firebase Auth session, requires deliberate sign-in.
- c4dff897e5cf317ab3b8acfe21ecb17044623a81 — index.html: add Nariyal Pani and नारियल पानी to SEO title, description, hero/footer link.
- a126120190e5b0024e6b63d638791340b528693c — coconut-water.html: discoverability text and metadata.
- d2bec65985df338f2d9fa2d52f813c918b45c7c2 — llms.txt: clarify search names and delivery.
- 74bf019ae3072fc048361ee8d295244e347e6df3 — sitemap.xml: relevant updated dates.
- 35f4c37d58ae29036464cdb6a4e159cac39629f5 — assets/js/v421-production-bridge.js: check auth.currentUser after Firebase signOut before navigating.
- 9c669e2e37bf849a39604b0dddc2be0f0edaf862 — scripts/v421-logout-flow-qa.mjs: targeted simulated logout/login regression file.
- ecc8eb3ce239086333690265547770099c6ad82c — index.html: notify delivery summary when checkout quantity/product updated programmatically.
- f6c7c08880d464aa269eb4d9d2557bae0c75a2cd — scripts/v421-checkout-recap-qa.mjs: targeted checkout recap test.
- 160a4e23239916699ac36af3ba83a2ac2676e181 — index.html: worldwide supply and destination-led quote messaging, including relevant structured data contact.
- bfde75342d18602e326f69eddb6644541a3f3ede — ns-delivery.js: require destination country for Other before a quote/order request.

Changes above were successfully written and read back via GitHub connector. No merge, production deployment, Firebase update, credential/billing change or live customer/order edit occurred in this continuation.

## 3. What happened in the production release and rollback
Netlify production site: nariyal-sutra, ID 231fa72c-f358-4efe-b8e6-3ca41a0932b5.
URL: https://nariyal-sutra.netlify.app/
Netlify dashboard: https://app.netlify.com/projects/nariyal-sutra

Original Oct 11 deployment from release SHA 3a810777...: ID 6acb253a26fa2e71e86c4d2c; published 2026-10-11 05:58 UTC. Production storefront and catalog passed, five Netlify callable Functions were packaged and GET smoke-checked, and robots.txt/sitemap.xml/llms.txt passed at release candidate. Admin Owner login succeeded.

CRITICAL LIVE LOGOUT FAILURE: Clicking secure Owner Sign Out reached /admin-bcc-login.html?signed_out=1 momentarily, then returned to authenticated Owner dashboard. Opening protected Admin URL in a fresh tab also showed dashboard/sign-out. Exact cause of old persistent Firebase Auth state was NOT conclusively isolated. Rollback was appropriate given sensitive customer/admin access. Previous production Netlify deployment ID 6aabbbb1784e0d2d89174d0d was restored at 2026-10-11 06:19 UTC. This was verified again during the continuation as the current published ready deployment. The withdrawn candidate may still show 'ready' as an archived deploy: ONLY the currently published deployment ID determines the live release. Old site remains current.

During the attempted release, tender 5 pieces x ₹77 gave correct main subtotal ₹385, but separate 'Your request at a glance' initially remained 1 piece / ₹77; full checkout test stopped, no real order/payment/email/OTP upload was submitted. Recovery-branch fix dispatches DOM input events after chQ, setT, syncProductSelection, so delivery recap recalculates. The actual browser checkout after release remains UNVERIFIED.

## 4. V5 logout: why apparently fixed before but failed in production
On Oct 10, V5 commit 226d2d92ed5a1bbb387c758dca36083895667f75 added a regression assertion that My profile -> Sign out calls the secure Firebase-backed Sign Out handler. Source hashes confirmed that assets/js/v421-production-bridge.js, assets/js/admin-v37.js and admin-bcc-login.html were IDENTICAL at V5 and original 3a810777 release. The V5 work was not lost or reverted. However, the regression was chiefly a source/string contract assertion, not a full real persisted Firebase session logout/reload test.

Original login page onAuthStateChanged(auth,u=>{if(u)enter(u)}) auto-opens dashboard whenever Firebase reports authenticated user; it ignored the signed_out=1 explicit logout intent. In release, Firebase still reported a logged-in Owner on next page. Cause may be redirect timing/session persistence/context but is not proven. Recovery branch now (a) suppresses auto-reentry if signed_out=1, (b) attempts signOut again and verifies auth.currentUser null, (c) requires deliberate login, (d) checks logout bridge currentUser after signOut. Avoid claiming production issue definitively fixed until real session smoke.

Observed browser diagnostic 'Firebase configuration is missing' may have originated from embedded storefront frames; its causal relationship to logout remains unproven.

### Tests performed IN THIS CHAT
A four-scenario simulated authentication harness against the changed login module passed: persisted Owner on signed_out route no auto-redirect, success clears mock auth and session keys, sign-out failure blocks login/redirect, normal automatic sign-in works, normal anonymous visitor stays on login page. This is not a real Firebase/browser QA. Saved Node regression script scripts/v421-logout-flow-qa.mjs exists, but was NOT independently executed via Node in this chat due runtime limitations.

Checkout was exercised with mocked DOM/equivalent JS functions after quantity event update; 3 checks passed: tender qty 5->6: ₹462, bulk minimum qty 10: ₹720, switch to green qty 10: ₹700; primary and recap agreed. Saved Node test scripts/v421-checkout-recap-qa.mjs exists and was not run via Node executable in this chat. These price values are test fixtures, not confirmation of actual production pricing for the changed branch. Run both scripts with Node for real runner evidence, then targeted browser/regression and GitHub CI for changed SHA, not all unrelated suites automatically.

## 5. Firebase production policy and state
Owner specifically approved publishing proposed-v421-compatible-firestore.rules to Firebase project nariyal-sutra. This correction WAS PUBLISHED during the release attempt and REMAINS PUBLISHED despite the Netlify site rollback. The complete readback hash was SHA-256 a939055c808cc227db200347ee00f46380addac77a327612e4877fd1f6699885. The previous rules export and approved proposal/diff were saved for recovery, reportedly in Nariyal-Sutra-V421-Firestore-Proposal-and-Recovery-20261011.zip and accompanying proposal file. Do not unnecessarily republish rules, revert rules or introduce a strict cutover.

Corrected rules handle profile consent/identity fields, Admin catalog priceVisible/pricing and stock updates, checkout/order projection semantics, followups/followupEvents, waterWorkspaces/publicWaterFormats with scoped permissions. Owner binding and existing role security are preserved in intended design. Do not print credentials or assume a published rule match proves all Admin transactions.

Production catalog was unchanged before/after release and rollback:
- tender: ₹77, minQty 5, stock 150
- green: ₹70, minQty 1, stock 100
- bulk: ₹72, minQty 10, stock 300
These are an Oct 11 snapshot. Firestore /products is authoritative; never overwrite via defaults or testing. Production Firebase config IDs/public identifiers exist in repo; private credentials/secrets stay private.

Netlify rollback restores static HTML/JS and Functions but DOES NOT roll back Firebase rules, customer data or secrets.

## 6. Netlify deployment and recovery
Existing production site ID: 231fa72c-f358-4efe-b8e6-3ca41a0932b5. Existing live ID: 6aabbbb1784e0d2d89174d0d. Previous static ZIP: 338 files, SHA-256 e425a113be02dc3800cc69e85a74f7feec59d52de44e08aea483b3c8800af92e, not a database backup and excludes archived Functions. Exact original release recovery bundle SHA-256 ea3c94d811d8a7e05610e51b81a77db64bc198fc0b00a9a2c5323e36ed0e1214; package manifest SHA-256 8890d6ebb664ff84e5f0e13300eb9ac00e6df8643ff54c9868fae9b9c581e042.

Approved release Netlify configuration uses node scripts/build-netlify-site.mjs, publishes dist-site, Netlify Functions at netlify/functions, esbuild. Exactly 5 public callable Functions expected:
- admin-communication-send
- media-sign-upload
- order-delete-otp
- published-auth-theme
- send-email
Internal libraries app-check-verify, email-template-contract and release-boundary must remain internal, not additional callable functions. During released candidate, four write Functions returned 405 on unsupported GET; theme function returned 200. Authenticated provider operations remained unverified.

Netlify authentication for production CLI/API was resolved before previous deploy. Existing Netlify staging site (ID bbed224c-55cd-42bd-a7e9-ca631223308f) was earlier created empty and has no published staging app. Owner explicitly said do not make full staging acceptance prerequisite. Netlify Free/usage credits are scarce; approximately 30 spent per user. Do not perform another production deploy merely to test incomplete fixes or recommend Netlify support ticket. Repo branch changes do NOT themselves cost a production deployment credit.

Previous approved deployment authority applied to original tested SHA. For new changed branch, validate focused checks and obtain explicit approval for NEW final candidate and publication scope; DO NOT silently deploy, merge PR #10, force push, change Firebase rules, customer data, billing, App Check enforcement, credentials or provider settings. Keep quick rollback ready.

## 7. SEO, indexing and AI discovery: VERIFIED current state
Connected readable GSC URL property: https://nariyal-sutra.netlify.app/ . Separate sc-domain:nariyal-sutra.netlify.app property appeared NOT verified; do not rely on it.
Oct 11 GSC queries:
- Homepage URL Inspection: PASS, 'Submitted and indexed', Google canonical correct, robots allowed; last crawl Aug 24 2026.
- /coconut-water: 'Discovered - currently not indexed' on latest inspection, no last crawl.
- /fresh-tender-coconut.html previously discovered but not indexed.
- 2026-09-11 to 2026-10-08 Search Analytics: 30 homepage impressions, 8 homepage clicks, avg position approx 6.07 for observed impressions; query dimension returned only 'nariyal app' 1 impression, 0 clicks, position 23. Query dimensions may suppress low-volume terms, so DO NOT assume others proved ranking.
- GSC sitemap submitted Oct 8, last downloaded Oct 9, zero reported parse warnings/errors, summary '17 submitted, 0 indexed'; individual inspection nonetheless confirms homepage indexed, so treat sitemap per-content indexed number cautiously.
- Original release candidate sitemap.xml has 18 entries and /coconut-water canonical route, backed by _redirects 200 rewrite /coconut-water -> /coconut-water.html. Existing rolled-back site serves older files; original release llms.txt was available but now on old site returns 404.
- robots.txt in release allows Google/Bing and explicitly OAI-SearchBot, ChatGPT-User, Perplexity, Claude, etc. Permission is not ranking.
- New recovery branch changes homepage/coconut-water title and description to include nariyal pani/नारियल पानी, better internal link to /coconut-water, sitemap lastmod, llms.txt expressions. Only source staged, NOT LIVE or indexed yet.
- Existing source may have old price snippets in search cache; validate actual rendered live catalog, avoid exposing stale ₹55/₹45 as current or making false availability claims.
- Worldwide multilingual SEO NOT completed; adding Hindi terms to English text is NOT actual localized full pages/hreflang. Need useful language/country landing pages only where verifiable, not thin duplicate doorways. Need structured data with accurate Organization, Product, shipping policies/areaServed where supported, legitimate link/citation signals, GSC search-performance monitoring and country-specific reporting. Search/AI rankings cannot be guaranteed. Google Business Profile is not core of worldwide supplier strategy.

Do not resubmit candidate-only sitemap to GSC while the rolled-back site is active; after actual release check live sitemap and inspect URLs before resubmission/request indexing.

## 8. Worldwide customer flow — existing source already has groundwork
index.html has commercial Trade & Supply Desk with worldwide country/state/city selector, postal assist, detailed enquiry types, WhatsApp/email, export/trade routes, customer contact fields and validation. ns-delivery.js normal order form includes countries India, UAE, UK, USA, Australia, Canada, Singapore, Malaysia, Saudi Arabia, Qatar, Kuwait and Other (manual country). International selection triggers trade quote with no invented delivery prices. Country-based order route is already partially implemented; do not duplicate into a second form or rebuild.

New branch homepage hero and order section explicitly support global enquiries, chosen customer delivery location, customs/shipping review, with clear honest serviceability caveat. New ns-delivery.js guard stops submission when 'Other' selected but no country typed. Nonetheless REMAINING issue to investigate: normal order WhatsApp message from index.html placeOrder() currently emphasizes name, phone, address/city, product, quantity/price and delivery preference; does not clearly carry separate nsDelivery country/state/postal fields. Ensure destination country + state + postal code are transmitted consistently in WhatsApp payload and backend/order projection without violating Firestore allowlists; avoid adding persisted schema fields carelessly. Inspect ns-order-patch.js merger and NS_DELIVERY_EXTRA before changing.

Potential additional concern: actual business global fulfilment/logistics, taxes, regulations and shipping partnerships are NOT verified, so support quote-first for unconfirmed destinations and do not promise international door delivery at a fixed price. 'Near me' must involve user location/serviceability rather than claim a physical business in every city. Product pages and languages to be built after safe release, with owner prioritization.

## 9. Remaining work and exact priority order
P0, no additional production deployment:
1. Checkout GitHub recovery branch HEAD, do not revert/rebase V42.1. Inspect commit diff across base 3a810777 and recovery head, check no accidental replacement of product/pricing/security.
2. Run SAVED focused Node tests (node scripts/v421-logout-flow-qa.mjs; node scripts/v421-checkout-recap-qa.mjs) and fix any failures. They were saved but not truly executed under Node during current chat. Do browser runtime smoke only on affected paths, including actual dynamic DOM order recap and auth session persistence. Inspect logs for auth errors and embedded frames.
3. Preserve original 6/6 CI evidence; run only changed candidate CI/suites when new SHA needs gates. Do not rerun unrelated tests without direct dependency.
4. Verify 'Other' country validation and add explicit location to WhatsApp/quote path if missing; preserve Firestore schema and sanitization.
5. Verify storefront authoritative Firestore price/stock, SEO static assets and HTML syntax and Netlify five Function packages using offline/read-only checks.
6. Check whether complete logout fix still fails under a REAL authenticated Firebase session. Preview hostname purposely blocks production Firebase and must not be used to claim a passing real production Auth test. Use permitted narrowly scoped real-auth verification. No change to production Auth settings/credentials/rules without separate consent.

P0, once focused gates pass:
7. Commit/checkpoint all final work, create/verify Git recovery bundle, record final candidate SHA and CI results.
8. Ask owner to approve specific new final release SHA/site and one controlled Netlify production deploy (previous approval was for original 3a810777). Preserve live old deploy as rollback.
9. After deploy, verify Owner sign-in -> logout -> remains signed out after login URL refresh AND direct Admin route and fresh tab; Admin role/guard; Storefront price/availability; quantity and delivery recap; international country/quotation; nonmutating checkout readiness; public SEO pages, sitemap, robots, llms; five callable functions. Do not send real customer emails/place orders/modify real customer records without scoped approval. If a critical auth/payment/data issue, immediately restore prior published deploy; remember Firebase rules remain separately active.
10. Report exact new deployment ID, canonical URL, actual results and genuine blockers only.

P1 immediately after safe release:
11. Inspect / and /coconut-water Search Console; request indexing and resubmit live sitemap only after validating published URLs/canonicals. Monitor Google impressions/clicks per destination country and conversion from website leads.
12. Design true global search pages/categories and language plan based on actual country demand. Add country/language URLs and hreflang only with substantive translated content; ensure product FAQ/organization structured data truthful; avoid keyword stuffing and fake universal availability.
13. Expand quote engine for international customer address, routing, shipping partner/carrier quote integration, freight/tax/customs and lead management after verifying providers; no billing/service changes without consent.

## 10. Security/preservation rules
Preserve production customer orders, sign-in/role access, owner logout, pricing/stock, customer/contact data, media, Admin operations, payment settings and SEO/indexing files. No force push, PR #10 merge, Firebase rule rollback/change, secret publication, billing upgrade, Storage/App Check enforcement, EmailJS/Cloudinary credential change or production synthetic write unless expressly approved. Production Firestore corrected policy already active; do not confuse Netlify rollback with Firestore rollback. For each completed subsystem keep verified Git checkpoint + recovery bundle; never leave work only in a volatile local workspace.

## 11. Existing reports / recovery evidence
Project file: Continue V421 Project.txt — historical V17/V18 animation and delivery map improvements, prior QA and browser preview. Those older local ZIP paths may not be accessible in a new workspace and are NOT proof of current released source.
- Nariyal-Sutra-V421-Production-Release-Result-20261011.md — authoritative attempted deploy/rollback and smoke results.
- Nariyal-Sutra-V421-Production-Evidence-and-Recovery-20261011.zip — Work-reported saved archive; locate in user Library/Work before assuming downloadable.
- restored-storefront-proof.jpg — saved restored screenshot.
- Nariyal-Sutra-V421-Firestore-Correction-Approval-20261011.md — exact rules change/hashes.
- proposed-v421-compatible-firestore.rules — approved active rules (hash above).
- Nariyal-Sutra-V421-Firestore-Proposal-and-Recovery-20261011.zip — Work-reported backup.
- Existing original candidate Git bundle and Netlify archive hashes noted above.
If missing, search user Library or ask for the precise artifact; never invent paths. GitHub current branch plus Netlify deploy IDs are the primary current state.

## 12. Owner communication and task cost
User does not want more broad ChatGPT Work tasks or 'did we do this?' loops. State each change's evidence exactly and differentiate source saved, mock test passed, CI passed, deployed live, live verified and indexed; do not call untested tasks 'done'. Work quickly, use existing GitHub connector directly where possible, preserve credits, and stop at true approval boundaries. Provide small evidence-driven updates. Avoid recommending contact Netlify billing support; owner explicitly declined because bug is internal.

## 13. Copy/paste starter message for new ChatGPT conversation
Continue Nariyal Sutra V42.1 from THIS full handoff in the repository; do not restart. Check the exact recovery branch and the current active Netlify deployment. The earlier V42.1 deploy was rolled back over a real Owner logout loop; the approved Firestore correction remains active. Preserve all customer data/prices, existing release CI evidence, rollback and PR #10. Immediately validate/finalize the existing auth-loop fix, checkout recap fix, and worldwide destination/quote path on recovery branch. Run only focused tests, then request a final-SHA approval for ONE production deploy when safe. The worldwide home/business coconut delivery and global Google/AI search discoverability goals are non-negotiable, but delivery cost/coverage must be honest. Do not consume credits on repeated unrelated CI/staging/Work tasks. Report actual progress with SHAs and blockers.
