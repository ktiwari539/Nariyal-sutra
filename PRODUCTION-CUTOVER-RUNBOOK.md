# Nariyal Sutra production cutover runbook

This runbook is intentionally staged. No production step is executed until the Owner explicitly approves the activation window.

## Release invariants

- Final application SHA must have a completely green Cinematic rebuild QA workflow.
- `firestore.rules` is the final strict ruleset.
- `firestore.cutover.rules` is generated, temporary compatibility only and must not remain deployed after the new storefront smoke passes.
- App Check custom-backend enforcement stays OFF until the deployed browser obtains and sends valid tokens successfully.
- Storefront remains available throughout the rules/site cutover. Admin mutating actions are paused during the short compatibility window.

## Preflight

1. Record the final SHA, current Netlify production deploy ID and current Firebase rules release/time.
2. Confirm required Netlify production variables exist without printing secret values.
3. Confirm Cloudinary credential rotation and EmailJS/OTP configuration.
4. Confirm Firebase owner identity and any required active `adminRoles/{uid}` records.
5. Confirm a rollback copy/reference for the currently deployed Firestore and Storage rules.
6. Run the complete local/CI test set, including custom-backend App Check QA and Firestore cutover compatibility QA.

## Zero-downtime cutover

1. Pause Admin write operations. Storefront stays live.
2. Generate the temporary compatibility rules:
   `node scripts/build-firestore-cutover-rules.mjs`
3. Publish only the generated Firestore compatibility rules using `firebase.cutover.json`.
   - Existing September storefront checkout remains accepted.
   - New atomic checkout is also accepted.
   - The compatibility allowance for the legacy public tracking OTP exists only for this short window.
4. Verify the currently-live storefront can still load catalog/tracking and submit only the approved controlled smoke request if production-data testing has been separately authorized.
5. Deploy the approved final Netlify release.
6. Smoke the new storefront/Admin without changing unrelated live data. Validate checkout projection, exact-token tracking, Customer 360, email function reachability and role gating using approved test records only.
7. Publish strict final `firestore.rules` and `storage.rules` with the normal `firebase.json` configuration.
8. Re-run the same smoke checks. Confirm new tracking documents contain no `deliveryOTP` and projections are atomic.
9. Resume Admin writes.

## App Check activation

App Check is a separate staged gate after the new release is stable:

1. Register the web app with reCAPTCHA Enterprise in Firebase App Check; enforcement remains OFF.
2. Put the public site key into the approved client configuration and deploy that exact SHA.
3. Confirm browser Firebase calls obtain App Check tokens.
4. Confirm custom Netlify requests carry `X-Firebase-AppCheck` and the backend verifier accepts valid tokens/rejects invalid tokens.
5. Observe Firebase App Check metrics before enforcement.
6. Set `NS_APP_CHECK_REQUIRED=true` for the custom Netlify backend only after valid production tokens are proven.
7. Smoke Admin Communication, media signing, Owner deletion OTP and transactional email.
8. Enable Firebase App Check enforcement service-by-service only after those checks pass.

## Rollback order

Before strict rules are published: rollback the Netlify deploy if needed; the compatibility rules support both releases.

After strict rules are published: if the old Netlify release must be restored, first restore the previously recorded compatible/legacy Firestore rules, then rollback Netlify. Never rollback the website to the September client while leaving strict new-only rules active.

If App Check causes failures: disable custom backend requirement / Firebase enforcement first, without changing application data, then investigate token/provider configuration.

## Separate data-change approval

Deletion/reconciliation of pre-existing orphan `publicTracking` or customer projection records is not part of the deployment cutover and requires separate production-data approval.
