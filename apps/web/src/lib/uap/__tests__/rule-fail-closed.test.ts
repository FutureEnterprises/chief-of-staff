/**
 * DECISION 1 — rules fail CLOSED.
 *
 * Before this change coordinator.ts treated anything it could not parse
 * as "not applicable":
 *
 *   default: { /* Unknown rule kind → ignore ... fail-open *\/ break }
 *   const cap = asNumber(params.max_per_action_usd)
 *   if (cap === undefined) break
 *
 * so an unknown rule kind, a string where a number belonged, or a
 * missing `amount_usd` on a purchase all produced `allowed`. Negative
 * authority that the engine cannot evaluate is not authority at all.
 *
 * EVERY test in this file returns `allowed` against the pre-change
 * coordinator and `denied / rule_unevaluable` against the current one,
 * except where noted:
 *   - "irreversible_floor keeps its marker semantics" passes both
 *     before and after (it pins the deliberate exemption so a future
 *     strictness sweep can't silently tighten the floor rule).
 *   - the drift test is new coverage with no pre-change analogue (the
 *     mirror set it checks did not exist).
 */

import { describe, it, expect } from 'vitest'
import {
  decideExecute,
  UAP_COORDINATOR_HANDLED_RULE_KINDS,
  type UAPDeps,
} from '../coordinator'
import { UAP_RULE_KINDS } from '../types'
import type { UAPExecuteInput, UAPGrant, UAPRule } from '../types'

const USER_ID = 'user_failclosed'
const GRANT_ID = 'grant_failclosed'
const PARTNER_ID = 'partner_failclosed'

