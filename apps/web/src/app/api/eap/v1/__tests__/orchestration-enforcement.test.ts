/**
 * POST /api/eap/v1/orchestration — enforcement tests.
 *
 *  1. Rate limit: orchestration steps consume the SAME two-band budget
 *     single actions do. (FAILS pre-fix: the route carried a local
 *     placeholder that returned allowed=true unconditionally, so a
 *     partner throttled on /action/request could bypass the cap
 *     entirely by wrapping actions in orchestrations.)
 *  2. RAP gate: a closed coaching path denies the whole orchestration.
 *     (FAILS pre-fix: no RAP check existed.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  coachingClosed: false,
  executeCalls: 0,
  nextRowId: 1,
}))

vi.mock('@repo/database', () => ({
  Prisma: {},
  prisma: {
    lLMPartner: {
      findUnique: async () => ({
        id: 'partneror1',
        apiKeyHash: 'hash',
        active: true,
      }),
    },
    panicState: {
      findUnique: async () => null,
    },
    device: {
      findUnique: async () => ({
        id: 'deviceor1',
        userId: 'useror1',
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
    orchestration: {
      upsert: async () => ({ id: `orch_${state.nextRowId++}` }),
    },
    actionRequest: {
      upsert: async ({
        where,
        create,
      }: {
        where: { actionKey: string }
        create: Record<string, unknown>
      }) => ({
        id: `ar_${state.nextRowId++}`,
        actionKey: where.actionKey,
        executionToken: (create.executionToken as string | undefined) ?? null,
      }),
    },
    eAPAuditEntry: {
      create: async () => ({}),
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

import { POST } from '../orchestration/route'
import { checkActionRateLimit, PARTNER_USER_LIMIT } from '@/lib/eap/action-rate-limit'

function makeReq(body: Record<string, unknown>): Request {
  return new Request('https://coyl.ai/api/eap/v1/orchestration', {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_pap_partneror1_deadbeefdeadbeef',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function step(overrides: Record<string, unknown> = {}) {
  return {
    deviceId: 'deviceor1',
    actuator: 'push_notification',
    scopeRequested: 'edge:phone:push',
    reasoning: 'test',
    ...overrides,
  }
}

beforeEach(() => {
  state.coachingClosed = false
  state.executeCalls = 0
  state.nextRowId = 1
})

describe('orchestration — rate limit enforcement', () => {
  it('steps consume the shared action budget and deny once band A is exhausted (FAILS pre-fix: the local placeholder allowed everything)', async () => {
    // Exhaust band A for this (partner, user) through the SHARED
    // limiter — the same budget /action/request consumes.
    for (let i = 0; i < PARTNER_USER_LIMIT; i++) {
      await checkActionRateLimit({
        partnerId: 'partneror1',
        userId: 'useror1',
        deviceId: 'deviceor1',
        actuator: 'push_notification',
      })
    }

    const res = await POST(
      makeReq({
        orchestrationKey: 'ok_rl_1',
        userId: 'useror1',
        atomicity: 'best_effort',
        steps: [step()],
      }),
    )
    const body = (await res.json()) as {
      decision: string
      perStepResults: Array<{ decision: string; reason?: string }>
    }

    expect(body.decision).toBe('denied')
    expect(body.perStepResults[0]!.decision).toBe('denied')
    expect(body.perStepResults[0]!.reason).toBe('rate_limited_partner')
    expect(state.executeCalls).toBe(0)
  })
})

describe('orchestration — RAP gate', () => {
  it('denies the whole orchestration when the coaching path is closed (FAILS pre-fix: no RAP check existed)', async () => {
    state.coachingClosed = true
    const res = await POST(
      makeReq({
        orchestrationKey: 'ok_rap_1',
        userId: 'useror2',
        atomicity: 'all_or_none',
        steps: [step(), step()],
      }),
    )
    const body = (await res.json()) as {
      decision: string
      reason: string
      perStepResults: Array<{ reason: string }>
    }
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('rap_coaching_path_closed')
    expect(body.perStepResults.length).toBe(2)
    expect(state.executeCalls).toBe(0)
  })
})
