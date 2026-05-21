# COYL — One-Pager

> Stop the script before it runs your life.

**Round:** $4–6M Seed @ $20–30M pre · 8-week close window
**Founder:** Iman Schrock · iman@coyl.ai · coyl.ai

---

## The thesis in one paragraph

Every behavior-change app intervenes before the moment (reminders) or
after the moment (journaling). COYL fires *in* the 3-second window
between trigger and action — push notification at the user's mapped
danger window, structured rescue flow, same-night recovery if they
slip. Built first for the GLP-1 maintenance gap (60–80% regain within
2 years off-drug), expandable to procrastination, destructive
patterns, workplace focus.

## What's already shipped — solo founder, 30 days

- **Real-time intervention surface** on `/today` — fires when the user
  is inside a mapped danger window
- **3 interrupt crons** — danger-window, GLP-1 day-3, post-slip
- **Multi-channel delivery** — Expo push, Web Push, SMS funnel
  (`/catch-me`), email — with consent architecture across all four
- **Recovery engine** — no-Monday-reset framing, 1-day grace on streaks
- **Clinical study protocol** open for partner enrollment
  (`/clinical-study`) — 12-week, N=80, minimal-risk, IRB-pathway-mapped
- **4-tier pricing** live with overage credits in spec
- **15 public marketing pages** indexed and shipping OG images

## The wedge — GLP-1 maintenance

| | |
|---|---|
| US patients on GLP-1s | 10M+ and growing |
| % who regain weight within 2 years off-drug | 60–80% (published trials) |
| Behavioral relapse prevention category | $50B+ adjacent |
| Telehealth platforms with active GLP-1 panels | 6+ ($1B+ each) |

## Pricing (single-tier collapse — LIVE)

| Lane | Live pricing | Notes |
|---|---|---|
| Free | Audit + archetype + 3 interrupts/week | No card |
| Core consumer | **$12/mo or $99/year** | Annual framed as commitment device, NOT a discount. "Commit to the year — put $99 against your pattern." |
| GLP-1 Plus | **$19.99/mo** on /glp1 only | Page-native upsell. Rebound-window protocol + clinician summary export + post-taper relapse-prevention plan. Off main /pricing. |
| Clinics + Employers | $5–$15 PMPM | PMPM calculator live; no "contact us" gate |
| Enterprise / API | Bespoke partner pricing | Month 18+ |

The prior three-tier consumer ladder ($9.99/$19.99/$5–15 PMPM)
collapsed to a single $12 Core because tier ladders convert worse than
a single confident impulse price. $12 sits under the $19.99
deliberation line where buyers stop asking "is this worth it?" and
just decide.

**Blended consumer ARPU = $30.72/user/year**
(0.8 × 0 + 0.18 × 144 + 0.02 × 239.88; mix is 80% Free / 18% Core /
2% GLP-1 Plus)

**At 1M paying users (Month 8 ambitious target): $30.7M consumer ARR
+ B2B pipeline.** The trade-off is named: ~40% lower per-user ARPU
than the prior ladder, but 2–3× higher free-to-paid conversion. We
trade ARPU for conversion velocity and category control.

## Four layers, one engine — Path to $1.5–4B

### Single-tier consumer model (LIVE)

| Year | Consumer | Enterprise | API | Clinical | Total ARR | Multiple | Valuation |
|---|---|---|---|---|---|---|---|
| Y1 | $4M | $0.5M | $0 | $0 | $4.5M | 14× | $63M |
| Y2 | $15M | $5M | $1M | $0 | $21M | 16× | $336M |
| Y3 | $30M | $20M | $6M | $1M | $57M | 18× | $1.0B |
| Y4 | $50M | $45M | $15M | $4M | $114M | 14× | **$1.6B** |
| Y5 | $68M | $70M | $30M | $20M | $188M | 18× | **$3.4B** |

Consumer column driven by blended $30.72 ARPU × paying-user count
(Y1 ~130K paying, Y3 ~975K, Y5 ~2.2M). Enterprise + API + Clinical
lines unchanged — the collapse only re-prices the consumer column.

