# COYL Regulatory Strategy

**Document type:** Unified strategy memo. Ties together Q-Sub, 510(k), BDD, and post-clearance commitments.
**Audience:** Iman, the regulatory consultant, the QA lead, the board.
**Version:** v0.9 — founder + consultant review before lock.

> The thesis: COYL is not a wellness app pretending at clinical credibility. It's an FDA-cleared adjunctive behavioral support device with a defensible 510(k) clearance, a Breakthrough Device designation in hand (target), a published RCT, and post-market commitments that no Noom-tier competitor can match. This regulatory moat is what separates a $1-2B consumer-app outcome from a $4-6B strategic-acquisition outcome.

---

## 1. Strategic Objective

The regulatory program serves three concurrent objectives:

### 1.1 Build a moat that unregulated wellness apps cannot cross

COYL competes in a category that is overwhelmingly populated by FTC-regulated, non-medical-device consumer apps: Noom, Calibrate, Found (telehealth wraps), Calm, Headspace, BetterHelp, BetterUp. None of these are FDA-cleared medical devices. None can make clinical claims. None integrate into payer reimbursement schemes. None can be referenced in clinical practice guidelines.

A 510(k) clearance plus, ideally, a Breakthrough Device Designation creates a category boundary that competitors cannot follow us across without:

- 14-18 months of FDA-pathway work.
- $370K-500K in regulatory + clinical evidence costs.
- An IRB-approved RCT.
- A formal quality system.
- Acceptance of post-market surveillance commitments.

The moat is not the clearance itself. The moat is the **18-month head start and the capital + operational discipline required to follow us**. By the time a competitor clears, we have published RCT data, post-market real-world evidence, a Predetermined Change Control Plan, and a clinical-claims regulatory file that they will spend a year catching up to.

### 1.2 Support the strategic-acquisition valuation thesis

The $4-6B strategic-acquisition outcome in the v3 Roadmap depends on framing COYL as a category-defining behavioral substrate, not a consumer subscription app. FDA clearance is the single most legible signal of category seriousness to a strategic acquirer.

Specifically:

- **Microsoft** (Viva, Copilot Health) cannot legally absorb a clinical claims layer from an unregulated source. An FDA-cleared adjunctive behavioral device is the integration substrate they would license or acquire — not a wellness app.
- **Apple** (Apple Health, mindfulness in iOS) similarly will only attach clinical claims to FDA-cleared devices. Their precedent: AFib detection on the Watch is an FDA-cleared feature.
- **Meta** (Reality Labs health and wellbeing) is the wildcard, but even there, an FDA clearance shifts the conversation from "consumer wellness experiment" to "clinical integration."
- **Strategic premium math:** the difference between "category-leading consumer behavioral app" and "category-leading FDA-cleared behavioral SaMD" is, in comparables we have seen, ~2-3× revenue multiple. That delta is the entire $4B → $6B band.

### 1.3 Open the payer and clinical-channel revenue stream

Per the v3 Roadmap Layer 3 (Clinical / Payer), payer reimbursement is a multiplier on the consumer + enterprise engine, not the primary cash engine. FDA clearance is the gate to that multiplier. No 510(k) → no CPT code application → no payer-coverage policy → no reimbursement revenue.

