# Nariyal Sutra Storefront Themes — Implementation Report

## Scope and baseline

- Development branch: `feature/storefront-themes`
- Starting remote SHA: `163ab1c8942e58ef87ee5bd59ab43f247eb41918`
- Starting tree SHA: `71f1b31ec2b7d39c67a8826c694abfc7e64908b4`
- Base branch: `improvement/pre-release-optimization`
- `main` remained at the approved `4b55587a8c7f67b1b6a94b179b0485a9ec3fa821` baseline.

This phase implements Themes only. The proposed 200 ml, 300 ml and 500 ml products were not implemented.

## Architecture

The implementation keeps one storefront and uses a controlled theme identifier. No arbitrary CSS is accepted or stored by Admin.

- Theme identifiers: `nariyal-signature`, `fresh-grove`, `coastal-premium`
- Token and component ownership: `assets/css/storefront-themes.css`
- Storefront resolver/fallback: `assets/js/storefront-theme-runtime.js`
- Admin workflow: `assets/js/admin-themes.js` and `assets/css/admin-themes.css`
- State: `themeConfig` inside the existing `NSV421Store` public configuration
- Production persistence: existing authenticated `v421-production-bridge.js` public-config path

`themeConfig` stores the published theme, optional draft, immediately previous valid theme, publish timestamp and publishing identity. Invalid identifiers normalize to `nariyal-signature`.

## Workflow and safety

Admin → Themes supports:

1. Selecting any theme without changing customer state.
2. Desktop and mobile previews through an isolated `themePreview` URL parameter.
3. Saving a draft separately from the published theme.
4. Publishing only after a confirmation naming the current theme, replacement and rollback retention.
5. Restoring the immediately previous valid theme as one complete configuration.
6. Permanent fallback to Nariyal Signature.

Admin styling itself is not themed. Products, prices, inventory, checkout, orders, delivery, maps, customer records, media, roles, authentication, communications, analytics and cinematic behavior are not changed.

## Files

Added:

- `THEMES-IMPLEMENTATION-REPORT.md`
- `assets/css/admin-themes.css`
- `assets/css/storefront-themes.css`
- `assets/js/admin-themes.js`
- `assets/js/storefront-theme-runtime.js`
- `scripts/themes-qa.mjs`

Modified:

- `.github/workflows/cinematic-rebuild-qa.yml`
- `admin-preview.html`
- `assets/js/v421-local-store.js`
- `assets/js/v421-production-bridge.js`

Deleted: none.

## QA results

- Storefront Themes QA: PASS — 45 assertions covering all 26 required theme contracts.
- Pre-deploy/static audit: PASS — 208 text files and 134 JavaScript files.
- Pre-release optimization, public copy and content integrity: PASS.
- Production Firebase, App Check, Netlify Dev, role and follow-up contracts: PASS.
- Firestore strict rules emulator: PASS.
- Firestore zero-downtime cutover emulator: PASS.
- Gold-master and professional cinematic QA: PASS on desktop and mobile.
- Release candidate, desktop/tablet/mobile responsive QA: PASS.
- Checkout delivery and location synchronization QA: PASS.
- Admin production readiness, end-to-end interaction, Owner controls, order layout and OTP QA: PASS.
- Communication and review QA: PASS with zero external mutations.
- Order lifecycle, follow-up, dashboard and People-profile QA: PASS.
- Media organizer, Media Library, media quality, placement and visual-scroll QA: PASS.

Evidence is generated under `qa-artifacts/themes/` by `node scripts/themes-qa.mjs`. It includes nine native-resolution storefront screenshots, Admin Themes landing/preview screenshots and a machine-readable results file.

## Explicit non-actions

- Production Firebase was untouched.
- Production Netlify was untouched; no deploy was run.
- `main` was untouched and no merge was performed.
- No production data, credentials, tokens, real communications, orders or enquiries were created or changed.
- The 200/300/500 ml product work was untouched.
- Existing desktop cinematic CLS behavior was intentionally not changed.
