/**
 * UAP coordinator — pure decision engine for EXECUTE inputs.
 *
 * Takes a UAPExecuteInput plus an injected `UAPDeps` bundle and returns
 * a UAPDecision. The function intentionally has NO imports from sibling
 * lib/uap modules (grant-store, kill-switch, audit, partner-auth) so the
 * eight parallel agents building the reference engine compile cleanly in
 * their own worktrees. The route handler (A7) wires real implementations
 * for the deps; tests pass fakes.
 *
 * Why dependency injection: every sibling module is mid-flight. If this
 * file imported them, every worktree would either need to stub them or
 * have a tsc error. DI keeps each unit independently buildable.
 *
 * Decision tree — deny-first, first match wins, ordered cheapest →
 * most-expensive so cheap denies short-circuit before DB hits we can
 * avoid. See docs/protocol/UAP-0.1.md §3 (hard invariants) + §7
 * (coordinator sketch) for the spec this implements.
 *
 *   1.  Grant not found
 *   2.  Partner ID mismatch (grant doesn't belong to this partner)
 *   3.  User ID mismatch (grant doesn't belong to this user)
 *   4.  Grant status not ACTIVE (revoked / expired / killed)
 *   5.  Expiry recheck — handles status-flip lag (cron not run yet)
 *   6.  Global kill switch (user-wide)
 *   7.  Panic active
 *   8.  Quiet hours (with quiet_hours rule opt-out aware)
 *   9.  Scope mismatch (per ACTION_SCOPE_MAP)
 *   10. Confidence below DEFAULT_CONFIDENCE_THRESHOLD
 *   11. Partner rate limit (cheap last because it's two DB counts)
 *   12. Rule evaluation (spending_cap, recipient lists, time_of_day_block)
 *   13. Irreversibility floor → needs_per_action_confirmation
 *   14. Allowed
 *
 * The PAP coordinator's panic / quiet-hours / rate-limit primitives are
 * reused via the injected deps — same semantics, different call sites.
 * DEFAULT_CONFIDENCE_THRESHOLD is imported directly because it's a
 * pure constant (no DB / no sibling module risk).
 */

// Pure constant import only — no behavior, no module-loading cost,
// no risk of breaking sibling worktrees. Keeps the threshold canonical
// across PAP + UAP so a user's confidence floor means the same thing in
// both layers.
import { DEFAULT_CONFIDENCE_THRESHOLD } from '../coordinator/confidence-gate'
import {
  UAP_IRREVERSIBLE_FLOOR,
  type UAPExecuteInput,
  type UAPDecision,
  type UAPGrant,
  type UAPRule,
  type UAPScope,
  type UAPRuleKind,
  type UAPIrreversibleAction,
} from './types'

/* ──────────────────── Dependency contract ──────────────────── */

/**
 * The dependency bundle the coordinator needs. The route handler (A7)
 * supplies real implementations backed by lib/uap/grant-store,
 * lib/uap/kill-switch, lib/coordinator/panic-check, etc. Tests supply
 * fakes.
 *
 * Every async dep returns a settled value — the coordinator never
 * needs to know about error shapes. If a dep wants to signal "couldn't
 * check," it should resolve to the safe-deny value (e.g. true for
 * killed, true for panic, false for rate-allowed).
 */
