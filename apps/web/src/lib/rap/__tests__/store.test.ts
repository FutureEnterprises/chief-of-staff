/**
 * RAP store — unit tests for the persistence layer.
 *
 * Covers every public function:
 *   - writeAssessment              (auto-derives ttl + coachingPathClosed per class)
 *   - loadAssessment               (by id)
 *   - loadUserAssessments          (limit + since filtering)
 *   - isUserCoachingPathClosed     (sliding-window crisis/emergency lock)
 *   - reopenCoachingPath           (flips closed→open + records reopen audit)
 *   - recordEscalation             (one assessment → many escalation rows)
 *
 * All DB access is mocked via `vi.mock('@repo/database')` — no real
 * connection is opened. The mocked prisma client exposes the model
 * methods the store touches: `rAPAssessment.create / findUnique /
 * findFirst / findMany / updateMany` and `rAPEscalation.create`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

/* ──────────────────── prisma mock ──────────────────── */

// vi.mock is hoisted above all imports — anything it references must
// either be declared via vi.hoisted() or live inside the factory closure.
// We use vi.hoisted() so the same mock object is also accessible inside
// the test bodies for assertion + reset.
const { mockPrisma, JsonNullSentinel } = vi.hoisted(() => {
  return {
    mockPrisma: {
      rAPAssessment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      rAPEscalation: {
        create: vi.fn(),
      },
    },
    JsonNullSentinel: { __jsonNull: true } as const,
  }
})

vi.mock('@repo/database', () => ({
  prisma: mockPrisma,
  Prisma: { JsonNull: JsonNullSentinel },
}))

// IMPORTANT: import the module under test AFTER vi.mock so the mock is
// applied.
import {
  writeAssessment,
  loadAssessment,
  loadUserAssessments,
  isUserCoachingPathClosed,
  reopenCoachingPath,
  recordEscalation,
} from '../store'

/* ──────────────────── Reset between tests ──────────────────── */

beforeEach(() => {
  vi.clearAllMocks()
})

/* ──────────────────── writeAssessment ──────────────────── */

describe('writeAssessment', () => {
  it('persists all required fields + auto-sets coachingPathClosed=false for ROUTINE_FRICTION', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_1' })

    await writeAssessment({
      userId: 'user_a',
      riskClass: 'ROUTINE_FRICTION',
      rationaleSignature: 'sha256_hex_of_chain',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [{ kind: 'chat_message', text: 'routine', timestamp: '2026-05-24T12:00:00.000Z' }],
      triggerKind: 'bip_signal',
    })

    expect(mockPrisma.rAPAssessment.create).toHaveBeenCalledTimes(1)
    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.userId).toBe('user_a')
    expect(payload.riskClass).toBe('ROUTINE_FRICTION')
    expect(payload.rationaleSignature).toBe('sha256_hex_of_chain')
    expect(payload.classifierVersion).toBe('rap-v0.1-rules-only')
    expect(payload.triggerKind).toBe('bip_signal')
    // Default closure: ROUTINE_FRICTION never closes the coaching path.
    expect(payload.coachingPathClosed).toBe(false)
    // Default TTL for ROUTINE_FRICTION = 1800s (30 minutes).
    expect(payload.ttlSeconds).toBe(1800)
  })

  it('auto-sets coachingPathClosed=true for CRISIS_INDICATION', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_2' })

    await writeAssessment({
      userId: 'user_b',
      riskClass: 'CRISIS_INDICATION',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'bip_signal',
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.coachingPathClosed).toBe(true)
    expect(payload.ttlSeconds).toBe(60)
  })

  it('auto-sets coachingPathClosed=true for LEGAL_OR_MEDICAL_EMERGENCY', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_3' })

    await writeAssessment({
      userId: 'user_c',
      riskClass: 'LEGAL_OR_MEDICAL_EMERGENCY',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'manual',
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.coachingPathClosed).toBe(true)
    expect(payload.ttlSeconds).toBe(60)
  })

  it('auto-sets coachingPathClosed=false for PATTERN_RELAPSE (coaching continues, intensified)', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_4' })

    await writeAssessment({
      userId: 'user_d',
      riskClass: 'PATTERN_RELAPSE',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'bip_signal',
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.coachingPathClosed).toBe(false)
    expect(payload.ttlSeconds).toBe(600)
  })

  it('respects an explicit caller-supplied ttlSeconds + coachingPathClosed override', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_5' })

    await writeAssessment({
      userId: 'user_e',
      riskClass: 'CRISIS_INDICATION',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'manual',
      ttlSeconds: 30,
      coachingPathClosed: false,
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.ttlSeconds).toBe(30)
    expect(payload.coachingPathClosed).toBe(false)
  })

  it('persists the routing envelope when one is provided', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_6' })

    const envelope = {
      kind: 'crisis_referral',
      jurisdictionalLines: [{ name: '988', number: '988', channel: ['call', 'text'] }],
    }

    await writeAssessment({
      userId: 'user_f',
      riskClass: 'CRISIS_INDICATION',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'manual',
      routingEnvelope: envelope,
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.routingEnvelope).toEqual(envelope)
  })

  it('uses Prisma.JsonNull when routingEnvelope is null/omitted', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_7' })

    await writeAssessment({
      userId: 'user_g',
      riskClass: 'ROUTINE_FRICTION',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'bip_signal',
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.routingEnvelope).toBe(JsonNullSentinel)
  })

  it('threads triggerRefId through when supplied', async () => {
    mockPrisma.rAPAssessment.create.mockResolvedValue({ id: 'asmt_8' })

    await writeAssessment({
      userId: 'user_h',
      riskClass: 'PATTERN_RELAPSE',
      rationaleSignature: 'sig',
      classifierVersion: 'rap-v0.1-rules-only',
      signalChain: [],
      triggerKind: 'pap_proposal',
      triggerRefId: 'prop_abc',
    })

    const payload = mockPrisma.rAPAssessment.create.mock.calls[0][0].data
    expect(payload.triggerRefId).toBe('prop_abc')
  })
})

