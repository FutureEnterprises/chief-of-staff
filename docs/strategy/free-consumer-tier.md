# Free Consumer Tier — load-bearing brand commitment

*Decided May 28, 2026. Owner: founder. Reviewed quarterly.*

---

## The commitment

**The core Rebound product is free, forever, for any consumer on a GLP-1
medication or coming off one — including the uninsured, the
cost-discontinuers, and the cash-pay patients whose insurance won't
cover a behavioral-health program.**

This is not a marketing decision. It is a brand-foundational decision.
The mechanism that catches the 9 PM negotiation works whether or not
the patient's employer pays $25 PMPM for Rebound. Gating the catch
behind a paywall would be incompatible with the founder's stated
reason for building COYL.

Revenue comes from B2B2C (telehealth prescribers, employer plans, and
eventually PBM channel). Consumers help fund the operation by being
the proof — engagement data, testimonials, community — but they
themselves never get charged for the floor of the product.

---

## Why this is a strategic asset, not a cost

1. **It expands the addressable population to anyone who needs the
   help, not just patients on insurance plans with Rebound contracts.**
   That's the moral case and it is the load-bearing reason.
2. **Free-tier engagement data is what makes seed pitches credible.**
   "10,000 free users, 41% week-4 retention, 27 danger windows
   intercepted per user per week" sits inside the seed deck alongside
   the partner pilot data. Healthcare VCs do not pay premium for
   consumer-only stories, but they discount stories that have no
   real-user validation. Free tier closes that discount.
3. **It is the press hook.** "Free behavioral interrupt layer for
   anyone on a GLP-1" is a TC/STAT/NYT headline. "$19 PMPM B2B2C
   pilot" is not.
4. **It is the recruiting hook.** A clinical co-founder who has spent
   their career watching patients fail GLP-1 maintenance will sign on
   to "free for every patient" faster than to "$19 PMPM with a
   partner-revenue split."
5. **It is the regulatory positioning.** A free wellness/PDURS product
   is harder to characterize as SaMD than a paid clinical service.
   See `docs/protocol/UAP-0.1.md` for the regulatory framing.

---

## The four components

| # | Component | Status | Cost |
| - | --------- | ------ | ---- |
| 1 | **Free archetype quiz** at coyl.ai/audit — name your autopilot pattern in 90 seconds, no signup gate | ✅ Live | $0 |
| 2 | **Free Rebound iOS app** on TestFlight then App Store — basic danger-window interrupts, archetype-specific, no paywall, no signup beyond email | ⏳ Build target Month 4-5 | ~$5-10K/mo at scale, capped at 10K active users initially |
| 3 | **r/Rebound subreddit + founder-voice content** — weekly post in r/Ozempic / r/Zepbound, plus monthly Substack essay. First essay shipped under `docs/essays/`. | 🟡 Essay drafted; subreddit + Substack creation = founder task | $0 (founder time) |
| 4 | **Anonymous community engagement data** as a first-class seed-pitch metric — quizzes completed, weekly active free users, intercept rate, retention curves | 🟡 Telemetry hooks need spec; current site has partial instrumentation | <$1K/mo (already-budgeted analytics) |

---

## What this is NOT

- **Not consumer paid acquisition.** No Meta, TikTok, Google ads for
  individual user acquisition. CAC math is brutal in the GLP-1
  audience; the org cannot sustain it bootstrapped or pre-seed.
  Acquisition is organic only — Reddit, founder content, partner
  funnels, word of mouth.
- **Not a Day 1 consumer subscription business.** The premium consumer
  tier (voice-cloned, custom archetypes, family-shared kill switches)
  is deferred to Month 9-12 minimum, and only ships once B2B revenue
  is stable. We do not bet the company on premium consumer LTV.
- **Not infinite scale.** The free tier is capped at 10K active users
  initially to keep infra costs in line. When B2B revenue funds it,
  the cap lifts.

---

## Decision rules

These rules exist to keep the commitment from drifting under fundraise
or board pressure later.

1. **The free tier never gets a paywall on the floor of the product.**
   "The floor" = archetype quiz, basic danger-window interrupts,
   personal kill switch, audit log access. These are mission-critical.
2. **Premium consumer features (when they ship) are additive, never
   substitutive.** If a feature was free yesterday it stays free
   tomorrow.
3. **Partner-paid features may be richer than the free tier** (clinician
   dashboards, cohort analytics, PHI-compliant audit) but the
   behavioral interrupt that catches the patient at 9 PM does not
   depend on whether their employer pays $25 PMPM. Same fire, same
   moment, same script.
4. **If a board member or investor asks us to gate the free tier
   later** — the answer is no, and they have read this doc before
   they took the round. Pin this doc as an exhibit to the seed
   investor side letter.

---

## How this lives in the seed deck

Two slides:

- **Slide 4 (the "what we're building" slide):** lead with the free
  tier. Patients on GLP-1s shouldn't lose the weight back because their
  employer didn't pick the right benefits vendor. The interrupt is free.
- **Slide 11 (the "how we make money" slide):** B2B2C revenue from
  prescribers and employer plans. The free tier is the
  proof-of-engagement that those buyers want. Show the engagement
  curve from the free users alongside the per-patient revenue from the
  partner pilots.

A healthcare VC who finds this incompatible with their model is the
wrong investor for COYL. The next one will think this is the most
defensible thing in the deck.

---

## Metrics

Surface these in every monthly investor update once the free iOS app
ships:

- Free users active (weekly)
- Quizzes completed (cumulative)
- Danger windows detected per user per week
- % intercepted that change behavior at week 4
- Free-to-partner-pilot conversion (when patients on a partner plan
  later realize their plan covers Rebound and "upgrade" to the partner
  tier)
- Retention curve at week 4 / 12 / 26

---

## Out-of-scope for this commitment

- The B2B2C partner roadmap (Found, LifeMD, Mochi, Henry, employer
  pilots) — see `docs/strategy/coyl-6mo-plan-v3.md` (forthcoming) and
  `docs/strategy/founder-action-master-list.md`.
- The Year-2 protocol-platform roadmap (UAP v1.0, second vertical,
  Whoop/Headspace integrations) — see the v3 patch in
  `docs/strategy/coyl-6mo-plan-v3.md` (forthcoming).
- The clinical co-founder recruiting plan — see v3 patch.

---

*This doc supersedes any prior "is the free tier a permanent thing"
question. The answer is yes, it is permanent, and the rest of the
plan is built around that.*
