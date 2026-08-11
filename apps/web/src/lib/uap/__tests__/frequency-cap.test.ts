/**
 * DECISION 2 — `frequency_cap` is actually enforced.
 *
 * Pre-change, coordinator.ts had:
 *
 *   case 'frequency_cap': {
 *     // TODO(v0.2): requires a historical audit query ...
 *     break
 *   }
 *
 * and POST /api/uap/v1/rule refused the kind outright so users could
 * not declare a cap that nothing checked. Every test here returns
 * `allowed` against that coordinator.
 *
 * The counter is injected (UAPDeps.countRecentAllowedExecutes), so
 * these are pure decision-tree tests; the query behind it is covered by
 * the atomic-guard test in ./audit-frequency-guard.test.ts.
 */

import { describe, it, expect } from 'vitest'
import { decideExecute, type UAPDeps } from '../coordinator'
import type { UAPExecuteInput, UAPGrant, UAPRule } from '../types'

const USER_ID = 'user_freqcap'
const GRANT_ID = 'grant_freqcap'
const PARTNER_ID = 'partner_freqcap'
const NOW = new Date('2026-05-24T15:00:00Z')

function makeGrant(rules: UAPRule[]): UAPGrant & { rules: UAPRule[] } {
  return {
    id: GRANT_ID,
    userId: USER_ID,
    llmPartnerId: PARTNER_ID,
    scopes: ['proactive_food', 'proactive_focus'],
    expiresAt: new Date('2099-01-01T00:00:00Z'),
    status: 'ACTIVE',
    consentArtifact: {
      consentClass: 'coordinator_verified',
    } as unknown as UAPGrant['consentArtifact'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    terminatedAt: null,
    terminationReason: null,
    rules,
  }
}

function makeRule(params: unknown): UAPRule {
  return {
    id: 'rule_freq_1',
    grantId: GRANT_ID,
    userId: USER_ID,
    kind: 'frequency_cap',
    params: params as UAPRule['params'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }
}

function makeInput(kind = 'food_intervention'): UAPExecuteInput {
  return {
    grantId: GRANT_ID,
    partnerId: PARTNER_ID,
    userId: USER_ID,
    action: {
      kind,
      operation: 'propose',
      reversibility: 'reversible',
      params: {},
    },
    context: {},
  }
}

function makeDeps(
  rules: UAPRule[],
  overrides: Partial<UAPDeps> = {},
): UAPDeps {
  return {
    loadGrantWithRules: async () => makeGrant(rules),
    isUserKilledGlobally: async () => false,
    isPanicActive: async () => false,
    isInQuietHours: async () => false,
    checkPartnerRateLimit: async () => ({ allowed: true }),
    now: () => NOW,
    ...overrides,
  }
}

describe('frequency_cap — enforcement', () => {
  it('DENIES with frequency_cap_exceeded once the trailing-window count reaches max (pre-change: the case was a no-op → allowed)', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 3, window_seconds: 3600 })], {
        countRecentAllowedExecutes: async () => 3,
      }),
    )
    expect(result.decision).toBe('denied')
    if (result.decision !== 'denied') throw new Error('unreachable')
    expect(result.reason).toBe('frequency_cap_exceeded')
    expect(result.detail).toContain('count=3')
    expect(result.detail).toContain('max=3')
    expect(result.detail).toContain('window_seconds=3600')
  })

  it('ALLOWS while under the cap', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 3, window_seconds: 3600 })], {
        countRecentAllowedExecutes: async () => 2,
      }),
    )
    expect(result.decision).toBe('allowed')
  })

  it('max: 0 is a pre-decline — nothing passes', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 0, window_seconds: 60 })], {
        countRecentAllowedExecutes: async () => 0,
      }),
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'frequency_cap_exceeded',
    )
  })

  it('counts the trailing window, per (user, grant, action kind)', async () => {
    const seen: Array<Record<string, unknown>> = []
    await decideExecute(
      makeInput('focus_callout'),
      makeDeps([makeRule({ max: 1, window_seconds: 900 })], {
        countRecentAllowedExecutes: async (p) => {
          seen.push({ ...p })
          return 0
        },
      }),
    )
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({
      userId: USER_ID,
      grantId: GRANT_ID,
      actionKind: 'focus_callout',
    })
    // Window lower bound = now - 900s.
    expect((seen[0]!.since as Date).toISOString()).toBe(
      new Date(NOW.getTime() - 900_000).toISOString(),
    )
  })
})

describe('frequency_cap — unevaluable cases fail closed (Decision 1 interaction)', () => {
  it('malformed params deny rather than skip', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 'three', window_seconds: 3600 })], {
        countRecentAllowedExecutes: async () => 0,
      }),
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'rule_unevaluable',
    )
  })

  it('a non-positive window is a typo, not a policy', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 2, window_seconds: 0 })], {
        countRecentAllowedExecutes: async () => 0,
      }),
    )
    expect(result.decision === 'denied' && result.reason).toBe(
      'rule_unevaluable',
    )
  })

  it('an UNWIRED counter denies — a wiring omission cannot silently disable a cap', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 1, window_seconds: 60 })]), // no counter dep
    )
    expect(result.decision).toBe('denied')
    if (result.decision !== 'denied') throw new Error('unreachable')
    expect(result.reason).toBe('rule_unevaluable')
    expect(result.detail).toContain('countRecentAllowedExecutes')
  })

  it('a THROWING counter denies — an outage on the user\'s own limit fails closed', async () => {
    const result = await decideExecute(
      makeInput(),
      makeDeps([makeRule({ max: 5, window_seconds: 60 })], {
        countRecentAllowedExecutes: async () => {
          throw new Error('db down')
        },
      }),
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'rule_unevaluable',
    )
  })
})
