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

export type UAPRuleKind =
  | 'spending_cap'
  | 'quiet_hours'
  | 'irreversible_floor'
  | 'recipient_allowlist'
  | 'recipient_denylist'
  | 'frequency_cap'
  | 'time_of_day_block'

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
  grantId: string
  userId: string
  llmPartnerId: string
  operation: 'execute' | 'precheck' | 'grant' | 'revoke' | 'kill' | 'expire'
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
