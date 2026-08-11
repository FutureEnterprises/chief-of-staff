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
 *   12. Consent class floor (partner-attested grants can't do floor
 *       actions)
 *   13. Rule evaluation (spending_cap, recipient lists, frequency_cap,
 *       time_of_day_block) — FAIL CLOSED on anything unevaluable
 *   14. Irreversibility floor → needs_per_action_confirmation
 *   15. Allowed
 *
 * Rules fail CLOSED (step 13). A rule kind this engine does not
 * recognize, or a known kind whose params don't parse, denies with
 * `rule_unevaluable`. Rationale: UAP-0.1.md §3 makes negative authority
 * strictly stronger than positive authority, and the engine cannot
 * prove an action satisfies a rule it cannot evaluate. The previous
 * posture (skip what you can't parse, keep going, return `allowed`) is
 * the exact shape of a silent bypass: a typo in a spending cap removed
 * the cap. Forward-compat is preserved at the WRITE boundary instead —
 * POST /api/uap/v1/rule refuses to persist a kind or a params blob this
 * engine cannot evaluate, so a grant can only carry rules the deployed
 * coordinator understands.
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
  UAP_REPRESENTATION_ACTIONS,
  UAP_RULE_KINDS,
  isUAPRuleKind,
  type UAPExecuteInput,
  type UAPDecision,
  type UAPGrant,
  type UAPRule,
  type UAPScope,
  type UAPRuleKind,
  type UAPIrreversibleAction,
} from './types'
// Pure, Prisma-free sibling modules — same rationale as the types
// import above: no DB, no module-loading cost, no worktree coupling.
import {
  asParamsObject,
  parseFrequencyCap,
  parseQuietHours,
  parseRecipientList,
  parseSpendingCap,
  parseTimeOfDayBlock,
} from './rule-params'
import {
  isConsentClassInsufficientForFloor,
  readConsentClass,
} from './consent-class'

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

  /** Counts prior ALLOWED executes of this exact (user, grant, action
   *  kind) tuple at or after `since` — the trailing-window counter a
   *  `frequency_cap` rule is evaluated against. Backed by UAPAuditEntry
   *  rows (`lib/uap/rate-limit#countAllowedExecutesInWindow`), the same
   *  source of truth the UAP rate limiter counts, so "how many actions
   *  reached this user" means one thing across the plane.
   *
   *  Optional ONLY in the sense that a deployment without frequency
   *  caps never needs it: if a grant carries a `frequency_cap` rule and
   *  this dep is absent, the rule is unevaluable and the action is
   *  DENIED (`rule_unevaluable`). Omitting the wiring cannot silently
   *  disable a user's cap. */
  countRecentAllowedExecutes?: (params: {
    userId: string
    grantId: string
    actionKind: string
    since: Date
  }) => Promise<number>
}

/* ──────────────────── Rule-kind coverage ──────────────────── */

/**
 * Every rule kind that has a real `case` in the switch below. This is
 * the mirror of `UAP_RULE_KINDS` in types.ts, and
 * `__tests__/rule-fail-closed.test.ts` asserts the two sets are equal
 * in both directions.
 *
 * The drift this guards: rules now fail CLOSED, so a kind added to
 * types.ts (and therefore accepted by the declare route) with no case
 * here would deny every action on any grant carrying it. The test turns
 * that into a red CI run instead of a bricked grant in production. The
 * reverse direction — a case for a kind types.ts doesn't declare — is
 * dead code, and the same assertion catches it.
 */
export const UAP_COORDINATOR_HANDLED_RULE_KINDS: ReadonlySet<UAPRuleKind> =
  new Set<UAPRuleKind>([
    'spending_cap',
    'recipient_allowlist',
    'recipient_denylist',
    'frequency_cap',
    'time_of_day_block',
    'irreversible_floor',
    'quiet_hours',
  ])

/** Re-exported so tests and callers read the declared set from one place. */
export { UAP_RULE_KINDS }

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
 * Representation actions — the agent acts AS the user toward a third
 * party. Used by the recipient-list rules: for these kinds an ABSENT
 * recipient makes an allow/denylist unevaluable (see the rule cases),
 * because "who is this going to" is exactly what the rule constrains.
 */
const REPRESENTATION_ACTION_SET: Set<string> = new Set(
  UAP_REPRESENTATION_ACTIONS,
)

