# Cohort refresh process — replacing illustrative ratios with actuals

> Owner: founder + data lead (when hired). The `/how-coyl-knows-you`
> page ships with illustrative input-dependence ratios (95% / 70% /
> 45% / 25% / 10% across Week 1 → Year 2+). This document specifies
> the data, queries, and process for replacing those illustrations
> with measured actuals once the cohort is large enough.
>
> Trigger condition: n ≥ 100 users with ≥ 90 days of continuous
> usage AND average ≥ 1 interrupt-tagging event per active week.
> Below that bar, illustrative ratios stay. Above it, we publish.

---

## The numbers we're committing to measure

For each cohort stop (Week 1, Month 1, Month 3, Year 1, Year 2+),
compute the **input-dependence ratio** as:

```
inputDependenceRatio = activeSignalsCount / (activeSignalsCount + passiveSignalsCount)
```

Where, per user per day:

- **activeSignalsCount** = sum of:
  - Slip events the user logged (manual + quick-slip)
  - Excuse classifications the user typed/selected
  - Interrupt-feedback tags the user pressed manually
  - Commitment activations the user confirmed
  - Audit answers the user gave (counts once at week 1)
  - Danger window edits the user made (excludes auto-created)

- **passiveSignalsCount** = sum of:
  - Apple Health / Watch HRV samples that fed the model
  - Browser-extension tab-open events
  - Location geofence events (kitchen / office)
  - Calendar drift signals
  - Time-of-day window matches (computed)
  - Day-of-week alignment matches (computed)
  - Inferred interrupt-feedback tags (the `*/15 cron` ships)
  - Inferred danger windows that fired correctly (the audit-finalize endpoint)

Both counts are per-user-per-day, then averaged across the cohort
sliced by cohort-stop bucket (Week 1, Month 1, etc.).

---

## The cohort-stop buckets

A user "is at" a stop when their `User.createdAt` is N days from
`now`. Slice the population:

| Stop | Created-at age window | Excludes |
|---|---|---|
| Week 1 | 0–7 days | Users < 24h old (incomplete onboarding) |
| Month 1 | 8–30 days | Users with < 3 sessions in week 1 |
| Month 3 | 31–90 days | Users churned (no session in 14 days) |
| Year 1 | 91–365 days | Same churn filter |
| Year 2+ | 366+ days | Same |

A user can contribute to multiple stop measurements over their
lifetime — when they're at Week 1 they show up in the Week 1
bucket; when they hit Month 1 they show up in Month 1's; etc.

---

## The query (Postgres / Prisma)

```sql
-- Active-signal count per user per day
WITH active_per_day AS (
  SELECT
    user_id,
    DATE(created_at AT TIME ZONE 'UTC') AS day,
    COUNT(*) AS active_count
  FROM (
    SELECT user_id, created_at FROM slip_records
    UNION ALL
    SELECT user_id, created_at FROM excuses
    UNION ALL
    SELECT user_id, created_at FROM productivity_events
      WHERE event_type = 'AUTOPILOT_INTERRUPTED'
        AND metadata_json->>'feedbackSource' = 'manual'
    UNION ALL
    SELECT user_id, created_at FROM productivity_events
      WHERE event_type = 'COMMITMENT_CREATED'
  ) u
  GROUP BY user_id, day
),
passive_per_day AS (
  SELECT
    user_id,
    DATE(created_at AT TIME ZONE 'UTC') AS day,
    COUNT(*) AS passive_count
  FROM productivity_events
  WHERE event_type IN (
    'AUTOPILOT_INTERRUPTED',  -- the firing itself counts once passive
    'FEATURE_USED'             -- catch-all for inferred-feedback / extension / health signals
  )
  -- AND metadata_json->>'source' IN ('inferred', 'apple_health', 'extension', 'geofence')
  GROUP BY user_id, day
)
SELECT
  user_id,
  AVG(active_count) AS avg_active_per_day,
  AVG(passive_count) AS avg_passive_per_day,
  AVG(active_count::float / NULLIF(active_count + passive_count, 0)) AS dependence_ratio
FROM active_per_day
FULL OUTER JOIN passive_per_day USING (user_id, day)
GROUP BY user_id;
```

Then bucket users by `User.created_at` age and aggregate the
per-user ratios per stop. Use the median (NOT the mean) to avoid a
single power-user dragging the cohort.

---

## When to publish

