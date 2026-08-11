/**
 * POST /api/uap/v1/grant — user-session issuance path.
 *
 * The COYL-hosted consent ceremony (/consent/uap) POSTs to this route
 * under the user's Clerk session with `partner_id` in the body — that
 * page is the spec's T8 mitigation ("the consent UI MUST be hosted by
 * the UAP coordinator, not the partner"). Pre-fix, the route was
 * partner-Bearer-only, so the ceremony's POST 401'd — the ONLY working
 * issuance path was the partner self-attesting the user's consent.
 * These tests fail against that route.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  clerkId: null as string | null,
  partnerRow: null as { id: string; active: boolean } | null,
  createdGrants: [] as Array<{ userId: string; llmPartnerId: string }>,
}))

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: async () =>
        state.clerkId ? { id: 'usergrant_session' } : null,
    },
    lLMPartner: {
      findUnique: async () => state.partnerRow,
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: state.clerkId }),
}))

vi.mock('@/lib/uap/uap-partner-auth', () => ({
  authenticateUAPPartner: async () => ({
    error: new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
    }),
  }),
}))

vi.mock('@/lib/uap/grant-store', () => ({
  createGrant: async (params: { userId: string; llmPartnerId: string }) => {
    state.createdGrants.push({
      userId: params.userId,
      llmPartnerId: params.llmPartnerId,
    })
    return { id: 'grant_new' }
  },
}))

vi.mock('@/lib/uap/audit', () => ({
  writeAuditEntry: async () => ({ id: 'aud_x' }),
}))

import { POST } from '../grant/route'

function sessionReq(bodyOverrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/uap/v1/grant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      partner_id: 'partnergrant1',
      scopes: ['proactive_food'],
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      consent_artifact: {
        version: '0.1.1',
        shown_to_user_at: new Date().toISOString(),
        user_response: 'explicit_grant',
        ui_surface: 'coyl.consent.uap.v1',
      },
      ...bodyOverrides,
    }),
  })
}

beforeEach(() => {
  state.clerkId = null
  state.partnerRow = { id: 'partnergrant1', active: true }
  state.createdGrants = []
})

describe('grant — user-session issuance (COYL-hosted consent ceremony)', () => {
  it('a signed-in user can issue a grant to a named partner (FAILS pre-fix: the consent form\'s session POST 401\'d — the T8 ceremony could not issue grants at all)', async () => {
    state.clerkId = 'clerk_grant_user'
    const res = await POST(sessionReq())
    expect(res.status).toBe(201)
    expect(state.createdGrants).toEqual([
      { userId: 'usergrant_session', llmPartnerId: 'partnergrant1' },
    ])
  })

  it('binds the grant to the SESSION user — a foreign user_id in the body 403s', async () => {
    state.clerkId = 'clerk_grant_user'
    const res = await POST(sessionReq({ user_id: 'user_somebody_else' }))
    expect(res.status).toBe(403)
    expect(state.createdGrants.length).toBe(0)
  })

  it('401s a signed-out session POST', async () => {
    const res = await POST(sessionReq())
    expect(res.status).toBe(401)
  })

  it('404s an unknown or inactive partner_id', async () => {
    state.clerkId = 'clerk_grant_user'
    state.partnerRow = { id: 'partnergrant1', active: false }
    const res = await POST(sessionReq())
    expect(res.status).toBe(404)
  })
})
