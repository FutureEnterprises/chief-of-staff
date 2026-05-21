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

# One paid tier. Impulse-priced. Annual is a commitment, not a discount.

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

## Slide 12 — The Path to $1.5–4B

# 5 years. Four layers. One paid tier. Strategic multiples intact.

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
