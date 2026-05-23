# UAP — User-Authority Protocol v0.1.1

> Status: **DRAFT** · Released 2026-05-22 · Last revised 2026-05-22 (v0.1.1 — provenance primitive added) · Apache 2.0 · Specification only — reference engine ships post-Series-A.
>
> **v0.1 → v0.1.1 changelog (2026-05-22 evening):** added 9th primitive `PROVENANCE_SIGN` (§2.9 + §5.5), threat T9 (spoofed provenance, §6), invariant 9 (provenance required for representation actions, §3), endpoint `GET /api/uap/v1/provenance/{audit_id}` (§9), schema fields `provenanceSignature` / `provenancePublicKey` / `provenanceAlgorithm` on `UAPAuditEntry`. Closes the "agent-as-representative" gap that v0.1 omitted — actions performed AS the user to other humans and systems now carry cryptographic provenance the recipient can verify.

The fourth layer of the COYL protocol stack. BIP reads the substrate. PAP proposes the moment. EAP acts across the device fleet — one action at a time. **UAP is the standing-authority layer.** It defines the trust contract a user issues to an LLM when they want autonomous action without per-action consent.

This is the layer that converts agentic AI from "demo that requires the user to babysit every click" to "AI that operates inside scoped authority with auditable history and a kill switch." It is the layer foundation labs need to ship agentic AI safely — and the layer they cannot ship themselves without owning the liability surface.

---

## §1. Why a Fourth Protocol

The existing COYL stack has three protocols, each with a distinct consent model:

| Protocol | Consent grain | Authority lifetime |
|---|---|---|
| BIP | Per-app, opt-out | Until app uninstalled |
| PAP | Per-scope-per-partner | 24h–30d, scope-bounded |
| EAP | Per-action confirmation for irreversibles | One action |

All three assume the user is *present*. The user sees a callout, taps confirm, the action fires. That assumption breaks the moment LLMs are asked to operate while the user is *absent* — running a daily routine, drafting tomorrow's calendar, reordering household supplies, paying recurring bills, scheduling deliveries.

The market has chosen this. Anthropic Computer Use, OpenAI Operator, Project Astra, every consumer-agentic demo of 2026 — all of them operate without user presence. None has shipped a defensible consent model. The default today is OAuth-style: the user clicks "Allow all" without reading. That model failed humans at the application layer (every app abuses it) and will fail catastrophically at the AI-action layer.

UAP is the alternative. It says: standing authority MUST be bounded, MUST be revocable in seconds, MUST be auditable, and MUST be portable across LLMs. Without UAP, the agentic AI category ships unsafe. With UAP, the category ships with the trust infrastructure under it.

---

## §2. Eight Primitives

UAP defines exactly eight operations. Every implementation must support all eight; no fewer, no more in the v0.1 baseline.

```
GRANT          User authorizes scope X for LLM Y, expiring at T, bounded by rules R.
REVOKE         User immediately revokes one grant. In-flight actions audit-trace.
KILL_SWITCH    User revokes ALL grants across ALL LLMs in one operation. Supersedes
               everything. Propagates to every connected surface in ≤5 seconds.
PRECHECK       LLM asks: "If I attempted action A right now under grant G, would
               the coordinator allow it?" No side effects. No DB write. Pure decision.
EXECUTE        LLM performs action A under grant G. Coordinator checks: grant valid,
               scope matches, rules pass, irreversibility gate, rate limit. Persists
               an audit row regardless of outcome.
EXPIRE         Grant auto-revokes at expiry T. No renewal except via fresh GRANT.
RULE_DECLARE   User pre-declines a class of action ("never spend > $50 without
               asking", "never send messages after midnight", "never share with X").
               Rules supersede grants. A rule violation auto-denies even if the
               grant would otherwise allow.
AUDIT_QUERY    User reads everything performed under grant G, or all grants for
               LLM Y, or all activity for user U. Read-only, append-only log.

PROVENANCE_SIGN  (v0.1.1) For every EXECUTE whose action is a REPRESENTATION
               action (agent acts AS the user to another human or system —
               email reply, calendar RSVP, payment, DM, public post), the
               coordinator attaches a cryptographic provenance signature to
               the outgoing action. The signature is verifiable by the
               recipient. The recipient sees "authored by <agent> on behalf
               of <user>, grant <id>, audit at <url>" — not a forged
               from-the-user message. v0.1 left this implicit; v0.1.1 makes
               it a first-class primitive.
```

