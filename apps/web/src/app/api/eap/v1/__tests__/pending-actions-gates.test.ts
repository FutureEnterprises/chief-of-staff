/**
 * GET /api/eap/v1/devices/[id]/pending-actions — delivery-time gates.
 *
 * The classic hole: an action gated at REQUEST time keeps delivering
 * after the world changed. Each test here seeds a queued, allowed
 * ActionRequest and then asserts the route WITHHOLDS it when a
 * protection is active at DELIVERY time. All three fail against the
 * pre-fix route, which returned queued actions unconditionally.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  panic: null as { active: boolean; expiresAt: Date | null } | null,
  killEvent: null as { initiatedAt: Date } | null,
  coachingClosed: false,
  actionRows: [] as Array<{
    id: string
    executionToken: string | null
    actuator: string
    paramsJson: Record<string, unknown>
    scopeRequested: string
    reasoning: string
    confidence: number | null
    llmPartnerId: string
    createdAt: Date
  }>,
}))

vi.mock('@repo/database', () => ({
  prisma: {
    panicState: {
      findUnique: async () => state.panic,
    },
    device: {
      update: async () => ({}),
    },
    actionRequest: {
      findMany: async ({
        where,
      }: {
        where: {
          deviceId: string
          createdAt: { gte?: Date; gt?: Date }
        }
      }) => {
        return state.actionRows.filter((r) => {
          if (where.createdAt.gte && r.createdAt.getTime() < where.createdAt.gte.getTime()) {
            return false
          }
          if (where.createdAt.gt && r.createdAt.getTime() <= where.createdAt.gt.getTime()) {
            return false
          }
          return true
        })
      },
    },
  },
}))

vi.mock('@/lib/eap/device-auth', () => ({
  authenticateDeviceRequest: async () => ({
    ok: true,
    userId: 'user_pa',
    device: {
      id: 'devicepa1',
      userId: 'user_pa',
      deviceClass: 'ios_phone',
      paired: true,
      deviceTokenHash: 'x',
    },
    via: 'device_token',
  }),
}))

vi.mock('@/lib/uap/kill-switch', () => ({
  loadKillSwitchEvent: async () => state.killEvent,
}))

vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: async () => state.coachingClosed,
}))

import { GET } from '../devices/[id]/pending-actions/route'

function makeReq(): [Request, { params: Promise<{ id: string }> }] {
  return [
    new Request('https://coyl.ai/api/eap/v1/devices/devicepa1/pending-actions'),
    { params: Promise.resolve({ id: 'devicepa1' }) },
  ]
}

function seedAction(createdAt = new Date()) {
  state.actionRows.push({
    id: `ar_${state.actionRows.length + 1}`,
    executionToken: `et_${state.actionRows.length + 1}`,
    actuator: 'push_notification',
    paramsJson: {},
    scopeRequested: 'edge:phone:push',
    reasoning: 'test',
    confidence: null,
    llmPartnerId: 'partner_pa',
    createdAt,
  })
}

beforeEach(() => {
  state.panic = null
  state.killEvent = null
  state.coachingClosed = false
  state.actionRows = []
})

describe('pending-actions — delivery-time gates', () => {
  it('baseline: delivers a queued allowed action when no protection is active', async () => {
    seedAction()
    const res = await GET(...makeReq())
    const body = (await res.json()) as { actions: unknown[] }
    expect(body.actions.length).toBe(1)
  })

  it('PANIC halts delivery immediately — queued actions are withheld (FAILS pre-fix: panic only gated new requests; the queue kept delivering)', async () => {
    seedAction()
    state.panic = { active: true, expiresAt: new Date(Date.now() + 60_000) }
    const res = await GET(...makeReq())
    const body = (await res.json()) as { actions: unknown[] }
    expect(body.actions).toEqual([])
  })

  it('an EXPIRED panic does not withhold delivery', async () => {
    seedAction()
    state.panic = { active: true, expiresAt: new Date(Date.now() - 1000) }
    const res = await GET(...makeReq())
    const body = (await res.json()) as { actions: unknown[] }
    expect(body.actions.length).toBe(1)
  })

  it('a closed coaching path (RAP crisis window) withholds delivery (FAILS pre-fix)', async () => {
    seedAction()
    state.coachingClosed = true
    const res = await GET(...makeReq())
    const body = (await res.json()) as { actions: unknown[] }
    expect(body.actions).toEqual([])
  })

  it('KILL SWITCH kills the in-flight queue: actions queued before the kill never deliver; actions requested after (fresh authority) do (FAILS pre-fix)', async () => {
    const before = new Date(Date.now() - 60_000)
    const killAt = new Date(Date.now() - 30_000)
    const after = new Date(Date.now() - 10_000)
    seedAction(before)
    seedAction(after)
    state.killEvent = { initiatedAt: killAt }

    const res = await GET(...makeReq())
    const body = (await res.json()) as {
      actions: Array<{ id: string }>
    }
    expect(body.actions.length).toBe(1)
    expect(body.actions[0]!.id).toBe('ar_2')
  })
})
