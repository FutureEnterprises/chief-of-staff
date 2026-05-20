# Founder Strategy Brief v2

**COYL — The Fastest Path to $100M**
*Stop the script before it runs your life.*

Revision of the May 2026 founder strategy brief, incorporating five fixes
from the CTO red-team review: recalibrate the shareable-artifact thesis,
add CAC payback math, push SDK timing, add team gaps, add competition.

Numbers are scenarios for internal planning. Not forecasts.

---

## Section 1 — The Record, and Why COYL Has a Real Shot

The current record for $1M → $100M ARR is 8 months (Lovable, July 2025).
$10M → $100M is 5.5 months (Replit). Average across the top ten is 16.7
months. Wiz took 18. Deel took 20. Every one of those numbers used to
be considered impossible. The category now exists.

The four structural traits the record-holders share:

1. **A shareable output.** Lovable: an app. Replit: a working agent
   project. Midjourney: an image. The product manufactures a brag-worthy
   artifact that becomes free distribution.
2. **Wow in minutes, not days.** Replit engineered first-wow into the
   first three minutes. Time-to-first-wow is the strongest predictor
   of activation + retention in their cohort data.
3. **Pricing where stopping mid-session is psychologically costly.**
   Lovable users paid $200 in overages because abandoning a half-built
   project felt worse than paying.
4. **A clearly owned behavioral moment.** Lovable owns "I built an app
   in 10 minutes." Replit owns "My AI coded this for me."

**Where COYL stands today, honestly:**

COYL is positioned to own trait #4 — the moment of self-recognition just
before the script runs. But "I stopped myself before I blew it" is not
yet owned in market. Owning a behavioral moment requires the moment to
be visible, and COYL doesn't yet manufacture the artifact that makes it
visible.

**Important calibration:** personal-change content shares *differently*
than building-an-app content. Lovable shares are per-event because
apps are inherently performative. COYL interrupts are inherently
*anti*-performative — posting "I almost binged at 9 PM tonight" requires
admitting vulnerability that most people work to hide. The closest
working analogs are:

- **Strava** (works because exercise is already performative)
- **Therapy quote accounts** (work because the messenger is a creator,
  not the user)
- **Sober streak counters** (work, but the share is at *milestones* —
  30 days, 1 year — not at individual events)

The implication: the shareable artifact will work, but the cadence will
look more like milestone shares (week 1 / month 1 / 6 months) than
per-event shares. Plan for the user posting their *best* win in a given
period, not every win. Volume assumption: ~1 share per active user per
month at steady state, not per-event. Recalibrate the viral coefficient
math accordingly.

The thesis stands: **COYL's growth unlock is making the interrupt visible.**
Just don't model it like Lovable's per-event share cadence. Model it like
Strava + sober-counter — milestone-based, share at peaks.

---

## Section 2 — The Three Businesses Inside COYL

COYL is three businesses sharing one interrupt engine. The fastest path
to $100M stacks all three in the right order.

| Business | Revenue Type | $100M Math | Speed | Risk |
|---|---|---|---|---|
| Consumer behavioral AI | D2C subscription | 1M paying users × $19 ARPU × 12 = $228M ARR ceiling; $40M is the realistic 24-month target | Moderate | Acquisition cost |
| GLP-1 companion platform | PMPM via telehealth | 250K covered lives × $10 PMPM × 12 = $30M/yr from 3 partner deals | Fast | BD cycle length |
| Behavioral interrupt SDK | B2B API / platform | $0.05/interrupt × 10M interrupts/mo × 12 = $6M ARR; scales with partner count | Highest ceiling | Brand prerequisite |

**Math correction from v1:** the "3M users × $29 × 15% = $13M" figure in
v1 ambiguously read as monthly revenue. Restating: at our published
$19 Core ARPU (not $29) and category-realistic 8–12% free-to-paid
conversion, $40M in D2C subs by Month 24 requires ~175K paying users +
~2M cumulative free signups assuming 50% 12-month retention. That's the
real acquisition target, not 3M.

### The correct sequence

- **Month 0–6 — Consumer first.** Not for revenue, for proof. Get to
  50K free users + 3K paying. Manufacture the shareable artifact.
  Build the viral loop. This is the cheapest social proof B2B has ever
  seen.
