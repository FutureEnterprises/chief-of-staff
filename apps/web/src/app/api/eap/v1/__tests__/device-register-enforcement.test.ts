/**
 * POST /api/eap/v1/device/register — enforcement tests.
 *
 *  1. Partner ↔ user binding: a partner must hold at least one active
 *     ScopeGrant from the target user to register a device into their
 *     fleet — the same gate capability-discovery applies to READS.
 *     (FAILS pre-fix: any authenticated partner could plant a paired
 *     device with an attacker-controlled push token onto any user's
 *     account and receive a device credential for it.)
 *  2. Cross-user fingerprint guard: re-registering a fingerprint owned
 *     by a DIFFERENT user must 409, not silently rewrite that user's
 *     device row (manifest + pushToken — where their action pushes are
 *     delivered). (FAILS pre-fix: the upsert update path rewrote it.)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  clerkId: null as string | null,
  hasScopeGrant: false,
  existingDevice: null as
    | { id: string; userId: string; paired: boolean; deviceTokenHash: string | null }
    | null,
  upsertCalls: 0,
}))

vi.mock('@repo/database', () => ({
  Prisma: {},
  prisma: {
    lLMPartner: {
      findUnique: async () => ({
        id: 'partnerdr1',
        apiKeyHash: 'hash',
        active: true,
      }),
    },
    user: {
      findUnique: async ({
        where,
      }: {
        where: { id?: string; clerkId?: string }
      }) => {
        if (where.clerkId) return { id: 'userdr_session' }
        return { id: where.id }
      },
    },
    scopeGrant: {
      findFirst: async () => (state.hasScopeGrant ? { id: 'sg1' } : null),
    },
    device: {
      findUnique: async () => state.existingDevice,
      upsert: async () => {
        state.upsertCalls++
        return { id: 'device_new', deviceClass: 'ios_phone', paired: true }
      },
      update: async () => ({}),
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

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: state.clerkId }),
}))

vi.mock('@/lib/eap/device-token', () => ({
  mintDeviceToken: async (deviceId: string) => ({
    token: `coyl_eap_${deviceId}_deadbeef`,
    deviceTokenHash: 'hash',
    deviceTokenLastFour: 'beef',
  }),
}))

import { POST } from '../device/register/route'

function partnerReq(bodyOverrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/eap/v1/device/register', {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_pap_partnerdr1_deadbeefdeadbeef',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'userdrtarget',
      deviceClass: 'ios_phone',
      deviceFingerprint: 'fp_abc',
      manifest: { sensors: [], actuators: [], userGrantedScopes: [] },
      ...bodyOverrides,
    }),
  })
}

function sessionReq(bodyOverrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/eap/v1/device/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      deviceClass: 'browser_extension',
      deviceFingerprint: 'fp_session',
      manifest: { sensors: [], actuators: [], userGrantedScopes: [] },
      ...bodyOverrides,
    }),
  })
}

beforeEach(() => {
  state.clerkId = null
  state.hasScopeGrant = false
  state.existingDevice = null
  state.upsertCalls = 0
})

describe('device/register — partner binding', () => {
  it('403s a partner with no ScopeGrant from the target user (FAILS pre-fix: any partner could plant a device on any account)', async () => {
    const res = await POST(partnerReq())
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('no_scope_granted')
    expect(state.upsertCalls).toBe(0)
  })

  it('registers when the partner holds an active ScopeGrant', async () => {
    state.hasScopeGrant = true
    const res = await POST(partnerReq())
    expect(res.status).toBe(200)
    expect(state.upsertCalls).toBe(1)
  })
})

describe('device/register — cross-user fingerprint guard', () => {
  it('409s when the fingerprint belongs to a DIFFERENT user (FAILS pre-fix: the upsert silently rewrote the other user\'s device row + pushToken)', async () => {
    state.clerkId = 'clerk_session_user'
    state.existingDevice = {
      id: 'device_victim',
      userId: 'user_victim',
      paired: true,
      deviceTokenHash: 'x',
    }
    const res = await POST(sessionReq({ deviceFingerprint: 'fp_victim' }))
    expect(res.status).toBe(409)
    expect(state.upsertCalls).toBe(0)
  })

  it('re-register of the caller\'s OWN fingerprint still works', async () => {
    state.clerkId = 'clerk_session_user'
    state.existingDevice = {
      id: 'device_own',
      userId: 'userdr_session',
      paired: true,
      deviceTokenHash: 'x',
    }
    const res = await POST(sessionReq())
    expect(res.status).toBe(200)
    expect(state.upsertCalls).toBe(1)
  })
})
