/**
 * UAP — User-Authority Protocol v0.1.1 shared type contract.
 *
 * The contract every UAP module (grant-store, coordinator, kill-switch,
 * audit, partner-auth, provenance) implements against. Lives in one
 * file so the 8 parallel agents building the reference engine don't
 * diverge on field names, enum values, or decision shapes.
 *
 * Mirrors the Prisma models (UAPGrant, UAPRule, UAPAuditEntry,
 * UAPKillSwitchEvent) but adds the in-flight decision + envelope
 * types that don't persist as their own rows.
 *
 * See docs/protocol/UAP-0.1.md for the canonical spec; this file is
 * the TypeScript projection.
 */

import type { UAPGrant, UAPRule, UAPAuditEntry, UAPGrantStatus } from '@repo/database'

/* ──────────────────── Scope identifiers ──────────────────── */

/**
 * The nine standing-authority scopes. Anything outside this set is
 * rejected at GRANT time with `unknown_scope`. Extending the set is a
 * v0.2 decision — not a partner-time decision.
 */
export const UAP_SCOPES = [
  'proactive_food',
  'proactive_focus',
  'proactive_relational',
  'proactive_sleep',
  'proactive_purchase',
  'proactive_recovery',
  'proactive_substance',
  'proactive_mood',
  'read',
] as const

export type UAPScope = (typeof UAP_SCOPES)[number]

/* ──────────────────── Action kinds ──────────────────── */

/**
 * Irreversibility floor — actions that ALWAYS require per-action
 * confirmation, even under a standing grant. Per UAP-0.1.md §3 + the
 * irreversibility-floor companion doc. Implementations MAY extend
 * (more actions confirm-required), never shrink (these always confirm).
 */
export const UAP_IRREVERSIBLE_FLOOR = [
  'money_transfer',
  'purchase',
  'send_message',
  'public_post',
  'share_pii',
  'delete_account',
  'destroy_data',
  'grant_authority_to_third_party',
] as const

export type UAPIrreversibleAction = (typeof UAP_IRREVERSIBLE_FLOOR)[number]

/**
 * Representation actions — the subset of actions where the agent acts
 * AS the user to another human/system. These REQUIRE a v0.1.1
 * provenance signature on the outgoing payload.
 */
export const UAP_REPRESENTATION_ACTIONS = [
  'send_message',
  'calendar_rsvp',
  'public_post',
  'payment',
  'share',
  'dm_send',
  'comment_post',
] as const

export type UAPRepresentationAction = (typeof UAP_REPRESENTATION_ACTIONS)[number]

/* ──────────────────── Rule kinds ──────────────────── */

/**
 * Every rule kind UAP-0.1.1 recognizes, as a RUNTIME value. The type
 * union below is derived from this tuple, not written separately — so
 * there is exactly one place a kind is declared and the runtime set can
 * never drift from the compile-time union.
 *
 * Why the runtime form matters: the coordinator now fails CLOSED on a
 * rule kind it cannot evaluate (`rule_unevaluable`). A kind added here
 * with no matching `case` in coordinator.ts would therefore deny every
 * action on any grant carrying it — a silent brick instead of a silent
 * bypass. `UAP_COORDINATOR_HANDLED_RULE_KINDS` in coordinator.ts is the
 * mirror set, and a drift test asserts the two are equal, so adding a
 * kind here without wiring the case fails CI rather than production.
 */
export const UAP_RULE_KINDS = [
  'spending_cap',
  'quiet_hours',
  'irreversible_floor',
  'recipient_allowlist',
  'recipient_denylist',
  'frequency_cap',
  'time_of_day_block',
] as const

export type UAPRuleKind = (typeof UAP_RULE_KINDS)[number]

const UAP_RULE_KIND_SET: ReadonlySet<string> = new Set<string>(UAP_RULE_KINDS)

/**
 * Runtime guard for a persisted `UAPRule.kind` (a bare `string` column
 * — Prisma does not constrain it, and a row could predate this version
 * of the protocol or have been written by an older/newer deploy).
 */
export function isUAPRuleKind(kind: unknown): kind is UAPRuleKind {
  return typeof kind === 'string' && UAP_RULE_KIND_SET.has(kind)
}

/* ──────────────────── Consent provenance class ──────────────────── */

/**
 * How the consent behind a grant was obtained — the trust class of the
 * grant itself, distinct from its scopes.
 *
 *   coordinator_verified — the consent artifact was produced by a
 *     COYL-hosted ceremony (/consent/uap) under the USER'S OWN
 *     authenticated session. COYL saw the user say yes.
 *
 *   partner_attested — an LLM partner called POST /api/uap/v1/grant
 *     with its own Bearer key and told us the user consented. COYL has
 *     the partner's word and nothing else. This is the T8 residual in
 *     UAP-0.1.md §6: the artifact is self-reported by the party that
 *     benefits from it.
 *
 * Enforcement (coordinator step 12.5): a `partner_attested` grant may
 * not authorize any irreversibility-floor action.
 */
export const UAP_CONSENT_CLASSES = [
  'coordinator_verified',
  'partner_attested',
] as const

export type UAPConsentClass = (typeof UAP_CONSENT_CLASSES)[number]