/* ──────────────────── loadAssessment ──────────────────── */

describe('loadAssessment', () => {
  it('looks up by id and returns the row', async () => {
    const row = {
      id: 'asmt_x',
      userId: 'user_x',
      riskClass: 'ROUTINE_FRICTION',
    }
    mockPrisma.rAPAssessment.findUnique.mockResolvedValue(row)

    const result = await loadAssessment('asmt_x')
    expect(mockPrisma.rAPAssessment.findUnique).toHaveBeenCalledWith({
      where: { id: 'asmt_x' },
    })
    expect(result).toEqual(row)
  })

  it('returns null when no row exists', async () => {
    mockPrisma.rAPAssessment.findUnique.mockResolvedValue(null)
    const result = await loadAssessment('asmt_missing')
    expect(result).toBeNull()
  })
})

/* ──────────────────── loadUserAssessments ──────────────────── */

describe('loadUserAssessments', () => {
  it('defaults to limit=50 ordered by createdAt DESC when limit is omitted', async () => {
    mockPrisma.rAPAssessment.findMany.mockResolvedValue([])

    await loadUserAssessments({ userId: 'user_q' })

    expect(mockPrisma.rAPAssessment.findMany).toHaveBeenCalledTimes(1)
    const args = mockPrisma.rAPAssessment.findMany.mock.calls[0][0]
    expect(args.where.userId).toBe('user_q')
    expect(args.orderBy).toEqual({ createdAt: 'desc' })
    expect(args.take).toBe(50)
  })

  it('respects an explicit limit', async () => {
    mockPrisma.rAPAssessment.findMany.mockResolvedValue([])

    await loadUserAssessments({ userId: 'user_q', limit: 10 })

    const args = mockPrisma.rAPAssessment.findMany.mock.calls[0][0]
    expect(args.take).toBe(10)
  })

  it('caps limit at 500 (audit page-load bound)', async () => {
    mockPrisma.rAPAssessment.findMany.mockResolvedValue([])

    await loadUserAssessments({ userId: 'user_q', limit: 9999 })

    const args = mockPrisma.rAPAssessment.findMany.mock.calls[0][0]
    expect(args.take).toBe(500)
  })

  it('clamps limit to at least 1 if caller passes 0 or negative', async () => {
    mockPrisma.rAPAssessment.findMany.mockResolvedValue([])

    await loadUserAssessments({ userId: 'user_q', limit: 0 })
    const args = mockPrisma.rAPAssessment.findMany.mock.calls[0][0]
    expect(args.take).toBe(1)
  })

  it('threads the `since` Date filter through into the where clause', async () => {
    mockPrisma.rAPAssessment.findMany.mockResolvedValue([])

    const since = new Date('2026-05-20T00:00:00.000Z')
    await loadUserAssessments({ userId: 'user_q', since })

    const args = mockPrisma.rAPAssessment.findMany.mock.calls[0][0]
    expect(args.where.createdAt).toEqual({ gte: since })
  })

  it('omits the createdAt filter when no `since` is provided', async () => {
    mockPrisma.rAPAssessment.findMany.mockResolvedValue([])

    await loadUserAssessments({ userId: 'user_q' })
    const args = mockPrisma.rAPAssessment.findMany.mock.calls[0][0]
    expect(args.where.createdAt).toBeUndefined()
  })
})

