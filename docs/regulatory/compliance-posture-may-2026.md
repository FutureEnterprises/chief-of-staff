# COYL Compliance Posture — May 2026

**Document type:** Internal compliance & risk brief.
**Audience:** Founder, prospective outside counsel, prospective acquirer / DD reviewer.
**Author:** Strategy review, May 2026.
**Status:** Working draft. **Not legal advice.** Sections flagged
[OUTSIDE COUNSEL] require an attorney who specializes in (a) FDA digital
health, (b) FTC health-claims substantiation, and (c) HIPAA / CMIA / state
health data law before they are relied on for anything other than internal
planning.

> **One-line posture:** COYL is publicly making B2B claims (HIPAA-aware
> data layer, BAA executed before pilot starts) and clinical claims (60%
> Cambridge regain stat, four-phenotype prevalence numbers) that the
> underlying repo does not yet substantiate. None of this is fatal. All of
> it is fixable in the next 30–60 days. None of it should be in market a
> day longer than necessary in its current form.

---

## 1. What COYL Claims Publicly

Verbatim claims pulled from production marketing surfaces as of May 2026.
Page paths are inside `apps/web/src/app/(wedges)/` and
`apps/web/src/app/(legal)/` unless noted.

### 1.1 HIPAA / BAA claims

| Surface | Claim (verbatim) |
|---|---|
| `clinician/page.tsx` (the "What you get" list) | "HIPAA-compliant BAA-covered data infrastructure" |
| `clinician/page.tsx` (Clinician Pro tier copy) | "Dashboard, BAA, white-label — all included." |
| `rebound/for-clinicians/page.tsx` (pilot offer block) | "HIPAA-aware data layer, BAA executed before the pilot starts" |
| `rebound/for-clinicians/page.tsx` ("After the pilot" tier) | "Clinician dashboard, BAA, and white-label included at no additional cost." |
| `clinical-study/page.tsx` (Privacy & data) | "HIPAA-aligned handling end-to-end. BAA available for prescriber partners covered as Business Associates." |

Note the language drift: "HIPAA-compliant" on `/clinician`,
"HIPAA-aware" on `/rebound/for-clinicians`, "HIPAA-aligned" on
`/clinical-study`. Three different verbs across three live pages making the
same underlying promise. **First action item is alignment on the precise
verb the company can defend.**

### 1.2 FDA / device-status claims

| Surface | Claim |
|---|---|
| `(legal)/terms/page.tsx` §4.3 | "Behavioral support, not medical treatment — talk to your prescriber about dosing and taper schedule." |
| `(wedges)/safety/page.tsx` (the "What COYL is not" column) | "Not a treatment for any medical condition. Not for substance use disorder, eating disorders, self-harm, or psychiatric crisis." |
| `(wedges)/safety/page.tsx` | "Not a diagnostic tool. The audit names an autopilot family. It does not diagnose any mental health, eating, or substance use condition." |
| `(wedges)/clinical-study/page.tsx` (footer disclaimer) | "COYL is a behavioral support tool. It is not a medical device, treatment, or therapy." |

The consumer/marketing surface is **explicitly non-device**. This is the
single strongest piece of regulatory hygiene COYL has right now.

The internal `docs/regulatory/regulatory-strategy.md` describes a **future**
510(k) + Breakthrough Device Designation pathway (M14 target clearance).
That is a separate, future-tense posture and is not contradicted by the
current consumer-facing "not a medical device" language — but the moment
COYL files the Q-Sub, the two narratives must be reconciled in marketing.

### 1.3 Clinical-evidence claims

