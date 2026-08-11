/**
 * DECISION 4 (wiring) — the UAP decision mediates a COYL-owned effect.
 *
 * POST /api/eap/v1/action/request is where an EAP effect is authorized,
 * recorded and dispatched. When the caller presents a UAP execution
 * receipt it is redeemed HERE, before the ActionRequest row exists and
 * before executeAction runs.
 *
 * Failing-first: pre-change this route had no receipt concept. Every
 * request below — matching, mismatched, replayed, expired — returned
 * `allowed` and fired the executor, because an /execute ALLOW was
 * advisory and nothing downstream checked it.
 *
 * What is deliberately NOT asserted: that a receipt is REQUIRED. A
 * partner that never calls /execute cannot be compelled by this route
 * to hold one, and requiring it unconditionally is a breaking change
 * for existing EAP clients. The last test pins that boundary so the
 * scope of the guarantee stays honest in both directions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.hoisted(() => {
  process.env.UAP_EXECUTION_RECEIPT_KEY = 'test-receipt-key-not-a-real-secret'
  process.env.UAP_AUDIT_SIGNING_KEY_PRIVATE =
    'MC4CAQAwBQYDK2VwBCIEIJB8TMa9k5P/XEZN6vgivB/4Ogw1bX3FQLWp0qWnCK3j'
  process.env.UAP_AUDIT_SIGNING_KEY_PUBLIC =
    'MCowBQYDK2VwAyEA3McU9iTU6uFWl68n3sKRLLRqrKQ0SG6g0QAN4WKSeYo='
})

const state = vi.hoisted(() => ({
  actionRows: new Map<
    string,
    {
      id: string
      actionKey: string
      decision: string
      decisionReason: string | null
      executionToken: string | null
      executedAt: Date | null
      outcome: string | null
      llmPartnerId: string
    }
  >(),
  uapAuditRows: new Map<string, Record<string, unknown>>(),
  eapAuditRows: [] as Array<{ eventKind: string; payload: unknown }>,
  executeCalls: 0,
  nextRowId: 1,
}))

vi.mock('@repo/database', () => {
  const uapModel = {
    findFirst: async () => null,
    findUnique: async ({ where }: { where: { id: string } }) =>
      state.uapAuditRows.get(where.id) ?? null,
    findMany: async () => Array.from(state.uapAuditRows.values()),
    count: async () => 0,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = (data.id as string | undefined) ?? `uap_${state.nextRowId++}`
      if (state.uapAuditRows.has(id)) {
        throw Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
        })
      }
      const row = { ...data, id }
      state.uapAuditRows.set(id, row)
      return row
    },
  }

  return {
    Prisma: { JsonNull: Symbol('JsonNull') },
    prisma: {
      lLMPartner: {
        findUnique: async () => ({
          id: 'partnerrc1',
          apiKeyHash: 'hash',
          active: true,
        }),
      },
      panicState: { findUnique: async () => null },
      device: {
        findUnique: async () => ({
          id: 'devicerc1',
          userId: 'userrc1',
          deviceClass: 'ios_phone',
          paired: true,
          pushToken: 'ExponentPushToken[x]',
          manifestJson: {},
          online: true,
          lastSeenAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          model: null,
          os: null,
          deviceFingerprint: 'fp',
          pairedAt: new Date(),
          operationalState: null,
          deviceTokenHash: null,
          deviceTokenLastFour: null,
          lastSensorSnapshot: null,
          lastSensorAt: null,
        }),
      },
      scopeGrant: { findFirst: async () => ({ id: 'sg1' }) },
      actionRequest: {
        findUnique: async ({ where }: { where: { actionKey: string } }) =>
          state.actionRows.get(where.actionKey) ?? null,
        upsert: async ({
          where,
          create,
        }: {
          where: { actionKey: string }
          create: Record<string, unknown>
        }) => {
          const existing = state.actionRows.get(where.actionKey)
          if (existing) return { ...existing }
          const row = {
            id: `ar_${state.nextRowId++}`,
            actionKey: where.actionKey,
            decision: String(create.decision),
            decisionReason: (create.decisionReason as string | null) ?? null,
            executionToken:
              (create.executionToken as string | undefined) ?? null,
            executedAt: null,
            outcome: null,
            llmPartnerId: String(create.llmPartnerId),
          }
          state.actionRows.set(where.actionKey, row)
          return { ...row }
        },
      },
      eAPAuditEntry: {
        create: async ({
          data,
        }: {
          data: { eventKind: string; payloadJson: unknown }
        }) => {
          state.eapAuditRows.push({
            eventKind: data.eventKind,
            payload: data.payloadJson,
          })
          return {}
        },
      },
      uAPAuditEntry: uapModel,
      $transaction: async <T,>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
        fn({ $queryRaw: async () => [], uAPAuditEntry: uapModel }),
    },
  }
})

vi.mock('bcryptjs', () => ({ default: { compare: async () => true } }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@/lib/eap/action-executor', () => ({
  executeAction: async () => {
    state.executeCalls++
  },
}))
vi.mock('@/lib/eap/action-rate-limit', () => ({
  checkActionRateLimit: async () => ({ allowed: true }),
}))
vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: async () => false,
}))

import { POST } from '../action/request/route'
import {
  issueExecutionReceipt,
  computeActionHash,
} from '@/lib/uap/execution-receipt'

const USER = 'userrc1'
const DEVICE = 'devicerc1'
const PARTNER = 'partnerrc1'
const GRANT = 'grantrc1'
const DECISION_ID = 'aud_111111111111111111111111'
const ACTUATOR = 'haptic'
const PARAMS = { pattern: 'double_tap' }
const UAP_KIND = 'focus_callout'

/**
 * The receipt a partner would hold after POST /api/uap/v1/execute with
 * `action.params` describing the exact effect it intends to fire.
 */
