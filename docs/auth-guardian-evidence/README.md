# Nariyal Guardian — local review candidate

Direct parent preserved: `07a19723897a1ab893b14a6e24bf2263aee8f34d`.
Branch: `feature/storefront-themes`. The new commit/tree identifiers are provided in the delivery message and can be read with `git show --format=fuller HEAD` and `git rev-parse HEAD^{tree}`.

## Review evidence

Open [the review gallery](index.html) for all four Customer and Admin themes, desktop/mobile, six close-up states, reduced motion and audio controls.

- [Customer motion](customer-motion.mp4) / [Admin motion](admin-motion.mp4): 1840 × 1280, enlarged 150% inspection zoom; idle, gaze/typing, close/turn/cover, Show/one-eye peek, Hide, error, success, Create/Sign in or Admin reset/back, Sound On/Off.
- 16 full-page theme/context/viewport screenshots at 2× pixel density, 48 large state close-ups, and 2 reduced-motion images.
- [Privacy rustle](privacy.wav), [peek tick](peek.wav), [signature](signature.wav): actual production procedural engine rendered with OfflineAudioContext. Durations 340 / 85 / 640 ms; no external sound assets. Files include a silent tail to one second. Admin gain is 35%.
- [Changed files](changed-files.txt), [individual results](results.json), [full validation summary](validation-summary.json), [asset sizes](asset-sizes.json), [security boundary](security-boundary.json).

The closed-eye PNGs pause the actual CSS timeline at 260 ms, before the leaf starts at 280 ms. Success-expression close-ups and the labelled video segment hold the shell for inspection. The videos separately perform actual successful local-fixture login; navigation/account rendering remains immediate. These held expressions are not presented as real authentication delays. Browser recordings are silent; listen to the WAVs separately.

## Implementation

Four distinct photographic compositions and frame/layout treatments retain the shared brand lockup, adapters and diagonal shell transition. Texture-blended almond lids/iris are almost absent at idle and emerge on email focus. The primary turns 3.5–4 degrees for privacy; the leaf follows after the eyes close, with a separate shadow and depth transform. Show exposes one eye; Hide immediately closes the eye and returns the leaf. Secondary elements only have minimal ambient depth motion. Admin uses one primary coconut with approximately 35% expression/turn/audio intensity.

No animation reads input values or lengths. Only focus, input type and allowlisted UI-state enums enter the presentation layer. Original Firebase adapters, forms, Admin inline security scripts, role gates, published-theme resolver, rules and deployment configuration are byte-unchanged from the parent. The duplicate privacy rustle on focus moving from password to Show was fixed by keeping focus within the same password region.

Sound is OFF by default, session-local and explicitly enabled. Off zeros/cancels envelopes, stops sources, suspends audio and invalidates pending resume callbacks. Email typing, hover, blink, auth-state transitions and errors remain silent. No music, autoplay, storage or streaming.

## Local validation

| Check | Result |
|---|---:|
| Guardian | 129 passed |
| Closed-eye frames | 8 passed |
| Auth flows | 40 passed |
| Interactive | 123 passed |
| Responsive composition | 40 passed |
| Theme/security boundary | 15 passed |
| Total counted assertions | **355 passed** |

Production Firebase integration and Admin role source-contract suites also pass. Source audit passes, including 153 JavaScript syntax checks and protected hashes. GitHub Actions was not triggered; the workflow now runs Guardian evidence in place of the previous Grove evidence when a future push is approved.

Accessibility checks cover labels/live errors, keyboard focus and customer dialog containment, Show/Hide semantics, decorative `aria-hidden` artwork with no extra focus stops, computed contrast and reduced-motion form/reset operation. Both contexts disable all CSS animation/transitions and moving gaze under reduced motion; privacy/peek remain instant static states. This is not a formal accessibility certification or screen-reader device test.

## Performance

Active image assets: **2,378,728 → 1,502,382 bytes (36.84% smaller)**, about 2.27 → 1.43 MiB. Five optimized WebPs replace the obsolete 1200px versions. Maximum resolution is 960px, with alpha retained. Only the active theme pair + one shared leaf are fetched for Customer (3 unique images), and primary + leaf for Admin (2). The shadow reuses the same cached leaf.

Cold art transfer is 680,508–1,000,040 bytes for Customer and 423,656–600,576 for Admin, compared with loading the whole previous set. No animation library or video loop is added to the application. The videos here are review artifacts only.

Auth-source CLS is **0 in all 16 theme/context/viewport cases**; delayed-artwork CLS is also **0**. The broader whole-document fallback test measured up to **0.0023912** during slow theme resolution; this includes unrelated storefront loading and is not claimed to be zero. No horizontal overflow or product/hero-text collisions in the 40 desktop/tablet/mobile/narrow/landscape composition checks. No production field-performance claims.

## Review notes and remaining gaps

The full desktop/mobile theme matrix, large eye/privacy/peek images and frames from both enlarged videos were visually inspected. Adjustments during review softened eye fills into the photographic texture, cleared the peek, separated the closed-eye beat from the leaf movement, and cleared the Fresh Admin mobile leaf from the heading. The art direction remains a human approval decision.

- Chromium desktop/mobile emulation only; actual Safari/iOS/Android and third-party password-manager devices remain to be checked.
- Audio is rendered and envelope/peak/cancellation tested; subjective listening on real speakers/headphones remains human review.
- Fixture-only authentication, with all external traffic intercepted. No live Firebase sign-in/reset/data writes were performed; Firestore emulator suites were not rerun because rules/adapters are unchanged.
- No remote CI run or production validation for this local child. No push, merge, Netlify deploy, or production Firebase/data change was performed. `main` was not checked out or modified.

## Reproduce locally

Use the repository's existing Playwright dependency, install its Chromium runtime, then serve this checkout on `127.0.0.1:4173`. Run:

```sh
node scripts/auth-experience-qa.mjs
node scripts/auth-theme-contract-qa.mjs
node scripts/auth-interactive-qa.mjs
node scripts/auth-composition-qa.mjs
node scripts/auth-guardian-qa.mjs
node scripts/auth-guardian-qa.mjs --closed-only
node scripts/production-firebase-contract-qa.mjs
node scripts/admin-role-contract-qa.mjs
node scripts/predeploy-audit.mjs
```

Browser scripts intercept Firebase and all external requests. Do not use real credentials. Scripts write generated evidence under `qa-artifacts`; this reviewed snapshot is under `docs/auth-guardian-evidence`.

**Stopped for human visual review. No push/deploy approval is implied.**
