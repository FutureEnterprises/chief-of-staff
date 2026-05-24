# COYL Breach Notification Policy — DRAFT

> **OUTSIDE-COUNSEL HANDOFF — DRAFT, NOT LEGAL ADVICE.**
>
> Scaffolds the breach notification policy required for any
> HIPAA-aligned program. State law (CCPA, NY SHIELD, Texas, etc.)
> adds tighter windows for some breach classes — counsel must overlay
> the most restrictive applicable rule per affected resident's state.
>
> This document is not enforceable until adopted by COYL's officers
> and trained-against. Until then, the marketing surface reads
> "HIPAA-aligned, BAA available on request" — not "HIPAA-compliant."

---

## 1. Purpose

This policy describes how COYL identifies, investigates, contains,
and notifies affected parties in the event of a security incident or
breach involving Protected Health Information (PHI) or other
personally identifiable information (PII).

## 2. Scope

This policy applies to all COYL workforce members, contractors, and
subprocessors with access to PHI/PII. It covers all systems holding
COYL data: Supabase, Vercel, Resend, Twilio, Anthropic, Clerk, and
any future subprocessor that crosses the PHI boundary.

## 3. Definitions

- **Security Incident:** An attempted or successful unauthorized
  access, use, disclosure, modification, or destruction of
  information, or interference with system operations.
- **Breach:** An acquisition, access, use, or disclosure of PHI in a
  manner not permitted that compromises its security or privacy.
  (Per 45 CFR 164.402 — Breach is the regulated subset of Security
  Incident.)
- **Unsecured PHI:** PHI that is not rendered unusable, unreadable,
  or indecipherable to unauthorized persons through the use of
  technology specified by the Secretary of HHS.

## 4. Roles

| Role | Responsibility |
|---|---|
| **Security Officer** | [TBD — must be named before this policy activates] Coordinates response, owns the incident log, makes the breach determination, owns notifications. |
| **Privacy Officer** | [TBD — may be the same person as Security Officer at COYL's stage] Owns the regulator-facing communication and Covered Entity notifications. |
| **Engineering On-Call** | Contains the incident technically. Preserves logs. Does not communicate externally. |
| **Outside Counsel** | Activated within 24 hours of any suspected Breach. Reviews the breach determination before any external notification. |
| **CEO / Founder** | Approves external communications. |

[Counsel: at COYL's solo-founder stage, the Security Officer and
Privacy Officer and CEO will all be Iman Schrock. Name him explicitly
in the executed version so the policy is operative.]

## 5. Incident Response Procedure

### 5.1 Detection

A Security Incident may be detected via:
- Vercel security alerts, Supabase advisor warnings, Clerk auth
  anomaly notifications, Twilio / Resend abuse signals
- A subprocessor's breach notification to COYL
- A workforce member's report (every workforce member must report
  suspected incidents to the Security Officer within 1 hour of
  discovery)
- A user or Covered Entity report
- A regulator inquiry

### 5.2 Containment (within 1 hour of detection)

- Engineering On-Call isolates the affected system (revoke credentials,
  rotate keys, block IPs, take service offline if necessary).
- Preserve logs. Do NOT delete affected data; snapshot it.
- Security Officer opens the incident log entry.

### 5.3 Investigation (within 24 hours of containment)

The Security Officer (with outside counsel on a need-to-know basis)
determines:

a. What information was potentially accessed/disclosed?
b. How many individuals are affected? Whose PHI? From which Covered
   Entity (if any)?
c. Was the data Unsecured PHI? (If it was encrypted at rest AND in
   transit with keys not also compromised, it may not be a Breach
   under the safe harbor.)
d. What is the probability that PHI has been compromised? (Four-factor
   risk assessment per 45 CFR 164.402.)

### 5.4 Breach Determination

Outside counsel reviews the investigation findings and determines
whether the incident is a Breach as defined by HIPAA + applicable
state law. **If unsure, treat as a Breach** — under-notifying is
materially worse than over-notifying.

### 5.5 Notification (within statutory deadlines)

| Recipient | Trigger | Deadline | Method |
|---|---|---|---|
| **Covered Entity** (if BAA in place) | COYL discovers Breach of CE's PHI | Without unreasonable delay, no later than 60 days from discovery (45 CFR 164.410); BAA may require faster | Email + certified mail |
| **Affected Individuals** | Covered Entity instructs OR COYL is the Covered Entity | Without unreasonable delay, no later than 60 days from discovery (45 CFR 164.404) | First-class mail; substitute notice via website notice for >10 individuals with insufficient contact info |
| **HHS Secretary** | Breach affecting fewer than 500 individuals | Annually (within 60 days of end of calendar year) | HHS Breach Reporting Form |
| **HHS Secretary** | Breach affecting 500+ individuals | Without unreasonable delay, no later than 60 days from discovery | HHS Breach Reporting Form |
| **Major Media** | Breach affecting 500+ residents of a state/jurisdiction | Without unreasonable delay, no later than 60 days from discovery | Prominent media outlet serving the affected state |
| **State Attorney General** | Per applicable state law (CCPA, NY SHIELD, Texas, etc.) | Varies — some states require notification within 72 hours of discovery | Per state-specific procedure |
| **FTC** | If health data covered by the FTC Health Breach Notification Rule | Within 60 days | FTC Breach Reporting Form |

### 5.6 Notification Content

Notifications must include:
- A brief description of what happened, including the date of the
  Breach and the date of the discovery, if known.
- A description of the types of unsecured PHI that were involved.
- The steps individuals should take to protect themselves from
  potential harm.
- A brief description of what COYL is doing to investigate, to
  mitigate harm, and to protect against further breaches.
- Contact procedures (toll-free phone, email, website, postal address).

[Counsel: draft a notification template appendix with fill-in fields
the Security Officer can complete under time pressure.]

## 6. Post-Incident Review

Within 30 days of incident closure, the Security Officer leads a
post-incident review covering:

- Root cause analysis
- Effectiveness of containment + response
- Policy / control gaps to close
- Workforce training adjustments
- Subprocessor accountability (if upstream)

The review is documented in the incident log and reviewed in the
quarterly security review.

## 7. Workforce Training

All COYL workforce members must complete breach notification training:
- At hire
- Annually
- Within 30 days of any material policy change

Training records are maintained for six years.

## 8. Recordkeeping

The incident log is retained for six years from the date of the
incident or the date the incident was discovered, whichever is later.

## 9. Sanctions

Violation of this policy by workforce members results in disciplinary
action up to and including termination, consistent with the COYL
Workforce Sanctions Policy [to be drafted].

## 10. Adoption + Activation

| Status | Date | Approved By |
|---|---|---|
| **DRAFT** | 2026-05-24 | (this scaffold) |
| **OUTSIDE-COUNSEL REVIEWED** | TBD | TBD |
| **OFFICER-APPROVED** | TBD | Iman Schrock, CEO |
| **TRAINED-AGAINST** | TBD | Security Officer |
| **OPERATIVE** | TBD | (all of the above complete) |

---

## Author + handoff state

- **Drafted by:** COYL founder with engineering scaffolding.
- **Next step:** retain outside healthcare counsel for a 30-day
  engagement that includes a review of this policy alongside the BAA
  template (`baa-template.md`) and the security risk analysis
  (`security-risk-analysis.md`).
- **Until OPERATIVE:** do not represent COYL as having a "breach
  notification policy" in any sales or marketing surface. The current
  truth is "drafting underway."
