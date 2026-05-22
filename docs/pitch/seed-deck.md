# COYL — Seed Deck

> Stop the script before it runs your life.

**Series A pitch — May 2026 — $10M raise**

**Round:** $10M Series A at $40–50M pre (target $45M)
**Prior:** $4–6M Seed closed; this deck is the Series A pitch carried
forward on the same structure for continuity.
**Stage:** Working product live on coyl.ai · clinical study protocol
open · Layer 1–4 substrate scaffolded · 13 public pages shipped
**Asking:** 18-month runway to first GLP-1 partner live + $30M
consumer ARR + IRB-approved RCT in progress + FDA Q-Sub completed
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

**1. GLP-1s exposed the gap.** 12M+ US patients on Ozempic / Wegovy /
Mounjaro / Zepbound as of Q1 2026. **67% regain their pre-treatment
weight within 24 months of discontinuation** (STEP-1 extension data
+ SURMOUNT-4 follow-up + the May 2026 Eli Lilly real-world evidence
publication confirm the convergent ~67% figure across the three
largest cohorts). The drug suppresses appetite chemically; it doesn't
touch the behavioral script that drives the late-evening eating, the
weekend pattern, the stress eating, the social eating. Behavioral
relapse prevention is now a $50B problem, and the manufacturers (Novo,
Lilly) and the prescribers (Hims, Ro, Calibrate, Found, Sequence) all
know it — every regained patient is a restart prescription, a churn
event, or both.

**2. Real-time AI is finally cheap.** Per-event LLM inference at <$0.001
makes "fire at the exact moment" economically possible at a $12/mo
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

| Business | Revenue (single-tier model / live) | Path to $30M+ ARR consumer | When |
|---|---|---|---|
| **D2C consumer** | Free → $12 Core ($99/yr) + GLP-1 Plus $19.99 on /glp1 | 1M paying × $30.72 blended ARPU = **$30.7M** | Months 0–12 |
| **GLP-1 partner platform** | $5–$15 PMPM via clinics + employers | 250K covered × $10 × 12 = $30M | Months 6–24 |
| **Behavioral interrupt SDK** | $0.05/interrupt + platform fee | 10M events/mo × $0.05 × 12 = $6M | Months 12–24 |

Consumer first → manufactures the proof BD needs.
GLP-1 partner second → unlocks the highest dollar-per-deal channel.
SDK third → the platform ceiling once the model has 12+ months of data.

**Blended consumer ARPU = $30.72/user/year.** Built from a single-tier
collapse: Free (audit + 3 interrupts/week) and Core ($12/mo or $99/yr
as a commitment device). The GLP-1 $19.99 tier moves to /glp1 as a
page-native upsell — it stays in the model, just no longer on the main
pricing page.

Mix: **80% Free, 18% Core ($12 → $144/yr), 2% GLP-1 Plus ($19.99 →
$239.88/yr).** Blended = 0.8×0 + 0.18×144 + 0.02×239.88 = **$30.72**.

**Total Month 8 ambitious target: $30.7M consumer ARR + B2B pipeline.**
Single-tier pricing trades per-user ARPU for conversion rate and
funnel velocity — $12 sits under the deliberation line where buyers
stop asking "is this worth it?" and just decide. The honest trade-off:
~40% lower ARPU than the prior $9.99/$19.99 mix, but 2–3× the
free-to-paid conversion based on impulse-price benchmarks.

*Speaker notes: This is the only complicated slide. Walk it
left-to-right. Lead with the single-tier honesty — "we collapsed the
ladder to one price because tier ladders convert worse than a
confident number." The blended $30.72 ARPU is lower than category
benchmarks; the conversion rate is the offset. Don't oversell the
multiple at the same time.*

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
- `/glp1`, `/weight-loss`, `/procrastination`, `/teams`, `/recurring-loops`
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

# One paid tier. Impulse-priced. Annual is a commitment, not a discount.

### The headline cohort metric: Self-Trust Score

**Self-Trust Score is the cohort metric every revenue line compounds
off.** It is the single number COYL reports to investors, the board,
acquirers, and (in aggregate) to users.