Two operations are non-negotiable: **KILL_SWITCH** and **AUDIT_QUERY**. Every UAP-compliant implementation must expose them with no scope restrictions, no auth burden beyond user identity, and no rate limit. If a user wants to kill all standing authority, they get that in one click. If a user wants to read every action taken on their behalf, they get that in one query.

The third non-negotiable, as of v0.1.1, is **PROVENANCE_SIGN**. An implementation that lets an LLM act AS the user without a verifiable provenance signature is not UAP-compliant. The recipient of a representation action MUST be able to distinguish "AI-mediated message on behalf of the user" from "directly-authored message by the user." Failing to surface that distinction is the difference between agentic AI safety and agentic AI fraud.

---

## §3. Hard Invariants

These cannot be relaxed by any implementation. They define the protocol.

```
✱ Every grant has a hard expiry. No grant may exceed 90 days. Default 7 days.
  Renewal requires a fresh GRANT — not a token refresh.

✱ Irreversibles ALWAYS require per-action confirmation, even under standing grant.
  The EAP irreversibility list (send_message, purchase, money_transfer, share_pii,
  delete_account, destroy_data) is the floor. Implementations may extend it,
  never shrink it.

✱ KILL_SWITCH supersedes every grant, every rule, every in-flight action.
  Propagation deadline: 5 seconds across all connected surfaces.
  In-flight actions that complete after kill-switch fire MUST be marked
  post_kill in the audit log so the user can review what slipped through.

✱ Every EXECUTE writes one immutable audit row. The log is append-only,
  cryptographically signed, and queryable by the user without LLM partner
  involvement. The user owns the audit trail — not the LLM, not COYL.

✱ Cross-LLM portability is the test. The same GRANT issued to Claude must
  be revocable, queryable, and bound by the same rules when reissued to GPT
  or to a local model. UAP is not a Claude-only protocol or an OpenAI-only
  protocol. It is the standing-authority layer for ALL LLMs operating in the
  user's world.

✱ Cross-surface coverage. A grant is honored by every device implementing
  EAP that the LLM reaches through. Phone, watch, browser, desktop, smart
  home, car. The grant lives at the user layer, not the device layer.

✱ No ambient grants. There is no "always-on" authority. Every grant has a
  scope, an expiry, and a rule set. A grant that omits any of these is
  invalid and MUST be rejected at GRANT time.

✱ Negative authority precedes positive authority. A rule that pre-declines
  an action class is stronger than any grant. RULE_DECLARE writes a row
  that supersedes every overlapping grant, even fresh ones.

✱ (v0.1.1) Provenance is required for representation actions. Any EXECUTE
  whose action acts AS the user to another human or external system —
  send_message, calendar_rsvp, public_post, payment, share — MUST attach
  a cryptographic provenance signature visible to the recipient. The
  signature binds (agent_id, grant_id, action_kind, audit_url, timestamp)
  with the user's ed25519 signing key. Recipients verify signature +
  ping the audit_url to confirm the action is real and not revoked.
  Implementations that omit provenance on representation actions are NOT
  UAP-compliant; they are anti-pattern.
```

---

## §4. Grant Lifecycle

```
                  ┌──────────────┐
                  │  CREATED     │  ← User issues GRANT via consent UI
                  │  (active)    │     Coordinator validates scope + rules + expiry
                  └──────┬───────┘     Persists grant_id, returns to LLM partner
                         │
                         │ LLM uses PRECHECK / EXECUTE
                         │ Coordinator: scope match? rule pass? not expired?
                         │              irreversible? then per-action confirm.
                         ▼
                  ┌──────────────┐
                  │  CONSUMING   │  ← Actions firing. Each one audit-logged.
                  │  (in use)    │     Rate limits enforced per partner-per-user.
                  └──────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │ REVOKED  │    │ EXPIRED  │    │ KILL_SWITCH  │
  │ (user)   │    │ (time T) │    │ (user, all)  │
  └─────┬────┘    └─────┬────┘    └──────┬───────┘
        │               │                │
        └───────────────┼────────────────┘
                        │
                        ▼
                 ┌────────────┐
                 │  TERMINAL  │  Grant cannot be reused. New action requires
                 │            │  a fresh GRANT. Audit log retained per the
                 └────────────┘  retention policy.
```

