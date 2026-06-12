/**
 * @coyl/protocol — wire types for the UAP + EAP protocol surfaces.
 *
 * Every type here is derived from the LIVE route handlers on coyl.ai,
 * NOT from the prose in docs/protocol/UAP-0.1.md. Where the two diverge,
 * the implementation wins (see SPEC_NOTES.md for the full list). The
 * spec doc's example payloads (`calendar.write`, `messaging.routine`,
 * `purchase.recurring` scopes) are illustrative only — the real scope
 * vocabulary is the `proactive_*` set below.
 *
 * Sources of truth:
 *   apps/web/src/lib/uap/types.ts          (scopes, rule kinds, decisions)
 *   apps/web/src/app/api/uap/v1/**         (request/response envelopes)
 *   apps/web/src/app/api/eap/v1/**         (device register/outcome)
 *   apps/desktop-macos/README.md           (pending-actions shape)
 *   apps/desktop-macos/COYLDesktop/Models  (device/action/outcome shapes)
 */

/* ════════════════════════════ UAP ════════════════════════════ */

/* ──────────────────── Scopes ──────────────────── */

/**
 * The nine standing-authority scopes the GRANT endpoint accepts.
 * Anything outside this set is rejected at GRANT time with
 * `unknown_scope`. Mirrors `UAP_SCOPES` in the reference engine.
 *
 * NOTE: these are NOT the `calendar.write` / `messaging.routine`
 * identifiers shown in UAP-0.1.md §5. The live engine reuses the
 * `proactive_*` scope vocabulary shared with PAP. See SPEC_NOTES.md #1.
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

/* ──────────────────── Reversibility ──────────────────── */

/**
 * The reversibility classes the EXECUTE/PRECHECK endpoints accept.
 *
 * NOTE: the live handler accepts a THIRD value, `reversible_within_window`,
 * that the spec doc never mentions. See SPEC_NOTES.md #5.
 */
export type Reversibility = 'reversible' | 'irreversible' | 'reversible_within_window'

/* ──────────────────── Irreversibility floor ──────────────────── */

/**
 * Actions that ALWAYS require per-action confirmation, even under a
 * standing grant. The engine returns `needs_per_action_confirmation`
 * (NOT `denied`) for these when reversibility === 'irreversible'.
 * Implementations may extend this list, never shrink it.
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

/* ──────────────────── Representation actions ──────────────────── */

/**
 * The subset of actions where the agent acts AS the user to another
 * human/system. A successful EXECUTE of one of these attaches a v0.1.1
 * provenance signature to the response and persists it on the audit row.
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
 * The rule kinds the `/rule` endpoint and inline grant rules accept.
 *
 * NOTE: the live set is broader than the three kinds the spec doc
 * shows (`spending_cap`, `quiet_hours`, `irreversible_floor`). See
 * SPEC_NOTES.md #6. Also note `frequency_cap` parses but is NOT yet
 * enforced by the coordinator (v0.2 follow-up).
 */
export type UAPRuleKind =
  | 'spending_cap'
  | 'quiet_hours'
  | 'irreversible_floor'
  | 'recipient_allowlist'
  | 'recipient_denylist'
  | 'frequency_cap'
  | 'time_of_day_block'

/** A rule as declared inline in a GRANT body or via POST /rule. */
export interface UAPRuleInput {
  kind: UAPRuleKind
  /**
   * Rule-specific parameters. Shapes the live coordinator reads:
   *   spending_cap        → { max_per_action_usd: number }
   *   quiet_hours         → { disabled?: boolean }  (opt-out marker only)
   *   recipient_allowlist → { allowed_recipients: string[] }
   *   recipient_denylist  → { denied_recipients: string[] }
   *   time_of_day_block   → { blocked_hours: number[] }  (0–23, UTC)
   *   irreversible_floor  → marker; floor is enforced regardless
   *   frequency_cap       → parsed, not yet enforced
   */
  params?: Record<string, unknown>
}

/* ──────────────────── Consent artifact ──────────────────── */

/**
 * The consent artifact every GRANT must carry. The engine REQUIRES
 * `user_response === 'explicit_grant'` or it rejects with
 * `consent_not_explicit`. The other fields are stored verbatim for
 * Trust & Safety replay; missing ones are defaulted server-side.
 */
export interface UAPConsentArtifact {
  version?: string
  shown_to_user_at?: string
  user_response: 'explicit_grant'
  ui_surface?: string
  [k: string]: unknown
}

/* ──────────────────── GRANT ──────────────────── */

export interface GrantRequest {
  user_id: string
  scopes: UAPScope[]
  /** ISO 8601 UTC. Must be in the future and ≤90 days out. */
  expires_at: string
  rules?: UAPRuleInput[]
  consent_artifact: UAPConsentArtifact
}

