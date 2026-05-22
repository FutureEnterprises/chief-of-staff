# FDA Q-Submission — Pre-Submission Request

**Document type:** Q-Submission (Pre-Submission, "Pre-Sub")
**Submission program:** CDRH Q-Submission Program (per FDA Guidance "Requests for Feedback and Meetings for Medical Device Submissions: The Q-Submission Program," January 2024)
**Submission status:** Draft v0.9 — founder + regulatory consultant review before filing
**Intended FDA review division:** Office of Product Evaluation and Quality (OPEQ) / Digital Health Center of Excellence
**Anticipated review branch:** OHT5 (Office of Health Technology 5 — Gastroenterology, Renal, Urology, Endocrinology, and General Hospital Devices and Human Factors) for the obesity indication, with consultative review by the Digital Health Center of Excellence

> **Note to reviewer (internal):** this document is the structured starting
> point for the regulatory consultant. It will be revised at least twice
> before filing — once with the consultant on substance, once with FDA
> liaison counsel on tone and procedural posture. Cuts ~$50K of attorney
> drafting time off the front end.

---

## 1. Title

**Pre-Submission for COYL — A Software-as-Medical-Device (SaMD) for adjunctive behavioral support during and after GLP-1 receptor agonist therapy for adult patients with overweight or obesity.**

---

## 2. Sponsor Information

| Field | Value |
|---|---|
| Sponsor entity | COYL, Inc. (Delaware C-Corp) |
| Primary contact | Iman Schrock, Founder & Chief Executive Officer |
| Email | iman@coyl.ai |
| Regulatory contact | [Name TBD — regulatory consultant, RAPS-certified, retained Month 1] |
| Mailing address | [TBD — corporate address on file with FDA Establishment Registration] |
| FDA Establishment Registration number | [Pending — to be obtained prior to filing] |
| Owner/Operator number | [Pending] |
| Device listing | [Pending — listed at time of 510(k) filing] |

COYL, Inc. is a venture-funded U.S. corporation. The device is developed, hosted, and operated in the United States. No foreign manufacturing, no foreign data storage. All clinical evaluation data referenced herein was collected under IRB oversight at U.S. institutions (see Section 8, "Supporting Information").

---

## 3. Device Description

### 3.1 Overview

COYL ("Catch Yourself On Your Loop") is a Software-as-Medical-Device (SaMD) consisting of:

- **A native mobile application** (iOS and Android) and **companion web application** that the patient installs on a personal smartphone or accesses through a browser.
- **A server-side behavioral inference engine** that ingests passive signal data (time-of-day, location category, recent app usage, calendar density, physiological signals where available from connected wearables) and explicit user input (self-reported context, "slip" events, recovery actions) to identify high-risk windows for the patient's previously-characterized maladaptive behavior pattern (the "autopilot script").
- **A real-time intervention router** that delivers brief, context-matched behavioral prompts (text, audio, or short interactive screens) during the inferred pre-action window — typically the 3- to 90-second interval between a recognized trigger context and the patient's habitual maladaptive response.
- **A clinician-facing summary dashboard** for the patient's prescribing clinician (treating physician, nurse practitioner, registered dietitian, or behavioral health provider) showing aggregate engagement, slip events, recovery rate, and a non-diagnostic behavioral trajectory summary.

The device does NOT:

- Diagnose, mitigate, or treat obesity as a primary therapeutic claim.
- Modify, replace, or alter the dosing of any GLP-1 receptor agonist or any other pharmaceutical product.
- Provide medical advice on initiation, titration, or discontinuation of pharmacotherapy.
- Make autonomous treatment recommendations to the patient without clinician oversight in the GLP-1 indication.

### 3.2 Intended user populations

- **Patient (primary user):** adult (≥18 years) who is currently on, or has recently discontinued (within 12 months), GLP-1 receptor agonist therapy prescribed for overweight or obesity by a U.S.-licensed clinician.
- **Clinician (secondary user):** the patient's prescribing or treating clinician, who reviews aggregate behavioral data via the clinician dashboard and uses it to inform standard-of-care visits.

