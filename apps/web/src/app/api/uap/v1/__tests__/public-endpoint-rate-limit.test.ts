/**
 * Per-IP rate limits on the two UNAUTHENTICATED endpoints:
 *   GET  /api/uap/v1/provenance/[auditId]
 *   POST /api/eap/v1/action/outcome
 *
 * Both fail against the pre-fix routes, which imported no limiter and
 * proceeded straight to the DB for any anonymous caller.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  limited: false,
}))

vi.mock('@repo/database', () => ({
  Prisma: {},
  prisma: {
    uAPAuditEntry: {
      findUnique: async () => null,
    },
    actionRequest: {
      findUnique: async () => null,
      update: async () => ({}),
    },
    eAPAuditEntry: {
      create: async () => ({}),
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  checkDistributedRateLimit: async () => ({
    configured: true,
    limited: state.limited,
  }),
}))

import { GET as provenanceGET } from '../provenance/[auditId]/route'
import { POST as outcomePOST } from '../../../eap/v1/action/outcome/route'

beforeEach(() => {
  state.limited = false
})

describe('provenance — per-IP rate limit', () => {
  const req = () =>
    new Request(
      'https://coyl.ai/api/uap/v1/provenance/aud_0123456789abcdef01234567',
      { headers: { 'x-forwarded-for': '203.0.113.9' } },
    )
  const ctx = {
    params: Promise.resolve({ auditId: 'aud_0123456789abcdef01234567' }),
  }

  it('429s when the IP is over budget (FAILS pre-fix: no limiter existed on this unauthenticated route)', async () => {
    state.limited = true
    const res = await provenanceGET(req(), ctx)
    expect(res.status).toBe(429)
  })

  it('proceeds to normal handling when under budget', async () => {
    const res = await provenanceGET(req(), ctx)
    expect(res.status).toBe(404) // row not found — but the route ran
  })
})

describe('action/outcome — per-IP rate limit', () => {
  const req = () =>
    new Request('https://coyl.ai/api/eap/v1/action/outcome', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.9',
      },
      body: JSON.stringify({
        executionToken: 'et_deadbeef',
        outcome: 'executed',
      }),
    })

  it('429s when the IP is over budget (FAILS pre-fix: no limiter existed on this unauthenticated route)', async () => {
    state.limited = true
    const res = await outcomePOST(req())
    expect(res.status).toBe(429)
  })

  it('proceeds to normal handling when under budget', async () => {
    const res = await outcomePOST(req())
    expect(res.status).toBe(404) // unknown token — but the route ran
  })
})
