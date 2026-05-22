# COYL — Capital Allocation Memo

> Founder-decision document on the $10M Series A allocation. The
> math, the buckets, the burn schedule, the five critical hires,
> the benchmarks, and the if-we-miss tree.

**Round:** $10M Series A
**Date:** May 2026
**Author:** Iman Schrock (founder)
**Audience:** prospective leads + board + the founder, six months
from now, when the burn rate stops looking abstract

---

## 1. Headline

$10M raised → $4–6B exit projected at 17–25% probability →
**~$360× expected return on enterprise value** → diluted-equivalent
**~$80M of expected value per $1M raised**.

The math:

- Series A pre-money: $40–50M (target $45M)
- $10M new investment dilutes the cap table ~18% (at $45M pre,
  $55M post)
- Expected exit value (probability-weighted):
  - 20% probability × $5B = $1.0B expected
  - 35% probability × $2B = $0.7B expected
  - 30% probability × $500M = $0.15B expected
  - 15% probability × $0 (no exit, return capital) = $0
  - **Total probability-weighted exit: ~$1.85B**
- Series A investor share post-dilution + downstream rounds
  (estimated 35% combined dilution Series A→exit): ~12% effective
  ownership
- Expected $ to Series A investors: 12% × $1.85B = **$222M on $10M
  invested = 22.2× MOIC on probability-weighted basis**

This is the deck math. It holds because (a) the substrate is real
and shipping today, (b) the $6B Roadmap names the specific
strategic acquirers with the specific strategic premiums, and (c)
the single-tier pricing collapse converts at 2–3× the prior tier
ladder, making the $30.7M consumer ARR milestone reachable within
the $10M.

The headline reads cleanest as: **$10M in → 22× expected MOIC →
strategic exit window opens Month 18–24.**

---

## 2. The 7-bucket allocation

| Bucket | $ | % | Why |
|---|---|---|---|
| Engineering | $3.0M | 30% | Substrate scales here. 4 engineers + ML hire over 8 months ships Layer 3 + Layer 4 fully. |
| Clinical execution | $2.0M | 20% | Found Health partnership + IRB submission + biostatistician. Clinical data is the strategic-premium unlock. |
| Regulatory + IP | $0.8M | 8% | FDA Q-Sub + 510(k) prep + 3 provisional patents. Without IP we are a feature, not a company. |
| Commercial + marketing | $2.0M | 20% | PR + paid acquisition (capped at $80K/mo) + the GLP-1 prescriber channel build. |
| Talent + recruiting | $1.0M | 10% | Search fees + onboarding + reference packages for the 5 critical hires. |
| Legal + ops + insurance | $0.7M | 7% | D&O, Cyber, E&O. Counsel for the FDA pathway. SOC 2 Type I audit. |
| Founder runway | $0.5M | 5% | $60K/mo founder salary + advisor equity + a small discretionary budget. |
| **Total** | **$10.0M** | **100%** | |

### 2.1 Engineering — $3.0M

The substrate is the company. The substrate scales or it doesn't,
and engineering is where that decision gets made.

**Headcount over the $10M:**
- 1 × CTO ($280K cash, 4–6% equity) — Month 1
- 1 × Senior backend engineer ($210K cash, 0.5–0.75%) — Month 1
- 1 × Senior mobile / React Native engineer ($200K cash, 0.5%) —
  Month 2
- 1 × Senior ML engineer / applied scientist ($240K cash,
  0.75–1.0%) — Month 3
- 1 × Senior full-stack engineer ($190K cash, 0.4%) — Month 4

**8-month cash burn:** ~$1.45M salary + $200K benefits/taxes +
$150K infra + tooling (Vercel, Supabase, Anthropic, OpenAI,
Mixpanel, Sentry, Linear, etc.) + $200K recruiting fees =
**~$2.0M of the $3.0M**.

Remaining $1.0M is the buffer for:
- A sixth engineer in Month 6–7 if the Layer 4 work needs it
- Stripe + Plaid + Apple Health + Dexcom + Libre + Withings
  integration work (the third-party-integration set referenced
  in the Layer 3 substrate)
