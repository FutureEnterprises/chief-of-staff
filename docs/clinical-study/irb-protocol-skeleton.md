# IRB Protocol Skeleton — COYL × Found Health

> **Document purpose.** This is the protocol skeleton the IRB chair reads when
> deciding expedited approval. It is shorter and more structured than the full
> protocol at `docs/clinical-study/protocol.md`, and is intended to be lifted
> directly into the partner IRB's proprietary submission form (most commonly
> WCG, Advarra, or Found Health's institutional IRB of record).
>
> Companion documents:
> - `docs/clinical-study/protocol.md` — full protocol (v0.9, partner-ready)
> - `docs/clinical-study/irb-narrative.md` — lay narrative for IRB reviewers
> - `docs/clinical-study/irb-submission-checklist.md` — founder-executable checklist
> - `docs/clinical-study/found-health-partnership-operating-doc.md` — operating model

---

## 1. Protocol Title

**A Randomized Controlled Trial of AI-Driven Behavioral Interrupts as Adjunctive Therapy for Weight Maintenance Post-GLP-1 Discontinuation**

Short title: `COYL-GLP1-MAINT-01`

Version: v1.0 (IRB submission)

Sponsor: COYL, Inc.

Clinical partner: Found Health, Inc.

Anticipated IRB pathway: expedited review under 45 CFR 46.110 category 7
(research on individual or group characteristics or behavior).

---

## 2. Principal Investigator

**Principal Investigator (PI):** _Pending Found Health partnership. The PI
must hold an MD, PhD, or equivalent terminal degree in a relevant field
(obesity medicine, behavioral science, clinical psychology, endocrinology).
Selection is joint between Found Health Clinical Affairs and COYL._

**Co-Investigator (Sponsor-side):** Iman Schrock, Founder, COYL, Inc.

**Clinical Lead (COYL-side):** Pending hire (Director of Clinical Affairs,
target start week 0 of trial).

**Statistical Lead:** Pending appointment (target: biostatistician with prior
GLP-1 trial experience; sourced jointly with Found).

**Data and Safety Monitoring Board (DSMB):** Three-member external board to
be convened before first enrollment. Composition: one obesity-medicine
clinician, one behavioral-intervention methodologist, one biostatistician.
None may have prior financial relationship with COYL or Found.

---

## 3. Background and Rationale

### 3.1 The maintenance problem

GLP-1 receptor agonists (semaglutide, tirzepatide, liraglutide) produce
clinically significant weight loss during continuous administration. However,
published discontinuation data show that the majority of lost weight is
regained in the months following cessation. The STEP-4 extension trial
(Wilding et al., *NEJM* 2021; *Lancet* 2022 follow-up) reported approximately
**two-thirds of lost weight regained at 12 months post-discontinuation**.
The SURMOUNT-4 trial (Eli Lilly, 2023) reported a similar pattern for
tirzepatide. The steepest regain trajectory occurs in the **first 90 days
post-discontinuation**, suggesting the immediate post-cessation window is a
behaviorally critical period.

This regain pattern is consistent with a pharmacological-suppression model
of GLP-1 action: the agonist suppresses appetite signaling while present
but does not modify the learned behavioral patterns (late-night eating,
stress eating, social-trigger eating) that drove pre-treatment overeating.
When chemical suppression lifts, the behavioral substrate is unchanged and
patients return to their pre-treatment behavioral baseline.

### 3.2 Why behavioral interrupts

A growing literature supports the use of **just-in-time adaptive
interventions (JITAIs)** that deliver behavioral support at the precise
moment of decision-relevance, rather than as scheduled coaching:

- **Nahum-Shani et al., 2018** (*Annals of Behavioral Medicine*) — formal
  definition of JITAIs and the importance of state-matched delivery timing.
- **Wood & Neal, 2007** (*Psychological Review*) — habit automaticity is
  context-cued; interventions delivered at the cue moment have higher
  modification potential than after-the-fact reflection.
