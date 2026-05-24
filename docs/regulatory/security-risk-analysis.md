# COYL Security Risk Analysis — DRAFT

> **OUTSIDE-COUNSEL HANDOFF — DRAFT, NOT LEGAL ADVICE.**
>
> The HIPAA Security Rule (45 CFR 164.308(a)(1)(ii)(A)) requires every
> Covered Entity and Business Associate to conduct an "accurate and
> thorough" risk analysis. This document scaffolds that analysis for
> COYL using the May 2026 state of the platform. It is incomplete
> until a security officer is named and outside counsel signs off.
>
> An honest read: every fillable cell below is the analysis. The cells
> with [TBD] mark where the program does not yet have the artifact.
> Those gaps are the program.

---

## 1. Scope

This risk analysis covers all systems holding electronic Protected
Health Information (ePHI) or personally identifiable information
(PII) under COYL's control:

- **Application layer:** Next.js app at coyl.ai (Vercel)
- **Database:** Supabase Postgres (project `dumugwfjsipbxtchnewa`)
- **Auth:** Clerk
- **Model inference:** Anthropic (Claude API)
- **Transactional email:** Resend
- **SMS:** Twilio
- **Mobile:** iOS + Android apps (Expo, pre-submission)
- **Logging:** Vercel logs, Supabase logs
- **Cron infrastructure:** Vercel Cron + Vercel Workflow DevKit
- **Workforce devices:** Founder's Mac (FileVault-encrypted, [TBD])

Out of scope: anything not yet built (Watch app, mobile builds in
TestFlight, etc.)

## 2. Asset inventory (PHI/PII flow map)

| Data class | Where it lives | Who can read | Encryption at rest | Encryption in transit |
|---|---|---|---|---|
| User name, email | `users` table (Supabase), Clerk | Service role (Prisma), Clerk staff | AES-256 (Supabase default) | TLS 1.3 |
| Phone number (when present) | `sms_signups` table | Service role | AES-256 | TLS 1.3 |
| Behavior signals (slip records, danger windows, autopilot patterns) | Supabase | Service role | AES-256 | TLS 1.3 |
| Chat messages with the AI | Supabase + Anthropic transient | Service role; Anthropic per ZDR posture | AES-256 at rest; Anthropic ZDR not yet confirmed at API tier in use | TLS 1.3 |
| Inbound SMS/email replies (new — `inbound_messages` table) | Supabase | Service role | AES-256 | TLS 1.3 |
| Audit funnel events (anon — sessionId only, no PII directly) | Supabase | Service role | AES-256 | TLS 1.3 |
| Push notification payloads | Apple APNs / Google FCM | Apple / Google staff per their privacy policy | Apple/Google encryption | TLS 1.3 |
| Billing data (Stripe — pre-revenue) | Stripe | Stripe staff | Stripe encryption | TLS 1.3 |

## 3. Threat catalog + likelihood × impact assessment

Methodology: NIST SP 800-30 informal scoring. Each row scored
Likelihood (L/M/H) × Impact (L/M/H) → Risk (L/M/H/Critical).

### 3.1 Threats — at the application layer