- **Month 6–18 — GLP-1 partner second.** Land 3 telehealth partners
  using consumer traction + the live clinical study protocol as social
  proof. ~$30M ARR unlocked.
- **Month 12–24 — SDK / API third.** *Revised from v1's Month 6–9
  timing.* The interrupt model needs 12+ months of real user data to
  defend the API claim. Selling "the Stripe of behavior change" with
  6 months of data is a hopeful pitch, not Stripe. Push SDK launch to
  Month 12 at earliest, Month 15–18 realistically. First-revenue from
  SDK partners by Month 18; meaningful revenue by Month 24.

Why consumer first even though B2B is faster per dollar: the shareable
artifact does two jobs at once. It pulls in users AND creates the social
proof that closes BD calls. Lead with B2B and BD drags for 9 months with
nothing to demo. Lead with the viral loop and the BD calls happen with
the deck already half-sold.

---

## Section 3 — The Shareable Artifact

The most important single product decision.

Every record-breaker has an output users brag about. Lovable: "I built
an app." Replit: "My AI coded this." Midjourney: "I made this image."
COYL's equivalent: the **Autopilot Interrupted card.**

Every time COYL fires a successful interrupt, the user gets a beautiful,
shareable card:

> *9:47 PM. Fridge door open. Autopilot detected. Stopped.*
>
> Pattern streak: 7 nights. Same window. 7 stops.
>
> Self-Trust Score: 81 → 84 this week.

**Calibrated expectation (corrected from v1):**

- Per-event sharing will be rare (~5% of interrupts) because the content
  is intimate
- Milestone sharing will be the volume driver: week-1, month-1, 6-month,
  1-year cards
- "I COYL'd it" social challenge will require seeded creator content
  before organic adoption — assume 6+ weeks of paid seeding before any
  organic pickup

**Adjacent viral surfaces (these will likely out-share the interrupt card):**

- **/audit quiz → "Autopilot Profile"** — MBTI-of-self-sabotage. "You're
  a Night Fridge Saboteur. 87% of you fire between 9–11 PM." This is
  the highest-virality asset; quizzes share per-event because the
  result is *about you* without admitting failure.
- **Weekly Autopilot Autopsy** → one-tap share of the week's patterns.
- **Self-Trust Score progression card** → milestone shares (every 10
  points).

### Product requirement

Ship the shareable interrupt-card + quiz-result-share within 60 days.
~2 engineer-weeks for the card, ~1 for the quiz result page. Single
highest-ROI product feature.

---

## Section 4 — Competition: Why the Incumbents Won't Build This

*New section per CTO review.*

Every investor asks: "Why hasn't Noom / Calm / BetterUp / Hims already
built this?"

The structural answer:

| Incumbent | Primary engagement metric | What COYL's surface cannibalizes |
|---|---|---|
| Noom | Daily lesson completion | Lesson-based content irrelevant in the 3-second drift window |
| Calm | Daily session time | Push-first surface reduces in-app time |
| BetterUp | Coach-session frequency | Real-time AI substitutes coach for first response |
| Hims | Prescription renewal rate | GLP-1 companion increases off-drug success (cuts churn but cannibalizes new-script flow) |
| Headspace Health | Provider visit count | Self-service interrupt reduces handoff to clinician |

Each incumbent's business model depends on a specific engagement metric
that a push-notification-first JITAI surface *directly cannibalizes*.
They won't build this voluntarily. Their valuations are predicated on
DAU / session-time / visit-frequency narratives that a "fire when needed,
disappear otherwise" product breaks. They can copy features. They cannot
copy the architecture without rewriting their investor narrative.

This is the moat. Not "we have data." It's "the incumbents have
financial incentives to *not* build the product surface we are building."

The data flywheel (interrupt timing → trust → retention → cohort
training → better timing) is the second-order moat. The structural one
above is what answers the call-two question.

---

## Section 5 — The Fastest GTM

Five compounding plays, run in parallel, sequenced for proof.

### Week 1–2 · /audit quiz to homepage hero

The quiz is the best free asset and currently buried. Move to homepage
hero. Every result shareable. Seed to 20 high-follower creators in
weight loss, GLP-1, ADHD, binge eating, productivity.

