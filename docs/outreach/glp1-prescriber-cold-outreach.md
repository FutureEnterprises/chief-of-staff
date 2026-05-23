# GLP-1 prescriber cold outreach — May 2026

The pages exist. This document is the script that gets them in front of
50 high-profile GLP-1 prescribers on X/LinkedIn.

## The asset
- **Landing:** https://coyl.ai/rebound/for-clinicians
- **Hook:** Cambridge meta-analysis on GLP-1 discontinuation (Wilding
  et al., 2022) — 60% of weight lost returns within a year of stopping
- **Offer:** Free for the first 25 patients on the clinic panel + a
  co-branded /rebound landing page with the clinic's name and NPI
- **CTA:** /clinician/onboarding (existing 4-step provisioning flow,
  ref-tagged so audit_funnel_events attributes the signup to this
  channel)

## The list — 50 prescribers
Build the list from these three sources, prioritizing prescribers who
already publish about GLP-1 maintenance, regain, or behavioral
adjunctive therapy:
1. ASMBS (American Society for Metabolic and Bariatric Surgery)
   active members publishing on social
2. Obesity Medicine Association — physician members with public
   X/LinkedIn presence
3. Endocrine Society GLP-1 SIG — co-authors on STEP / SURMOUNT trials
   and follow-up papers

Save the working list to `~/Documents/coyl-outreach/glp1-prescriber-list.csv`
with columns: name, handle_x, handle_li, specialty, last_glp1_post_url,
status.

## The cold-DM template (X / LinkedIn — under 300 chars)
Subject line on LinkedIn: **"GLP-1 maintenance — Cambridge regain meta-analysis"**

> Dr. [Last Name] — saw your post on [specific GLP-1 paper/topic].
> Built a behavioral layer for the post-shot rebound the Cambridge
> meta-analysis described. Four phenotypes, 3-second interrupt at the
> 9 PM script. Free for your first 25 patients with a co-branded
> landing page. Worth 60 seconds?
>
> https://coyl.ai/rebound/for-clinicians

## The follow-up if they reply
- **If interested:** point them to /clinician/onboarding. Four screens,
  under five minutes. They walk out with a co-branded
  https://coyl.ai/rebound/[clinic-slug] URL they can hand to the next
  patient.
- **If skeptical about evidence:** send the COYL maintenance protocol
  doc + the /clinical-study page. Acknowledge the cohort is pre-N≥20.
- **If asked about HIPAA:** BAA is executed before the pilot starts;
  we route GLP-1 patient data through the same controls as the general
  clinic onboarding. Privacy posture is documented at /privacy.
- **If asked about pricing post-pilot:** $9/patient/mo, paid by the
  patient on the consumer Rebound tier or by the clinic at a
  negotiated PMPM. Dashboard, BAA, white-label included.

## Telemetry
The /clinician/onboarding flow attributes via `?ref=rebound-clinician`
(hero CTA) or `?ref=rebound-clinician-ask` (closer CTA). Both feed
audit_funnel_events. Pull a weekly summary by ref param to see which
DM template + which segment of the list is converting.

## Tracking
- Outreach kanban: Notion DB "GLP-1 prescriber outreach"
- Sent → Read → Replied → Onboarded
- Target: 50 DMs sent in week 1, 10+ replies, 3+ pilots started by
  end of week 2

## What this does NOT do
- Send unsolicited email — DMs only on platforms the prescriber has
  opted into receiving messages on
- Promise outcomes — the page acknowledges the cohort is pre-N≥20 and
  the phenotype prevalence ranges are priors, not finalized statistics
- Bypass FDA jurisdiction — COYL is behavioral support, not medical
  treatment. The page and DM both stay inside that framing.