**Y4 = $1.6B (~64× on a $25M post-money Seed). Y5 = $3.4B if FDA
clearance lands on schedule.** Honest base case at Y4, aggressive at
Y5. Consumer + Enterprise carry Years 1–3 as the cash floor; API
launches Month 18 after substrate engineering; Clinical / payer is the
Y4–5 multiplier, **never the lifeline**.

**Strategic-multiple sanity check:** even if operating multiples
compress, the strategic-acquisition multiple at exit (16–50× ARR for
a category-leading behavioral interrupt platform with FDA path)
brackets $188M Y5 ARR at $3.0–9.4B. We are pricing the mid-band.

The Pear Therapeutics lesson: FDA clearance + reimbursement codes
weren't enough to save Pear when payer adoption was slower than burn.
Series A explicitly sized at $18–22M to survive the 24–30 month dead
zone. Consumer + enterprise floor absorbs burn even if payer
contribution is $0.

## The moat — structural, not tactical

Noom, Calm, BetterUp, Headspace, Hims — every behavior-change incumbent
has a business model predicated on daily-session-length or
prescription-renewal. A push-first JITAI surface *directly cannibalizes*
their reported engagement metric. They can copy features. They can't
copy the architecture without breaking their own investor narrative.

Plus: the data flywheel (interrupt timing → user feedback → cohort
training → better timing) compounds with every paid user.

## CAC payback math

**Single-tier mid-case (live):** 55%+ 12-month retention (single-tier
impulse pricing reduces churn-by-pricing) · $30 blended CAC · paid
ARPU $12.80/mo (90% Core $12 + 10% GLP-1 Plus $19.99 weighted) →
**~2.4 months payback on paid users**.

Blended-across-all-users ARPU is $30.72/year ($2.56/mo) — payback
math is dominated by the paid sub-population, not the blended figure.
The recovery-engine + impulse-price-collapse retention assumption is
the silent bet of the entire D2C arm. Measured in the first 90 days
of paid users; model re-underwritten if it misses.

## Use of funds ($5M midpoint)

| Bucket | $ | What it buys |
|---|---|---|
| Engineering | $1.8M | 3 senior hires + designer |
| Growth | $1.0M | Community lead + creator budget + paid acq |
| BD | $0.6M | Telehealth Rx-lead + partner pilot infra |
| Clinical | $0.4M | PI fees + IRB + manuscript |
| Compliance | $0.3M | HIPAA / BAA / DUA / App Store review |
| Infra | $0.4M | Vercel, Supabase, Anthropic, Twilio, Resend |
| Buffer | $0.5M | 12-month operating margin |

## Next milestone (Series A trigger)

$9M ARR · 1 GLP-1 partner live · 1 signed API LOI · 45% 12-month
retention validated · RCT 12-week data in hand · Series A at $18–22M
@ $80–130M pre — deliberately oversized for 24–30 month payer-channel
dead zone runway.

## What kills this plan (named explicitly)

The risks every $4B plan has to name:
1. Clinical study null (15–25%) — mitigated by effect-size design
2. App Store rejection (10–15%) — recoverable in one cycle
3. Stripe regulatory on stakes (5–10%) — Stripe Connect to 501(c)(3)
4. Consumer retention misses 55% (30–40%) — the real silent bet
5. Pear scenario, payer dead zone outlasts cash (25–35%) — Series A
   sized to prevent
6. Solo-founder ceiling at $5M ARR (50%) — first senior eng hire Month 0
7. **Single-tier conversion underperforms** (20–30%) — if free-to-paid
   conversion on $12 Core does not run 2–3× the prior ladder, blended
   $30.72 ARPU doesn't scale. Mitigation: re-introduce a $19.99 high-
   intent tier (currently lives only on /glp1) onto main /pricing at
   Month 3 if data demands it. Annual $99 commitment-device framing
   stays in either case.

Naming risks pre-empts diligence objections AND signals we've
internalized the failure modes.

---

*One-pager — May 2026. Confidential.*
