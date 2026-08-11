/**
 * Route-level coverage for Decisions 1, 2 and 4 across BOTH decision
 * endpoints.
 *
 * PRECHECK and EXECUTE share decideExecute, but they wire it
 * separately — a gate can be live on one and missing on the other, and
 * that has happened before in this codebase (the merged-rules loader
 * and the UAP-aware rate limiter were both execute-only at one point).
 * These tests exercise the real handlers, not the coordinator.
 *
 * Failing-first, per block:
 *   • fail-closed rules: pre-change both handlers answered `allowed`
 *     for a rule the engine could not parse.
 *   • frequency_cap: pre-change the coordinator case was a no-op, so
 *     both handlers answered `allowed` at any count; PRECHECK also had
 *     no counter wired at all.
 *   • receipt envelope: pre-change /execute returned no action_hash and
 *     no execution_receipt — an ALLOW was advisory.
 *   • cap race: pre-change writeAuditEntry took no guards, so the
 *     losing racer's ALLOW was recorded and returned.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  rules: [] as Array<{
    id: string
    grantId: string | null
    userId: string
    kind: string
    params: unknown
    createdAt: Date
  }>,
  windowCount: 0,
  capRaceLost: false,
  auditRows: new Map<string, Record<string, unknown> & { id: string; createdAt: Date }>(),
  guardedWrites: 0,
  consentArtifact: { consentClass: 'coordinator_verified' } as Record<string, unknown>,
}))

const GRANT = {
  id: 'grantdecide1',
  userId: 'userdecide1',
  llmPartnerId: 'partnerdecide1',
  scopes: ['proactive_focus', 'proactive_relational', 'proactive_purchase'],
  expiresAt: new Date(Date.now() + 86_400_000),
  status: 'ACTIVE',
  createdAt: new Date(),
  terminatedAt: null,
  terminationReason: null,
}

vi.mock('@repo/database', () => ({ prisma: {} }))

vi.mock('@/lib/uap/uap-partner-auth', () => ({
  authenticateUAPPartner: async () => ({
    partner: { id: 'partnerdecide1', active: true },
  }),
}))

vi.mock('@/lib/uap/grant-store', () => ({
  loadGrant: async (id: string) =>
    id === GRANT.id
      ? { ...GRANT, consentArtifact: state.consentArtifact, rules: [] }
      : null,
  loadGrantWithAllRules: async (id: string) =>
    id === GRANT.id
      ? { ...GRANT, consentArtifact: state.consentArtifact, rules: state.rules }
      : null,
}))

vi.mock('@/lib/uap/kill-switch', () => ({
  isUserKilledGlobally: async () => false,
}))
vi.mock('@/lib/coordinator/panic-check', () => ({
  isPanicActive: async () => false,
}))
vi.mock('@/lib/coordinator/quiet-hours', () => ({
  isInQuietHours: async () => false,
}))
vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: async () => false,
}))

vi.mock('@/lib/uap/rate-limit', () => ({
  checkUAPPartnerRateLimit: async () => ({
    allowed: true,
    remaining: 10,
    resetAt: new Date(),
    band: 'partner_hourly',
  }),
  countAllowedExecutesInWindow: async () => state.windowCount,
}))

vi.mock('@/lib/uap/audit', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/uap/audit')>('@/lib/uap/audit')
  return {
    UAPFrequencyCapExceededError: actual.UAPFrequencyCapExceededError,
    writeAuditEntry: async (
      input: Record<string, unknown> & { auditId?: string },
      options?: { frequencyGuards?: Array<Record<string, unknown>> },
    ) => {
      if (options?.frequencyGuards?.length) {
        state.guardedWrites++
        if (state.capRaceLost) {
          throw new actual.UAPFrequencyCapExceededError(
            options.frequencyGuards[0] as never,
            99,
          )
        }
      }
      const id = input.auditId ?? `cuid_${state.auditRows.size + 1}`
      const row = { ...input, id, createdAt: new Date() }
      state.auditRows.set(id, row)
      return row
    },
    loadAuditEntry: async (id: string) => state.auditRows.get(id) ?? null,
  }
})

vi.mock('@/lib/uap/provenance', () => ({
  signProvenance: async (params: { auditId: string; actionKind: string }) => ({
    payload: {
      v: 'uap-0.1.1',
      agent: 'partnerdecide1',
      subject: 'did:coyl:userdecide1',
      grant_id: GRANT.id,
      audit_id: params.auditId,
      action_kind: params.actionKind,
      recipient_hint: '',
      issued_at: new Date().toISOString(),
      audit_url: `https://coyl.ai/api/uap/v1/provenance/${params.auditId}`,
    },
    signature: 'c2ln',
    publicKey: 'cHVi',
    algorithm: 'ed25519',
  }),
}))

import { POST as EXECUTE } from '../execute/route'
import { POST as PRECHECK } from '../precheck/route'

function makeReq(
  path: 'execute' | 'precheck',
  bodyOverrides: Record<string, unknown> = {},
): Request {
  return new Request(`https://coyl.ai/api/uap/v1/${path}`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_uap_partnerdecide1_abcdef0123456789',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      grant_id: GRANT.id,
      action: {
        kind: 'focus_callout',
        operation: 'propose',
        reversibility: 'reversible',
      },
      ...bodyOverrides,
    }),
  })
}

type DecisionBody = {
  decision: string
  reason?: string
  detail?: string
  audit_id?: string
  consent_class?: string
  action_hash?: string
  execution_receipt?: {
    receipt: string
    action_hash: string
    expires_at: string
    single_use: boolean
  }
  provenance?: unknown
}

beforeEach(() => {
  state.rules = []
  state.windowCount = 0
  state.capRaceLost = false
  state.auditRows.clear()
  state.guardedWrites = 0
  state.consentArtifact = { consentClass: 'coordinator_verified' }
})

function userRule(kind: string, params: unknown) {
  return {
    id: `rule_${kind}`,
    grantId: null,
    userId: GRANT.userId,
    kind,
    params,
    createdAt: new Date(),
  }
}

/* ──────────────────── Decision 1, both handlers ──────────────────── */