The clinical channel is timed to contribute in Y4-Y5 ($4-20M ARR per the v3 model). That contribution requires the 510(k) clearance to land at ~M13-14 (Year 1-2 of the company's full-stage operations), creating an 18-24 month window between clearance and payer revenue ramp.

---

## 2. Three-Track Timeline

Three parallel tracks. None are blocking on each other beyond a single FDA-evidence handoff.

### Track A — Q-Sub → Pre-Sub Meeting → 510(k) → Clearance

| Month | Milestone |
|---|---|
| M1 | Q-Sub filed |
| M2 | FDA acknowledgment, Pre-Sub meeting scheduled |
| M3 | Pre-Sub meeting held; FDA written feedback within 30 days |
| M4-M7 | 510(k) package assembled (DHF, software, risk, usability, cybersecurity, clinical evidence) |
| M7 | 510(k) filed; $19,250 application fee paid |
| M7+15d | FDA Refuse-to-Accept decision |
| M8-M9 | FDA substantive review — first round |
| M9-M10 | FDA Additional Information request (near-certain) |
| M10-M12 | Sponsor response to AI request |
| M12-M13 | FDA re-review |
| M13-M14 | Clearance letter (K-number assigned) |

### Track B — Clinical Study (parallel)

| Month | Milestone |
|---|---|
| M1-M2 | Partner negotiation (Found Health, Ro Body, or equivalent — see `docs/clinical-study/found-health-partnership-operating-doc.md`) |
| M2-M3 | IRB submission |
| M3-M4 | IRB approval, enrollment opens |
| M4-M8 | 12-week active intervention complete (n=200) |
| M8-M11 | 90-day post-discontinuation follow-up |
| M11-M12 | Data analysis, primary outcome lock |
| M12-M13 | Manuscript drafted, preprint live |

Evidence handoff to 510(k) package: enrollment confirmed + interim engagement data at M5-M6, top-line outcome at M11. The 510(k) AI response (M10-M12) is the moment where clinical evidence has the largest impact on FDA disposition.

### Track C — Breakthrough Device Designation (parallel, conditional)

| Month | Milestone |
|---|---|
| M3 | Q-Sub Pre-Sub meeting includes BDD framing question |
| M3-M4 | Founder + consultant decide: file BDD or stand down |
| M4 | BDD request filed (if go) |
| M5-M7 | FDA BDD review |
| M6-M7 | BDD outcome |

If BDD granted at M7, the 510(k) submission at M7 is filed under the Priority Review track, with FDA review goal of 60 days rather than 90. Net effect: clearance pulled forward by ~30-60 days.

### Combined timeline view

```
Month:           1  2  3  4  5  6  7  8  9  10 11 12 13 14
Track A (510k):  ███████████████████████████████████████████  filed M7, clear ~M14
Track B (RCT):      █████████████████████████████████████      enrollment M4, data lock M12
Track C (BDD):         ████████████████                        filed M4, decision ~M7
```

---

## 3. Budget — $370K all-in over 14 months

Detailed breakdown in `510k-pathway-memo.md` Section 4. Summary:

| Category | Cost |
|---|---|
| FDA fees (application + establishment) | ~$27K |
| External regulatory consultant | ~$200K |
| In-house QA / regulatory lead (fractional, 14 mo) | ~$120K |
| Outside regulatory counsel (FDA submissions firm) | ~$40K |
| External biostatistician | ~$30K |
| Usability / human factors validation | ~$45K |
| Cybersecurity third-party validation | ~$25K |
| QMS + IEC 62304 process documentation | ~$15K |
| Buffer for AI response surge | ~$30K |
| **Subtotal — 510(k) pathway** | **~$370K** |
| Incremental BDD application (if filed) | ~$25-40K |
| Clinical study | (separately budgeted in `docs/clinical-study/`, ~$200-500K depending on partner contribution) |

The $370K + ~$30K BDD + ~$500K clinical study fits inside the v3 Roadmap Series A allocation of $2.5M for "Clinical (FDA filing, payer pre-engagement)" with margin for the payer pre-engagement work in Y2-Y3.

---

## 4. Team — what to hire, when

### 4.1 Roles, level, and timing

| Role | Type | Compensation | When to hire |
|---|---|---|---|
| **External regulatory consultant** | Retained firm; RAPS-certified senior consultant | $200K project fee + ~$15K monthly retainer for 14 months | M1 — before Q-Sub filing |
| **In-house QA / regulatory lead** | Fractional (0.4-0.6 FTE), trending to full-time at clearance | $120K base, equity in line with senior IC; targets ex-Welldoc, ex-Pear, ex-Big Health profile | M1-M2 — before quality system is built |
| **External biostatistician** | Project-based, attached to clinical study + 510(k) statistical sections | $30K total | M4 — at clinical study enrollment |
| **Outside regulatory counsel** | Firm with FDA submissions specialty (Hogan Lovells, Hyman Phelps, Sidley FDA team) | $40K total | M1 — engaged before Q-Sub filing for review |
| **Clinical PI** | Selected jointly with clinical partner (per `docs/clinical-study/protocol.md`) | Honorarium + study budget contribution | M2-M3 — at partner selection |
| **Human factors consultant** | Project-based, summative usability study | Included in $45K HF budget | M5 — when device build is feature-complete |
| **Cybersecurity firm** | Project-based pen test + documentation | Included in $25K cybersecurity budget | M5-M6 |

### 4.2 The single hire that matters most

The **external regulatory consultant** is the single highest-leverage hire in the regulatory program. The right consultant:

- Has personally led 2+ successful 510(k) submissions for software-based behavioral devices in the last 5 years.
- Has relationships at the FDA review division we will land in (OHT5 / Digital Health Center of Excellence).
- Can read FDA's response signals at the Pre-Sub meeting with calibrated accuracy (e.g., what FDA means when they say "we have concerns" vs. "we encourage the sponsor to consider").
- Has run at least one PCCP submission under the April 2025 guidance.

Wrong-hire failure modes (to avoid):

- A generalist medical-device consultant who has not done software/SaMD. The vocabulary and review-team dynamics are different enough that the savings are illusory.
- A former FDA employee with no recent industry experience. FDA experience is valuable but the rules and review-team norms shift; recency matters.
- A boutique with one consultant. The pathway is 14 months. Single-point-of-failure consultants get sick, switch firms, or get pulled to higher-paying clients.

Target firms (founder + board to validate): NAMSA digital health practice, Greenleaf Health, Hogan Lovells regulatory team, Aliesi Med, or a comparable senior independent with a portfolio.

---

## 5. Document Trail — the regulatory artifacts

Every FDA-cleared device leaves a documentation trail. The trail is itself a moat — competitors cannot generate it retroactively. The artifacts we will own:

### 5.1 Design History File (DHF)

Per 21 CFR 820.30. Captures the full design history of the device:
- Design and Development Plan
- Design Inputs (user needs, intended use, regulatory inputs)
- Design Outputs (specifications)
- Design Reviews (formal records of design review meetings)
- Design Verification (does the device meet its specifications?)
- Design Validation (does the device meet user needs in actual use?)
- Design Transfer (move design to production)
- Design Changes (controlled change records)

Owner: in-house QA/regulatory lead. Built incrementally from M1.

### 5.2 Software documentation per IEC 62304

Software Lifecycle Processes, classified as Class B (non-life-supporting):
- Software Development Plan
- Software Requirements Specification (SRS)
- Software Architecture Document
- Software Detailed Design
- Software Unit Implementation and Verification
- Software Integration and Integration Testing
- Software System Testing
- Software Release
- Problem Resolution Process
- Software Configuration Management
- Software Maintenance

Owner: engineering, with QA review. Built incrementally; complete at filing.

### 5.3 Risk Management File per ISO 14971

- Risk Management Plan
- Risk Analysis (hazard identification, sequence of events, hazardous situations, harm)
- Risk Evaluation (probability × severity)
- Risk Control (measures, residual risk acceptability)
- Production and Post-Production Information

Owner: in-house QA/regulatory lead, with engineering and clinical input. Living document.

### 5.4 Usability Engineering File per IEC 62366-1 + FDA HF guidance

- Use specification (intended users, environments, use scenarios)
- User interface specification
- Hazard-related use scenarios
- Formative usability evaluations (early-stage)
- Summative usability evaluation (validation, n≥15 per user group)
- Usability Engineering Report

Owner: human factors consultant + product team.

### 5.5 Cybersecurity documentation per FDA September 2023 guidance

- Cybersecurity Plan
- Threat Model
- Cybersecurity Risk Management
- Architecture Views (logical and physical security architecture)
- Bill of Materials (Software BOM)
- Vulnerability and Patch Management Process
- Penetration Testing Report
- Post-Market Cybersecurity Plan

Owner: engineering + cybersecurity firm.

### 5.6 Clinical Evaluation Report

- Sponsor's RCT protocol + final report
- Literature synthesis
- Real-world evidence plan
- Post-market surveillance plan

Owner: clinical PI + biostatistician + regulatory consultant.

### 5.7 Predetermined Change Control Plan (PCCP)

Per FDA's April 2025 guidance. Documents what model changes the sponsor commits to making post-clearance, within bounded performance envelopes, without requiring a new 510(k):
- Description of modifications
- Modification protocol (how the modification will be implemented, validated, deployed)
- Impact assessment

Owner: data science + regulatory consultant + outside counsel.

---

## 6. Post-Clearance Commitments

Clearance is not the finish line. The post-clearance regime adds operational discipline that lasts as long as the device is marketed.

### 6.1 Post-market surveillance

Per the device's special controls and FDA's general post-market expectations:
- Complaint handling system (21 CFR 820.198)
- Quarterly internal trend review
- Annual real-world performance report to FDA (if required by special controls)
- Engagement-pattern surveillance: monitor for systematic shifts in intervention frequency, false-alarm rate, false-miss rate that could indicate model drift

### 6.2 Adverse event reporting — MedWatch

Per 21 CFR Part 803 (Medical Device Reporting):
- Death or serious injury caused or contributed to by the device: report within 30 days
- Malfunctions: report within 30 days
- Five-day reports for events requiring remedial action

For a behavioral SaMD, anticipated adverse events are predominantly:
- Privacy or data-security breach (subject to HIPAA and FDA reporting where it relates to device function)
- Software malfunction causing failed delivery of intervention
- User-reported psychological harm (rare but possible — e.g., a prompt mis-fired in a context that exacerbates distress)

The threshold for MedWatch reporting is calibrated by FDA's MDR guidance; the in-house QA lead owns the triage process.

### 6.3 Quality System Regulation (21 CFR Part 820)

The full QMS applies from clearance forward, not just at submission:
- Management responsibility
- Quality system procedures
- Design controls
- Document controls
- Purchasing controls
- Identification and traceability
- Production and process controls
- Inspection, measuring, and test equipment
- Process validation
- Corrective and Preventive Action (CAPA)
- Records management
- Servicing
- Statistical techniques

Annual internal audit. FDA inspection at FDA's discretion (typically every 2-3 years for Class II devices).

### 6.4 Reclearance cycle

510(k) clearance is permanent (no expiration), but:
- **Material modifications** to intended use, technology, or labeling outside the PCCP envelope require a new 510(k) (Special 510(k) for incremental changes, Traditional 510(k) for major).
- **Indication expansions** (e.g., to pediatric, to non-GLP-1-related obesity, to non-obesity behaviors) require new submissions.
- **5-year informal reassessment** — the sponsor (not FDA) commits internally to reassess the clearance posture every 5 years to ensure the device-as-marketed remains aligned with the cleared submission.

### 6.5 Transparency commitments

Per the Roadmap's brand DNA, the sponsor commits to:
- Annual public publication of post-market real-world performance metrics (aggregate, de-identified).
- Public post-clearance Bibliography update.
- Plain-language summary of any FDA-required labeling updates.

These commitments are voluntary and brand-aligned, not FDA-mandated. They are part of the moat: they raise the bar competitors will have to clear to be taken seriously.

---

## 7. Backup Plan — if 510(k) is rejected

The 510(k) can fail at three points: (a) Refuse-to-Accept (procedural), (b) Substantial Equivalence rejection (substantive — FDA disagrees on predicate or technological differences), (c) NSE letter (Not Substantially Equivalent — the formal SE-rejection at the end of review).

### 7.1 RTA failure (M7+15d)

Procedural. Sponsor corrects the deficiency, re-files. Typically a 30-60 day delay. Cost: ~$5-10K consultant time. Low probability with a competent consultant (~10%).

### 7.2 Substantial Equivalence rejection during review (M9-M12)

This is the high-impact failure mode. FDA's AI request signals SE concerns; if sponsor cannot respond satisfactorily, FDA issues an NSE letter. Probability estimate: ~15-25%.

The fallback is **De Novo classification**. The De Novo path:
- Re-filing as a De Novo request, leveraging the existing 510(k) package as the starting point.
- Additional FDA fee: ~$125K incremental (De Novo fee $145K vs. 510(k) fee $19K).
- Additional cycle time: 2-4 months.
- Higher evidentiary bar — the De Novo standard is "reasonable assurance of safety and effectiveness," not substantial equivalence.
- The clinical RCT package + the BDD designation (if granted) materially strengthens the De Novo case.

Expected total additional cost in the De Novo fallback scenario: ~$200K and ~6 months. The bounded downside.

### 7.3 NSE without De Novo eligibility

In the worst case — FDA rejects substantial equivalence AND views the device as not appropriate for De Novo — the path becomes either:
- PMA (Premarket Approval). Very low probability for this device class.
- 513(g) classification request to formally establish classification. Then re-strategy from there.
- Withdraw from the regulated-device pathway. Re-position as a non-medical-device wellness app. This is the catastrophic outcome; it strips the moat and forecloses the payer channel. We do not plan for this; we plan to avoid it.

Probability of the catastrophic outcome: <5%. The Pre-Sub meeting at M3 is the early-warning system that prevents this — if FDA signals serious concerns at M3, the sponsor adjusts strategy before filing, not after.

---

## 8. Decision Points — where we pause and reassess

Five decision gates over the 14-month timeline. Each is a written go/no-go.

### Gate 1 — Post-Pre-Sub Meeting (M3)

**Question:** does FDA's written feedback support continuing on the 510(k) path with the proposed predicate?

- **Yes** → proceed to 510(k) package assembly; decide BDD go/no-go.
- **No, but with adjustments** → revise predicate or indication, schedule second Pre-Sub if needed.
- **No, fundamental disagreement** → re-strategy; consider De Novo as primary path.

### Gate 2 — Clinical Study Enrollment Completion (M8)

**Question:** has enrollment closed on schedule with adequate baseline data quality?

- **Yes** → continue to 510(k) filing at M7 with provisional clinical evidence; final data at M11 supplements the AI response.
- **No, but recoverable** → consider holding 510(k) filing to M9 to incorporate enrollment data.
- **No, irrecoverable** → re-strategy clinical evidence package; consider literature-based + real-world evidence as substitute.

### Gate 3 — BDD Outcome (M7)

**Question:** was BDD granted?

- **Granted** → file 510(k) at M7 under Priority Review; market the BDD designation.
- **Not granted (silent)** → file 510(k) under standard review at M7; no marketing of the application.

### Gate 4 — FDA AI Request (M9-M10)

**Question:** can the sponsor respond satisfactorily within the response window?

- **Yes** → respond, expect clearance at M13-M14.
- **Partial** → request extension, consider whether response gaps are SE-determinative.
- **No** → consider amendment vs. withdrawal-and-refile vs. pivot to De Novo.

### Gate 5 — Clearance vs. NSE (M13-M14)

**Question:** clearance issued?

- **Cleared** → execute the post-clearance plan; communicate to investors, payers, M&A targets.
- **NSE** → pivot to De Novo, leveraging the existing package.

---

## 9. Risks — the failure-mode catalog

### 9.1 Technical risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| The behavioral inference model does not deliver measurable outcome advantage over the predicate in the RCT | Moderate (25-35%) | High — undermines significant-advantage claim for BDD and weakens the 510(k) clinical evidence | Pre-specify a defensible primary outcome that is sensitive to the device's actual mechanism (time-to-recovery, danger-window fire-rate accuracy) and rely on secondary outcomes if primary misses |
| The model exhibits performance drift between FDA submission and post-market deployment | Moderate-high (40%) | Medium — manageable under PCCP | Submit PCCP at filing covering retraining; commit to performance-bound monitoring |
| Cybersecurity vulnerability identified post-clearance | Moderate (30%) | Medium-high — requires field-corrective action | Pen test pre-submission; ongoing patch management; coordinated vulnerability disclosure plan |
| Wearable integration partner (e.g., Apple Health, Dexcom) restricts API access | Low (15%) | Low — wearable input is optional per labeling | Keep wearable input optional; do not rely on any single integration for safe operation |

### 9.2 Regulatory and political risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| FDA's posture on AI/ML SaMDs shifts adversely during review | Moderate (20-25%) | Medium-high — could trigger PCCP rejection or evidence-bar increase | Track FDA digital health communications closely; maintain conservative PCCP scope to absorb policy shifts |
| FDA reviewer turnover during the cycle | High (50%+) | Low-medium — typical, resets some prior conversations | Maintain comprehensive meeting minutes; ensure consultant has division relationships beyond a single reviewer |
| Change in administration / FDA leadership disrupts the digital health center | Low-moderate (15-20% over 14 months) | Medium — could slow review | Front-load Pre-Sub feedback; do not rely on informal channels |
| Obesity classification framing rejected for BDD | Moderate (40%) | Low — BDD is upside, not critical path | Stand down on BDD if Pre-Sub signal is negative; do not let BDD timeline distort 510(k) sequence |

### 9.3 Commercial risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Clearance timeline misaligns with strategic-acquirer timing | Moderate (30%) | High — could compress the negotiating window in the $6B Roadmap | Begin informal BD conversations at M6-M9 (before clearance) so acquirers price in pending clearance |
| Competitor clears first | Low (10%) | High — moats are about ordering | Q-Sub filing at M1 is the gating speed move; do not delay |
| A predicate device is withdrawn during our review | Very low (5%) | Catastrophic if it happens | Cite multiple predicates / references; primary predicate has been on the market 2+ years |
| Clinical study fails to enroll | Low-moderate (15%) | High — gating dependency | Multi-partner strategy (Found Health + Ro Body + others); plan for n=150 fallback with statistical power recalculation |

### 9.4 Capital and operational risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Seed/Series A close slips, regulatory work stalls for cash | Moderate (20%) | High — restart costs are non-trivial | Phase the regulatory spend so M1-M3 (Q-Sub) is funded from pre-seed; the M4-M14 spend tied to Series A close |
| Regulatory consultant departs mid-cycle | Low-moderate (15-20%) | Medium — handoff costs ~$15-25K + 30 days | Hire from a firm with bench depth; document everything; founder maintains visibility into consultant's working file |
| QA lead burns out (single-point-of-failure on the in-house side) | Moderate (25%) | Medium-high — gap creates compliance risk | Document QMS processes thoroughly; build redundancy with the external consultant; hire a junior QA at M8 if scope grows |

---

## 10. Summary — what this strategy commits the company to

| Commitment | Value |
|---|---|
| File a Q-Submission at M1 | $0 fees; ~$25K consultant time |
| Hold a Pre-Sub meeting at M3 | Free; reusable strategy input |
| File 510(k) at M7 | $19,250 FDA fee + 510(k) package assembly cost |
| File BDD at M4 (if Pre-Sub signal is positive) | ~$25-40K consultant time |
| Run a 200-participant RCT, M3-M12 | $200-500K depending on partner share |
| Stand up a Quality Management System | ~$15K + ongoing operational overhead |
| Commit to MedWatch reporting and post-market surveillance | Ongoing operational overhead |
| Establish Predetermined Change Control Plan | One-time PCCP submission; ongoing monitoring |
| Total regulatory investment over 14 months | ~$370K (510(k) path) + ~$30K (BDD) + ~$500K (clinical study) = ~$900K all-in |
| Expected outcome | FDA-cleared adjunctive behavioral SaMD; potential BDD designation; published RCT; categorical moat against unregulated competitors; reimbursement-channel optionality opens in Y2-Y3 |

The $900K all-in regulatory + clinical investment over 14 months is the **single highest-leverage capital deployment in the company's first 24 months**. It produces the moat that distinguishes COYL from every wellness-app competitor and is the prerequisite for the $4-6B strategic-acquisition outcome in the v3 Roadmap.

The alternative — staying in the unregulated consumer-app category — caps the company's outcome at the $1-2B band the v3 Roadmap explicitly identifies as the floor scenario. The regulatory program is not optional. It is the difference between the floor and the ceiling.

---

**End of regulatory strategy document. v0.9 — founder + consultant review before lock.**