export interface GrantResponse {
  grant_id: string
  status: 'active'
  expires_at: string
  audit_url: string
  kill_switch_url: string
}

/* ──────────────────── GET grant ──────────────────── */

export type GrantLiveStatus = 'active' | 'revoked' | 'expired' | 'killed_globally'

export interface GetGrantResponse {
  grant_id: string
  user_id: string
  llm_partner_id: string
  scopes: UAPScope[]
  status: GrantLiveStatus
  expires_at: string
  created_at: string
  terminated_at: string | null
  termination_reason: string | null
  consent_artifact: unknown
  audit_url: string
  kill_switch_url: string
}

/**
 * DELETE /grant/[id] response. Note `status` is the lower-cased grant
 * status and the timestamp key is `terminatedAt` (camelCase) — an
 * inconsistency with the snake_case used elsewhere. See SPEC_NOTES.md #7.
 */
export interface RevokeGrantResponse {
  grant_id: string
  status: string
  terminatedAt: string | null
}

/* ──────────────────── EXECUTE / PRECHECK ──────────────────── */

export interface ExecuteAction {
  /** e.g. 'send_message', 'meal_suggestion', 'purchase'. */
  kind: string
  /** Domain-specific operation, e.g. 'schedule_event'. */
  operation: string
  reversibility: Reversibility
  params?: Record<string, unknown>
}

export interface ExecuteContext {
  trigger?: string
  /** 0..1. Below the engine's threshold the action is denied. */
  confidence?: number
  reasoning?: string
}

/** Recipient hint for representation actions (drives provenance + lists). */
export interface ExecuteRecipient {
  kind: 'external_email' | 'external_phone' | 'internal_user' | 'external_url' | 'external_handle'
  hint: string
}

export interface ExecuteRequest {
  grant_id: string
  action: ExecuteAction
  context?: ExecuteContext
  recipient?: ExecuteRecipient
}

/** Decision reasons the coordinator can return on a denial. */
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
  | 'rap_coaching_path_closed'

/** The provenance envelope returned on a successful representation EXECUTE. */
export interface ProvenanceEnvelope {
  payload: ProvenancePayload
  signature: string
  public_key: string
  algorithm: 'ed25519'
}

export interface ProvenancePayload {
  v: 'uap-0.1.1'
  agent: string
  subject: string
  grant_id: string
  audit_id: string
  action_kind: string
  recipient_hint: string
  issued_at: string
  audit_url: string
}

/**
 * Discriminated union for EXECUTE responses. The live handler returns
 * HTTP 200 for ALL decisions (allowed, denied, needs-confirmation) —
 * the decision lives in the body, not the status code. See SPEC_NOTES.md #4.
 */
export type ExecuteResponse =
  | {
      decision: 'allowed'
      audit_id: string
      executed_at: string
      /** Present only for representation actions. */
      provenance?: ProvenanceEnvelope
    }
  | {
      decision: 'denied'
      reason: UAPDenialReason
      detail?: string
      audit_id: string
      executed_at: string
    }
  | {
      decision: 'needs_per_action_confirmation'
      reason: 'irreversible' | 'rule_threshold'
      detail?: string
      audit_id: string
      executed_at: string
    }
  /**
   * Degenerate case: when the grant id is unknown the handler short-
   * circuits with a bare `{ decision: 'denied', reason: 'grant_not_found' }`
   * and NO audit_id (there is no grant to attach an audit row to).
   */
  | { decision: 'denied'; reason: 'grant_not_found' }

/**
 * PRECHECK returns the raw coordinator decision with NO audit_id /
 * executed_at / provenance — it is a pure, side-effect-free decision.
 */
export type PrecheckResponse =
  | { decision: 'allowed' }
  | { decision: 'denied'; reason: UAPDenialReason; detail?: string }
  | {
      decision: 'needs_per_action_confirmation'
      reason: 'irreversible' | 'rule_threshold'
      detail?: string
    }

/* ──────────────────── RULE ──────────────────── */

export interface DeclareRuleRequest {
  /** Omit / null for a user-level rule applying to every grant. */
  grant_id?: string | null
  kind: UAPRuleKind
  params?: Record<string, unknown>
}

export interface DeclareRuleResponse {
  rule_id: string
  kind: UAPRuleKind
  params: unknown
  applies_to: 'user' | 'grant'
  grant_id?: string
}

/* ──────────────────── AUDIT ──────────────────── */

export interface QueryAuditParams {
  /** Default 50, max 500. */
  limit?: number
  /** Filter to a specific grant. */
  grantId?: string
  /** ISO 8601 timestamp; entries on/after only. */
  since?: string
}

