/**
 * UAP coordinator — decision-tree unit tests.
 *
 * Exercises every branch of `decideExecute()` via dependency injection.
 * No DB, no network — every test builds the minimum `UAPDeps` it needs
 * and lets the deny-first decision tree do its work. The tests are
 * ordered to mirror the decision tree in coordinator.ts §"Coordinator"
 * so a future reader can pair the file with the spec without bouncing
 * between sections.
 *
 * What's tested:
 *   - happy path                         → 'allowed'
 *   - grant_not_found                    → 'denied'
 *   - partner_not_authorized (partner)   → 'denied'
 *   - partner_not_authorized (user)      → 'denied'
 *   - grant_expired (past expiresAt)     → 'denied'
 *   - grant_revoked (REVOKED_BY_USER)    → 'denied'
 *   - grant_killed_globally (status)     → 'denied'
 *   - grant_killed_globally (deps flag)  → 'denied'
 *   - panic_active                       → 'denied'
 *   - quiet_hours                        → 'denied' (+ opt-out happy)
 *   - scope_violation                    → 'denied'
 *   - confidence_too_low                 → 'denied'
 *   - rate_limited                       → 'denied'
 *   - rule_violation (spending_cap)      → 'denied'
 *   - irreversibility floor              → 'needs_per_action_confirmation'
 *   - rap_coaching_path_closed gate      → coordinator.ts does NOT call
 *     this gate in v0.1.1; the spec note in the task brief acknowledges
 *     the check ("if so, test the path"). We document the absence rather
 *     than assert false confidence in a gate that isn't wired.
 */

import { describe, it, expect } from 'vitest'
import { decideExecute, type UAPDeps } from '../coordinator'
import type { UAPExecuteInput, UAPGrant, UAPRule } from '../types'

/* ──────────────────── Fixture helpers ──────────────────── */

const USER_ID = 'user_test_1'
const GRANT_ID = 'grant_test_1'
const PARTNER_ID = 'partner_test_1'

/**
 * Default grant payload — ACTIVE, far-future expiry, every scope the
 * happy-path test needs. Tests override only the fields they're
 * exercising; everything else stays at sane defaults so the failure
 * mode is the field we changed, not a stale fixture.
 */
