# Mobile Submission Checklist

> Step-by-step path from "code is done" to "live in both stores."
> Average time end-to-end with no rejections: **5–9 days.**
> Plan for one rejection cycle in each store (add 3–7 days).

The mobile codebase is at `apps/mobile/`. The web product is the source of truth; mobile is a thin Expo wrapper that delivers the precision-interrupt push pipeline plus app-store-distributable surfaces. Every API call goes back to `coyl.ai/api/v1/*`.

---

## Phase 0 — One-time setup (~1 hour)

These accounts cost a total of **~$124/year** and only need to be created once.

### Apple Developer Program
- Sign up at [developer.apple.com/programs](https://developer.apple.com/programs/) — $99/year
- Use a personal email tied to a business if you want the company name visible in App Store; otherwise individual is fine for v1
- Wait 24–48h for approval. The clock doesn't start until this is done.
- Once approved, log into [App Store Connect](https://appstoreconnect.apple.com/)

### Google Play Developer Console
- Sign up at [play.google.com/console/signup](https://play.google.com/console/signup) — $25 one-time
- Identity verification takes 1–3 business days
- You need to make $25 USD before publishing, so use a real card

### Expo / EAS account
- Free tier is sufficient for first launches
- `npx eas-cli@latest login` from `apps/mobile/`
- Or via [expo.dev](https://expo.dev) sign-up

---

## Phase 1 — Initialize EAS (~10 minutes)

Run from `apps/mobile/`:

```bash
npx eas-cli@latest init
```

This populates:
- `app.json` → `extra.eas.projectId`
- `app.json` → `updates.url` (auto-derived from projectId)

After running, verify both fields are no longer the `REPLACE_WITH_EAS_PROJECT_ID` placeholder.

---

## Phase 2 — Apple submission identifiers (~10 minutes)

Edit `apps/mobile/eas.json` under `submit.production.ios`:

```jsonc
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",          // your Apple Developer login email
        "ascAppId": "1234567890",                      // App Store Connect numeric app id (10 digits)
        "appleTeamId": "ABCDE12345"                    // 10-char Team ID from developer.apple.com → Membership
      }
    }
  }
}
```

**Where to find each:**
- `appleId` — the email you signed up to the Apple Developer Program with
- `ascAppId` — go to App Store Connect → My Apps → (after creating the app record below) → the 10-digit ID in the URL or under General Info
- `appleTeamId` — [developer.apple.com](https://developer.apple.com) → Account → Membership → Team ID (10 chars)

**Don't commit `appleId` to a public repo.** Use environment expansion:
```jsonc
"appleId": "$APPLE_ID"
```
Then `export APPLE_ID=...` before running submit.

---

## Phase 3 — Create the App Store record (~15 minutes)

App Store Connect → My Apps → + → New App

Fill these fields with the values from `apps/mobile/store-metadata/app-store.md`:

| Field | Value | Source |
|---|---|---|
| Platform | iOS | — |
| Name | `COYL: Autopilot Interruption` | `app-store.md § Name` |
| Primary language | English (U.S.) | — |
| Bundle ID | `ai.coyl.app` | matches `app.json ios.bundleIdentifier` |
| SKU | `coyl-ios-v1` | any unique string |
| User Access | Full Access | — |

After creation, **copy the numeric ascAppId from the URL** into `eas.json`.

Then fill App Information:
- Subtitle, Description, Promotional Text, Keywords — all from `app-store.md`
- Privacy Policy URL: `https://coyl.ai/privacy`
- Support URL: `https://coyl.ai` (or set up `hello@coyl.ai` mailto if needed)
- Category: Health & Fitness (primary), Lifestyle (secondary)
- Age Rating: complete the questionnaire — COYL is 17+ (mental health content)
- Content Rights: confirm you have the rights to all content

---

## Phase 4 — Google Play submission identifiers (~10 minutes)

Generate a service account key for EAS to upload builds on your behalf:

1. Play Console → Setup → API access → Create new service account
2. Follow the redirect to Google Cloud Console → IAM → Service Accounts
3. Create a new key (JSON format), download
4. Save to `apps/mobile/secrets/play-service-account.json`
5. Add to gitignore (should already be ignored under `secrets/`)
6. Back in Play Console → API access → grant the service account "Release apps to testing tracks" + "Release apps to production" permissions

Then in Play Console → Internal Testing → create a track (you'll promote builds through this before production).

---

## Phase 5 — Create the Play Store record (~15 minutes)

Play Console → Create app

| Field | Value |
|---|---|
| App name | `COYL: Autopilot Interruption` |
| Default language | English (United States) – en-US |
| App or game | App |
| Free or paid | Free (we monetize via web Stripe checkout, not Play billing) |
| Declarations | Confirm you comply with developer policies |

Then fill Store Listing:
- All copy from `apps/mobile/store-metadata/play-store.md`
- Privacy Policy URL: `https://coyl.ai/privacy`
- Category: Health & Fitness
- Tags: Behavior, Habit, Health
- Contact: `hello@coyl.ai`

---

## Phase 6 — Screenshots & visual assets (~2 hours)

Generate **exactly these dimensions** or the store will reject:

### iOS (App Store Connect)
- 6.7" iPhone (Pro Max): **1290 × 2796 px** — 3 to 10 screenshots required
- 6.5" iPhone (Plus/XS Max): **1284 × 2778 px** — recommended
- iPad Pro 12.9" (6th gen): **2048 × 2732 px** — required if `supportsTablet: true` (we have this)

### Android (Play Store)
- Phone screenshots: **1080 × 1920 px** minimum, up to 8
- 7" tablet: optional
- 10" tablet: optional
- Feature graphic: **1024 × 500 px** — required

Capture from:
1. iOS simulator (Xcode → simulator → File → New Screen Shot)
2. Android emulator (`adb shell screencap -p /sdcard/shot.png`)
3. Or `eas build --profile development` + a physical device

Hero screens to capture (see `store-metadata/screenshots.md` for caption copy):
1. `/today` with active danger window banner showing — the "this is the moment" hook
2. `/rescue` mid-flow with the AI response streaming — the demo proof
3. `/today` Recovery Mode banner — the "no shame" brand promise
4. `/audit` archetype result — the shareable artifact
5. `/settings` notification preferences — the consent architecture
6. `/clinical-study` — the trust signal
7. `/i/[code]` Autopilot Interrupted card — the viral moment

Save to:
- `apps/mobile/store-metadata/screenshots/ios/`
- `apps/mobile/store-metadata/screenshots/android/`

---

## Phase 7 — First build (~30 minutes total — most is wait time)

From `apps/mobile/`:

```bash
# Preflight (fails loud on misconfiguration)
pnpm preflight

# iOS build — uploads to EAS, returns ~25 min later with a .ipa
pnpm build:ios

# Android build — same, returns ~15 min later with .aab
pnpm build:android

# Or both in parallel
pnpm build:all
```

If the preflight fails, fix the listed issues and re-run. The most common
blockers are unresolved `REPLACE_WITH_*` placeholders in `eas.json`.

EAS will email you when each build completes. Builds expire after 30 days
on free tier, so plan to submit within that window.

---

## Phase 8 — Submit (~10 minutes per platform)

```bash
# Submit iOS to TestFlight first
pnpm submit:ios

# Submit Android to Internal Testing
pnpm submit:android
```

### iOS path after submit
1. Build appears in App Store Connect → TestFlight (15–60 min processing)
2. Add yourself as a tester, install via TestFlight app, smoke-test
3. App Store Connect → main app page → "Add for Review"
4. Fill the "What to Test" notes from `store-metadata/whats-new.md`
5. Submit for review → 1–7 days typical wait
6. Approved → release immediately, or schedule

### Android path after submit
1. Build appears in Play Console → Internal Testing (15–30 min processing)
2. Invite testers (you + 1–2 trusted), smoke-test on real device
3. Promote to Closed Testing (50–100 testers) for 14 days minimum — Google policy
4. Promote to Production after passing closed testing
5. Production review → 1–3 days typical

---

## Phase 9 — Likely rejection reasons (pre-emptive)

### iOS App Review
- **5.1.1(v) Account deletion** — must be available IN-APP, not just on the web. We have this via `/settings` → DELETE button → calls `DELETE /api/v1/user`. Confirm the in-app settings tab routes there.
- **2.1 Performance** — app crashes on launch. The preflight catches asset issues; if you still crash, run `eas build --profile preview` and test on real iPhone first.
- **4.0 Design** — too similar to the web product. Mitigation: emphasize iOS-native features in the listing (HealthKit integration, push notifications).
- **1.4.1 Safety - Physical Harm** — health-adjacent app needs disclaimers. We have "behavioral support, not medical treatment" copy throughout. Make sure it's visible in onboarding.

### Play Review
- **Health permissions** — Health Connect requires a privacy policy explicitly covering health data. Ours does at `/privacy`. Link must be HTTPS and stable.
- **Notification policy** — Android 13+ requires runtime permission. Our app requests it in onboarding.
- **Closed Testing 14-day rule** — must have 12+ testers active for 14 days before production. Start the clock NOW.

---

## Phase 10 — Post-launch

Once both stores are live:

1. Add the App Store + Play Store badges to `coyl.ai` homepage hero
2. Add the universal app link routing to `/api/.well-known/apple-app-site-association` and `assetlinks.json` for Android — this enables `coyl.ai/r/[code]` and `coyl.ai/i/[code]` to open in the app instead of the browser on installed devices
3. Update `app.json` version + buildNumber for every subsequent submission. Apple rejects same-version uploads with a 409.
4. Capture metrics from App Store Connect Analytics + Play Console Acquisition reports

---

## Cheat sheet

```bash
# First time
npx eas-cli@latest login
cd apps/mobile
npx eas-cli@latest init

# Every release
pnpm preflight                    # validate
pnpm build:all                    # build both
pnpm submit:all                   # submit both
```

For version bumps, edit `app.json`:
```json
"version": "1.0.1",
"ios": { "buildNumber": "2" },
"android": { "versionCode": 2 }
```

---

## File map

| File | Role |
|---|---|
| `apps/mobile/app.json` | Expo configuration. Update version + buildNumber before each submit. |
| `apps/mobile/eas.json` | EAS build + submit profiles. Apple identifiers live here. |
| `apps/mobile/scripts/preflight.js` | Pre-submission validator. Run via `pnpm preflight`. |
| `apps/mobile/store-metadata/app-store.md` | App Store Connect listing copy. |
| `apps/mobile/store-metadata/play-store.md` | Google Play listing copy. |
| `apps/mobile/store-metadata/screenshots.md` | Screenshot brief + dimensions. |
| `apps/mobile/secrets/play-service-account.json` | **NEVER commit.** Google service account key. |

---

*Submission checklist — May 2026. Update after every release with what tripped up the cycle so the next one is faster.*
