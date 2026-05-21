# COYL Product Roadmap v3 — The 5 Missing Pieces

> Companion to `strategy-v3.md`. That doc is *what we're selling and how
> it's funded.* This doc is *what we're building and in what order.*

COYL has one genuinely hard thing right: timing. It fires before the
behavior. JITAI research, Gollwitzer's if-then implementation
intentions, and the 30-year habit-loop literature all confirm: the
3-second window between trigger and action is the only window that
matters. Most apps miss it entirely. COYL doesn't.

**But timing alone is a feature, not a moat.** Five gaps separate
COYL-today from a defensible $4B-scale product.

---

## Gap 1 — The Signal Problem (COYL is flying blind)

**Current state:** The danger-window-learner cron computes a
`(day × hour)` histogram from self-reported slips. That's a calendar,
not a sensor. It tells you that you usually fail on Thursday nights;
it can't tell you you're about to fail *right now* because you just
got a stressful text, you've been sedentary for 4 hours, and your
phone battery is at 12%.

**What's missing:** Passive sensing signals that predict the slip
before the user knows it's coming.

The behavioral science is unambiguous. Smartphone-based stress
detection achieves ~92% accuracy in research settings (Saeb et al.;
Sano + Picard; Wang et al.). The most effective JITAI systems use
contextual data (accelerometer, screen time, location, calendar,
heart rate) — not just self-report history.

**What COYL needs:**
- Accelerometer (sedentary for X hours = elevated risk)
- Screen-on time (doom-scroll spike = pre-slip signal)
- Location class (home vs. out at 10pm = different risk profiles)
- Calendar context (meeting-density stress, end-of-week pressure)
- Heart rate via Apple Health / Google Fit (**data already integrated
  at Premium tier — currently unused for danger-window prediction**)

The moat is not "we send a push at 9pm." The moat is "we know you're
about to do it before you do." That requires a signal layer, not a
schedule.

**Build cost (corrected):** 4–6 months. The data plumbing exists in
the cron; ingestion patterns + battery optimization + privacy
disclosures + Apple Watch app project are the real work.

---

## Gap 2 — The Replacement Problem (COYL stops but doesn't redirect)

**Current state:** COYL interrupts the script but doesn't give the
brain a satisfying alternative route. The current rescue flow says
"drink water + walk 5 min" — generic. The brain running on cortisol +
craving dopamine doesn't get satisfied. Within 4–7 minutes the user is
back at the fridge.

**What's missing:** Personalized replacement behaviors that deliver
the same underlying reward through a different route.

The behavioral economics: cue → routine → reward is biological. You
can't remove the routine without replacing the reward. The user who
opens the fridge at 10pm isn't hungry — they're seeking comfort,
stimulation, or relief from boredom. Three different drives, three
different redirects:

- **Comfort-seeker:** warm drink + 90-second body scan
- **Stimulation-seeker:** voice memo to a friend, one specific saved video
- **Boredom-reliever:** 3-minute mobile game, a specific playlist, a
  micro-task from a list they built during onboarding

**Build cost:** 3–4 engineer-weeks. Onboarding quiz maps drive
profile, builds a personal redirect menu, rescue prompt pulls from
that menu.

**Why this is the highest-ROI ship available right now:** the rescue
flow is the moment of highest engagement. A generic redirect is the
biggest leak in 30-day retention. Replace it and 30-day retention
moves 30–50% in either direction depending on personalization
quality.

---

## Gap 3 — The Identity Problem (score, not story)

**Current state:** The Self-Trust Score measures outputs (interrupts
fired, recovery rate). The `/autopsy` page recites stats. The user
isn't seeing *who they're becoming.*

**What's missing:** An identity narrative that compounds over time.

James Clear's research is unambiguous: outcome-based habits fail at
~8 weeks. Identity-based habits persist indefinitely. The difference
is whether the user tracks "I stopped binging 7 times" vs. "I am
becoming someone who doesn't do that."

COYL has the data to build the identity narrative. Every successful
interrupt, every recovery, every pattern broken is evidence of an
emerging identity. Right now that data sits in a score, not a story.

The user needs to see:

> *"8 weeks ago you opened the fridge at 10pm 4× a week. This week:
> 0. You are no longer a night eater. That identity is gone. Here's
> what replaced it."*

This isn't motivational copy. It's a factual identity statement
backed by the user's own behavioral data. No other app can generate
this because no other app has the interrupt data.

**Build cost:** 2 engineer-weeks. New AI prompt template for the
weekly autopsy that emphasizes identity-shift over count-recitation.
Frontend already exists at `/autopsy`.

---

## Gap 4 — Context Portability (COYL lives in the phone)

**Current state:** The phone is the worst place to catch most
autopilot scripts. The fridge isn't near your phone. The cigarette
is smoked outside. The gambling happens on a laptop. The angry text
is typed before the interrupt can fire.

**What's missing:** Off-phone interrupt surfaces.

