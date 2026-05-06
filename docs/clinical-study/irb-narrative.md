# IRB Submission Narrative — COYL-GLP1-MAINT-01

This narrative is written for IRB submission. It is structured to map onto
the standard IRB application sections used by both commercial IRBs (WCG,
Advarra) and most institutional IRBs. Cross-reference to the full protocol
at `docs/clinical-study/protocol.md`.

## 1. Study summary (lay description)

This study tests whether a behavioral mobile-app intervention (COYL),
delivered alongside an active GLP-1 receptor agonist prescription, can
reduce weight regain in the 90 days after the medication is discontinued.

GLP-1 medications (Ozempic, Wegovy, Mounjaro, Zepbound) help patients lose
weight, but most of the lost weight is regained when the medication ends,
typically within a year. The reason: the medication suppresses appetite
chemically but does not change the behavioral patterns (late-night eating,
stress eating, social eating triggers) that caused the original weight gain.
When the medication ends, those behaviors return.

This study asks: if we train the patient's behavioral pattern-recognition
skills *while* they are on the medication — when their appetite is
suppressed and they have the cognitive bandwidth to practice new responses —
does that training persist after they stop the medication and produce less
weight regain?

The intervention is a smartphone app the patient uses on their own time. The
control group continues their medication as usual. Both groups receive
medical care from the partner clinic per its standard practice. The study
adds nothing to the medical regimen and does not change how the medication
is prescribed or dosed.

## 2. Risk classification justification

This study qualifies for **expedited review under 45 CFR 46.110 category 7**:
"Research on individual or group characteristics or behavior (including, but
not limited to, research on perception, cognition, motivation, identity,
language, communication, cultural beliefs or practices, and social
behavior)."

The intervention is a consumer-grade behavioral support app. There is no
investigational drug, no investigational device, no procedure beyond what
the participant would receive in standard clinical care. The intervention
itself is publicly available; this study evaluates its effect in a
controlled population.

Risks are minimal as defined at 45 CFR 46.102(j): "the probability and
magnitude of harm or discomfort anticipated in the research are not greater
in and of themselves than those ordinarily encountered in daily life or
during the performance of routine physical or psychological examinations
or tests."

## 3. Risk inventory and mitigations

| Risk | Probability | Magnitude | Mitigation |
| --- | --- | --- | --- |
| Privacy breach (in-app data) | Low | Moderate | TLS in transit, AES-256 at rest, HIPAA-aligned data handling, BAA with partner, de-identified data for partner sharing, 30-day deletion-on-request |
| Privacy breach (linkage) | Low | Moderate | Linkage key held by partner only; never shared with COYL |
| Psychological discomfort from behavioral self-reflection | Moderate | Low | Tone-mode selection (4 options including gentlest "Mentor"), opt-out of any notification type, no required content |
| Weight-stigma exposure | Low | Low | Recovery Engine framing explicitly avoids restart/shame language; "behavioral support, not treatment" disclaimer throughout |
| Crisis surfacing (eating disorder, suicidal ideation) | Low | High | In-app safety triage routes to 988 / NEDA helpline; flagged to PI within 24h via de-identified marker |
| Adverse events from GLP-1 (unrelated to study) | Standard for med | Variable | Reported through partner's standard pharmacovigilance pathway |

## 4. Benefits

**To participants:**
- Free 12+ months of COYL Premium access (intervention arm immediately,
  control arm after 24-week follow-up window)
- No requirement to attend additional clinical visits beyond standard care
- Contribution to behavioral-science evidence base

**To the broader population:**
- Evidence on whether real-time behavioral support during the GLP-1 window
  can mitigate post-discontinuation regain — a question of growing public-
  health relevance as GLP-1 prescriptions expand

## 5. Population and recruitment

Target: 80 adults aged 18–65 with BMI 27–45 and an active GLP-1
prescription within the prior 90 days.

Recruitment is conducted by the partner clinic from its existing patient
panel. COYL does not perform direct-to-participant outreach. Recruitment
materials (email, in-app message, in-clinic flyer) are submitted as part of
the IRB packet.

**Vulnerable populations:** This study does not enroll children, prisoners,
or pregnant women. Participants planning pregnancy during the 24-week study
window are excluded.

## 6. Informed consent