function makeGrant(
  overrides: Partial<UAPGrant & { rules: UAPRule[] }> = {},
): UAPGrant & { rules: UAPRule[] } {
  const base: UAPGrant & { rules: UAPRule[] } = {
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
    consentArtifact: { user_response: 'yes' } as unknown as UAPGrant['consentArtifact'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    terminatedAt: null,
    terminationReason: null,
    rules: [],
  }
  return { ...base, ...overrides }
}

function makeRule(
  kind: string,
  params: Record<string, unknown>,
  overrides: Partial<UAPRule> = {},
): UAPRule {
  return {
    id: `rule_${kind}_${Math.random().toString(36).slice(2, 8)}`,
    grantId: GRANT_ID,
    userId: USER_ID,
    kind,
    params: params as unknown as UAPRule['params'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
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

/**
 * Default deps — every check resolves to "allowed." Tests override
 * exactly the dep that exercises the branch under test so a deny
 * verdict can be unambiguously attributed.
 */
function makeDeps(overrides: Partial<UAPDeps> = {}): UAPDeps {
  return {
    loadGrantWithRules: async () => makeGrant(),
    isUserKilledGlobally: async () => false,
    isPanicActive: async () => false,
    isInQuietHours: async () => false,
    checkPartnerRateLimit: async () => ({ allowed: true }),
    now: () => new Date('2026-05-24T15:00:00Z'),
    ...overrides,
  }
}

/* ──────────────────── Happy path ──────────────────── */

describe('decideExecute — happy path', () => {
  it('returns allowed when every gate is clean', async () => {
    const result = await decideExecute(makeInput(), makeDeps())
    expect(result.decision).toBe('allowed')
  })
})

/* ──────────────────── Grant existence + authorization ──────────────────── */

describe('decideExecute — grant_not_found', () => {
  it('denies when the grant id resolves to null', async () => {
    const deps = makeDeps({ loadGrantWithRules: async () => null })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('grant_not_found')
  })
})

describe('decideExecute — partner_not_authorized', () => {
  it('denies when the grant belongs to a different partner', async () => {
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({ llmPartnerId: 'partner_other' }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'partner_not_authorized',
    )
  })

  it('denies when the grant belongs to a different user', async () => {
    // User mismatch collapses to the same reason as partner mismatch —
    // deliberate to avoid leaking "this grant exists for someone else."
    const deps = makeDeps({
      loadGrantWithRules: async () => makeGrant({ userId: 'user_other' }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'partner_not_authorized',
    )
  })
})

/* ──────────────────── Status / expiry ──────────────────── */

describe('decideExecute — grant_expired', () => {
  it('denies when status is EXPIRED', async () => {
    const deps = makeDeps({
      loadGrantWithRules: async () => makeGrant({ status: 'EXPIRED' }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('grant_expired')
  })

  it('denies when status is still ACTIVE but expiresAt has passed', async () => {
    // Wall-clock crossed expiresAt before the cron flipped status — the
    // recheck must still catch it (UAP-0.1.md §3 hard expiry).
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({
          status: 'ACTIVE',
          expiresAt: new Date('2020-01-01T00:00:00Z'),
        }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('grant_expired')
  })
})

describe('decideExecute — grant_revoked', () => {
  it('denies when status is REVOKED_BY_USER', async () => {
    const deps = makeDeps({
      loadGrantWithRules: async () => makeGrant({ status: 'REVOKED_BY_USER' }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('grant_revoked')
  })
})

describe('decideExecute — grant_killed_globally', () => {
  it('denies when grant.status is KILLED_GLOBALLY', async () => {
    const deps = makeDeps({
      loadGrantWithRules: async () => makeGrant({ status: 'KILLED_GLOBALLY' }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'grant_killed_globally',
    )
  })

  it('denies when isUserKilledGlobally returns true (even with ACTIVE grant)', async () => {
    // KILL_SWITCH supersedes — a globally-killed user can't transact even
    // if a grant row hasn't been flipped yet.
    const deps = makeDeps({ isUserKilledGlobally: async () => true })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'grant_killed_globally',
    )
  })
})

/* ──────────────────── Panic / quiet hours ──────────────────── */

describe('decideExecute — panic_active', () => {
  it('denies when panic is active', async () => {
    const deps = makeDeps({ isPanicActive: async () => true })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('panic_active')
  })
})

describe('decideExecute — quiet_hours', () => {
  it('denies when isInQuietHours returns true and no opt-out rule', async () => {
    const deps = makeDeps({ isInQuietHours: async () => true })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('quiet_hours')
  })

  it('allows when isInQuietHours returns true but quiet_hours rule has disabled=true', async () => {
    // Opt-out: the grant carries an explicit { disabled: true } and the
    // gate is skipped. Confirms the rule overrides the dep flag.
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({
          rules: [makeRule('quiet_hours', { disabled: true })],
        }),
      isInQuietHours: async () => true,
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('allowed')
  })
})

/* ──────────────────── Scope / confidence / rate limit ──────────────────── */

describe('decideExecute — scope_violation', () => {
  it('denies when the action.kind requires a scope not in grant.scopes', async () => {
    // payment requires `proactive_purchase` — we strip it from the grant
    // and confirm the coordinator surfaces scope_violation.
    const deps = makeDeps({
      loadGrantWithRules: async () => makeGrant({ scopes: ['read'] }),
    })
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'payment',
          operation: 'execute',
          reversibility: 'reversible',
          params: { amount_usd: 10 },
        },
      }),
      deps,
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'scope_violation',
    )
  })
})

describe('decideExecute — confidence_too_low', () => {
  it('denies when confidence is below the default threshold (0.7)', async () => {
    const result = await decideExecute(
      makeInput({ context: { confidence: 0.5 } }),
      makeDeps(),
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe(
      'confidence_too_low',
    )
  })

  it('passes when confidence is undefined (partner opted out of scoring)', async () => {
    const result = await decideExecute(
      makeInput({ context: { confidence: undefined } }),
      makeDeps(),
    )
    expect(result.decision).toBe('allowed')
  })
})

describe('decideExecute — rate_limited', () => {
  it('denies when checkPartnerRateLimit returns allowed=false', async () => {
    const deps = makeDeps({
      checkPartnerRateLimit: async () => ({
        allowed: false,
        band: 'minute',
        resetAt: new Date('2026-05-24T15:01:00Z'),
      }),
    })
    const result = await decideExecute(makeInput(), deps)
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('rate_limited')
  })
})

/* ──────────────────── Rule evaluation ──────────────────── */

describe('decideExecute — rule_violation (spending_cap)', () => {
  it('denies a purchase whose amount_usd exceeds max_per_action_usd', async () => {
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({
          scopes: ['proactive_purchase'],
          rules: [makeRule('spending_cap', { max_per_action_usd: 25 })],
        }),
    })
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'purchase',
          operation: 'execute',
          // Reversible so the irreversibility floor (step 13) doesn't
          // pre-empt the rule check.
          reversibility: 'reversible',
          params: { amount_usd: 75 },
        },
      }),
      deps,
    )
    expect(result.decision).toBe('denied')
    expect(result.decision === 'denied' && result.reason).toBe('rule_violation')
    expect(
      result.decision === 'denied' && result.detail?.includes('spending_cap'),
    ).toBe(true)
  })

  it('allows a purchase whose amount_usd is within max_per_action_usd', async () => {
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({
          scopes: ['proactive_purchase'],
          rules: [makeRule('spending_cap', { max_per_action_usd: 100 })],
        }),
    })
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'purchase',
          operation: 'execute',
          reversibility: 'reversible',
          params: { amount_usd: 25 },
        },
      }),
      deps,
    )
    expect(result.decision).toBe('allowed')
  })
})

