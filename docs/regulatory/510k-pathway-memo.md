# 510(k) Pathway Memo

**Audience:** Iman + the regulatory consultant who will run point.
**Purpose:** founder-readable explanation of why COYL pursues 510(k) over De Novo, what the timeline and cost look like, and how the predicate analysis holds up under scrutiny.
**Status:** decision document — once approved, the strategy in `regulatory-strategy.md` follows.

---

## 1. The decision in one paragraph

**COYL files 510(k), not De Novo.** Three FDA-cleared or De Novo-authorized predicate devices exist in the same regulatory neighborhood (Welldoc BlueStar GLP-1, Better Therapeutics AspyreRx, Big Health Sleepio). The primary predicate — Welldoc BlueStar GLP-1, cleared in 2023 under K223847 — matches our intended use almost exactly: adjunctive software-based behavioral support for adults using GLP-1 therapy for weight management. With a real predicate in hand, 510(k) is the cheaper, faster, lower-risk path. De Novo is the fallback if FDA disagrees on substantial equivalence (covered in Section 7).

---

## 2. 510(k) vs De Novo — the decision tree

```
Does a substantially equivalent legally-marketed predicate exist?
│
├─ YES → file 510(k)  ──────────────  this is us
│        - Application fee: $19,250 (FY2026)
│        - FDA review goal: 90 days
│        - Total cycle time (realistic): 6–9 months
│        - Standard of evidence: substantial equivalence + safety/effectiveness
│
└─ NO  → file De Novo
         - Application fee: $145,068 (FY2026, ~7.5× more)
         - FDA review goal: 150 days
         - Total cycle time (realistic): 9–15 months
         - Standard of evidence: full reasonable assurance of safety + effectiveness
         - Creates a new product code, becomes a future predicate
```

**Why this matters as a business decision:**

- 510(k) is ~$125K cheaper in FDA fees alone.
- 510(k) cycle is ~3–6 months faster in practice.
- 510(k) has a published 90-day FDA review goal; De Novo has 150.
- 510(k) clears against an existing standard; De Novo establishes one. Lower evidentiary bar.
- Investors and acquirers read 510(k) clearance as a credible, calibrated regulatory event. They read De Novo as either ambitious (good signal) or as evidence we couldn't find a predicate (less good signal). Given we have predicates, "couldn't find one" is not the story we want.

---

## 3. Timeline — month-by-month

| Month | Milestone | Notes |
|---|---|---|
| M1 | Q-Sub filed with FDA | The doc in `fda-q-submission.md` |
| M2 | FDA acknowledgment + meeting scheduled | FDA acknowledges within 14 days, schedules meeting within 75 days |
| M3 | Pre-Sub meeting held | 90 minutes, video. Outputs: written FDA feedback within 30 days, sponsor adjusts strategy |
| M3 (parallel) | Breakthrough Device Designation request filed | Separate pathway, runs in parallel — see `breakthrough-device-eligibility.md` |
| M4 | Clinical study IRB approval + enrollment starts | Coordinated with Found Health partnership (see `docs/clinical-study/found-health-partnership-operating-doc.md`) |
| M4–M7 | 510(k) submission package assembled | DHF, SRS, V&V, risk management, usability, cybersecurity, clinical evidence module |
| M7 | 510(k) filing submitted to FDA | Pays the $19,250 application fee. FDA RTA (Refuse to Accept) review begins |
| M7 + 15 days | FDA RTA decision | If accepted, substantive review begins |
| M8–M9 | FDA substantive review — first round | FDA's 90-day clock runs |
| M9–M10 | FDA Additional Information (AI) request | Near-certain. ~30–60 day response window. Pauses the FDA clock |
| M10–M12 | Sponsor responds to AI request | The hardest 60 days of the cycle. Statistical + clinical + engineering responses |
| M12–M13 | FDA re-review | Clock resumes |
| M13–M14 | Clearance letter issued | If everything lands. K-number assigned. Public listing on FDA 510(k) Database |
| M14+ | Post-clearance: device listing, establishment registration, post-market surveillance commitments | Ongoing |

