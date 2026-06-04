# COYL — App Store / Play listing + ASO

*Copy-paste-ready store metadata + the two listing decisions only you
can make. Bundle: `ai.coyl.app` (iOS + Android). NEDA-safe throughout —
no weight/calorie/diet/body language anywhere in the public listing.*

---

## ⚠️ Two decisions before you submit

### 1. Category: Lifestyle vs Health & Fitness
The strategy says **Lifestyle** (avoids the medical-device disclosure +
the eating-disorder third rail). **But `app.json` currently requests
HealthKit reads including `weight`** (`NSHealthShareUsageDescription`:
steps, weight, sleep, heart rate). Reading **body weight** does two bad
things at once: it pulls Apple toward Health & Fitness + extra review,
and it reintroduces the exact body-metric signal the NEDA-safety stance
removes everywhere else.

**Recommendation:** for the consumer launch, **drop the `weight`
HealthKit read** — keep steps + sleep + heart rate (enough for
danger-window/stress detection) — and list in **Lifestyle**. That keeps
the listing clean, the review easy, and the product consistent with the
"no body metrics" rule. (Rebound/clinical can request weight later under
a different, consented surface.)
*Code change: remove `weight` from the HealthKit read set + soften
`NSHealthShareUsageDescription` to drop "weight." Tell me and I'll do it.*

### 2. App name lock
Pick one title (≤30 chars) — this is the single biggest ASO lever:
- **`COYL: Catch Your Autopilot`** (26) ← recommended
- `COYL — Interrupt Your Loops` (27)
- `COYL: Behavioral Interrupts` (27)

---

## iOS — App Store Connect fields

**Name (≤30):** `COYL: Catch Your Autopilot`
**Subtitle (≤30):** `Break the loop in the moment`
**Promotional text (≤170):** `Meet your autopilot archetype in 90 seconds — then let COYL catch you in the 3-second window before the pattern runs. Behavioral support, not another tracker.`

**Keywords (≤100, no spaces):**
`autopilot,habit,behavior,focus,procrastination,accountability,discipline,self-control,routine,mindset,urge,streak,motivation`

**Description (≤4000):**
```
You already know your pattern. The late-night kitchen. The "just one more tab." The "I already messed up, so the day's a write-off." Knowing it has never been the problem. Catching it in the moment is.

COYL lives in the three seconds between the impulse and the action — the thin window where an outside voice could have changed what happened next. Therapy shows up Tuesday at 3 PM. Habit trackers show up the next morning. COYL shows up in the moment.

START WITH THE 90-SECOND AUDIT
Answer three questions and meet your autopilot archetype — one of six patterns that quietly run most people. The 9 PM Negotiator. The Monday Resetter. The Deserver. The One-More-Tabber. The Spiral Extender. The Capitulator. One of them is yours.

HOW IT WORKS
• Detect — COYL learns the moments you tend to lose: the time, the trigger, the sequence.
• Interrupt — a surgical nudge in the 3-second window, not a daily reminder you'll mute.
• Recover — slipped? Re-enter the same night. No "start over Monday."

WHAT COYL IS NOT
Not a habit tracker. Not a chatbot. Not a wellness journal you fill out and forget. COYL is the missing behavioral interface between AI and real life — built to act in the moment, not to log it after.

Behavioral support, not medical treatment. COYL does not diagnose, treat, or cure anything.

Take the audit. Meet your archetype. Let it catch you.
```

**What's New (first release):**
```
First public release. Take the 90-second audit, meet your autopilot archetype, and schedule your first interrupt. Welcome to COYL.
```

**Support URL:** `https://www.coyl.ai/safety` · **Marketing URL:** `https://www.coyl.ai`
**Privacy Policy:** `https://www.coyl.ai/privacy`

---

## Android — Play Console fields

**Title (≤30):** `COYL: Catch Your Autopilot`
**Short description (≤80):** `Meet your autopilot archetype, then get caught in the moment before the loop.`
**Full description (≤4000):** *(reuse the iOS description above)*
**Category:** Lifestyle · **Tags:** habits, self-improvement, focus, accountability

---

## Screenshots (5) — use the archetype cards you already render

The `/card/[slug]` 9:16 surfaces are the hero assets. Capture at
1290×2796 (6.7"):

1. **The hook** — "Which autopilot are you?" over the six-family grid.
2. **The reveal** — a single archetype card (e.g. The 9 PM Negotiator) with its "1 in N" rarity pill.
3. **The interrupt** — a phone-lock-screen mock of a 3-second-window nudge ("It's 9:14. You said tonight was different.").
4. **The recovery** — "Slipped at 9? Back on at 9:30. No Monday reset."
5. **The audit** — "90 seconds. 3 questions. No signup." → the archetype list.

15-second preview: the audit → reveal → share-card flow.

---

## App Privacy ("nutrition label") — answer honestly

Given the current build collects analytics (PostHog) + optional HealthKit:
- **Data used to track you:** None (don't enable cross-app tracking).
- **Data linked to you:** Identifiers (account), Usage Data (product analytics), Contact Info (email, for the waitlist/account).
- **Health & Fitness:** ONLY if you keep HealthKit on — declare Fitness (steps), Sleep, Heart Rate. **Drop "Body Measurements" by removing the `weight` read (decision #1).**
- HealthKit data is used **on-device for danger-window detection** and is **not** sold or used for ads — state this in the review notes.

---

## Review-risk notes (pre-empt rejection)
- **No weight-loss / outcome claims** anywhere — the description is behavioral only. Keep it that way.
- **"Behavioral support, not medical treatment"** appears in the description (and is in the app) — this is the line that keeps you out of the medical-device lane.
- If you keep HealthKit, add a clear review note: *"HealthKit signals are read on-device to time behavioral nudges; COYL writes nothing to HealthKit and makes no medical claims."* (Matches `NSHealthUpdateUsageDescription` = "COYL does not write to HealthKit.")
- Account deletion: ensure `/safety` or settings links an account-deletion path (Apple requires it for accounts).
