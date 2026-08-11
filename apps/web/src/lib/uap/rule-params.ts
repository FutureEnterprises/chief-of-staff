/**
 * UAP rule-parameter parsing — the single place that decides whether a
 * `UAPRule.params` blob is EVALUABLE for its kind.
 *
 * Why this file exists (the silent-bypass gap it closes):
 *
 * Before this module, the coordinator read every rule parameter with a
 * "coerce, and `break` if it doesn't coerce" pattern:
 *
 *     const cap = asNumber(params.max_per_action_usd)
 *     if (cap === undefined) break        // ← rule silently skipped
 *
 * That is fail-OPEN on negative authority. UAP-0.1.md §3 says a
 * declared rule "supersedes every overlapping grant" — but a rule the
 * engine cannot parse was simply not applied, and the EXECUTE returned
 * `allowed`. A single typo in a spending cap ("max_per_action_usd":
 * "50" as a string) turned the user's hard limit into no limit at all,
 * with no error surfaced anywhere.
 *
 * The rule now: a rule the engine cannot EVALUATE denies the action
 * (`rule_unevaluable`). The engine cannot prove the action is permitted,
 * so it does not permit it.
 *
 * Two callers share these parsers so declare-time and decision-time can
 * never disagree about what "well-formed" means:
 *
 *   - POST /api/uap/v1/rule rejects a malformed rule at WRITE time
 *     (400 invalid_rule_params). This is load-bearing now that rules
 *     fail closed: without it a user could persist a typo'd rule that
 *     silently denies every action on the grant forever.
 *   - lib/uap/coordinator.ts re-validates at DECISION time, because
 *     rows written by an older deploy (or by a future one) reach the
 *     coordinator without ever passing the current route validation.
 *
 * Pure module: no Prisma, no sibling lib/uap imports beyond ./types, so
 * the coordinator's "no sibling-module imports" build-isolation posture
 * survives (types.ts is already imported there for the same reason).
 */

import { isUAPRuleKind, type UAPRuleKind } from './types'

/* ──────────────────── Result shape ──────────────────── */

export type RuleParamsResult<T> =
  | { ok: true; value: T }
  | { ok: false; detail: string }

/** Parsed, validated `spending_cap` parameters. */
export type SpendingCapParams = { maxPerActionUsd: number }

/** Parsed, validated `frequency_cap` parameters. */
export type FrequencyCapParams = { max: number; windowSeconds: number }

/** Parsed, validated `time_of_day_block` parameters. */
export type TimeOfDayBlockParams = { blockedHours: number[] }

/** Parsed, validated recipient list parameters (allow- or denylist). */
export type RecipientListParams = { recipients: string[] }

/** Parsed, validated `quiet_hours` parameters. */
export type QuietHoursParams = { disabled: boolean }

/* ──────────────────── Primitive coercions ──────────────────── */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    // Prisma Json columns round-trip as plain objects; a Date or Buffer
    // in a params blob is malformed by definition.
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
}

/**
 * Narrow a rule's raw `params` column to a plain object. Anything else
 * (a JSON array, a bare string, a number, `null`) is unevaluable — the
 * parameter names a rule's semantics, so we cannot guess them.
 */
export function asParamsObject(
  params: unknown,
): RuleParamsResult<Record<string, unknown>> {
  if (params === null || params === undefined) {
    return { ok: false, detail: 'params is null' }
  }
  if (!isPlainObject(params)) {
    return {
      ok: false,
      detail: `params must be a JSON object (got ${Array.isArray(params) ? 'array' : typeof params})`,
    }
  }
  return { ok: true, value: params }
}

/* ──────────────────── Per-kind parsers ──────────────────── */

export function parseSpendingCap(
  params: Record<string, unknown>,
): RuleParamsResult<SpendingCapParams> {
  const cap = finiteNumber(params.max_per_action_usd)
  if (cap === undefined) {
    return {
      ok: false,
      detail: 'max_per_action_usd must be a finite number',
    }
  }
  if (cap < 0) {
    return { ok: false, detail: 'max_per_action_usd must be >= 0' }
  }
  return { ok: true, value: { maxPerActionUsd: cap } }
}

/**
 * `{ max: number, window_seconds: number }` — at most `max` ALLOWED
 * executes of this (user, grant, action kind) inside the trailing
 * `window_seconds`.
 *
 * `max: 0` is legal and means "never" — a pre-decline expressed as a
 * cap. `window_seconds` must be positive; a zero/negative window has no
 * defined trailing period and is a typo, not a policy.
 */
export function parseFrequencyCap(
  params: Record<string, unknown>,
): RuleParamsResult<FrequencyCapParams> {
  const max = finiteNumber(params.max)
  if (max === undefined || !Number.isInteger(max) || max < 0) {
    return { ok: false, detail: 'max must be a non-negative integer' }
  }
  const windowSeconds = finiteNumber(params.window_seconds)
  if (
    windowSeconds === undefined ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds <= 0
  ) {
    return { ok: false, detail: 'window_seconds must be a positive integer' }
  }
  return { ok: true, value: { max, windowSeconds } }
}

