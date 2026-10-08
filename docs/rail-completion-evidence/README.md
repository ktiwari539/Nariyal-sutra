# Moving People rail — verified local completion; wider recovery blocked

The rail readability/geometry work is complete locally. The comprehensive Guardian completion package cannot be certified from this restored workspace.

## Workspace recovery finding

The required first commands returned a **clean** `feature/storefront-themes` branch at `3da30110c83bb730217e5a7f2b1e37cff10483e7`. The expected `d5924525ecc982fac2713321ff4fb15547427189` object, newer source edits, `qa-artifacts/auth-completion`, `qa-artifacts/moving-people`, `docs/completion-evidence`, and previous temporary packaging files were absent. No reset, checkout to an older revision, or remote mutation was performed. There was no working-tree change available for the requested immediate WIP checkpoint.

Only the already-recorded rail fix was restored. It was immediately committed as `76cb2527845c33448371e274b0cc52be1ae57f5f`; the focused harness was then preserved as `b5b88cdf1a4d37f8b43243a440a769d6b9d47068`. The final evidence commit is a child of that harness checkpoint. Read its exact HEAD/tree with `git rev-parse HEAD HEAD^ HEAD^{tree}`, or use the delivery message.

**Unrelated auth, pricing, water, Admin and security work was not recreated or rerun.** The user's reported earlier passes are retained as history, not represented as validation of files that are now missing. The older `docs/auth-guardian-evidence` package belongs to `3da3011` and is not a substitute for the final enhanced Guardian evidence.

## What changed

- Equal 2:3 card/media geometry at each responsive breakpoint; variable legacy heights removed.
- Object-fit cover and per-image Admin focal positions preserved. Captions remain overlays; hover changes image treatment without resizing frames.
- Theme heading/body/accent tokens cover rail headings, captions and the CTA, including Fresh Grove and Golden Harvest.
- Edge fades apply only to photo rows and respect the existing disable-fade setting.
- Default Admin module metadata no longer replaces the public editorial rail heading; custom-authored title/subtitle overrides still apply.

## Current validation

**85 assertions passed across 4 themes × 3 viewports.** Modified JavaScript syntax and Git whitespace checks also passed. No full project audit or unrelated suite was rerun.

The browser blocks external requests and service-worker registration. All screenshots use 100% browser scale at deviceScaleFactor 1. The desktop, tablet and mobile viewports are 1440×1000, 768×1024 and 390×844.

| Theme | Viewport | Card height px | Media height px | Lowest copy contrast | Rail CLS |
|---|---|---:|---:|---:|---:|
| nariyal-signature | desktop | 388.78 | 386.78 | 8.59:1 | 0 |
| nariyal-signature | tablet | 285.00 | 283.00 | 8.59:1 | 0 |
| nariyal-signature | mobile | 246.00 | 244.00 | 8.59:1 | 0 |
| fresh-grove | desktop | 388.78 | 386.78 | 6.29:1 | 0 |
| fresh-grove | tablet | 285.00 | 283.00 | 6.29:1 | 0 |
| fresh-grove | mobile | 246.00 | 244.00 | 6.29:1 | 0 |
| coastal-premium | desktop | 388.78 | 386.78 | 9.31:1 | 0 |
| coastal-premium | tablet | 285.00 | 283.00 | 9.31:1 | 0 |
| coastal-premium | mobile | 246.00 | 244.00 | 9.31:1 | 0 |
| golden-harvest | desktop | 388.78 | 386.78 | 6.18:1 | 0 |
| golden-harvest | tablet | 285.00 | 283.00 | 6.18:1 | 0 |
| golden-harvest | mobile | 246.00 | 244.00 | 6.18:1 | 0 |

Every case has zero card/media height spread, aligned top/bottom edges, 14 px gutters, no document overflow and no hover resizing. Heading thresholds are 3:1 for large text; other measured copy/controls require 4.5:1. CLS is scoped to rail sources after the existing five-second opening/section-placement sequence settles; this is not a zero-CLS claim for the entire website opening or a field performance result.

