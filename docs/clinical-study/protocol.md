# Clinical Study Protocol

**Title:** A 12-week randomized study of a real-time behavioral pattern-interrupt
system (COYL) versus standard care for the prevention of weight regain after GLP-1
receptor agonist discontinuation

**Short title:** COYL-GLP1-MAINT-01

**Version:** v0.9 (draft, partner-ready)

**Sponsor:** COYL, Inc.

**Principal Investigator (PI):** _To be named — selected jointly with partner clinic, telehealth platform, or research lab. PI must hold an MD, PhD, or equivalent terminal degree in a relevant field (obesity medicine, behavioral science, clinical psychology, endocrinology)._

**Funding:** Sponsor-funded. No participant compensation budgeted at v0.9; partners may add a participant honorarium (typical range $50–$150) if their IRB requires it.

**Risk classification:** Minimal-risk behavioral research. Anticipated IRB pathway: expedited review under 45 CFR 46.110 category 7 (research on individual or group characteristics or behavior).

---

## 1. Background and Rationale

### 1.1 Clinical context

GLP-1 receptor agonists (semaglutide, tirzepatide, liraglutide) produce
clinically significant weight loss during continuous administration. Published
discontinuation data show that the majority of weight loss reverses in the
months following cessation: approximately two-thirds of lost weight is regained
within one year, with the steepest regain trajectory occurring in the first
90 days post-discontinuation (STEP-4, SURMOUNT-4, and related trials).

This pattern is consistent with a pharmacological-suppression model of action:
the agonist suppresses appetite signaling while present, but does not modify
the learned behavioral patterns ("scripts") that drove pre-treatment overeating.
When suppression lifts, the behavioral substrate is unchanged, and the patient
returns to the pre-treatment behavioral baseline.

### 1.2 Behavioral hypothesis

We hypothesize that real-time, in-the-moment pattern-interrupt training
delivered during the medicated window builds behavioral competence (recognition
of trigger contexts, alternative-action habits, recovery from lapses) that
persists after discontinuation. If true, the medicated window is a unique
training opportunity in which the patient experiences sufficient appetite
suppression to practice alternative responses to historical trigger contexts
without the override pressure of acute hunger.

This is consistent with established literature on:
- Habit automaticity in stable contexts (Wood & Rünger, 2016; Mazar & Wood, 2018)
- Ecological momentary assessment of dietary lapses (Forman et al., 2017; Goldstein et al., 2018)
- Just-in-time adaptive interventions (Nahum-Shani et al., 2018; Hardeman et al., 2019)
- Implementation intentions for behavioral self-regulation (Gollwitzer & Sheeran, 2006; meta-analysis 2024)

### 1.3 Specific aims

**Aim 1 (primary, exploratory inference):** Estimate the differential weight
regain at 90 days post GLP-1 discontinuation between participants randomized
to receive COYL alongside standard care versus standard care alone.

**Aim 2 (secondary):** Estimate program-engagement parameters that may mediate
weight outcomes (in-app pattern-interrupt frequency, slip-recovery time,
self-trust score trajectory).

**Aim 3 (secondary):** Estimate study retention, intervention adherence, and
participant-reported burden as feasibility parameters for a confirmatory
follow-on study.

---

## 2. Study Design

### 2.1 Overview

Randomized, 1:1 parallel-arm, single-blind (analyst-blinded), 12-week
behavioral intervention with a 90-day post-discontinuation follow-up window.

Stratification factors at randomization:
- Baseline BMI (27.0–34.9 vs. 35.0–45.0)
- GLP-1 type (semaglutide / tirzepatide / liraglutide / other)
- Sex assigned at birth (M / F)

### 2.2 Schema

```
Week 0       Weeks 1–12        Week 12         Week 13–24 (post-Rx)
─────       ─────────────     ─────────       ────────────────────
Consent  →  Active phase   →  Discontinue  →  Follow-up window
Random.     Rx + (COYL or)    GLP-1 per       Weight @ +30, +60, +90
Baseline    Rx alone          usual care      In-app data continues
weight                                        for intervention arm
```

### 2.3 Arms

**Arm A — Intervention (n=40):** Standard GLP-1 prescription per usual care +
12 weeks of COYL Premium access (full feature set: rescue flows, recovery
engine, precision interrupts, pattern detection, accountability partner,
scenario simulator, financial stakes, calendar/health integrations). Continued
access for the 90-day follow-up window.