/* ──────────────────── Coordinator decision envelope ──────────────────── */

export type UAPDecision =
  | { decision: 'allowed' }
  | {
      decision: 'denied'
      reason: UAPDenialReason
      detail?: string
    }
  | {
      decision: 'needs_per_action_confirmation'
      reason: 'irreversible' | 'rule_threshold'
      detail?: string
    }

export type UAPDenialReason =
  | 'grant_not_found'
  | 'grant_expired'
  | 'grant_revoked'
  | 'grant_killed_globally'
  | 'scope_violation'
  | 'rule_violation'
  /** The engine could not EVALUATE a rule (unknown kind, malformed or
   *  type-wrong params, missing evaluation input). Negative authority
   *  fails closed: a rule we cannot check is not a rule we can prove
   *  the action satisfies. Distinct from `rule_violation`, which means
   *  the rule WAS evaluated and the action lost. */
  | 'rule_unevaluable'
  /** A `frequency_cap` rule's trailing-window count is at or over max. */
  | 'frequency_cap_exceeded'
  /** The grant's consent was partner-attested, and the requested action
   *  is in the irreversibility floor — a class of action that requires
   *  coordinator-verified consent. */
  | 'consent_class_insufficient'
  | 'panic_active'
  | 'quiet_hours'
  | 'rate_limited'
  | 'confidence_too_low'
  | 'unknown_scope'
  | 'invalid_input'
  | 'partner_not_authorized'
  /** RAP CRISIS_INDICATION or LEGAL_OR_MEDICAL_EMERGENCY closed the
   *  coaching path. Supersedes every grant per RAP-0.1 §2. Mirrors PAP
   *  coordinator's `rap_coaching_path_closed` denial reason. */
  | 'rap_coaching_path_closed'

/* ──────────────────── Inputs ──────────────────── */

/**
 * Input shape every coordinator call takes. Shared between PRECHECK
 * (no side effects) and EXECUTE (persists audit row).
 */
export type UAPExecuteInput = {
  grantId: string
  partnerId: string
  userId: string
  action: {
    kind: string
    operation: string
    reversibility: 'reversible' | 'irreversible' | 'reversible_within_window'
    params?: Record<string, unknown>
  }
  context?: {
    trigger?: string
    confidence?: number
    reasoning?: string
  }
  /** When acting AS the user to a third party (representation), the
   *  partner declares the recipient hint here. Drives the provenance
   *  signature payload and the recipient-allowlist rule check. */
  recipient?: {
    kind: 'external_email' | 'external_phone' | 'internal_user' | 'external_url' | 'external_handle'
    hint: string
  }
}

/* ──────────────────── Provenance envelope (v0.1.1) ──────────────────── */

/**
 * The ed25519-signed payload attached to every representation action.
 * Recipients verify the signature against the user_public_key returned
 * by GET /api/uap/v1/provenance/{audit_id}.
 *
 * See UAP-0.1.md §5.5 for the canonical wire format.
 */
export type UAPProvenancePayload = {
  v: 'uap-0.1.1'
  agent: string             // partner id (e.g. "anthropic-claude-opus-4")
  subject: string           // did:coyl:<userId>
  grant_id: string
  audit_id: string
  action_kind: string
  recipient_hint: string
  issued_at: string         // ISO 8601 UTC
  audit_url: string
}

export type UAPProvenanceSignature = {
  payload: UAPProvenancePayload
  signature: string         // base64 ed25519 signature
  publicKey: string         // base64 ed25519 public key (user's signing key)
  algorithm: 'ed25519'
}

/* ──────────────────── Audit chain ──────────────────── */

/**
 * The signed audit row before it's persisted. The signature is over
 * the canonical-JSON of every field EXCEPT signature + id. prev_hash
 * is sha256 of the previous audit row's signature, forming a chain.
 */
export type UAPAuditInput = {
  /** Optional externally-minted row id (`aud_<24 hex>`). The execute
   *  route pre-mints this so the id can be embedded in the provenance
   *  payload BEFORE signing; writeAuditEntry persists it verbatim so
   *  GET /api/uap/v1/provenance/{audit_id} resolves the same id the
   *  recipient holds. When omitted, Prisma mints a cuid. */
  auditId?: string
  grantId: string
  userId: string
  llmPartnerId: string
  /** `consume` = a single-use execution receipt was redeemed at the
   *  effect choke point (lib/uap/execution-receipt.ts). The row IS the
   *  consumption record: its primary key is derived from the receipt,
   *  so the insert itself is the atomic once-only claim. */
  operation:
    | 'execute'
    | 'precheck'
    | 'grant'
    | 'revoke'
    | 'kill'
    | 'expire'
    | 'consume'
  actionKind?: string
  decision: UAPDecision['decision']
  decisionReason?: string
  postTermination: boolean
  // Provenance fields (representation actions only, v0.1.1)
  provenanceSignature?: string
  provenancePublicKey?: string
  provenanceAlgorithm?: 'ed25519'
  provenancePayload?: UAPProvenancePayload
}

/* ──────────────────── Re-exports for ergonomics ──────────────────── */

export type { UAPGrant, UAPRule, UAPAuditEntry, UAPGrantStatus }
