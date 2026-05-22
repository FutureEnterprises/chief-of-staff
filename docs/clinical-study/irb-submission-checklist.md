# IRB Submission Checklist — COYL-GLP1-MAINT-01

> Founder-executable checklist for actually getting the IRB submission out
> the door. Once Found Health signs the letter of intent, work this list
> top-to-bottom. Target: submission within **4 weeks** of LOI signature.
>
> Companion docs:
> - `docs/clinical-study/irb-protocol-skeleton.md`
> - `docs/clinical-study/found-health-partnership-operating-doc.md`
> - `docs/clinical-study/protocol.md` (full protocol)
> - `docs/clinical-study/irb-narrative.md` (lay narrative)

---

## Pre-submission checklist

### A. Partner alignment
- [ ] Found Health letter of intent (LOI) countersigned
- [ ] Found Health **IRB liaison identified by name + email**
  (likely Western IRB / WCG, Advarra, or Found's institutional
  IRB-of-record — confirm with Found Clinical Affairs which they
  use for digital-health trials)
- [ ] Found's preferred IRB **submission portal access** provisioned
  for COYL PI (named account, not shared credentials)
- [ ] Joint kickoff call held; submission timeline agreed in writing

### B. Protocol documents
- [ ] Protocol skeleton turned into **final IRB form** (most IRBs
  have proprietary forms — paste from `irb-protocol-skeleton.md`
  into the IRB's template fields, do not submit our markdown
  directly)
- [ ] **Investigator's Brochure** prepared for the COYL app
  (covering: design specs, prior usage data from the consumer
  beta, full copy library, prediction-model description at a
  conceptual level, safety monitoring features, notification
  rate caps)
