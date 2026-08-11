/**
 * UAP partner rate limiting — the limiter must count UAP traffic.
 *
 * The shared coordinator limiter counts PAPProposal + ActionRequest
 * rows; UAP EXECUTEs write UAPAuditEntry rows and neither of the
 * others. A UAP-only partner was therefore never rate-limited (the
 * gate ran, against counters that were always zero). This suite fails
 * against that limiter: it seeds ONLY UAP execute audit rows and
 * expects a deny.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const counts = {
  uapExecutesPartnerHour: 0,
  uapExecutesUserDay: 0,
  papProposalsUserDay: 0,
  actionRequestsUserDay: 0,
}

let partnerRow: { rateLimitPerHour: number; active: boolean } | null = {
  rateLimitPerHour: 5,
  active: true,
}

vi.mock('@repo/database', () => ({
  prisma: {
    lLMPartner: {
      findUnique: async () => partnerRow,
    },
    uAPAuditEntry: {
      count: async ({
        where,
      }: {
        where: { llmPartnerId?: string; userId: string; operation: string }
      }) => {
        // Partner-scoped query → band A; user-only query → band B.
        return where.llmPartnerId !== undefined
          ? counts.uapExecutesPartnerHour
          : counts.uapExecutesUserDay
      },
    },
    pAPProposal: {
      count: async () => counts.papProposalsUserDay,
    },
    actionRequest: {
      count: async () => counts.actionRequestsUserDay,
    },
  },
}))

import { checkUAPPartnerRateLimit } from '../rate-limit'
import { GLOBAL_USER_DAILY_LIMIT } from '@/lib/coordinator/rate-limit'

const PARTNER = 'partner_rl'
const USER = 'user_rl'

beforeEach(() => {
  counts.uapExecutesPartnerHour = 0
  counts.uapExecutesUserDay = 0
  counts.papProposalsUserDay = 0
  counts.actionRequestsUserDay = 0
  partnerRow = { rateLimitPerHour: 5, active: true }
})

describe('checkUAPPartnerRateLimit', () => {
  it('allows under both bands', async () => {
    const res = await checkUAPPartnerRateLimit(PARTNER, USER)
    expect(res.allowed).toBe(true)
  })

  it('denies when UAP executes alone exhaust the partner-hourly band (FAILS with the shared PAP/EAP limiter, which never counts UAP rows)', async () => {
    counts.uapExecutesPartnerHour = 5 // == rateLimitPerHour
    counts.uapExecutesUserDay = 5
    const res = await checkUAPPartnerRateLimit(PARTNER, USER)
    expect(res.allowed).toBe(false)
    expect(res.band).toBe('partner_hourly')
  })

  it('denies when UAP executes push the global per-user daily band over the top', async () => {
    partnerRow = { rateLimitPerHour: 1000, active: true }
    counts.papProposalsUserDay = 20
    counts.actionRequestsUserDay = 20
    counts.uapExecutesUserDay = GLOBAL_USER_DAILY_LIMIT - 40 // exactly at cap
    const res = await checkUAPPartnerRateLimit(PARTNER, USER)
    expect(res.allowed).toBe(false)
    expect(res.band).toBe('global_daily')
  })

  it('denies for an unknown or inactive partner', async () => {
    partnerRow = null
    const res = await checkUAPPartnerRateLimit(PARTNER, USER)
    expect(res.allowed).toBe(false)

    partnerRow = { rateLimitPerHour: 100, active: false }
    const res2 = await checkUAPPartnerRateLimit(PARTNER, USER)
    expect(res2.allowed).toBe(false)
  })
})