- **Gollwitzer, 1999** (*American Psychologist*) — implementation
  intentions ("when X happens, I will do Y") rehearsed at the cue context
  produce significantly larger behavior change than goal intentions alone.
- **Forman et al., 2017** (*Obesity*); **Goldstein et al., 2018** (*JMIR
  mHealth*) — ecological momentary assessment of dietary lapses
  demonstrates that lapses cluster at predictable trigger contexts and are
  preceded by detectable physiological and behavioral antecedents.

These literatures converge on a single design principle: **behavioral
interventions delivered in the seconds before the autopilot behavior runs
have meaningfully larger effect sizes than the same interventions delivered
at any other timepoint.**

### 3.3 COYL's specific contribution

COYL operationalizes the pre-conscious window via three components:

1. **Pre-conscious window prediction.** A learned model of the participant's
   prior trigger contexts (time-of-day, location, recent heart-rate
   trajectory, activity state) predicts the 30–90 second window before the
   participant is likely to execute an unwanted eating behavior.
2. **State-matched intervention.** At the predicted window, the participant
   receives a single behavioral interrupt — a notification, a voice prompt,
   or a haptic — tuned to the participant's emotional state at that moment
   (e.g., a stressed-state interrupt differs in tone and content from a
   bored-state interrupt).
3. **Caught-vs-slipped feedback loop.** Each interrupt is tagged
   post-hoc as "caught" (participant pivoted to alternative behavior) or
   "slipped" (participant proceeded with the eating event). This is used
   for adaptive personalization, not as an outcome measure.

This protocol does not test the engineering of the prediction model. It
tests a single behavioral question: **does the intervention bundle as
deployed reduce weight regain at 12 weeks post-GLP-1 discontinuation
relative to standard care alone?**

---

## 4. Hypothesis

**H1 (primary):** Participants in the COYL + Standard-Care arm will show
**reduced weight regain at 12 weeks post-GLP-1 discontinuation** compared to
participants in the Standard-Care-only arm, as measured by kilograms of body
weight change from baseline (week 0 = day of GLP-1 discontinuation).

**H0 (null):** No difference in weight regain between arms at 12 weeks.

**Directional prediction:** Mean weight regain in the COYL arm will be at
least **2.5 kg less** than in the Standard-Care arm at week 12, assuming a
pooled standard deviation of 4.5 kg (see §14, Sample Size Calculation).

This protocol is hypothesis-generating, not confirmatory. The trial is
powered for **exploratory inference** (target power 0.65, see §14) and is
intended to produce an effect-size estimate that supports a subsequent
adequately-powered confirmatory trial.

---

## 5. Study Design

**Design.** 12-week parallel-arm, two-arm randomized controlled trial.

**Arms.**
- **Arm A — COYL + Standard Care:** n=40. Participants install the COYL
  iOS app at week 0 (day of GLP-1 discontinuation) and use it through
  week 12. They also continue Found Health's standard post-discontinuation
  care.
- **Arm B — Standard Care Only:** n=40. Participants receive Found
  Health's standard post-discontinuation care. They do not install COYL.

**Total enrollment:** N=80.

**Randomization.** Simple 1:1 randomization, **stratified by sex** (male /
female / nonbinary) **and baseline BMI** (25.0–29.9 / 30.0–34.9 /
35.0–45.0 kg/m²). Allocation generated by the statistical lead using a
sealed-envelope or REDCap randomization module and revealed to the
participant at the end of the baseline visit.

**Blinding.**
- **Participants:** unblinded (necessary — the intervention is a visible
  smartphone app).
- **Intervention deliverer (COYL Clinical Affairs staff):** unblinded.
- **Outcome assessor (weight data analyst at Found):** **blinded** to arm
  assignment. Weight data is pulled from the participant's Withings scale
  via API into a study-ID-keyed dataset with no arm column visible to
  the assessor.
- **Statistical analyst:** unblinded only after the final dataset is
  locked.