| Threat | Likelihood | Impact | Risk | Mitigation in place | Gap |
|---|---|---|---|---|---|
| Unauthenticated access to user PHI via /api/v1/* routes | L | H | M | Clerk auth enforced at proxy.ts; all routes default-protected | None |
| Authenticated user accesses another user's PHI (horizontal privilege escalation) | M | H | H | API routes do `userId = auth().userId` matching; PATCH/DELETE check ownership | NO formal pen test; rely on code review |
| API key leak (Anthropic, Twilio, Supabase service role) | M | Critical | Critical | Stored in Vercel env vars; not in repo | NO key rotation cadence; NO secret-scanning in CI; service role key gives full DB access |
| SQL injection | L | Critical | M | Prisma parameterized queries; raw SQL only in a few audited locations | Audit raw SQL usage (semgrep alerted on one route during round-3 work; was actually safe but pattern needs convention) |
| XSS via user-provided content | L | M | L | React's escaping; CSP not set | NO Content-Security-Policy header set on Vercel responses |
| Session hijack via stolen Clerk token | L | H | M | Clerk default token lifetime + rotation | NO step-up auth on sensitive actions (account deletion, etc.) |

### 3.2 Threats — at the data layer

| Threat | Likelihood | Impact | Risk | Mitigation in place | Gap |
|---|---|---|---|---|---|
| Supabase service role key compromise | L | Critical | Critical | RLS enabled on all public tables (May 2026); service role bypasses it BUT lock-down reduces blast radius via REST | Service role key still has full table access; NO column-level encryption on PHI fields |
| Unauthorized access via Supabase REST API (anon key) | VL | H | L | RLS enabled on all public tables (May 2026 hardening) | None |
| Database backup theft | L | H | M | Supabase automated backups; encrypted at rest | NO documented backup restoration drill |
| Insider access (Supabase / Vercel staff) | VL | H | L | Vendor controls; SOC 2 reports available on request | NO BAA with Supabase or Vercel YET (see §6) |
| Data leak via logs (PII in error messages, AI prompts logged to console) | M | M | M | Logging is structured, not full-request | Audit Vercel logs for PHI leakage; redact known PHI fields in any error path |

### 3.3 Threats — at the third-party / subprocessor layer

| Threat | Likelihood | Impact | Risk | Mitigation in place | Gap |
|---|---|---|---|---|---|
| Anthropic logs prompts containing PHI | L | H | M | API plan tier with ZDR posture | **NOT verified that ZDR applies to the API tier COYL currently uses.** Verify before clinical pilot. |
| Twilio inbound SMS forwarded to non-COYL system | VL | H | L | Webhook validates Twilio signature | None |
| Resend email content logged | L | M | L | Resend retains for delivery tracking | Verify retention window; sign Resend BAA |
| Vercel logs PHI in build output / runtime logs | M | M | M | Vercel logs are queryable by COYL | NO documented practice of redacting PHI before console.log |

### 3.4 Threats — operational

| Threat | Likelihood | Impact | Risk | Mitigation in place | Gap |
|---|---|---|---|---|---|
| Founder's laptop stolen | M | H | H | FileVault disk encryption | NO documented practice of "what's on the laptop"; high-value secrets stored locally include Supabase access tokens, Clerk dashboard auth, Vercel CLI tokens |
| Founder's GitHub account compromised | L | Critical | M | 2FA enabled (assumed; verify) | Single point of failure — no co-maintainer with admin to revoke if compromised |
| Workforce phishing (n=1 currently) | M | H | H | (None) | No phishing-resistant 2FA (passkeys / WebAuthn) mandated |
| Vendor account compromise (Vercel / Supabase / etc.) | L | Critical | M | Vendor 2FA | NO documented practice of rotating vendor credentials on workforce changes |
| Inability to detect breach for 30+ days | M | Critical | High | (None — there is no alerting infrastructure beyond Vercel default) | NO security monitoring tooling (Datadog Security Monitoring, etc.); NO log retention policy |

## 4. Top 10 prioritized gaps

Ranked by (Severity × Time-to-fix), shortest path to lowest residual risk:

1. **Verify Anthropic ZDR posture on the API tier COYL uses.** Half-day. If not ZDR, prompt content (including any user-disclosed PHI) is retained by Anthropic for 30 days. Blocker for clinical pilot.
2. **Execute upstream BAAs with Supabase, Vercel, Anthropic, Twilio, Resend, Clerk.** Two weeks legal calendar. Single largest blocker to honest HIPAA Business Associate framing.
3. **Designate a Security Officer in writing.** One day. Currently the founder; document it.
4. **Implement Content-Security-Policy + HTTP security headers** (helmet.js equivalent via Next.js middleware). One day.
5. **Add secret-scanning to CI** (gitleaks, trufflehog, GitHub native). Half-day.
6. **Document key rotation cadence** (90-day rotation for Supabase service role, Anthropic API keys; immediate rotation on any workforce change). One day to document; ongoing operational.
7. **Audit Vercel logs for PHI leakage.** Half-day investigation + redaction wherever found.
8. **Enable Supabase point-in-time recovery + document restoration drill.** One day.
9. **Field-level encryption on highest-sensitivity PHI columns** (e.g., raw conversation messages, slip notes). One week engineering.
10. **Phishing-resistant 2FA (passkeys / WebAuthn) for every workforce vendor account.** Two days.

## 5. Subprocessor BAA tracking

Cross-reference with `baa-template.md` §6:

| Subprocessor | BAA available? | BAA executed? | Tier required |
|---|---|---|---|
| Anthropic | Yes (Enterprise) | [TBD] | Enterprise |
| Supabase | Yes (Pro / Team) | [TBD] | Pro minimum, Team preferred |
| Vercel | Yes (Enterprise) | [TBD] | Enterprise (blocker if currently Pro) |
| Resend | Verify | [TBD] | Verify |
| Twilio | Yes (Healthcare suite) | [TBD] | Healthcare edition |
| Clerk | Verify | [TBD] | Verify |
| Apple APNs / Google FCM | Per Apple/Google ToS | N/A | These are not BAA partners; rely on encryption + minimal payload (no PHI in push body) |
| Stripe | Yes (HIPAA-eligible accounts) | [TBD if billing health products] | Verify if treating any data as PHI |

## 6. Reassessment cadence

- **Quarterly** — risk-analysis review (Security Officer)
- **Annually** — full risk analysis refresh
- **Ad-hoc** — within 30 days of any material change to the platform
  (new subprocessor, new PHI-bearing feature, change in data class)

## 7. Adoption state

| Status | Date |
|---|---|
| **DRAFT** | 2026-05-24 |
| **OUTSIDE-COUNSEL REVIEWED** | [TBD] |
| **OFFICER-APPROVED** | [TBD] |
| **OPERATIVE** | [TBD] |

---

## Author + handoff state

- **Drafted by:** COYL founder with engineering scaffolding from the
  May 2026 compliance posture work.
- **Next step:** outside healthcare counsel review alongside
  `baa-template.md` and `breach-notification-policy.md`. The
  recommended 30-day engagement should close gaps 1-3 in §4 above as
  the bare minimum before any clinical pilot signs.
- **What's honest to say publicly today:** "HIPAA-aligned data layer
  — security risk analysis in active development; BAA available on
  request." That language is already live on `/clinician` and
  `/rebound/for-clinicians` (May 24 2026 update).
