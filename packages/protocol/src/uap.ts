/**
 * @coyl/protocol — UAP (User-Authority Protocol) client.
 *
 * UAP is the standing-authority layer: a user issues a scoped, expiring,
 * rule-bounded GRANT to an LLM partner, and the partner acts under it
 * via PRECHECK / EXECUTE without per-action user presence. The user
 * retains a global KILL_SWITCH and a signed, queryable AUDIT trail.
 *
 * This client is the typed TypeScript projection of the LIVE route
 * handlers under `/api/uap/v1/*` on coyl.ai. Where the implementation
 * diverges from docs/protocol/UAP-0.1.md, the implementation wins; the
 * divergences are catalogued in SPEC_NOTES.md.
 *
 * ── Auth model (this is the trap most integrators fall into) ──────────
 *
 *   Endpoint                     Authenticated as
 *   ──────────────────────────   ────────────────────────────────────
 *   grant / precheck / execute   PARTNER  (Bearer coyl_uap_<id>_<secret>)
 *   getGrant                     PARTNER or USER (this client uses PARTNER)
 *   revokeGrant / declareRule    USER     (Clerk session — NOT partner)
 *   queryAudit                   USER     (Clerk session)
 *   killSwitch                   USER     (Clerk session — see method TSDoc)
 *   verifyProvenance             PUBLIC   (no auth — recipient-facing)
 *
 * The partner-authenticated methods work with just a `partnerToken`.
 * The user-authenticated methods (revoke, declareRule, queryAudit,
 * killSwitch) require a Clerk user session token, passed per-call —
 * a partner Bearer token will get a 401 on those surfaces.
 */

import { httpRequest, normalizeBaseUrl } from './http'
import type {
  GrantRequest,
  GrantResponse,
  GetGrantResponse,
  RevokeGrantResponse,
  ExecuteRequest,
  ExecuteResponse,
  PrecheckResponse,
  DeclareRuleRequest,
  DeclareRuleResponse,
  QueryAuditParams,
  QueryAuditResponse,
  KillSwitchResponse,
  VerifyProvenanceResponse,
} from './types'

export interface UAPClientOptions {
  /** Base origin of the COYL coordinator. Defaults to production. */
  baseUrl?: string
  /**
   * The partner Bearer secret, wire format `coyl_uap_<partnerId>_<secret>`.
   * Minted via the admin endpoint POST
   * /api/admin/llm-partners/{id}/mint-uap-key (see README). Required for
   * the partner-authenticated methods (grant / precheck / execute /
   * getGrant). May be omitted if you only call public/user methods.
   */
  partnerToken?: string
}

const DEFAULT_BASE_URL = 'https://www.coyl.ai'

export class UAPClient {
  private readonly baseUrl: string
  private readonly partnerToken?: string

  constructor(options: UAPClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.partnerToken = options.partnerToken
  }

  /** Bearer header for partner-authenticated calls. Throws if absent. */
  private partnerAuth(): string {
    if (!this.partnerToken) {
      throw new Error(
        'UAPClient: partnerToken is required for this call. Pass it to the constructor.'
      )
    }
    return `Bearer ${this.partnerToken}`
  }

  /* ──────────────────── GRANT ──────────────────── */