**Setting.** Fully virtual + at-home. Participants are recruited from
Found Health's existing GLP-1 patient base. All study contact is
telehealth or in-app. Weights are captured at home via a study-issued
Withings smart scale (Body+ or equivalent), shipped to participants at
week 0 and returned at week 12.

**Duration.** 12 weeks per participant. Total trial duration target: 24
weeks from first enrollment to last follow-up.

---

## 6. Inclusion Criteria

A participant is eligible if **all** of the following are true:

1. Adult age **18–65** (inclusive) at consent.
2. Has completed **at least 6 months** of continuous GLP-1 receptor agonist
   therapy (semaglutide, tirzepatide, or liraglutide) prescribed through
   Found Health.
3. Is **within 4 weeks** of GLP-1 discontinuation (either already
   discontinued in the last 4 weeks, or has a discontinuation date
   scheduled within the next 4 weeks).
4. Owns a personal **iPhone running iOS 16.1 or later** and an **Apple
   Watch** (any series). Devices must be the participant's own; COYL does
   not provide loaner devices.
5. Baseline body mass index **25.0 ≤ BMI ≤ 45.0 kg/m²**.
6. Able to read and write English at a functional level (no formal
   threshold; verified via consent comprehension check).
7. Able and willing to provide written informed consent.

---

## 7. Exclusion Criteria

A participant is excluded if **any** of the following are true:

1. Active eating disorder per the **Eating Disorder Examination
   Questionnaire (EDE-Q) global score > 2.5**, indicating clinically
   significant binge-eating disorder, anorexia nervosa, or bulimia
   nervosa.
2. **Bariatric surgery within the last 24 months** (gastric bypass,
   sleeve gastrectomy, gastric band, or revision surgery).
3. **Pregnancy** or **planned pregnancy** during the study window.
4. Currently using another **behavioral intervention app** for weight,
   eating, or related behavior (Noom, WW, Fitbit Premium habit
   programs, Calm food-focused programs). Use of generic
   fitness-tracking apps without behavioral-coaching features is
   permitted.
5. **Suicidal ideation per PHQ-9 item 9 ≥ 1** at baseline screening.
6. Concurrent participation in another interventional clinical trial.
7. Investigator judgment that participation would be clinically
   inappropriate (e.g., uncontrolled comorbidity, anticipated relocation
   out of US during study window).

---

## 8. Primary Outcome Measure

**Body weight change in kilograms** from baseline (week 0 = day of GLP-1
discontinuation) to **week 12**, measured **weekly** via a study-issued
Withings smart scale.

- Weights are auto-uploaded via Withings API to the study REDCap (or
  equivalent) instance.
- The week-12 weight is the mean of all weights captured in the 7-day
  window centered on day 84.
- If the participant has fewer than 3 weights in the week-12 window, the
  primary outcome is treated as missing for that participant (see §15,
  Statistical Analysis Plan, for missing data handling).

---

## 9. Secondary Outcome Measures

1. **Self-reported eating-pattern adherence.** A custom 7-day eating
   diary administered via in-app survey at weeks 0, 4, 8, and 12.
   Adherence is operationalized as the proportion of pre-registered
   trigger windows the participant reports as "not slipped."
2. **Self-Trust Score change.** COYL-internal composite score derived
   from caught-vs-slipped tags and self-report. Exploratory; not
   pre-registered as a confirmatory outcome.
3. **Number of intervention firings** and **caught-vs-slipped tag
   distribution** in the COYL arm only. Reported as descriptive engagement
   data; not a comparative outcome.
4. **Quality of life.** SF-12 (12-Item Short Form Health Survey)
   administered at weeks 0, 6, and 12.
5. **Eating Behavior Inventory (EBI).** Administered at weeks 0, 6, and
   12.
6. **PHQ-9** administered at weeks 0, 6, and 12 — **safety monitoring,
   not efficacy outcome**.

---

## 10. Intervention Description

### 10.1 COYL arm (Arm A)

