# COYL — M&A Data Room Structure

> The structured Dropbox / Notion / DataSite folder tree an eventual
> M&A buyer's diligence team navigates. Built now at the $10M raise so
> we don't lose six weeks to frantic scrambling when the first
> acquirer email lands.

**Owner:** Iman Schrock (founder), CTO (when hired), Head of
Compliance (when hired)
**Refresh cadence:** see §3
**Access controls:** see §4
**Pre-meeting checklist:** see §6

---

## 1. Why this matters now

The single most expensive mistake post-Series-A behavioral-health
companies make is treating the data room as an exit problem. It is
not. It is a *raise* problem that compounds into an exit problem.

Three things happen when you start the data room at acquisition
rather than at Series A:

1. **Six lost weeks.** Every acquirer's first diligence request is
   the same 12-folder structure below. If you build it from a cold
   start the day after an LOI lands, you burn 30–45 calendar days
   collecting, redacting, and indexing documents — during which the
   acquirer's enthusiasm cools, internal champions get reassigned,
   and competing deals close around you. Six weeks is the median
   delta between "fresh data room" and "cold-start data room" at
   our deal size.

2. **Discount of 15–25%.** When the data room is messy at the LOI
   stage, acquirers price the diligence risk into the offer. The
   discount lands in the form of a working-capital adjustment, a
   higher escrow, or an outright trim to the headline number. The
   Pear Therapeutics retrospective showed a 22% delta between deals
   that closed with a clean data room at LOI versus deals that
   closed with a messy one.

3. **The Series A raise gets easier.** Every Series A lead at the
   $4–6B target tier wants to see "what does an eventual data room
   look like" before they wire $8M. Walking a partner through a
   pre-built 12-folder structure during diligence converts at
   roughly 2× the rate of "we'll build that for the acquisition."
   It signals operational maturity, which is the single biggest
   underwrite for solo-founder-led companies.

We are starting the data room *now*, at the $10M raise, because the
raise itself rewards the discipline and the eventual exit converts
faster off the same artifact.

---

## 2. The 12-folder structure

This is the canonical structure. Every folder name is prefixed with
a two-digit number so the file system sorts in the order the
diligence team reads.