function receiptFor(
  overrides: {
    actuator?: string
    deviceId?: string
    params?: Record<string, unknown>
    partnerId?: string
    userId?: string
    now?: Date
    ttlSeconds?: number
  } = {},
) {
  return issueExecutionReceipt({
    auditId: DECISION_ID,
    userId: overrides.userId ?? USER,
    grantId: GRANT,
    partnerId: overrides.partnerId ?? PARTNER,
    actionKind: UAP_KIND,
    actionParams: {
      actuator: overrides.actuator ?? ACTUATOR,
      deviceId: overrides.deviceId ?? DEVICE,
      params: overrides.params ?? PARAMS,
    },
    now: overrides.now,
    ttlSeconds: overrides.ttlSeconds,
  })
}

function makeReq(bodyOverrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/eap/v1/action/request', {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_pap_partnerrc1_deadbeefdeadbeef',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      actionKey: `ak_${Math.random().toString(36).slice(2)}`,
      userId: USER,
      deviceId: DEVICE,
      actuator: ACTUATOR,
      params: PARAMS,
      scopeRequested: 'edge:focus',
      reasoning: 'tab thrash detected',
      ...bodyOverrides,
    }),
  })
}

type Body = {
  decision: string
  reason?: string
  detail?: string
  executionToken?: string
}

beforeEach(() => {
  state.actionRows.clear()
  state.uapAuditRows.clear()
  state.eapAuditRows = []
  state.executeCalls = 0
  state.nextRowId = 1
})