At the baseline visit (telehealth, ~45 minutes), the participant:

1. Installs the COYL iOS app via TestFlight link issued from Found
   Health's portal.
2. Completes the **60-second baseline audit** (10 multiple-choice
   prompts about prior eating patterns).
3. Grants the following iOS permissions:
   - **HealthKit** — read access to: heart rate, heart rate variability,
     activity rings, mindful minutes (if available), sleep (if
     available).
   - **Notifications** — including time-sensitive notifications and
     critical alerts.
   - **Location — "Always" tier** — required to detect kitchen-context
     and grocery-store-context windows. Participants who decline this
     tier may proceed with reduced functionality and will be flagged
     for sensitivity analysis.

Throughout the 12-week study, the COYL app:

- Predicts pre-conscious windows of likely autopilot eating behavior.
- Issues behavioral interrupts (notifications, voice prompts, haptics)
  at predicted windows.
- Captures caught-vs-slipped tags post-event.
- Logs all firings, response latencies, and tags to the COYL backend.

The participant is asked to use the app as their primary behavioral-
support tool but is not required to respond to any specific interrupt.

### 10.2 Standard Care arm (Arm B)

Weekly weight reporting via Found Health's existing portal. No behavioral
app intervention. Continued standard post-discontinuation care per Found's
clinical protocol.

### 10.3 Treatment of co-interventions

Both arms continue any non-pharmacological care prescribed by Found
(nutrition counseling, lifestyle coaching) per Found's standard model.
**No new GLP-1 prescription** during the 12-week study window for either
arm (this is the discontinuation cohort). Use of any new behavioral
intervention app during the study constitutes a protocol deviation and
is logged.

---

## 11. Risk Assessment

This study is classified as **minimal risk**, defined per 45 CFR 46.102(j):
"the probability and magnitude of harm or discomfort anticipated in the
research are not greater in and of themselves than those ordinarily
encountered in daily life or during the performance of routine physical
or psychological examinations or tests."

Justification:
- **No medical procedure.** No biopsy, blood draw, imaging, or invasive
  measurement.
- **No medication.** No pharmacological substance is prescribed,
  dispensed, or administered by the study. The study observes a
  population whose GLP-1 medication has already been discontinued by
  their treating clinician for clinical reasons unrelated to the study.
- **No diagnostic procedure.** No diagnosis is given, withheld, or
  modified by the study.
- **Behavioral interventions are passive prompts.** All COYL
  intervention content consists of voice prompts, text notifications,
  or haptic cues that the participant is free to ignore at any time
  with no consequence to study participation or to their clinical care.
- **Privacy.** No biometric raw data (raw HR traces, raw location
  traces) is shared with researchers. Only **aggregate event counts**
  (number of firings, caught/slipped tag distribution, time-of-day
  histograms) leave the participant's device.

Anticipated risks: minor inconvenience (notifications), potential
notification fatigue, minor privacy disclosure risk (study-ID-keyed
data only). Mitigations in §12.

---

## 12. Risk Mitigation

1. **Voluntary withdrawal.** Participants may withdraw at any time
   without penalty, by any means (in-app button, email, phone,
   telehealth contact). Withdrawal does not affect Found Health care.
2. **24/7 crisis access.** All in-app and study communications include
   **988 Suicide & Crisis Lifeline** and a local crisis-line lookup.
   Participants with documented prior mental health history receive
   a state-specific resource card at baseline.
3. **Auto-detection of post-discontinuation distress.** PHQ-9 is
   administered in-app at weeks 0, 6, and 12. **Any score of ≥1 on
   item 9** (suicidal ideation) triggers an **immediate manual
   clinician review** by Found's on-call clinical team within 24 hours
   and, if indicated, a same-day telehealth visit. Trial participation
   may be paused pending clinician judgment.
4. **Clinical board review of all COYL message copy.** Every interrupt
   copy template deployed during the trial is reviewed and approved by
   the joint COYL–Found clinical board before deployment. No
   participant receives copy that has not been reviewed.