**Target:** 30K quiz completions in 30 days. At 12% conversion to free
account = 3,600 users. At 6% free-to-paid = ~220 paying users. That's
the first proof point.

*v1 had 50K + 15% + 8% which compounds to 600 paid users — anchored on
upper-bound benchmarks. Revised to realistic mid-range for a cold-start
quiz funnel in this category.*

### Week 2–4 · Reddit + community seeding (cost: ~0)

r/loseit (3.2M), r/GLP1 (450K), r/BingeEatingDisorder, r/EDrecovery,
r/ADHD (1.9M), r/productivity. Post as a real user, not a brand. Both
r/loseit and r/GLP1 have strict no-promotion rules; expect 60% of
posts to be removed by mods. Plan for volume + iteration, not one
viral hit.

**Realistic target:** 5 posts, 1 hits the front page or top of the
sub, drives **10–30K outbound clicks** (not the 50–200K v1 claimed —
that was upper-decile fantasy). At 3% signup conversion: ~600 users
from one successful run.

### Month 1–3 · Creator UGC engine

Two budget options:

- **Wide:** $100K for 60 micro-creators (50K–500K followers) at ~$1,500
  average package (free Premium + ~$500 affiliate ceiling + ~$1,000
  flat for one authentic post). Realistic mid-tier rate in this niche.
  *Corrected from v1's $30K / 100-creator plan — that math implies $300
  per creator which doesn't move mid-tier creators.*
- **Deep:** $80K for 20 deep partnerships at $4K each, with content
  schedules + revision rights.

Brief: "Show us the moment COYL caught you. Not the win — the moment
before." Same emotional resonance argument from v1; the budget
correction is what makes it executable.

### Month 2–6 · GLP-1 partner sprint

Hire a real BD lead — not 10 hours/week. *Corrected from v1.* Real
options:
- $8–12K/month retainer for 20 hours/week with meaningful equity
- Full-time hire at $180K + equity

First-meeting frame stays from v1: free 90-day pilot, co-authored
outcomes paper, no upfront cost, leverage the live `/clinical-study`
protocol.

Realistic timeline: first LOI by Month 5–6, signed pilot by Month 8–9.
*Revised from v1's "signed partner by Month 5" — telehealth compliance
review is typically 90+ days, plus DUA + BAA negotiation.*

### Month 3–9 · Employer pilot blitz via channel partners

Channel partners: Wellhub, Virgin Pulse, Lyra Health, Included Health.
Lead with the procrastination/productivity use case for knowledge-worker
employers — easier HR sell than weight loss.

Target: 3–5 pilot employers by Month 9. Logos more important than
revenue at this stage.

### Month 12–18 · SDK announcement

*Pushed from Month 6/9 per CTO review.* 12+ months of real interrupt
data is the minimum defensible base for an API pitch. First partner
revenue Month 18; meaningful contribution Month 24.

---

## Section 6 — Usage-Based Pricing (the Overage Trick)

The fastest-growing companies make money on overages. Lovable users paid
$200 in overages because stopping mid-project felt worse than paying.

### The COYL Credit Model · ship Month 2

- Every AI interrupt consumes 1 credit. Free = 20/mo. Core = 500/mo.
  Plus = 1,500/mo. Premium = unlimited.
- "Danger Window Active" banner during high-risk windows. If credits run
  out during a danger window, 100 credits = $4.99.
- Psychology: "I'm in a danger window and I need COYL." Nobody closes
  the app. They pay.

**Calibrated math (corrected from v1):** at 100K users + 3% buy a credit
pack in a given month + average 1.2 packs per buyer: ~$18K/mo. The v1
$50–200K/mo range assumed 5% × multiple-buys, which has no data backing
yet. Real number will land in $15–40K/mo until the user base hits 300K+.

### Annual conversion as commitment device

22% annual discount stays. Reframe the offer: "Lock in your interrupt
coverage for the year." Behavioral framing turns a financial decision
into a commitment device — same psychology COYL sells to users. Use the
product's own mechanic in the checkout flow.

---

## Section 7 — Team (current state and gaps)

*New section per CTO review.*

**Current state:**
- Founder: Iman Schrock (CEO, product, eng, ops — solo founder today)
- External advisors: TBD — needs 2 (behavioral science + clinical/MD)
- Engineering: 1 (founder); shipping daily, ~150 commits in last 30 days