**Arm B — Control (n=40):** Standard GLP-1 prescription per usual care.
Waitlist offer of COYL Premium upon completion of the 90-day follow-up
(week 24). Reduces ethical concern around withholding a low-risk consumer
behavioral tool with anecdotal benefit.

### 2.4 Sample size justification

This study is powered for **effect-size estimation, not confirmatory
inference.**

Assumptions:
- Effect size of interest: ~3.0 kg differential weight regain at +90d
  post-discontinuation (Cohen's d ≈ 0.55, based on published GLP-1
  discontinuation regain trajectories and a conservative behavioral
  effect plausibility band)
- Two-sided α = 0.05
- Power 1 − β = 0.80
- Anticipated attrition 20% over 24 weeks

Sample size required: 64 evaluable participants total → enrolled N = 80
(40/arm) accounting for attrition.

A confirmatory replication powered to detect a smaller effect (d ≈ 0.35)
would require N ≥ 200; that is explicitly out of scope for this study and
would be planned as a follow-on after favorable feasibility readout.

---

## 3. Population

### 3.1 Inclusion criteria

1. Adults aged 18–65 inclusive at consent
2. BMI 27.0–45.0 kg/m² at consent
3. Prescribed a GLP-1 receptor agonist (semaglutide, tirzepatide, liraglutide)
   within the 90 days preceding consent and currently active on that
   prescription
4. Owns and uses an iOS or Android smartphone capable of running the COYL
   mobile app (iOS 16+, Android 11+)
5. English fluency (English-language version of the app and consent forms)
6. Willing and able to complete weight measurement at baseline, week 12, and
   the +30, +60, +90 day follow-up windows (telehealth-grade scale acceptable)
7. Provides written informed consent

### 3.2 Exclusion criteria

1. Active or historical eating disorder diagnosis within the prior 12 months
   (anorexia nervosa, bulimia nervosa, binge-eating disorder)
2. Current psychiatric crisis, active suicidal ideation, or psychiatric
   hospitalization within the prior 6 months
3. Concurrent enrollment in another behavioral intervention or weight-loss
   study
4. Pregnant, lactating, or planning pregnancy during the 24-week study window
5. Inability to provide informed consent
6. Investigator's determination that participation poses safety risk

### 3.3 Recruitment

Participants will be recruited from the partner organization's existing GLP-1
patient cohort. Recruitment outreach is conducted by the partner using
IRB-approved language. COYL provides no direct-to-participant recruitment.

---

## 4. Intervention

### 4.1 COYL Premium feature set

The COYL Premium intervention is a digital behavioral support tool delivered
via iOS/Android mobile app and responsive web. Core engines active during
the intervention:

| Engine | Description |
| --- | --- |
| Autopilot Map | Learns the participant's day-of-week × hour-of-day risk windows from logged slip events |
| Decision Engine | Structured AI response when participant asks for help: deciding what / cost of worse / likely excuse / smallest next step |
| Commitment Engine | Trackable behavioral rules (one-rule-for-7-days at minimum) |
| Precision Interrupt (JITAI) | Push notification fired at learned risk moments |
| Excuse Detection | Real-time classification of self-deception in 8 categories |
| Recovery Engine | Shame-resistant re-entry, same-night recovery, 1-day grace period on streaks |
| Identity Engine | Tracks Sleepwalking → Avoidant → Recovering → Resilient → High-Self-Trust |

### 4.2 Onboarding

Participants in the intervention arm complete a 6-step onboarding wizard:
battlefield selection, autopilot windows, excuse style, tone mode, first
commitment, and (where applicable) GLP-1 day-3 interrupt opt-in.

### 4.3 Adherence floor

For analytic purposes, "adherent" is pre-specified as ≥1 in-app event
(commitment update, slip log, decision query, or rescue invocation) on
≥3 days per week, averaged across the 12-week active phase. Adherence is
analyzed as a covariate, not a stratification or exclusion factor.

### 4.4 Standard of care

Both arms continue GLP-1 prescription, dose adjustments, and clinical visits
per the partner organization's usual care. The study does not modify medical
management.

---

## 5. Outcomes

### 5.1 Primary