5. **Notification rate cap.** Maximum 6 interrupt firings per
   participant per 24-hour period, regardless of model prediction, to
   mitigate notification fatigue and prevent inadvertent harassment.
6. **Privacy by design.** All PHI is encrypted at rest and in transit;
   only the pseudonymized study ID is exposed to researchers (see §13).

---

## 13. Data Management Plan

**Hosting.** All study data is hosted on **BAA-covered cloud
infrastructure** — either AWS HIPAA-eligible services or Vercel +
Supabase under signed Business Associate Agreements. The selection
of host is finalized jointly with Found Health Compliance during
IRB review.

**Encryption.** Field-level encryption for all PHI at rest. TLS 1.3
in transit. Encryption keys managed via the host's HSM (AWS KMS or
equivalent).

**Pseudonymization.** No PII enters the research dataset. At
enrollment, each participant is assigned a 12-character random
**study ID**. The mapping between study ID and participant identity
is held in a separate, access-restricted table at Found Health and
is never copied to the COYL backend.

**Access control.**
- Found Health PI and clinical staff: full access to identifiable
  data (limited to safety needs).
- COYL Clinical Affairs: access to pseudonymized data only.
- Statistical analyst: access to pseudonymized data only, with
  arm-assignment blinded until dataset lock.
- Outside parties: no access without DUA + IRB amendment.

**Audit and breach reporting.** Annual third-party access audit.
Immediate breach reporting per HIPAA Breach Notification Rule and
applicable state law (specifically California CCPA/CPRA and any
state in which a participant resides at the time of breach).

**Retention.** De-identified study data is retained for **7 years**
per ICH GCP guidance. Identifiable data is destroyed within **90
days of dataset lock**, except where required for safety follow-up
or regulatory inspection.

---

## 14. Sample Size Calculation

**Test.** Two-sample t-test for difference in means (week-12 weight
change, kg, COYL arm vs. Standard Care arm).

**Parameters.**
- α = 0.05 (two-sided)
- Anticipated mean difference: **2.5 kg** (favoring COYL arm)
- Anticipated pooled standard deviation: **4.5 kg** (sourced from
  STEP-4 12-month regain SD, scaled to a 12-week window)
- Target power: 0.80

**Required N for target power.** Under these parameters, the required
sample size is **N = 51 per arm** (N=102 total) for power 0.80 at α=0.05.

**Enrollment plan.** We enroll **N=40 per arm** (N=80 total) with an
assumed **25% attrition** rate during the 12-week window, yielding
approximately **N=30 evaluable per arm**.

**Actual achieved power.** At N=30 evaluable per arm, the power to
detect the same 2.5 kg effect at SD=4.5 kg is **approximately 0.65**.

**Justification for under-powering.** This is a **hypothesis-generating
exploratory trial**, not a confirmatory trial. The N=80 enrollment is
chosen to (a) fit within the COYL clinical execution budget
($200-220K Found Health partnership cost, see §3 of the partnership
operating doc), (b) generate a credible effect-size point estimate and
confidence interval to support a subsequent adequately-powered
confirmatory trial, and (c) demonstrate operational feasibility of the
Found–COYL partnership at scale. The under-powering is disclosed in
the consent form and in all publications.

**Interim analysis.** A descriptive look at the data is permitted at
**N=20 per arm enrolled** (not evaluable). At p < 0.20 on the primary
outcome, the DSMB may request a protocol amendment to expand
enrollment. This is **not a formal stopping rule** and is not used to
declare efficacy or futility.

---

## 15. Statistical Analysis Plan

**Primary analysis.** **Intent-to-treat (ITT)** — all randomized
participants are analyzed in the arm to which they were assigned,
regardless of intervention adherence.

**Primary model.** Mixed-effects linear model:

```
weight_kg ~ arm + time + arm:time + baseline_BMI + (1 | participant)
```

