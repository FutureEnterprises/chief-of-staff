# COYL Browser Extension — v0.1

> The browser is the surface where most procrastination happens. The
> tab-switch is the exact 3-second window we promise to interrupt. This
> extension delivers that promise on Chrome, Firefox, Edge.

Per `docs/strategy/product-roadmap-v3.md` §"Gap 4 — Context Portability":
the browser extension is the single biggest under-built product in the
procrastination market. No tool today intercepts the tab switch at the
moment of opening.

This is v0.1 — local-only, no account required. v0.2 adds OAuth and
syncs with the user's `coyl.ai` account.

---

## How it works

1. User installs the extension
2. Manifest V3 service worker tracks tab loads against a watchlist
   (Reddit, X, YouTube, TikTok, Instagram, Facebook, HN — configurable)
3. When the user opens a watchlisted domain **3+ times in 10 minutes**,
   the content script renders a full-screen overlay BEFORE the page
   becomes interactable
4. Three actions: **Close the tab** / **Open rescue on coyl.ai** /
   **Continue (1 minute, then I'm out)**
5. Mute options (1h / 1d / forever) per domain so the user can opt out
   of any site without disabling the extension

---

## Architecture

```
apps/extension/
├── manifest.json       — Manifest V3 declarations
├── background.js       — Service worker: tab watcher + state + threshold
├── content.js          — Injected into watchlisted pages; renders overlay
├── popup.html          — Toolbar icon click → status + open rescue
├── popup.js            — Renders today's stats from chrome.storage.local
├── options.html        — Full settings page (watchlist, thresholds, mutes)
├── options.js          — Settings CRUD
├── icons/              — 16/48/128 px icons (placeholders — design real ones before submit)
└── README.md
```

Pure vanilla JS by design — no React, no bundler, no build step. Total
extension size <30KB unzipped. Inject-to-render latency <50ms on
midrange hardware.

---

## Development

```bash
# 1. Open chrome://extensions
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select apps/extension/
# 5. Visit any watchlisted domain 3 times in 10 minutes
```

Or for Firefox:
```bash
# 1. Open about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on..."
# 3. Select apps/extension/manifest.json
```

To test the interrupt manually:
```js
// In the service worker console (chrome://extensions → COYL → background.js → Inspect)
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, { type: 'COYL_FIRE_INTERRUPT', host: 'example.com', count: 3, threshold: 3 })
})
```

---

## What ships in v0.1 (this directory)

- ✅ Tab-watch service worker
- ✅ Sliding-window open counter
- ✅ Watchlist-configurable threshold-driven interrupt
- ✅ Full-screen overlay (vanilla, all: initial reset, inline CSS)
- ✅ Mute UI (1h / 1d / forever)
- ✅ Toolbar popup with daily stats
- ✅ Settings page (watchlist + thresholds + mutes CRUD)

## What's deferred to v0.2

- OAuth flow to authenticate against `coyl.ai`
- Sync watchlist + mutes + feedback across devices
- POST interrupt events to `/api/v1/events` so the web dashboard
  shows browser interrupts in `/today` interrupt history
- "Caught me / not the moment" feedback wired to the same
  `INTERRUPT_FEEDBACK` event the iOS/web stack uses
- Per-user model: each user's interrupt threshold adjusts based on
  their feedback (model training)

## What's deferred to v0.3+

- Safari extension port (Manifest V3 support in Safari is recent;
  the Chrome version should mostly work but needs separate signing)
- AI-written interrupt copy ("Why this fired") that pulls from the
  user's pattern history on coyl.ai
- Calendar integration — fire stronger interrupts during deep-work
  blocks the user has scheduled

---

## Submission to extension stores

| Store | Cost | Review time |
|---|---|---|
| Chrome Web Store | $5 one-time developer fee | 1–3 days first review |
| Firefox Add-ons (AMO) | Free | <24h auto-review |
| Microsoft Edge Add-ons | Free | 1–7 days |
| Safari Extensions Gallery | $99/yr (covered by iOS Apple Developer account) | 1–3 days |

Submission packaging:

```bash
cd apps/extension
zip -r coyl-extension-v0.1.zip . -x "*.zip" -x "README.md"
```

Upload the zip to each store's developer dashboard.

---

## Icons

The `icons/` directory needs three PNG files before submission:
- `icon-16.png` (16×16)
- `icon-48.png` (48×48)
- `icon-128.png` (128×128)

For v0.1 first-load testing, any orange-on-dark icon works. Real
designed icons should match the COYL wordmark from
`apps/web/src/components/brand/logo.tsx`.

---

## v0.1 → v0.2 sync architecture (planned)

```
┌─────────────────────────────────────────────┐
│ Browser Extension (chrome.storage.local)    │
│   - watchlist                                │
│   - mutes                                    │
│   - thresholds                               │
│   - recent interrupt feedback                │
└──────────────────┬──────────────────────────┘
                   │ OAuth + periodic sync
                   ▼
┌─────────────────────────────────────────────┐
│ POST /api/v1/extension/sync   (new endpoint)│
│   - upserts user.extensionPrefs              │
│   - emits INTERRUPT_FEEDBACK events          │
│   - returns latest server-side watchlist      │
└──────────────────┬──────────────────────────┘
                   ▼
            User row + events table
```

The sync endpoint doesn't exist yet. Building it is part of v0.2.

---

*Browser extension v0.1 — May 2026. The first off-phone surface in the
COYL interrupt platform.*
