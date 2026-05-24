# Microsoft Teams app icons — TODO

The manifest at `manifest.json` references two icon files that need
to exist in this folder before AppSource submission (or even before
local sideload testing in a Teams test tenant).

## Required files

| File | Dimensions | Format | Purpose |
|---|---|---|---|
| `color.png` | 192×192 | PNG, full color, ≤30KB | Full-color app icon shown in the Teams App Store, Apps catalog, and the app's profile card |
| `outline.png` | 32×32 | PNG, white silhouette on transparent | Used in the Teams left-rail when the app is pinned |

## Design constraints

Per Microsoft Teams Store design guidelines
(https://learn.microsoft.com/microsoftteams/platform/concepts/build-and-test/apps-package#app-icons):

- **color.png**:
  - 192×192 exact pixel dimensions
  - PNG, full alpha channel allowed
  - Should look correct on both light AND dark Teams themes (Teams
    auto-toggles between them)
  - COYL brand: orange flame on warm-charcoal (#0e0d0b) background
    with the orange accent (#FF6600)
  - No text in the icon (Microsoft rejects text-bearing icons)

- **outline.png**:
  - 32×32 exact pixel dimensions
  - PNG, transparent background
  - White silhouette only (no color, no gradient, no shading)
  - Should be the same shape as `color.png`'s focal element so users
    recognize the rail icon
  - COYL brand: white flame silhouette on transparent

## Generation paths

Three viable approaches in order of recommended:

### A. Designer hand-off (recommended)

The COYL brand mark is already established (flame, orange accent,
warm-charcoal background). A designer with 30 minutes + Figma can
export both icons at the right dimensions. The brand SVG lives at
`apps/web/public/coyl-logo.svg` and `apps/web/public/favicon.svg` —
use those as the source.

### B. SVG → PNG via the existing `next/og` runtime

Build a one-off Node script that uses `@vercel/og`'s `ImageResponse`
to render the flame SVG at both target sizes, then save the buffer
to disk. The pattern is documented in
`apps/web/src/app/api/og/route.tsx`. Note: ImageResponse is designed
for runtime route responses, not file-system writes, so this needs
extracting the Buffer from the Response object.

### C. Pure-JS PNG generator (last resort)

Use `pngjs` or `sharp` to construct minimal placeholder icons.
Output will be flat-color rectangles with a centered glyph — good
enough for local sideload testing, NOT good enough for AppSource
submission. Microsoft rejects icons that don't meet design quality
standards.

## Until icons exist

The manifest still validates and the `/microsoft-teams/manifest.json`
endpoint serves cleanly. But:

- Local sideload will fail with "icon missing" error from Teams
- AppSource submission will fail at the Publisher Attestation
  pre-flight check
- The Vercel deploy is not impacted; this is a Teams-side issue only

## When icons land

1. Drop `color.png` and `outline.png` into this folder
2. Verify they meet the dimensions above:
   ```
   file color.png   # should report PNG image data, 192 x 192
   file outline.png # should report PNG image data, 32 x 32
   ```
3. Bump the manifest version (`"version": "0.2.1"` → next patch) and
   commit
4. Sideload-test in a Microsoft Teams developer tenant per the
   instructions in `README.md`
