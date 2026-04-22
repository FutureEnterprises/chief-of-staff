# COYL Store Metadata

Canonical listing copy, compliance answers, and submission notes for App Store Connect and Google Play Console. Paste from here directly into the consoles — this is the source of truth.

## Files

| File | What it covers |
|---|---|
| `app-store.md` | iOS ASC: name, subtitle, description, keywords, promo text, privacy questionnaire, age rating, export compliance |
| `play-store.md` | Android Play: short description, full description, data safety, content rating, target audience |
| `screenshots.md` | Required device sizes, shot list with captions, localization plan |

## Submission order

1. Paste listings into consoles, mark "ready for review" on the tracker below but do not submit yet.
2. Replace `REPLACE_WITH_*` placeholders in `app.json` (`extra.eas.projectId`, `updates.url`) and `eas.json` (`submit.production.ios.*`, Android service account path).
3. `pnpm --filter @repo/mobile eas build --profile production --platform all`.
4. `pnpm --filter @repo/mobile eas submit --profile production --platform all`.
5. Respond to any App Review questions. Approval typically 24–48h first submission.

## Compliance notes

- **Reader-app model**: the mobile app MUST NOT contain a purchase flow or a link to one. Users subscribe on coyl.ai from their browser. The only in-app mention of paid tiers is passive (e.g. "Assessment is a Pro feature") with no external link. Apple's reader-app rule allows this.
- **Health data**: HealthKit (iOS) and Health Connect (Android) are optional. All permission prompts use the app.json-declared usage strings. The app must still function fully without health data.
- **Not medical treatment**: every marketing surface and App Store description must say "behavioral support, not medical treatment or diagnosis." Age-rating questionnaires answer NO to "medical/treatment information" — COYL is wellness.
- **Privacy manifest**: `apps/mobile/ios/COYL/PrivacyInfo.xcprivacy` must match `app-store.md` § Privacy Questionnaire. They are paired declarations; mismatches cause rejection.

## Tracker

- [ ] App Store Connect app record created (`ai.coyl.app`)
- [ ] Google Play Console app record created (`ai.coyl.app`)
- [ ] ASC API key uploaded to EAS (`eas credentials`)
- [ ] Play service account JSON uploaded (`./secrets/play-service-account.json`, gitignored)
- [ ] APNs key uploaded to Expo Push (`eas credentials`)
- [ ] FCM config uploaded to Expo Push
- [ ] App icon 1024×1024 finalized
- [ ] Feature graphic 1024×500 finalized (Android)
- [ ] Screenshots captured for all required device sizes (see `screenshots.md`)
- [ ] Privacy policy URL live (https://coyl.ai/privacy)
- [ ] Support URL live (https://coyl.ai/support or https://coyl.ai)
- [ ] Marketing URL live (https://coyl.ai)
