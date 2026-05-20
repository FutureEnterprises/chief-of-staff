# COYL — Seed Deck

> Stop the script before it runs your life.

**Round:** $4–6M Seed at $20–30M pre
**Stage:** Working product live on coyl.ai · clinical study protocol open
**Asking:** 12-month runway to first GLP-1 partner live + $9M ARR
**Date:** May 2026
**Founder:** Iman Schrock · iman@coyl.ai

---

## How to use this file

Each `## Slide N` block is one slide. Body copy on the slide is the
markdown content. *Italicized "Speaker notes"* are the talk track — never
on the slide itself, only in your head when delivering.

13 slides. Designed for a 12-minute pitch + 18-minute Q&A.

Target investors:
- a16z Bio (GLP-1 + clinical angle)
- Founders Fund (behavior change + AI)
- a16z Consumer
- Strategic angels: Hims, Ro Body, Calibrate, Noom alumni

---

## Slide 1 — Cover

# COYL

### Stop the script before it runs your life.

Real-time pattern interrupt for the moment before you fold.

**Iman Schrock · iman@coyl.ai · coyl.ai**

*Speaker notes: 5 seconds. Do not read the slide. Open with the
problem before they look at the deck.*

---

## Slide 2 — The Problem

# You know what to do.

# You don't do it.

Every behavior-change app intervenes **before** the moment (reminders) or
**after** the moment (journaling).

None intervene **in** the 3-second window between trigger and action.

That's where every diet fails. Every focus block dies. Every GLP-1 user
regains the weight.

*Speaker notes: This is the pain. State it as a fact, not a hypothesis.
Every adult in the room has lived this moment. Don't argue for the
problem — name it and watch them nod.*

---

## Slide 3 — The Insight

# The 3 seconds nobody else fights for

```
       TRIGGER → [ 3-SECOND DRIFT ] → ACTION
                       ↑
                  This is COYL.
```

**Habit trackers** reward you the morning after.
**Noom** coaches you in the afternoon.
**Calm** runs a meditation later.
**COYL** fires at 9:47 PM when you're standing in front of the fridge.

The window is real. It's been studied for 30 years (JITAI, EMA, habit
automaticity research). Nobody has built the product surface for it.

*Speaker notes: This is the elevator pitch. If they only remember one
slide, this is it. The "3 seconds" is sticky. Repeat it twice. The
academic citations are for credibility — name them only if asked.*

---

## Slide 4 — How It Works

# Detect. Interrupt. Recover.

**1. Detect** — User maps their danger windows during onboarding
(time × context × trigger). Model sharpens from slip history over 4–6
weeks.

**2. Interrupt** — At the window, a push fires across mobile, web, or
SMS — whichever the user is on. Contains: the pattern call, the next
move, a 10-min delay timer, recovery flow.

**3. Recover** — User slips anyway? 2-hour and 24-hour follow-up.
Streak preserved. No Monday reset. Same-night recovery as the brand
promise.

Three engines. One model. Twelve consumer-facing surfaces shipped.

*Speaker notes: Demo this live if possible. Pull up coyl.ai/today on
your phone — show the real-time intervention banner. Show the rescue
flow. Show the recovery mode UI. If they see it once, they get it. The
demo closes 40% of the meeting on its own.*

---

## Slide 5 — Why Now

# The category just appeared

**1. GLP-1s exposed the gap.** 10M+ US patients on Ozempic / Wegovy /
Mounjaro. **60–80% regain weight within 2 years of stopping.** The drug
suppresses appetite chemically; it doesn't touch the behavioral script.
Behavioral relapse prevention is now a $50B problem.

**2. Real-time AI is finally cheap.** Per-event LLM inference at <$0.001
makes "fire at the exact moment" economically possible for a $19/mo
consumer product. Three years ago it wasn't.

**3. JITAI evidence base matured.** 200+ peer-reviewed studies, NIH
funding, behavioral medicine consensus. The science is ready; nobody
shipped the consumer surface.

**4. Incumbents can't pivot.** Their DAU metrics depend on session
length, not push-first delivery. Architectural mismatch. (See Slide 8.)

