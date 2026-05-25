/**
 * PAP↔RAP integration spec — closes gap #1 from the May 2026 reference-
 * engine fanout. Verifies that the coordinator's `evaluateProposal`
 * consults RAP's coaching-path state BEFORE any other gate, and that
 * a closed path silences ALL subsequent PAP proposals until a human
 * reopen lands.
 *
 * Strategy:
 *   - The coordinator submodules (panic / quiet-hours / rate-limit /
 *     dedup) hit Prisma directly. We `vi.mock` each one so the test
 *     doesn't need a live DB connection — they all return "allow"
 *     for the happy-path case, so any deny we see comes from the
 *     RAP gate we're testing.
 *   - The RAP coaching-path lookup is injected via the new optional
 *     `deps.isUserCoachingPathClosed` slot on `evaluateProposal`,
 *     which is the testable seam we added in this commit.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the coordinator's Prisma-backed gates so they default to "allow"
// for the happy-path. Each test overrides the mocks it cares about.
vi.mock('@/lib/coordinator/panic-check', () => ({
  isPanicActive: vi.fn(async () => false),
}))
vi.mock('@/lib/coordinator/quiet-hours', () => ({
  isInQuietHours: vi.fn(async () => false),
}))
vi.mock('@/lib/coordinator/rate-limit', () => ({
  checkLLMPartnerRateLimit: vi.fn(async () => ({
    allowed: true,
    band: 'partner_hourly' as const,
    remaining: 999,
    resetAt: new Date(Date.now() + 60 * 60 * 1000),
  })),
  GLOBAL_USER_DAILY_LIMIT: 100,
}))
vi.mock('@/lib/coordinator/dedup', () => ({
  checkProposalDedup: vi.fn(async () => ({
    isDuplicate: false,
    competingProposals: [],
  })),
  DEDUP_WINDOW_MS: 60_000,
  DEDUP_SIMILARITY_THRESHOLD: 0.85,
}))
// Default stub for the rap/store import path the coordinator falls back
// to when no DI is supplied. Individual tests still pass an explicit
// `deps.isUserCoachingPathClosed` to exercise the DI seam directly.
vi.mock('@/lib/rap/store', () => ({
  isUserCoachingPathClosed: vi.fn(async () => false),
}))

import { evaluateProposal } from '@/lib/coordinator'

const baseProposal = {
  llmPartnerId: 'partner_test',
  userId: 'user_test',
  scopeRequested: ['notify:gentle'],
  action: { headline: 'Hey, gentle check-in', subhead: 'just a nudge' },
  context: { confidence: 0.9 },
}

describe('PAP→RAP integration — coaching-path gate runs first', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('denies with reason=rap_coaching_path_closed when path is closed', async () => {
    const isUserCoachingPathClosed = vi.fn(async () => true)

    const result = await evaluateProposal(baseProposal, new Date(), {
      isUserCoachingPathClosed,
    })

    expect(result.decision).toBe('denied')
    if (result.decision === 'denied') {
      expect(result.reason).toBe('rap_coaching_path_closed')
    }
    expect(isUserCoachingPathClosed).toHaveBeenCalledWith('user_test')
    expect(isUserCoachingPathClosed).toHaveBeenCalledTimes(1)
  })

  it('proceeds to existing gates and allows when coaching path is open', async () => {
    const isUserCoachingPathClosed = vi.fn(async () => false)

    const result = await evaluateProposal(baseProposal, new Date(), {
      isUserCoachingPathClosed,
    })

    expect(result.decision).toBe('allowed')
    expect(isUserCoachingPathClosed).toHaveBeenCalledWith('user_test')
    expect(isUserCoachingPathClosed).toHaveBeenCalledTimes(1)
  })

  it('short-circuits BEFORE panic when coaching path is closed', async () => {
    // If the gate truly runs first, none of the downstream Prisma-backed
    // gates should be invoked when the path is closed. We import their
    // mocks and assert they were never called.
    const panicMod = await import('@/lib/coordinator/panic-check')
    const quietMod = await import('@/lib/coordinator/quiet-hours')
    const rateMod = await import('@/lib/coordinator/rate-limit')
    const dedupMod = await import('@/lib/coordinator/dedup')

    const isUserCoachingPathClosed = vi.fn(async () => true)

    const result = await evaluateProposal(baseProposal, new Date(), {
      isUserCoachingPathClosed,
    })

    expect(result.decision).toBe('denied')
    if (result.decision === 'denied') {
      expect(result.reason).toBe('rap_coaching_path_closed')
    }
    expect(panicMod.isPanicActive).not.toHaveBeenCalled()
    expect(quietMod.isInQuietHours).not.toHaveBeenCalled()
    expect(rateMod.checkLLMPartnerRateLimit).not.toHaveBeenCalled()
    expect(dedupMod.checkProposalDedup).not.toHaveBeenCalled()
  })
})
