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
makes "fire at the exact moment" economically possible at a $9.99/mo
consumer price point. Three years ago even a $19/mo product couldn't
have absorbed the inference cost.

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

| Business | Revenue (Scenario B / live) | Path to $100M | When |
|---|---|---|---|
| **D2C consumer** | Free → $9.99 Core → $19.99 GLP-1 | 400K paid × $11.50 blended × 12 ≈ $55M | Months 0–24 |
| **GLP-1 partner platform** | $5–$15 PMPM via clinics + employers | 250K covered × $10 × 12 = $30M | Months 6–24 |
| **Behavioral interrupt SDK** | $0.05/interrupt + platform fee | 10M events/mo × $0.05 × 12 = $6M | Months 12–24 |

Consumer first → manufactures the proof BD needs.
GLP-1 partner second → unlocks the highest dollar-per-deal channel.
SDK third → the platform ceiling once the model has 12+ months of data.

**Total Month 24 target (Scenario B): $80–90M ARR base case · $100M
aggressive scenario.** Scenario A's $19/$29/$49 pricing reaches the
same $100M target with ~40% fewer paid users; see Slide 12 for the
full comparison.

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

# Two pricing scenarios. Launching with the conservative one.

**Scenario B — live on coyl.ai today (consumer-led launch):**
- Free · $0 — audit + archetype card + 1 behavior loop
- **Core · $9.99/mo · $99/yr** — full rescue + recovery + pattern detection
- **Plus · $19.99/mo · $199/yr — GLP-1 Companion** (weight maintenance
  + rebound coverage; this is the high-intent ARPU lane)
- Clinics & Employers · $5–$15 PMPM — outcomes-tracked B2B
- Enterprise / API — bespoke partner pricing

**Scenario A — upmarket fallback (premium clinical-led, documented
for the deck only):**
- Free trial → Core $19/mo → Plus $29/mo → Pro $49/mo (coach-supported)

We are launching with Scenario B. Scenario A is the trade-up the company
runs if consumer pricing power proves higher than expected after Month
3 of paid-user data. Both scenarios are modeled on Slide 12.

**Overage (shipping Month 2):**
- 100 credits = $4.99, sold *during* danger windows when intent peaks

**GLP-1 partner (shipping with first deal):**
- $10 PMPM, contract term 24 months, outcomes-co-authored

**SDK (Month 12+):**
- $0.05 per delivered interrupt + monthly platform fee

**CAC payback (mid-case, Scenario B):**
- 50% 12-mo retention · $35 blended CAC · ~$11.50 blended ARPU
  (mix of $9.99 Core + $19.99 GLP-1 paid users) → **~6 months payback**

**CAC payback (mid-case, Scenario A):**
- 45% 12-mo retention · $80 blended CAC · $19 ARPU → **5.0 months payback**

*Speaker notes: Scenario B lowers ARPU but compresses CAC because the
free audit funnel is virality-shaped — referral coefficient is what
funds the model, not ad spend. The overage trick still works in
Scenario B; the "during a danger window" is the moment-of-peak-intent
unlock — different from every other usage pricing they've seen.*

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

## Slide 12 — The Path to $1.5–4B

# 5 years. Four layers. Compounding. Two pricing scenarios.

### Scenario A — Premium clinical-led ($19 / $29 / $49)

| Year | Consumer | Enterprise | API | Clinical | Total ARR | Valuation |
|---|---|---|---|---|---|---|
| Y1 | $5M | $0.5M | $0 | $0 | **$5.5M** | $77M |
| Y2 | $18M | $5M | $1M | $0 | **$24M** | $384M |
| Y3 | $38M | $20M | $6M | $1M | **$65M** | $1.2B |
| Y4 | $60M | $45M | $15M | $4M | **$124M** | $1.7B |
| Y5 | $80M | $70M | $30M | $20M | **$200M** | $3.6B |

### Scenario B — Consumer-led launch (LIVE on coyl.ai today)

Free audit + archetype + 1 behavior loop · Core $9.99/mo · GLP-1
Companion $19.99/mo · Clinics + Employers $5–$15 PMPM.

Assumptions: ~2.5× the paid user count (free-audit funnel + lower price
point widen the top of funnel), but ~50–55% of Scenario A's per-paid-user
ARPU. Enterprise + API + Clinical lines do not change materially —
Scenario B only re-prices the consumer column. Mix-shift to the $19.99
GLP-1 tier matters: assumed 35% of paid users at Y1, climbing to 45% by
Y3 as the GLP-1 wedge sharpens.

| Year | Consumer | Enterprise | API | Clinical | Total ARR | Valuation |
|---|---|---|---|---|---|---|
| Y1 | $3.5M | $0.5M | $0 | $0 | **$4.0M** | $56M |
| Y2 | $13M | $5M | $1M | $0 | **$19M** | $304M |
| Y3 | $27M | $20M | $6M | $1M | **$54M** | $972M |
| Y4 | $44M | $45M | $15M | $4M | **$108M** | $1.5B |
| Y5 | $60M | $70M | $30M | $20M | **$180M** | $3.0–3.2B |

Scenario B lands at ~75% of Scenario A's Y5 ARR. The valuation gap
narrows after Y3 because Enterprise + API + Clinical multiples don't
change with consumer ARPU.

### Why we are launching with Scenario B

