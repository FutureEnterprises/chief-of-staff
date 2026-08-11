/**
 * DECISION 3 (issuance) — POST /api/uap/v1/grant stamps the class the
 * door implies, and nothing in the body can change it.
 *
 * Failing-first: pre-change the route computed `issuerKind` and then
 * literally discarded it (`void issuerKind`); createGrant received no
 * class at all, so `params.consentClass` was `undefined` on both paths.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  clerkId: null as string | null,
  createdWith: [] as Array<Record<string, unknown>>,
}))

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: async () => (state.clerkId ? { id: 'userconsent1' } : null),
    },
    lLMPartner: {
      findUnique: async () => ({ id: 'partnerconsent1', active: true }),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: state.clerkId }),
}))

vi.mock('@/lib/uap/uap-partner-auth', () => ({
  authenticateUAPPartner: async () => ({
    partner: { id: 'partnerconsent1', active: true },
  }),
}))

vi.mock('@/lib/uap/grant-store', () => ({
  createGrant: async (params: Record<string, unknown>) => {
    state.createdWith.push(params)
    return { id: 'grantconsent1' }
  },
}))

vi.mock('@/lib/uap/audit', () => ({
  writeAuditEntry: async () => ({ id: 'aud_x' }),
}))

import { POST } from '../grant/route'

function body(overrides: Record<string, unknown> = {}) {
  return {
    scopes: ['proactive_relational'],
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    consent_artifact: {
      version: '0.1.1',
      shown_to_user_at: new Date().toISOString(),
      user_response: 'explicit_grant',
      ui_surface: 'partner.sdk',
    },
    ...overrides,
  }
}

function partnerReq(overrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/uap/v1/grant', {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_uap_partnerconsent1_abcdef0123456789',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body({ user_id: 'userconsent1', ...overrides })),
  })
}

function sessionReq(overrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/uap/v1/grant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body({ partner_id: 'partnerconsent1', ...overrides })),
  })
}

beforeEach(() => {
  state.clerkId = null
  state.createdWith = []
})

describe('grant issuance — consent class stamping', () => {
  it('the partner Bearer path stamps partner_attested (pre-change: no class was passed at all)', async () => {
    const res = await partnerReq()
    const response = await POST(res)
    expect(response.status).toBe(201)
    expect(state.createdWith[0]?.consentClass).toBe('partner_attested')
    const json = (await response.json()) as { consent_class?: string }
    expect(json.consent_class).toBe('partner_attested')
  })

  it('the COYL-hosted session ceremony stamps coordinator_verified', async () => {
    state.clerkId = 'clerk_consent_user'
    const response = await POST(sessionReq())
    expect(response.status).toBe(201)
    expect(state.createdWith[0]?.consentClass).toBe('coordinator_verified')
  })

  it('a partner CANNOT claim coordinator_verified through the body — the class follows the door, not the payload', async () => {
    const response = await POST(
      partnerReq({
        consent_class: 'coordinator_verified',
        consentClass: 'coordinator_verified',
        consent_artifact: {
          version: '0.1.1',
          user_response: 'explicit_grant',
          ui_surface: 'partner.sdk',
          consentClass: 'coordinator_verified',
        },
      }),
    )
    expect(response.status).toBe(201)
    expect(state.createdWith[0]?.consentClass).toBe('partner_attested')
  })
})

describe('grant issuance — inline rule params must be evaluable', () => {
  it('refuses an inline rule the coordinator could not evaluate (which would otherwise deny every action under the new grant)', async () => {
    const response = await POST(
      partnerReq({ rules: [{ kind: 'spending_cap', params: { max_per_action_usd: '25' } }] }),
    )
    expect(response.status).toBe(400)
    const json = (await response.json()) as { error: string }
    expect(json.error).toBe('invalid_rule_params')
    expect(state.createdWith).toHaveLength(0)
  })

  it('accepts a well-formed inline frequency_cap (pre-change the kind was refused outright by the rule route)', async () => {
    const response = await POST(
      partnerReq({
        rules: [{ kind: 'frequency_cap', params: { max: 3, window_seconds: 3600 } }],
      }),
    )
    expect(response.status).toBe(201)
  })
})