- The Safari extension + Chrome extension + Edge extension
  distribution work

**The bet:** by Month 8, we have 6 senior engineers + the CTO,
the substrate is fully scaffolded across Layer 1–4, and the
predictive model has 8 months of multi-user data to retrain
against. That dataset is the strategic-acquirer-premium unlock.

### 2.2 Clinical execution — $2.0M

The single biggest lever on the strategic-acquisition multiple.
Without clinical data, COYL is a behavioral-health app
($1–2B ceiling per strategy-v3 §2). With clinical data, COYL is
a category-leading behavioral interrupt platform with FDA path
(16–50× multiple, $3–9.4B per seed-deck §12).

**The spend:**
- Found Health partnership fee + cohort enrollment subsidy:
  $750K (12 months)
- IRB submission + amendments: $25K (counsel + filing fees)
- Biostatistician (fractional, then full-time post-Month 6):
  $180K
- Principal Investigator stipend (academic — behavioral medicine
  faculty appointment): $120K (12 months)
- Manuscript prep + journal submission fees: $30K
- Adverse event monitoring + DSMB constitution: $80K
- Participant recruitment + retention incentives: $250K
- Trial site overhead + remote monitoring tools: $150K
- Reserved for IRB-amendment-triggered re-enrollment: $200K
- Reserved for the second cohort (post-discontinuation regain
  arm): $215K

**Total: $2.0M over 14 months** (the study tail extends past the
$10M raise window — the back half is funded by the Series B or
the bridge round).

### 2.3 Regulatory + IP — $0.8M

Three filings, three documents, three insurance policies.

**FDA Q-Submission (pre-submission letter + teleconference):**
- Counsel fees (regulatory boutique — Hyman, Phelps & McNamara
  tier): $120K
- Submission preparation + dossier: $60K
- Teleconference prep + follow-up correspondence: $30K
- **Subtotal: $210K**

**510(k) preparation (filing target Year 2, prep starts now):**
- Predicate device analysis + claims matrix: $40K
- Software documentation (IEC 62304): $50K
- Risk management file (ISO 14971): $35K
- **Subtotal: $125K** (filing itself is Series B)

**IP — 3 provisional patents + 2 utility filings:**
- Provisional 1: timing model architecture: $35K (counsel +
  filing + figures)
- Provisional 2: intervention-mode routing: $35K
- Provisional 3: behavioral substrate (the Apache 2.0 spec
  alongside): $35K
- 2 utility filings (convert from provisionals in Month 10–11):
  $80K each = $160K
