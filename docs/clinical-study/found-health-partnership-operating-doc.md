# Found Health Partnership — Operating Doc

> The operating model between COYL, Inc. and Found Health, Inc. for running
> the COYL-GLP1-MAINT-01 randomized controlled trial. This document is
> binding once countersigned alongside the master Clinical Trial Agreement
> (CTA) and is the working reference for week-to-week execution.
>
> Companion docs:
> - `docs/clinical-study/irb-protocol-skeleton.md`
> - `docs/clinical-study/irb-submission-checklist.md`
> - `docs/clinical-study/protocol.md` (full protocol)
> - `docs/outreach/clinical-pitch-found-health.md` (inbound pitch)

---

## 1. Roles

### Found Health
- **IRB sponsorship** — Found is the institution of record for the IRB
  submission and the IRB-of-record relationship.
- **Recruitment** — Found supplies access to the patient base (post-
  GLP-1-discontinuation cohort) and runs in-portal recruitment.
- **Clinical oversight** — Found's PI is the named Principal
  Investigator. Found's on-call clinical team responds to safety
  triggers within 24 hours.
- **Safety monitoring** — Found logs and reviews all adverse events.
  Found's PI has **unilateral stop authority** on any safety signal.
- **Site monitoring** — Found's clinical operations team conducts
  per-participant monitoring per ICH GCP guidance.
- **Identifiable-data custody** — Found is the sole holder of the
  study-ID-to-participant-identity mapping table.

### COYL
- **Study sponsor of record** — COYL files the sponsor-of-record
  signature on the IRB submission and on clinicaltrials.gov.
- **Funding** — COYL funds the trial in full from internal capital.
  No external grants, no co-funding, no contingent payments.
- **Intervention deployment** — COYL builds, ships, and operates the
  COYL trial-branch TestFlight build for the duration of the study.
- **Data analysis** — COYL's contracted statistical lead runs the
  primary analysis; analysis code is shared with the DSMB and with
  Found's biostatistics function for independent reproduction before
  manuscript submission.
- **Manuscript drafting** — COYL drafts the manuscript first draft;
  Found PI is first author, COYL Clinical Lead is second, COYL
  founder is the corresponding (senior) author (see §5).

### Joint (COYL + Found)
- **DSMB convening** — Three-member external Data and Safety
  Monitoring Board jointly appointed before first enrollment.
- **Clinical board** — Joint clinical review of all interrupt copy
  before deployment.
- **Communications** — Press, social, conference announcements are
  jointly approved.

---

## 2. Cadence

### Weekly — operational standup
- **Attendees:** Found PI, COYL founder (Iman Schrock), Found PM,
  COYL Clinical Lead.
- **Length:** 30 minutes.
- **Day:** Tuesdays, 10:00 AM Pacific (default — confirmed at kickoff).
- **Agenda template:**
  1. Enrollment status (target / actual / projected)
  2. Active safety items (open / closed)
  3. Protocol deviations (none / list)
  4. Blockers needing decision this week
- **Owner:** Found PM drafts agenda, COYL Clinical Lead takes minutes,
  minutes archived in shared drive within 24 hours.

### Monthly — clinical safety + enrollment review
- **Attendees:** Found PI, Found CMO, COYL founder, COYL Clinical
  Lead, COYL counsel (as needed).
- **Length:** 60 minutes.
- **Day:** First Wednesday of each month.
- **Agenda template:**
  1. Cumulative enrollment vs. plan
  2. Demographic balance across arms
  3. Adverse events review (line by line)
  4. PHQ-9 trigger events (count + outcome)
  5. Withdrawal reasons (qualitative review)
  6. Open IRB items
  7. Budget burn vs. plan
- **Owner:** Found Clinical Affairs.

### Quarterly — Data and Safety Monitoring Board (DSMB)
- **Attendees:** DSMB (3 external members), Found PI (non-voting),
  COYL Clinical Lead (non-voting), statistical lead (non-voting).
- **Length:** 90 minutes.
- **Cadence:** Q1 (post-IRB approval, pre-enrollment kickoff), Q2,
  Q3, Q4 (post-dataset-lock).