The $4B story is not ARPU-first. **It is behavior graph + category
control + strategic acquisition.** The free audit drives the data
engine that underwrites the API moat (Slide 8). The $19.99 GLP-1 tier
captures the high-intent paid ARPU where willingness-to-pay is highest.
The $9.99 consumer tier is acquisition pricing optimized for virality,
not LTV — the goal is to control the category name before Noom, Calm,
or Headspace can ship a JITAI surface, not to extract the maximum
monthly check from each user.

If Scenario B's consumer pricing power proves higher than projected
(measured at Month 3 of paid-user data alongside the retention silent
bet), the company trades up to Scenario A pricing for new cohorts. The
upside on Scenario A is preserved; the downside on Scenario B is
defended by the funnel volume.

**The structure that gets us there (both scenarios):**
- Consumer + Enterprise carry Years 1–3 (the cash floor)
- API launches at Month 18 after substrate engineering is real
- Clinical / payer is the Year 4–5 multiplier, **never the lifeline**

**The silent bet (named explicitly):** the recovery engine delivers
better-than-category retention (45%+ in Scenario A, 50%+ in Scenario B
because lower price reduces churn-by-pricing). Measured at Month 3 of
paid-user data, model re-underwritten if it misses.

**Why $4B at Year 5, not Year 4:** by Year 5 FDA clearance is real,
payer revenue is meaningful, the multiple legitimately compresses to
healthcare-grade 18–22×. Pushing $4B to Year 5 reads as discipline.
Scenario B lands the Y5 outcome at $3.0–3.2B — still a 60×+ return on
a $25M post-money seed.

*Speaker notes: Lead with Scenario B since that's what's live. Show
Scenario A as the upmarket option preserved in case consumer power
exceeds projections. Honest base case + named silent bet beats any
hockey-stick chart. Don't oversell Year 5 in either scenario.*

---

## Slide 12.5 — What Kills This Plan

# We name the risks. So you don't have to.

**1. Clinical study null result.** Probability: 15–25%. Mitigated by
pre-registered SAP, effect-size-estimation design. Consumer +
enterprise lines survive without payer.

**2. App Store rejection.** Probability: 10–15% (recoverable in one
cycle). "Behavioral support, not medical treatment" framing
throughout. Account deletion + GDPR shipped.

**3. Stripe / payment regulatory issue on stakes.** Probability:
5–10%. Stakes is Premium-tier, GiveDirectly via Stripe Connect.
No anti-charity until regulatory review clears.

**4. Consumer retention misses 45%.** Probability: 30–40%. **This is
the real silent bet.** Measurement gate at Month 3. If <35%, reduce
CAC or pause paid acquisition.

**5. Pear scenario — payer dead zone outlasts cash.** Probability:
25–35%. Series A oversized to $18–22M specifically for 24–30 month
runway through this zone. Consumer + enterprise floor absorbs burn.

**6. Solo-founder ceiling at $5M ARR.** Probability: 50% if no early
senior hire. Seed funds first senior engineer Month 0.

*Speaker notes: This slide separates serious founders from pitch
founders. Sophisticated investors know these risks exist. Naming them
pre-empts the objection AND signals you've internalized the failure
modes. The Pear lesson is your strongest single argument with any
biotech-adjacent VC — they all know that story.*

---

## Slide 13 — The Ask

# $4–6M Seed → $18–22M Series A → $40–60M Series B

**Three tranches, each keyed to a proof point. Series A deliberately
oversized to survive the payer-channel dead zone.**

### Seed (now) · $4–6M @ $20–30M pre

12-month runway. Use:
- $1.8M Engineering (3 senior hires + designer)
- $1.0M Growth (community + creator partnerships + paid acq pilot)
- $0.6M BD (telehealth Rx-Rolodex lead)
- $0.4M Clinical (PI fees + IRB + manuscript)
- $0.3M Compliance + legal
- $0.4M Infra + tooling
- $1.0M Operating buffer
- $0.5M Reserved for first API partnership

**Show at A:** $9M ARR · 1 GLP-1 partner live · 1 signed API LOI ·
RCT in progress · 45% retention validated.

### Series A · $18–22M @ $80–130M pre (Month 12–15)

**The oversizing is the point.** $18–22M (not $12–15M) specifically
to survive the 24–30 month payer-channel dead zone between RCT
submission and payer revenue. This is the **Pear Therapeutics
mitigation** — Pear had FDA clearance and went bankrupt because
payer adoption was slower than burn rate.

Use:
- $6M Engineering scale (18-person team, 4 layers)
- $4M Enterprise GTM
- $2.5M Clinical (FDA filing + payer pre-engagement)
- $2M API platform team
- $2.5M Consumer paid acquisition
- $1.5M Operating buffer through Month 30

### Series B · $40–60M (Month 30–36)

At $40M+ ARR, FDA filing in review, 2+ payer LOIs, API GA.

**Close window:** Seed target close in 8 weeks. Lead check size
$1.5–3M; remainder closes pro-rata with strategic angels from Hims,
Ro, Calibrate, Noom alumni.

*Speaker notes: The Series A oversize line is your strongest move
with biotech-adjacent VCs. Lead with it. They all know the Pear
story. "Sized to survive the dead zone" reads as discipline. Don't
trail off — state the ask, the milestone, and the close window. Then
stop talking.*

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