**What's shipped under solo-founder execution (proof of velocity):**
- 4-tier pricing live
- 11 public marketing/wedge pages
- Real-time intervention surface on `/today`
- 3 interrupt crons (danger-window, GLP-1 day-3, post-slip)
- Web push + Expo push end-to-end with consent architecture
- SMS funnel-compression at `/catch-me`
- Recovery engine with no-Monday-reset framing
- Clinical study protocol open for partner enrollment
- Account deletion + data export (App Store + GDPR compliance)
- iOS + Android Expo app (pre-submission)
- Stripe live checkout with 4-tier mapping
- Newsletter + interrupt history + changelog
- Sentry, structured data, OG images on all wedges

**Immediate hire plan (Seed proceeds):**

| Role | Salary band | When | Why |
|---|---|---|---|
| Senior full-stack engineer | $170–200K + equity | Month 0–1 | Founder leverage; ship velocity sustainability |
| Growth / community lead | $120–150K + equity | Month 1–2 | Creator partnerships, Reddit ops, content engine |
| BD lead (telehealth Rx Rolodex) | $180–220K + equity OR $10K/mo retainer | Month 2–3 | GLP-1 partner sprint |
| Clinical PI (advisor or fractional) | Equity grant | Month 1 | Lead IRB submission, manuscript co-authorship |
| Designer (contract → FT) | $130–160K + equity | Month 3 | Shareable-artifact polish, mobile UI |

**Honest gap acknowledgment:** solo-founder companies at this category
benchmark hit a ceiling around $5M ARR before the founder becomes the
bottleneck. The Seed is funding the team that gets past that ceiling.
Investors should underwrite the next 4 hires, not the next 4 years.

---

## Section 8 — The $100M Revenue Model

| Stream | Month 6 | Month 12 | Month 18 | Month 24 |
|---|---|---|---|---|
| D2C subscriptions | $600K | $4M | $14M | $32M |
| D2C overages | $150K | $800K | $2.5M | $7M |
| GLP-1 partners (PMPM) | $0 | $4M | $15M | $26M |
| Employer B2B | $0 | $400K | $3M | $9M |
| SDK / API licensing | $0 | $0 | $1.5M | $6M |
| **Total ARR** | **$750K** | **$9.2M** | **$36M** | **$80M** |

*Recalibrated from v1's $1.5M / $13M / $50M / $100M. The Month 24 target
moves from $100M to $80M to reflect: (a) recalibrated shareable-artifact
volume, (b) pushed SDK timing, (c) realistic Reddit/creator funnel.
$100M ARR at Month 24 is still on the table — see "the upside scenario"
below — but base case is now $80M, not $100M.*

### CAC payback row — added per CTO review

| Assumption | Conservative | Mid-case | Aggressive |
|---|---|---|---|
| 12-month retention | 35% | 45% | 55% |
| Blended D2C CAC | $120 | $80 | $50 |
| ARPU (mo) | $17 | $19 | $22 |
| **Payback months** | **9.2** | **5.0** | **2.7** |

The Month 24 $32M D2C ARR target works at mid-case (45% retention, $80
CAC) and breaks at conservative ($120 CAC requires the recovery engine
to deliver 45%+ retention). **The recovery-engine-retention dependency
is the silent bet of the entire D2C arm.** Bake retention measurement
into the first 90 days of live data and re-underwrite the model.

### The $100M scenario (kept from v1, with corrections)

- Viral interrupt card + quiz-share launches a word-of-mouth loop in
  Month 3
- One GLP-1 partner signs Month 6–7 (not Month 4)
- SDK launches Month 12 (not Month 6) with 2 anchor partners
- Series A closes at $25M on $9M ARR — adds distribution muscle
- Retention lands at the 50%+ band

---

## Section 9 — The Capital Plan

Three tranches, each keyed to a proof point.

### Seed · $4–6M · raise now (Month 0–3)

- **Use:** shareable artifact + credit overage system (engineering),
  2 senior hires (growth + BD), clinical study partner sign, 1 infra
  hire for SDK groundwork, ~12-month runway
- **Show:** working product, 30+ public pages, real-time intervention
  surface live, clinical study protocol public, 30-day creator
  partnership pilot results, GLP-1 BD pipeline at LOI level