Written informed consent is obtained prior to any study procedures.
Consent occurs via a 15–20 minute virtual or in-person session with study
staff who can answer questions. The consent form is provided 24 hours in
advance for the participant to review.

The consent form addresses:
- Voluntary participation; right to withdraw at any time without penalty
- Specific data uses, sharing, and retention
- Risks and mitigations
- Benefits
- PI and IRB contact information
- Consent specifically to data sharing under DUA
- Optional consent to qualitative interview (separate signature)

A draft consent form is included in the IRB submission packet.

## 7. Data privacy and security

### 7.1 Data classification

| Category | Classification | Storage |
| --- | --- | --- |
| Identified contact info | PHI | Partner only |
| Demographics | De-identified once mapped to study ID | COYL backend (encrypted) |
| In-app event stream | De-identified | COYL backend (encrypted) |
| Weight measurements | De-identified once mapped to study ID | Partner system + shared with COYL under DUA |
| Linkage key | PHI | Partner only — never transmitted to COYL |

### 7.2 Technical safeguards

- TLS 1.3 for all data in transit
- AES-256 encryption at rest (Postgres-level + application-level for sensitive fields)
- Audit log retained 365 days
- Access on least-privilege basis; engineering access requires SSO + 2FA
- No production database access from non-VPN endpoints

### 7.3 Administrative safeguards

- HIPAA-aligned policies and procedures (privacy & security)
- Annual workforce HIPAA training
- BAA with partner organization
- DUA governing all data sharing

### 7.4 Breach notification

Any suspected breach reported to PI and IRB within 60 days per the HIPAA
Breach Notification Rule, and to participants per state and federal
requirements.

## 8. Analysis plan and reporting

A pre-registered Statistical Analysis Plan (SAP) governs all analyses.
Pre-registration occurs at OSF or ClinicalTrials.gov prior to enrollment of
the first participant.

Both null and positive findings will be published. Negative findings will
not be suppressed.

## 9. Investigator qualifications

The principal investigator must hold an MD, PhD, or equivalent terminal
degree relevant to obesity medicine, behavioral science, clinical psychology,
or endocrinology. The PI is responsible for:
- Protocol oversight
- IRB communication and reporting
- Adverse event adjudication
- Authorship and publication oversight

The COYL sponsor team includes: software engineering, behavioral-science
advisors, and biostatistics support. The biostatistician is independent of
product engineering and analyst-blinded to arm assignment until dataset lock.

## 10. Conflicts of interest

COYL, Inc. is the sponsor and developer of the intervention. The PI is not
an employee of COYL and holds no equity, advisory, or compensated role with
COYL. The PI's compensation for the study (if any) is fixed in advance and
not contingent on study outcome.

The biostatistician is engaged as an independent consultant or as a
co-author from the partner institution, not from COYL's product team.

## 11. Retention and destruction

Identified data: held by partner, retained per partner institutional policy.

De-identified analytic dataset: held by COYL, retained 90 days post-readout,
then archived as anonymous aggregate or destroyed per the SAP.

Participants have the right to request deletion of their COYL in-app data at
any time; deletion within 30 days, except where retention is required by
applicable law.

## 12. Compensation

No participant compensation is budgeted at v0.9. Partner IRBs that require
compensation may add a small honorarium ($50–$150 typical), with COYL as
the funder.

## 13. Application checklist

Items submitted with this narrative:
- [ ] Full protocol (`protocol.md` v0.9)
- [ ] Statistical Analysis Plan (template, finalized by PI prior to enrollment)
- [ ] Draft informed consent form
- [ ] Draft recruitment materials (email, in-app message, flyer)
- [ ] Investigator's brochure (product description, technical safeguards)
- [ ] Data Use Agreement (template, partner-counsel reviewed)
- [ ] Business Associate Agreement (template, where applicable)
- [ ] PI CV and certifications
- [ ] Sponsor financial disclosure
- [ ] Site IRB authorization agreement (if reliance on a single IRB)

## 14. Contact

| Role | Contact |
| --- | --- |
| Sponsor (COYL) | research@coyl.ai |
| PI | _to be named with partner_ |
| IRB of record | _to be named with partner_ |

---

_End of IRB submission narrative. Cross-reference: `docs/clinical-study/protocol.md`._