**Honest caveats:**
- The 90-day FDA goal is met for ~85% of 510(k)s but the AI request cycle is what pushes real cycle time to 6–9 months. Plan for the worst case.
- The 14-month "clearance" date assumes no major FDA pushback at the Pre-Sub meeting on predicate selection or evidence threshold. If FDA pushes back on predicate, add 2–4 months for predicate re-strategy.
- Clinical study completion is the gating dependency for filing. If enrollment slips, filing slips. The dual-track design — file Q-Sub at M1 in parallel with enrollment at M4 — minimizes serial dependency, but cannot eliminate it.

---

## 4. Cost — total $370K, distributed across 14 months

| Line item | Cost | When |
|---|---|---|
| FDA 510(k) application fee | $19,250 | M7 (filing) |
| FDA Establishment Registration | $7,653/year (FY2026) | M1 (annual) |
| External regulatory consultant (RAPS-certified, full pathway) | ~$200,000 | M1–M14, retainer + project work |
| In-house QA / regulatory lead (fractional, 14 months) | ~$120,000 | M1–M14 |
| Outside regulatory counsel (FDA submissions specialty firm) | ~$40,000 | M1–M14, ad hoc |
| External biostatistician (clinical study + 510(k) statistical sections) | ~$30,000 | M4–M13 |
| Clinical study contribution to evidence package | (separately budgeted in `docs/clinical-study/`) | M4–M12 |
| Usability / human factors validation study (summative, n≥30) | ~$45,000 | M5–M7 |
| Cybersecurity third-party penetration test + documentation | ~$25,000 | M5–M7 |
| Quality system audit + IEC 62304 process documentation | ~$15,000 | M3–M6 |
| Buffer (AI response surge, FDA meeting follow-ups, late corrections) | ~$30,000 | M9–M13 |
| **Total all-in regulatory cost (excluding the clinical study cost)** | **~$370,000** | M1–M14 |

**A note on the clinical study:** the protocol in `docs/clinical-study/protocol.md` is its own budget item (~$200–500K depending on partner contribution). The $370K above is the regulatory pathway cost. The clinical study contributes evidence to the 510(k); it is not itself a 510(k) line item.

**Per the strategy v3 budget allocation ($2.5M Series A line for "Clinical (FDA filing, payer pre-engagement)"):** the $370K regulatory pathway + ~$500K clinical study + ~$1.5M payer pre-engagement reserve fits inside the $2.5M envelope with margin.

---

## 5. Predicates analysis — detailed

### Primary predicate: Welldoc BlueStar GLP-1 — 510(k) K223847

**Why this is the right primary predicate:**

- **Intended use overlap is near-total.** BlueStar GLP-1 is "an adjunctive support tool for adults using GLP-1 receptor agonists for weight management." COYL is "adjunctive behavioral support for adults during and after GLP-1 receptor agonist therapy for overweight or obesity." Same population, same drug class, same adjunctive framing.
- **Mechanism category overlap.** BlueStar is mobile software delivering behavioral content. So are we. The fact that our content delivery is real-time and inference-driven vs. their scheduled and rule-based is a technological characteristic difference, not an intended use difference. Under 21 CFR 807.100(b), technological differences are permitted as long as they don't raise new safety/effectiveness questions.
- **Risk profile match.** Both are Class II. Both are adjunctive (no medication dosing claims). Both require clinician oversight. Both have the same failure modes (a non-fired or mis-timed prompt; a privacy event; a usability error).

**Where we differ from BlueStar GLP-1 — and the substantial-equivalence argument for each difference:**

