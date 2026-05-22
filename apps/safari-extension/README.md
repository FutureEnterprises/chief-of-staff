# COYL Safari Web Extension — v0.1

> Same product as `apps/extension/` (Chrome / Firefox / Edge), wrapped
> for Safari distribution. Manifest V3, vanilla JS, full-screen
> tab-switch interrupt before the doom-scroll starts.

Distribution channel: **macOS App Store via Xcode archive**.
Cost: **$0 extra** — covered by the existing Apple Developer Program
($99/yr already paid for the iOS app).

---

## What this directory contains

```
apps/safari-extension/
├── Resources/
│   ├── manifest.json        — Manifest V3 (Safari 16.4+ compatible)
│   ├── background.js        — Service worker; uses browser.* (vs chrome.*)
│   ├── content.js           — Same overlay as Chrome; uses browser.*
│   ├── popup.html / .js     — Toolbar popup
│   ├── options.html / .js   — Settings page
│   └── icons/               — PNG placeholders (drop real assets pre-submission)
├── SafariExtension.swift    — Principal class; no native bridging in v0.1
├── Info.plist               — Extension bundle metadata + NSExtension dict
├── SafariExtension.entitlements
└── README.md                — this file
```

Pure vanilla JS, no bundler. Total extension payload <30KB unzipped.

---

## Why a separate directory

The Chrome/Firefox/Edge build at `apps/extension/` ships as a zip to
each store's developer dashboard. Safari does not accept zips — Safari
extensions are wrapped in a macOS app bundle and submitted through
Xcode → App Store Connect. So:

- `apps/extension/` — three stores, one build, no Xcode
- `apps/safari-extension/` — one store, Xcode-wrapped build

The JS payload is 95% identical. The only differences:

1. `manifest.json` drops `web_accessible_resources` HTML files Safari
   doesn't currently need
2. `background.js` + `content.js` + `popup.js` + `options.js` use the
   WebExtensions standard `browser.*` namespace (with a `chrome` fallback)
   instead of `chrome.*` — cleaner under Safari and Firefox

---

## Founder Xcode steps (run once when first setting up the Mac target)

1. **Open Xcode** → File → New → Project
2. Pick **Safari Extension App** (under macOS → Application).
   (If running Xcode 15+ the template is sometimes labelled
   "Safari Web Extension App" — pick that one.)
3. **Product name:** `COYL Safari`
4. **Bundle Identifier:** `com.coyl.safari`
   (the extension target itself will be `com.coyl.safari.extension`)
5. **Team:** select the existing COYL Apple Developer team (same one
   used for the iOS app)
6. **Save the project** anywhere outside this repo — Xcode generates
   `.xcodeproj` + `.xcworkspace` boilerplate we don't want tracked here.
7. In the generated project, replace the auto-generated **extension target's**
   `Resources/` folder with the contents of
   `apps/safari-extension/Resources/`. Drag each file into Xcode's
   project navigator; pick "Create folder references" so the folder
   stays as `Resources/` not a group.
8. Replace the auto-generated `SafariWebExtensionHandler.swift` with
   `apps/safari-extension/SafariExtension.swift`. (You can either copy
   the contents, or delete theirs and drag ours in.)
9. Replace the auto-generated `Info.plist` with
   `apps/safari-extension/Info.plist` — or merge the `NSExtension`
   dict if Xcode already populated other keys.
10. Replace the auto-generated entitlements with
    `apps/safari-extension/SafariExtension.entitlements`.
11. **Build + Run** (⌘R). Xcode launches a host app that prompts:
    "COYL Safari extension can now be enabled in Safari → Settings →
    Extensions". Toggle it on.
12. Visit any watchlisted domain (reddit.com, x.com, youtube.com…)
    3 times in 10 minutes — the interrupt overlay should fire.

---

## Submission to App Store Connect

```
Xcode → Product → Archive
  → Distribute App
    → App Store Connect
      → Upload
```

Then in App Store Connect:

1. Create a new macOS app listing for "COYL — Stop the script"
2. Use the listing copy at `apps/extension/store/listing-copy.md`
3. Use the asset checklist at `apps/extension/store/asset-checklist.md`
   (Mac screenshots: 2880×1800 instead of Chrome's 1280×800)
4. Submit for review. Apple typically responds in 1–3 days for
   first-time Safari extensions.

---

## Local dev loop

After the Xcode project exists, the iteration cycle is:

```bash
# Edit JS files in this directory (apps/safari-extension/Resources/)
# Xcode auto-watches the folder reference and rebuilds on save.
# Reload the extension in Safari → Settings → Extensions → COYL → Reload.
# (Cmd+R in Safari only reloads the page, not the extension.)
```

For testing the interrupt manually:

```js
// In the background service worker debugger
// (Safari → Develop → Web Extension Background Pages → COYL)
browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  browser.tabs.sendMessage(tab.id, {
    type: 'COYL_FIRE_INTERRUPT', host: 'example.com', count: 3, threshold: 3,
  })
})
```

---

## Caveats specific to Safari

- **`window.close()` doesn't close top-level tabs in Safari** (same as
  Chrome). The content script falls back to `location.replace('about:blank')`
  so the user can dismiss manually.
- **Service worker wake/sleep is more aggressive in Safari** than in
  Chrome. State must live in `browser.storage.local` (it does).
- **Notifications** require the host macOS app to be granted
  notification permission in System Settings → Notifications. The
  `quick-slip` keyboard shortcut surfaces a notification on success.
- **App Transport Security** is configured in `Info.plist` to require
  TLS 1.3 + forward secrecy + Certificate Transparency for `coyl.ai`
  and to leaf-pin the production cert. **Replace the
  `REPLACE_WITH_PRODUCTION_LEAF_SPKI_HASH` placeholders before
  archiving for the App Store** — see the inline comment in
  `Info.plist` for the openssl one-liner. Ship a new build with the
  next-rotation leaf hash before the current cert expires; the backup
  pin entry exists for exactly that overlap window.
- **`commands` shortcut**: Safari maps `Command+Shift+L` to the same
  keybinding as Chrome. If the user has another extension grabbing it,
  Safari → Settings → Extensions → COYL → Shortcuts lets them rebind.

---

## What ships in v0.1 (same surface as Chrome build)

- ✅ Tab-watch service worker (browser.tabs.onUpdated)
- ✅ Sliding-window open counter (browser.storage.local)
- ✅ Watchlist-configurable threshold-driven interrupt
- ✅ Full-screen overlay (vanilla JS, all: initial reset)
- ✅ Mute UI (1h / 1d / forever)
- ✅ Toolbar popup with daily stats
- ✅ Settings page (watchlist + thresholds + mutes CRUD)

## What's deferred to v0.2

- OAuth flow to `coyl.ai` (Clerk session cookie pickup via `credentials: 'include'`)
- Sync watchlist + mutes + feedback across devices and across browsers
- POST interrupt events to `/api/v1/events` so the web dashboard sees
  Safari interrupts in `/today` interrupt history
- Native bridge (`SFSafariExtensionHandler.messageReceived`) for any
  feature that needs Screen Time data or Apple Watch companion routing

---

*Safari extension v0.1 — May 2026. Same overlay, Apple distribution.*

---

## EAP coordinator additions (Safari)

The Safari Web Extension now ALSO functions as an EAP edge device.

Safari-specific limitations:
- No browser.idle API → screen_state sensor unavailable
- Tab event history not persisted by Safari → sliding-window rate
  computation is best-effort on background.js memory
- Notifications require per-site user grant (Chrome has a global grant)
- Polling interval extended from 30s (Chrome) to 60s to respect
  Safari's stricter idle timeout for persistent background contexts

~50% actuator coverage on Safari (vs ~70% on Chrome/Edge/Firefox).

Founder Xcode steps — no changes to the existing Safari Web Extension
target setup (commit a08f58e). The new eap-*.js files load
automatically via background.js imports + manifest.json
background.scripts inclusion.

