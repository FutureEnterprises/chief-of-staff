# Microsoft Viva — Engineering Integration Spec

> The technical integration spec for Microsoft Viva engineering. This
> is the document the Viva product + engineering team reads after the
> BD conversation (`../outreach/bd-script-microsoft-viva.md`).
>
> Audience: Microsoft Viva Insights product leadership, Viva
> Engineering leadership, Microsoft 365 partner engineering, and
> Microsoft enterprise security review. Internal Microsoft
> distribution acceptable; do not publish externally without
> COYL approval.
>
> Per the $6B Acquisition Roadmap (May 2026 revision): Microsoft Viva
> is the parallel tech-platform path alongside the primary pharma
> track (`../outreach/bd-pharma-strategy.md`). This spec exists so
> that when Microsoft is ready to move from BD conversation to pilot,
> the technical conversation can move fast.

---

## Section 1 — Overview: COYL as the behavioral-interrupt layer inside Microsoft Viva

### The Viva gap, named structurally

Microsoft Viva, since its 2021 launch, has built four pillars:
- **Viva Insights** — analytics + reporting on focus time, meeting
  load, work patterns
- **Viva Goals** — OKR tracking and progress reporting
- **Viva Topics** — knowledge organization
- **Viva Learning** — training + L&D content delivery

What none of the four pillars do is fire at the moment behavior
breaks. Viva Insights tells the user on Friday: "you had 12 hours of
fragmented meeting time this week." It does not tell the user on
Tuesday at 2:08 PM: "you're 3 minutes into a deep work block and
about to accept a meeting invite that destroys it. Decline it now or
acknowledge you're cancelling the block." That intervention — the
3-second-window interrupt at the moment of behavior — is the COYL
window.

### The COYL value proposition for Viva

COYL is the runtime behavioral-interrupt layer that integrates into
all four Viva pillars without replacing any of them:

- **Viva Insights** gets a new behavioral KPI (Self-Trust Score)
  exported into the existing analytics surface
- **Viva Goals** gets a new outcome class (Commitment Keep Rate)
  measured against user-defined commitments
- **Teams** gets a new bot delivery surface for the interrupt itself
- **Outlook** gets a new calendar signal (meeting density →
  interrupt trigger)

The integration is additive. Microsoft keeps its surfaces, COYL
provides the behavioral runtime. The protocol-first architecture
(BIP v0.1, Apache 2.0) means the integration is documented and
extensible, not vendor-specific.

### Why Microsoft engineering should care

Three concrete claims engineering should verify:

1. **The 18-month build differential.** Microsoft has tried to build
   the behavioral-interrupt layer internally since the 2021 Viva
   launch. The internal effort has produced reporting + suggestions
   surfaces, not runtime interrupts. The gap is not engineering
   capacity — it's the behavioral model itself, which requires
   6+ months of per-user slip-event data across millions of users.
   COYL has 50K consumer users + 18 months of slip-event data.

2. **The protocol shape.** COYL's Behavioral Interrupt Protocol is
   designed as a horizontal protocol with multiple signal sources
   and multiple delivery surfaces. Microsoft Graph as signal source,
   Teams as delivery surface, Viva as analytics integration — the
   architecture maps natively. Internal Microsoft builds would
   produce a vertical integrated app inside Viva; the horizontal
   protocol shape is the differentiator.

3. **The zero-PII commitment.** COYL never reads message contents.
   Signals come from Microsoft Graph metadata (meeting density,
   calendar density, commitment timestamps) routed through
   Microsoft's tenancy. Message bodies, document contents, and
   personal data stay inside the Microsoft 365 tenant. The
   architecture is documented in Section 5 (Security).

---

## Section 2 — Integration surfaces

Four primary integration surfaces. Each is independently shippable;
the full integration stacks them.

### Surface 1 — Viva Insights (analytics integration)

**What:** COYL exports the Self-Trust Score and slip-window metrics
into Viva Insights as a custom KPI category. The KPI appears
alongside the existing Focus Time, Collaboration, and Wellbeing
categories in the Viva Insights dashboard.

