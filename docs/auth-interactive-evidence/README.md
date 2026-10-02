# Nariyal Sutra — interactive auth review

Local enhancement of the approved checkpoint. **Not pushed, merged, deployed or published.**

- Parent commit: `edc27e9b3764f1e112a5565d95097a44447923dc`
- Parent tree: `e3f9d88bbabe32488aaf43a7f661905d6579c606`
- Branch: `feature/storefront-themes`
- Open `index.html` for the review gallery. `changed-files.txt` lists the child commit's changes.

## Implementation

The existing shared auth shell now includes a textured SVG Nariyal, inset eyes, an occasional blink, focus-led gaze, closed-eye privacy pose, a restrained Show-password peek and a small success light cue. The object is decorative, has no focus stop, and never overlaps form controls. Email focus selects a fixed gaze direction; animation does not read email content, password content, lengths, selection positions or credential analytics.

One form/security implementation serves four visual compositions:

| Theme | Composition |
| --- | --- |
| Nariyal Signature | Forest split with a large, partially lit husk below the copy |
| Fresh Grove | Airy botanical arch; young green coconut above the copy, left of it on mobile |
| Coastal Premium | Off-axis object in an architectural aperture; low-set editorial heading |
| Golden Harvest | Centered coconut ring, warm ivory and a fine double frame |

State changes use a full-card diagonal sweep, a clipped form-panel reveal and a coordinated object turn (820 ms desktop, 640 ms mobile). Reduced motion removes the sweep, idle light, blink and transforms, keeping a polished closed-eye static object. Authentication/navigation never waits for an animation. A customer success acknowledgement briefly survives the signed-in drawer render.

Admin HTML is generated from the shared shell so fields and reserved decorative regions exist before enhancement scripts load. Regenerate it with `node scripts/render-admin-auth.mjs`; CI checks that it stays in sync. The legacy local staff page still redirects to secure Admin outside localhost.

## Theme/privacy boundary

`published-auth-theme` is a new **local source file**, not a deployed function. It anonymously reads only the already-public `publicStories/site-config` document under the existing Firestore rules. It has no Admin credentials, private-document reads or writes. It resolves the effective published theme on the server, then returns exactly one allowlisted `themeId`. Drafts, disabled/future schedules, campaign titles, staff metadata and permission data are not returned to the auth browser.

The browser requests this sanitized endpoint independently of authentication, with a 650 ms ceiling. It keeps the decorative region neutral until resolution, locks the result for that page visit, and ignores late responses. Failure immediately selects Signature; a timeout selects Signature at the deadline. Controls remain usable. Refresh resolves the theme again. An explicit `themePreview` query is accepted only on localhost for local design review.

If production rules/App Check deny the anonymous public read, the function falls back to Signature. No rule is weakened to make decoration work. Deployment and real production theme availability remain unverified because deployment/production access are outside this task.

## Local QA

- Existing auth/security regression: **40 assertions passed** (`auth-regression-results.json`).
- Interactive experience: **123 assertions passed** (`chromium-results.json`, full matrix).
- Sanitized theme/credential boundary: **15 assertions passed** (`theme-contract-results.json`).
- Composition/heading overlap: **40 assertions passed** (`composition-results.json`).
- Production Firebase integration contract, Admin role contract, Netlify Dev publish contract, pre-deploy audit, JavaScript syntax and whitespace checks: passed locally.
- GitHub Actions: **not run**. This child commit has no push approval. The auth job is prepared to run all four QA scripts on a later approved push.

Coverage includes customer sign-in/create/reset; Admin sign-in/reset; verified Owner binding; inactive/unassigned/mismatched staff rejection; safe redirects; failed login; reset network errors; keyboard focus/Escape/Tab/Enter; Show/Hide; synthetic saved-credential injection without input events; paste; reduced motion; sound opt-in/off; theme failure/timeout/invalid response; refresh; artwork failure; all four themes; 1440×1000, 768×1024, 390×844, 320×740 and 844×390 layouts.

All Firebase adapters and theme responses in browser QA were intercepted fixtures. No real account, password-reset email, production Firebase call or production data change was used. The endpoint contract tests mock their network dependency.

### Sound

Off by default on every new document; no preference persisted. Only explicit opt-in enables a quiet two-note sine chime. Password focus, reveal, blinking and errors make no sounds. Toggle-off stops scheduled/active oscillators and suppresses further cues, including delayed resume callbacks. AudioContext calls/envelopes/cancellation were instrumented; recordings are silent. Speaker loudness and timbre still merit device listening before release.

### Performance and accessibility

- No animation framework, third-party animation CDN, looping GIF or video asset.
- Two 22 KB SVG husks, about 5.1 KB gzip each. Shared JS/theme/CSS and both SVGs total approximately 21 KB gzip. Exact counts: `asset-sizes.json`.
- Decorative space is reserved before assets initialize. Delayed asset loading and failed/slow/invalid theme cases measured **CLS 0** in Chromium.
- Contrast checks pass for form text, inputs and buttons on all four themes. Visible focus, labels, status announcements and dialog focus trapping remain intact.
- Animation reads only focus/type and allowlisted state; credential-read instrumentation detected no reads from the animation module.
- Visual review inspected all customer desktop/mobile compositions, Admin compositions, privacy/reveal, sweeping transition frames, reduced motion and failure screens. It caught and corrected the Fresh Grove Admin mobile heading collision, beyond the form-control checks.

## Evidence

- `customer-motion.mp4`: sign-in → email → privacy pose → Show/Hide → create account → sign-in; final seconds show sound and reset.
- `admin-motion.mp4`: restrained email/password gestures, keyboard Show/Hide and reset transition.
- `customer-<theme>-desktop.png`, `customer-<theme>-mobile.png`: four customer themes.
- `admin-<theme>-desktop.png`, `admin-<theme>-mobile.png`: four Admin themes.
- Additional narrow, reduced-motion, theme fallback, artwork fallback, validation, network-error and success screenshots are linked in the gallery or included alongside it.

## Explicit remaining gaps

- Real Safari/macOS/iOS hardware was unavailable. Playwright WebKit downloaded, but execution was blocked by missing native libraries; the environment denied their installation. No Safari pass is claimed.
- Browser-native saved credential stores and third-party password-manager extensions were **simulated**, not tested against actual vaults. Manual Safari/Chrome autofill and password-manager QA remains required before release.
- Live Firebase/provider integration and production theme lookup were not exercised. Local tests preserve the adapters and access gates but cannot prove production configuration or email delivery.
- Motion's subjective quality is ready for owner review, not automatic approval based on passing tests.

`main`, production Netlify, production Firebase/data and customer-facing publishing were not changed by this work. Stop here for review; do not push this child commit without explicit approval.
