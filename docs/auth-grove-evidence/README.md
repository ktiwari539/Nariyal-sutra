# Nariyal Grove — local visual review

This is a local child of checkpoint `d771f8482bb28d577c160f8384a566af2dec63d8` on `feature/storefront-themes`. The checkpoint and its previous evidence remain intact. Visual approval is pending.

Open [the review gallery](index.html), [customer-motion.mp4](customer-motion.mp4), and [admin-motion.mp4](admin-motion.mp4).

## Art and behavior

The isolated SVG mascot is replaced by layered photographic products and a photographic palm frond. Customer has two coconuts plus the leaf; Admin has one coconut plus the leaf. The secondary product stays still on email/password focus. The primary uses a small turn and low-opacity irregular shadow cues, with no round dot eyes or baked-in face. Idle cues are almost invisible. Password focus closes those cues immediately while the leaf moves across; Show lifts the leaf, and Hide returns it to privacy. Success uses only the existing brief lighting acknowledgement.

| Theme | Composition |
| --- | --- |
| Nariyal Signature | Mature fibrous foreground coconut, partly husked companion, dark palm, forest shadows and warm side light |
| Fresh Grove | Dewy young green foreground, off-axis cut-green companion, bright palm and daylight botanical arch |
| Coastal Premium | Open green coconut with ivory cut husk, shadowed green companion, cool teal aperture and reflected light |
| Golden Harvest | Partly husked golden foreground, mature darker companion on the opposite side, warm frame and visible coir |

The diagonal state animation, shared brand lockup, keyboard controls and sound logic remain in place. Audio remains off for a new session. Reduced-motion users get instant static state changes. An unavailable art asset falls back to reserved botanical typography, without substituting a cartoon shape or blocking the form.

## Evidence

- All four themes × Customer/Admin × desktop/mobile: 16 full-layout screenshots at 2× pixel density.
- All four themes × Customer/Admin × idle/email/privacy/peek: 32 close-ups.
- Eight additional mobile privacy close-ups and eight 320px narrow-layout screenshots.
- `customer-motion.mp4`: 1840 × 1280, about 37 seconds.
- `admin-motion.mp4`: 1840 × 1280, about 36 seconds.
- Motion recordings show the actual interface at 150% inspection zoom. The four-theme layout matrix uses unmodified styling. In the videos, theme artwork is sampled locally on the same page; the normal localhost theme resolver is exercised by the matrix.
- Videos include the Signature state sequence, the other three theme privacy/peek sequences, diagonal auth transitions and explicit sound On/Off. Browser recordings are silent. Sound behavior is validated through oscillator/envelope instrumentation, not an audio recording.
- `diagonal-sweep.png`, `sound-on.png`, reduced-motion screenshots and the existing successful-login acknowledgement are included.

## Local validation

| Check | Result |
| --- | --- |
| Existing login, signup, reset, keyboard and secure Admin regression | PASS — 40 assertions |
| Theme/responsive/contrast, Show/Hide, sound, autofill simulation, reduced motion, failure fallback and CLS | PASS — 123 assertions |
| Grove interaction states across four themes and desktop/mobile | PASS — 83 assertions |
| Product-vs-heading geometry at 1440, 768, 390, 320 and landscape widths | PASS — 40 assertions |
| Sanitized published-theme/security boundary | PASS — 15 assertions |
| Production Firebase integration contract | PASS — local contract test |
| Admin role access contract | PASS — local contract test |
| Netlify development contract | PASS — local file preparation only |
| Pre-deploy source audit | PASS — local audit only |
| GitHub Actions | Not run: this revision is explicitly local-only and unpushed |

The layout observer recorded CLS **0** for delayed artwork and failed, invalid, delayed and timed-out theme responses. A narrow-screen placement issue discovered by the stricter new product-boundary check was corrected before final capture.

The Netlify development contract generates an ignored local staging folder. The first source audit included a rewritten extensionless link in that generated folder; removing the reproducible staging output restored a clean audit. No deployment was performed.

`boundary-verification.json` records that both existing Admin form bodies are byte-for-byte preserved. Customer account logic, Admin adapter, theme resolver, Firebase rules/configuration, public-theme function and Netlify configuration are unchanged from the checkpoint. The presentation module still consumes only focus/type/enum state and never reads credential contents.

## Scope and limits

All browser checks ran against a local HTTP server with Firebase SDK/network calls intercepted by fixtures. No real account credentials, production Firebase reads/writes, production data, or customer-facing publication were used. Chromium desktop/mobile emulation is covered; actual Safari/iOS and third-party password-manager extension behavior still need device review. Password-manager insertion is simulated without input events.

No push, merge, Netlify deployment, production Firebase modification, or change to `main` was performed. The workflow was extended locally to include the Grove check and artifact directory when a future push is approved.

## Assets and reproducibility

Five original cutouts were generated with the built-in image-generation tool. Exact prompts and final repository asset paths are in [asset-prompts.json](asset-prompts.json); byte sizes are in [asset-sizes.json](asset-sizes.json). Assets are local transparent WebP files under `assets/images/brand/grove/`. Encoding/downscaling preserved alpha and material detail. The five assets total approximately 2.3 MiB; the two product layers reuse cached files.

Run a local server on port 4173, then run `scripts/auth-experience-qa.mjs`, `scripts/auth-interactive-qa.mjs`, `scripts/auth-composition-qa.mjs`, `scripts/auth-grove-qa.mjs` and `scripts/auth-theme-contract-qa.mjs` with Playwright Chromium available. Run `scripts/render-admin-auth.mjs` to regenerate the pre-rendered Admin shells. MP4s were encoded from Playwright WebM using H.264, CRF 19, yuv420p and faststart, without an audio track.

The exact child change list is [changed-files.txt](changed-files.txt). Final commit and tree hashes are reported in the review handoff to avoid a self-referential commit hash in committed evidence.