All terminal-state transitions write an audit entry with the cause: `revoked_by_user`, `expired`, `killed_globally`. In-flight actions at the moment of transition continue to completion BUT carry a `post_termination` flag in their audit row, and the EXECUTE operation returns a `consent_lapsed_during_action` warning to the LLM partner.

---

## §5. Wire Format

Every operation is JSON over HTTPS. Bearer-token auth for LLM partners (UAP keys are scoped differently from PAP keys — a partner integrating both protocols holds separate credentials per protocol surface).

**GRANT request:**
```json
POST /api/uap/v1/grant
Authorization: Bearer coyl_uap_<partner_id>_<secret>

{
  "user_id": "u_2sj8xks0a",
  "scopes": ["calendar.write", "messaging.routine", "purchase.recurring"],
  "expires_at": "2026-05-29T17:00:00Z",
  "rules": [
    { "kind": "spending_cap", "max_per_action_usd": 50 },
    { "kind": "quiet_hours", "from": "00:00", "to": "07:00", "tz": "America/Los_Angeles" },
    { "kind": "irreversible_floor", "always_confirm": ["money_transfer", "share_pii"] }
  ],
  "consent_artifact": {
    "version": "0.1",
    "shown_to_user_at": "2026-05-22T16:58:00Z",
    "user_response": "explicit_grant",
    "ui_surface": "settings.standing_authority"
  }
}
```

**GRANT response:**
```json
{
  "grant_id": "grnt_8x4kls7a9d",
  "status": "active",
  "expires_at": "2026-05-29T17:00:00Z",
  "audit_url": "https://coyl.ai/audit/uap/grnt_8x4kls7a9d",
  "kill_switch_url": "https://coyl.ai/kill"
}
```

**EXECUTE request:**
```json
POST /api/uap/v1/execute
Authorization: Bearer coyl_uap_<partner_id>_<secret>

{
  "grant_id": "grnt_8x4kls7a9d",
  "action": {
    "kind": "calendar.write",
    "operation": "schedule_event",
    "params": { "...domain-specific..." },
    "reversibility": "reversible"
  },
  "context": {
    "trigger": "morning_planning_routine",
    "confidence": 0.88
  }
}
```

**EXECUTE response (allowed):**
```json
{
  "decision": "allowed",
  "audit_id": "aud_4kx9s7ad",
  "executed_at": "2026-05-22T17:02:14Z"
}
```

**EXECUTE response (denied due to rule):**
```json
{
  "decision": "denied",
  "reason": "rule_violation",
  "rule_id": "spending_cap",
  "detail": "Action would spend $87.50; rule caps at $50/action.",
  "audit_id": "aud_4kx9s7ae",
  "remediation": "request_per_action_confirmation"
}
```

**KILL_SWITCH:**
```json
POST /api/uap/v1/kill-switch
Authorization: <user session, not partner token>

{
  "user_id": "u_2sj8xks0a",
  "reason": "user_initiated"
}
```

Returns within 1 second. Propagates to every connected EAP surface within 5 seconds. Active grants flip to `terminal:killed_globally`. The endpoint is rate-limit-exempt and authentication-light — a user in crisis must be able to kill all standing authority even if they cannot remember their password (out-of-band recovery is policy, not protocol).

### §5.5 — Provenance signature envelope (v0.1.1)

Every EXECUTE whose action is a *representation action* (the agent acts AS the user to another human or external system) MUST carry a provenance signature on the outgoing action. The signature is ed25519, computed over the canonical JSON of the provenance payload using the user's UAP signing key (derived per-user at first-grant time; rotatable).

**Payload (canonical JSON, sorted keys):**