function makeGrant(
  overrides: Partial<UAPGrant & { rules: UAPRule[] }> = {},
): UAPGrant & { rules: UAPRule[] } {
  return {
    id: GRANT_ID,
    userId: USER_ID,
    llmPartnerId: PARTNER_ID,
    scopes: [
      'proactive_food',
      'proactive_focus',
      'proactive_relational',
      'proactive_purchase',
      'read',
    ],
    expiresAt: new Date('2099-01-01T00:00:00Z'),
    status: 'ACTIVE',
    consentArtifact: {
      userResponse: 'explicit_grant',
      consentClass: 'coordinator_verified',
    } as unknown as UAPGrant['consentArtifact'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    terminatedAt: null,
    terminationReason: null,
    rules: [],
    ...overrides,
  }
}

function makeRule(kind: string, params: unknown): UAPRule {
  return {
    id: `rule_${kind}_1`,
    grantId: GRANT_ID,
    userId: USER_ID,
    kind,
    params: params as UAPRule['params'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }
}

function makeInput(overrides: Partial<UAPExecuteInput> = {}): UAPExecuteInput {
  return {
    grantId: GRANT_ID,
    partnerId: PARTNER_ID,
    userId: USER_ID,
    action: {
      kind: 'meal_suggestion',
      operation: 'propose',
      reversibility: 'reversible',
      params: {},
    },
    context: {},
    ...overrides,
  }
}

function depsWithRules(rules: UAPRule[]): UAPDeps {
  return {
    loadGrantWithRules: async () => makeGrant({ rules }),
    isUserKilledGlobally: async () => false,
    isPanicActive: async () => false,
    isInQuietHours: async () => false,
    checkPartnerRateLimit: async () => ({ allowed: true }),
    now: () => new Date('2026-05-24T15:00:00Z'),
  }
}

/** Assert a `rule_unevaluable` denial whose detail names the rule kind. */
async function expectUnevaluable(
  input: UAPExecuteInput,
  rules: UAPRule[],
  kindInDetail: string,
) {
  const result = await decideExecute(input, depsWithRules(rules))
  expect(result.decision).toBe('denied')
  if (result.decision !== 'denied') throw new Error('unreachable')
  expect(result.reason).toBe('rule_unevaluable')
  expect(result.detail).toContain(kindInDetail)
  return result
}

/* ──────────────────── Unknown rule kind ──────────────────── */

describe('rules fail closed — unknown rule kind', () => {
  it('DENIES with rule_unevaluable naming the kind (pre-change: the default case ignored it and returned allowed)', async () => {
    await expectUnevaluable(
      makeInput(),
      [makeRule('geo_fence', { radius_m: 500 })],
      'geo_fence',
    )
  })

  it('a rule kind that merely LOOKS familiar is still unknown', async () => {
    // Typo'd kind — the exact shape of a rule a user believes is live.
    await expectUnevaluable(
      makeInput(),
      [makeRule('spending_caps', { max_per_action_usd: 5 })],
      'spending_caps',
    )
  })
})

/* ──────────────────── Malformed params, known kinds ──────────────────── */

describe('rules fail closed — malformed params on a KNOWN kind', () => {
  const purchase = makeInput({
    action: {
      kind: 'purchase',
      operation: 'execute',
      reversibility: 'reversible',
      params: { amount_usd: 500 },
    },
  })

  it('spending_cap with a STRING cap denies (pre-change: asNumber returned undefined → break → allowed, so a quoted number removed the cap)', async () => {
    await expectUnevaluable(
      purchase,
      [makeRule('spending_cap', { max_per_action_usd: '25' })],
      'spending_cap',
    )
  })

  it('spending_cap with a missing cap key denies', async () => {
    await expectUnevaluable(
      purchase,
      [makeRule('spending_cap', { limit: 25 })],
      'spending_cap',
    )
  })

  it('a money-moving action with NO amount_usd under a spending cap denies (pre-change: omitting the field skipped every cap)', async () => {
    await expectUnevaluable(
      makeInput({
        action: {
          kind: 'purchase',
          operation: 'execute',
          reversibility: 'reversible',
          params: {},
        },
      }),
      [makeRule('spending_cap', { max_per_action_usd: 25 })],
      'amount_usd',
    )
  })

  it('recipient_allowlist whose list is not an array of strings denies (pre-change: asStringArray → undefined → break → allowed)', async () => {
    await expectUnevaluable(
      makeInput({
        action: {
          kind: 'send_message',
          operation: 'execute',
          reversibility: 'reversible',
          params: {},
        },
        recipient: { kind: 'external_email', hint: 'stranger@example.com' },
      }),
      [makeRule('recipient_allowlist', { allowed_recipients: 'friend@example.com' })],
      'recipient_allowlist',
    )
  })

  it('recipient_denylist with a non-string entry denies', async () => {
    await expectUnevaluable(
      makeInput({
        action: {
          kind: 'send_message',
          operation: 'execute',
          reversibility: 'reversible',
          params: {},
        },
        recipient: { kind: 'external_email', hint: 'x@example.com' },
      }),
      [makeRule('recipient_denylist', { denied_recipients: ['a@b.c', 42] })],
      'recipient_denylist',
    )
  })

  it('a representation action that declares NO recipient under a recipient rule denies (pre-change: `if (!input.recipient) break` — omit the field, defeat the list)', async () => {
    await expectUnevaluable(
      makeInput({
        action: {
          kind: 'send_message',
          operation: 'execute',
          reversibility: 'reversible',
          params: {},
        },
      }),
      [makeRule('recipient_denylist', { denied_recipients: ['ex@example.com'] })],
      'recipient_denylist',
    )
  })

  it('time_of_day_block with one junk hour denies the whole rule (pre-change: junk entries were filtered out, silently shrinking the blocked window)', async () => {
    await expectUnevaluable(
      makeInput(),
      [makeRule('time_of_day_block', { blocked_hours: [15, 'noon'] })],
      'time_of_day_block',
    )
  })

  it('time_of_day_block whose hours are not an array denies', async () => {
    await expectUnevaluable(
      makeInput(),
      [makeRule('time_of_day_block', { blocked_hours: 15 })],
      'time_of_day_block',
    )
  })

  it('quiet_hours with a non-boolean `disabled` denies rather than guessing intent', async () => {
    await expectUnevaluable(
      makeInput(),
      [makeRule('quiet_hours', { disabled: 'true' })],
      'quiet_hours',
    )
  })

  it('params that are not a JSON object at all deny', async () => {
    await expectUnevaluable(
      makeInput(),
      [makeRule('spending_cap', ['max_per_action_usd', 25])],
      'spending_cap',
    )
  })
})

/* ──────────────────── Well-formed rules still work ──────────────────── */

describe('rules fail closed — well-formed rules keep their behavior', () => {
  it('a well-formed spending_cap still ALLOWS an in-budget purchase', async () => {
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'purchase',
          operation: 'execute',
          reversibility: 'reversible',
          params: { amount_usd: 10 },
        },
      }),
      depsWithRules([makeRule('spending_cap', { max_per_action_usd: 25 })]),
    )
    expect(result.decision).toBe('allowed')
  })

  it('a well-formed spending_cap still DENIES with rule_violation (not rule_unevaluable) when the action loses', async () => {
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'purchase',
          operation: 'execute',
          reversibility: 'reversible',
          params: { amount_usd: 99 },
        },
      }),
      depsWithRules([makeRule('spending_cap', { max_per_action_usd: 25 })]),
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('rule_violation')
  })

  it('a non-representation action is unaffected by a recipient rule', async () => {
    const result = await decideExecute(
      makeInput(),
      depsWithRules([
        makeRule('recipient_denylist', { denied_recipients: ['ex@example.com'] }),
      ]),
    )
    expect(result.decision).toBe('allowed')
  })
})

