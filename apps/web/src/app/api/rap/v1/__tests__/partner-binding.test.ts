/**
 * RAP partner-facing routes — partner ↔ user binding enforcement.
 *
 * All three routes documented "for users they have grants on" but
 * enforced nothing:
 *   - /status let ANY authenticated partner read whether ANY user id
 *     is currently crisis-classified (health-adjacent disclosure).
 *   - /assess let ANY authenticated partner WRITE a CRISIS_INDICATION
 *     assessment for ANY user — closing that user's coaching path and
 *     denying their entire UAP/EAP surface for the window (a
 *     one-request DoS on a stranger's authority surface).
 *   - /escalation let ANY partner append escalation records to ANY
 *     assessment.
 * Every test tagged FAILS pre-fix asserts the deny that did not exist.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  hasUapGrant: false,
  hasScopeGrant: false,
  assessments: new Map<string, { id: string; userId: string }>(),
  writeAssessmentCalls: 0,
  recordEscalationCalls: 0,
  coachingClosed: false,
}))

vi.mock('@repo/database', () => ({
  prisma: {
    uAPGrant: {
      findFirst: async () => (state.hasUapGrant ? { id: 'g1' } : null),
    },
    scopeGrant: {
      findFirst: async () => (state.hasScopeGrant ? { id: 'sg1' } : null),
    },
  },
}))

vi.mock('@/lib/uap/uap-partner-auth', () => ({
  authenticateUAPPartner: async () => ({
    partner: { id: 'partnerrap1', active: true },
  }),
}))

vi.mock('@/lib/auth', () => ({
  requireDbUser: async () => {
    throw new Error('no session in these tests')
  },
}))

vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: async () => state.coachingClosed,
  writeAssessment: async (input: { userId: string }) => {
    state.writeAssessmentCalls++
    return {
      id: 'asmt_new',
      userId: input.userId,
      coachingPathClosed: false,
    }
  },
  loadAssessment: async (id: string) => state.assessments.get(id) ?? null,
  recordEscalation: async () => {
    state.recordEscalationCalls++
    return { id: 'esc_new' }
  },
}))

import { GET as statusGET } from '../status/route'
import { POST as assessPOST } from '../assess/route'
import { POST as escalationPOST } from '../escalation/route'

const PARTNER_AUTH = {
  authorization: 'Bearer coyl_uap_partnerrap1_abcdef0123456789abcdef0123456789',
}

beforeEach(() => {
  state.hasUapGrant = false
  state.hasScopeGrant = false
  state.assessments.clear()
  state.writeAssessmentCalls = 0
  state.recordEscalationCalls = 0
  state.coachingClosed = false
})

describe('GET /api/rap/v1/status — partner binding', () => {
  function req(userId: string): Request {
    return new Request(
      `https://coyl.ai/api/rap/v1/status?user_id=${userId}`,
      { headers: PARTNER_AUTH },
    )
  }

  it('403s a partner with no grant from the target user (FAILS pre-fix: any partner could read any user\'s crisis state)', async () => {
    const res = await statusGET(req('user_stranger'))
    expect(res.status).toBe(403)
  })

  it('200s a partner holding an active UAP grant from the user', async () => {
    state.hasUapGrant = true
    const res = await statusGET(req('user_related'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { coaching_path_closed: boolean }
    expect(body.coaching_path_closed).toBe(false)
  })

  it('200s a partner holding an active EAP ScopeGrant from the user', async () => {
    state.hasScopeGrant = true
    const res = await statusGET(req('user_related'))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/rap/v1/assess — partner binding', () => {
  function req(userId: string): Request {
    return new Request('https://coyl.ai/api/rap/v1/assess', {
      method: 'POST',
      headers: { ...PARTNER_AUTH, 'content-type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        signal_chain: [{ kind: 'chat_message', text: 'hello' }],
      }),
    })
  }

  it('403s and writes NOTHING for a partner with no grant from the user (FAILS pre-fix: any partner could close any user\'s coaching path)', async () => {
    const res = await assessPOST(req('user_stranger'))
    expect(res.status).toBe(403)
    expect(state.writeAssessmentCalls).toBe(0)
  })

  it('proceeds for a partner holding a grant', async () => {
    state.hasUapGrant = true
    const res = await assessPOST(req('user_related'))
    expect(res.status).toBe(200)
    expect(state.writeAssessmentCalls).toBe(1)
  })
})

describe('POST /api/rap/v1/escalation — partner binding', () => {
  function req(assessmentId: string): Request {
    return new Request('https://coyl.ai/api/rap/v1/escalation', {
      method: 'POST',
      headers: { ...PARTNER_AUTH, 'content-type': 'application/json' },
      body: JSON.stringify({
        assessment_id: assessmentId,
        escalated_to: '988',
        envelope_kind: 'crisis_referral',
      }),
    })
  }

  it('404s an unknown assessment id', async () => {
    const res = await escalationPOST(req('asmt_missing'))
    expect(res.status).toBe(404)
    expect(state.recordEscalationCalls).toBe(0)
  })

  it('403s when the partner has no grant from the assessment\'s user (FAILS pre-fix: any partner could append escalations to any assessment)', async () => {
    state.assessments.set('asmt_1', { id: 'asmt_1', userId: 'user_stranger' })
    const res = await escalationPOST(req('asmt_1'))
    expect(res.status).toBe(403)
    expect(state.recordEscalationCalls).toBe(0)
  })

  it('201s when the partner holds a grant from the assessment\'s user', async () => {
    state.assessments.set('asmt_1', { id: 'asmt_1', userId: 'user_related' })
    state.hasScopeGrant = true
    const res = await escalationPOST(req('asmt_1'))
    expect(res.status).toBe(201)
    expect(state.recordEscalationCalls).toBe(1)
  })
})