```json
{
  "v": "uap-0.1.1",
  "agent": "anthropic-claude-opus-4",
  "subject": "did:coyl:u_2sj8xks0a",
  "grant_id": "grnt_8x4kls7a9d",
  "audit_id": "aud_4kx9s7ad",
  "action_kind": "send_message",
  "recipient_hint": "external:user@example.com",
  "issued_at": "2026-05-22T17:02:14Z",
  "audit_url": "https://coyl.ai/audit/uap/aud_4kx9s7ad"
}
```

**Signature attachment (per medium):**

- Email: `X-UAP-Provenance: <base64(payload)>.<base64(signature)>` header; clients verify and render a "AI-mediated · authored by Claude on behalf of Iman" pill
- HTTP API (Stripe, calendar, etc.): `Uap-Provenance` header with same format
- Web posts (Twitter, LinkedIn): the post body includes a short `[via @coyl/<short_audit>]` tag linking to the audit_url; the underlying API call carries the full header
- Direct messages (Slack, Discord, etc.): same `[via @coyl/<short_audit>]` tag inline

**Verification:**

```
GET /api/uap/v1/provenance/{audit_id}
```

Returns the payload, the agent's public key, the user's public key, the grant status (active / revoked / expired / killed), and the signed audit-chain entry. Recipient verifiers should hit this URL, compare the public key in the response to the public key bundled with their copy of the payload, and confirm the grant is still `active`. A grant in any terminal state means the action MAY have been authorized at issue-time but is no longer one the user stands behind — recipient SHOULD treat such actions as advisory, not as the user's word.

**Why this matters:** v0.1's bearer-token-authenticated EXECUTE is sufficient for COYL to know who the LLM partner is. It is NOT sufficient for the recipient of a representation action to know "this email actually was authored by Claude on behalf of Iman, with consent." Without v0.1.1's signature envelope, a recipient cannot distinguish "AI-mediated message" from "compromised account" from "human sender." That distinction is the entire trust contract.

---

## §6. Threat Model

The most likely catastrophic failure modes, ranked.

```
T1  Confused-deputy: LLM is tricked into using its grant authority on behalf
    of an attacker. (E.g., a malicious calendar invite contains text that the
    LLM interprets as a user instruction to forward credentials.)
    Mitigation: every EXECUTE includes the trigger source; rules can refuse
    actions whose trigger is "incoming_external_input"; consent_artifact
    establishes user intent at grant time.

T2  Stale-grant abuse: an LLM partner cached a grant; the user revoked it
    via a different surface; the cached partner continues actions until its
    next PRECHECK roundtrip.
    Mitigation: EVERY EXECUTE re-validates the grant server-side. No cached
    grants. Local validation is advisory, never authoritative.

T3  Privilege escalation: a grant for scope A is used to perform action B.
    Mitigation: scope-match is enforced at EXECUTE before any side effect.
    Scope mismatch returns `scope_violation` and writes an audit entry.

T4  Compromised partner credentials: an LLM partner's Bearer key is leaked.
    Mitigation: per-partner rate limits at GRANT and EXECUTE; suspicious-
    pattern detection at coordinator level; per-user revoke-by-partner
    operation; partner rotation enforced quarterly minimum.

T5  Replay attack: a previously-allowed EXECUTE request is replayed.
    Mitigation: every EXECUTE carries a one-time idempotency key; replays
    return the original decision without re-executing.

T6  Kill-switch failure: the user hits kill, propagation lags, an action
    fires during the lag window.
    Mitigation: server-side denylist takes effect at the COORDINATOR layer
    within 1 second; surface-side propagation continues to 5 seconds; any
    action fired in the 1–5s window MUST carry the `post_kill` audit flag.

T7  Audit log tampering: an attacker (or a partner) modifies the log to
    hide an action.
    Mitigation: log is append-only at the storage layer; each entry is
    cryptographically signed; entries are chained via a hash of the previous
    row. Modification breaks the chain visibly.

T8  Social-engineering of consent UI: the consent UI is rendered inside a
    partner's UX and the partner makes the GRANT button salient and the
    REVOKE button buried.
    Mitigation: the consent UI MUST be hosted by the UAP coordinator (not
    the partner). Partners initiate GRANT via redirect; the user sees the
    actual scope-list, expiry, and rules on a COYL-hosted page.

T9  (v0.1.1) Spoofed provenance: an attacker forges a UAP provenance
    signature to make a malicious action appear AI-mediated-with-consent
    when it isn't. (E.g., sending phishing email with a fake X-UAP-Provenance
    header to bypass the recipient's spam filter that whitelists UAP-signed
    messages.)
    Mitigation: provenance signatures are ed25519 with the user's public
    key fetchable at GET /api/uap/v1/provenance/{audit_id}; the coordinator
    is the only entity that signs valid envelopes (it holds the user's
    UAP signing key in HSM-equivalent storage). A forged envelope fails
    signature verification at the recipient. Compromised user signing
    keys are rotated via KILL_SWITCH → coordinator-mediated re-derivation
    → all outstanding grants re-signed; audit chain remains intact via
    the chained-hash invariant in §3.
```