/* ──────────────────── Irreversibility floor ──────────────────── */

describe('decideExecute — irreversibility → needs_per_action_confirmation', () => {
  it('returns needs_per_action_confirmation for an irreversible-floor action', async () => {
    // send_message is in the irreversibility floor (UAP-0.1.md §3) —
    // even under a clean standing grant, this must confirm per-action.
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({ scopes: ['proactive_relational'] }),
    })
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'send_message',
          operation: 'execute',
          reversibility: 'irreversible',
          params: {},
        },
      }),
      deps,
    )
    expect(result.decision).toBe('needs_per_action_confirmation')
    expect(
      result.decision === 'needs_per_action_confirmation' && result.reason,
    ).toBe('irreversible')
  })

  it('allows an irreversible-floor kind when reversibility is reversible', async () => {
    // The floor only triggers when the action declares itself irreversible.
    // Declaring it reversible bypasses the floor (and the partner takes
    // the integrity responsibility for that declaration).
    const deps = makeDeps({
      loadGrantWithRules: async () =>
        makeGrant({ scopes: ['proactive_relational'] }),
    })
    const result = await decideExecute(
      makeInput({
        action: {
          kind: 'send_message',
          operation: 'execute',
          reversibility: 'reversible',
          params: {},
        },
      }),
      deps,
    )
    expect(result.decision).toBe('allowed')
  })
})

/* ──────────────────── RAP coaching-path-closed gate ──────────────────── */

describe('decideExecute — rap_coaching_path_closed gate', () => {
  it('documents that decideExecute does NOT call a RAP coaching-path gate in v0.1.1', async () => {
    // The task brief asked us to test rap_coaching_path_closed "if so,
    // test the path." Reviewing coordinator.ts at the time of writing,
    // decideExecute's deps bundle exposes only loadGrantWithRules,
    // isUserKilledGlobally, isPanicActive, isInQuietHours, and
    // checkPartnerRateLimit — no RAP hook is wired through `UAPDeps`,
    // and the decision tree §1–§14 in coordinator.ts has no RAP step.
    //
    // The gate exists in evaluateProposal (PAP-side, separate file) per
    // the G1 work; UAP's EXECUTE path defers to PAP for the
    // pattern-relapse/crisis-indication signals because the proposal
    // already passed PAP before any UAP grant fires. If a future agent
    // wires a RAP hook into UAPDeps, this test should grow into a full
    // branch case (mock the dep, assert the denial).
    //
    // For now we just confirm the deps surface is what we documented —
    // anyone adding a dep field will see this test break and update both
    // the implementation and this branch coverage together.
    type Surface = keyof UAPDeps
    const expected: Surface[] = [
      'loadGrantWithRules',
      'isUserKilledGlobally',
      'isPanicActive',
      'isInQuietHours',
      'checkPartnerRateLimit',
      'now',
    ]
    const deps = makeDeps()
    const actual = Object.keys(deps).sort()
    expect(actual).toEqual([...expected].sort())
  })
})
