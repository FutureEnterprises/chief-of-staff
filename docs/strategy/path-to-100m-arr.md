# COYL — the honest path to $100M ARR (and 1M users)

*Prepared June 2026. The plan to turn the consumer craze + clinical
engine into a $100M ARR company. Read the math first — it changes the
plan.*

---

## The math you need before you pick "1M users" as the goal

**1 million consumer users is NOT a $100M ARR business. It's a ~$2M
ARR business.** Here is the arithmetic, because everything downstream
depends on it:

- Consumer subscription price: ~$60/year effective (after the
  monthly/annual blend, churn, refunds, app-store cut).
- Quiz/archetype apps convert free→paid at **1–3%** (Co-Star, LORE —
  the core value is delivered in the free reveal, so willingness-to-pay
  is structurally low).
- 1,000,000 users × 3% × $60 = **$1.8M ARR.** At 2%, $1.2M.

To get to **$100M ARR on consumer subscriptions alone** you'd need
**~40–80M users** — Duolingo scale (≈100M MAU → ~$750M revenue). That
is not a 2-year plan; it's a 7-year plan and a different company.

**So the consumer app is the WEDGE, not the engine.** It buys you four
things, all real, none of which is $100M of subscription revenue:
1. **Brand** — "I got COYL'd" as language.
2. **Users + the engagement dataset** — the thing that makes the
   clinical pitch defensible.
3. **A cheap acquisition funnel** — content + virality instead of paid CAC.
4. **A small direct-consumer revenue line** (~$2–5M ARR at 1M users).

## Where the $100M actually comes from

The $100M ARR is the **B2B2C clinical layer (Rebound)** — the buyer
with budget, where ARPU is 3–5× the consumer wallet:

| Channel | Net ARPU | Patients for $100M ARR |
|---|---|---|
| Telehealth prescribers ($19 PMPM, 60/40 split) | ~$132/yr | ~760K |
| Employer plans ($25 PMPM) | ~$300/yr | ~330K |
| PBM formulary (CVS Caremark etc.) | blended | the unlock — millions of plan members |

760K paid patients is reachable: the GLP-1 market is 10M today → 25M
by 2030; Hims has 2.4M subs, LifeMD 350K. **The consumer craze is how
you win that wedge faster, cheaper, and with a brand the prescribers
and PBMs already recognize.**

**Verdict:** Do the consumer craze. Be the best app. Get to 1M users.
But underwrite it as *the wedge that unlocks the $100M B2B2C engine* —
not as the engine. The two are not in conflict; the craze feeds the
clinic. Abandon Rebound and you're Co-Star (30M users, ~$50–100M total
company). Keep both and you're a platform.

---

## "Best app" = retention, not features

The survival metric is **Day-7 retention > 25%**. A craze that spikes
and dies (no retention) is worse than a slow burn — you'll have spent
the paid budget and have nothing compounding. The product is built; the
job now is to prove the catch actually changes behavior and the daily
ritual hooks. Everything below serves retention + virality.

---

## YOUR TO-DOS — four tracks, by owner