/* ──────────────────── isUserCoachingPathClosed ──────────────────── */

describe('isUserCoachingPathClosed', () => {
  it('returns true when an active closed assessment exists in the sliding window', async () => {
    mockPrisma.rAPAssessment.findFirst.mockResolvedValue({ id: 'asmt_closed' })

    const result = await isUserCoachingPathClosed('user_crisis')

    expect(result).toBe(true)

    // The query must filter by user, coachingPathClosed=true, no reopen,
    // and createdAt within the one-hour sliding window.
    const args = mockPrisma.rAPAssessment.findFirst.mock.calls[0][0]
    expect(args.where.userId).toBe('user_crisis')
    expect(args.where.coachingPathClosed).toBe(true)
    expect(args.where.pathReopenedAt).toBeNull()
    expect(args.where.createdAt.gte).toBeInstanceOf(Date)
    // Window must be ~1 hour back (allow tolerance for test execution time).
    const minutesBack = (Date.now() - args.where.createdAt.gte.getTime()) / 60000
    expect(minutesBack).toBeGreaterThanOrEqual(59)
    expect(minutesBack).toBeLessThanOrEqual(61)
  })

  it('returns false when no active closed assessment exists (path already reopened or expired)', async () => {
    mockPrisma.rAPAssessment.findFirst.mockResolvedValue(null)
    const result = await isUserCoachingPathClosed('user_reopened')
    expect(result).toBe(false)
  })

  it('returns false for a user whose only assessment is ROUTINE_FRICTION (never closes the path)', async () => {
    // A ROUTINE_FRICTION assessment never has coachingPathClosed=true, so
    // the query filter excludes it and findFirst returns null.
    mockPrisma.rAPAssessment.findFirst.mockResolvedValue(null)

    const result = await isUserCoachingPathClosed('user_routine')
    expect(result).toBe(false)
  })
})

/* ──────────────────── reopenCoachingPath ──────────────────── */