/* ──────────────────── irreversible_floor exemption ──────────────────── */

describe('rules fail closed — irreversible_floor keeps its marker semantics', () => {
  it('a junk-params irreversible_floor marker does NOT deny (the floor is additive-restrictive and must not be loosened OR weaponized by a typo)', async () => {
    // Passes before AND after the change — it pins the deliberate
    // exemption documented in coordinator.ts and rule-params.ts.
    const result = await decideExecute(
      makeInput(),
      depsWithRules([makeRule('irreversible_floor', 'whatever')]),
    )
    expect(result.decision).toBe('allowed')
  })

  it('the floor itself still fires for an irreversible floor action', async () => {
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'send_message',
          operation: 'execute',
          reversibility: 'irreversible',
          params: {},
        },
      }),
      depsWithRules([makeRule('irreversible_floor', { note: 'marker' })]),
    )
    expect(result.decision).toBe('needs_per_action_confirmation')
  })
})

/* ──────────────────── Kind-coverage drift guard ──────────────────── */

describe('UAP_RULE_KINDS ↔ coordinator case coverage', () => {
  it('every declared rule kind has a coordinator case, and every case is a declared kind', () => {
    // New coverage: the mirror set did not exist pre-change. Now that
    // rules fail closed, a kind declared in types.ts with no case here
    // would DENY every action on any grant carrying it. This turns that
    // into a red CI run.
    const declared = [...UAP_RULE_KINDS].sort()
    const handled = [...UAP_COORDINATOR_HANDLED_RULE_KINDS].sort()
    expect(handled).toEqual(declared)
  })

  it('every declared kind is actually evaluable end-to-end (no kind denies a clean action as unevaluable)', async () => {
    // Walks the real set: a well-formed rule of each kind must not
    // produce rule_unevaluable on an action it does not constrain.
    const wellFormed: Record<string, unknown> = {
      spending_cap: { max_per_action_usd: 100 },
      quiet_hours: { disabled: false },
      irreversible_floor: {},
      recipient_allowlist: { allowed_recipients: ['a@example.com'] },
      recipient_denylist: { denied_recipients: ['b@example.com'] },
      frequency_cap: { max: 10, window_seconds: 3600 },
      time_of_day_block: { blocked_hours: [3] },
    }

    for (const kind of UAP_RULE_KINDS) {
      const result = await decideExecute(makeInput(), {
        ...depsWithRules([makeRule(kind, wellFormed[kind])]),
        countRecentAllowedExecutes: async () => 0,
      })
      expect(
        result.decision === 'denied' ? result.reason : result.decision,
      ).not.toBe('rule_unevaluable')
    }
  })
})