- **Valuation:** $20–30M pre-money. Small team, working product, clear
  wedge, real product surface, $50B+ adjacent markets
- **Right investors:** a16z Bio (GLP-1 + clinical angle), Founders Fund
  (behavior change + AI), a16z Consumer, strategic angels from Hims /
  Ro / Calibrate / Noom alumni

### Series A · $20–30M · Month 12–15

- **Milestone:** $9M+ ARR, 1 GLP-1 partner live, clinical study data
  reading out, retention validated at 45%+ on month-3 cohort
- **Use:** scale employer channel, SDK platform, international (UK +
  Germany via payer routes), data-science team for personalization
- **Valuation:** $80–130M pre-money on 10–14x ARR. Justified by clinical
  data + platform angle. *Trimmed from v1's $100–150M to reflect cleaner
  underwriting.*

### Series B · $50–80M · Month 24

- **Milestone:** $50M+ ARR, SDK live with 5+ partner apps, employer
  book started, direct payer LOIs
- **Use:** national expansion, direct payer contracting (UnitedHealth,
  Aetna), M&A of a sobriety or ADHD app as distribution channel

---

## Section 10 — The 30-Day Sprint

Strategy is what you write. Speed is what you ship.

### Day 1–7

- Build the **shareable Autopilot Interrupted card** + the **/audit
  quiz result share page**. 3 engineer-weeks. Both ship before any
  paid acquisition starts.
- Move `/audit` quiz to homepage hero. Best free asset, currently
  buried.
- Build creator outreach spreadsheet. 60 micro-creators in weight
  loss, GLP-1, ADHD, binge eating, sobriety. Target 50K–500K
  followers.

### Day 7–14

- Post on r/loseit and r/GLP1 — as a user, not a brand. 5 posts,
  expect 60% removal rate.
- Send GLP-1 partner outreach to Found Health, Ro Body, Hims, Calibrate.
  Template stays from v1.
- Write the COYL Credit / Overage spec. Two-week eng sprint.

### Day 14–30

- Raise the Seed. Pitch: "Lovable shipped $100M in 8 months making
  apps. We're shipping the app for the harder problem — self-sabotage.
  Same viral mechanic recalibrated for personal-change content cadence.
  Three B2B revenue streams Lovable doesn't have."
- Sign the BD lead (full-time or $10K/mo retainer).
- Set a public outcome goal. Build-in-public on LinkedIn / X /
  changelog: "COYL is publishing 5 behavioral outcome metrics every
  month. Here's the first."

> **The fastest path to $100M is not a roadmap. It's a constraint:
> every quarter the company must look unrecognizable from the previous
> one. PMF expires every three months at this growth rate. Build
> accordingly.**

---

## Appendix — Five Fixes from the CTO Red-Team Review

1. ✅ **Shareable-artifact recalibrated.** Section 1 + 3 frame personal-
   change content as milestone-share-cadence, not per-event. Volume
   assumption divided by ~5x. Quiz-share elevated as primary viral
   surface above the interrupt card.

2. ✅ **CAC payback math added.** Section 8 has the three-scenario
   table. Recovery-engine-retention dependency made explicit. Mid-case
   payback 5.0 months at 45% retention + $80 CAC.

3. ✅ **SDK timing pushed.** Section 2 + 4 + 8 move SDK launch from
   Month 6–9 (v1) to Month 12–18 (v2). First SDK revenue Month 18.

4. ✅ **Team section added (Section 7).** Current state honestly stated
   (solo founder). Five-hire Seed plan tied to specific functions.
   Solo-founder ceiling acknowledged.

5. ✅ **Competition section added (Section 4).** Five-incumbent
   structural cannibalization argument. Moat reframed from "we have
   data" to "incumbents have financial incentives not to build this."

Other corrections incorporated:
- Reddit traffic estimates: 10–30K outbound per successful post (not
  50–200K)
- Creator budget: $80–100K real (not $30K)
- BD lead comp: real retainer or FT, not 10 hr/week
- Section 2 math: corrected the $13M ambiguity to ARR
- Revenue model: $80M base case Month 24 (not $100M)

---

*Strategy v2 — May 2026. Prepared for internal planning and seed
investor distribution.*