/** One persisted audit row, as returned by GET /audit. */
export interface UAPAuditEntryWire {
  id: string
  grantId: string
  userId: string
  llmPartnerId: string
  operation: string
  actionKind: string | null
  decision: string
  decisionReason: string | null
  postTermination: boolean
  signature: string
  prevHash: string | null
  provenanceSignature: string | null
  provenancePublicKey: string | null
  provenanceAlgorithm: string | null
  provenancePayload: ProvenancePayload | null
  createdAt: string
}

export interface QueryAuditResponse {
  entries: UAPAuditEntryWire[]
  /** Audit-chain integrity check. A `false` means tamper/corruption. */
  chain_valid: boolean
}

/* ──────────────────── KILL_SWITCH ──────────────────── */

export interface KillSwitchRequest {
  user_id: string
  reason?: string
}

export interface KillSwitchResponse {
  killed_at: string
  affected_grant_ids: string[]
  audit_url: string
}

/* ──────────────────── PROVENANCE (public) ──────────────────── */

export interface VerifyProvenanceResponse {
  audit_id: string
  payload: ProvenancePayload
  signature: string
  public_key: string
  algorithm: string
  grant_status: GrantLiveStatus | 'unknown'
  audit_chain: {
    prev_hash: string | null
    row_signature: string
  }
}

/* ════════════════════════════ EAP ════════════════════════════ */

/* ──────────────────── Device registration ──────────────────── */

export interface EAPManifest {
  /** Sensor keys this device emits, e.g. 'screen_state', 'battery'. */
  sensors: string[]
  /** Actuator keys, e.g. 'notification', 'voice_tts'. */
  actuators: string[]
  /** EAP scope strings the user has granted on this device. */
  userGrantedScopes: string[]
}

export interface EAPOperationalState {
  battery?: number
  doNotDisturb?: boolean
  foregroundApp?: string | null
  paused?: boolean
  pausedUntil?: string | null
  [k: string]: unknown
}

/** Body of POST /api/eap/v1/device/register. */
export interface EAPDeviceManifest {
  user_id: string
  device_class: string
  model?: string
  os?: string
  device_fingerprint: string
  manifest: EAPManifest
  operational_state?: EAPOperationalState
  push_token?: string
}

export interface EAPRegisterResponse {
  device: {
    id: string
    deviceClass: string
    paired: boolean
  }
}

/* ──────────────────── Pending actions (poll) ──────────────────── */

/**
 * One pending action, per the README "Server contract dependencies"
 * shape. `params` is intentionally untyped per-actuator JSON.
 */
export interface EAPPendingAction {
  id: string
  executionToken: string
  actuator: string
  params: Record<string, unknown>
  /** Nullable — the live route surfaces the DB column directly. */
  scopeRequested: string | null
  reasoning: string | null
  confidence: number | null
  /** ISO 8601, no fractional seconds (Swift JSONDecoder.iso8601 compat). */
  willExecuteAt: string
  ttlSeconds: number
  llmPartnerId: string | null
}

export interface EAPPendingActionsResponse {
  actions: EAPPendingAction[]
}

/* ──────────────────── Action outcome ──────────────────── */

export type EAPOutcome = 'executed' | 'failed' | 'rejected' | 'expired'

/** Body of POST /api/eap/v1/action/outcome. Keyed by executionToken. */
export interface EAPActionOutcome {
  outcome: EAPOutcome
  outcomeReason?: string
  userInteracted?: boolean
  deviceState?: Record<string, unknown>
  userTag?: string
}

/**
 * Outcome response. The live handler returns one of a few shapes; this
 * is the superset (all fields optional except `ok`).
 */
export interface EAPOutcomeResponse {
  ok: boolean
  outcome?: string
  outcomeAt?: string
  idempotent?: boolean
  conflict?: boolean
}

/* ──────────────────── Sensor publish ──────────────────── */

/**
 * Body of POST /api/eap/v1/sensor/{deviceId}/publish.
 *
 * The live handler's canonical envelope is `{ snapshot, asOf }`
 * (matching SensorPublisher.swift's `SnapshotPayload`). It also accepts
 * the alias `{ sensors, capturedAt }`. The SDK sends the canonical form.
 *
 * `snapshot` is an arbitrary string-keyed object mapping EAP sensor name
 * → value; the server stores it opaquely (clamped to ≤8KB serialized)
 * and does not constrain the per-sensor shape. See SPEC_NOTES.md #11.
 */
export interface EAPSensorSnapshot {
  /**
   * Map of sensor key → reading. Per-sensor value shape is device-class
   * specific, e.g. { battery: { percent: 82, charging: false },
   * foreground_app: { bundleId: 'com.apple.Safari' } }.
   */
  snapshot: Record<string, unknown>
  /** ISO 8601 capture time. Defaults to now server-side if omitted. */
  asOf?: string
}

export interface EAPSensorPublishResponse {
  ok: boolean
  [k: string]: unknown
}