describe('fail-closed rules reach BOTH precheck and execute', () => {
  it('EXECUTE denies rule_unevaluable on a malformed user-level rule', async () => {
    state.rules = [userRule('spending_cap', { max_per_action_usd: 'fifty' })]
    const body = (await (
      await EXECUTE(
        makeReq('execute', {
          action: {
            kind: 'purchase',
            operation: 'execute',
            reversibility: 'reversible',
            params: { amount_usd: 10 },
          },
        }),
      )
    ).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('rule_unevaluable')
    // The denial is audited, like every other UAP decision.
    expect(state.auditRows.size).toBe(1)
  })

  it('PRECHECK gives the SAME answer — an "allowed" precheck that execute would refuse is a lie', async () => {
    state.rules = [userRule('spending_cap', { max_per_action_usd: 'fifty' })]
    const body = (await (
      await PRECHECK(
        makeReq('precheck', {
          action: {
            kind: 'purchase',
            operation: 'execute',
            reversibility: 'reversible',
            params: { amount_usd: 10 },
          },
        }),
      )
    ).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('rule_unevaluable')
    // PRECHECK still writes nothing.
    expect(state.auditRows.size).toBe(0)
  })

  it('an unknown rule kind denies on both handlers', async () => {
    state.rules = [userRule('geo_fence', { radius_m: 100 })]
    const exec = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    const pre = (await (await PRECHECK(makeReq('precheck'))).json()) as DecisionBody
    expect(exec.reason).toBe('rule_unevaluable')
    expect(pre.reason).toBe('rule_unevaluable')
  })
})

/* ──────────────────── Decision 2, both handlers ──────────────────── */

describe('frequency_cap is wired into BOTH handlers', () => {
  it('EXECUTE denies at the cap', async () => {
    state.rules = [userRule('frequency_cap', { max: 2, window_seconds: 3600 })]
    state.windowCount = 2
    const body = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('frequency_cap_exceeded')
  })

  it('PRECHECK denies at the cap WITHOUT consuming — no audit row, so the read cost the partner nothing', async () => {
    state.rules = [userRule('frequency_cap', { max: 2, window_seconds: 3600 })]
    state.windowCount = 2
    const body = (await (await PRECHECK(makeReq('precheck'))).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('frequency_cap_exceeded')
    expect(state.auditRows.size).toBe(0)
  })

  it('PRECHECK under the cap allows, and still writes nothing', async () => {
    state.rules = [userRule('frequency_cap', { max: 2, window_seconds: 3600 })]
    state.windowCount = 1
    const body = (await (await PRECHECK(makeReq('precheck'))).json()) as DecisionBody
    expect(body.decision).toBe('allowed')
    expect(state.auditRows.size).toBe(0)
  })

  it('EXECUTE passes the cap to the audit writer as an atomic guard', async () => {
    state.rules = [userRule('frequency_cap', { max: 5, window_seconds: 60 })]
    state.windowCount = 0
    await EXECUTE(makeReq('execute'))
    expect(state.guardedWrites).toBe(1)
  })

  it('losing the cap race at append time converts the ALLOW into a recorded denial', async () => {
    state.rules = [userRule('frequency_cap', { max: 1, window_seconds: 60 })]
    state.windowCount = 0
    state.capRaceLost = true
    const body = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('frequency_cap_exceeded')
    // No receipt is handed out for an authorization that did not happen.
    expect(body.execution_receipt).toBeUndefined()
    expect(state.auditRows.size).toBe(1)
    expect(state.auditRows.values().next().value?.decision).toBe('denied')
  })

  it('a receipt is not minted when the race is lost on a REPRESENTATION action, and the signed provenance is discarded', async () => {
    state.rules = [userRule('frequency_cap', { max: 1, window_seconds: 60 })]
    state.capRaceLost = true
    const body = (await (
      await EXECUTE(
        makeReq('execute', {
          action: {
            kind: 'send_message',
            operation: 'execute',
            reversibility: 'reversible',
          },
          recipient: { kind: 'external_email', hint: 'a@b.c' },
        }),
      )
    ).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.provenance).toBeUndefined()
    expect(body.execution_receipt).toBeUndefined()
  })
})

/* ──────────────────── Decision 4 envelope ──────────────────── */

describe('execute envelope — receipt + consent class', () => {
  it('an ALLOW returns a single-use receipt bound to an action_hash (pre-change: neither field existed and the ALLOW was advisory)', async () => {
    const body = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    expect(body.decision).toBe('allowed')
    expect(body.action_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(body.execution_receipt?.receipt).toMatch(/^rcpt_/)
    expect(body.execution_receipt?.action_hash).toBe(body.action_hash)
    expect(body.execution_receipt?.single_use).toBe(true)
    expect(Date.parse(body.execution_receipt!.expires_at)).toBeGreaterThan(
      Date.now(),
    )
  })

  it('a DENIAL carries no receipt — there is nothing to spend', async () => {
    state.rules = [userRule('geo_fence', {})]
    const body = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.execution_receipt).toBeUndefined()
    expect(body.action_hash).toBeUndefined()
  })

  it('an idempotent REPLAY returns the original decision and does NOT mint a second capability', async () => {
    const first = (await (
      await EXECUTE(makeReq('execute', { idempotency_key: 'op-rcpt-1' }))
    ).json()) as DecisionBody
    expect(first.execution_receipt?.receipt).toBeDefined()

    const replay = (await (
      await EXECUTE(makeReq('execute', { idempotency_key: 'op-rcpt-1' }))
    ).json()) as DecisionBody & { idempotent_replay?: boolean }
    expect(replay.idempotent_replay).toBe(true)
    expect(replay.audit_id).toBe(first.audit_id)
    expect(replay.execution_receipt).toBeUndefined()
  })

  it('surfaces the consent class that backed the decision', async () => {
    state.consentArtifact = { consentClass: 'partner_attested' }
    const body = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    expect(body.consent_class).toBe('partner_attested')
  })

  it('an unstamped legacy grant reports `unclassified`, never coordinator_verified', async () => {
    state.consentArtifact = { userResponse: 'explicit_grant' }
    const body = (await (await EXECUTE(makeReq('execute'))).json()) as DecisionBody
    expect(body.consent_class).toBe('unclassified')
  })

  it('a partner-attested grant is refused a floor action at the route, not just in the coordinator', async () => {
    state.consentArtifact = { consentClass: 'partner_attested' }
    const body = (await (
      await EXECUTE(
        makeReq('execute', {
          action: {
            kind: 'send_message',
            operation: 'execute',
            reversibility: 'reversible',
          },
          recipient: { kind: 'external_email', hint: 'a@b.c' },
        }),
      )
    ).json()) as DecisionBody
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('consent_class_insufficient')
    expect(body.provenance).toBeUndefined()
  })
})