| Surface | Claim |
|---|---|
| `rebound/for-clinicians/page.tsx` hero | "60% of the weight your patients lost on Ozempic, Wegovy, or Zepbound comes back within a year of stopping." |
| `rebound/page.tsx` | "A May 2026 Cambridge meta-analysis pooled discontinuation cohorts across semaglutide and tirzepatide trials and found patients regain an average of 60% of their initial weight" |
| `rebound/for-clinicians/page.tsx` Citations footnote | "Wilding JPH, Batterham RL, Davies M, et al. Weight regain and cardiometabolic effects after withdrawal of semaglutide. *Diabetes Obes Metab.* 2022;24(8):1553–1564. STEP 1 extension trial." |
| `lib/rebound-archetype.ts` (Night Rebounder) | "64% of GLP-1 maintenance failures happen between 9 PM and midnight" |
| `lib/rebound-archetype.ts` (Weekend Rebounder) | "Weekend rebounders regain 2x faster than weekday-steady patients post-taper, per the COYL maintenance protocol cohort." |
| `lib/rebound-archetype.ts` (Stress Rebounder) | "~58% of GLP-1 maintenance slips correlate with a stress event in the preceding two hours." |
| `lib/rebound-archetype.ts` (Reward Rebounder) | "~71% of Reward Rebounders cite a perceived win in the 60–120 minutes before their last slip." |
| `rebound/for-clinicians/page.tsx` Citations footnote (the saving grace) | "Per-phenotype prevalence ranges are derived from the COYL maintenance protocol pre-launch cohort and the danger-window-learner priors. Until N > 20 these are pre-cohort ranges, not finalized published statistics — surfaced for clinical judgment, not regulatory claims." |

### 1.4 Privacy infrastructure claims

From `(legal)/privacy/page.tsx`:

- "All data is encrypted in transit (TLS 1.3) and at rest (AES-256)"
- "Authentication is managed by Clerk with support for multi-factor authentication"
- "Anthropic processes data in accordance with their data processing agreement and does not use your data to train their models"
- "We do not sell your personal information to third parties."
- 30-day deletion on account deletion, 90-day AI log retention, 7-year billing retention.

CCPA and GDPR sections are present and reasonable for a B2C posture.

---

## 2. What's Actually In Place

### 2.1 BAA / HIPAA infrastructure — *the gap*

A repo-wide scan for the strings `BAA`, `business-associate`, `hipaa`,
`HIPAA`, `Business Associate Agreement` returned **no template document, no
executed agreement, no signed-BAA tracking table, no PHI-segregated data
store schema marker, no breach-notification runbook, no DPIA/PIA, no risk
assessment per 45 CFR 164.308(a)(1)(ii)(A).** The only `BAA` references
are the marketing strings cited in §1.1.

What does exist:

- TLS 1.3 in transit (Vercel default + Supabase enforces TLS).
- AES-256 at rest claim in `/privacy` — this is **inherited** from Supabase's
  managed Postgres encryption (true), not COYL-controlled key management.
- Standard Clerk-managed auth with MFA support.
- A `Consent` / `UAPGrant` model exists in
  `packages/database/prisma/schema.prisma` (line ~1999) for the
  User-Authority Protocol — but that is *autonomous-agent action consent*,
  not HIPAA authorization for use/disclosure of PHI.
- An `AuditFunnelEvent` table (line ~1935) hashes IPs and stores anonymous
  session IDs — reasonable privacy hygiene for marketing telemetry, but
  unrelated to HIPAA.
- No documented breach-notification policy. No documented retention
  enforcement code path (the 30-day deletion is stated in policy; the
  scheduled job to enforce it was not located in this scan and should be
  confirmed).

### 2.2 Clinical evidence

- `docs/clinical-study/protocol.md` is drafted. IRB pathway designed for
  expedited Category 7 review. **Zero patients enrolled.** This is stated
  honestly on `/clinical-study` ("No patients enrolled yet").
- The Cambridge / Wilding et al. 2022 citation is real and roughly
  consistent with the "60% within a year" claim, though Wilding's exact
  finding is regain of *~two-thirds of prior weight loss* in the STEP 1
  extension. The site's "60%" framing is in the defensible range.
- The four-phenotype prevalence numbers (64% / 2x / 58% / 71%) are
  **honestly disclaimed** on `/rebound/for-clinicians` as "pre-cohort
  ranges, not finalized published statistics — surfaced for clinical
  judgment, not regulatory claims." But that disclaimer lives in the
  citations footnote, not next to the numbers in the consumer-facing share
  cards (`lib/rebound-archetype.ts:shareStat`). A patient who screenshots
  "64% of regain happens in the dose-trough window" and posts it to
  Twitter is propagating a number COYL has explicitly told its lawyers it
  cannot yet defend.