- [ ] **Informed Consent Form** drafted (template below — adapt
  with Found's IRB-of-record specific language)
- [ ] **HIPAA Authorization** form drafted (separate from consent;
  some IRBs require these be bundled, others require them
  distinct — check)
- [ ] **Recruitment materials** prepared:
  - [ ] Patient-facing flyer (digital and print-ready)
  - [ ] Email-recruitment script for Found's patient outreach
  - [ ] Social media copy (one short-form post, one longer-form
    post; not deployed publicly until IRB-approved)
  - [ ] In-app Found portal banner copy
- [ ] **Assessment instruments** assembled:
  - [ ] PHQ-9 (public domain — confirm license-free use)
  - [ ] SF-12 (license required — purchase before submission)
  - [ ] EBI (Eating Behavior Inventory — license required)
  - [ ] EDE-Q (Eating Disorder Examination Questionnaire — confirm
    license terms)
  - [ ] Custom 7-day eating-pattern diary (built in-house)

### C. Legal and compliance
- [ ] **Data Use Agreement (DUA)** between COYL and Found Health
  drafted by counsel — covers data ownership, access rights,
  permitted uses, breach reporting, termination
- [ ] **Business Associate Agreement (BAA)** signed with Found
  Health (or Found is named on COYL's existing BAAs with the
  hosting providers)
- [ ] **Clinical trial insurance** policy bound (minimum $5M
  coverage; confirm with Found's risk team)
- [ ] **Sub-investigator agreements** signed for any COYL staff
  who interact with PHI
- [ ] **Counsel sign-off** on the consent form, on the DUA, on
  recruitment copy, and on the publication plan
- [ ] **Investigator IND/IDE applicability check** — confirm with
  counsel that this is NOT an FDA-regulated device study at
  current intended use; document the determination

### D. Training and credentials
- [ ] **HIPAA training certificate** on file for all study staff
  (PI, Co-Is, Clinical Affairs, data analysts) — vendor TBD
  (HealthStream or equivalent), valid within last 12 months
- [ ] **CITI Program training** completed by all PI/Co-I/research
  staff — at minimum the "Biomedical Research" or "Social-
  Behavioral-Educational" basic course, plus "Good Clinical
  Practice (GCP)"; certificates uploaded to IRB portal
- [ ] **Conflict-of-interest disclosures** signed by all
  investigators (sponsor COI per §19 of the protocol)
- [ ] **CV + medical license** for the Found PI on file (within
  last 12 months)
- [ ] **PI delegation log** drafted (who can do what — consent,
  outcome assessment, intervention delivery)

### E. Technical readiness
- [ ] **REDCap** (or equivalent) study instance provisioned with
  randomization module, surveys, and Withings API integration
- [ ] **Withings scale order** placed (N=80 scales + 10 spares;
  ~$8K)
- [ ] **TestFlight build** of COYL-trial branch published to
  Found Health–owned TestFlight account (NOT the consumer
  TestFlight)
- [ ] **Pseudonymized study-ID generator** integrated into the
  enrollment flow
- [ ] **Safety-trigger automation** wired (PHQ-9 item 9 ≥ 1 →
  Found on-call clinician notification within 24 hours)
- [ ] **Aggregate-only data export** wired (no raw HR or location
  data leaves device)

### F. Registration and disclosure
- [ ] **ClinicalTrials.gov** record drafted; ready to publish on
  IRB approval and **before first enrollment**
- [ ] **ICMJE prospective registration** confirmed (required for
  publication in target journals)
- [ ] **OHRP / FDA Form FDA 1572** prepared if applicable (likely
  not applicable for behavioral intervention)
- [ ] **Single IRB (sIRB)** determination made — Found's IRB-of-
  record is the single IRB for both sites if applicable

### G. Submission and post-submission
- [ ] All documents bundled per IRB's submission specs
- [ ] Internal pre-submission review held with PI + COYL counsel
  + Found Clinical Affairs
- [ ] **Submission filed**
- [ ] Submission confirmation receipt archived
- [ ] **Calendar reminders** set for IRB review windows (typical
  expedited cycle: 2–4 weeks; reminder at week 2, week 3, week
  4)
- [ ] Process for **responding to IRB stipulations** agreed
  (typical: 1–2 rounds of clarifications; named responder is
  the COYL Clinical Lead)
- [ ] **Approval letter** received → recruitment materials and
  TestFlight build go live

---

## Informed Consent Form — Template

> Adapt for the IRB-of-record. Most IRBs require specific
> boilerplate (CFR-mandated elements at 45 CFR 46.116). The
> template below contains all of the required elements in plain
> language; the IRB-of-record's language reviewer will edit for
> their preferred phrasings. Target reading level: 8th grade.
> Length target: under 8 pages.

---

### COYL × Found Health — Informed Consent to Participate in a Research Study

**Study title:** A Randomized Controlled Trial of AI-Driven Behavioral
Interrupts as Adjunctive Therapy for Weight Maintenance Post-GLP-1
Discontinuation.

**Short title:** COYL-GLP1-MAINT-01.

**Sponsor:** COYL, Inc.

**Clinical partner:** Found Health, Inc.

**Principal Investigator:** [PI name, credentials, contact email and
24-hour phone].

**IRB of record:** [IRB name, IRB ID, IRB contact phone].

---

**1. Why are you being asked to participate?**

You are being asked to take part in a research study because you
have been receiving GLP-1 weight-management medication (Ozempic,
Wegovy, Mounjaro, Zepbound, or similar) through Found Health, and
you have recently stopped or are about to stop that medication.

Research has shown that **about two-thirds of the weight people
lose on these medications is regained within a year of stopping.**
This study is trying to find out whether a behavioral coaching
smartphone app called COYL — used in the weeks right after you
stop the medication — helps you keep weight off compared to your
usual Found Health care.

**2. Is this voluntary?**

**Yes. Participation is entirely voluntary.** You may say no for
any reason or for no reason. If you say no, your care with Found
Health will not change in any way. You will continue to receive
the same standard care as any other Found Health patient.

You may also **withdraw from the study at any time**, even after
you have started. Withdrawing will not affect your care at Found
Health, your relationship with your clinician, or any future care
decisions. To withdraw, tap the "Withdraw from study" button in
the COYL app, email the study team at [study email], or call the
study line at [study phone].

**3. What will happen if you participate?**

The study lasts **12 weeks**. There are two groups, and which
group you are in is decided **by chance** (like a coin flip), with
about half of participants in each group.

**Group A — COYL + Standard Care:** You will install the COYL app
on your iPhone. The app will send you occasional in-the-moment
prompts (notifications or short voice messages) at times when you
might be at risk of returning to old eating patterns. You will
also continue your usual care with Found Health.

**Group B — Standard Care:** You will continue your usual care
with Found Health and report your weight each week through Found's
existing portal. You will not install the COYL app.

**For both groups,** the study will:
- Send you a Withings smart scale at the start, so you can weigh
  yourself at home each week. The scale automatically reports
  your weight to the study team.
- Ask you to complete short surveys at the start, at week 6, and
  at week 12 (about 15–20 minutes each).
- Mail you a return-shipping label for the scale at week 12.

**4. What are the risks?**

This study is classified as **minimal risk**. There are no
medical procedures, no medications, and no diagnostic tests added
by the study. The possible risks are:

- **Minor inconvenience.** Surveys and weighing in take time.
- **Notification fatigue.** If you are in Group A, the COYL app
  will send prompts. The maximum is 6 prompts per day. You can
  ignore any prompt with no consequence.
- **Privacy.** Like any digital service, there is a small risk
  that your data could be exposed if our systems were
  compromised. We use strong encryption, access controls, and
  privacy-by-design practices to reduce this risk. See section 7.
- **Emotional response.** Some people find tracking and reflecting
  on eating behavior emotionally difficult. If at any point you
  feel distressed, you may pause the app, withdraw from the
  study, or contact the study team or your Found Health
  clinician.

If you experience any **thoughts of harming yourself**, please
**call or text 988** (Suicide & Crisis Lifeline) immediately, or
go to your nearest emergency department.

**5. Are there benefits?**

We do not know in advance whether you will personally benefit
from being in this study. If Group A turns out to be effective,
you may experience less weight regain than you otherwise would
have. If Group B turns out to be effective, the study still
contributes important knowledge. **Either way, the information
from this study will help future patients** who stop GLP-1
medication.

**6. Will you be paid?**

Yes. **In both groups**, you receive:
- **$50** when you enroll and complete the baseline visit.
- **$50** when you complete the mid-trial assessments at week 6.
- **$100** when you complete the final assessments and return the
  scale at week 12.

Total: **$200 if you complete the study.** Payment is by gift
card or direct deposit, at your choice. Payment does not depend
on whether you use the COYL app — only on completing the
assessments.

**7. How is your information protected?**

- Your name, email, and phone number are kept on a secure system
  at Found Health and are **not** shared with COYL's research
  team.
- You will be assigned a random **study ID** at enrollment.
  Researchers see only the study ID, not your name.
- All data is encrypted on the devices, in storage, and when
  transmitted.
- COYL receives only **aggregate event counts** (for example,
  "the app fired 5 prompts on Tuesday"). Your **raw heart rate
  data, raw GPS location data, and raw HealthKit data never leave
  your phone**.
- Identifiable data is destroyed within **90 days** of the study
  ending. De-identified data is kept for **7 years** per
  research guidelines.
- Should there ever be a data breach, you will be notified per
  the HIPAA Breach Notification Rule and any applicable state
  law.

**8. Conflicts of interest you should know about**

The COYL app is **made by COYL, Inc., which is also the sponsor
and funder of this study.** This is a direct financial conflict
of interest. We disclose it openly:

- COYL designed and funded the study.
- The independent IRB ([name]) reviewed and approved the study.
- The weight data (the main outcome) is analyzed by a person
  **blinded** to which group you were in.
- An **independent Data and Safety Monitoring Board** (three
  outside experts) reviews safety and progress.
- This conflict will be disclosed in any publication of the
  study results.

You should weigh this information when deciding whether to
participate.

**9. What are your rights?**

You have the right to:
- Refuse to participate
- Withdraw at any time without explanation and without affecting
  your care
- Ask any question about the study at any time
- Receive answers to your questions before agreeing
- Receive a copy of this consent form

If you have **questions about the study itself**, contact the
study team at [study email / study phone, 24-hour]. If you have
**questions about your rights as a research participant**, contact
the IRB at [IRB phone, IRB email].

**10. Statement of consent**

By signing below, I confirm that:
- I have read this form (or had it read to me)
- I have been able to ask questions and have received answers
- I understand the study, the risks, the benefits, and that I may
  withdraw at any time
- I agree to participate

| | |
|---|---|
| Participant signature | Date |
| Participant name (printed) | |
| Person obtaining consent (signature) | Date |
| Person obtaining consent (printed) | |

---

*End of consent template. Length: approximately 1,000 words.*