### Track 0 — Founder-only gates (THIS WEEK, blocks everything else)
1. **GCT General Counsel meeting.** Outside-CEO/Chairman clearance,
   SEC disclosure framework, D&O. Until this clears: no investor
   outreach, no press, no revenue claims. *(From the v3 plan — still
   the #1 gate.)*
2. **Hire a growth operator** (contractor, ~$20K/90 days, one prior
   viral consumer launch — ex-Cash App / Strava / Calm / Duolingo
   growth). The craze lives or dies on the content engine and you
   can't run it. **This is the most important hire — before the CEO.**
3. **The 3 clinical TODOs** (your `round-3-audit-action-items.md`):
   max Found Health RCT enrollment, publish the personal GLP-1 essay,
   file 3 provisional protocol patents. These keep the $100M engine
   alive while the craze runs.

### Track 1 — Ship the consumer app (TECHNICAL — Claude can do most)
1. **Connect the viral loop to the live funnel** *(launch-blocker —
   the loop is built but not wired):*
   - `/audit` result → link to `/card/[slug]` (the 9:16 share surface).
   - Homepage + nav → prominent `/waitlist` CTA ("COYL is invite-only").
   - Audit completion → "request access" → `/waitlist?archetype=…`.
2. **Verify PostHog is capturing in production** (the key is set;
   confirm `audit.started` / `audit.completed` / `audit.shared` events
   actually land).
3. **Waitlist → email send** when spots open (wire Resend to the
   `WaitlistEntry` model; you have RESEND_API_KEY).
4. **EAS build → TestFlight** (eas.json exists). Then App Store +
   Play submission. *(You run `eas build`; Claude preps config + ASO.)*
5. **App Store listing / ASO**: Lifestyle category (NOT Health — avoids
   the medical-device disclosure + ED third-rail), title with the
   primary keyword, 5 screenshots (the archetype cards), 15-sec preview.
6. **Retention loop**: the daily-ritual push + the weekly "Week in
   Patterns" recap card (built) need to fire on a schedule and pull
   users back. Wire the cadence.

### Track 2 — Launch the growth machine (GROWTH HIRE + founder)
1. **Faceless content engine**: 4 IG + 4 TikTok accounts, different
   emotional angles (aspiration / fear / identity / frustration). None
   tied to your name (GCT firewall).
2. **30 pre-made videos** before you need users: "What's your autopilot
   type?" POVs, "COYL caught me" screen-recordings, the 3-second-window
   cinematic, GLP-1 rebound. Post 3×/day for 30 days; repeat the
   winning format until the algorithm finds it.
3. **Invite-only launch** (the waitlist is built): seed 30–50
   micro-influencers (10K–50K, GLP-1/wellness), each with invite codes;
   public waitlist with line-jumping; then open.
4. **Spark Ads** only on organic posts already breaking — highest-ROI
   paid format. No cold paid creative.

### Track 3 — The $100M engine (CEO/clinical — parallel, never paused)
1. **Found Health RCT** → publishable evidence (the moat).
2. **Prescriber pipeline**: LifeMD, Mochi, Henry, Eden — personalized
   cold outbound once GCT clears.
3. **Employer + PBM channel**: CVS Caremark via CVS Health Ventures
   (the strongest distribution lever — one formulary deal = millions
   of plan members).
4. **Clinical co-founder / CMO** — healthcare VCs won't lead a seed
   for a clinical product with a solo non-clinical CEO.

---

## North-star metrics (the dashboard that matters)

| Metric | Target | Why |
|---|---|---|
| Day-7 retention | >25% | Survival. Below this, stop paid spend and fix the loop. |
| Quiz → card share rate | >15% | The viral coefficient's numerator. |
| Waitlist k-factor | >1.0 | Each user brings >1 — that's exponential. |
| Weekly active free users | 5K → 1M | The wedge size. |
| B2B2C LOIs signed | 1 by M3, 2 by M6 | The $100M engine starting. |
| Paid B2B2C patients | 760K = $100M ARR | The actual goal. |

---

## The one-paragraph plan

Be the best consumer behavioral app and get to 1M users via a
faceless content engine + an invite-only viral loop — that's the
**wedge**: brand, users, data, cheap CAC. But underwrite the company on
the **B2B2C clinical engine** (Rebound: prescribers → employers → PBMs),
where the ARPU is high enough that ~760K paid patients = $100M ARR. The
craze feeds the clinic. Run both. Hire a growth operator this week, get
GCT to clear the role, keep the RCT alive — and let Claude wire the
viral loop into the live funnel and ship the app to the stores.

*Owner: founder. Re-read before every strategy call. The math doesn't
change because the goal is exciting — 1M users is the wedge, B2B2C is
the $100M.*