```
01_Corporate
  - Certificate of Incorporation
  - Bylaws
  - Cap table (Carta export — refreshed monthly)
  - Stock option plan + grant agreements (board-approved)
  - Board minutes (every meeting, redacted version + full version)
  - Shareholder agreements (SAFEs, prior priced rounds, side letters)
  - 83(b) elections (founder + early employee)
  - Foreign subsidiary docs (none today; placeholder if/when applicable)

02_Financials
  - Audited financials (when applicable — Year 3+ for our stage)
  - Monthly P&L last 24 months (QuickBooks / Pilot export)
  - Trial balance (current month + prior 12)
  - Budget vs actual (operating model with variance commentary)
  - Banking + payment processor statements (Mercury + Stripe + Brex)
  - Revenue waterfall by SKU (Free / Core / GLP-1 Plus / PMPM / API)
  - Tax filings (federal + state + sales tax compliance)
  - 409A valuations (most recent + history)

03_Commercial
  - Customer contracts (B2B — clinics, employers, API partners)
  - Subscription terms (B2C — Stripe-managed, version-controlled)
  - Pricing rationale + history (every price change with the memo
    that justified it — the May 2026 single-tier collapse memo
    lives here)
  - Pipeline (CRM export — HubSpot / Attio, weighted + unweighted)
  - Revenue retention cohorts (NDR by cohort month, GRR, churn by
    SKU, net revenue per paying user)
  - Channel partner agreements (Wellhub, Virgin Pulse, Lyra)
  - Reseller / referral agreements (creator UGC partners)

04_Product
  - Architecture diagrams (Layer 1–4 substrate, the Mermaid set)
  - Code repository read access (GitHub org read-only invite for
    acquirer's technical diligence team)
  - Mobile app store metrics (App Store Connect + Google Play
    Console — installs, retention, ratings, crash rate)
  - Browser extension install metrics (Chrome Web Store + Edge
    Add-ons + Safari extension distribution)
  - Daily active users + retention curves (Mixpanel export by
    cohort, surfaced as quarterly snapshots)
  - Engagement model documentation (the timing model + the
    intervention-mode router + the redirect choice CRUD)
  - Roadmap (current + next 12 months, redacted version + full
    version for acquirer-business tier access)

05_Clinical
  - IRB protocol + approval letters (Found Health partnership +
    any subsequent IRB submissions)
  - Clinical study results + interim analyses (when applicable —
    we are pre-data at the $10M raise)
  - Adverse event log (none today; placeholder maintained from
    Day 1 per Good Clinical Practice)
  - DSMB meeting minutes (when constituted — Year 2+ likely)
  - Manuscript drafts (the JITAI productization manuscript +
    behavioral RCT writeup)
  - Investigator brochure + study materials
  - Participant-facing consent forms + recruiting materials

06_Regulatory
  - FDA Q-Submission + responses (pre-submission letters +
    teleconference summaries)
  - 510(k) submission + correspondence (when applicable — Year 2
    target)
  - Quality System documentation (Standard Operating Procedures
    for a Software-as-Medical-Device organization)
  - Software-as-Medical-Device docs (IEC 62304 — software life
    cycle processes, hazard analysis, traceability matrix)
  - Risk management (ISO 14971 — risk management file, FMEA,
    benefit-risk analysis)
  - Predicate device analysis + claims matrix
  - Post-market surveillance plan
  - Regulatory correspondence log (every letter, every email)

07_IP
  - Filed provisional + utility patents (the three provisionals
    referenced in the IP roadmap — timing model, intervention
    routing, behavioral substrate)
  - Trademark registrations (COYL wordmark + logo, "Stop the
    script before it runs your life," "Self-Trust Score")
  - Open-source licenses (the Apache 2.0 Behavioral Interrupt
    Protocol — version-controlled with the substrate spec)
  - Inventor assignments (every contributor — employees,
    contractors, founders — signs an IP assignment on Day 1)
  - Prior art search results (the patent landscape analysis from
    counsel — what's filed, what's prosecutable, what's freedom-
    to-operate clean)
  - Trade-secret register (the timing model weights, the
    intervention-mode routing logic — what is documented, what
    is access-restricted, who has access)

08_Technology
  - Security & SOC 2 reports (SOC 2 Type II target Year 2 — Type I
    earlier, gap analysis maintained from Day 1)
  - HIPAA risk assessment + remediation (annual risk assessment +
    quarterly remediation log)
  - Penetration test results (annual pen test by an independent
    firm, remediation closed within 90 days)
  - Privacy impact assessments (per-feature PIA, especially for
    the timing model + the predictive engine + the third-party
    integrations like Dexcom, Libre, Withings, Calendar)
  - Third-party integrations + DPAs (Data Processing Agreements
    with every vendor that touches user data — Anthropic, Stripe,
    Postmark, Upstash, Supabase, Vercel, Mixpanel)
  - Disaster recovery + business continuity plan
  - Incident response runbook + incident log

09_People
  - Org chart (current + planned-12-months, two versions:
    headcount-only redacted + named version for acquirer-business
    tier)
  - Founder + executive employment agreements (Iman + the 5
    critical hires per the capital-allocation memo)
  - Equity grants + vesting schedules (Carta-managed, exported
    monthly)
  - Key employee retention agreements (the retention bonus
    structure for the 5 critical hires + the senior engineer)
  - Advisor agreements (every advisor — equity grant + scope of
    work + termination terms)
  - Contractor agreements (designers, fractional CFO, fractional
    legal, fractional regulatory)
  - Performance review history (for the executive team — light
    touch but documented)

10_Legal
  - Material agreements (top 20 — every contract worth >$50K
    annual value or with regulatory exposure)
  - Litigation summary (none today, hopefully — but the empty
    file is the artifact)
  - Insurance policies (D&O, E&O, Cyber, Product Liability when
    applicable post-FDA, General Liability)
  - Regulatory correspondence (cross-link to folder 06; this is
    the legal copy of the same artifacts)
  - Tax filings (cross-link to folder 02)
  - Compliance certifications (PCI DSS via Stripe, HIPAA BAAs,
    state telemedicine compliance if applicable)
  - Privacy policy + terms of service version history

11_Press_and_Marketing
  - Press hits (NYT, Bloomberg, Wired, TechCrunch, WSJ — the
    actual articles + the editorial relationships log)
  - User testimonials + case studies (B2C + B2B — redacted +
    full versions, every one signed for use)
  - Brand assets (the design system, the brand guide, the
    voice and tone doc)
  - Marketing budget + CAC trends (monthly spend by channel +
    blended CAC by cohort, refreshed monthly)
  - Awards + recognitions (App Store Featured, Apple Design
    Award, etc.)
  - Conference appearances + speaker slots (HLTH, WWDC, Ignite,
    SXSW — date, audience size, recording link)

12_Strategic
  - $6B Acquisition Roadmap (the strategy/ folder set — 6b-action-
    plan, strategy-v3, product-roadmap-v3, cohort-refresh)
  - Acquirer landscape analysis (Microsoft primary, Meta
    secondary, Apple wildcard — the strategic-fit memos)
  - Comparable transactions (Manus $2B 16×, Pear bankruptcy,
    Noom funding history, Calibrate funding history, Hims market
    cap evolution — the comp set we benchmark against)
  - Investor updates (monthly — the standing template + every
    sent update)
  - Board decks (every meeting — the deck + the talk track + the
    follow-up resolutions)
  - Strategic conversation log (every BD conversation with a
    potential acquirer — date, attendees, framing, follow-up)
```