*Speaker notes: This is the "why now" — investors who skipped the
behavior-change category in 2018–2023 hear this and unblock their
priors. Hit GLP-1 hardest; it's the wedge that gets the partner deals.*

---

## Slide 6 — Three Businesses, One Engine

# Stack the wedges. Sequence them.

| Business | Revenue | Path to $100M | When |
|---|---|---|---|
| **D2C consumer** | $19–49/mo subscription | 175K paid × $19 × 12 = $40M | Months 0–24 |
| **GLP-1 partner platform** | $10 PMPM via telehealth | 250K covered × $10 × 12 = $30M | Months 6–24 |
| **Behavioral interrupt SDK** | $0.05/interrupt + platform fee | 10M events/mo × $0.05 × 12 = $6M | Months 12–24 |

Consumer first → manufactures the proof BD needs.
GLP-1 partner second → unlocks the highest dollar-per-deal channel.
SDK third → the platform ceiling once the model has 12+ months of data.

**Total Month 24 target: $80M ARR base case · $100M aggressive scenario.**

*Speaker notes: This is the only complicated slide. Walk it
left-to-right. The "$80M base / $100M aggressive" honesty matters —
don't claim $100M as the base case. Sophisticated investors smell that.*

---

## Slide 7 — What's Already Shipped (Traction)

# 30 days. One founder. Real surface area.