### 3.3 Intended use environment

Outpatient setting. The mobile app runs in the patient's normal daily environment — home, workplace, public spaces — and on the patient's personally-owned smartphone. No clinical setting use, no inpatient use, no use during emergency presentations.

### 3.4 Operating principle

The device implements a Just-in-Time Adaptive Intervention (JITAI) architecture (Nahum-Shani et al., 2018). It maintains a per-user state estimate consisting of: (a) the patient's archetype (a categorical descriptor of their dominant maladaptive script — e.g., "evening kitchen visit," "post-stress consumption," "weekend collapse"), (b) the patient's danger-window distribution (a probability density over time-of-day × day-of-week × context), and (c) the patient's recent recovery trajectory. The intervention router fires a brief, type-matched prompt when the inferred danger probability crosses a per-user threshold AND the user has not already received an intervention in the preceding cooldown interval.

Detailed technical description, training-data provenance, model-update cadence, and version-control documentation will accompany the eventual 510(k) submission. For the Q-Sub, the engineering description above is sufficient to ground Section 6's questions.

### 3.5 Software lifecycle

The device is developed and maintained per IEC 62304 (Medical Device Software — Software Life Cycle Processes), classified as software safety class B (non-life-supporting). Cybersecurity controls are designed per the FDA Guidance "Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions" (September 2023). Usability is engineered per IEC 62366-1.

---

## 4. Indications for Use

> **Proposed Indications for Use statement, verbatim:**

**The COYL device is indicated as an adjunctive behavioral support tool for adult patients (≥18 years) during and after GLP-1 receptor agonist therapy for the management of overweight or obesity. The device delivers context-matched behavioral prompts intended to reinforce non-pharmacological behavior change concurrent with, and following, prescribed pharmacotherapy. The device is intended to be used under the oversight of a licensed clinician and is not a replacement for pharmacotherapy, dietary counseling, or behavioral therapy.**

This indication is deliberately narrow. It does not claim to treat obesity as a primary therapy. It does not claim weight-loss efficacy as a standalone agent. It claims adjunctive behavioral support, which we believe is the regulatorily appropriate framing for the device's mechanism of action and the available evidence base.

The narrower indication also positions the device as adjunctive to clinician-led care, which we believe materially reduces residual risk and supports a Class II classification.

---

## 5. Device Classification Rationale

### 5.1 Proposed classification

COYL is proposed as **Class II** (special controls, 510(k) clearance pathway).

### 5.2 Predicate device analysis

We have identified three FDA-cleared or De Novo-authorized devices that establish a regulatory foundation for COYL. We propose the primary predicate as Welldoc BlueStar GLP-1; AspyreRx and Sleepio serve as supporting reference devices that establish the broader category of software-based behavioral interventions cleared by FDA.

#### 5.2.1 Primary predicate: Welldoc BlueStar GLP-1 (510(k) K223847)

| Comparison element | Welldoc BlueStar GLP-1 | COYL |
|---|---|---|
| Intended use | Adjunctive support for adults using GLP-1 therapy for weight management | Adjunctive behavioral support for adults during/after GLP-1 therapy for overweight/obesity |
| Target population | Adults on GLP-1 receptor agonists | Adults on or recently off GLP-1 receptor agonists (within 12 months) |
| Device type | Mobile health software | Mobile health software (SaMD) |
| Mechanism | Lifestyle coaching, education, medication adherence reminders | Real-time pattern-interrupt prompts in inferred pre-action windows |
| Clinician oversight | Required | Required |
| Risk profile | Low — adjunctive, no medication dosing decisions | Low — adjunctive, no medication dosing decisions |
| Regulatory class | Class II | Class II (proposed) |

**Substantial Equivalence basis:** same target patient population (adults on GLP-1 therapy for weight), same regulatory class, same general mechanism category (mobile software delivering behavioral content), same risk profile (adjunctive, no autonomous treatment decisions), same intended user (patient under clinician oversight). Differences in technology — COYL's real-time inference + intervention routing vs. Welldoc's scheduled coaching + reminders — do not raise new questions of safety or effectiveness because the intervention type (brief behavioral prompt) and the failure mode (a non-fired or mis-timed prompt) are equivalent in safety profile.

