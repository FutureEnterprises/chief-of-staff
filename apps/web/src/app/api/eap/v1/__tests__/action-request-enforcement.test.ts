/**
 * POST /api/eap/v1/action/request — enforcement tests.
 *
 *  1. Replay idempotency: re-POSTing an actionKey must NOT re-fire the
 *     actuator or append duplicate audit rows, and must return the
 *     STORED decision. (FAILS pre-fix: the upsert protected the row
 *     but the route unconditionally re-invoked executeAction — N
 *     replays = N pushes to the user's device — and re-wrote an
 *     'action_allowed' audit row per replay.)
 *  2. RAP gate: a closed coaching path denies EAP action requests.
 *     (FAILS pre-fix: the RAP check simply did not exist on the EAP
 *     plane — "RAP supersedes every other protocol" was UAP/PAP-only.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  panic: null as { active: boolean; expiresAt: Date | null } | null,
  coachingClosed: false,
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
  auditRows: [] as Array<{ eventKind: string }>,
  executeCalls: 0,
  nextRowId: 1,
}))

vi.mock('@repo/database', () => ({
  Prisma: {},
  prisma: {
    lLMPartner: {
      findUnique: async () => ({
        id: 'partnerar1',
        apiKeyHash: 'hash',
        active: true,
      }),
    },
    panicState: {
      findUnique: async () => state.panic,
    },
    device: {
      findUnique: async () => ({
        id: 'devicear1',
        userId: 'userar1',
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
    scopeGrant: {
      findFirst: async () => ({ id: 'sg1' }),
    },
    actionRequest: {
      upsert: async ({
        where,
        create,
        select: _select,
      }: {
        where: { actionKey: string }
        create: Record<string, unknown>
        update: Record<string, unknown>
        select?: Record<string, boolean>
      }) => {
        const existing = state.actionRows.get(where.actionKey)
        if (existing) {
          // update: {} — return the stored row untouched.
          return { ...existing }
        }
        const row = {
          id: `ar_${state.nextRowId++}`,
          actionKey: where.actionKey,
          decision: String(create.decision),
          decisionReason: (create.decisionReason as string | null) ?? null,
          executionToken: (create.executionToken as string | undefined) ?? null,
          executedAt: null,
          outcome: null,
          llmPartnerId: String(create.llmPartnerId),
        }
        state.actionRows.set(where.actionKey, row)
        return { ...row }
      },
    },
    eAPAuditEntry: {
      create: async ({ data }: { data: { eventKind: string } }) => {
        state.auditRows.push({ eventKind: data.eventKind })
        return {}
      },
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: { compare: async () => true },
}))

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
}))

vi.mock('@/lib/eap/action-executor', () => ({
  executeAction: async () => {
    state.executeCalls++
  },
}))

vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: async () => state.coachingClosed,
}))

import { POST } from '../action/request/route'

function makeReq(bodyOverrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/eap/v1/action/request', {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_pap_partnerar1_deadbeefdeadbeef',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      actionKey: 'ak_replay_1',
      userId: 'userar1',
      deviceId: 'devicear1',
      actuator: 'push_notification',
      scopeRequested: 'edge:phone:push',
      reasoning: 'test',
      ...bodyOverrides,
    }),
  })
}

beforeEach(() => {
  state.panic = null
  state.coachingClosed = false
  state.actionRows.clear()
  state.auditRows = []
  state.executeCalls = 0
  state.nextRowId = 1
})

async function flushMicrotasks() {
  await new Promise((r) => setTimeout(r, 0))
}

describe('action/request — replay idempotency', () => {
  it('first request fires the executor once; a replay does NOT re-fire it or duplicate audit (FAILS pre-fix: executor + audit ran on every replay)', async () => {
    const res1 = await POST(makeReq())
    const body1 = (await res1.json()) as {
      decision: string
      executionToken: string
      actionRequestId: string
    }
    await flushMicrotasks()
    expect(body1.decision).toBe('allowed')
    expect(state.executeCalls).toBe(1)
    expect(
      state.auditRows.filter((a) => a.eventKind === 'action_allowed').length,
    ).toBe(1)

    const res2 = await POST(makeReq())
    const body2 = (await res2.json()) as {
      decision: string
      executionToken: string
      actionRequestId: string
      idempotentReplay?: boolean
    }
    await flushMicrotasks()

    expect(body2.decision).toBe('allowed')
    expect(body2.idempotentReplay).toBe(true)
    // Same row, same token — and crucially, NO second dispatch and NO
    // second audit row.
    expect(body2.actionRequestId).toBe(body1.actionRequestId)
    expect(body2.executionToken).toBe(body1.executionToken)
    expect(state.executeCalls).toBe(1)
    expect(
      state.auditRows.filter((a) => a.eventKind === 'action_allowed').length,
    ).toBe(1)
  })

  it('a replay of a previously-DENIED actionKey reports the stored denial, not a fabricated allow (FAILS pre-fix: the route answered "allowed" with a null token and fired the executor)', async () => {
    // Seed a stored denied row under the same actionKey.
    state.actionRows.set('ak_replay_denied', {
      id: 'ar_denied',
      actionKey: 'ak_replay_denied',
      decision: 'denied',
      decisionReason: 'panic_active',
      executionToken: null,
      executedAt: null,
      outcome: null,
      llmPartnerId: 'partnerar1',
    })

    const res = await POST(makeReq({ actionKey: 'ak_replay_denied' }))
    const body = (await res.json()) as {
      decision: string
      reason?: string
      idempotentReplay?: boolean
    }
    await flushMicrotasks()

    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('panic_active')
    expect(body.idempotentReplay).toBe(true)
    expect(state.executeCalls).toBe(0)
  })
})

describe('action/request — RAP gate', () => {
  it('denies with rap_coaching_path_closed when RAP has closed the path (FAILS pre-fix: no RAP check existed on the EAP plane)', async () => {
    state.coachingClosed = true
    const res = await POST(makeReq({ actionKey: 'ak_rap_1' }))
    const body = (await res.json()) as { decision: string; reason: string }
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('rap_coaching_path_closed')
    expect(state.executeCalls).toBe(0)
  })
})