A `UAP-0.1-threat-model.md` companion document expands each scenario with attack chains, instrumentation requirements, and incident-response steps. That document is the canonical reference for any partner doing a Trust & Safety review.

---

## §7. Coordinator Reference Implementation (sketch)

```
function executeUnderGrant(req) {
  // 1. Authenticate partner (Bearer token).
  // 2. Load grant by grant_id. Reject if not found or not in active state.
  // 3. Re-check expiry against current time. Hard fail on expiry.
  // 4. Verify the action's scope is present in grant.scopes.
  // 5. Apply rules in order. Hardest fails: quiet_hours, spending_cap,
  //    irreversible_floor. Soft fails: panic_active (delay), rate_limit.
  // 6. If reversibility = irreversible AND not in always_confirm whitelist:
  //    return decision=denied, reason=needs_per_action_confirmation.
  // 7. Persist EXECUTE attempt → audit row (signed + chained).
  // 8. Return decision to partner. Partner now performs the underlying
  //    action via EAP for cross-device or directly via its own surface.
  // 9. Partner emits an OUTCOME callback within 30 seconds. Outcome
  //    closes the audit row with success/failure/no-op.
}
```

The reference implementation lives in `apps/web/src/lib/uap/coordinator.ts` (see [§9 Surface Reservation](#9-surface-reservation)) and reuses the PAP coordinator's panic/quiet-hours/rate-limit primitives via a shared `lib/coordinator/` module.

---

## §8. Consent UI Requirements

Standing authority demands consent UX that fails safe. These are protocol-mandated; any UAP-compliant implementation must satisfy all of them.

```
✱ Scope list rendered as plain-English sentences, NOT scope identifiers.
  "Can schedule events on your calendar" — never "calendar.write".

✱ Expiry displayed in the consent dialog as a date+time, not a duration.
  "Until Friday May 29 at 5 PM" — never "7 days".

✱ Default expiry must be the SHORTEST reasonable value for the scope.
  Default 7 days. Maximum 90 days. The user must explicitly slide the
  expiry up; the consent UI must not default to maximum.

✱ Rules opt-OUT, not opt-IN. The spending cap, quiet hours, and
  irreversibility floor are pre-checked. The user can disable them, but
  the burden of disabling is on the user, not on accepting them.

✱ Kill switch link visible on every page of the user's app where a UAP
  grant could be active. Never more than two taps away.

✱ Audit log accessible from the user's settings WITHOUT any LLM partner
  involvement. The user owns it; the partner cannot hide it.

✱ Re-consent on material change. A partner cannot widen scope mid-grant.
  Adding a scope requires a fresh GRANT with a new consent_artifact.
```

The COYL reference engine ships a hosted consent UI at `coyl.ai/consent/uap` that any partner can redirect through. Partners are free to build their own UI; the protocol requires that their UI satisfy the bullets above and that it be subject to public review.

---

## §9. Surface Reservation

These API routes are reserved under the UAP namespace as of v0.1. Implementations should not introduce conflicting routes under `/api/uap/v1/*`.

```
POST   /api/uap/v1/grant                       → issue a new standing grant
GET    /api/uap/v1/grant/[id]                  → read grant metadata + status
DELETE /api/uap/v1/grant/[id]                  → user-initiated revoke
POST   /api/uap/v1/precheck                    → would action A under grant G be allowed?
POST   /api/uap/v1/execute                     → execute action A under grant G
POST   /api/uap/v1/kill-switch                 → global kill (user-authenticated)
GET    /api/uap/v1/audit                       → user reads their UAP audit history
POST   /api/uap/v1/rule                        → declare a pre-decline rule
GET    /api/uap/v1/provenance/[audit_id]       → (v0.1.1) verify a provenance signature;
                                                  returns payload, agent pub key, user pub key,
                                                  grant status, and audit-chain entry. Public,
                                                  unauthenticated — recipients of representation
                                                  actions verify signatures here.
```

The reference engine's library layout lives under `apps/web/src/lib/uap/`:
- `grant-store.ts` — persistence (Prisma models: `UAPGrant`, `UAPRule`, `UAPAuditEntry`, `UAPKillSwitchEvent`)
- `coordinator.ts` — decision logic, reuses `lib/coordinator/` primitives
- `kill-switch.ts` — global revoke + propagation
- `audit.ts` — signed append-only log + chain validation
- `uap-partner-auth.ts` — Bearer token validation for partners

Schema reservations:

```prisma
model UAPGrant {
  id              String   @id @default(cuid())
  userId          String
  llmPartnerId    String
  scopes          String[] // ["calendar.write", "messaging.routine", ...]
  expiresAt       DateTime
  status          UAPGrantStatus @default(ACTIVE)
  consentArtifact Json     // user_response, ui_surface, shown_at
  createdAt       DateTime @default(now())
  terminatedAt    DateTime?
  terminationReason String?

  rules           UAPRule[]
  executions      UAPAuditEntry[]

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  partner         LLMPartner  @relation(fields: [llmPartnerId], references: [id])

  @@index([userId, status])
  @@index([llmPartnerId, status])
  @@index([expiresAt])
  @@map("uap_grants")
}

enum UAPGrantStatus {
  ACTIVE
  REVOKED_BY_USER
  EXPIRED
  KILLED_GLOBALLY
}

model UAPRule {
  id          String   @id @default(cuid())
  grantId     String?  // null when rule is global (user-level, applies to all grants)
  userId      String   // always set
  kind        String   // "spending_cap" | "quiet_hours" | "irreversible_floor" | ...
  params      Json
  createdAt   DateTime @default(now())

  grant       UAPGrant? @relation(fields: [grantId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, grantId])
  @@map("uap_rules")
}

model UAPAuditEntry {
  id                   String   @id @default(cuid())
  grantId              String
  userId               String
  llmPartnerId         String
  operation            String   // "execute" | "precheck" | "grant" | "revoke" | "kill"
  actionKind           String?  // when operation=execute
  decision             String   // "allowed" | "denied" | "queued" | "killed"
  decisionReason       String?
  postTermination      Boolean  @default(false)
  signature            String   // ed25519 sig of the row contents (audit-chain integrity)
  prevHash             String?  // chain link to previous audit row for this user

  // v0.1.1 — outgoing-action provenance. Set when actionKind is a
  // representation action (send_message, calendar_rsvp, payment, etc.).
  // Distinct from `signature` above (which secures the audit-chain row).
  // This signature secures the outgoing payload the recipient sees.
  provenanceSignature  String?  // ed25519 sig of the §5.5 provenance payload
  provenancePublicKey  String?  // base64 user public key the recipient should verify against
  provenanceAlgorithm  String?  // "ed25519" in v0.1.1; reserved for future algs
  provenancePayload    Json?    // canonical payload that was signed; v0.1.1 shape per §5.5

  createdAt            DateTime @default(now())

  grant                UAPGrant @relation(fields: [grantId], references: [id])

  @@index([userId, createdAt])
  @@index([grantId, createdAt])
  @@map("uap_audit_entries")
}

model UAPKillSwitchEvent {
  id          String   @id @default(cuid())
  userId      String   @unique // one active kill per user; multiple historic
  initiatedAt DateTime @default(now())
  propagatedAt DateTime?
  affectedGrantIds String[]

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("uap_kill_switch_events")
}
```

---

## §10. Comparison Surface

```
                 MCP            BIP            PAP            EAP            UAP
                 ───            ───            ───            ───            ───
Connects         LLM ↔ tools    Apps emit      LLMs propose   LLMs act       LLMs act
                                state            interventions  per device     under standing
                                                                              authority
Consent grain    Per-tool       Per-app        Per-scope      Per-action     Per-grant
                                opt-out        per-partner    (irreversibles)  with rules
Lifetime         Session        Persistent     Per proposal   Per action     7d default,
                                                                              90d max
User present     Required       Required       Required       Required       NOT required
Audit            Per call       Per signal     Per proposal   Per action     Per execute
                                                                              + signed chain
Kill switch      Quit session   Uninstall      Per partner    Per action     GLOBAL, 5s
                                                                              propagation
Foundation lab   Anthropic      Open spec      Open spec      Open spec      Open spec
authorship       (ANT shipped)
```

---

## §11. Open Questions (v0.2 Tracking)

These were debated during the v0.1 design and intentionally deferred. The community is invited to weigh in:

1. **Cross-user grants.** Can user A grant their LLM authority over user B's calendar (e.g., spouse scheduling)? v0.1 says no — every grant is single-user. v0.2 may add a `delegated_authority` extension.
2. **Probabilistic rules.** Can a rule be "spending_cap of $50 unless model confidence is > 0.95"? v0.1 hard-rejects. v0.2 may permit, with audit.
3. **Multi-LLM concurrency.** What happens when Claude and GPT both hold active grants for the same scope simultaneously? v0.1: both honored independently; PAP coordinator dedupes conflicting proposals. v0.2 may add explicit primary-LLM designation.
4. **Hardware-bound grants.** Can a grant be device-restricted ("Claude can schedule events from this phone only")? v0.1: no; grants are user-level. v0.2 may add device-scoped grants.
5. **Inherited rules from EAP.** EAP has a `panic_active` global state; UAP currently checks it via the shared coordinator. Should UAP define its own panic semantics? v0.1: shared. v0.2 may differentiate.

---

## §12. The Strategic Read

The first three protocols (BIP, PAP, EAP) are about reading the user, proposing to the user, and acting through their devices *while the user is present*. They are necessary for behavioral interrupt. They are not sufficient for the next category of AI products.

The category that ships in 2026–2027 — every foundation lab is pointed at it — is autonomous AI that operates on behalf of the user without per-action presence. The unsolved problem in that category is not capability. It is consent, scope, audit, and kill switch. The capability exists today (Claude Computer Use, OpenAI Operator, Project Astra). The trust infrastructure does not.

UAP is the trust infrastructure. It is the layer that lets foundation labs ship agentic AI safely without each one inventing a brittle ad-hoc consent model. It is the layer regulators will demand once the first agentic-AI catastrophe makes the news. And it is the layer that — by virtue of being open-spec, audit-defaulted, and kill-switch-first — cannot be reasonably forked by any single foundation lab without losing the cross-LLM portability that gives it value.

A user grants standing authority once, through COYL. That grant works for Claude, for GPT, for Gemini, for any future LLM. The user owns the audit trail. The user owns the kill switch. The protocol is the trust contract, and the trust contract is the moat.

---

## §13. Status & Roadmap

- **v0.1** (today, this document) — Spec, namespace reservation, threat model, schema sketch. No reference engine. Implementations are encouraged; the COYL reference engine ships post-Series-A.
- **v0.2** — Cross-user delegation, probabilistic rules, device-scoped grants. Community input invited via GitHub issues.
- **v1.0** — Reference engine production-ready. Targeted for Q4 2026 alongside Series A close.

---

## §14. Acknowledgements

UAP-0.1 is published as part of the COYL protocol stack:

- BIP — Behavioral Interrupt Protocol (consumer-side substrate)
- PAP — Proactive Action Protocol (LLM behavioral interventions)
- EAP — Execution Action Protocol (cross-device LLM action)
- UAP — User-Authority Protocol (standing-authority layer) ← *this document*

All four published Apache 2.0 in this repository. The reference engine is proprietary; the specs are open. Same model as MCP, OAuth, HTTPS, Stripe.

Comments, issues, and PRs welcome at https://github.com/FutureEnterprises/chief-of-staff.
