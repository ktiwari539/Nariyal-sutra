# Pricing + checkout/delivery recovery

Local completion on top of the preserved auth checkpoint.

## Implemented
- Customer live catalog remains the only public price authority; unavailable pricing renders as unavailable rather than an old numeric fallback.
- Admin production catalog projection uses each product's own price field: TENDER/GREEN use `retail`; BULK uses `bulk`. Cross-fallback between retail and bulk is removed.
- Active public products with a missing/invalid own price are rejected before the production catalog batch write.
- Checkout `getCurrentTotal()` returns `null` while current price is unavailable instead of turning `null` into a zero total.
- Delivery recap refreshes on quantity input/change, product selection, and authoritative `ns:catalog` updates. The root `ns-delivery.js` loaded by the storefront and the legacy asset copy are aligned.

## Local validation
- `node scripts/price-sync-qa.mjs`: 22 assertions passed.
- Isolated Admin catalog projection unit: 3 assertions passed (retail cannot fall back to bulk; GREEN uses retail; BULK uses bulk).
- `node --check` passed for the modified production bridge and both delivery scripts.
- `git diff --check` passed.

## Environment limitation
This execution environment blocks browser navigation to local/file URLs, so Playwright end-to-end browser execution could not be rerun here. The repository's browser QA scripts remain available for the later full CI/device pass. No production Firebase, push, merge, or deployment was performed.