- Prior art search + freedom-to-operate analysis: $50K
- Trademark filings (COYL wordmark, "Self-Trust Score," "Stop
  the script before it runs your life"): $30K
- **Subtotal: $345K**

**Quality System Management (QMS) setup:** $120K (consultant
fees + first-year operationalization).

**Total: $800K** with $0K slack — this bucket is tight and
counsel knows it.

### 2.4 Commercial + marketing — $2.0M

The single-tier pricing collapse from the May 2026 memo trades
ARPU for funnel velocity. The $2.0M commercial bucket funds the
funnel.

**Allocation:**
- PR + earned media (retained agency, $25K/mo for 12 months):
  $300K
- Paid acquisition (capped at $80K/mo to enforce CAC discipline,
  6 months runway): $480K
- Creator UGC engine (20 deep partners @ $5K each, plus content
  production): $150K
- GLP-1 prescriber channel build (the BD/sales work on the
  /glp1 partner pitch — see seed-deck §6): $250K
- Conference presence (HLTH, WWDC observer, Microsoft Ignite,
  SXSW Health): $120K
- Brand + design system maturation (a part-time senior designer
  + design ops): $200K
- Audit funnel optimization (the /audit quiz that feeds the free
  tier — A/B test infrastructure + creative): $100K
- Reserved for the first $1M/quarter consumer marketing push
  (Month 6–9, gated on retention): $400K

**The capping is the discipline.** Paid acquisition gets $80K/mo
because that's the limit at which the audit-funnel + creator-UGC
flywheel still does the heavy lifting and paid is a complement,
not a substitute. The moment paid > organic, the unit economics
warp and the strategic premium evaporates. Counsel-binding.

### 2.5 Talent + recruiting — $1.0M

The 5 critical hires (see §4) drive the company. The $1.0M is
the cost of finding them.

- Executive search fees for 3 of the 5 critical hires
  (CTO + Head of Clinical + Head of BD — the highest-leverage
  searches): $450K (15% of base @ ~$1M aggregate base across
  the three)
- Onboarding budget per hire (relocation if needed, signing
  bonus reserve, first-90-days support): $200K
- Reference package + diligence on hires (we spend on
  back-channel + 360 references to avoid a Pear-style mishire
  at the executive tier): $50K
- Recruiting infrastructure (Ashby ATS, Gem, LinkedIn
  Recruiter, Greenhouse if Ashby doesn't fit): $50K
- Senior engineer recruiting (the 5 engineering hires in §2.1 —
  recruiting fees + sourcing): $200K
- Reserved for unplanned hire #6 (a Head of Growth or a Head
  of Compliance hire pulled forward): $50K

### 2.6 Legal + ops + insurance — $0.7M

The unsexy bucket where most companies underfund and pay later.

- Outside counsel retainer (Cooley or Fenwick): $180K (12
  months)
- D&O insurance ($5M coverage): $40K
- E&O insurance ($5M coverage): $35K
- Cyber insurance ($10M coverage given the data sensitivity):
  $55K
- Workers comp + general liability: $20K
- SOC 2 Type I audit + readiness: $80K
- HIPAA risk assessment + Business Associate Agreement set: $40K
- Privacy counsel (state-by-state + GDPR): $60K
- 409A valuation (twice annually): $20K
- Fractional CFO (12 months @ $8K/mo): $96K
- Bookkeeping + Pilot.com: $36K
- Office / co-working / Mailroom: $25K
- Reserved for state telemedicine compliance + state DEA + state
  privacy variances if the prescriber channel activates: $13K

### 2.7 Founder runway — $0.5M

The line item that buys the company decision-making bandwidth.

- Founder salary $60K/mo × 8 months: $480K
  (Below-market on purpose. The founder takes a 50–60% haircut
  vs. market for a CEO at this stage. The signal: the founder
  is underwriting the dilution risk as much as the investors are.)
- Advisor equity budget (5–7 advisors @ 0.1–0.25% each — handled
  via Carta, near-zero cash cost): $5K cash
- Founder discretionary (travel for BD, board meeting prep,
  reference dinners, the "I need to fly to Seattle to meet
  the Microsoft Viva exec" line item): $15K

This is the bucket that gets quietly trimmed first if the burn
schedule (next section) runs hot. The founder will absorb up to
3 months of salary deferral before any other bucket is touched.

---

## 3. Burn schedule month-by-month

The $10M depletes on the curve below. Approximate, not exact —
the actual draw depends on the timing of the 5 critical hires
and the Found Health partnership signing.

| Month | Net burn | Cumulative | Cash remaining | Trigger |
|---|---|---|---|---|
| 0 | $0 | $0 | $10.00M | Close |
| 1 | $380K | $380K | $9.62M | CTO + Engineer 1 hired |
| 2 | $470K | $850K | $9.15M | Engineer 2 + Head of Clinical hired |
| 3 | $580K | $1.43M | $8.57M | ML engineer + Head of BD hired |
| 4 | $640K | $2.07M | $7.93M | Engineer 4 hired; Found Health signed |
| 5 | $680K | $2.75M | $7.25M | Paid acquisition turns on |
| 6 | $720K | $3.47M | $6.53M | First IRB submission filed |
| 7 | $730K | $4.20M | $5.80M | Conference season starts |
| 8 | $740K | $4.94M | $5.06M | Head of Growth or Compliance hired |
| 9 | $760K | $5.70M | $4.30M | First FDA Q-Sub teleconference |
| 10 | $780K | $6.48M | $3.52M | Second cohort of clinical study enrolls |
| 11 | $790K | $7.27M | $2.73M | Series B raise starts (informal) |
| 12 | $800K | $8.07M | $1.93M | Series B raise OR strategic LOI |
| 13 | $810K | $8.88M | $1.12M | Bridge round contingency live |
| 14 | $820K | $9.70M | $0.30M | **Critical — close or close** |

**Effective runway: 14 months** at full burn. We re-raise (or sign
an LOI) at Month 11–12 so the next round closes by Month 14.

### 3.1 Re-raise vs. strategic acquisition decision tree

At Month 11, the founder + board run the following framework:

1. **If consumer ARR ≥ $15M annualized + 1 GLP-1 partner live +
   IRB approved:** open a Series B raise at $50–80M post,
   targeting $60–80M raise. The strategic premium is preserved
   for an exit at Month 18–24. Best-case path.

2. **If consumer ARR is $8–15M + clinical data interim + no GLP-1
   partner:** open the strategic-acquisition conversation in
   parallel with a Series B. Acquirer LOIs come in at $1.5–2.5B
   per the 6b-action-plan Scenario B. The decision then is:
   take the LOI now, or take the Series B and re-test in 12
   months.

3. **If consumer ARR is $4–8M + no clinical + retention misses
   55%:** open a bridge round at flat or slight markup, $5–8M,
   buy 12 more months to re-test the single-tier pricing model
   or re-introduce a $19.99 tier on main /pricing per the
   seed-deck risk #4.

4. **If consumer ARR is <$4M + retention misses + no clinical:**
   strategic-acquisition conversation becomes the primary path,
   not the alternative. Acquirer LOIs at $200–500M (the
   Scenario "no deal" or low-end Scenario B band per 6b-action-
   plan). Founder returns capital + the strategic acquirer
   buys the substrate IP + the team.

---

## 4. The 5 critical hires

The five hires that determine whether this works. Comp ranges
benchmark to 75th-percentile Series A healthtech in San Francisco
+ NYC (per Pave + Levels.fyi data) for the cash, and to 80th
percentile equity for the dilution.

### 4.1 CTO

**Base:** $280K cash
**Bonus:** $40K target (paid against engineering-org milestones)
**Equity:** 4.0–6.0% (4-year vest, 1-year cliff, single-trigger
acceleration on a change-of-control if terminated)
**Search timing:** Month 1
**Comp note:** higher equity band than the rest because the CTO
inherits the substrate as architect-of-record. Without 5%+ in this
seat, we do not get a real CTO at the Series A stage; we get a
"director of engineering with a title." The 5% is the difference.

**Profile:**
- 8–12 years engineering leadership, last role at a behavioral
  health, telehealth, or AI-infrastructure company
- Shipped to production at scale (10M+ DAU or 1B+ events/day)
- Hands-on enough to code one day a week through Year 1
- Wants the architectural ownership the substrate offers — the
  Layer 1–4 model is the recruiting hook

### 4.2 Head of Clinical

**Base:** $240K cash
**Bonus:** $30K target (paid on IRB approval + first manuscript
submission)
**Equity:** 1.0–2.0%
**Search timing:** Month 2
**Comp note:** equity band is wider than CTO because the comp set
is thinner — behavioral medicine PhDs with industry experience
clear different price points than engineers.

**Profile:**
- PhD or MD-PhD in behavioral medicine, public health, or
  clinical psychology
- 5+ years industry experience (digital therapeutics, Pear-
  alumnus, Akili-alumnus, Big Health-alumnus, Headspace Health-
  alumnus — they all know the regulatory dance)
- Has been principal investigator or co-PI on at least one IRB-
  approved trial
- Comfortable with the publication-track and the regulatory-
  filing-track running in parallel

### 4.3 Head of BD

**Base:** $260K cash + $80K commission OTE
**Equity:** 1.0–1.5%
**Search timing:** Month 3
**Comp note:** OTE structure is unusual at Series A but the BD
hire is signing telehealth + GLP-1 prescriber deals that have
direct revenue lift, so commission is appropriate.

**Profile:**
- Has carried a number at a telehealth, prescriber-channel, or
  payer-facing company (Hims, Ro, Calibrate, Found, Noom,
  Talkspace, Omada)
- Has a Rolodex into the GLP-1 prescriber ecosystem (Calibrate,
  Sequence, Form, Noom Med, Eden, Push Health)
- Has signed PMPM deals before — they know the procurement
  cycle, the legal cycle, the implementation cycle
- Comfortable being the 8th employee, not the 80th

### 4.4 Head of Growth

**Base:** $230K cash
**Bonus:** $30K target (paid on CAC + LTV + retention milestones)
**Equity:** 0.75–1.25%
**Search timing:** Month 4
**Comp note:** equity band reflects the wider candidate pool.
Growth leaders are plentiful at Series A stage; the right one
for COYL is specifically a single-tier-subscription person, not
a paid-acquisition-first person.

**Profile:**
- 5–8 years consumer growth leadership, last role at a
  subscription consumer company (Calm, Headspace, Noom, Strava,
  Duolingo, Whoop, Oura)
- Has owned the CAC + LTV + retention triangle, not just the
  paid acquisition piece
- Comfortable with the funnel-first, paid-second discipline
  (the May 2026 single-tier collapse memo is the test —
  candidates who lead with "we should test $19.99 again" are a
  no; candidates who lead with "the audit funnel is the
  product" are a yes)

### 4.5 Head of Compliance

**Base:** $210K cash
**Equity:** 0.5–1.0%
**Search timing:** Month 6 (later than the rest — compliance can
be fractional for the first 6 months, then full-time once the
FDA Q-Sub teleconference completes and the 510(k) prep starts)
**Comp note:** smaller equity band because the role is less
strategic-premium-driven than the other four — the work is
operationally critical but doesn't move the multiple at exit
the same way the CTO + Head of Clinical does.

**Profile:**
- 7+ years in regulatory / compliance leadership at a digital
  health, medical device, or clinical-research-software company
- Has run a SOC 2 Type II program end-to-end
- Familiar with FDA SaMD pathway + IEC 62304 + ISO 14971
- Has been the named contact on at least one 510(k)

---

## 5. Capital efficiency benchmarks

The honest comparison.

| Company | Lifetime $ raised | Lifetime ARR | $-to-ARR ratio |
|---|---|---|---|
| Noom | $643M | ~$400M | 1.6× |
| Calm | $218M | ~$150M | 1.45× |
| Headspace Health | $349M | ~$210M | 1.66× |
| Calibrate | $175M | ~$80M | 2.19× |
| Hims (pre-IPO) | $244M | ~$140M | 1.74× |
| Akili | $221M | ~$10M | 22.1× (the cautionary tale) |
| Pear Therapeutics | $510M | ~$15M (peak) | 34× (the bankruptcy tale) |

The pattern: consumer-led digital health companies that reach
$100M+ ARR raise $200–650M of dilutive capital to get there. The
ratio is roughly 1.5–2× $-raised-per-$-of-ARR.

**COYL's math is different on purpose.** We are not optimizing
for $-to-ARR. We are optimizing for **$-to-strategic-exit**. The
strategic exit math is:

- $10M raised
- Probability-weighted exit value: $1.85B (per §1)
- **$185 of expected exit value per $1 raised**

The unit of comparison: Manus closed at $2B on $43M of total
funding raised (46× $-to-exit). COYL's projected ratio at the
$10M Series A is **$185 of expected exit per $1 raised**, which
is roughly 4× Manus's actual outcome.

The math holds because of the strategic premium. The strategic
premium holds because the substrate is real, the clinical data
is reachable, and the strategic acquirers (Microsoft + Meta +
Apple) have specific incentives to deny each other the
acquisition.

**The honest framing for investors:** "We are not raising the
$500M Noom raised. We do not need to. The strategic exit math
is in the $-to-exit ratio, not in the $-to-ARR ratio. The
$10M is sized to reach the milestones that unlock the strategic
exit, not to reach $100M of ARR organically."

---

## 6. The "if we miss the milestone" decision tree

The eight milestones, what each one means if it lands, and what
we do if it doesn't.

### Milestone 1 — Close the $10M by Month 0

**Lands:** the rest of this memo executes on schedule.
**Misses:** bridge round at $3–5M from existing investors +
strategic angels (Calibrate / Hims / Ro alumni). Trim the
clinical bucket and the talent bucket; preserve engineering and
regulatory.

### Milestone 2 — CTO hired by Month 2

**Lands:** engineering org compounds from Month 2 onward.
**Misses:** Iman remains acting CTO. Slow the engineering ramp by
2 months. Pull a senior engineer up to "VP Eng" with smaller
equity, defer the CTO search to Month 4–5.

### Milestone 3 — Found Health partnership signed by Month 4

**Lands:** IRB submission filed Month 6, clinical timeline on
schedule.
**Misses:** activate the secondary partnership (Ro Body or
Sequence) within Month 5. If both miss, run the clinical study
independently with a contracted CRO — adds $400K to the clinical
bucket, comes from the operating buffer.

### Milestone 4 — Series A consumer ARR ≥ $8M annualized by Month 8

**Lands:** the single-tier pricing collapse is validated, the
strategic-multiple math holds.
**Misses (between $4M and $8M):** preserve the spend, slow the
paid acquisition, re-test the audit funnel CRO. Re-introduce a
$19.99 tier on main /pricing if Month 9 conversion still misses.
**Misses (below $4M):** retention is the problem, not the
pricing. Hire the Head of Growth a month early (Month 3 instead
of Month 4) and put retention design on the critical path.

### Milestone 5 — IRB approval + first patient enrolled by Month 8

**Lands:** clinical interim data possible by Month 14, full data
by Month 20.
**Misses:** re-scope the trial to an effect-size-estimation
study (smaller N, faster timeline). Manuscript becomes "interim
analysis" rather than "primary outcome." Strategic acquirers
still get a clinical data point at the LOI conversation.

### Milestone 6 — FDA Q-Sub teleconference completed by Month 9

**Lands:** 510(k) pathway clarified, Series B fundable on the
FDA narrative.
**Misses:** likely scheduling issue, not substantive. Pushes
510(k) prep 2–3 months later. Doesn't change the strategic-exit
math materially.

### Milestone 7 — One GLP-1 partner live by Month 10

**Lands:** the $30M PMPM upside is in the pipeline. Series B
prices off this.
**Misses:** preserve the BD spend, extend the runway by 2
months from the operating buffer, re-test the partner pitch at
HLTH (Month 11).

### Milestone 8 — Series B raise OR strategic LOI by Month 12

**Lands:** the company is funded for Years 2–3.
**Misses:** the bridge round at Month 13 buys 8 months. We do
not get to Milestone 8 + 12 months of cushion; we get to
Milestone 8 + the bridge. The bridge is fine but it dilutes
more, so we prefer to hit Milestone 8 cleanly.

---

## 7. The discipline

Three lines that govern the burn:

1. **Paid acquisition is capped at $80K/mo.** The cap is a
   forcing function on the audit-funnel + creator-UGC flywheel.
   Counsel-binding.

2. **Founder salary is the first cut.** Up to 3 months of
   founder salary deferral before any other bucket is trimmed.
   The signal: the founder underwrites the dilution risk.

3. **The clinical bucket is the last cut.** If we trim, the
   clinical spend is preserved because clinical data is the
   strategic-premium unlock. Trim talent before trimming
   clinical.

---

*Capital Allocation Memo · May 2026 · Iman Schrock · The math is
defensible. The execution is the underwrite.*