- **Authority:** DSMB may recommend protocol pause, protocol
  amendment, or unblinded interim look. Found PI has final
  decision authority informed by DSMB recommendation.
- **Owner:** DSMB chair (independent).

---

## 3. Financials

| Line item | Amount | Notes |
|---|---|---|
| Found Health partnership fee (per enrolled participant) | $2,000 × 80 = **$160,000** | Triggers at enrollment confirmation, not at completion |
| IRB submission + review fees | **$5,000–$15,000** | Found's standard contract; commercial IRB pricing varies |
| Site monitoring | $500 × 80 = **$40,000** | Per-participant monitoring per Found's standard |
| Subtotal Found Health-side spend | **~$200,000–$220,000** | Within Roadmap clinical execution budget |

**Out of scope of this line** (paid by COYL directly):
- Participant compensation: $200 × 80 = $16,000
- Withings scales: ~$8,000 (80 scales + 10 spares × ~$90)
- Statistical lead contract: ~$30,000
- Manuscript editing + open-access fees: ~$10,000
- DSMB honoraria: 3 × $5,000 = $15,000
- Trial insurance: ~$15,000/year for the trial window
- Survey instrument licenses (SF-12, EBI, EDE-Q): ~$5,000

**Total trial budget (COYL + Found, all-in): ~$300,000–$320,000**,
well within the $2M clinical execution line item in the $6B
Roadmap.

**Payment terms.**
- 50% of Found partnership fee on contract execution.
- 25% on IRB approval.
- 25% on enrollment of last participant (N=80).
- Site monitoring fees paid quarterly, invoiced against monitoring
  reports.
- All invoices on Net 30; late fees per Found's standard.

**Audit rights.** COYL may audit Found's per-participant
monitoring billing on 30 days' notice, once per year.

---

## 4. Data Flow

### Enrollment data flow
1. Participant receives recruitment touchpoint from Found Health
   (in-portal banner, email, or telehealth-visit invitation).