**Definition:** a 0–100 composite of three signals:
1. **Catch rate** — % of mapped danger windows where the user
   self-reported "caught me" within the interrupt window
2. **Recovery latency** — time-to-recovery after a slip (median
   hours from slip to the user re-engaging the recovery flow)
3. **Pattern legibility** — model confidence that the user's
   autopilot script is well-mapped (signal density × consent
   feedback × interrupt-success rate)

**Why this metric:** it's the only metric that compounds across every
revenue line. Consumer retention compounds against Self-Trust Score.
PMPM contract pricing keys off Self-Trust Score deltas. The SDK is
priced against Self-Trust Score lift. FDA Q-Sub references Self-Trust
Score as the secondary endpoint.

**Cohort baseline (live data, n=187 paying users, 60-day cohort):**
- Median entry score: 22 / 100
- Median 60-day score: 41 / 100
- 60-day cohort lift: **+86%** (19-point absolute lift)
- 90-day projection (n=42 reaching the gate): **median 49 / 100**

**The strategic premium underwrite:** the strategic acquirers
(Microsoft Viva, Apple Health, Meta Reality Labs) pay the premium
because the Self-Trust Score architecture is the substrate they'd
otherwise have to build themselves. Per the 6B Roadmap: "the metric
is the moat."

**Self-Trust Score is the metric we underwrite the cap table to.**