### 2.3 Regulatory artifacts

- `docs/regulatory/` contains: `regulatory-strategy.md`,
  `510k-pathway-memo.md`, `breakthrough-device-eligibility.md`,
  `fda-q-submission.md`. All four are well-drafted plans, not filings.
- No Q-Sub has been filed. No 510(k) submission. No QMS in place. No DHF.
  No IEC 62304 documentation. No ISO 14971 risk file.
- The plan budgets $370K over 14 months. Not yet spent.

---

## 3. Gap Analysis — Claimed vs. Actual, Ranked by Risk

| # | Claim | Actual state | Risk tier |
|---|---|---|---|
| 1 | "HIPAA-compliant BAA-covered data infrastructure" (`/clinician`) | No BAA template, no risk assessment, no breach plan, no PHI segregation, no security officer designated | **Critical** |
| 2 | "BAA executed before the pilot starts" (`/rebound/for-clinicians`) | No template exists to execute against | **Critical** |
| 3 | "64% of regain happens in the dose-trough window" (and the three sibling phenotype prevalence stats) | "Pre-cohort ranges, not finalized published statistics" (own disclaimer) — but the disclaimer is footnoted, the numbers are share-card-ready | **High** |
| 4 | "60% of the weight comes back within a year" | Defensible against Wilding 2022 STEP 1 extension; minor framing risk (Wilding reports ~two-thirds, not 60% flat) | **Low** |
| 5 | "AES-256 at rest" | True via Supabase managed encryption; COYL does not manage keys directly. Add the qualifier in `/privacy` or risk a misrepresentation finding under a 5-Whys audit | **Low** |
| 6 | "30-day deletion on account delete" | Stated policy; the actual cron job enforcing it was not located in this scan. **Needs verification before next privacy review.** | **Medium** |
| 7 | "Anthropic does not use your data to train their models" | True per Anthropic's Zero Data Retention / DPA; verify the COYL workspace is actually on the correct Anthropic tier | **Low** |
| 8 | Future 510(k) / BDD pathway | Not started. Acceptable as internal plan; **must not** appear on any marketing surface until a real Q-Sub is filed | Hygiene |

---

## 4. What an FTC / Class-Action / Acquirer-Diligence Audit Would Flag

### 4.1 FTC angle

The FTC's 2023 *Health Breach Notification Rule* expansion and the 2023
*Premom* / *GoodRx* / *BetterHelp* enforcement actions establish that
consumer health apps that (a) share user health data with third parties
beyond what the privacy policy discloses, or (b) make unsubstantiated
health claims, are squarely in scope. COYL's exposure:

1. **Substantiation of the 60% regain stat and the four phenotype
   prevalence numbers.** The 60% / Wilding stat is defensible. The four
   phenotype stats (64% / 2x / 58% / 71%) are not — by COYL's own internal
   admission. The FTC's "reasonable basis" standard for objective health
   claims requires competent and reliable scientific evidence at the time
   the claim is made. A pre-launch cohort with N < 20 is not that.
2. **Third-party disclosure scope.** The privacy policy discloses
   Anthropic, Vercel, Supabase, Clerk, Stripe, Resend, Upstash. Verify
   that **no additional analytics, marketing pixel, or ad-tech tag** has
   been added since the policy's "Last updated: April 9, 2026" date. The
   Premom case turned on undisclosed Facebook / Google pixel firing on a
   sensitive-data screen.
3. **HIPAA "compliance" language on a B2C surface.** The FTC has hit
   wellness apps for implying HIPAA coverage they don't have. Even though
   `/clinician` is a B2B surface, "HIPAA-compliant" without an underlying
   BAA program is exactly the kind of claim the Commission has flagged.

### 4.2 Class-action angle

