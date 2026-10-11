# Nariyal Sutra V42.1 – focused production recovery

Status: **prepared on isolated GitHub branch, NOT deployed** (11 October 2026).
This note is a handoff to avoid repeating completed work or spending Netlify credits on premature deployments.

## Deployment and data state
- Production URL: https://nariyal-sutra.netlify.app/
- Netlify site ID: `231fa72c-f358-4efe-b8e6-3ca41a0932b5`.
- Active restored deploy: `6aabbbb1784e0d2d89174d0d` (verified ready).
- Rolled-back candidate: `6acb253a26fa2e71e86c4d2c`.
- Source baseline: `3a810777c92f7f24da14af190aee1f50a63302d1`; historical CI 6/6 passed **for baseline only**.
- Approved compatible Firestore rules remain published, with prior policy export preserved. Avoid publishing or changing rules again.
- Existing catalog observed unchanged: tender ₹77, green ₹70, bulk ₹72. Do not overwrite product prices.
- Draft PR #10 remains unmerged. Do not merge or deploy from this recovery branch without explicit production cutover safety review.

## Actual live failure evidence
- After an authenticated Owner session, the secure logout briefly reached `/admin-bcc-login.html?signed_out=1`, then re-entered Owner dashboard automatically.
- A fresh tab also displayed the protected dashboard. This correctly triggered rollback.
- The V5 profile button delegated to Firebase sign-out, and that code was preserved into V42.1. The missed gap was the post-sign-out login-page re-entry/session lifecycle, not a reverted V5 patch.
- Original full root cause (why Firebase remained authenticated) was not established by live browser evidence.

## Recovery branch changes
Branch: `fix/v421-prod-logout-loop-20261011`.
- Login page: treat `signed_out=1` as an explicit exit. Suppress auto-entry, attempt Firebase sign-out, verify cleared `auth.currentUser`, clear local Admin session keys, and require explicit manual sign-in again.
- Production bridge: verify Firebase `auth.currentUser` is cleared before redirecting; if it is still authenticated, keep an error overlay and refuse to claim success.
- Checkout: dispatch an `input` notification after plus/minus, bulk-mode, and product selection changes so delivery recap and primary subtotal remain consistent.
- Delivery: require typed country on the Other route and carry international destination/quote requirements into WhatsApp order messages.
- Worldwide enquiry: use free-text country/state/city fields and country suggestions (no dead, unpopulated dependent selects). Existing quote workflow already stores country, destination, quantity and contact details. It remains a *request*, not a promise of worldwide delivery.
- Discoverability: homepage and coconut-water English/Hindi search terminology, explicit international destination-quote CTA, contact-point availability, revised sitemap timestamps and llms description.
- Targeted offline regression scripts:
  - `node scripts/v421-logout-flow-qa.mjs`
  - `node scripts/v421-checkout-recap-qa.mjs`

## Verification and outstanding gates
- Four targeted Firebase *simulation* cases exercised independently: signed_out with persisted Owner, failed sign-out, existing Owner normal auto-entry, unauthenticated visitor. **4/4 passed with mocks.** This is not real Firebase production acceptance.
- Checkout three targeted flows independently exercised with the shipping JavaScript: tender 5→6, switch to bulk min 10, switch to green. Primary and secondary totals matched. **3/3 passed with DOM mocks.**
- Changed auth, bridge, delivery, and checkout source was parsed/syntax-checked without real remote provider calls.
- Node regression scripts were saved to GitHub but still need execution on a Node runner.
- No full CI has been run on this changed branch, and no real Firebase browser/logout acceptance has been run on it.
- Post-rollback customer SEO visibility: Search Console homepage indexed; 30 impressions and 8 clicks in the Sept 11–Oct 8 period; `/coconut-water` discovered but not indexed. Revised content is NOT LIVE. Do not submit its sitemap as though published.

## Shortest safe next steps (not broad Work/staging)
1. Run only the two targeted Node scripts and targeted build/syntax/static-contract checks on this branch. Re-run affected checks if code changes.
2. Establish a genuine persisted-session browser test for the new login/logout lifecycle on the canonical production origin **without publishing a risky untested site**. If not technically possible, explicitly report this gate rather than substituting mocks or a noncanonical preview that disables Firebase.
3. Verify checkout quantity parity and international enquiry destination in a real browser without real orders/email/uploads. Include mobile layout.
4. After exact patched SHA and recovery bundle are recorded and accepted, obtain explicit approval for **one controlled Netlify production cutover**. Confirm previous deploy rollback availability, live Firebase config compatibility, Function packages, prices, protected Admin access, and sitemap.
5. Stop or roll back immediately on logout/session leakage, checkout mismatch, or pricing/Function failure. Do not change production Firestore rules, billing, customer records or credentials.
6. After a successful live release, submit/refresh public sitemap in Search Console, inspect the homepage/product landing pages and monitor impressions by country/query. Do not claim AI or Google top placement is guaranteed.

No production credentials, customer data, or secrets are stored here.
