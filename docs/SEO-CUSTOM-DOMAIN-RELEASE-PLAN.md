# Nariyal Sutra — Safe Main Merge and Future Custom-Domain SEO Migration

Status: **release preparation only**. This document does **not** approve a production deployment or DNS change.

## Authoritative URLs today

- Public origin and canonical host: `https://nariyal-sutra.netlify.app`.
- Search Console URL-prefix property: `https://nariyal-sutra.netlify.app/`.
- Current sitemap: `https://nariyal-sutra.netlify.app/sitemap.xml`. Submitted to Search Console on 2026-10-08; Google processing must be monitored.
- Custom domain: **not chosen or verified yet**. Never change page canonical URLs, sitemap hosts, Open Graph URLs, structured-data IDs/URLs, or robots.txt to an unconfigured domain.
- Keep Google Search Console access to the current URL-prefix property throughout any later migration.

## Gate A — GitHub `main` synchronization, WITHOUT website deployment

1. Preserve original `main` HEAD `4b55587a8c7f67b1b6a94b179b0485a9ec3fa821` in `backup/main-pre-seo-release-20261008` and verify the ref.
2. **Before merging or pushing to `main`:** Netlify site owner must explicitly disable continuous deployment / production auto-builds for the Nariyal Sutra site and show the disabled state. Netlify's project read API does not expose this setting; do not infer safety from a ready published deploy, paused UI, or a local `netlify.toml` comment. Also turn off/verify any external GitHub-to-Netlify deployment workflow.
3. Stage changes in a dedicated integration branch (not `main`). Do not force-push, overwrite the feature branch, or merge PR #6 (which targets a different validation base).
4. Run full integrated QA on a PR targeting `main`; include SEO, auth, Firebase security, pricing, Admin, media, responsive and visual-evidence review.
5. Preserve the successful CI recovery bundle with its content digest and checkpoint SHA before merge; verify branch HEAD still matches the approved SHA.
6. Merge through reviewed GitHub PR (normal merge, no squash/rebase); verify `main` contains the approved release commit. Do not merge if Git-triggered Netlify production activity has not been proven disabled.
7. Leave production site untouched. Confirm Netlify published deploy ID remains unchanged after the merge.

## Gate B — Production release package and credit control (separate approval)

- Current `netlify.toml` declares `publish = "."`. This can publish `docs/`, QA files, large recordings and other repository content. **This is a blocker for direct GitHub production deployment.**
- Create a vetted staged publish directory from an **allowlist** of required public HTML, CSS, JS, images, robots.txt, sitemap.xml, public web manifest and Netlify headers/redirects.
- Exclude `.github/`, `docs/`, `scripts/`, `qa-artifacts/`, local/temporary files, test screenshots and videos, build/recovery bundles, `.env*`, secrets and source-only reports.
- Preserve all seven required Netlify Functions via the correct `functions` setting, and test their route mappings and runtime module imports.
- Measure staged bytes and largest files; reject unexpected videos, oversized assets, broken relative paths, and missing required assets. Check responsive image delivery, compression, caching and request volume.
- Perform a controlled preview and hosted regression before the *separately approved* single production publication. Preview traffic still consumes bandwidth/request credits.
- After approval, publish once, monitor Netlify credits, and record rollback deploy ID.

## Gate C — Custom-domain migration, LATER ONLY

**Prerequisite:** Owner selects exact primary HTTPS hostname (apex vs. `www`), controls DNS, and verifies Netlify DNS, SSL certificate and every public route on the new hostname.

1. Provision and verify the new hostname *without switching public canonical metadata*.
2. Test complete HTML routes, media, function endpoints, payment/checkout, login, Admin auth, allowed origins/CSP, SEO headers and caching on the new hostname.
3. In one reviewed release, update canonical tags, `og:url`/`og:image`, Twitter image URLs, JSON-LD `@id`/URL/logo, internal absolute links, `sitemap.xml`, `robots.txt`, `llms.txt`, and SEO QA origin constants.
4. Configure permanent **path-preserving 301 redirects** from the old Netlify hostname and from noncanonical `www`/apex alternatives to the chosen primary domain. Do not create loops or interrupt Netlify preview or backend endpoints; test redirects from both domains.
5. Verify the new Search Console domain/URL-prefix property, submit the new sitemap, inspect homepage + key product pages, and retain the old property for migration tracking.
6. Monitor Google's selected canonical, coverage, impressions, 404s and redirect behavior for several weeks. Canonical and sitemap changes should happen **only when the new domain is publicly reachable and production-approved**.

## SEO acceptance after final production approval

- 200 HTML responses and expected canonical URLs for all published sitemap pages.
- Unique titles, meta descriptions, H1, valid JSON-LD, Open Graph and image alt text.
- Sitemap and robots files reachable on the live canonical host, correct MIME type, zero restricted/Admin/QA URLs.
- Admin/login/tracking/QA: `noindex` in HTML and/or HTTP header as configured; never expose private data through index prevention alone.
- Search Console sitemap fetch confirms no errors; inspect key product pages. A sitemap submission **does not guarantee indexing**.
- No fake structured-data prices; runtime catalog/pricing remains authoritative.
- Evidence: CI link, tested SHA, screenshots, packaged-size manifest, sitemap submission, GSC URL Inspection results, Netlify deployment IDs and credit usage.

**Owner approval boundary:** A successful Git merge is **not** approval to deploy to Netlify, change DNS, redirect domains or trigger a customer-visible release.