Where:
- `arm` is a fixed effect (COYL vs. Standard Care).
- `time` is weeks since discontinuation (0 to 12), as a continuous
  variable.
- `arm:time` is the interaction (the primary inference target).
- `baseline_BMI` is a fixed-effect covariate.
- `(1 | participant)` is a random intercept for participant.

The primary inferential statistic is the **arm-by-time interaction
coefficient** with its 95% confidence interval.

**Sensitivity analysis.** **Per-protocol** analysis restricted to COYL-
arm participants with ≥70% adherence (operationalized as ≥70% of
predicted intervention windows in which the app fired at least one
interrupt and the participant responded to or dismissed it).

**Missing data.** Multiple imputation by chained equations (MICE)
with **m=20 imputations**. Imputation model includes arm, baseline
BMI, baseline weight, prior weights, and adherence indicator.

**Secondary outcomes.** Each secondary outcome is analyzed with the
analogous mixed-effects model. **No multiplicity correction** is
applied to secondary outcomes; they are reported as exploratory with
95% CIs and unadjusted p-values, and described as hypothesis-
generating.

**Statistical software.** R (lme4, mice). All analysis code committed
to a private repository before dataset lock; code is shared with the
DSMB for review.

---

## 16. Timeline

| Week | Milestone |
|---|---|
| 0 | IRB submission |
| 1–3 | IRB review iterations |
| 4 | Expected expedited approval |
| 5 | Recruitment opens; clinicaltrials.gov registration live |
| 5–12 | Enrollment (target N=80) |
| 12 | Enrollment complete |
| 13–24 | Active 12-week follow-up per participant |
| 18 | DSMB descriptive interim review |
| 24 | Last participant follow-up complete |
| 25–28 | Dataset lock + analysis |
| 29–32 | Manuscript drafting |
| 32 | Manuscript submission to JAMA Internal Medicine (target) |

Total: ~32 weeks from IRB submission to manuscript submission.

---

## 17. Participant Compensation

Participants in **both arms** receive:

- **$50** at enrollment (after consent + baseline visit completion).
- **$50** at week 6 (after mid-trial assessments completion).
- **$100** at week 12 (after final assessments and scale return).

**Total: $200 per evaluable participant.** Payment via Tremendous or
equivalent (gift-card or ACH at participant choice). Compensation is
**not contingent on intervention adherence** in either arm — only on
assessment completion. This is reviewed and approved by the IRB as
non-coercive at the proposed levels per local benchmarks.

---

## 18. Funding and Sponsor

**Sponsor of record:** COYL, Inc.

**Funding source:** **COYL, Inc. internal capital.** No external
grants, no NIH funding, no industry funding outside the sponsor.
Trial budget envelope: $2M (within the broader $6B Roadmap clinical
execution line item). Of this, approximately $200-220K is allocated
to the Found Health partnership (see partnership operating doc §3).

**No commercial promotional activity** related to COYL is conducted
during the trial. Participants are not asked to refer friends,
review the app publicly, or engage with COYL marketing.

---

## 19. Conflict of Interest Disclosure

**COYL is the sponsor and the manufacturer of the product being
studied.** This is a **direct financial conflict of interest** for
the sponsor and the COYL co-investigator and is disclosed in full:

- The IRB submission discloses sponsor identity and product
  ownership.
- The informed consent form discloses to each participant that the
  app being studied is made by the study's funder.
- The clinicaltrials.gov registration discloses sponsor identity.
- All publications include a conflict-of-interest statement
  identifying COYL as sponsor and the COYL author's financial
  interest.
- The DSMB is composed of three independent reviewers with no
  prior COYL or Found financial relationship.
- The blinded outcome assessor is a Found Health employee, not a
  COYL employee.
- The statistical analyst is contracted independently and is not
  a COYL employee or shareholder.

The Found Health PI has **unilateral authority** to halt enrollment
on a safety or futility signal (see partnership operating doc §6).

---

*End of protocol skeleton v1.0.*
