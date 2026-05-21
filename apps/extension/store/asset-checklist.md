# Chrome Web Store — asset checklist (v0.1)

> Everything listed below is mandatory or strongly recommended for
> a first-review approval on Chrome, Edge, and Firefox AMO. Edge and
> Firefox reuse all assets except the marquee (Chrome-only).
>
> Design constraint: every asset must read as the same product line
> as the COYL marketing site. That means cream background (#fafaf7)
> OR warm-dark background (#0e0d0b), Instrument Serif for the
> wordmark, Geist Sans/Mono for body, signature orange (#ff6600) for
> the interrupt accent. No greys-on-black, no Linear blue-black, no
> teal/mint/purple.

---

## 1. Icons (REQUIRED)

| File | Size | Format | Purpose |
|---|---|---|---|
| `icons/icon-16.png` | 16×16 | PNG, transparent | Toolbar (collapsed), favicon-class slot |
| `icons/icon-48.png` | 48×48 | PNG, transparent | Extension management page |
| `icons/icon-128.png` | 128×128 | PNG, transparent | Store listing + install dialog |

Design spec:
- Background: transparent (NOT a colored square — Chrome auto-rounds to a circle in some surfaces)
- Mark: the COYL "Y" accent letter from `apps/web/src/components/brand/logo.tsx`, in #ff6600 orange, occupying 70% of the canvas
- Centered vertically + horizontally; no shadow, no gradient, no outline
- Export at 1×, 2×, 3× pixel-perfect (no anti-alias bleed at 16×16)

Render check: at 16×16 the Y must still read as a Y, not as a blob.
If it doesn't, drop a stroke weight in Figma and re-export.

---

## 2. Screenshots (REQUIRED — minimum 1, recommended 5)

| File | Size | Format | Scene |
|---|---|---|---|
| `screenshots/01-interrupt-fires.png` | 1280×800 | PNG/JPEG | The full-screen interrupt overlay on top of reddit.com. Title centered: "Third tab open in ten minutes." Three buttons visible. |
| `screenshots/02-rescue-flow.png` | 1280×800 | PNG/JPEG | The "Open rescue" path lands on coyl.ai/rescue. Show the 90-second timer + the breathing prompt. |
| `screenshots/03-popup-stats.png` | 1280×800 | PNG/JPEG | Toolbar popup expanded. "Today: 4 interrupts fired · 3 caught · 1 continued anyway." Editorial layout. |
| `screenshots/04-options-watchlist.png` | 1280×800 | PNG/JPEG | Settings page showing the eight-site watchlist + the "Add site" affordance + threshold slider. |
| `screenshots/05-protocol-pin.png` | 1280×800 | PNG/JPEG | A small pull-quote layout: "Built on the Behavioral Interrupt Protocol — Apache 2.0 — coyl.ai/protocol" with the BIP diagram. Sells the developer story to the press / Edge reviewers. |

Design spec:
- 1280×800 is Chrome's preferred dimension. Edge accepts 1280×800. AMO accepts up to 2400×1800 — upsize the same files 1.875× for AMO if their compressor accepts.
- Real Chrome browser chrome (window controls + URL bar) at the top. NOT a designer mockup frame.
- The watchlisted site behind the interrupt must be the real reddit.com / youtube.com homepage — NOT a fake. Reviewers reject fakes.
- Type sizes in the screenshot must be readable at 50% scale (Chrome thumbnails screenshots on the store grid). Headlines ≥ 40px, body ≥ 16px.

Render check: open the .png on a 13" MacBook at 100% zoom. If you can't read the headline from arm's length, scale up.

---

## 3. Promotional tile (Chrome — REQUIRED for featured placement)

| File | Size | Format | Purpose |
|---|---|---|---|
| `promo/promo-small-440x280.png` | 440×280 | PNG | Small tile shown in category pages |
| `promo/promo-marquee-1400x560.png` | 1400×560 | PNG | Marquee tile shown on Chrome Web Store homepage (featured-only) |

Design spec:
- Cream background (#fafaf7)
- Left half: a single hand-set headline in Instrument Serif: "Stop the script."
- Right half: the warm-dark interrupt card silhouette (mimicking the iOS interrupt prompt visually) with #ff6600 accent
- Bottom-right: small COYL wordmark + "Available in your browser" mono micro-line
- No screenshot embedded in the promo tile (Chrome rejects collages)

Render check: zoom out to 25%. The headline should still read. If it doesn't, the type is too thin.

---

## 4. Promotional video (Edge — OPTIONAL but lifts conversion ~30%)

| File | Length | Format | Purpose |
|---|---|---|---|
| `promo/demo-30sec.mp4` | 25–30 sec | MP4 H.264, 1080p | Demo video, autoplays muted on Edge + (optional) Chrome listing |

Storyboard:
- 0:00 — Cream wordmark "COYL" pulses on
- 0:03 — Cut to reddit.com, mouse opens it a third time
- 0:05 — Full-screen interrupt slams in (the #ff6600 accent)
- 0:09 — Headline "Third tab open in ten minutes." Three buttons.
- 0:14 — Hand hovers "Close tab" → click → reddit closes
- 0:18 — Cut to popup: "Today: 4 interrupts · 3 caught"
- 0:24 — Wordmark + "coyl.ai/protocol" mono micro-line
- 0:28 — Hold, fade

No music. Optional subtle haptic-style "tick" at 0:05 when the
interrupt fires. NO voiceover (auto-plays muted across stores).

Defer to v0.2 if v0.1 timeline is tight. The five screenshots above
are sufficient for first approval.

---

## 5. Privacy policy URL (REQUIRED)

- Existing: `https://coyl.ai/privacy`
- Must include a section titled "COYL Browser Extension — v0.1"
- Section copy template (add to `apps/web/src/app/(legal)/privacy/page.tsx`):

```
COYL Browser Extension v0.1 is fully local. The extension stores
your watchlist, mute preferences, daily interrupt counts, and
interrupt feedback in chrome.storage.local on your device. None of
this data is transmitted to any server. No account is required to
use the extension. We do not collect your browsing history. We do
not read page content beyond the URL host of the active tab. The
extension communicates with coyl.ai ONLY when you click "Open
rescue," at which point your browser opens the public rescue page
the same way clicking any link would. We retain no record of that
event.
```

Action: add this paragraph to `/privacy` before submission.

---

## 6. Single-purpose statement (Chrome — REQUIRED)

Copy from `listing-copy.md` Field 6. Paste verbatim into the Chrome
Web Store developer console field.

---

## 7. Reviewer test credentials (Chrome — OPTIONAL, USE IT)

v0.1 doesn't require login. Note this in the "Test instructions for
reviewer" field:

```
No login required for v0.1. To test the core interrupt:

1. Install the extension.
2. Visit https://www.reddit.com — close the tab.
3. Visit https://www.reddit.com again — close the tab.
4. Within ten minutes, visit https://www.reddit.com a third time.
5. The interrupt overlay should appear before the page renders.
6. Click "Close the tab" to verify the win-path closes the tab.
7. Reopen and click "Continue (1 min)" to verify the timed-snooze
   path renders the 60-second countdown and re-enables the page.

To test mute: click the COYL toolbar icon → "Mute reddit.com for
1 hour" → the next visit within an hour should NOT fire an
interrupt.
```

Including this cuts review time materially. Reviewers have
~3 minutes per extension; spelling the QA path out is worth ten
minutes of typing.

---

## 8. Pre-submission validation

Run before zipping:

```bash
# 1. Lint the manifest
npx web-ext lint --source-dir=apps/extension

# 2. Verify all referenced files exist
node -e "const m=require('./apps/extension/manifest.json');['background','content_scripts','action','options_page','icons','web_accessible_resources'].forEach(k=>console.log(k,JSON.stringify(m[k])))"

# 3. Verify icon dimensions
for f in apps/extension/icons/icon-{16,48,128}.png; do
  sips -g pixelWidth -g pixelHeight "$f"
done

# 4. Verify no console.log in production paths
grep -rn "console.log" apps/extension/{background,content,popup,options}.js

# 5. Verify the host permission set matches the privacy declaration
grep host_permissions apps/extension/manifest.json
```

Expected output: lint passes, all files exist, icons are exactly
16/48/128 px, no console.log in production paths, host_permissions
is exactly `["https://coyl.ai/*"]`.

---

## 9. Zip + submit

```bash
cd apps/extension
zip -r coyl-extension-v0.1.zip . \
  -x "*.zip" \
  -x "README.md" \
  -x "store/*" \
  -x ".DS_Store" \
  -x "*/.DS_Store"

# Verify the zip
unzip -l coyl-extension-v0.1.zip | head -30
```

Upload `coyl-extension-v0.1.zip` to:
1. Chrome Web Store developer console: https://chrome.google.com/webstore/devconsole
2. Edge Add-ons developer portal: https://partner.microsoft.com/dashboard/microsoftedge
3. Firefox AMO: https://addons.mozilla.org/developers/

---

## 10. Post-submission tracking

Create a row in `docs/strategy/extension-launch-log.md` (new file) with:

| Store | Submission date | Reviewer email | Status | Install count week 1 | Activation % week 1 |
|---|---|---|---|---|---|

Activation = installed AND fired ≥ 1 interrupt AND tapped ≥ 1
"caught me" feedback. Target activation ≥ 35% within 7 days. If
activation < 20% week one, the interrupt copy is wrong or the
default watchlist is wrong — iterate the listing screenshots, not
the extension.

---

## Asset readiness checklist (sign off before submission)

- [ ] icons/icon-16.png exists, exactly 16×16, transparent bg
- [ ] icons/icon-48.png exists, exactly 48×48, transparent bg
- [ ] icons/icon-128.png exists, exactly 128×128, transparent bg
- [ ] 5 screenshots at 1280×800, real browser chrome, real sites
- [ ] promo-small-440x280.png exists
- [ ] promo-marquee-1400x560.png exists (only if applying for featured)
- [ ] /privacy page contains the v0.1 extension paragraph
- [ ] /help page exists and returns 200
- [ ] /protocol page is publicly accessible (no auth gate)
- [ ] manifest.json passes web-ext lint
- [ ] No console.log in production paths
- [ ] Zip file < 5 MB
- [ ] Test instructions written into the developer console

---

*Chrome Web Store asset checklist v1.0 — May 2026. Aligned with
Chrome Web Store Image Asset Guidelines (rev. Mar 2026) + Edge
Add-ons design requirements.*
