# Guardian/auth recovery — local evidence

Recovered from preserved `26a852190c75f592fdff2fbaf98ec16bb26b8706`. No remote services were mutated. Firebase/auth/theme adapters are intercepted in browser QA.

## Results

- guardian: 209 passed checks.
- interactive: 127 passed checks.
- composition: 40 passed checks.
- theme-contract: 15 passed checks.
- flows: 51 passed checks.
- 288 native-size screenshots; 80 before/after frames (40 pairs).
- Admin inline/external script tags and marked form contents are byte-identical to 26a8521 (4 checks).
- Guardian/auth-source CLS and all five theme/artwork loading CLS cases measure zero in local Chromium fixtures.
- Desktop 1440×1000, mobile 390×844; composition/interactive checks also cover tablet, 320px narrow and 844×390 landscape.

## Review

Open `index.html`. Both motion MP4s use a 1440×1000 viewport at 100% scale; no browser zoom or image upscaling. Close-ups are actual art-panel crops. The videos include idle, email gaze, timed password closure/turn/leaf, Show/Hide, invalid login, editing retry, repeated Enter retry, held success inspection, actual unblocked access, diagonal state transition and sound toggle/cancellation. Held success inspections are separate from real immediate navigation.

Audio is OFF by default. Browser videos use audio instrumentation and are silent. The three WAVs are rendered from the production sound engine using OfflineAudioContext; JSON records durations/peaks. Physical speaker/headphone assessment remains manual.

Before/after images use exact preserved 26a8521 presentation files through local browser routes. They do not claim recovery of the unavailable ead5615 Git object.

## Limits

Chromium desktop/mobile emulation, not physical devices. Actual Safari/iOS/password-manager extensions, human art-direction approval and physical sound review remain manual. These are local QA results, not a GitHub Actions run. No push/deployment was performed.