export function parseTimeOfDayBlock(
  params: Record<string, unknown>,
): RuleParamsResult<TimeOfDayBlockParams> {
  const blocked = params.blocked_hours
  if (!Array.isArray(blocked)) {
    return { ok: false, detail: 'blocked_hours must be an array' }
  }
  const hours: number[] = []
  for (const h of blocked) {
    const n = finiteNumber(h)
    // Strict: a single junk entry makes the whole rule unevaluable. The
    // old code filtered junk out silently, which quietly shrank the
    // user's blocked window.
    if (n === undefined || !Number.isInteger(n) || n < 0 || n > 23) {
      return {
        ok: false,
        detail: `blocked_hours entries must be integers 0-23 (got ${JSON.stringify(h)})`,
      }
    }
    hours.push(n)
  }
  return { ok: true, value: { blockedHours: hours } }
}

export function parseRecipientList(
  params: Record<string, unknown>,
  key: 'allowed_recipients' | 'denied_recipients',
): RuleParamsResult<RecipientListParams> {
  const list = params[key]
  if (!Array.isArray(list)) {
    return { ok: false, detail: `${key} must be an array of strings` }
  }
  if (!list.every((v) => typeof v === 'string')) {
    return { ok: false, detail: `${key} must contain only strings` }
  }
  return { ok: true, value: { recipients: list as string[] } }
}

/**
 * `quiet_hours` is opt-OUT only in v0.1.1: `{ disabled: true }` skips
 * the gate, absence means enforce. A `disabled` present but non-boolean
 * is a typo whose most likely intent ("turn quiet hours off") we refuse
 * to guess — the rule is unevaluable.
 */
export function parseQuietHours(
  params: Record<string, unknown>,
): RuleParamsResult<QuietHoursParams> {
  if (!('disabled' in params)) return { ok: true, value: { disabled: false } }
  if (typeof params.disabled !== 'boolean') {
    return { ok: false, detail: 'disabled must be a boolean when present' }
  }
  return { ok: true, value: { disabled: params.disabled } }
}

/* ──────────────────── Kind dispatch ──────────────────── */

/**
 * Validate a rule's params for its kind WITHOUT applying it — used at
 * declare time (POST /api/uap/v1/rule, POST /api/uap/v1/grant inline
 * rules) so a rule that would be permanently unevaluable is rejected
 * before it can brick a grant.
 *
 * `irreversible_floor` is deliberately exempt: it is a marker rule with
 * no parameters of its own (the floor is enforced unconditionally in
 * coordinator step 13, and it is additive-restrictive — it can only add
 * confirmations, never remove them). Validating it would let a params
 * typo turn a rule that RESTRICTS nothing into a rule that DENIES
 * everything, which is a strictly worse failure mode than ignoring a
 * field the engine never reads.
 */
export function validateRuleParams(
  kind: UAPRuleKind,
  rawParams: unknown,
): RuleParamsResult<Record<string, unknown>> {
  if (!isUAPRuleKind(kind)) {
    return { ok: false, detail: `unknown rule kind ${String(kind)}` }
  }
  if (kind === 'irreversible_floor') {
    // Marker rule — params are advisory and never read. See note above.
    return { ok: true, value: {} }
  }

  const obj = asParamsObject(rawParams)
  if (!obj.ok) return obj
  const params = obj.value

  switch (kind) {
    case 'spending_cap': {
      const r = parseSpendingCap(params)
      return r.ok ? { ok: true, value: params } : r
    }
    case 'frequency_cap': {
      const r = parseFrequencyCap(params)
      return r.ok ? { ok: true, value: params } : r
    }
    case 'time_of_day_block': {
      const r = parseTimeOfDayBlock(params)
      return r.ok ? { ok: true, value: params } : r
    }
    case 'recipient_allowlist': {
      const r = parseRecipientList(params, 'allowed_recipients')
      return r.ok ? { ok: true, value: params } : r
    }
    case 'recipient_denylist': {
      const r = parseRecipientList(params, 'denied_recipients')
      return r.ok ? { ok: true, value: params } : r
    }
    case 'quiet_hours': {
      const r = parseQuietHours(params)
      return r.ok ? { ok: true, value: params } : r
    }
  }
}

/* ──────────────────── Frequency-cap guards ──────────────────── */

/**
 * A frequency cap reduced to the numbers the atomic re-check needs.
 * The coordinator evaluates caps optimistically (a plain COUNT before
 * the audit write); this shape is what lib/uap/audit.ts re-checks
 * INSIDE the advisory-locked transaction that appends the audit row, so
 * two concurrent executes at the boundary cannot both land.
 */
export type FrequencyGuard = {
  grantId: string
  actionKind: string
  max: number
  windowSeconds: number
}

/**
 * Extract every well-formed frequency cap that applies to this action
 * kind from a grant's merged rule set. Malformed caps are NOT returned
 * — the coordinator has already denied the action with
 * `rule_unevaluable` before any caller reaches this function, so a
 * silently-dropped guard here can never widen an authorization.
 */
export function collectFrequencyGuards(
  rules: ReadonlyArray<{ kind: string; params: unknown }>,
  grantId: string,
  actionKind: string,
): FrequencyGuard[] {
  const guards: FrequencyGuard[] = []
  for (const rule of rules) {
    if (rule.kind !== 'frequency_cap') continue
    const obj = asParamsObject(rule.params)
    if (!obj.ok) continue
    const parsed = parseFrequencyCap(obj.value)
    if (!parsed.ok) continue
    guards.push({
      grantId,
      actionKind,
      max: parsed.value.max,
      windowSeconds: parsed.value.windowSeconds,
    })
  }
  return guards
}