| Surface | Use case | Build effort |
|---|---|---|
| **Apple Watch app** | Haptic interrupt at the wrist before phone is picked up | 8–12 weeks (watchOS project) |
| **Browser extension** | Tab-switch interrupt for procrastination / doom-scroll | 8–12 weeks (Chrome / Firefox / Safari + store reviews) |
| **Smart home hooks** | Smart-fridge interrupt — defer to Y3+ | Speculative |

**The browser extension is the single biggest under-built product in
the procrastination market.** No tool today intercepts the tab switch
at the moment of opening. COYL's interrupt engine applied to browser
behavior is a separate killer product — and it requires no new AI,
just a new surface.

Once shipped, the browser extension opens the entire knowledge-worker
B2B channel. It's the highest-novelty new product surface on this
list.

---

## Gap 5 — Social Architecture (accountability built wrong)

**Current state:** Accountability Partner loop (Plus tier) is
passive — you share progress with a friend. Fitbit 2012 model.
Doesn't work long-term because accountability without consequence
fades.

**What's missing:** Asymmetric commitment contracts with real stakes.

The behavioral economics research on commitment devices (StickK,
Beeminder, Karlan + Ashraf) is 30 years old and ironclad: commitment
devices with real stakes are 2–3× more effective than pure
accountability.

**What actually works:**

1. **Directed commitment contracts** — user commits to a specific
   behavior, escrows $X, referee verifies outcome, money goes to a
   chosen destination on failure.

2. **Pod accountability with consequence** — Challenge Pods need a
   stakes layer. The pod loses something if a member quits. Social
   obligation is the strongest behavioral anchor that exists.

**The regulatory note:** "Anti-charity" stakes (money to a cause the
user opposes) is regulatorily fraught. StickK has dealt with this;
multiple jurisdictions have challenged the model. **For COYL v1,
stick with positive-charity stakes (GiveDirectly via Stripe Connect
— already shipped).** Anti-charity is a Y2 feature after regulatory
review.

**Pod stakes (NOT anti-charity) ARE shippable safely.** If 5 friends
pod-commit and one quits, the pod loses something tangible (shared
streak, group feature access). Social-consequence framing without the
legal landmine.

**Build cost:** 4 weeks for pod stakes on top of existing Stake
model. Year 2 for anti-charity routing.

---

## The Moat Statement

These five gaps aren't cosmetic. Together they define the
architecture of a defensible product:

1. **The signal layer** makes COYL's timing real rather than scheduled.
   No competitor can replicate a personalized danger model trained on
   your specific physiological + behavioral signals.

2. **The replacement library** makes COYL actually change behavior
   rather than just block it. This converts the 30-day trial user
   into a 3-year user.

3. **The identity narrative** creates the psychological switching
   cost no competitor can purchase. Your history of interrupts,
   pattern evolution, identity arc — that data exists nowhere else
   and cannot be migrated.

4. **Off-phone surfaces** (Watch + browser extension) make COYL
   ambient rather than reactive. Ambient ≠ app. Infrastructure
   doesn't churn.

5. **Commitment contracts** add the final behavioral anchor — the
   one mechanism that actually works when motivation fails, which is
   every time except the first week.

---

## Build Sequence (corrected timing)

**Order of expected ROI, not order from the original doc:**

1. **Identity narrative refresh** (Month 1, 1–2 weeks) — fastest ROI.
   Leverages the `/autopsy` cron we already ship. Change the
   template, ship the win.

2. **Replacement library** (Month 1–2, 3–4 weeks) — onboarding quiz
   + redirect engine. Highest retention impact available.

3. **Passive signal layer v1: phone-only** (Month 3–4, 6 weeks) —
   accelerometer + screen-time + HealthKit data we already have.
   Defer Watch app to Month 6+.

4. **Browser extension** (Month 4–7, 12 weeks) — bigger than first
   estimated, but the highest-novelty new product surface. Opens
   the knowledge-worker B2B channel.

5. **Pod accountability with consequence** (Month 6–8) — group-stake
   mechanic via existing Stripe Connect rails. NOT anti-charity yet.

6. **Apple Watch app** (Month 8–11) — separate watchOS project,
   8–12 weeks.

7. **Anti-charity stakes** (Year 2) — after regulatory review clears
   the structure.

8. **Smart home hooks** (Year 2+) — speculative until then.

---

## What this gets us at Series A

By Month 12, with items 1–4 shipped:
- Personalized replacement engine (retention multiplier)
- Identity narrative (switching-cost moat)
- Passive signal predictor (timing moat)
- Browser extension (new channel + B2B unlock)
- Live RCT data (clinical multiplier in the pipe)

This is what justifies the $80–130M Series A valuation. Each piece
is necessary. Together they make the moat that pure SaaS competitors
cannot replicate in <18 months.

---

*Product roadmap v3 — May 2026. Update after every ship with what
moved + what slipped + what the next bottleneck is.*
