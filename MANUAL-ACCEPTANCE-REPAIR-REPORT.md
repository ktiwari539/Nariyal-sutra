# Manual Acceptance Repair Report

Checkpoint scope: local-only acceptance repair after manual review. No production or Netlify deployment is part of this change.

## Confirmed defects repaired

1. Media Library filter controls now use stable delegated click handling, expose accessible active state, and keep Website-ready distinct from People media.
2. People-page hero media uses full-photo-safe framing for selected People photography, with a same-image soft background fill instead of cutting the subject.
3. Coconut Water Formats preview is scaled into the available Admin content width instead of forcing a 1440px horizontal canvas.
4. Coconut Water Formats editor uses contained responsive fields and card layouts across desktop, tablet and mobile widths.
5. Core pricing now uses one canonical product price per SKU. Local Admin state drives the local storefront and checkout; production continues to persist/read the same canonical price through Firestore. Private Coconut Water Formats remain separate from the three core coconut SKUs.

## Additional issues found during the detailed pass

- Removed the misleading second-price presentation on the Fresh Tender product page: the Bulk Pack rate is identified as a separate SKU/offer.
- Removed hard-coded savings wording that could become false after an Admin price update.
- Removed legacy detail-page price markers that represented retail/bulk as two fields on one product.
- Updated theme regression checks to track canonical product price instead of legacy compatibility fields.
- Added defensive normalization so packaged-water draft records cannot leak into the core coconut catalogue.
- Hardened stale-browser-state recovery so the core catalogue always resolves to exactly TENDER, GREEN and BULK; arbitrary local draft SKUs can no longer re-create a 5-SKU pricing screen.
- Enforced the Admin “Show price publicly” control through the local and Firestore catalogue contracts; a hidden price is removed from storefront display and direct checkout until re-enabled.
- Hardened Firestore rules so `priceVisible` is an allowed validated product field and guest order creation is rejected server-side while a product price is hidden.
- Removed the core-catalogue “Add draft SKU” action because production currently supports exactly three authoritative coconut SKUs; future packaged-water products remain in their isolated workspace.
- Verified root HTML IDs are unique and all 28 Admin navigation targets resolve to real Admin views.

## Regression gates

Static/local gates include predeploy audit, price authority QA, water-format static QA, public-copy QA, pre-release optimization QA, Admin operability QA and SEO QA.

A Playwright manual-acceptance regression covers the reported defects plus page-level overflow across high-risk Admin views at desktop, tablet and mobile widths. It must pass before the recovery bundle is created.