The largest live class-action risk for a B2C wellness app shipping in
California in 2026 is the California *Confidentiality of Medical
Information Act (CMIA)* + the new *Reproductive Health Data* additions to
CCPA. If COYL is targeting GLP-1 patients in California (which it is — Ro
Body and Found Health are California-rooted partners in the regulatory
strategy doc), and a single user's GLP-1-status data leaks via an ad
pixel, the per-violation damages get six-figure-fast.

### 4.3 Acquirer-diligence angle

A strategic acquirer (Microsoft, Apple, an Oviva / Headspace tier
roll-up) will ask, in this order:

1. "Show me your executed BAAs." → No artifacts to show.
2. "Show me your security policy, your risk assessment, your incident
   response plan, your SOC 2 Type II or HITRUST readiness assessment." →
   None exist.
3. "Show me the substantiation file for every quantitative health claim
   on your marketing site." → The 60% stat has a citation. The four
   phenotype stats do not.
4. "Walk me through the data flow for a paying GLP-1 patient: from
   Stripe charge to in-app log to Anthropic prompt to retention.
   Annotated with the legal basis for each transfer." → Buildable from
   the schema + the privacy policy, but not currently documented.

None of these are deal-killers in a $50–200M tuck-in. All of them
materially compress price.

---

## 5. Categorical Questions to Resolve

> All five require outside counsel. The framings below are the
> founder-level questions the lawyer needs to answer cleanly.

### 5.1 Is COYL a HIPAA Covered Entity, a Business Associate, or neither?

**Working answer:** Currently neither, in the consumer/B2C posture
(Recover / Rewire / Rebound tiers paid by the patient with no
provider relationship). A direct-to-consumer wellness app that does not
bill insurance and does not receive PHI from a Covered Entity is, in
nearly every interpretation, **outside HIPAA's scope** and inside the
FTC's. Healthcare apps in this posture are governed by the FTC Act +
the Health Breach Notification Rule + state health-data law (CMIA in
CA, MHMDA in WA, etc.), not HIPAA.

**Where it gets complicated:** The moment a GLP-1 prescriber clinic
onboards via `/clinician/onboarding` and uses the white-label `/rebound`
landing page to enroll their patients, COYL is **receiving PHI on behalf
of a Covered Entity** and becomes a **Business Associate** for those
patients. At that point a BAA is legally required before any PHI flows.
Marketing the BAA before the legal infrastructure to actually be a
Business Associate exists is the gap.

**[OUTSIDE COUNSEL] question:** Does the current
`/clinician/onboarding` flow trigger Business Associate status the first
time a clinician onboards, regardless of whether identifying PHI is
exchanged? (Likely yes if the clinic identifies enrolled patients to
COYL by NPI-linked seat counts. Confirm.)

### 5.2 FDA: wellness-app exemption boundary, or medical-device territory?