#### 5.2.2 Supporting reference device: Better Therapeutics AspyreRx (DeNovo DEN200033)

AspyreRx is an FDA De Novo-authorized prescription digital therapeutic for adult patients with type 2 diabetes, delivering cognitive behavioral therapy through a mobile application. It establishes that:

1. Software-based behavioral intervention is an FDA-recognized regulatory category for adult chronic metabolic conditions.
2. Real-time and asynchronous behavioral content delivery via a smartphone is an established device modality.
3. Outcome measures involving behavioral change and self-reported intermediate endpoints are acceptable to FDA when combined with biomarker or weight endpoints.

We reference AspyreRx not as our predicate (its De Novo path was due to lack of predicate at the time; that path is now obviated by BlueStar GLP-1's clearance), but as evidence that the regulatory category exists and is mature.

#### 5.2.3 Supporting reference device: Big Health Sleepio (510(k) K223218)

Sleepio is an FDA-cleared software device that delivers digital cognitive behavioral therapy for insomnia. It establishes that:

1. Software-delivered behavioral interventions can be cleared via 510(k) rather than De Novo when a predicate exists.
2. The 510(k) pathway accommodates app-only delivery with no hardware component.
3. Adjunctive behavioral therapy claims are clearable when supported by adequate evidence.

### 5.3 Why Class II, not Class I or Class III

- **Not Class I (general controls only):** the device performs more than general informational delivery. It performs real-time inference and adaptive intervention, which crosses the regulatory threshold for special controls.
- **Not Class III (PMA pathway):** the device is adjunctive, does not make autonomous medication dosing decisions, does not sustain or support life, does not present unreasonable risk of illness or injury. The predicate analysis above demonstrates that substantially equivalent devices are already classified as Class II.
- **Class II (510(k) with special controls) is appropriate:** the device benefits from special controls (software documentation, cybersecurity controls, human factors validation, post-market surveillance) without requiring the burden of PMA-level clinical evidence.

### 5.4 Product code

We propose the existing product code **QQR** (Software application for treatment of psychiatric disorders — extended use in behavioral support adjunctive to pharmacotherapy) as the closest existing fit, while requesting FDA's guidance on whether a new product code is warranted given the device's specific mechanism. This is one of our questions in Section 6.

---

## 6. Specific Questions for FDA

We respectfully request FDA's feedback on the following questions during the requested pre-submission meeting (Section 7).

### Question 1 — Predicate selection

Does FDA agree that Welldoc BlueStar GLP-1 (K223847) is an appropriate primary predicate for COYL, given the matching intended use (adjunctive support for adults on GLP-1 therapy for weight) and risk profile? If not, what predicate(s) would FDA suggest?

### Question 2 — Indications for Use language

Does the proposed Indications for Use statement (Section 4) adequately constrain the device's intended use to the adjunctive, clinician-supervised use case? In particular, does the phrase "during and after GLP-1 receptor agonist therapy" appropriately reflect a continuum-of-care indication, or does FDA prefer two separate indications (one for during, one for after)?

### Question 3 — Classification and product code

Does FDA agree with the proposed Class II classification under product code QQR? If FDA prefers a different existing product code, or a new product code, we request guidance on how to structure the 510(k) submission accordingly.

### Question 4 — Special controls

What special controls does FDA anticipate would be applicable to this device? Specifically:
- Software documentation per IEC 62304 (assumed)
- Cybersecurity per the September 2023 FDA guidance (assumed)
- Human factors / usability per IEC 62366-1 and the FDA Human Factors guidance (assumed)
- Clinical performance evidence threshold (the substance of Question 5)
- Labeling requirements specific to the GLP-1 adjunctive indication

### Question 5 — Clinical performance evidence

The sponsor is conducting a 1:1 randomized controlled trial (n=200, 12-week active intervention plus 12-week post-discontinuation follow-up) comparing COYL plus standard care to standard care alone in adults discontinuing GLP-1 therapy. The protocol is referenced in Section 8.

- Does FDA agree that a single adequately-powered RCT of this size and design, combined with the substantial-equivalence comparison to BlueStar GLP-1, is sufficient to support a 510(k) submission?
- Does FDA prefer a different primary outcome measure? (Sponsor's currently-planned primary outcome is percent change in body weight at 90 days post-discontinuation, with secondary outcomes covering behavioral engagement, slip-recovery rate, and patient-reported self-trust.)
- Does FDA have guidance on the role of real-world evidence (post-launch consumer-app data) as supporting evidence in the eventual submission?

### Question 6 — Adaptive algorithm and predetermined change control plan

COYL's behavioral inference model is expected to be retrained periodically using post-clearance data per FDA's "Marketing Submission Recommendations for a Predetermined Change Control Plan for Artificial Intelligence/Machine Learning (AI/ML)-Enabled Device Software Functions" (April 2025).

- Does FDA agree that a Predetermined Change Control Plan (PCCP) covering periodic model retraining (within fixed performance bounds, with pre-specified retraining triggers and validation protocols) is appropriate for this device, and can be filed as part of the initial 510(k)?
- Are there specific PCCP elements FDA would emphasize for a behavioral SaMD as opposed to a diagnostic AI/ML device?

### Question 7 — Human factors

Does FDA agree that the sponsor's planned human factors validation program — a summative usability study with n≥15 adult patients on GLP-1 therapy and n≥15 clinicians per the FDA Human Factors guidance — is appropriate? If FDA recommends additional human factors evaluation (e.g., a separate study for the clinician-facing dashboard), we request guidance now to avoid duplicative work.

### Question 8 — Post-market surveillance

Given the device's adaptive nature and the GLP-1 indication's evolving clinical context, what post-market surveillance commitments would FDA recommend at clearance? Specifically:
- Required reporting cadence under MedWatch
- Periodic safety reporting (frequency, content)
- Real-world performance data submission cadence
- Reclearance triggers for material updates beyond the PCCP envelope

### Question 9 — Software platform regulation and third-party integrations

COYL is intended to integrate with consumer-grade wearables (Apple Watch, Fitbit, Whoop, Withings, Dexcom, Libre, Garmin) to receive heart rate, glucose, and movement data as inputs to the inference model. Some of these integrations involve devices that are themselves FDA-cleared (e.g., Dexcom G7); others are general wellness devices.

- Does FDA consider the consumption of inputs from a separately-cleared wearable to constitute a system-level claim that would alter the 510(k) scope?
- Does FDA distinguish between "input is required for safe operation" versus "input is optional and improves model performance" for purposes of regulatory scope? (Our intended labeling is that wearable input is optional and the device operates safely without it.)

### Question 10 — Pediatric and other excluded populations

The current indication is for adults (≥18 years). We are aware of growing pediatric obesity pharmacotherapy use. We do not intend to claim a pediatric indication at first clearance.

- Does FDA agree that the adult-only indication is acceptable for the first clearance?
- What would FDA's expectation be for a future pediatric indication expansion — a new 510(k), or a Special 510(k) amendment, and what additional evidence would be required?

### Question 11 — Breakthrough Device Designation

The sponsor intends to file a Breakthrough Device Designation request in parallel with this Q-Submission, on the theory that the device provides substantial improvement over existing approved or cleared devices for a serious condition (post-GLP-1 weight regain, which carries documented cardiometabolic harm).

- Does FDA have any preliminary view on whether COYL meets the BDD eligibility criteria as articulated in 21 USC 360e-3 and FDA's Breakthrough Devices Program guidance?
- If granted, would BDD designation affect FDA's recommended review pathway or evidence requirements?

### Question 12 — Pre-submission meeting format

We request an in-person or video pre-submission meeting (sponsor's preference: video, 90 minutes) within 75 days of submission acknowledgment, per the Q-Submission Program's standard timeline.

---

## 7. Pre-Submission Meeting Request

The sponsor requests a Q-Submission Meeting with the appropriate FDA review division.

| Element | Sponsor's preference |
|---|---|
| Format | Video conference (preferred); in-person at FDA White Oak acceptable |
| Duration | 90 minutes |
| Sponsor attendees | Founder/CEO (Iman Schrock); Head of Regulatory (TBD); Outside Regulatory Counsel (TBD); Biostatistician (TBD); Clinical PI (TBD, named once selected) |
| FDA attendees requested | Review Division Lead; Software/SaMD Reviewer; Statistical Reviewer; Clinical Reviewer; Digital Health Center of Excellence representative |
| Timing | Within 75 days of FDA acknowledgment, consistent with Q-Sub Program standard timelines |

The sponsor will provide a written meeting agenda 14 days in advance, along with any additional supporting materials FDA requests.

---

## 8. Supporting Information

### 8.1 Key literature

The behavioral-science foundation of the device rests on a substantial peer-reviewed literature on Just-in-Time Adaptive Interventions (JITAIs), habit formation, implementation intentions, and ecological momentary intervention.

**Foundational JITAI literature:**

1. Nahum-Shani, I., Smith, S. N., Spring, B. J., Collins, L. M., Witkiewitz, K., Tewari, A., & Murphy, S. A. (2018). Just-in-Time Adaptive Interventions (JITAIs) in mobile health: key components and design principles for ongoing health behavior support. *Annals of Behavioral Medicine*, 52(6), 446-462. — Establishes the JITAI framework, including the canonical components (tailoring variables, decision rules, intervention options) that COYL implements.

2. Hardeman, W., Houghton, J., Lane, K., Jones, A., & Naughton, F. (2019). A systematic review of just-in-time adaptive interventions (JITAIs) to promote physical activity. *International Journal of Behavioral Nutrition and Physical Activity*, 16(31). — Systematic review of JITAI effectiveness.

3. Wang, L., & Miller, L. C. (2020). Just-in-the-Moment Adaptive Interventions (JITAI): a meta-analytical review. *Health Communication*, 35(12), 1531-1544.

**Habit and behavior-change literature:**

4. Wood, W., & Neal, D. T. (2007). A new look at habits and the habit-goal interface. *Psychological Review*, 114(4), 843-863. — Establishes the dual-process model of habit and goal-directed behavior that underlies COYL's "autopilot script" framing.

5. Wood, W., & Rünger, D. (2016). Psychology of habit. *Annual Review of Psychology*, 67, 289-314.

6. Mazar, A., & Wood, W. (2018). Defining habit in psychology. In *The Psychology of Habit* (pp. 13-29). Springer. — Defines habit as automatically cued behavior in stable contexts, the core construct COYL interrupts.

**Implementation intentions and self-regulation:**

7. Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist*, 54(7), 493-503. — Foundational paper on if-then planning, which informs COYL's pre-commit intention features.

8. Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology*, 38, 69-119.

9. Meta-analysis (2024) of implementation intention interventions in weight management — placeholder citation, to be finalized by clinical PI before Q-Sub filing.

**JITAI clinical trials in obesity and weight management:**

10. Forman, E. M., Goldstein, S. P., Crochiere, R. J., Butryn, M. L., Juarascio, A. S., Zhang, F., & Foster, G. D. (2019). Randomized controlled trial of OnTrack, a just-in-time adaptive intervention designed to enhance weight loss. *Translational Behavioral Medicine*, 9(6), 989-1001. — Direct precedent for JITAI in weight management.

11. Goldstein, S. P., Zhang, F., Thomas, J. G., Butryn, M. L., Herbert, J. D., & Forman, E. M. (2018). Application of machine learning to predict dietary lapses during weight loss. *Journal of Diabetes Science and Technology*, 12(5), 1045-1052.

12. Naughton, F., et al. (2021). Randomized controlled trial of a smartphone-based JITAI for smoking cessation. *Annals of Behavioral Medicine* — adjacent JITAI clinical effectiveness evidence.

**GLP-1 weight regain literature:**

13. Wilding, J. P. H., et al. (2022). Weight regain and cardiometabolic effects after withdrawal of semaglutide: the STEP 1 trial extension. *Diabetes, Obesity and Metabolism*, 24(8), 1553-1564. — Establishes the clinical problem COYL is designed to address: ~⅔ of weight loss is regained within 1 year of discontinuation.

14. Aronne, L. J., et al. (2023). Continued treatment with tirzepatide for maintenance of weight reduction in adults with obesity: the SURMOUNT-4 randomized clinical trial. *JAMA*, 331(1), 38-48.

### 8.2 Prior FDA correspondence

None. This is the sponsor's first FDA submission for this device.

### 8.3 Sponsor's clinical study protocol (in progress)

The sponsor has drafted a clinical study protocol ("COYL-GLP1-MAINT-01," v0.9) for a 1:1 randomized, single-blind, 12-week behavioral intervention trial. The protocol will be submitted under IRB oversight at the partner institution and will form the basis of the clinical performance evidence package for the eventual 510(k) submission. The protocol is available upon FDA request.

### 8.4 Quality system and software lifecycle documentation

The sponsor is establishing a quality system per 21 CFR Part 820 and is developing the device per IEC 62304. Specific documents in preparation:

- Design History File (DHF)
- Software Development Plan
- Software Requirements Specification
- Software Architecture Document
- Software Verification and Validation Plan
- Risk Management File per ISO 14971
- Usability Engineering File per IEC 62366-1
- Cybersecurity Documentation per FDA September 2023 guidance

These documents will be made available as part of the 510(k) submission; they are not requested in advance for the pre-submission meeting unless FDA indicates otherwise.

---

## 9. Appendices

### Appendix A — Sponsor company information

COYL, Inc. is a Delaware C-Corporation incorporated [date TBD]. The company's mission is to deliver real-time behavioral support for adults navigating chronic-condition pharmacotherapy, beginning with GLP-1 receptor agonists for overweight and obesity.

### Appendix B — Device functional block diagram

[To be inserted at filing: schematic showing the inference pipeline — signal ingestion (passive + active) → state estimation → danger-window inference → intervention selection → delivery → outcome capture → model update]

### Appendix C — Predicate device summary table

A consolidated comparison table of COYL vs. Welldoc BlueStar GLP-1 (K223847), Better Therapeutics AspyreRx (DEN200033), and Big Health Sleepio (K223218), covering intended use, target population, mechanism, technology, performance characteristics, and risk profile. Detail level: equivalent to FDA's standard 510(k) substantial-equivalence comparison table. [To be expanded prior to filing.]

### Appendix D — Bibliography (full)

Full bibliography of literature cited in Section 8.1, with DOIs and URLs. [To be compiled prior to filing.]

### Appendix E — Sponsor's regulatory team biographies

[To be inserted: regulatory consultant, head of regulatory, outside counsel, biostatistician, clinical PI]

### Appendix F — Glossary

| Term | Definition |
|---|---|
| Autopilot script | The sponsor's term for an automatically cued, contextually-triggered behavior pattern. Functionally equivalent to "habit" in the Wood & Neal (2007) sense. |
| Danger window | The inferred time interval (typically 3 to 90 seconds, occasionally extended to several minutes) preceding the patient's habitual maladaptive response, within which a behavioral intervention has the highest probability of effectiveness. |
| JITAI | Just-in-Time Adaptive Intervention (Nahum-Shani et al., 2018). |
| Pattern-interrupt prompt | A brief (typically <30 seconds) behavioral message delivered to the patient during the inferred danger window. |
| Recovery | The patient's return to baseline self-regulatory behavior after a "slip" event. COYL emphasizes recovery over relapse-prevention as a behavior-change construct. |
| SaMD | Software as a Medical Device (per IMDRF definition). |
| Self-trust score | A patient-reported and behaviorally-inferred composite measure of the patient's confidence in their own behavioral self-regulation. Tracked as a secondary outcome. |

---

**End of Q-Submission draft. Document ID: COYL-QSUB-01-v0.9.**