---

## 3. Maintenance cadence

Two tiers of cadence: **monthly refresh** for the folders where
data flows continuously, **immediate update** for the folders where
a single event changes the artifact.

### Monthly refresh (calendar reminder, first Monday of the month)

- **02_Financials** — close the books by the 5th business day of
  the month, refresh the P&L, trial balance, budget-vs-actual.
- **03_Commercial** — export the CRM pipeline, refresh the cohort
  retention table, update the channel-partner agreement status.
- **04_Product** — export DAU + retention curves, refresh the app
  store metrics, refresh the extension install metrics.
- **12_Strategic** — send the monthly investor update, log every
  strategic conversation from the prior month, refresh the
  comparable-transactions table if new comps closed.

### Immediate update (within 5 business days of the triggering event)

- **01_Corporate** — every board meeting, every cap table change,
  every option grant.
- **05_Clinical** — every IRB submission, every protocol amendment,
  every adverse event report.
- **06_Regulatory** — every FDA correspondence, every regulatory
  filing, every QMS update.
- **07_IP** — every patent filing, every trademark filing, every
  inventor assignment.
- **08_Technology** — every security incident, every SOC 2 audit
  finding, every PIA for a new feature.
- **09_People** — every hire, every termination, every grant.
- **10_Legal** — every material contract execution, every
  litigation event (we hope: none), every insurance renewal.

The discipline: a 5-day clock from event to filed artifact. Beyond
that, the data room degrades and the maintenance burden compounds.

---

## 4. Access controls — the 4-tier model

The data room is not "share with everyone or share with no one."
The four tiers below define who sees what at each stage.

### Tier 1 — Investor (pre-LOI)

**Who:** prospective Series A leads, board observers, prior-round
investors exercising information rights.

**Folders visible:**
- 01_Corporate (cap table redacted to ownership ranges, not
  individual line items below 0.5%)
- 02_Financials (monthly P&L, trial balance, budget vs actual —
  no individual customer line items)
- 03_Commercial (cohort retention, pipeline aggregate — no
  individual customer contracts)
- 04_Product (architecture diagrams, DAU curves — no code
  repository access)
- 11_Press_and_Marketing (full access)
- 12_Strategic (investor updates + board decks — not the M&A
  conversation log)

**Folders hidden:** 05, 06, 07, 08, 09, 10 unless specifically
requested for diligence, and then only the relevant subset.

### Tier 2 — Board

**Who:** board members, board observers with full information
rights, the company secretary.

**Folders visible:** all 12 folders, full access, no redaction.

### Tier 3 — Acquirer counsel (post-LOI, pre-signing)

**Who:** the acquirer's outside counsel + their inside counsel
diligence lead. NOT the business team.

**Folders visible:** all 12 folders, full access. The acquirer's
counsel signs an NDA with confidentiality + non-solicitation
provisions before access opens.

**Watermarking:** every PDF watermarked with the counsel firm name
+ date + tracking ID. Per §5.

### Tier 4 — Acquirer business (post-signing, pre-close)

**Who:** the acquirer's business team — corporate development,
integration leads, product, eng — who need transition-planning
access.