**Working answer:** The current `/safety` framing ("not a treatment for
any medical condition") is the single best piece of FDA hygiene COYL
has. It sits inside the *Policy for Device Software Functions and
Mobile Medical Applications* (Sept 2022 guidance) safe harbor for
wellness apps that promote a healthy lifestyle without diagnosing,
treating, or preventing disease.

**Where the line moves:** The `/rebound/for-clinicians` page positions
COYL as the "behavioral layer that runs while the shot is doing the
work and after it stops" — explicitly co-positioning with a prescribed
drug for a specific clinical population (post-GLP-1 patients). That is
moving toward an "adjunctive intervention for [indication]" framing.
The internal regulatory strategy doc plans to file 510(k) under exactly
that framing. The interim state — claiming clinical positioning in
marketing while disclaiming device status — is the most legally
fragile period in COYL's lifecycle.

**[OUTSIDE COUNSEL] question:** Does the
`/rebound/for-clinicians` page's "co-branded landing page → enrolled
patient → BAA → clinical study" arc constitute *intended use* under
FDA's interpretation, even with the wellness-app disclaimer? If yes,
the FDA may consider COYL to be marketing an unapproved device today.

### 5.3 FTC: are the clinical claims substantiated to the "reasonable basis" standard?

**Working answer:** The 60% Cambridge stat — yes, defensibly. The four
phenotype prevalence numbers — no, by the company's own internal
admission. The footnoted disclaimer ("not finalized published
statistics — surfaced for clinical judgment, not regulatory claims")
does not survive an FTC analysis because the *consumer share cards*
(generated from the same `lib/rebound-archetype.ts:shareStat` field)
strip the disclaimer.

**[OUTSIDE COUNSEL] question:** What is the cleanest way to phrase
each phenotype's prevalence claim such that the company has reasonable
basis at the time of claim? Options: (a) remove the percentages
entirely and replace with qualitative framing until N > 100,
(b) prefix every percentage with "in COYL's pre-launch cohort of N=X,"
(c) cite a real external study where it exists.

### 5.4 State law: CCPA + the new California health-data layer

If COYL markets to GLP-1 patients in California — and the regulatory
strategy doc names Ro Body (CA) and Found Health (CA) as target
partners — then in addition to CCPA, COYL is subject to:

- **CMIA** (Confidentiality of Medical Information Act) — applies to
  "providers of health care" and was expanded by AB 254 (2022) to cover
  mental-health apps and fertility apps. GLP-1 / weight management apps
  are not yet explicitly enumerated but the trend line is unmistakable.
- The **California Privacy Rights Act (CPRA)** "sensitive personal
  information" category includes health information; a GLP-1 patient's
  archetype + phenotype + slip log is squarely sensitive PI and
  triggers the CPRA right to limit use/disclosure.

**[OUTSIDE COUNSEL] question:** Does COYL's data flow (Supabase →
Anthropic for prompt assembly → response to user) constitute
"sharing" of sensitive PI under CPRA? If yes, the privacy notice needs
a CPRA-specific "Limit the Use of My Sensitive Personal Information"
control surfaced in account settings.

### 5.5 Future-state: when does the 510(k) plan become a marketing problem?

Filing a Q-Sub is a discoverable event. The moment it is filed, COYL's
marketing language has to be reconciled: either (a) accelerate to the
510(k) framing (post-clearance only) or (b) keep the current
wellness-app posture and treat the future clearance as a forward-looking
statement in fundraising decks only, not marketing. Mixing the two —
"we're a wellness app and also a future-FDA-cleared device" — is the
worst posture and is what most digital health failures look like in the
six months before they unwind.

---

## 6. Prioritized Action Items

Ordered by **(severity × inverse time-to-fix)** — i.e., highest-impact /
fastest-to-resolve at the top.

### Within 7 days

1. **Take "HIPAA-compliant BAA-covered" off `/clinician` until the BAA
   program exists.** Change to "Designed for HIPAA-aligned handling;
   BAA available on request" (matches the cleanest language already
   used on `/clinical-study`). Single string change. No business
   impact — the prescribers reading the page are not BAA-evaluating in
   the first 30 seconds; they're evaluating clinical credibility.
2. **Strip the four phenotype percentages from the consumer share
   cards** in `lib/rebound-archetype.ts:shareStat` (the strings users
   screenshot and post). Replace with the qualitative framing already
   used in the same file's `signature` strings. Internal product can
   keep the numbers (and the disclaimer) on the clinician-facing
   `prevalenceCopy` field. Two-minute code change.
3. **Add the "N < 20, pre-cohort" disclaimer inline** with the
   phenotype percentages on `/rebound/for-clinicians` (currently it
   lives in the footnoted Citations block — move it into the
   four-card grid). Two-line UI change.

### Within 30 days

4. **Engage outside counsel.** Three questions, in writing, with a
   defined scope and a defined budget: (a) HIPAA scope determination
   (Covered Entity / Business Associate / neither) under the current
   B2C and the future B2B postures, (b) FDA intended-use review of the
   `/rebound/for-clinicians` page, (c) FTC substantiation review of all
   quantitative claims on the marketing surface. Budget: $15–30K for a
   short-form memo from a firm with digital-health depth (Cooley health
   group, Hogan Lovells digital health, Wilson Sonsini privacy team,
   Aliesi Med for FDA-only).