  /**
   * Issue a new standing grant (PARTNER-authenticated).
   *
   * The engine validates: every scope is in UAP_SCOPES, `expires_at` is
   * in the future and ≤90 days out, and `consent_artifact.user_response
   * === 'explicit_grant'`. Returns 201 with the grant handle + audit /
   * kill-switch URLs.
   *
   * @throws CoylProtocolError on validation failure (e.g. `unknown_scope`,
   *   `expires_too_far`, `consent_not_explicit`).
   */
  async grant(req: GrantRequest): Promise<GrantResponse> {
    return httpRequest<GrantResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/uap/v1/grant',
      authorization: this.partnerAuth(),
      body: req,
    })
  }

  /**
   * Read grant metadata + live status (PARTNER-authenticated here).
   *
   * Status is computed on read — an expired grant flips to `expired`
   * even before the sweeper notices. The endpoint also accepts a user
   * Clerk session, but this client always calls it as the partner.
   */
  async getGrant(grantId: string): Promise<GetGrantResponse> {
    return httpRequest<GetGrantResponse>(this.baseUrl, {
      method: 'GET',
      path: `/api/uap/v1/grant/${encodeURIComponent(grantId)}`,
      authorization: this.partnerAuth(),
    })
  }

  /**
   * Revoke a single grant (USER-authenticated — NOT the partner).
   *
   * Per UAP §3 only the user can take their authority back. Pass the
   * user's Clerk session token. Idempotent: re-revoking a terminal grant
   * returns its current state.
   */
  async revokeGrant(grantId: string, userSessionToken: string): Promise<RevokeGrantResponse> {
    return httpRequest<RevokeGrantResponse>(this.baseUrl, {
      method: 'DELETE',
      path: `/api/uap/v1/grant/${encodeURIComponent(grantId)}`,
      authorization: `Bearer ${userSessionToken}`,
    })
  }

  /* ──────────────────── PRECHECK / EXECUTE ──────────────────── */

  /**
   * Ask "would this action be allowed right now?" (PARTNER-authenticated).
   *
   * Pure decision — NO audit row, NO side effects. Returns the bare
   * coordinator decision (allowed / denied / needs_per_action_confirmation)
   * with no audit_id. Always HTTP 200 even for a denial.
   */
  async precheck(req: ExecuteRequest): Promise<PrecheckResponse> {
    return httpRequest<PrecheckResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/uap/v1/precheck',
      authorization: this.partnerAuth(),
      body: req,
    })
  }

  /**
   * Execute an action under a grant (PARTNER-authenticated).
   *
   * Re-validates the grant server-side on every call (no cached grants).
   * Writes exactly one signed audit row regardless of outcome. Returns:
   *   - allowed → { decision, audit_id, executed_at, provenance? }
   *   - denied  → { decision, reason, detail?, audit_id, executed_at }
   *   - needs_per_action_confirmation → same shape as denied, reason
   *     'irreversible' | 'rule_threshold'
   *
   * IMPORTANT: a denial is a HTTP-200 success carrying a `decision`, NOT
   * a thrown error. Branch on `res.decision`. CoylProtocolError is only
   * thrown for transport/auth/validation failures (4xx/5xx).
   *
   * For representation actions (send_message, calendar_rsvp, payment, …)
   * with reversibility 'irreversible', the floor returns
   * needs_per_action_confirmation — that fail-closed behaviour is the
   * point of the protocol.
   */
  async execute(req: ExecuteRequest): Promise<ExecuteResponse> {
    return httpRequest<ExecuteResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/uap/v1/execute',
      authorization: this.partnerAuth(),
      body: req,
    })
  }

  /* ──────────────────── RULE ──────────────────── */

  /**
   * Declare a pre-decline rule (USER-authenticated).
   *
   * Negative authority precedes positive: a rule supersedes overlapping
   * grants, even fresh ones. Omit `grant_id` for a user-level rule that
   * applies to every grant. Requires the user's Clerk session token.
   */
  async declareRule(
    req: DeclareRuleRequest,
    userSessionToken: string
  ): Promise<DeclareRuleResponse> {
    return httpRequest<DeclareRuleResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/uap/v1/rule',
      authorization: `Bearer ${userSessionToken}`,
      body: req,
    })
  }

  /* ──────────────────── AUDIT ──────────────────── */

  /**
   * Read the user's UAP audit history (USER-authenticated).
   *
   * Returns the rows (oldest first) plus `chain_valid` — the audit-chain
   * integrity result. A `false` is a critical tamper/corruption signal.
   * Requires the user's Clerk session token.
   */
  async queryAudit(
    params: QueryAuditParams,
    userSessionToken: string
  ): Promise<QueryAuditResponse> {
    return httpRequest<QueryAuditResponse>(this.baseUrl, {
      method: 'GET',
      path: '/api/uap/v1/audit',
      authorization: `Bearer ${userSessionToken}`,
      query: {
        limit: params.limit,
        grantId: params.grantId,
        since: params.since,
      },
    })
  }

  /* ──────────────────── KILL_SWITCH ──────────────────── */

  /**
   * Global kill — revoke ALL grants across ALL LLM partners in one shot.
   *
   * USER-authenticated, NOT partner-authenticated: per UAP-0.1 §5 the
   * kill switch is the user's primitive. A partner Bearer token will be
   * rejected with 401 here. Pass the user's Clerk session token and the
   * user's id (the engine asserts they match — you can only kill your
   * own standing authority).
   *
   * Returns ≤1s; flips every active grant to KILLED_GLOBALLY and rotates
   * the user's provenance signing key (so outstanding provenance
   * signatures stop verifying).
   */
  async killSwitch(args: {
    userSessionToken: string
    userId: string
    reason?: string
  }): Promise<KillSwitchResponse> {
    return httpRequest<KillSwitchResponse>(this.baseUrl, {
      method: 'POST',
      path: '/api/uap/v1/kill-switch',
      authorization: `Bearer ${args.userSessionToken}`,
      body: { user_id: args.userId, reason: args.reason },
    })
  }

  /* ──────────────────── PROVENANCE (public) ──────────────────── */

  /**
   * Verify a representation action's provenance signature (PUBLIC — no
   * auth). This is the recipient-facing endpoint: a Gmail server, a
   * Slack bot, or the human in those inboxes fetches it to confirm "this
   * message really was authored by <agent> on behalf of <user>, with
   * consent" and that the grant is still active.
   *
   * Returns the payload, the user's public key, the grant status, and
   * the audit-chain entry. A 404 means the audit id either doesn't exist
   * or is not a signed representation action.
   *
   * Only audit ids of the form `aud_<24 hex>` are accepted; anything
   * else returns 404 (so the endpoint can't be used as a format oracle).
   */
  async verifyProvenance(auditId: string): Promise<VerifyProvenanceResponse> {
    return httpRequest<VerifyProvenanceResponse>(this.baseUrl, {
      method: 'GET',
      path: `/api/uap/v1/provenance/${encodeURIComponent(auditId)}`,
      // No Authorization header — this endpoint is intentionally public.
    })
  }
}