describe('reopenCoachingPath', () => {
  it('flips coachingPathClosed→reopened on every still-closed row + records reopen audit fields', async () => {
    mockPrisma.rAPAssessment.updateMany.mockResolvedValue({ count: 1 })

    const result = await reopenCoachingPath({
      userId: 'user_review',
      reason: 'clinician sign-off after evaluation',
    })

    expect(result).toEqual({ reopenedCount: 1 })

    const args = mockPrisma.rAPAssessment.updateMany.mock.calls[0][0]
    expect(args.where.userId).toBe('user_review')
    expect(args.where.coachingPathClosed).toBe(true)
    expect(args.where.pathReopenedAt).toBeNull()

    // Audit columns: pathReopenedAt + pathReopenedReason must be written
    // so the reviewer's sign-off is captured.
    expect(args.data.pathReopenedAt).toBeInstanceOf(Date)
    expect(args.data.pathReopenedReason).toBe('clinician sign-off after evaluation')
  })

  it('reports zero reopened when nothing matched (no active crisis)', async () => {
    mockPrisma.rAPAssessment.updateMany.mockResolvedValue({ count: 0 })

    const result = await reopenCoachingPath({
      userId: 'user_no_crisis',
      reason: 'idempotent retry',
    })

    expect(result).toEqual({ reopenedCount: 0 })
  })

  it('handles stacked crises — multiple closed rows reopened by one review', async () => {
    mockPrisma.rAPAssessment.updateMany.mockResolvedValue({ count: 3 })

    const result = await reopenCoachingPath({
      userId: 'user_stacked',
      reason: 'review of all three flagged moments',
    })

    expect(result).toEqual({ reopenedCount: 3 })
  })

  it('flips isUserCoachingPathClosed semantics — after reopen, findFirst returns null (false)', async () => {
    // First call: an active crisis exists → path is closed.
    mockPrisma.rAPAssessment.findFirst.mockResolvedValueOnce({ id: 'asmt_active' })
    expect(await isUserCoachingPathClosed('user_x')).toBe(true)

    // After reopenCoachingPath runs, the sliding-window query (which
    // requires pathReopenedAt=null) no longer matches → findFirst yields
    // null → false.
    mockPrisma.rAPAssessment.updateMany.mockResolvedValue({ count: 1 })
    await reopenCoachingPath({ userId: 'user_x', reason: 'reviewed' })

    mockPrisma.rAPAssessment.findFirst.mockResolvedValueOnce(null)
    expect(await isUserCoachingPathClosed('user_x')).toBe(false)
  })
})

/* ──────────────────── recordEscalation ──────────────────── */

describe('recordEscalation', () => {
  it('creates a row tied to the assessment id', async () => {
    mockPrisma.rAPEscalation.create.mockResolvedValue({ id: 'esc_1' })

    await recordEscalation({
      assessmentId: 'asmt_42',
      escalatedTo: '988',
      envelopeKind: 'crisis_referral',
    })

    expect(mockPrisma.rAPEscalation.create).toHaveBeenCalledTimes(1)
    const data = mockPrisma.rAPEscalation.create.mock.calls[0][0].data
    expect(data.assessmentId).toBe('asmt_42')
    expect(data.escalatedTo).toBe('988')
    expect(data.envelopeKind).toBe('crisis_referral')
    expect(data.outcome).toBeNull()
    expect(data.outcomeNotedAt).toBeNull()
  })

  it('records the outcome + outcomeNotedAt timestamp when an outcome is supplied', async () => {
    mockPrisma.rAPEscalation.create.mockResolvedValue({ id: 'esc_2' })

    await recordEscalation({
      assessmentId: 'asmt_77',
      escalatedTo: '911',
      envelopeKind: 'emergency_referral',
      outcome: 'user_called',
    })

    const data = mockPrisma.rAPEscalation.create.mock.calls[0][0].data
    expect(data.outcome).toBe('user_called')
    expect(data.outcomeNotedAt).toBeInstanceOf(Date)
  })

  it('supports multiple escalations per assessment (988 + emergency contact + clinician)', async () => {
    mockPrisma.rAPEscalation.create.mockResolvedValue({ id: 'esc_n' })

    await recordEscalation({
      assessmentId: 'asmt_55',
      escalatedTo: '988',
      envelopeKind: 'crisis_referral',
    })
    await recordEscalation({
      assessmentId: 'asmt_55',
      escalatedTo: 'user_emergency_contact',
      envelopeKind: 'crisis_referral',
    })
    await recordEscalation({
      assessmentId: 'asmt_55',
      escalatedTo: 'clinician',
      envelopeKind: 'crisis_referral',
    })

    expect(mockPrisma.rAPEscalation.create).toHaveBeenCalledTimes(3)
    const targets = mockPrisma.rAPEscalation.create.mock.calls.map(
      (call) => call[0].data.escalatedTo,
    )
    expect(targets).toEqual(['988', 'user_emergency_contact', 'clinician'])
  })
})
