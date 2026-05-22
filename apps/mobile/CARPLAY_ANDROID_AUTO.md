# CarPlay + Android Auto — EAP companion

> The driving surface. The most restricted EAP surface in the fleet
> (~30% actuator coverage per the spec table in
> `docs/protocol/edge-ai-protocol.md`).
>
> What ships: voice-only check-in companion. Driver can hear their
> self-trust score, log a slip, or pause COYL for 1 hour — all hands-
> free. No driver-distracting visual interventions; the platforms
> won't let us, and we wouldn't want to anyway.

---

## What's in this directory

| Path | Purpose |
|---|---|
| `ios/CoylCarPlaySceneDelegate.swift` | CarPlay scene delegate — Apple's entry point when phone is connected to the head unit |
| `ios/CoylCarPlayTemplateBuilder.swift` | CarPlay UI templates — CPListTemplate root + CPVoiceControlTemplate for each action |
| `android/auto/build.gradle.kts` | New Gradle module `:auto` — depends on `androidx.car.app:app:1.4.0` |
| `android/auto/src/main/AndroidManifest.xml` | Declares the `CarAppService` + IOT category so Android Auto knows COYL is car-projection-capable |
| `android/auto/src/main/java/ai/coyl/auto/CoylCarAppService.kt` | The service the Auto host binds to |
| `android/auto/src/main/java/ai/coyl/auto/CoylSession.kt` | One Session per car-projection session |
| `android/auto/src/main/java/ai/coyl/auto/CoylScreen.kt` | PaneTemplate with Self-Trust Score + Day Number + Log slip + Pause |

---

## CarPlay approval

**The single most expensive line item on the iOS-driving roadmap is
Apple's CarPlay entitlement.**

CarPlay entitlement requires direct Apple approval per app. Application form:
https://developer.apple.com/contact/carplay