**Differential weight regain at +90 days post GLP-1 discontinuation**, computed
as `(weight_+90d − weight_at_discontinuation)` per participant, then compared
between arms via t-test (or Wilcoxon if normality violated). Reported as a
point estimate with 95% confidence interval.

### 5.2 Secondary

1. **Program adherence rate:** % of weeks in the 12-week active phase with
   ≥3 logged in-app events.
2. **Late-night-eating frequency:** Self-reported episodes of post-9pm eating,
   logged via in-app weekly check-in. Compared baseline → week 12 within and
   between arms.
3. **Time-from-slip-to-recovery:** For participants who log a slip event,
   time in hours until the 3-action recovery sequence is completed.
4. **Study retention:** % of randomized participants completing the +90d
   follow-up.

### 5.3 Exploratory

1. **Patterns Defeated count** (in-app metric) correlation with weight
   outcome.
2. **Excuse-category distribution shifts** pre/post intervention.
3. **Self-trust score trajectory** week 0 → week 12.
4. **Qualitative arm (optional):** Semi-structured clinician interview
   transcripts thematically coded for clinician-perceived participant
   behavioral change.

---

## 6. Statistical Analysis Plan (summary)

A pre-registered Statistical Analysis Plan (SAP) will be finalized with the
PI prior to randomization. Headline pre-specifications:

- **Primary analysis population:** Modified intent-to-treat (mITT) — all
  randomized participants with at least one post-baseline weight
  measurement.
- **Per-protocol sensitivity:** Adherent participants only (≥3 events/week
  on ≥9 of 12 weeks).
- **Primary comparison:** Two-sample t-test (or Wilcoxon if Shapiro–Wilk
  p < 0.05 in either arm) on Δweight at +90d.
- **Missing data:** Multiple imputation using baseline weight, age, sex, BMI,
  GLP-1 type, and arm. Sensitivity analysis with last-observation-carried-
  forward and complete-case.
- **Multiple-comparison adjustment:** Secondary outcomes reported with
  Benjamini–Hochberg FDR correction at q = 0.05.
- **Pre-registration:** OSF or ClinicalTrials.gov registration prior to
  enrollment of first participant.

---

## 7. Privacy, Data Handling, and Consent

### 7.1 Data flow

| Data | Origin | Stored at | Shared with |
| --- | --- | --- | --- |
| Identified contact info | Partner | Partner only | Not shared |
| In-app event data | COYL app | COYL backend (encrypted at rest) | Partner: de-identified aggregates only |
| Weight measurements | Partner platform | Partner | COYL: weight + study-ID linkage only |
| Linkage key | Partner | Partner only | Not shared |

### 7.2 De-identification

All data shared between COYL and the partner is de-identified per HIPAA
Safe Harbor (45 CFR 164.514(b)(2)). No raw chat content is shared in either
direction.

### 7.3 Data Use Agreement

A Data Use Agreement (DUA) governs all data exchange. Template DUA is
provided by COYL; partner counsel reviews and modifies as needed. Standard
clauses: limited dataset, no re-identification, no onward disclosure, defined
retention.

### 7.4 BAA

For partner organizations covered as Business Associates under HIPAA, a
Business Associate Agreement is executed in parallel with the DUA.

### 7.5 Retention

Study data retained for 90 days post-readout, then deletion or anonymized
aggregate only. Partner retains its own data per its institutional policy.

### 7.6 Consent

Written informed consent obtained prior to any study procedures. Consent form
covers:
- Voluntary participation
- Right to withdraw at any time without affecting clinical care
- Data uses, sharing, and retention
- Risks and benefits (see §8)
- Contact information for PI and IRB

### 7.7 Withdrawal

Participants may withdraw at any time. In-app data deletion within 30 days
of withdrawal request. Withdrawal does not affect their COYL Premium access.

---

## 8. Risks and Benefits

### 8.1 Risks

This is a minimal-risk behavioral study. Potential risks:

1. **Privacy:** Mitigated by de-identification, DUA, BAA, and 30-day deletion-
   on-request.
2. **Psychological discomfort:** Some participants may find behavioral self-
   reflection prompts uncomfortable. Mitigated by tone-mode selection (Mentor
   / Strategist / No-BS / Beast) and the option to disable specific notification
   types.