[Open the screenshot gallery](index.html), [raw measurements](results.json), [QA log](qa.log), or [changed files](changed-files.txt). Screenshots pause the marquee for readability; geometry checks run while motion and hover are active. Lossless WebP packaging preserves captured resolution and pixels.

## Final status matrix

| Item | Status | Evidence / remaining dependency |
|---|---|---|
| Moving People full-picture rail | COMPLETE + VERIFIED | 85 focused assertions; all 12 theme/viewport cases. |
| Equal card/media height; focal positions; hover | COMPLETE + VERIFIED | 2:3 frames, 14 px gutters, cover fit, preserved focal positions; zero height spread. |
| Fresh Grove rail readability | COMPLETE + VERIFIED | Heading, caption and CTA computed contrast; new screenshot evidence. |
| Golden Harvest rail readability | COMPLETE + VERIFIED | Heading, caption and CTA computed contrast; new screenshot evidence. |
| Rail edge fades and public copy | COMPLETE + VERIFIED | Fades confined to photo rows; default editorial heading preserved. |
| Rail desktop/tablet/mobile; overflow; CLS | COMPLETE + VERIFIED | No overflow or rail-source CLS after the existing opening settles. |
| Final rail art acceptance | IMPLEMENTED — HUMAN REVIEW ONLY | Screenshots are ready for human visual review. |
| Four-theme overall completion / Fresh Grove / Golden Harvest | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Theme resolution and fallback | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Customer login on demand and Customer auth | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Dedicated Admin auth / role gates / safe redirects | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Guardian active eyes / idle / email gaze | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Password close → turn → leaf privacy | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| One-eye peek / immediate Hide | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Auth error / leaf release / visible eyes | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Retry/reset and repeated privacy | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Success acknowledgement / authenticated state | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Sound default-off / toggle / cancellation | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Reduced motion | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Authoritative pricing | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Checkout and delivery recap consistency | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Liquid water 300/500 ml / glass and bottle | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Water draft privacy / previews / role race | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Admin/BCC regression results | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Overall responsive/accessibility/security/performance acceptance | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| Updated customer-motion.mp4 / admin-motion.mp4 and auth state matrix | BLOCKED — EXTERNAL DEPENDENCY | Latest completed version/evidence absent from restored workspace. Prior pass reported; not rerun or re-certified. |
| GitHub Actions CI | BLOCKED — EXTERNAL DEPENDENCY | No push or workflow dispatch authorized; all five jobs remain unrun for these local commits. |
| Physical-device / password-manager / speaker QA | BLOCKED — EXTERNAL DEPENDENCY | Requires actual devices, credential-manager integration and human listening. |
| Production deployment | BLOCKED — EXTERNAL DEPENDENCY | Explicitly prohibited; awaiting separate authorization. |
| Main, Netlify and production Firebase untouched | COMPLETE + VERIFIED | No push, merge, deployment, production authentication or production-data operation in this pass. |

## GitHub Actions jobs

| Job | Result for this local child |
|---|---|
| auth-experience | Not run — no push/dispatch |
| themes-pricing-water | Not run — no push/dispatch |
| firebase-contract | Not run — no push/dispatch |
| media-targeted | Not run — no push/dispatch |
| qa | Not run — no push/dispatch |

Local Chromium checks above are not GitHub CI results.

## Exact remaining dependencies

1. Restore or supply the missing latest working tree/Git bundle containing the previously completed Guardian, pricing, recap, preview-role and loading-CLS fixes, plus the latest auth recordings/screenshots and QA results. This is the blocker to the comprehensive final package. Apply these small rail commits onto that recovered state, retaining its newer features, then package the existing passing evidence.
2. Human visual acceptance of Guardian/rail and actual-device/password-manager/audio listening QA.
3. Separate authorization for any push/CI dispatch, merge or deployment. None is implied here.

A local recovery bundle accompanies the delivery, containing these rail commits and evidence and requiring the preserved `3da3011` ancestor. It was verified with `git bundle verify`. Do not reset the branch or discard a subsequently recovered newer checkpoint when importing it.

**Stopped locally. Main, production Netlify and production Firebase/data were untouched by this pass.**