2. Participant clicks consent link → Found-hosted consent flow
   (DocuSign or equivalent under Found's IRB).
3. Participant completes baseline questionnaires in Found's REDCap
   instance.
4. **Study ID assigned** at end of baseline visit (12-character
   random ID). Mapping table held at Found only.
5. If randomized to COYL arm: participant receives TestFlight link
   in Found portal, installs COYL trial build, app picks up study
   ID via deep-link parameter, app self-registers with COYL backend
   using study ID only.

### Outcome data flow
1. Participant weighs in on Withings scale at home.
2. Withings device → Withings cloud (Withings-side BAA in place).
3. Withings API → **Found Health research portal** (Found pulls; not COYL).
4. Found's blinded outcome assessor sees weight data keyed by study
   ID with **no arm column** until dataset lock.
5. At lock, statistical lead receives the full dataset (weights +
   arm assignment + covariates) for primary analysis.

### Adherence + intervention data flow
1. COYL app logs all interrupt firings, response latencies, and
   caught-vs-slipped tags locally on device.
2. COYL backend receives **aggregate counts only** (number of
   firings per day, tag distribution, response-latency histogram).
   No raw HR, no raw GPS, no individual event metadata.
3. **Found may request aggregate counts** from COYL on request, for
   adherence-related sensitivity analysis. Format: study-ID-keyed,
   aggregated weekly.
4. COYL retains the raw on-device data in encrypted form for the
   duration of the trial; raw data does not leave the device
   except in the aggregate-count form described above.

### Safety data flow
1. PHQ-9 administered in-app at weeks 0, 6, 12.
2. **PHQ-9 item 9 score ≥ 1** triggers immediate event in COYL
   backend.
3. COYL backend → Found's safety-event webhook within minutes
   (study ID + trigger reason; no PHI beyond the score itself).
4. Found's on-call clinician contacts participant within 24
   hours.

### Data ownership
- **Identifiable data:** Found Health owns.
- **De-identified study dataset:** **Jointly owned** by COYL and
  Found.
- **Manuscript and publication:** **Jointly authored**, jointly
  attributable, neither party may publish ahead of the other.
- **Aggregate intervention data (COYL-internal):** **COYL owns.**
  May be used by COYL for product development independent of
  the trial.

---

## 5. Publication Plan

### Authorship
- **First author:** Found Health PI.
- **Second author:** COYL Clinical Lead.
- **Mid authors:** Statistical lead, Found Clinical Affairs
  designee, additional Co-Is as contributions warrant.
- **Senior (corresponding) author:** Iman Schrock, COYL founder.

ICMJE authorship criteria apply. Order subject to revision based
on contribution at time of manuscript drafting; default is the
order above.

### Target journals
1. **Primary:** *JAMA Internal Medicine*
2. **Secondary:** *NEJM AI*
3. **Tertiary:** *Lancet Digital Health*

If all three reject, the manuscript moves to *Obesity* or *JMIR
mHealth and uHealth*. The manuscript will not be left unpublished.

### Open access
**Required.** All publication costs (gold open access where
required, hybrid open access otherwise) are borne by COYL.

### ClinicalTrials.gov
Registered **before first enrollment**. NCT number included in
every recruitment material, every consent form, every
publication, and every press touchpoint.

### Pre-prints
Permitted on **medRxiv** following journal-submission day, per
ICMJE allowance. Joint approval (Found PI + COYL founder)
required.

### Press and conference announcements
Jointly approved. No party announces independently. **No press
during the trial window**; first announcement is on manuscript
acceptance.

### Negative-result obligation
If the primary outcome shows **no benefit** or **harm** in the
COYL arm, the manuscript proceeds to submission **with the same
priority** as a positive-result manuscript. Neither party may
suppress, delay, or alter the publication of negative results.
This obligation is recorded in the master Clinical Trial
Agreement.

---

## 6. Conflict Management

### Safety / futility — Found PI has unilateral stop authority
At any point in the trial, the Found PI may **unilaterally halt
enrollment** if:
- DSMB recommends a stop on safety or futility grounds.
- The PI's clinical judgment identifies a safety signal not yet
  captured by the DSMB.
- An IRB amendment or stipulation requires a pause.

No countervailing authority from COYL applies. COYL cannot
overrule a Found PI stop decision. COYL may request a written
rationale and may appeal to the DSMB chair.

### Data interpretation disagreements — third-party arbitration
If Found and COYL disagree on the interpretation of trial data
during analysis or manuscript drafting:
1. **Disagreement is documented in writing** by both parties.
2. **A third-party biostatistician** — pre-named in the master
   CTA, neutral to both parties — reviews the disagreement and
   issues a non-binding recommendation within 14 days.
3. The recommendation is incorporated into the manuscript or, if
   either party disagrees, included as a footnote disclosing the
   disagreement.

### Operational disagreements
Escalation path: Standup → Monthly review → CMO + COYL founder
direct call → CTA dispute resolution clause (mediation, then
binding arbitration in the venue specified in the CTA).

---

## 7. Termination

### Either party may terminate with 30 days notice
Standard termination is **30 days written notice** by either party.

**Participants currently in active follow-up** (between week 0 and
week 12) **complete the study** under the protocol regardless of
termination. Both parties' obligations to those participants
survive the termination notice.

### For-cause termination
Either party may terminate **immediately for cause** in the event
of:
- Material breach of the CTA not cured within 14 days of written
  notice.
- IRB suspension or termination of approval.
- Insolvency of the other party.
- Material misconduct (research integrity, financial misconduct).

### Post-termination obligations that survive
- Data ownership and licensing per §4.
- Publication obligations per §5 (in particular, the negative-
  result obligation).
- Confidentiality of identifiable participant data.
- IRB and regulatory reporting obligations of either party.
- Financial settlement: COYL pays Found for participants enrolled
  to date on a pro-rated basis; site monitoring fees through the
  termination date.

### Wind-down support
The terminating party (or both, if jointly terminated) provides
**reasonable wind-down support** for the period during which
participants are still in active follow-up. This includes
continued participant-facing access to study materials, continued
safety monitoring, continued data export, and continued DSMB
support.

---

*End of partnership operating doc v1.0.*
