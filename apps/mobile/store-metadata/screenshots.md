# Screenshot Plan — COYL

Required device sizes and the 8-shot sequence that tells the story without needing to read copy. Capture from the iOS Simulator and an Android emulator; avoid real-device screenshots (inconsistent status bars).

## iOS required sizes

Apple requires at least **one device size per family** but strongly recommends providing the largest of each so auto-scaling handles smaller sizes cleanly.

| Family | Device | Resolution | Required? |
|---|---|---|---|
| iPhone 6.9" | iPhone 16 Pro Max | 1320 × 2868 | ✓ required |
| iPhone 6.5" | iPhone 11 Pro Max / XS Max | 1242 × 2688 | recommended (legacy fallback) |
| iPhone 5.5" | iPhone 8 Plus | 1242 × 2208 | optional (removed from requirements 2024) |
| iPad 13" | iPad Pro 13" M4 | 2064 × 2752 | ✓ required if `supportsTablet: true` |
| iPad 12.9" | iPad Pro 12.9" 2nd/3rd gen | 2048 × 2732 | recommended |

## Android required sizes

Google Play accepts any resolution from 320px–3840px. The 2:1 aspect ratios below cover all device sizes; Play auto-scales.

| Format | Resolution | Required? |
|---|---|---|
| Phone | 1080 × 1920 (9:16) | ✓ required, min 2, max 8 |
| 7-inch tablet | 1200 × 1920 | recommended |
| 10-inch tablet | 1600 × 2560 | recommended |
| Feature graphic | 1024 × 500 | ✓ required |
| Icon | 512 × 512 | ✓ required (alongside 1024×1024 for iOS) |

## The 8-shot sequence

Same narrative order for both platforms. Captions go above the phone mock in a 40%-tall black band with large white Inter-900 type.

| # | Screen to capture | Caption (≤5 words) |
|---|---|---|
| 1 | `/today` with a danger-window alert visible | "Autopilot detected." |
| 2 | `/today` with rescue CTA tapped → rescue sheet open | "Interrupt before the fold." |
| 3 | `/rescue` with the 9pm kitchen scenario + COYL coach reply streamed | "Not motivation. Pattern recognition." |
| 4 | `/slip` pre-select — the "You slipped. Good. Now we stop the damage." copy | "No Monday reset." |
| 5 | `/slip` post-recovery — stabilize chips checked, "You're back" chip visible | "Same-night re-entry." |
| 6 | `/patterns` heatmap — danger windows by hour, one lit column | "Your loop. Mapped." |
| 7 | `/commitments` — one active rule with follow-through counter | "One rule. Kept." |
| 8 | `/today` sharing the "I caught myself" chip from ShareMoment | "Patterns defeated: 7." |

## Caption rules

- All caps, Inter 900 or equivalent, `#FF6600` orange for the accent word, white for the rest.
- 40% tall black band above the phone mock. Phone mock fills remaining 60%.
- Device frames: Figma's free Apple + Google Play screenshot templates are fine, or use Expo's `expo export` + a screenshot library like `rotato`.
- Never use real personal data. Use the demo account.

## Feature graphic (Android only)

1024 × 500. Black background. Orange-to-red gradient arc bottom-right (the same gradient used on coyl.ai CTA). Left 60%: caption in three stacked lines:

```
CONTROL
YOUR
LIFE.
```

Subcaption smaller: "It's not the mistake. It's what you do after."

Right 40%: the "AUTOPILOT DETECTED → Paused. Didn't binge. ✓" chat card mock from the website hero.

## Localization

English (US) only for v1. Add:
- en-GB: swap "$" → "£" if any appears, change "color" → "colour" in any listing copy
- es-MX, pt-BR: commission translation for v1.1

## Capture checklist

- [ ] iOS Simulator set to iPhone 16 Pro Max, Light mode (the app is dark-themed; dark mode in the simulator is irrelevant — capture from the app's dark UI)
- [ ] Status bar time: `09:41` (Apple's standard demo time)
- [ ] Battery: full, wifi: full signal (simulator defaults)
- [ ] Android emulator: Pixel 7 Pro or similar, status bar time `09:41`, full battery
- [ ] Demo account signed in, seeded with 7 days of fake data (so heatmaps / streaks look realistic)
- [ ] PNG export, no JPEG — App Store rejects screenshots with JPEG artifacts
