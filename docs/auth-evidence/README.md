# Nariyal Sutra — shared authentication review

Branch: `feature/storefront-themes`  
Starting commit: `0413adebef0d8de60239639fe02847dda5b450a1`

Customer and Admin now use the same Nariyal Sutra wordmark, shared presentation component, forest/ivory split layout, responsive fields, password visibility control and short state transitions. Context remains distinct: My Account / Customer Access and Business Command Center / Admin Access. The supplied video was used as a motion reference; its assets and source were not copied.

Customer sign-in, account creation, password reset and optional provider handlers remain in `customer-account.js`. Successful authentication still opens the existing signed-in profile/orders drawer. Guest checkout remains available. Admin preserves the verified email, configured Owner UID/email, active staff role, App Check initialization and same-origin redirect allowlist. Password reset uses Firebase's existing reset-email API with a neutral account-existence response. Local staff preview keeps its existing verifier/reset-token logic; nonlocal access to that legacy page redirects to secure Admin.

Sound starts off and is not persisted. Turning it on enables a synthesized two-note sine cue under 0.4 seconds, with a short envelope and no music file. Turning it off suspends playback. No audio context is created on page load. Reduced-motion preference disables the shell's animations and transitions.

## Verification

- Shared auth browser QA: **39 assertions passed**.
- Production Firebase integration contract: **passed**.
- Admin role access contract: **passed**.
- Netlify Dev publish contract: **passed**, generated local directory only.
- JavaScript syntax and git whitespace checks: **passed**.
- Chromium views: desktop 1440×1000, tablet 768×1024, mobile 390×844, narrow mobile 320×740.
- Computed content/input contrast passes under all four storefront themes and on Admin.
- Browser tests cover successful/failed login, signup password mismatch, profile creation and verification, both reset adapters, focus behavior, password reveal, sound opt-in/off, reduced motion, denied identities, allowed Owner/staff and safe redirects.

All Firebase SDK responses are intercepted by test-only Playwright routes. The tests do not create production users, send real emails or read/write production data. Provider availability, actual mail delivery and a live account smoke test remain outside this local verification. Videos are silent UI recordings; sound behavior is validated using audio-context instrumentation.

## Review evidence

Open `index.html` in this folder for the screenshot/video gallery. All credentials shown are synthetic QA examples. Results are in `results.json`. Screenshots show the actual application DOM with test adapters, not a separate mock design.

## Reproduce

Install the workflow's pinned Playwright 1.55.0 and Chromium, serve the repository at `http://127.0.0.1:4173`, then run:

```sh
node scripts/auth-experience-qa.mjs
node scripts/production-firebase-contract-qa.mjs
node scripts/admin-role-contract-qa.mjs
node scripts/netlify-dev-contract-qa.mjs
```

The `auth-experience` CI job runs the browser suite and security contracts and uploads the resulting evidence. Hosted CI status for the final commit is reported separately in the handoff; a local pass does not represent a GitHub Actions result.

No merge or deployment was performed. Production Netlify, production Firebase configuration/data/rules, and `main` are unchanged by this auth work. Review before merge/deploy.