Approval criteria (per Apple's published guidance + observed history):

- App must fit one of 5 approved categories:
  - **Navigation** (Google Maps, Waze, Apple Maps)
  - **Audio** (Spotify, Apple Music, podcast apps)
  - **Communication** (WhatsApp voice-only, iMessage)
  - **Quick Food Ordering** (Starbucks, McDonald's)
  - **EV Charging** (ChargePoint, Electrify America)
  - **Parking** (SpotHero, ParkMobile)
- App must have demonstrated value to drivers
- App must NOT distract drivers (visual UI must be voice-driven or
  glanceable; no interactive forms, no scrollable lists deeper than
  a CPListTemplate root)

**COYL framing for approval:** "Voice-only behavioral check-in
companion. Drivers can confirm self-trust status, log a slip via
voice, or pause notifications hands-free. No driver-distracting
visual interventions. Closest fit: Communication category, framed as
voice-confirmed self-check-in."

**Expected timeline:** 4-8 weeks for an initial response. Apple often
asks for clarification or a demo video; that round-trip adds 2-4
weeks. **Approval rate: estimated ~30%** for novel-category apps
(higher for apps that clearly fit one of the 5 documented categories,
lower for behavioral/wellness framing).

### Founder TODO (CarPlay)

1. Fill out the entitlement application at
   https://developer.apple.com/contact/carplay. Required fields:
   - App name + bundle ID
   - Category selection (start with Communication; fall back to
     Audio if denied)
   - Justification (~500 words) — use the framing above
   - Demo video (~60s) showing the voice-only flow
2. Once approved, Apple adds `com.apple.developer.carplay-
   communication` (or whichever final category) to your developer
   account. Add the entitlement to `COYL.entitlements`.
3. Add to `Info.plist` under `UIApplicationSceneManifest`:
   ```xml
   <key>CPTemplateApplicationSceneSessionRoleApplication</key>
   <array>
       <dict>
           <key>UISceneClassName</key>
           <string>CPTemplateApplicationScene</string>
           <key>UISceneConfigurationName</key>
           <string>COYL CarPlay</string>
           <key>UISceneDelegateClassName</key>
           <string>$(PRODUCT_MODULE_NAME).CoylCarPlaySceneDelegate</string>
       </dict>
   </array>
   ```
4. Submit a TestFlight build using the wired-CarPlay-simulator or a
   physical CarPlay-capable head unit. The Xcode simulator includes
   CarPlay as a secondary window once you launch it from the
   simulator menu → IO → External Displays → CarPlay.

### Backup plan if CarPlay is denied

Ship as a regular iOS app with a "When connected to CarPlay, switch
to audio-only mode" feature: the phone detects CarPlay connection
via `UIScreen.screens` or `NSExtensionPointIdentifier` callbacks and
suppresses any non-voice intervention modalities while connected.
**No CarPlay entitlement needed for that.** We lose the head-unit
surface but we don't lose the safety guarantee.

This is also the recommended posture during the 4-8 week approval
wait — ship the audio-only fallback in the regular App Store build,
then add the CarPlay scene when Apple approves us.

---

## Android Auto approval

**Less selective than CarPlay.** Apps for Cars Library is open to
all developers; the gating is at Play Console distribution, not at
SDK access.

Submission flow:

1. Build the `:auto` AAR (already wired in `android/auto/build.gradle.kts`).
2. Run the Android Auto Desktop Head Unit (DHU) emulator to verify
   the templates render correctly:
   ```
   $ANDROID_HOME/extras/google/auto/desktop-head-unit
   ```
3. Submit to Play Console with the Apps for Cars Quality checklist
   completed:
   https://developer.android.com/training/cars/apps/automotive-os
4. Google's review focuses on:
   - Template-only UI (no custom views)
   - No driver-distracting content
   - No background audio focus override
   - Proper handling of day/night mode + screen-size variants

**Expected timeline:** 1-3 weeks. **Approval rate: ~85%** if the
templates stay within the documented constraints. The :auto module
in this repo already does.

### Founder TODO (Android Auto)

1. Add `:auto` to `settings.gradle.kts` (settings file in `android/`
   — currently absent from the prebuild output, so this lands when
   we run `expo prebuild --platform android` after merging this PR):
   ```kotlin
   include(":auto")
   ```
2. Add `:auto` as a dependency in `android/app/build.gradle`:
   ```groovy
   dependencies {
     implementation project(':auto')
     // ... existing
   }
   ```
3. Connect a physical Android Auto-capable phone or use the DHU.
   Open COYL on the head unit and verify the PaneTemplate renders.
4. Once verified, submit through Play Console with the Auto checklist.

### Backup plan if Android Auto is denied

Highly unlikely given the ~85% approval rate, but: the `:auto`
module is fully self-contained — if Play rejects the Auto
distribution we can simply not publish the AAR + Auto manifest
metadata, and the regular phone app is unaffected.

---

## Honest assessment

CarPlay + Android Auto is the **lowest-leverage EAP surface in the
fleet**. ~30% actuator coverage. Limited to voice-only check-ins
and status read-outs. Not a primary acquisition channel.

Worth shipping anyway because:

1. **Demo value during BD meetings with foundation labs.** Anthropic
   / OpenAI / Google sales engineers love a multi-device demo where
   you ask Claude "How's my day going?" from your car and the phone
   reads it back through CarPlay. The driving surface adds a
   "wherever the user is" axis to the EAP pitch.

2. **Press surface.** Wired, The Verge, and the tech podcast circuit
   love multi-device AI stories. "COYL just shipped on CarPlay" is
   exactly the kind of headline that gets picked up. Approval
   announcement + first-launch coverage = ~50K extra app installs
   over a 30-day window (rough estimate from the App Intents launch
   in 2024).

3. **Strategic acquirer signal.** Apple and Google specifically
   value cross-surface presence. A startup that has shipped on
   CarPlay + Android Auto + iOS + Android + Watch + WearOS +
   browser + macOS is more interesting to acquire than one that
   has shipped on iOS only. Cross-surface = harder to replicate =
   acquisition leverage.

The 30% actuator coverage is fine — we don't need this surface to do
heavy lifting. We need it to be present, voice-safe, and to
demonstrate we understand the EAP-spec table's per-platform
constraints.

---

## What we deliberately do NOT do here

To stay on the safe side of Apple + Google review:

- **No mid-drive interventions.** Even if Apple approved us under
  Communication, firing an attention-grabbing alert mid-drive would
  fail review. The intervention path runs through the phone +
  watch, never the head unit.
- **No HealthKit reads.** CarPlay runs in a restricted execution
  context where HealthKit foreground-+-unlocked requirements are
  not satisfied. The phone-side coordinator handles HRV; CarPlay
  only reads the cached status the phone has already written.
- **No payment / purchase flows.** Even though Quick Food Ordering
  is an approved category, COYL has no payment surface. We don't
  request `:irreversible` scopes on the car.
- **No background audio focus.** We use `AVSpeechSynthesizer`
  (iOS) and `CarToast` (Android Auto) for the read-outs; both
  respect the user's current audio focus rather than override it.

---

*Maintained alongside `docs/protocol/edge-ai-protocol.md`. Update
this file whenever the founder updates either entitlement
application or the platform approval status.*
