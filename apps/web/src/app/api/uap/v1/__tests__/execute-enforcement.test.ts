/**
 * POST /api/uap/v1/execute — route-level enforcement tests.
 *
 *  1. Idempotency (threat model T5): a replayed EXECUTE with the same
 *     idempotency_key returns the ORIGINAL decision + audit id without
 *     writing a second audit row or re-signing. (FAILS pre-fix: the
 *     route had no idempotency key at all — every replay re-decided,
 *     re-signed, and appended a new audit row.)
 *  2. User-level rules: a RULE_DECLARE with grant_id=null must deny an
 *     execute that violates it. (FAILS pre-fix: the coordinator was
 *     wired to plain loadGrant, which never loads user-level rules.)
 *  3. Provenance binding: the audit_id in the response and in the
 *     signed provenance payload is the id of the PERSISTED audit row.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  auditRows: new Map<string, Record<string, unknown> & { id: string; createdAt: Date }>(),
  writeCalls: 0,
  userRules: [] as Array<{
    id: string
    grantId: string | null
    userId: string
    kind: string
    params: Record<string, unknown>
    createdAt: Date
  }>,
}))

const GRANT = {
  id: 'grantexec1',
  userId: 'userexec1',
  llmPartnerId: 'partnerexec1',
  scopes: ['proactive_relational'],
  expiresAt: new Date(Date.now() + 86_400_000),
  status: 'ACTIVE',
  consentArtifact: {},
  createdAt: new Date(),
  terminatedAt: null,
  terminationReason: null,
}

vi.mock('@repo/database', () => ({ prisma: {} }))

vi.mock('@/lib/uap/uap-partner-auth', () => ({
  authenticateUAPPartner: async () => ({
    partner: { id: 'partnerexec1', active: true },
  }),
}))

vi.mock('@/lib/uap/grant-store', () => ({
  // Plain loader: grant-scoped rules only (there are none).
  loadGrant: async (id: string) =>
    id === GRANT.id ? { ...GRANT, rules: [] } : null,
  // Merged loader: includes the user-level rules.
  loadGrantWithAllRules: async (id: string) =>
    id === GRANT.id ? { ...GRANT, rules: state.userRules } : null,
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
vi.mock('@/lib/uap/rate-limit', () => ({
  checkUAPPartnerRateLimit: async () => ({
    allowed: true,
    remaining: 10,
    resetAt: new Date(),
    band: 'partner_hourly',
  }),
}))
vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: async () => false,
}))

vi.mock('@/lib/uap/audit', () => ({
  writeAuditEntry: async (input: Record<string, unknown> & { auditId?: string }) => {
    state.writeCalls++
    const id = input.auditId ?? `cuid_${state.writeCalls}`
    if (state.auditRows.has(id)) {
      throw Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      })
    }
    const row = { ...input, id, createdAt: new Date() }
    state.auditRows.set(id, row)
    return row
  },
  loadAuditEntry: async (id: string) => state.auditRows.get(id) ?? null,
}))

vi.mock('@/lib/uap/provenance', () => ({
  signProvenance: async (params: { auditId: string; actionKind: string }) => ({
    payload: {
      v: 'uap-0.1.1',
      agent: 'partnerexec1',
      subject: 'did:coyl:userexec1',
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

import { POST } from '../execute/route'

function makeReq(bodyOverrides: Record<string, unknown> = {}): Request {
  return new Request('https://coyl.ai/api/uap/v1/execute', {
    method: 'POST',
    headers: {
      authorization: 'Bearer coyl_uap_partnerexec1_abcdef0123456789abcdef0123456789',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      grant_id: GRANT.id,
      action: {
        kind: 'send_message',
        operation: 'send',
        reversibility: 'reversible',
      },
      recipient: { kind: 'external_email', hint: 'friend@example.com' },
      ...bodyOverrides,
    }),
  })
}

beforeEach(() => {
  state.auditRows.clear()
  state.writeCalls = 0
  state.userRules = []
})

describe('execute — idempotency key (T5 replay)', () => {
  it('a replay with the same idempotency_key returns the original decision + audit id and writes NO second audit row (FAILS pre-fix: no idempotency existed; replays re-executed)', async () => {
    const res1 = await POST(makeReq({ idempotency_key: 'op-123' }))
    const body1 = (await res1.json()) as {
      decision: string
      audit_id: string
      provenance?: { payload: { audit_id: string } }
    }
    expect(body1.decision).toBe('allowed')
    expect(state.auditRows.size).toBe(1)

    const res2 = await POST(makeReq({ idempotency_key: 'op-123' }))
    const body2 = (await res2.json()) as {
      decision: string
      audit_id: string
      idempotent_replay?: boolean
      provenance?: { payload: { audit_id: string } }
    }
    expect(body2.decision).toBe('allowed')
    expect(body2.idempotent_replay).toBe(true)
    expect(body2.audit_id).toBe(body1.audit_id)
    // The load-bearing assertion: ONE audit row total.
    expect(state.auditRows.size).toBe(1)
    // The original provenance envelope is returned, not a re-signed one.
    expect(body2.provenance?.payload.audit_id).toBe(body1.audit_id)
  })

  it('different idempotency keys produce different audit rows', async () => {
    await POST(makeReq({ idempotency_key: 'op-a' }))
    await POST(makeReq({ idempotency_key: 'op-b' }))
    expect(state.auditRows.size).toBe(2)
  })

  it('rejects a malformed idempotency_key', async () => {
    const res = await POST(makeReq({ idempotency_key: 'bad key with spaces!' }))
    expect(res.status).toBe(400)
  })
})

describe('execute — user-level rules are enforced', () => {
  it('denies on a user-level recipient_denylist (grant_id=null) rule (FAILS pre-fix: the coordinator was wired to plain loadGrant and never saw user-level rules)', async () => {
    state.userRules = [
      {
        id: 'rule_ul_1',
        grantId: null,
        userId: GRANT.userId,
        kind: 'recipient_denylist',
        params: { denied_recipients: ['friend@example.com'] },
        createdAt: new Date(),
      },
    ]
    const res = await POST(makeReq())
    const body = (await res.json()) as { decision: string; reason?: string }
    expect(body.decision).toBe('denied')
    expect(body.reason).toBe('rule_violation')
  })
})

describe('execute — provenance/audit id binding', () => {
  it('the response audit_id, the signed payload audit_id, and the persisted row id are the same id', async () => {
    const res = await POST(makeReq())
    const body = (await res.json()) as {
      audit_id: string
      provenance?: { payload: { audit_id: string } }
    }
    expect(body.provenance?.payload.audit_id).toBe(body.audit_id)
    expect(state.auditRows.get(body.audit_id)).toBeDefined()
    expect(body.audit_id).toMatch(/^aud_[a-f0-9]{24}$/)
  })
})