**Folders visible:** all 12 folders, with the founder + counsel
coordinating selective access by individual on the acquirer team
(not all business people see all folders). The integration lead
sees 04 + 09; the corp dev lead sees 01 + 02 + 03 + 12; the
regulatory lead sees 05 + 06; etc.

**Watermarking + NDA + non-solicit:** all in force from signing
through 24 months post-close.

---

## 5. Watermarking + NDA discipline

Every PDF that leaves the data room is watermarked. Every Excel
that leaves is password-protected + watermarked in cell A1.

**Watermark format:** `[Recipient Name] · [Recipient Firm] · [Date]
· [Tracking ID]` — diagonal across every page, 30% opacity, 14pt.

**NDAs:** mutual NDA before any folder access. The standard COYL
NDA includes:
- Mutual confidentiality (3-year tail)
- Non-solicitation of employees + advisors (12-month tail)
- No-trade clause (until the diligence concludes either way)
- Return-or-destroy obligation at conclusion
- Carve-out: anything the recipient can prove they had before
  access opens is not bound

**Tracking IDs:** every recipient gets a unique tracking ID. If a
COYL-branded document leaks publicly, the tracking ID identifies
the recipient. Both the deterrent and the accountability matter.

**Email-based access logs:** every folder access is logged through
the data room platform (DataSite, Intralinks, Notion's access log,
or Dropbox audit log depending on the tier). The logs are reviewed
weekly during an active diligence process.

---

## 6. The pre-meeting checklist

24 hours before any acquirer meeting (whether it's a casual
"we wanted to make sure you had context" call or a formal
diligence session), the founder + counsel run this checklist:

1. **Identify the meeting topic.** What folders will the
   conversation touch?
2. **Verify those folders are fresh.** Refresh-cadence dates
   under §3 — if any relevant folder is past due, refresh it
   tonight, before the meeting.
3. **Pull the redacted version + the full version of every
   document the meeting may reference.** The redacted version is
   what gets shared in the room; the full version is what the
   founder reads from to answer questions confidently.
4. **Confirm the acquirer's tier** (Tier 1 / 3 / 4) and the
   corresponding watermarking + NDA posture.
5. **Run the talking points** from the relevant memo (the
   single-tier pricing memo for commercial questions, the $6B
   Acquisition Roadmap for strategic questions, the capital-
   allocation memo for financial questions).
6. **Log the meeting prep + the meeting itself** in folder 12
   (Strategic Conversation Log) immediately after the meeting
   concludes, while context is fresh.

This is the difference between an acquirer leaving the room
thinking "they are buttoned up" versus "they are scrambling." Six
weeks of difference at the LOI stage; 15–25% of headline number at
the close.

---

## 7. Tooling — the platform layer

For the first 24 months (Series A through Series B), the data
room lives in **Notion** with structured page templates +
controlled sharing per folder. The Notion API integration logs
every access and version.

At the first formal acquirer LOI, the room migrates to **DataSite**
(or Intralinks if the acquirer prefers — they pay) for the
duration of the diligence process. The DataSite room is built from
the Notion structure; migration takes 3 business days.

The founder owns the master index. The Head of Compliance (when
hired — see capital-allocation memo §4) is the operational owner.
Counsel reviews the structure quarterly + audits access logs
monthly during any active diligence.

---

## 8. The first 90 days

Stand-up sequence at the close of the $10M raise:

- **Day 1–7:** Create the 12-folder Notion structure. Populate
  whatever exists today (cap table, board minutes, current
  employment agreements, current financials, existing IP
  filings, existing press hits).
- **Day 8–30:** Backfill — collect the artifacts that exist but
  aren't yet filed in the data room (banking statements,
  customer contracts, advisor agreements).
- **Day 31–60:** Build the missing artifacts — the FDA
  Q-Submission strategy memo, the IP landscape analysis, the
  comparable-transactions table, the strategic-conversation log
  template.
- **Day 61–90:** First quarterly refresh. By Day 90, every
  folder has at least one artifact, every cadence is calendared,
  every tier-1 investor access has been tested with a friendly
  Series A partner from the pipeline (per the investor-pipeline
  doc).

By Day 90, the data room exists as a living artifact, not a
project. From there, the maintenance cadence in §3 keeps it
fresh through the eventual M&A process.

---

*Owner: Iman Schrock + Head of Compliance (when hired). Reviewed
quarterly. The structure does not change without counsel sign-off.*