**How:** Viva Insights supports custom KPI extensions through the
Microsoft Graph + the Workplace Analytics API surface (now folded
into Viva Insights). COYL writes the aggregate score data into the
tenant's Viva Insights data store via the Insights Data Connector
pattern.

**The data shape:**
- `self_trust_score` — integer 0-100, updated daily
- `commitment_keep_rate` — percentage 0-100, rolling 30-day
- `slip_window_count_weekly` — integer, number of interrupted slips
  in the trailing 7 days
- `interrupt_pull_through_rate` — percentage, of interrupts fired,
  what % were resolved as "pulled through"

**The user surface:** A user opening Viva Insights sees a new card
("Behavioral Self-Trust") with the four metrics above + a sparkline
trend. Clicking through deep-links to the COYL dashboard for the
user's full behavior graph.

**The leader surface:** Aggregate (de-identified, k-anonymous with
minimum cohort size 25) versions of these metrics appear in the
Viva Insights leadership view. Leaders see "engineering team
average Self-Trust Score = 68" without seeing any individual user's
score. Privacy posture is at parity with existing Viva Insights
leader views.

### Surface 2 — Viva Goals (OKR integration)

**What:** COYL's commitment system maps to Viva Goals so leaders see
commitment-keep rates as a productivity metric attached to OKR
progress. When a user commits to a behavioral outcome (e.g., "I'll
maintain 90 minutes of deep work blocks 4 days per week"), that
commitment lives in COYL and the keep-rate streams into Viva Goals
as a checkin.

**How:** Viva Goals supports OKR checkin via Graph API. COYL POSTs
checkin data to the user's Viva Goals OKR objects on a daily
schedule.

**The data shape:**
- `commitment_id` — unique identifier of the COYL commitment
- `viva_goal_id` — corresponding Viva Goals OKR identifier
  (user-mapped during setup)
- `keep_rate_to_date` — current keep rate
- `checkin_timestamp` — when the checkin was logged
- `checkin_status` — on_track | at_risk | off_track

**The user surface:** User's Viva Goals page shows commitment
progress alongside traditional OKR progress. The COYL commitments
get tagged as "behavioral" so they're distinguishable from
traditional output OKRs.

**The leader surface:** Leaders see the aggregate commitment keep
rate across their team as part of the OKR dashboard. The metric is
labeled clearly as a behavioral metric so it's not confused with
output measures.

### Surface 3 — Teams Bot (interrupt delivery)

**What:** The actual behavioral interrupt fires inside Microsoft
Teams as a Teams Bot notification. This is the lock-screen-
equivalent intervention — the moment-of-behavior surface where
COYL's value is most direct.

**How:** Standard Teams Bot Framework. COYL Bot is provisioned per
tenant during enterprise onboarding. When the runtime decides to
fire an interrupt, the bot delivers a Teams notification (toast +
chat message in the bot's 1:1 channel with the user).

**The interrupt payload:**
- Title (e.g., "Deep work block — about to lapse")
- Body text (the specific behavioral interrupt script, tuned to the
  user's archetype)
- Three response buttons: "Pulled through" | "Negotiating" | "Slipped"
- Optional voice-prompt delivery on supported clients (Teams desktop)

**The Teams Channel notification (alternative):** For users who opt
in to public commitment, the interrupt can also fire as a Teams
Channel notification in a designated "commitments" channel. The
public commitment mechanic is opt-in only and follows the existing
Viva Goals public-OKR pattern.

**Latency target:** Interrupt decision-to-delivery latency is under
3 seconds. The 3-second window is the entire product — if the
interrupt arrives at second 5 or 10, the behavior has already
committed. Teams Bot Framework latency is typically 200-600ms;
COYL's runtime decision is 100-300ms. Total < 1 second under
normal load. We instrument this and SLA against it (see Section 7).

### Surface 4 — Outlook calendar (signal source)

**What:** COYL reads meeting density and calendar pattern data from
Microsoft Graph as one of several behavioral signal sources. This
is read-only signal ingestion — COYL does not modify the user's
calendar.

**How:** Microsoft Graph `/me/calendar/events` endpoint with the
Calendars.Read permission. COYL polls the signal on a 5-minute
cadence during the user's working hours and ingests the calendar
state into the behavioral model.

**The signals extracted:**
- Meeting density (back-to-back meeting count per day)
- Deep work block presence (calendar events tagged with the
  user's deep-work convention — "Focus", "DW Block", etc.)
- Double-book frequency (meetings overlapping the same time slot)
- Late-meeting-add frequency (meetings added within 2 hours of
  starting)

**The model output:** These signals feed the COYL behavioral model
alongside other signal sources (browser activity, mobile-app
interaction, biometric where consented). The combined model is what
decides when to fire an interrupt.

**Privacy boundary:** COYL reads calendar metadata, not meeting
contents. The Graph permission scope is Calendars.Read (not
.ReadWrite). We never write calendar events. We never read meeting
notes, attached documents, or meeting transcripts.

### Surface 5 — Microsoft Defender for Cloud (security posture)

**What:** COYL's security + compliance posture documented for
enterprise admins through Microsoft Defender for Cloud Apps. This is
the surface enterprise IT teams use to approve third-party app
access; COYL appears here with full posture documentation.

**How:** Microsoft Defender for Cloud Apps catalogs third-party apps
with risk scoring. COYL submits to the catalog with full
documentation:
- HIPAA Business Associate Agreement (BAA) availability — yes
- SOC 2 Type II audit status — in progress (target Q4 2026)
- GDPR compliance posture — documented (data processing addendum
  available)
- Data residency options — US, EU (additional regions on request)
- Tenant isolation architecture — documented in Section 5

The Defender catalog entry gives enterprise admins a "trusted" risk
score, which is the precondition for tenant-wide deployment in
regulated industries (healthcare, financial services, government).

---

## Section 3 — Data flow

The data flow architecture is intentionally read-only-from-tenant
plus write-back-via-approved-endpoints. The principle: COYL never
touches the customer's Microsoft 365 data plane in a way that
modifies tenant state without explicit user action.

### The flow diagram (text)

```
[Microsoft 365 Tenant]
    |
    | (1) Read-only Graph API calls
    |     Calendars.Read, Presence.Read.All, User.Read
    |
    v
[Microsoft Graph]
    |
    | (2) Signal ingestion
    |     5-min polling cadence, working hours only
    |
    v
[COYL Backend (Azure-hosted; tenant-isolated)]
    |
    | (3) Behavioral model runtime
    |     Decision: fire interrupt | observe | update model
    |
    v
[COYL Runtime Decision Engine]
    |
    | (4) Write-back via approved endpoints
    |     Teams Bot, Viva Insights API, Viva Goals checkin
    |
    v
[Microsoft 365 Tenant — surface delivery]
```

### Detailed data flow stages

**Stage 1 — Authentication + provisioning:**
- Tenant admin installs COYL from Microsoft AppSource (the
  enterprise marketplace)
- Azure AD SSO + SCIM provisioning establishes the user identity
  mapping
- Tenant admin grants the Graph API permissions (see Section 4)
- Per-tenant data store provisioned in Azure (tenant isolation;
  see Section 5)

**Stage 2 — Signal ingestion:**
- COYL polls Microsoft Graph on a 5-minute cadence during the
  user's working hours
- Signals ingested: calendar metadata, presence, opt-in
  device signals
- Signals stored in the per-tenant data store, encrypted at rest

**Stage 3 — Behavioral model runtime:**
- The behavioral model processes ingested signals + the user's
  behavior graph (slip history, archetype, danger windows)
- The model produces decisions: fire | observe | update
- Decisions are logged with full audit trail per tenant

**Stage 4 — Write-back:**
- Interrupts deliver via Teams Bot Framework (Microsoft-approved
  delivery channel)
- KPI updates write to Viva Insights via the Insights Data
  Connector pattern
- Commitment checkins write to Viva Goals via Graph API

**Stage 5 — User response capture:**
- User responds to interrupt (pulled_through | slipped |
  negotiating)
- Response flows back into the behavioral model via webhook
- Model updates; behavior graph updates; Self-Trust Score
  recalculates

The entire loop completes in under 60 seconds typically. The
3-second window is decision-to-delivery; the rest of the loop is
async telemetry.

---

## Section 4 — Authentication

### Azure AD SSO

COYL uses Azure AD as the primary identity provider for all
enterprise users. The flow:

1. Tenant admin installs COYL from AppSource
2. Tenant admin consents to the requested Graph permissions (see
   below)
3. Users sign into COYL via Azure AD SSO — no separate password
4. SCIM provisioning establishes user records in COYL's
   per-tenant data store

### SCIM provisioning

COYL implements SCIM 2.0 endpoints for Azure AD provisioning:
- User create / update / deprovision
- Group sync (for cohort-level analytics in the Viva Insights
  leader view)
- Department mapping (for org-chart-aware aggregate metrics)

When a user is deprovisioned from Azure AD, the user's COYL data
is soft-deleted within 24 hours and hard-deleted within 30 days
(GDPR-compliant retention boundary).

### Microsoft Graph permission scopes

COYL requests the following Graph permissions at install time:
- `Calendars.Read` — read calendar metadata for signal ingestion
- `Presence.Read.All` — read user presence (in-call, available,
  do-not-disturb)
- `User.Read` — read basic user profile (name, email)
- `Group.Read.All` — read group membership for cohort sync

COYL does NOT request:
- `Mail.Read` (we never read email)
- `Files.Read` (we never read documents)
- `Calendars.ReadWrite` (we never modify the calendar)
- `Chat.Read` (we never read chat contents)

The permission scope is the smallest possible set that produces the
required signals. This is a deliberate architectural choice to keep
the security posture at "minimal access."

### Per-tenant data isolation

Every customer tenant gets:
- A dedicated logical data store inside Azure (separated by tenant
  ID)
- A dedicated encryption key (BYOK supported for regulated
  industries)
- A dedicated audit log
- Optional dedicated infrastructure (for very large customers, the
  Premium tier deploys per-customer Azure resources rather than
  shared multi-tenant)

Cross-tenant access is prevented at the data layer. Even COYL
engineers cannot read another tenant's data without an explicit
audit-logged break-glass procedure.

---

## Section 5 — Security: zero-PII data egress

The security claim that matters most to Microsoft enterprise admins:
COYL never reads message contents, document contents, or other
PII-bearing data. The data egress from the Microsoft 365 tenant
is metadata only.

### What we read (metadata)

- Calendar event titles, start/end times, attendee counts (NOT
  meeting body, attached files, transcripts)
- Presence status (in-call, available, do-not-disturb — NOT call
  contents)
- User profile basics (name, email, department)
- Group membership for cohort analytics

### What we explicitly do not read

- Message contents (Teams chat, Outlook mail)
- Document contents (SharePoint, OneDrive)
- Meeting transcripts (Teams meeting recordings)
- File attachments
- Personal identifying information beyond name + email

### Data routing through Microsoft tenancy

All Graph API calls proxy through Microsoft's tenancy. The data
never leaves the Microsoft 365 boundary unencrypted. COYL's backend
receives signals only via Microsoft-approved API endpoints with
the explicit permission scopes documented above.

### Encryption

- In transit: TLS 1.3 mandatory for all Graph API and write-back
  calls
- At rest: AES-256 with per-tenant encryption keys
- Key management: Azure Key Vault with optional customer-managed
  keys (CMK) for regulated industries

### Audit logs

Per-tenant audit logs capture:
- All Graph API calls made by COYL (which user, which permission,
  which timestamp)
- All interrupt firings (which user, which trigger, which payload)
- All admin actions (permission changes, user provisioning,
  data exports)

Audit logs retained for 7 years. Customer admins have read access
to their tenant's audit log via the COYL admin console + via
Microsoft Defender for Cloud Apps integration.

### Compliance posture

- HIPAA: Business Associate Agreement available for healthcare
  customers. Hosted on HIPAA-compliant Azure infrastructure.
- SOC 2 Type II: Audit in progress, target completion Q4 2026.
- GDPR: Data Processing Addendum available; EU data residency
  available; data subject rights (access, deletion, portability)
  supported.
- ISO 27001: On the roadmap for 2027.
- FedRAMP: On the roadmap for 2028 (when Microsoft federal
  customers become a meaningful segment).

---

## Section 6 — The pilot architecture

A 1000-employee pilot at a known Viva enterprise customer is the
proposed first deployment. The pilot architecture:

### Target pilot customer profile

- 1000-5000 employees
- Existing Viva Insights deployment (so the integration leverages
  existing surface area)
- Knowledge-worker majority (so the behavioral-interrupt use cases
  are well-aligned)
- Regulated or compliance-sensitive industry preferred (so the
  security posture stack is tested)

Candidate pilot customers (Microsoft would propose; these are
illustrative based on public Viva customer lists):
- Accenture (large Viva deployment, knowledge-worker majority)
- Bain & Company (compliance-sensitive, Viva customer)
- Deloitte (large Viva deployment, behavior-change use cases)
- Standard Bank (regulated industry, Viva customer)
- Telstra (large Viva deployment, behavioral analytics interest)

### Pilot scope (90 days)

- 1000-employee pilot population (single department or business unit
  recommended for cleaner measurement)
- 30 days onboarding (provisioning, user training, baseline
  measurement)
- 60 days active intervention (interrupts firing, behavioral graph
  building)
- Concurrent measurement on a matched control group (not getting
  COYL interrupts; matched for department, role, baseline behavior
  metrics)

### Pilot success metrics

The pilot measures behavioral outcomes, not vanity metrics. Three
primary metrics:

1. **Commitment keep rate.** Pilot users who set behavioral
   commitments — what % of commitments do they keep at 90 days vs
   the control group?

2. **Deep work block completion rate.** Of calendar-blocked deep
   work time, what % is preserved (not cancelled, not interrupted
   by accepting meeting invites)?

3. **Self-Trust Score change.** Aggregate Self-Trust Score
   improvement from baseline to 90 days, pilot vs control.

Target outcomes (which we'd commit to via SLA — see Section 7):
- Commitment keep rate improvement: 20-40% over control
- Deep work block completion improvement: 15-30% over control
- Self-Trust Score improvement: meaningful (effect size > 0.3)

If the pilot misses these targets, the partnership doesn't expand
to additional customers. This is honest commitment to outcomes, not
vanity engagement metrics.

### Pilot governance

- Joint pilot steering committee: 2 from Microsoft Viva, 2 from
  COYL, 2 from the pilot customer
- Weekly status meetings during the pilot
- Mid-pilot review at day 45 (go/no-go decision on continuing)
- End-of-pilot review at day 90 (continue, expand, or wind down)

---

## Section 7 — SLA + commercial model

### Pricing

The commercial model is PMPM (per-member-per-month) priced at
enterprise-Viva scale:

- **Per-member-per-month price band: $5-15 PMPM**
- $5 PMPM: pilot pricing (90-day pilot, single-department deployment)
- $8-10 PMPM: standard enterprise pricing (tenant-wide deployment,
  1000-10,000 employees)
- $12-15 PMPM: premium pricing (full integration suite, dedicated
  infrastructure, premium SLA)

The pricing is calibrated to land below the Viva Insights + Goals
combined PMPM ($10-15 typically), so COYL is positioned as an
incremental + complementary spend, not a replacement.

### Microsoft co-marketing rights

Part of the commercial agreement: Microsoft Viva gets co-marketing
rights for the integration. Specifically:
- Joint case studies after the pilot lands (Microsoft + COYL +
  the pilot customer co-authored)
- Microsoft Ignite + Microsoft Build joint speaking slots
- AppSource featured listing for the COYL Viva integration
- Joint webinars + product launches

The co-marketing rights are not exclusive — COYL retains the right
to market the broader BIP protocol + non-Viva integrations
separately.

### SLA commitments

Three SLA dimensions COYL commits to:

1. **Uptime: 99.9% on the COYL backend, measured monthly.** Service
   credit issued for any month below 99.9% (10% of monthly fee per
   percentage point below).

2. **Interrupt delivery latency: P95 under 3 seconds, P99 under
   5 seconds, measured from decision to Teams Bot delivery.**
   Service credit for sustained breaches.

3. **Support response time:**
   - Severity 1 (production down): 1-hour response, 4-hour
     resolution
   - Severity 2 (functionality degraded): 4-hour response, 24-hour
     resolution
   - Severity 3 (minor issue): 1-business-day response

The SLA tier is included in standard pricing; premium SLA (faster
response times, dedicated CSM) is included in the premium pricing
band.

### Billing

Monthly billing per active user. "Active user" defined as a user
who has had at least one Graph signal ingested OR one interrupt
fired in the billing month. Inactive users (provisioned but
unused) do not bill.

---

## Section 8 — Open technical questions

Four open questions Microsoft engineering needs to answer before
the pilot can ship:

### Q1 — Custom KPI category in Viva Insights

Does Microsoft Viva Insights support arbitrary custom KPI categories
in the Insights dashboard at parity with existing categories (Focus
Time, Collaboration, Wellbeing)? Or does the third-party KPI surface
have to live in a separate "Insights from partners" surface?

The integration shape changes meaningfully based on this answer. If
parity is supported, the Behavioral Self-Trust card appears
alongside Focus Time. If parity is not supported, we land in a
secondary surface and the user-discovery story is weaker.

**Recommended answer from Microsoft:** Allow parity for partners
with sufficient privacy posture (the Defender risk score gate could
be the qualifier).

### Q2 — Teams Bot delivery in DnD windows

When a user is in Do-Not-Disturb status (Teams presence indicates
DnD), should COYL interrupts deliver, queue, or drop?

The behavioral-interrupt principle says: if the user is in a
focus state and about to break it, the interrupt should fire — even
if Teams presence indicates DnD. But Teams DnD is a user-respected
boundary; firing through it is contentious.

**Recommended answer:** Default to "respect DnD" with a per-user
opt-in setting "fire critical interrupts during DnD." The
critical-interrupt category is reserved for user-defined high-
priority commitments (the calendar-event-about-to-be-double-booked
case).

### Q3 — Cross-tenant analytics for the COYL behavioral model

The COYL behavioral model gets sharper with more users. The model
in tenant A benefits from learnings derived from tenant B's data
(in aggregate, not at user level).

Can COYL learn an aggregate behavioral model across tenants while
preserving per-tenant data isolation? Specifically, can we train
the model on aggregated, k-anonymous signal data with minimum cohort
size 100+?

**Recommended answer:** Yes, via Microsoft's Confidential Computing
infrastructure (Azure Confidential Computing). The aggregate
training runs in a secure enclave; per-tenant data never leaves the
tenant's data store; the resulting model weights are shared.

This question matters because it's the difference between COYL as a
true platform (model sharpens for everyone) vs COYL as a per-tenant
isolated point solution (no compounding benefit). The platform
answer is the one that justifies the strategic-acquisition multiple
at Microsoft scale.

### Q4 — Tenant admin override of user-level interrupts

A tenant admin (the customer's IT team) controls the COYL
deployment. Should the admin have the ability to:
- (a) Pause all interrupts tenant-wide?
- (b) Override individual user opt-outs (force a user into the
  interrupt program)?
- (c) Read individual user interrupt histories?

The admin-control surface is critical for enterprise sales, but it
conflicts with the user-trust principle that the user is in charge
of their own behavior.

**Recommended answer:**
- (a) Yes — admin can pause tenant-wide (incident response, deploy
  rollback)
- (b) No — admin cannot override user opt-outs (user trust is
  inviolable)
- (c) No, with exception — admin sees aggregate metrics only,
  unless legal-discovery situation triggers an audit-logged
  break-glass procedure

This balance is the right one but Microsoft engineering will want
to verify against enterprise customer expectations.

---

## Section 9 — Engineering deliverables timeline

If Microsoft Viva engineering and COYL agree to a pilot, the
deliverables timeline:

| Week | Deliverable | Owner |
|---|---|---|
| 0 | Pilot agreement signed (commercial + technical scope) | Joint |
| 1-2 | Pilot customer identified + onboarded to scope | Microsoft |
| 2-4 | Azure AD + SCIM provisioning configured | Joint |
| 3-5 | Graph API permissions granted, integration test | COYL |
| 4-6 | Viva Insights custom KPI surface deployed | Joint |
| 5-7 | Teams Bot deployment in pilot tenant | COYL |
| 6-8 | Viva Goals checkin integration deployed | Joint |
| 7-9 | Baseline measurement period begins | Joint |
| 9-12 | Active intervention period (60 days) | COYL |
| 13-15 | End-of-pilot measurement + report | Joint |
| 14-16 | Go/no-go on expanded deployment | Joint |

Total timeline from agreement to pilot decision: ~16 weeks
(4 months). This is the aggressive case; the typical Microsoft
enterprise pilot timeline is 6-9 months. The aggressive case is
achievable if Microsoft's Viva engineering provides a dedicated
integration engineer for the pilot duration.

---

## Section 10 — The strategic context (for Microsoft Viva leadership)

This spec is the technical layer. The strategic context lives in
`../outreach/bd-script-microsoft-viva.md`. Three points relevant to
engineering leadership:

1. **The protocol is open-source.** Apache 2.0 at coyl.ai/protocol.
   Microsoft can review the spec without any commercial commitment.
   The reference engine (COYL Cloud) is proprietary; the protocol
   itself is open. This is the same shape as MCP — open protocol,
   proprietary engines — and the precedent applies.

2. **The pharma path is parallel.** COYL is pursuing strategic
   conversations with Novo Nordisk + Eli Lilly in parallel (per
   `../outreach/bd-pharma-strategy.md`). Microsoft Viva is the
   tech-platform path, which prices on different valuation logic
   and operates on a different timeline. The parallel paths are not
   competitive within COYL's go-to-market — they're hedges against
   each other.

3. **The window matters.** Microsoft Viva has been the
   behavioral-interrupt-shaped gap inside Microsoft 365 since 2021.
   If Microsoft doesn't move on COYL in the next 12-18 months, one
   of the following becomes true: (a) a competitor acquires COYL,
   (b) Microsoft builds it internally over 18-24 months and ships
   a less compelling version, or (c) the category commoditizes and
   the behavioral-interrupt layer becomes a feature in every
   productivity suite. Microsoft acting now is the right move; the
   alternative is a worse outcome for Microsoft.

---

## Appendix — File references

- BD script for Microsoft Viva: `../outreach/bd-script-microsoft-viva.md`
- Viva partner application: `../outreach/microsoft-viva-partner-application.md`
- Pharma BD strategy: `../outreach/bd-pharma-strategy.md`
- Protocol specification: coyl.ai/protocol (public)
- Engineering overview: `../ENGINEERING.md`

---

*Microsoft Viva Engineering Integration Spec — v1 May 2026. Pair
with the BD script + the partner application. This document is the
technical deliverable for Microsoft Viva engineering review.
Distribution: Microsoft Viva product + engineering, Microsoft 365
partner engineering, Microsoft enterprise security review.*