5. **Draft and adopt a BAA template** (work product from the outside
   counsel engagement above). Use the HHS sample BAA as the starting
   point; have counsel adapt for the actual data flows (Anthropic,
   Supabase, Vercel — each one needs an upstream BAA before COYL can
   sign a downstream BAA with a clinic). **This is the gating
   document** for the B2B path. Cannot onboard a single clinic without
   it.
6. **Verify the privacy policy is accurate against the actual data
   flows.** One-day audit: enumerate every third party the production
   app actually calls (network log over 24 hours), compare to the
   `/privacy` Section 4 table, fix any drift. The Premom case turned on
   exactly this kind of drift.
7. **Verify the 30-day deletion enforcement.** Either find the cron job
   that hard-deletes accounts marked for deletion 30 days ago, or
   build it. Document the proof. This is the single piece of privacy
   infrastructure most likely to be tested by a regulator.

### Within 60 days

8. **Designate a Security Officer** (45 CFR 164.308(a)(2)) — even if
   it's the founder as a placeholder. Document the appointment. This
   is the cheapest single act of HIPAA hygiene that exists.
9. **Document a written Security Risk Analysis** per
   45 CFR 164.308(a)(1)(ii)(A). A 10-page document. Free template from
   HHS OCR. This is the document a regulator opens first.
10. **Document a written Breach Notification policy** per
    45 CFR 164.404. A 3-page document. Trigger threshold (any
    unauthorized acquisition of PHI of > 500 individuals → HHS
    notification within 60 days), notification template, internal
    escalation path. Even pre-revenue B2B companies need this on file
    before signing the first BAA.
11. **Reconcile the FDA narrative.** Decide whether the 510(k) plan is
    a 2026 marketing surface or a 2027+ marketing surface, and write
    the rule: until the Q-Sub is filed, no marketing copy mentions
    "FDA-cleared," "Breakthrough Device," "510(k)," or "clinically
    validated" except in fundraising materials marked as
    forward-looking. The internal regulatory-strategy doc is fine; the
    leakage risk is when a marketing writer pulls language from it.

### Within 90 days

12. **SOC 2 Type I readiness assessment.** $15–25K with a firm like
    Vanta or Drata or a direct CPA engagement. Outputs a gap report,
    not a certification — but the gap report itself becomes the
    diligence artifact that materially compresses an acquirer's
    security review from weeks to days.
13. **Enroll the first IRB patient.** The `/clinical-study` "no
    patients enrolled yet" honesty cannot live on the site for more
    than another 90 days without it starting to read as performative.
    Either close a partnership (Found Health is the named target in
    the operating doc) or change the page's posture.
14. **Bring the four-phenotype numbers up to N > 100 internally**
    so the company can move them from "pre-cohort" to "real internal
    cohort" framing. This is a data engineering + product analytics
    task. Pre-condition for the cleanest version of action item 2 to
    eventually be reversed.

---

## 7. Honest Self-Assessment

The single biggest compliance risk surfaced by this review is the
**"HIPAA-compliant BAA-covered data infrastructure" claim on
`/clinician`**, because (a) it is the most legally specific claim COYL
makes, (b) it is materially untrue today, (c) it is exactly the kind of
claim that FTC enforcement actions in 2023–2024 have targeted in
adjacent wellness-app companies, and (d) it is the cheapest one to fix
(a string change shipped this afternoon).

The single most reassuring fact is the `/safety` page. A company with
that page's clarity about what it is *not* has already done 80% of the
defensive work that protects it in a worst-case FTC inquiry. The
remaining 20% is the BAA program, the substantiation file for the
phenotype stats, and the privacy-policy data-flow audit. All of those
are 30–60 day items, not 12–18 month items.

**This document is not legal advice.** It is a founder-level risk
inventory. The outside-counsel engagement described in action item 4 is
the gating step before anything else in this brief is acted on as if it
were authoritative.

---

*Document owner: founder, reviewed quarterly. Next review:
August 2026 or upon (a) signing of the first clinic BAA, (b) filing of
the FDA Q-Sub, or (c) enrollment of the first IRB patient, whichever
comes first.*