export type UAPDeps = {
  /** Load a grant with its rules merged in (grant-scoped + user-level
   *  rules where grantId IS NULL). Returns null if the grant id is
   *  unknown — DO NOT throw. */
  loadGrantWithRules: (
    grantId: string,
  ) => Promise<(UAPGrant & { rules: UAPRule[] }) | null>

  /** Global kill switch — fired once, denies every grant for the user
   *  from now until the end of time. Distinct from per-grant status,
   *  which only kills one. */
  isUserKilledGlobally: (userId: string) => Promise<boolean>

  /** Reuses the PAP coordinator's panic-check primitive. Same row,
   *  same semantics — a panic active in PAP must also block UAP. */
  isPanicActive: (userId: string, asOf: Date) => Promise<boolean>

  /** Reuses the PAP coordinator's quiet-hours primitive. */
  isInQuietHours: (userId: string, asOf: Date) => Promise<boolean>

  /** Partner-scoped rate limit. Shape mirrors the PAP coordinator's
   *  RateLimitCheck so the route handler can reuse the same primitive
   *  with the UAP partner id. */
  checkPartnerRateLimit: (
    partnerId: string,
    userId: string,
    asOf: Date,
  ) => Promise<{
    allowed: boolean
    band?: string
    remaining?: number
    resetAt?: Date
  }>

  /** Test-injectable clock. Default `() => new Date()`. */
  now?: () => Date

  /** RAP coaching-path gate. If the user is in a closed coaching-path
   *  window (CRISIS_INDICATION or LEGAL_OR_MEDICAL_EMERGENCY recently
   *  classified by RAP), every UAP EXECUTE must deny with
   *  `rap_coaching_path_closed` — RAP supersedes every grant per
   *  RAP-0.1.md §2.
   *
   *  Optional: if not provided, the route handler is expected to wire
   *  in `isUserCoachingPathClosed` from `@/lib/rap/store`. Tests can
   *  inject a fake. Mirrors PAP coordinator's
   *  EvaluateProposalDeps.isUserCoachingPathClosed. */
  isUserCoachingPathClosed?: (userId: string) => Promise<boolean>
}

/* ──────────────────── Action-kind → scope mapping ──────────────────── */

/**
 * Maps every action kind the protocol recognizes to the standing-
 * authority scope that gates it. If a kind isn't in this map, the
 * coordinator denies with `unknown_scope` — partners can't invent new
 * kinds without a spec amendment.
 *
 * Lives here (not in types.ts) because it's a coordinator-policy
 * decision, not a shared contract. A future v0.2 may reshape the map
 * without breaking the type surface.
 */
const ACTION_SCOPE_MAP: Record<string, UAPScope> = {
  // proactive_food
  food_intervention: 'proactive_food',
  meal_suggestion: 'proactive_food',
  kitchen_callout: 'proactive_food',
  // proactive_focus
  focus_callout: 'proactive_focus',
  tab_intervention: 'proactive_focus',
  meeting_prep_reminder: 'proactive_focus',
  // proactive_relational
  send_message: 'proactive_relational',
  dm_send: 'proactive_relational',
  comment_post: 'proactive_relational',
  public_post: 'proactive_relational',
  calendar_rsvp: 'proactive_relational',
  share: 'proactive_relational',
  // proactive_sleep
  sleep_callout: 'proactive_sleep',
  bedtime_routine: 'proactive_sleep',
  // proactive_purchase
  purchase: 'proactive_purchase',
  payment: 'proactive_purchase',
  // proactive_recovery
  recovery_callout: 'proactive_recovery',
  // proactive_substance
  substance_callout: 'proactive_substance',
  // proactive_mood
  mood_check: 'proactive_mood',
  // read
  read_context: 'read',
}

/* ──────────────────── Helpers ──────────────────── */

/**
 * The irreversibility floor as a Set for O(1) membership — UAP-0.1.md §3
 * mandates these always confirm regardless of standing authority. The
 * floor list is canonical in types.ts; this is just the lookup form.
 */
const IRREVERSIBLE_FLOOR_SET: Set<string> = new Set(UAP_IRREVERSIBLE_FLOOR)

function isIrreversibleFloorAction(kind: string): kind is UAPIrreversibleAction {
  return IRREVERSIBLE_FLOOR_SET.has(kind)
}

/**
 * Find a rule of a given kind in the grant's merged rule list. Rules
 * are unordered; first match wins for kinds where duplicates are
 * meaningless (quiet_hours opt-out, time_of_day_block). Callers that
 * need every match should filter directly.
 */
function findRule(rules: UAPRule[], kind: UAPRuleKind): UAPRule | undefined {
  return rules.find((r) => r.kind === kind)
}

/**
 * Did the user explicitly opt OUT of quiet-hours enforcement for this
 * grant? In v1 a quiet_hours rule with `{ disabled: true }` skips the
 * gate. Anything else (rule absent, rule with disabled !== true) means
 * "enforce." Errs on the side of enforcing — silent fail is the safe
 * default for a quiet-hours check.
 */