describe('action/request — execution receipt redemption', () => {
  it('a matching receipt is redeemed and the effect fires', async () => {
    const r = receiptFor()
    const res = await POST(makeReq({ executionReceipt: r.receiptId }))
    const body = (await res.json()) as Body
    expect(body.decision).toBe('allowed')
    expect(state.executeCalls).toBe(1)
    // One consumption record in the UAP audit chain.
    const consumed = Array.from(state.uapAuditRows.values()).filter(
      (r2) => r2.operation === 'consume',
    )
    expect(consumed).toHaveLength(1)
  })

  it('a SWAPPED effect is refused — the receipt authorized one actuator, not "an actuator" (pre-change: allowed, executor fired)', async () => {
    const r = receiptFor({ actuator: 'haptic' })
    const res = await POST(
      makeReq({ executionReceipt: r.receiptId, actuator: 'open_url' }),
    )
    const body = (await res.json()) as Body
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('action_hash_mismatch')
    expect(state.executeCalls).toBe(0)
  })

  it('SWAPPED params are refused', async () => {
    const r = receiptFor({ params: { pattern: 'double_tap' } })
    const res = await POST(
      makeReq({
        executionReceipt: r.receiptId,
        params: { pattern: 'jackhammer' },
      }),
    )
    const body = (await res.json()) as Body
    expect(body.reason).toBe('action_hash_mismatch')
    expect(state.executeCalls).toBe(0)
  })

  it('a receipt authorized for a DIFFERENT device is refused', async () => {
    const r = receiptFor({ deviceId: 'someotherdevice' })
    const res = await POST(makeReq({ executionReceipt: r.receiptId }))
    const body = (await res.json()) as Body
    expect(body.reason).toBe('action_hash_mismatch')
    expect(state.executeCalls).toBe(0)
  })

  it('REPLAYING a spent receipt under a new actionKey fires nothing (pre-change: one approval, unlimited effects)', async () => {
    const r = receiptFor()
    const first = (await (
      await POST(makeReq({ executionReceipt: r.receiptId }))
    ).json()) as Body
    expect(first.decision).toBe('allowed')
    expect(state.executeCalls).toBe(1)

    const second = (await (
      await POST(makeReq({ executionReceipt: r.receiptId }))
    ).json()) as Body
    expect(second.decision).toBe('denied')
    expect(second.reason).toBe('receipt_already_consumed')
    expect(state.executeCalls).toBe(1)
  })

  it('an EXPIRED receipt is refused', async () => {
    const r = receiptFor({
      now: new Date(Date.now() - 3600_000),
      ttlSeconds: 60,
    })
    const body = (await (
      await POST(makeReq({ executionReceipt: r.receiptId }))
    ).json()) as Body
    expect(body.reason).toBe('receipt_expired')
    expect(state.executeCalls).toBe(0)
  })

  it('a FORGED receipt is refused', async () => {
    const body = (await (
      await POST(makeReq({ executionReceipt: 'rcpt_ZmFrZQ.bWFj' }))
    ).json()) as Body
    expect(body.decision).toBe('denied')
    expect(state.executeCalls).toBe(0)
  })

  it("another partner cannot redeem this partner's receipt", async () => {
    const r = receiptFor({ partnerId: 'partner_someone_else' })
    const body = (await (
      await POST(makeReq({ executionReceipt: r.receiptId }))
    ).json()) as Body
    expect(body.reason).toBe('receipt_partner_mismatch')
    expect(state.executeCalls).toBe(0)
  })

  it('a receipt minted for a different user cannot be spent against this one', async () => {
    const r = receiptFor({ userId: 'user_victim' })
    const body = (await (
      await POST(makeReq({ executionReceipt: r.receiptId }))
    ).json()) as Body
    // userId is inside the hashed tuple, so the mismatch surfaces as a
    // hash mismatch rather than needing a separate subject check.
    expect(body.reason).toBe('action_hash_mismatch')
    expect(state.executeCalls).toBe(0)
  })

  it('an idempotent replay of the same actionKey does not re-consume or re-fire', async () => {
    const r = receiptFor()
    const key = 'ak_stable_1'
    await POST(makeReq({ executionReceipt: r.receiptId, actionKey: key }))
    expect(state.executeCalls).toBe(1)

    const replay = (await (
      await POST(makeReq({ executionReceipt: r.receiptId, actionKey: key }))
    ).json()) as Body
    expect(replay.decision).toBe('allowed')
    expect(state.executeCalls).toBe(1)
    const consumed = Array.from(state.uapAuditRows.values()).filter(
      (r2) => r2.operation === 'consume',
    )
    expect(consumed).toHaveLength(1)
  })

  it('a request with NO receipt keeps the pre-existing behavior — the honest scope boundary', async () => {
    // Documented, not accidental: this route mediates presented
    // authorizations; it does not (and cannot) manufacture one for a
    // partner that never asked UAP for a decision.
    const body = (await (await POST(makeReq())).json()) as Body
    expect(body.decision).toBe('allowed')
    expect(state.executeCalls).toBe(1)
  })

  it('the hash the route computes is the documented (kind, actuator, deviceId, params) tuple', () => {
    // Pins the contract a partner must satisfy at UAP EXECUTE time to
    // get a receipt this executor will accept.
    const r = receiptFor()
    expect(r.actionHash).toBe(
      computeActionHash({
        userId: USER,
        grantId: GRANT,
        actionKind: UAP_KIND,
        actionParams: { actuator: ACTUATOR, deviceId: DEVICE, params: PARAMS },
        decisionId: DECISION_ID,
      }),
    )
  })
})