| Difference | Substantial-equivalence argument |
|---|---|
| Real-time inference vs. scheduled prompts | Both deliver the same intervention type (a brief behavioral prompt). Real-time inference improves precision of timing but does not change the intervention type, modality, or failure mode. Analog: same drug, different delivery vehicle. |
| Includes a clinician-facing dashboard | BlueStar also has clinician-facing components. Our dashboard is non-diagnostic and aggregate-only. Same regulatory posture. |
| Optional wearable input | BlueStar accepts CGM input. We accept CGM + heart rate + activity. Larger input surface, same architectural pattern. |
| Specific support for the post-discontinuation window | BlueStar's labeling does not explicitly call out post-discontinuation. Ours does. This is an indication scope question, not a substantial-equivalence question per se. We address it explicitly in Q-Sub Question 2. |

### Reference device: Better Therapeutics AspyreRx — DeNovo DEN200033

AspyreRx is not our predicate (it went De Novo because no predicate existed at its time; that path is now obviated). It serves as evidence that:

- Software-based behavioral therapy for adult metabolic conditions is an FDA-recognized regulatory category.
- Prescription digital therapeutic claims are clearable with adequate clinical evidence.
- Outcome measures combining behavioral engagement and biomarker change (in AspyreRx's case, A1C) are accepted by FDA.

We cite AspyreRx in the Q-Sub but do not claim substantial equivalence to it.

### Reference device: Big Health Sleepio — 510(k) K223218

Sleepio cleared via 510(k) — not De Novo — and establishes:

- A software-only behavioral intervention can clear 510(k) when a predicate exists.
- App-only delivery (no hardware) is acceptable to FDA.
- A non-prescription positioning is possible at clearance for adjunctive behavioral devices.

Sleepio's clearance is a procedural reference. Its intended use (CBT for insomnia) does not match ours; we are not relying on it for substantial equivalence.

---

## 6. Substantial Equivalence — five-paragraph draft

> This is the five-paragraph argument that anchors the 510(k) submission. It will be expanded to the full submission template at filing time, but the structure below is what FDA reviewers actually look for.

**Paragraph 1 — Same intended use.** The COYL device is intended as adjunctive behavioral support for adult patients during and after GLP-1 receptor agonist therapy for the management of overweight or obesity. This intended use is substantially the same as the predicate device, Welldoc BlueStar GLP-1 (K223847), which is intended as adjunctive support for adults using GLP-1 receptor agonists for weight management. Both devices serve adults on GLP-1 therapy, both are adjunctive to clinician-led pharmacotherapy, both deliver behavioral content via mobile software, and both are intended for use under clinician oversight.

**Paragraph 2 — Same general technological characteristics.** Both devices are Software-as-Medical-Device, classified as software safety class B per IEC 62304. Both deliver behavioral content as the primary intervention modality. Both run on consumer-grade smartphones (iOS and Android). Both have companion clinician-facing summary interfaces. Both ingest user-reported behavioral data (slip events, adherence) and optionally accept input from connected wearables. Both maintain a server-side model of per-user behavioral state and use that model to select and deliver interventions.

**Paragraph 3 — Technological differences that do not raise new questions of safety or effectiveness.** The principal technological difference between COYL and the predicate is COYL's use of real-time behavioral state inference to time the delivery of interventions to the inferred pre-action window, where the predicate uses scheduled and rule-based delivery. This difference affects the timing of intervention delivery but not the intervention type, the user-experienced modality, or the failure mode. A mis-timed or non-fired prompt in COYL has the same patient impact as a mis-timed or non-fired scheduled prompt in the predicate: the patient does not receive a particular behavioral content unit at a particular moment. No new failure mode is introduced. No new risk class is introduced. The patient remains under clinician oversight and continues to receive standard-of-care pharmacotherapy regardless of any device-side event.

**Paragraph 4 — Performance evidence supporting substantial equivalence.** The sponsor's clinical performance evidence package consists of: (a) a sponsor-funded, IRB-approved 1:1 randomized controlled trial (n=200) comparing COYL plus standard care to standard care alone in adults discontinuing GLP-1 therapy, with primary outcome of percent change in body weight at 90 days post-discontinuation; (b) bench performance data on the inference engine's calibration, false-alarm rate, and intervention-timing accuracy; (c) summative usability data per IEC 62366-1; (d) cybersecurity validation per FDA's September 2023 guidance; (e) a literature synthesis grounding the device's mechanism in the established JITAI behavioral-science literature (Nahum-Shani et al., 2018; Forman et al., 2019; Wood & Neal, 2007; Gollwitzer, 1999; meta-analyses of implementation intentions). This evidence package matches or exceeds the evidence supporting the primary predicate's clearance.

**Paragraph 5 — Conclusion of substantial equivalence.** Based on the same intended use, the same general technological characteristics, the technological differences that do not raise new questions of safety or effectiveness, and the performance evidence demonstrating that the device is as safe and effective as the predicate, the sponsor concludes that the COYL device is substantially equivalent to Welldoc BlueStar GLP-1 (K223847) and should be cleared for marketing under 21 USC 360(k).

---

## 7. The fallback — if 510(k) fails

If FDA disagrees on substantial equivalence at the Pre-Sub meeting or at the Refuse-to-Accept stage of the 510(k) review, the fallback is De Novo. The fallback is real but expensive:

- ~$145K additional FDA fee.
- 2–4 month additional cycle time.
- Higher evidentiary bar.
- The reframe: rather than "we're like BlueStar GLP-1," the De Novo case becomes "we are a new category of device — real-time behavioral pattern-interrupt SaMD — and here is the reasonable-assurance-of-safety-and-effectiveness case."

The De Novo path is viable. The IRB-approved RCT plus the technical documentation plus the BDD designation (if granted) would constitute an adequate De Novo evidence package. The sponsor would lose ~6 months and ~$200K in additional cost relative to a successful 510(k). That is the bounded downside.

**The asymmetric upside of trying 510(k) first:** if it works, we save the time and money. If it fails, we still have nearly everything we need for De Novo, and the FDA conversation continues without restart. The expected value of starting with 510(k) is unambiguously positive.

---

## 8. What this memo asks the founder to decide

| Decision | Recommendation | Rationale |
|---|---|---|
| 510(k) vs De Novo as primary path | **510(k)** | Predicate exists. Cheaper, faster, lower-risk. |
| File Q-Sub before clinical study completes? | **Yes — file Q-Sub at M1** | Parallel-track design. FDA feedback shapes the clinical study analysis plan and the 510(k) evidence threshold before we are committed. |
| File BDD in parallel? | **Yes — see `breakthrough-device-eligibility.md`** | ~40% chance of approval; if granted, gets Priority Review (60-day FDA turnaround vs 90). Asymmetric upside. |
| Use external regulatory consultant or build in-house? | **External consultant + in-house QA lead** | External consultant brings FDA submission experience we cannot hire fast enough; in-house QA lead owns the long-term quality system. Best-of-both. |
| Budget ceiling for the regulatory pathway? | **$370K all-in over 14 months** | Fits inside the $2.5M Series A "Clinical" line with margin. |

---

## 9. Open items for the regulatory consultant

These are the questions the founder + consultant will need to refine before filing:

1. Final product code selection (QQR vs a new one — see Q-Sub Question 3).
2. Final wording of the Indications for Use statement — particularly the "during and after" phrasing (Q-Sub Question 2).
3. Whether to include the clinician dashboard in the first 510(k) or carve it out to a Special 510(k) post-clearance.
4. Whether to include the wearable integrations in the first 510(k) labeling or post-clearance.
5. Final selection of the Predetermined Change Control Plan (PCCP) scope — bounded vs. wide-envelope, with implications for retraining frequency and FDA reporting cadence.

These five items will be the agenda of the first sit-down between the founder and the retained regulatory consultant. Everything else in this memo is settled enough to act on.