function quietHoursDisabledByRule(rules: UAPRule[]): boolean {
  const rule = findRule(rules, 'quiet_hours')
  if (!rule) return false
  const params = (rule.params ?? {}) as { disabled?: unknown }
  return params.disabled === true
}

/**
 * Coerce a rule.params field to a finite number. Returns undefined when
 * the value is missing, NaN, ±Infinity, or non-numeric — the caller
 * skips the check when the threshold is unparseable rather than
 * silently denying with a bogus comparison.
 */
function asNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
}

/**
 * Coerce a rule.params field to a string array. Returns undefined when
 * the value is not an array of strings — callers skip the check rather
 * than rendering an empty allowlist (which would deny everything) or a
 * malformed denylist (which would deny nothing). The strict v1 stance:
 * if the rule is malformed, log nothing here (audit is a sibling
 * concern) and don't enforce. The grant-store should reject malformed
 * rules at write time.
 */
function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  if (!value.every((v) => typeof v === 'string')) return undefined
  return value as string[]
}

/* ──────────────────── Coordinator ──────────────────── */

export async function decideExecute(
  input: UAPExecuteInput,
  deps: UAPDeps,
): Promise<UAPDecision> {
  const now = (deps.now ?? (() => new Date()))()

  // ── 0. RAP coaching-path supersedes every grant ───────────────────
  // Per RAP-0.1.md §2, CRISIS_INDICATION or LEGAL_OR_MEDICAL_EMERGENCY
  // closes the coaching path. UAP standing-authority EXECUTEs MUST
  // refuse during that window — RAP supersedes every grant, every
  // rule, every kill-switch grace period. We check this BEFORE loading
  // the grant so a closed coaching path can't be probed against grant
  // existence (information disclosure mitigation, symmetric to step 2).
  //
  // Mirrors PAP coordinator's gate-0 RAP check (see lib/coordinator/
  // index.ts evaluateProposal). When `deps.isUserCoachingPathClosed`
  // is omitted (test or partial wiring), the gate is skipped — the
  // production route handlers wire in lib/rap/store#isUserCoachingPathClosed.
  if (deps.isUserCoachingPathClosed) {
    let closed = false
    try {
      closed = await deps.isUserCoachingPathClosed(input.userId)
    } catch {
      // Fail-open on a RAP read error: don't block a legitimate UAP
      // EXECUTE because the RAP store had a transient outage. PAP uses
      // the same posture. If RAP availability becomes critical, flip
      // to fail-closed here and update the threat model.
      closed = false
    }
    if (closed) {
      return { decision: 'denied', reason: 'rap_coaching_path_closed' }
    }
  }

  // ── 1. Grant exists? ──────────────────────────────────────────────
  const grant = await deps.loadGrantWithRules(input.grantId)
  if (!grant) {
    return { decision: 'denied', reason: 'grant_not_found' }
  }

  // ── 2. Partner authorized for this grant? ─────────────────────────
  // Partner mismatch and user mismatch both collapse to
  // `partner_not_authorized` — we deliberately don't leak whether the
  // grant exists for a *different* user (information disclosure).
  if (grant.llmPartnerId !== input.partnerId) {
    return { decision: 'denied', reason: 'partner_not_authorized' }
  }

  // ── 3. User matches the grant? ────────────────────────────────────
  if (grant.userId !== input.userId) {
    return { decision: 'denied', reason: 'partner_not_authorized' }
  }

  // ── 4. Grant status ───────────────────────────────────────────────
  // Anything other than ACTIVE maps to a terminal denial. We separate
  // the three terminal states so the partner gets actionable feedback
  // (revoked → ask the user to re-grant; expired → start renewal flow;
  // killed → escalation path is different).
  if (grant.status !== 'ACTIVE') {
    if (grant.status === 'REVOKED_BY_USER') {
      return { decision: 'denied', reason: 'grant_revoked' }
    }
    if (grant.status === 'EXPIRED') {
      return { decision: 'denied', reason: 'grant_expired' }
    }
    if (grant.status === 'KILLED_GLOBALLY') {
      return { decision: 'denied', reason: 'grant_killed_globally' }
    }
    // Defensive default for any future status value we don't recognize
    // — fail closed.
    return {
      decision: 'denied',
      reason: 'grant_revoked',
      detail: `unknown status ${String(grant.status)}`,
    }
  }

  // ── 5. Expiry recheck ─────────────────────────────────────────────
  // Even when status is still ACTIVE in the DB, the wall clock may
  // have crossed expiresAt before the expiry cron flipped the row.
  // Per UAP-0.1.md §3, hard expiry is the floor — never relax it.
  if (grant.expiresAt.getTime() < now.getTime()) {
    return { decision: 'denied', reason: 'grant_expired' }
  }

  // ── 6. Global kill switch ─────────────────────────────────────────
  // Per UAP-0.1.md §3: KILL_SWITCH supersedes every grant. We check
  // this even when grant.status === ACTIVE because the global kill
  // may be newer than the row's status flip.
  if (await deps.isUserKilledGlobally(input.userId)) {
    return { decision: 'denied', reason: 'grant_killed_globally' }
  }

  // ── 7. Panic ─────────────────────────────────────────────────────
  // Reuses the PAP panic-check primitive. A panic active for the user
  // blocks UAP exactly the same way it blocks PAP — there is one
  // panic state per user, shared across all protocol layers.
  if (await deps.isPanicActive(input.userId, now)) {
    return { decision: 'denied', reason: 'panic_active' }
  }

  // ── 8. Quiet hours ───────────────────────────────────────────────
  // Opt-out aware: a `quiet_hours` rule with `{ disabled: true }` on
  // this grant disables enforcement for the grant. For v1 the rule is
  // opt-out only (presence means "use defaults"); no per-grant
  // customization of the window. The user-level quiet-hours window
  // lives on the User row and is read by deps.isInQuietHours.
  if (!quietHoursDisabledByRule(grant.rules)) {
    if (await deps.isInQuietHours(input.userId, now)) {
      return { decision: 'denied', reason: 'quiet_hours' }
    }
  }

  // ── 9. Scope mapping & match ─────────────────────────────────────
  // Unknown action kind → unknown_scope (NOT scope_violation), because
  // the partner sent something we don't recognize at all. scope_violation
  // is for kinds we recognize that fall outside the grant.
  const requiredScope = ACTION_SCOPE_MAP[input.action.kind]
  if (!requiredScope) {
    return {
      decision: 'denied',
      reason: 'unknown_scope',
      detail: `action_kind ${input.action.kind} not mapped`,
    }
  }
  if (!grant.scopes.includes(requiredScope)) {
    return {
      decision: 'denied',
      reason: 'scope_violation',
      detail: `action_kind ${input.action.kind} requires scope ${requiredScope}, grant has [${grant.scopes.join(',')}]`,
    }
  }

  // ── 10. Confidence ──────────────────────────────────────────────
  // Only enforced when the partner attached a score. An undefined
  // confidence passes through (the partner opted out of scoring) — the
  // same semantics as the PAP confidence gate.
  const confidence = input.context?.confidence
  if (confidence !== undefined && confidence < DEFAULT_CONFIDENCE_THRESHOLD) {
    return {
      decision: 'denied',
      reason: 'confidence_too_low',
      detail: `score=${confidence} threshold=${DEFAULT_CONFIDENCE_THRESHOLD}`,
    }
  }

  // ── 11. Rate limit ──────────────────────────────────────────────
  // Last DB hit. If we got here, every cheaper check has passed and
  // it's worth burning the two count queries.
  const rate = await deps.checkPartnerRateLimit(input.partnerId, input.userId, now)
  if (!rate.allowed) {
    const detailParts: string[] = []
    if (rate.band) detailParts.push(`band=${rate.band}`)
    if (rate.resetAt) detailParts.push(`resetAt=${rate.resetAt.toISOString()}`)
    return {
      decision: 'denied',
      reason: 'rate_limited',
      detail: detailParts.length ? detailParts.join(' ') : undefined,
    }
  }

  // ── 12. Rule evaluation ─────────────────────────────────────────
  // Walk the merged rule set in deterministic order (the order they
  // appear in the array — the grant-store is responsible for stable
  // ordering when it merges grant-scoped + user-level rules). First
  // failing rule wins; subsequent rules don't run.
  for (const rule of grant.rules) {
    const params = (rule.params ?? {}) as Record<string, unknown>

    switch (rule.kind as UAPRuleKind) {
      case 'spending_cap': {
        // Only relevant for kinds that move money. Per the spec, the
        // rule key is `max_per_action_usd` and the action carries
        // `amount_usd`. Missing either side skips the check rather
        // than denying — the partner can be coached during integration.
        if (input.action.kind !== 'purchase' && input.action.kind !== 'payment') {
          break
        }
        const cap = asNumber(params.max_per_action_usd)
        const amount = asNumber(
          (input.action.params as { amount_usd?: unknown } | undefined)?.amount_usd,
        )
        if (cap === undefined || amount === undefined) break
        if (amount > cap) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=spending_cap amount_usd=${amount} max_per_action_usd=${cap}`,
          }
        }
        break
      }

      case 'recipient_allowlist': {
        // No recipient on the action → no allowlist check (rule
        // only constrains representation actions).
        if (!input.recipient) break
        const allowed = asStringArray(params.allowed_recipients)
        if (!allowed) break
        if (!allowed.includes(input.recipient.hint)) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=recipient_allowlist recipient=${input.recipient.hint}`,
          }
        }
        break
      }

      case 'recipient_denylist': {
        if (!input.recipient) break
        const denied = asStringArray(params.denied_recipients)
        if (!denied) break
        if (denied.includes(input.recipient.hint)) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=recipient_denylist recipient=${input.recipient.hint}`,
          }
        }
        break
      }

      case 'frequency_cap': {
        // TODO(v0.2): requires a historical audit query to count
        // prior actions in a rolling window. Skipped for v1 — the
        // route handler will surface this as a known gap in the
        // grant UI ("frequency caps not yet enforced").
        break
      }

      case 'time_of_day_block': {
        const blocked = params.blocked_hours
        if (!Array.isArray(blocked)) break
        // Accept numeric hour list `[8, 9, 10]` (0–23, user-local
        // semantics handled upstream — for v1 we treat them as UTC
        // hours since per-user TZ isn't on the User row yet).
        const hour = now.getUTCHours()
        const hours: number[] = []
        for (const h of blocked) {
          const n = asNumber(h)
          if (n !== undefined && Number.isInteger(n) && n >= 0 && n <= 23) {
            hours.push(n)
          }
        }
        if (hours.includes(hour)) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=time_of_day_block hour=${hour}`,
          }
        }
        break
      }

      case 'irreversible_floor': {
        // Marker rule — the actual irreversibility enforcement is
        // step 13 (the protocol-level floor that can't be opted out
        // of). This case exists so unknown-rule-kind paranoia doesn't
        // false-positive on a legitimate marker.
        break
      }

      case 'quiet_hours': {
        // Handled in step 8. Nothing to do here.
        break
      }

      default: {
        // Unknown rule kind → ignore. A future protocol version may
        // introduce kinds this code doesn't recognize; fail-open on
        // unknown rules is the right call for forward compatibility
        // (alternative: fail-closed would brick grants on every
        // protocol upgrade).
        break
      }
    }
  }

  // ── 13. Irreversibility floor ───────────────────────────────────
  // Per UAP-0.1.md §3: irreversibles ALWAYS require per-action
  // confirmation, even under a standing grant. This is the protocol
  // floor — implementations MAY extend the list (more kinds confirm),
  // never shrink it. Returned as needs_per_action_confirmation rather
  // than denied because it's actionable: the partner pivots to a
  // user-present EAP flow.
  if (
    input.action.reversibility === 'irreversible' &&
    isIrreversibleFloorAction(input.action.kind)
  ) {
    return {
      decision: 'needs_per_action_confirmation',
      reason: 'irreversible',
      detail: `${input.action.kind} requires per-action confirmation even under standing grant`,
    }
  }

  // ── 14. All gates passed ────────────────────────────────────────
  return { decision: 'allowed' }
}