**Live on coyl.ai today — single-tier consumer model:**
- Free · $0 — audit + archetype card + 3 interrupts / week
- **Core · $12/mo or $99/year** — everything. Annual is presented as a
  commitment device ("commit to the year — put $99 against your
  pattern"). Not framed as a discount. $99/12 = $8.25/mo lands on the
  card; the framing on the page is the stake, not the percentage off.
- **GLP-1 Plus · $19.99/mo** — high-intent upsell surfaced ONLY on
  /glp1 (rebound-window protocol + clinician summary export + post-
  taper relapse-prevention). Not on main /pricing.
- Clinics & Employers · $5–$15 PMPM — outcomes-tracked B2B
- Enterprise / API — bespoke partner pricing

**Why one tier:** $12 sits under the $19.99 "is this worth it?"
deliberation line. Tier ladders convert worse than a single confident
number. We trade per-user ARPU for conversion velocity and category
control.

**Mix assumption + blended ARPU:**
- 80% Free
- 18% Core ($12/mo → $144/year)
- 2% GLP-1 Plus ($19.99/mo → $239.88/year)
- **Blended ARPU = 0.8×0 + 0.18×144 + 0.02×239.88 = $30.72/user/year**

**Overage (shipping Month 2):**
- 100 credits = $4.99, sold *during* danger windows when intent peaks

**GLP-1 partner (shipping with first deal):**
- $10 PMPM, contract term 24 months, outcomes-co-authored

**SDK (Month 12+):**
- $0.05 per delivered interrupt + monthly platform fee

**CAC payback (mid-case, single-tier model):**
- 50–60% 12-mo retention (single-tier reduces churn-by-pricing
  because the cheapest tier on the market gets fewer "I can't justify
  it this month" cancellations)
- $30 blended CAC (free-audit funnel + virality coefficient sharpened
  by impulse price point)
- ~$2.56/mo blended ARPU ($30.72/yr ÷ 12)
- **Payback math is dominated by paid-user ARPU**, not blended: paid
  ARPU ≈ $12.80/mo (mix of $12 Core + $19.99 GLP-1 Plus weighted 9:1)
  → at $30 CAC ÷ $12.80 paid ARPU = **~2.4 months payback on paid users**

**Honest trade-off named:** the single-tier collapse trades ~40% lower
per-user ARPU vs. the prior $9.99/$19.99/$5–15 ladder for 2–3× higher
free-to-paid conversion. The bet: at 1M paying users (Month 8 ambitious)
$30.72 × 1M = **$30.7M consumer ARR**, larger absolute number than
the prior model would have produced at the same funnel volume because
the conversion rate compounds against the lower price.

*Speaker notes: Lead with "we collapsed three tiers to one because the
ladder was a confidence problem, not a pricing problem." The blended
ARPU number is lower than category averages — own it. The offset is
the conversion rate and the funnel velocity, which is the bet you're
underwriting on the founder's product judgment. The annual $99
framing as a commitment, not a discount, is the third-rail signal —
"we don't sell coupons on this product" is the brand promise.*

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

## Slide 12 — The Path to $4–6B

# 5 years. Four layers. One paid tier. Strategic exit math at 17–25% probability.

### The single-tier consumer model — LIVE on coyl.ai

Free (audit + archetype + 3 interrupts/week) · **Core $12/mo or $99/year
(commitment device, not discount)** · GLP-1 Plus $19.99/mo surfaced on
/glp1 only · Clinics + Employers $5–$15 PMPM.

**Blended ARPU = $30.72/user/year** (80% Free + 18% Core $144/yr + 2%
GLP-1 Plus $239.88/yr).

The Month 8 ambitious target is 1M paying users (Core + GLP-1 Plus
combined) producing **$30.7M consumer ARR**. The trade vs. the prior
$9.99/$19.99 ladder is honest: per-user ARPU is ~40% lower, but the
impulse-price single-tier model converts 2–3× higher off the free
audit funnel. We trade ARPU for category control and funnel velocity.

### The Series A strategic-exit math

The deck-headline math, stated cleanly:

| Outcome | Price | Probability | $-weighted EV |
|---|---|---|---|
| Pure strategic ($4–6B, 18–24 mo) | $5.0B | **20%** | $1.00B |
| Hybrid strategic ($3–4.5B, 12–18 mo) | $3.5B | **35%** | $1.23B |
| Revenue-justified ($1.5–2B, 8–12 mo) | $1.75B | **30%** | $0.53B |
| No deal (stay private, return cash) | $0 | **15%** | $0.00B |
| **Probability-weighted exit** | | | **~$1.85B** |

**Strategic exit at $4–6B reads as the 17–25% upside band**, anchored
on the Microsoft Viva / Meta Reality Labs / Apple Health acquirer set
per the 6B Action Plan §1. We do not pitch the 20% case as the base
case. We pitch the probability-weighted $1.85B as the underwrite. The
$4–6B band is the upside that justifies the strategic-acquirer
preparation work in parallel with the operating model.

**Series A dilution math:** $10M raised at $45M pre / $55M post →
~18% Series A class. Probability-weighted exit $1.85B × 12% effective
post-dilution-and-downstream Series A ownership = **$222M expected
return to Series A investors on $10M invested = 22.2× MOIC**.

**Per-$1-raised math:** $1.85B probability-weighted exit ÷ $10M raised
= **$185 of expected exit value per $1 raised**. The closest comparable
(Manus $2B exit on $43M total raised) was $46/$1. We are pricing 4× the
Manus efficiency on a probability-weighted basis.

| Year | Consumer | Enterprise | API | Clinical | Total ARR | Multiple | Valuation |
|---|---|---|---|---|---|---|---|
| Y1 | $4M | $0.5M | $0 | $0 | **$4.5M** | 14× | $63M |
| Y2 | $15M | $5M | $1M | $0 | **$21M** | 16× | $336M |
| Y3 | $30M | $20M | $6M | $1M | **$57M** | 18× | $1.0B |
| Y4 | $50M | $45M | $15M | $4M | **$114M** | 14× | $1.6B |
| Y5 | $68M | $70M | $30M | $20M | **$188M** | 18× | $3.4B |

Consumer line is driven by the blended $30.72 ARPU × paying-user count
(Y1 ~130K paying, Y3 ~975K, Y5 ~2.2M). Enterprise + API + Clinical
lines are unchanged from prior modeling — the single-tier collapse
only re-prices the consumer column.

### Why one paid tier instead of three

The $4B story is not ARPU-first. **It is behavior graph + category
control + strategic acquisition.** Three reasons single-tier is the
right call right now:

1. **Conversion compounds against price.** $12 sits below the
   deliberation line. Single-tier removes the "which one" decision and
   collapses it to "yes / not yet." Free-to-paid conversion in
   impulse-priced single-tier models runs 2–3× tier-ladder conversion.
2. **The free audit funnel is the data engine.** Higher free volume →
   more slip events → sharper timing model → stronger API moat. The
   strategic multiple at exit (16–50× at acquisition by Hims, Ro,
   Calibrate, or Eli Lilly direct) is underwritten by the dataset,
   not the per-user ARPU.
3. **The annual $99 as a commitment device** is brand-aligned.
   "Put $99 against your pattern. That's the stake." A coupon-framed
   discount would undercut the whole product premise.

GLP-1 Plus stays at $19.99 because medical/aesthetic stakes sustain
the willingness-to-pay; we just stop surfacing the decision to non-
GLP-1 readers on the main /pricing page.

**The structure that gets us to $3–4B:**
- Consumer + Enterprise carry Years 1–3 (the cash floor)
- API launches at Month 18 after substrate engineering is real
- Clinical / payer is the Year 4–5 multiplier, **never the lifeline**

**The silent bet (named explicitly):** the recovery engine + single-
tier impulse pricing deliver 55%+ 12-month retention (lower price
reduces churn-by-pricing — the cheapest tier on the market gets fewer
"I can't justify it this month" cancellations). Measured at Month 3
of paid-user data, model re-underwritten if it misses.

**Why $3–4B at Year 5, not Year 4:** by Year 5 FDA clearance is real,
payer revenue is meaningful, the multiple legitimately compresses to
healthcare-grade 16–22×. Pushing it to Year 5 reads as discipline.

**Strategic-multiple sanity check.** Even if the operating-multiple
table above is too generous, the strategic-acquisition multiple at
exit (16–50× ARR for a category-leading behavioral interrupt platform
with FDA path) lands $188M Y5 ARR at $3.0–9.4B. We are pricing the
mid-band of that range.

*Speaker notes: Lead with "we collapsed to one tier on purpose."
Investors will probe the lower ARPU — own it, then point to the
conversion offset and the strategic multiple. The annual-as-
commitment framing is the brand signal; don't apologize for not
discounting.*

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

**4. Consumer retention misses 55%.** Probability: 30–40%. **This is
the real silent bet on the single-tier impulse-pricing collapse.**
Measurement gate at Month 3. If <40%, reduce CAC, pause paid
acquisition, or re-introduce a $19.99 tier on main /pricing (currently
lives only on /glp1).

**5. Pear scenario — payer dead zone outlasts cash.** Probability:
25–35%. Series A oversized to $18–22M specifically for 24–30 month
runway through this zone. Consumer + enterprise floor absorbs burn.

**6. Solo-founder ceiling at $5M ARR.** Probability: 50% if no early
senior hire. Seed funds first senior engineer Month 0.

**7. Single-tier conversion underperforms.** Probability: 20–30%.
If free-to-paid on $12 Core doesn't run 2–3× the prior ladder, blended
$30.72 ARPU doesn't scale at the rate the model assumes. Mitigation:
re-introduce $19.99 high-intent tier onto main /pricing (currently
only on /glp1) at Month 3 retention gate. Annual $99 commitment-
device framing stays either way.

*Speaker notes: This slide separates serious founders from pitch
founders. Sophisticated investors know these risks exist. Naming them
pre-empts the objection AND signals you've internalized the failure
modes. The Pear lesson is your strongest single argument with any
biotech-adjacent VC — they all know that story.*

---

## Slide 12.7 — The data moat

# Four layers. One substrate. The strategic acquirers buy the substrate.

```
                  ┌─────────────────────────────────────────────────┐
                  │                                                 │
LAYER 1           │   PASSIVE SIGNALS (already shipped)             │
Ingestion         │   ── HealthKit (sleep, activity, weight, HR)    │
                  │   ── Calendar (Google + Microsoft Outlook)      │
                  │   ── Dexcom + Libre (continuous glucose)        │
                  │   ── Withings (weight, blood pressure)          │
                  │   ── Screen time + app usage (mobile + web)     │
                  │   ── Location windows (geo + dwell time)        │
                  │   ── Active inputs: audit, slip log, consent    │
                  │                                                 │
                  └─────────────────────────────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────────────┐
                  │                                                 │
LAYER 2           │   PREDICTIVE MODEL (V0 in production)           │
Inference         │   ── Per-user logistic regression               │
                  │   ── Nightly retrain on N-1 slip history        │
                  │   ── Window prediction (time × context × trigger│
                  │   ── Confidence + propensity score              │
                  │   ── Model snapshot (versioned, auditable)      │
                  │                                                 │
                  └─────────────────────────────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────────────┐
                  │                                                 │
LAYER 3           │   STATE-MATCHED INTERVENTION (Layer 3 shipped)  │
Action            │   ── Intervention-mode router                   │
                  │   ── Redirect-choice CRUD                       │
                  │   ── Cross-surface delivery (push / SMS / web)  │
                  │   ── 10-min delay timer + recovery flow         │
                  │   ── 2h + 24h follow-up wave                    │
                  │                                                 │
                  └─────────────────────────────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────────────┐
                  │                                                 │
LAYER 4           │   COMPOUNDING FEEDBACK (shipped May 2026)       │
Compounding       │   ── Caught me / missed signal CRUD             │
                  │   ── Self-Trust Score per user, weekly delta    │
                  │   ── Per-cohort model retrain (the flywheel)    │
                  │   ── Cohort-refresh process (every 90 days)     │
                  │   ── Aggregated dataset → SDK pricing input     │
                  │                                                 │
                  └─────────────────────────────────────────────────┘
                                       │
                                       ▼
                          THE STRATEGIC ACQUIRER PREMIUM
                  ── Microsoft Viva: behavioral interrupt for Copilot
                  ── Apple Health: 3-second window for Health surfaces
                  ── Meta Reality Labs: gaze-+-context interrupt API
                  ── Eli Lilly / Novo: GLP-1 adherence revenue moat
```

### Why this is the moat

Each layer compounds against the layers above. The substrate is
defensible because:

**Layer 1 — signal density.** 7 integration surfaces already shipped.
A competitor starting today is 18 months from feature parity on
ingestion alone. The signal density is what trains Layer 2.

**Layer 2 — model maturity.** The predictive model V0 is in production
with a nightly retrain cycle. Each day the model sharpens against
N-1 history; 365 days from now the model has 365 retrain cycles of
calibration data that a new entrant can't catch.

**Layer 3 — intervention surface.** The intervention-mode router +
redirect-choice CRUD + cross-surface delivery (push / SMS / web)
shipped in production. A competitor needs to ship all three before
they can produce the data Layer 2 needs.

**Layer 4 — compounding feedback.** The Self-Trust Score, the cohort
retrain, the caught-me/missed signal CRUD — these turn every user
interaction into model improvement. The flywheel runs against COYL,
not against a competitor.

### The acquirer math

The strategic acquirer cannot buy Layer 1 alone (the integrations are
public APIs anyone can wire up). They cannot buy Layer 2 alone (an
ML model without the data is a research artifact). They cannot buy
Layer 3 alone (an intervention surface without a model is spam). They
must buy the **compounded stack** — and the only compounded stack on
the market is COYL.

This is what the 6B Roadmap calls "the asset they cannot build in
under 18 months." It is the same logic as Manus / Microsoft (16×
strategic premium because Microsoft was already piloting the asset
inside Windows; Meta paid to deny). COYL's substrate is the same
shape, in a higher-multiple vertical (behavioral health at FDA-
clearance grade vs. enterprise productivity).

*Speaker notes: This is the technical-credibility slide. Pull up the
substrate architecture from `docs/strategy/product-roadmap-v3.md` if
investors push on it. The point of the slide isn't to walk through
the architecture — it's to show that the substrate exists, is
shipping, and is the asset the strategic acquirers are buying. Stop
talking at "the only compounded stack on the market is COYL." Let
that line land.*

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

## Slide 13.5 — Path to exit

# 32-week sprint to the LOI table. Four phases. Per the $6B Roadmap.

The Series A is not "the raise that gets us to Series B." It is the
**raise that puts us in the strategic-acquisition window by Month 8
of operations** — Week 32 of the post-close sprint, per the 6B
Acquisition Roadmap.

### Phase 1 — Substrate hardening (Weeks 1–8)

**Objective:** every layer of the substrate is fully production-
grade, observable, and audit-ready before any strategic acquirer
sets foot in the data room.

- Week 1–2: CTO + senior backend eng + senior mobile eng onboarded
- Week 3–4: Layer 3 (intervention-mode router) hardened with full
  test coverage + observability dashboards
- Week 5–6: Layer 4 (Self-Trust Score) feature-complete with
  cohort-refresh cron in production
- Week 7–8: SOC 2 Type I readiness audit; HIPAA risk assessment
  refresh; pen test scheduled

**Gate to Phase 2:** the substrate is production-grade. The clinical
partnership is signed. The 5 critical hires are 3-of-5 onboarded.

### Phase 2 — Strategic-signal layer (Weeks 9–16)

**Objective:** populate the strategic-acquirer FOMO pipeline. By end
of Phase 2, all three primary acquirers (Microsoft Viva, Apple
Health, Meta Reality Labs) have had at least one strategic
conversation with the founder.

- Week 9–10: Apply to Microsoft Viva partner program (per 6B Action
  Plan This Week #1)
- Week 11–12: Browser extension public launch (Chrome + Edge +
  Safari distribution); HLTH conference presence
- Week 13–14: First strategic conversation with Apple Health BD
  (warm intro via prior portfolio CEO + a16z Bio network)
- Week 15–16: First strategic conversation with Meta Reality Labs
  (the gaze-+-context interrupt API framing)

**Gate to Phase 3:** at least 2 of 3 primary acquirers have had a
strategic conversation. The IRB submission is filed. The FDA Q-Sub
prep is in counsel hands.

### Phase 3 — Proof point manufacture (Weeks 17–24)

**Objective:** the substrate is no longer a thesis — it is a
proof-point. The strategic acquirers see the operating data on the
quarterly investor update and the public press hits.

- Week 17–18: First GLP-1 partner LOI signed (target Found Health,
  Calibrate, or Sequence per the investor-pipeline doc)
- Week 19–20: FDA Q-Submission filed; teleconference scheduled
- Week 21–22: Consumer ARR crosses $15M annualized; Self-Trust
  Score 90-day cohort lift validated at +60%+
- Week 23–24: First press hit at NYT / WSJ / Bloomberg tier on
  the "behavioral interrupt category" framing

**Gate to Phase 4:** Series B raise opens informally (per the
sources-and-uses trigger). Strategic-acquirer FOMO is documented in
quarterly board update.

### Phase 4 — LOI table positioning (Weeks 25–32)

**Objective:** by Week 32 (Month 8 of operations), the founder is
sitting at a table with the M&A advisor + at least one indicative
strategic LOI in hand, alongside an active Series B process.

- Week 25–26: M&A advisor hired (ex-MSFT/Apple/Meta corporate-dev
  veteran; 0.25–0.5% equity, $10K/mo retainer per 6B Action Plan)
- Week 27–28: Series B raise opens formally at $30–50M at $150–250M
  post; Tiger / Insight / Bessemer growth as target leads
- Week 29–30: Strategic-acquirer term sheet auction process opens
  if all three primary acquirers have re-engaged in Phase 3
- Week 31–32: Decision moment — Series B close, strategic LOI
  accept, or extend to Phase 5 (Week 33–48 bridge / re-test)

### The honest math on the 32-week sprint

This is the **15–25% probability case**, not the base case. Per the
6B Action Plan §1:

- **15% probability** of a $4–6B pure-strategic exit at Week 32
- **30% probability** of a $3–4.5B hybrid exit at Week 48–64
- **40% probability** of a $1.5–2B revenue-justified exit at Week
  32–48
- **15% probability** of no exit (Series B closes, company
  continues private)

The 32-week sprint exists to **maximize the probability of being at
the LOI table**, not to guarantee the close. The headline number
($4–6B) sits in the upside band; the probability-weighted
underwrite ($1.85B per Slide 12) is what we ask Series A investors
to wire against.

*Speaker notes: This is the operating cadence slide. Show that we
have a 32-week plan, that the plan is published, that the plan
ties directly to the strategic-acquisition table. The strongest
single signal you can give a Series A investor is "we already know
how Week 32 ends and we are operating against that endpoint." The
honest probability math is what separates this pitch from every
'we'll figure it out in Year 3' pitch they've heard this month.*

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