**Product:**
- Real-time intervention surface on `/today` (fires when user inside a mapped danger window)
- 3 interrupt crons: danger-window, GLP-1 day-3, post-slip (2h + 24h waves)
- Web Push + Expo Push end-to-end with consent architecture
- SMS funnel-compression at `/catch-me`
- Recovery Engine with no-Monday-reset framing
- Consent feedback loop (caught me / wasn't the moment → trains the model)
- 4-tier pricing live with overage credits in spec

**Public surface (13 pages):**
- `/`, `/how-it-works`, `/pricing`, `/research`, `/clinical-study`
- `/glp1`, `/weight-loss`, `/procrastination`, `/teams`, `/destructive-behaviors`
- `/decision-support`, `/recovery`, `/autopilot-map`, `/science`, `/changelog`

**Clinical:**
- 12-week IRB-friendly behavioral RCT protocol open for partner enrollment
- Tests GLP-1 maintenance → 90-day post-discontinuation regain
- Partner outreach pack drafted (4 templates: telehealth, clinic, lab, follow-up)

**Compliance:**
- Account deletion + data export (Apple 5.1.1(v) + GDPR Art. 17)
- HIPAA-aligned data handling + DUA template

*Speaker notes: This is the slide that closes the deal. Most pre-seed
companies pitch this as their Series A roadmap. We've shipped it.
Investors who underwrite execution risk get this immediately.*

---

## Slide 8 — The Moat

# The incumbents have financial incentives NOT to build this.

| Incumbent | Engagement metric they sell to investors | What our surface breaks |
|---|---|---|
| **Noom** | Daily lesson completion | Lesson-based content irrelevant in the 3-second drift window |
| **Calm / Headspace** | Daily session minutes | Push-first surface reduces in-app time |
| **BetterUp** | Coach-session frequency | Real-time AI substitutes the coach for first response |
| **Hims / Ro** | Prescription renewal rate | GLP-1 companion cuts off-drug churn but cannibalizes new-script flow |

Each incumbent's valuation is predicated on a specific engagement metric
that a push-first JITAI surface **directly cannibalizes**.

They can copy features. They cannot copy the architecture without
breaking their own investor narrative.

**Second-order moat:** Every interrupt + feedback signal trains the
timing model. After 100K users × ~5 events × 12 months = 6M tagged
moments — a defensible dataset for the SDK pitch.

*Speaker notes: This is the question they ask in the second call ("why
hasn't Noom built this?"). Answer it here, not when they ambush you.
The structural argument is more durable than "we move faster" — moving
faster isn't a moat.*

---

## Slide 9 — Business Model + Unit Economics

# 4 tiers. Overage credits. PMPM. Per-event SDK.

**Consumer (live):**
- Free · $0 — 25 commitments, 20 AI charges/mo
- **Core · $19/mo · $179/yr** — full rescue + recovery + pattern detection
- Plus · $29/mo · $279/yr — accountability partner + precision interrupts
- Premium · $49/mo · $469/yr — financial stakes + scenario sim + health integrations

**Overage (shipping Month 2):**
- 100 credits = $4.99, sold *during* danger windows when intent peaks

**GLP-1 partner (shipping with first deal):**
- $10 PMPM, contract term 24 months, outcomes-co-authored

**SDK (Month 12+):**
- $0.05 per delivered interrupt + monthly platform fee

**CAC payback (mid-case):**
- 45% 12-mo retention · $80 blended CAC · $19 ARPU → **5.0 months payback**

*Speaker notes: The overage trick is the part that gets a "huh" from
investors who've seen Lovable's curve. The "during a danger window" is
the moment-of-peak-intent unlock — different from every other usage
pricing they've seen.*

---

## Slide 10 — Go-to-Market

# Five compounding plays, run in parallel

**Week 1–2** · `/audit` quiz to homepage hero · 20 creator seeds · 30K
completions / 30 days

**Week 2–4** · Reddit + community seeding · r/loseit, r/GLP1, r/ADHD ·
target 1 viral run, ~20K outbound clicks

**Month 1–3** · Creator UGC engine · $80–100K budget · 20 deep partners ·
brief: "Show the moment COYL caught you. Not the win — the moment before."

**Month 2–6** · GLP-1 partner sprint · BD hire month 1 · target Found,
Ro, Hims, Calibrate · first LOI Month 5, signed pilot Month 8–9

**Month 6–12** · Employer pilots via channel partners (Wellhub, Virgin
Pulse, Lyra) · 3–5 logos by Month 12

**Month 12–18** · SDK announcement after 12+ months of model data ·
"Stripe of behavior change" pitch becomes defensible

*Speaker notes: Don't read this. Pick one play and tell a 30-second
story about it. The /audit quiz is the easiest to demo — show the MBTI-
of-self-sabotage result on your phone.*

---

## Slide 11 — Team

# Today: solo founder, real shipping cadence

**Iman Schrock — Founder / CEO**
- Building COYL since [date]
- Product, engineering, and ops to date
- Background: [your prior context — 1–2 lines max]
- iman@coyl.ai · linkedin.com/in/iman

**Advisors (closing this quarter):**
- Behavioral science PI (clinical study lead) — TBD
- Telehealth Rx founder/operator — TBD
- Consumer growth (ex-Noom/Calm/Headspace) — TBD

**Seed hires (first 90 days):**
1. **Senior full-stack eng** ($170–200K + equity) — Month 0
2. **Growth / community lead** ($120–150K + equity) — Month 1
3. **BD lead, telehealth Rx Rolodex** ($180–220K + equity) — Month 2
4. **Designer** ($130–160K + equity) — Month 3

**Honest acknowledgment:** Solo-founder companies in this category cap
near $5M ARR before the founder becomes the bottleneck. The Seed funds
the team that gets past that ceiling. Underwriting the next 4 hires,
not the next 4 years.

*Speaker notes: Don't apologize for being solo. Lead with the velocity
proof from Slide 7 — solo founders who can ship at this rate are rare.
The honest cap acknowledgment is what gets investors to lean in. False
confidence here gets you killed.*

---

## Slide 12 — The Path to $100M

# 24 months. Two scenarios. Both real.

|  | Month 6 | Month 12 | Month 18 | Month 24 |
|---|---|---|---|---|
| **Base case** | $750K | $9.2M | $36M | **$80M** |
| Aggressive | $1.5M | $13M | $50M | **$100M** |

**Base case assumes:**
- 45% 12-month retention (recovery engine validated month 3)
- $80 blended CAC
- First GLP-1 partner signed Month 8, live Month 12
- SDK first revenue Month 18

**Aggressive scenario requires:**
- Viral quiz / interrupt-card hit by Month 4
- Two GLP-1 partners by Month 12 (not one)
- 50%+ retention (recovery engine outperforms category)
- SDK with 3 anchor partners by Month 18

**The silent bet:** the recovery engine delivers better-than-category
retention. We'll measure in the first 90 days of paid users and
re-underwrite.

*Speaker notes: Don't oversell the aggressive scenario. Base case +
honest-about-the-bet is more credible. Anyone who's seen behavior-
change-app retention math will respect this slide more than a $100M
hockey stick.*

---

## Slide 13 — The Ask

# $4–6M Seed · 12 months · $9M ARR + 1 GLP-1 partner live

**Use of funds:**
- $1.8M — Engineering (3 senior hires + designer)
- $1.0M — Growth (community lead + $100K creator budget + paid acq)
- $0.6M — BD (lead + travel + partner pilot infra)
- $0.4M — Clinical (PI fees + IRB + manuscript)
- $0.3M — Compliance + legal (HIPAA, BAA, DUA templates, mobile review)
- $0.4M — Infra + tooling (Vercel, Supabase, Anthropic, Twilio, Resend)
- $1.0M — 12-month operating buffer

**Valuation:** $20–30M pre-money

**Next milestone:** $9M ARR · 1 GLP-1 partner live · 45% retention
validated · Series A at $80–130M post on $9M ARR

**Close window:** target close in 8 weeks. Want a lead with check size
$1.5–3M; remainder closes pro-rata with strategic angels from Hims, Ro,
Calibrate, Noom alumni.

*Speaker notes: This is the close. Don't trail off. State the ask, the
milestone, and the close window. Then stop talking and let them
respond.*

---

## Closing — One Slide They Won't See

(For your own pocket. Don't put this on the deck.)

The fastest path to $100M isn't a roadmap. It's a constraint: every
quarter the company must look unrecognizable from the previous one.

PMF expires every three months at this growth rate.

That's the game. We've shown we can ship at that cadence with one
founder. The Seed funds the team that does it for 24 more months.

---

## Appendix slides (use as needed in Q&A)

### A1 — Clinical study one-pager

12 weeks. N=80. Randomized 1:1. Minimal-risk expedited IRB pathway. Open
for partner enrollment. Full protocol at coyl.ai/clinical-study.

Primary outcome: weight regain at 90 days post GLP-1 discontinuation.

Secondary outcomes: program adherence, late-night eating frequency,
slip-recovery time, retention.

Sample size justification: feasibility + effect-size estimation.

### A2 — Competition comparison matrix

| Dimension | Noom | Calm | BetterUp | Hims | **COYL** |
|---|---|---|---|---|---|
| Real-time pattern interrupt | ❌ | ❌ | ❌ | ❌ | ✅ |
| GLP-1 companion | ❌ | ❌ | ❌ | ✅ | ✅ |
| Recovery engine (no Monday reset) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Push-first surface | ❌ | ❌ | ❌ | ❌ | ✅ |
| Per-event AI inference | ❌ | ❌ | ❌ | ❌ | ✅ |
| Clinical study in field | ❌ | ❌ | ❌ | Partial | Protocol live |

### A3 — Risk register

| Risk | Mitigation |
|---|---|
| Solo founder bottleneck | First Seed hire is senior eng (Month 0) |
| App Store rejection | Behavioral-support framing reviewed; export/delete shipped |
| Push opt-in rate | Consent-architecture banner with transparency, defaults opt-in |
| GLP-1 partner cycle length | Multiple LOIs in parallel; clinical protocol shortens evaluation |
| Recovery-engine retention misses | 90-day measurement + model re-underwriting |
| Anthropic / model cost spike | Tier limits + Upstash rate-cap; multi-model fallback path |

### A4 — Press / public proof points

- coyl.ai/changelog (public build cadence)
- coyl.ai/research (live outcomes)
- coyl.ai/clinical-study (IRB-pathway-mapped protocol)
- Sentry-instrumented production logs (available on request)
- GitHub commit history (~150 commits over last 30 days)

### A5 — What we won't do

- No medical claims. COYL is behavioral support, not treatment.
- No addiction language in marketing. "Destructive patterns" or "craving
  loops" — App Store and platform safety posture.
- No data brokerage. User data never sold. Deletion + export shipped on
  day one.
- No dark patterns on streak loss. Recovery engine framing throughout —
  shame is the competitor we're displacing.

---

*Seed deck — May 2026. Confidential. Iman Schrock · iman@coyl.ai*
