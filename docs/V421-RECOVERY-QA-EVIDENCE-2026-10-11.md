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