/** Uniform `rule_unevaluable` denial. Names the rule and why. */
function unevaluable(
  kind: string,
  ruleId: string | undefined,
  detail: string,
): UAPDecision {
  return {
    decision: 'denied',
    reason: 'rule_unevaluable',
    detail: `rule_kind=${kind}${ruleId ? ` rule_id=${ruleId}` : ''} ${detail}`,
  }
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
 * "enforce." Errs on the side of enforcing — a malformed quiet_hours
 * rule does NOT disable the gate here; it is separately denied as
 * unevaluable in step 13, so the two paths agree.
 */
function quietHoursDisabledByRule(rules: UAPRule[]): boolean {
  const rule = findRule(rules, 'quiet_hours')
  if (!rule) return false
  const obj = asParamsObject(rule.params)
  if (!obj.ok) return false
  const parsed = parseQuietHours(obj.value)
  return parsed.ok && parsed.value.disabled
}

/**
 * Coerce an ACTION parameter to a finite number. Rule parameters are
 * parsed by lib/uap/rule-params.ts (which fails closed); this helper is
 * only for the partner-supplied action side, where "the field is
 * missing" is a distinct condition the caller handles explicitly.
 */
function asNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
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
      // EXECUTE because the RAP store had a transient outage. PAP and
      // EAP take the identical posture at their own RAP call sites
      // (lib/coordinator/index.ts, api/eap/v1/action/request), so
      // flipping only this one would make the RAP gate mean different
      // things on different planes.
      //
      // This is now the ONLY deliberate fail-open left in the decision
      // path — rules (step 13) fail closed, and it is a different
      // category: RAP is an infrastructure-supplied SIGNAL, not an
      // authority the user declared on this grant. Negative authority
      // the user wrote down must never depend on our uptime; a
      // third-party risk classifier degrading to "no crisis detected"
      // is an availability trade the threat model already documents.
      // If RAP availability becomes critical, flip all three call
      // sites together and update the threat model.
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

  // ── 12. Consent class floor ─────────────────────────────────────
  // A grant whose consent was PARTNER-ATTESTED (the partner told us the
  // user said yes, on the partner's own Bearer key) is a lower-trust
  // instrument than one whose consent COYL itself witnessed through the
  // hosted ceremony at /consent/uap. Both remain issuable — the partner
  // path is SDK-compatible and fine for routine reversible actions —
  // but the irreversibility floor is exactly the class of action where
  // "the partner says the user agreed" is not good enough evidence.
  //
  // Note this is STRICTER than step 14: it denies floor-kind actions
  // outright, regardless of the `reversibility` the partner declared,
  // because the declaration is made by the same party whose consent
  // evidence we are discounting. Step 14 only fires when the partner
  // itself admits the action is irreversible.
  //
  // Legacy grants (issued before consent classing) read as null and are
  // NOT restricted here — see the boundary note in ./consent-class.ts,
  // which also carries the one-line backfill that closes it.
  const consentClass = readConsentClass(grant.consentArtifact)
  if (
    isConsentClassInsufficientForFloor(consentClass) &&
    isIrreversibleFloorAction(input.action.kind)
  ) {
    return {
      decision: 'denied',
      reason: 'consent_class_insufficient',
      detail: `consent_class=partner_attested action_kind=${input.action.kind} requires coordinator_verified consent`,
    }
  }

  // ── 13. Rule evaluation (FAIL CLOSED) ───────────────────────────
  // Walk the merged rule set in deterministic order (the order they
  // appear in the array — the grant-store is responsible for stable
  // ordering when it merges grant-scoped + user-level rules). First
  // failing rule wins; subsequent rules don't run.
  //
  // Every exit from a rule case is one of exactly three things:
  //   • the rule does not apply to this action  → continue
  //   • the rule applied and the action lost    → rule_violation /
  //                                               frequency_cap_exceeded
  //   • the rule could not be evaluated         → rule_unevaluable
  // There is no fourth "couldn't parse it, carry on" branch. That
  // branch was the bypass.
  for (const rule of grant.rules) {
    // Unknown kind: this engine has no evaluator for it, so it cannot
    // certify the action satisfies it. Deny and name the kind.
    if (!isUAPRuleKind(rule.kind)) {
      return unevaluable(
        String(rule.kind),
        rule.id,
        'no evaluator for this rule kind in the deployed coordinator',
      )
    }

    // `irreversible_floor` is a parameterless marker (step 14 does the
    // real enforcement, unconditionally and additively). It is the one
    // kind deliberately exempt from params strictness: the floor cannot
    // be loosened by a malformed marker, and denying on one would turn
    // a rule that restricts nothing into a rule that denies everything.
    if (rule.kind === 'irreversible_floor') continue

    const paramsResult = asParamsObject(rule.params)
    if (!paramsResult.ok) {
      return unevaluable(rule.kind, rule.id, paramsResult.detail)
    }
    const params = paramsResult.value

    switch (rule.kind) {
      case 'spending_cap': {
        // Only relevant for kinds that move money. Per the spec, the
        // rule key is `max_per_action_usd` and the action carries
        // `amount_usd`.
        if (input.action.kind !== 'purchase' && input.action.kind !== 'payment') {
          break
        }
        const cap = parseSpendingCap(params)
        if (!cap.ok) return unevaluable(rule.kind, rule.id, cap.detail)

        const amount = asNumber(
          (input.action.params as { amount_usd?: unknown } | undefined)?.amount_usd,
        )
        // A money-moving action under a spending cap that declares no
        // amount is unevaluable, NOT exempt. Skipping here let any
        // partner defeat every cap by omitting one field.
        if (amount === undefined) {
          return unevaluable(
            rule.kind,
            rule.id,
            'action.params.amount_usd is required (and must be a finite number) for a money-moving action under a spending cap',
          )
        }
        if (amount > cap.value.maxPerActionUsd) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=spending_cap amount_usd=${amount} max_per_action_usd=${cap.value.maxPerActionUsd}`,
          }
        }
        break
      }

      case 'recipient_allowlist':
      case 'recipient_denylist': {
        const isAllowlist = rule.kind === 'recipient_allowlist'
        const list = parseRecipientList(
          params,
          isAllowlist ? 'allowed_recipients' : 'denied_recipients',
        )
        if (!list.ok) return unevaluable(rule.kind, rule.id, list.detail)

        if (!input.recipient) {
          // Non-representation actions have no recipient by nature —
          // the rule simply doesn't apply to them.
          if (!REPRESENTATION_ACTION_SET.has(input.action.kind)) break
          // A representation action with no declared recipient under a
          // recipient rule is unevaluable: the engine cannot tell who
          // this is going to, which is the whole subject of the rule.
          return unevaluable(
            rule.kind,
            rule.id,
            `action_kind ${input.action.kind} acts as the user toward a third party but declared no recipient`,
          )
        }

        const onList = list.value.recipients.includes(input.recipient.hint)
        if (isAllowlist ? !onList : onList) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=${rule.kind} recipient=${input.recipient.hint}`,
          }
        }
        break
      }

      case 'frequency_cap': {
        // "At most `max` ALLOWED executes of this action kind under
        // this grant in the trailing `window_seconds`."
        const cap = parseFrequencyCap(params)
        if (!cap.ok) return unevaluable(rule.kind, rule.id, cap.detail)

        // No counter wired → the cap cannot be evaluated. Deny rather
        // than let a wiring omission silently disable a user's cap.
        if (!deps.countRecentAllowedExecutes) {
          return unevaluable(
            rule.kind,
            rule.id,
            'no countRecentAllowedExecutes dep wired into this coordinator',
          )
        }

        const since = new Date(now.getTime() - cap.value.windowSeconds * 1000)
        let count: number
        try {
          count = await deps.countRecentAllowedExecutes({
            userId: input.userId,
            grantId: grant.id,
            actionKind: input.action.kind,
            since,
          })
        } catch {
          // A counter outage means we cannot prove the cap is
          // respected. Unlike the RAP gate (step 0), this failure is
          // about the USER'S OWN declared limit, so it fails closed.
          return unevaluable(
            rule.kind,
            rule.id,
            'trailing-window counter unavailable',
          )
        }

        if (count >= cap.value.max) {
          return {
            decision: 'denied',
            reason: 'frequency_cap_exceeded',
            detail: `rule_id=frequency_cap action_kind=${input.action.kind} count=${count} max=${cap.value.max} window_seconds=${cap.value.windowSeconds}`,
          }
        }
        break
      }

      case 'time_of_day_block': {
        // Numeric hour list `[8, 9, 10]` (0–23, user-local semantics
        // handled upstream — for v1 we treat them as UTC hours since
        // per-user TZ isn't on the User row yet).
        const blocked = parseTimeOfDayBlock(params)
        if (!blocked.ok) return unevaluable(rule.kind, rule.id, blocked.detail)
        const hour = now.getUTCHours()
        if (blocked.value.blockedHours.includes(hour)) {
          return {
            decision: 'denied',
            reason: 'rule_violation',
            detail: `rule_id=time_of_day_block hour=${hour}`,
          }
        }
        break
      }

      case 'quiet_hours': {
        // Enforcement happens in step 8; all that's left here is to
        // confirm the rule is well-formed, so a typo'd opt-out surfaces
        // as an explicit refusal instead of "quiet hours silently still
        // on" (which is safe but invisible to the user).
        const quiet = parseQuietHours(params)
        if (!quiet.ok) return unevaluable(rule.kind, rule.id, quiet.detail)
        break
      }
    }
  }

  // ── 14. Irreversibility floor ───────────────────────────────────
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

  // ── 15. All gates passed ────────────────────────────────────────
  return { decision: 'allowed' }
}