3. **Weight-stigma exposure:** Mitigated by the Recovery Engine framing
   ("no shame, no Monday reset") and explicit "behavioral support, not
   medical treatment" disclaimers throughout the product.
4. **Crisis surfacing:** If participant-entered text indicates psychiatric
   crisis (suicidal ideation, eating-disorder relapse, etc.), in-app safety
   triage routes the participant to crisis resources (988, NEDA helpline) and
   notifies the PI within 24h via de-identified flag (no content shared).

### 8.2 Benefits

Direct benefit: free 12+ months of COYL Premium access (intervention arm)
or 12+ months access after the follow-up window (control arm). Indirect
benefit: participants contribute to behavioral-science evidence base for a
common clinical question.

---

## 9. Adverse Event Reporting

This is a behavioral study with no investigational medical product. Adverse
events specific to GLP-1 use are reported through the partner's standard
clinical pharmacovigilance pathway.

Behavioral adverse events (study-related psychological distress, etc.) are
reported to the PI within 24h. Serious adverse events are reported to the
IRB within 7 days per institutional policy.

---

## 10. Timeline

| Phase | Duration | Activities |
| --- | --- | --- |
| Setup | Month 1 | Protocol finalization, partner DUA + BAA execution, IRB submission |
| IRB | Months 1–2 | Expedited review (typical 3–6 weeks), revisions if requested |
| Recruitment | Month 2 | Cohort outreach, screening, randomization |
| Active | Months 3–5 | 12-week intervention, in-app + clinical data collection |
| Follow-up | Months 6–7 | 90-day post-discontinuation weight + in-app data |
| Analysis | Month 7 | Dataset lock, primary + secondary analysis |
| Readout | Month 8 | Manuscript draft, conference abstract submission |

---

## 11. Roles and Responsibilities

### 11.1 Sponsor (COYL)

- Provides study product (Premium access) free of charge
- Provides engineering integration support
- Provides statistical analysis (analyst-blinded to arm)
- Provides de-identified outcome dataset to partner under DUA
- Co-authors manuscript; primary authorship negotiable

### 11.2 Partner

- Identifies and submits to IRB (commercial IRB acceptable; COYL covers IRB
  fees if needed)
- Recruits participants from existing GLP-1 cohort
- Performs weight measurements at protocol-specified timepoints
- Manages clinical care per usual practice
- (Optional) Provides clinician interview qualitative arm

### 11.3 PI

- Holds protocol responsibility
- Reviews and approves SAP
- Adjudicates protocol deviations
- Co-author / lead author on manuscript

---

## 12. Publication and Data Sharing

Manuscript drafted by COYL with PI as senior author (or first author per
PI agreement). Submission to a peer-reviewed obesity-medicine, digital-
health, or behavioral-medicine journal. Pre-print posted to medRxiv at
submission.

De-identified analytic dataset deposited at a public repository (OSF or
journal supplement) per the publishing journal's data-availability policy.

Negative or null results will be published. Pre-registered protocol is
binding regardless of outcome direction.

---

## 13. Amendments

Protocol amendments require IRB review and partner agreement. All amendments
are versioned and dated.

---

## 14. References

References supporting the rationale, intervention design, and methodological
choices are listed at https://coyl.ai/science and in the citation appendix
of the SAP. Key papers:

- Wilding JPH et al. STEP-4: Once-Weekly Semaglutide vs Placebo for Maintenance of Weight Loss. JAMA. 2021.
- Aronne LJ et al. Tirzepatide Discontinuation in SURMOUNT-4. JAMA. 2024.
- Wood W, Rünger D. Psychology of Habit. Annu Rev Psychol. 2016.
- Forman EM et al. Ecological momentary assessment of dietary lapses. Health Psychol. 2017.
- Nahum-Shani I et al. Just-in-Time Adaptive Interventions (JITAIs). Ann Behav Med. 2018.
- Gollwitzer PM, Sheeran P. Implementation intentions and goal achievement: A meta-analytic review. Adv Exp Soc Psychol. 2006.

---

## Appendix A — Disclaimer

COYL is a behavioral support tool, not a medical device, treatment, or
therapy. This study is a minimal-risk behavioral feasibility study and is
not designed to support claims about safety or efficacy of any medication.
The intervention is not a substitute for clinical care.

---

_End of protocol v0.9. Version control: see git history of
`docs/clinical-study/protocol.md`._