The trigger threshold:
- **n ≥ 100 users per stop bucket** (so Week 1 has 100+, Month 1 has 100+, etc.)
- **σ / mean < 0.4** per bucket — the within-bucket variance is low enough that the median is meaningful
- **The Month 3 bucket is the gating bucket** — until we have 100 users with 90 days of usage, do not publish. The illustrative trajectory stays.

When all three conditions hold, edit `apps/web/src/app/(wedges)/how-coyl-knows-you/knows-you-view.tsx`:

1. Replace the `ARC[].ratio` values with the actuals
2. Replace `ARC[].body` text to reference real numbers, not predicted
3. Remove the disclaimer line above the ratio bar ("Projected trajectory based on early cohort behavior…")
4. Add a new line below the ratio bar: "Last updated: [month YYYY] · n=[N] users at this stop"
5. Update the page metadata description to drop "80%" and replace with the actual Week-1 number
6. Update the OG card if the 80% number appears there

---

## What "9:47 PM" becomes when real data is available

The illustrative 9:47 PM layered reveal (`LAYERS_947` in
`knows-you-view.tsx`) is currently fabricated. When we have ≥ 10
users with ≥ 6 months of usage AND HRV + location signals
connected, replace it with a single REAL session (anonymized, with
the user's consent).

Process:
1. Identify a candidate session via SQL: a user who had an active
   danger window match + HRV spike + location geofence + a fired
   interrupt + a tagged outcome within a 60-min span.
2. Request explicit consent from the user. Frame: "We'd like to
   show a real version of your COYL evening on the public page. Your
   name and exact identity are not shown. The timestamp + the event
   sequence is real. Do you consent?"
3. Replace `LAYERS_947` with the real timeline.
4. Update the lede: "A real timeline. [Anonymized user name like
   'M.'], month [N] of using COYL. Used with consent."
5. Remove the "Illustrative — example user, not a real session"
   disclaimer.

Keep one illustrative variant in `docs/` for press packets — the
real one stays on-product, the illustrative one is for journalists
who want a "general example."

---

## What we're NOT going to do

- DO NOT publish per-user data even anonymized without explicit
  consent from that user. Behavioral data is more sensitive than
  most users realize until they see it printed.
- DO NOT replace the illustrative numbers with theoretical numbers
  from research papers. The whole point is to publish what WE
  measured, not what JITAI literature predicts.
- DO NOT lower the n=100 threshold to publish sooner. The risk is
  a small-n cohort giving us a flattering ratio that doesn't hold
  at scale, and a journalist holding it against us six months later.

---

## Sanity-check after the first refresh

Once the actuals replace the illustrative ratios, verify the
following the day of the refresh:

- The Week 1 number is HIGHER than Month 3's, which is HIGHER than
  Year 1's. If the curve is flat or inverted, something is wrong
  with the query — investigate before publishing.
- The 9:47 PM real session (if shipped) has an interrupt fired AND
  a tagged outcome. Sessions without outcomes are not
  representative.
- The risks accordion's "shipping fix" copy still maps to real
  shipped features — don't claim a fix is shipping if it isn't.
- The Behavioral Context Object example on `/psyche` still uses the
  same schema as what's actually exported in `/protocol`.

---

## Cadence

After the initial refresh, recompute and republish quarterly. Each
quarter, the data should show:
- Decreasing input dependence at every stop
- Increasing passive signal coverage (more HRV connections, more
  browser extensions installed, more iOS lock-screen feedback)
- A clear month-over-month delta visible in the deltas section the
  monthly Autopilot Map cron already computes

If a quarter shows REGRESSION (input dependence going UP instead of
down), that's the most important signal to investigate. Publish a
follow-up "what we learned" post + adjust the shipping-fix roadmap.

---

## Filing this work

When the first refresh ships, also:
1. Update `docs/strategy/strategy-v3.md` Section 4 (the data moat
   argument) with the actuals.
2. Update the seed deck Slide 9 (the cohort metric slide).
3. Send the investor update for that month with the headline number.
4. Add a section to the press kit at `/press` linking to the
   updated `/how-coyl-knows-you` with the actuals.

---

*Cohort refresh process v1 — May 2026. Replaces illustrative input-
dependence ratios on `/how-coyl-knows-you` with measured cohort
actuals when n ≥ 100 per bucket with σ/mean < 0.4 on Month 3.*
