/**
 * UAP — partner rate limiting that counts UAP traffic.
 *
 * The shared coordinator limiter (lib/coordinator/rate-limit.ts)
 * counts PAPProposal + ActionRequest rows. UAP EXECUTEs write
 * UAPAuditEntry rows — they never create either of those — so wiring
 * the shared limiter into the UAP coordinator produced a gate whose
 * counter was blind to the very traffic it was supposed to limit: a
 * partner making ONLY UAP executes was never rate-limited, no matter
 * the volume. (Mutation argument: delete the coordinator's rate check
 * and no UAP-only request would ever notice.)
 *
 * This module enforces the same two bands the shared limiter promises,
 * with UAP executes included in both counts:
 *
 *   A. PER-PARTNER HOURLY — LLMPartner.rateLimitPerHour, counting the
 *      partner's UAP execute audit rows for this user in the last hour.
 *   B. GLOBAL PER-USER DAILY — GLOBAL_USER_DAILY_LIMIT across ALL
 *      partners and ALL protocol planes: PAP proposals + EAP action
 *      requests + UAP executes. The human only tolerates so many AI
 *      actions per day regardless of which protocol delivered them.
 *
 * PRECHECK calls this limiter but writes no audit row, so prechecks
 * check budget without consuming it — matching the public claim that
 * PRECHECK "lets a partner reason about future actions without burning
 * rate-limit budget."
 */

import { prisma } from '@repo/database'
import { GLOBAL_USER_DAILY_LIMIT } from '@/lib/coordinator/rate-limit'

export type UAPRateLimitCheck = {
  allowed: boolean
  remaining: number
  resetAt: Date
  band: 'partner_hourly' | 'global_daily'
}

export async function checkUAPPartnerRateLimit(
  llmPartnerId: string,
  userId: string,
  asOf: Date = new Date(),
): Promise<UAPRateLimitCheck> {
  const partner = await prisma.lLMPartner.findUnique({
    where: { id: llmPartnerId },
    select: { rateLimitPerHour: true, active: true },
  })

  // Unknown/inactive partner: deny safely rather than proceeding.
  if (!partner || !partner.active) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(asOf.getTime() + 60 * 60 * 1000),
      band: 'partner_hourly',
    }
  }

  const hourCutoff = new Date(asOf.getTime() - 60 * 60 * 1000)
  const dayCutoff = new Date(asOf.getTime() - 24 * 60 * 60 * 1000)

  // Band A — this partner's UAP executes for this user in the last hour.
  const partnerUsed = await prisma.uAPAuditEntry.count({
    where: {
      llmPartnerId,
      userId,
      operation: 'execute',
      createdAt: { gte: hourCutoff },
    },
  })
  const partnerRemaining = Math.max(0, partner.rateLimitPerHour - partnerUsed)

  // Band B — everything that reached (or tried to reach) this user in
  // 24h, across every protocol plane and every partner.
  const [papCount, eapCount, uapCount] = await Promise.all([
    prisma.pAPProposal.count({
      where: { userId, createdAt: { gte: dayCutoff } },
    }),
    prisma.actionRequest.count({
      where: { userId, createdAt: { gte: dayCutoff } },
    }),
    prisma.uAPAuditEntry.count({
      where: { userId, operation: 'execute', createdAt: { gte: dayCutoff } },
    }),
  ])
  const globalUsed = papCount + eapCount + uapCount
  const globalRemaining = Math.max(0, GLOBAL_USER_DAILY_LIMIT - globalUsed)

  if (partnerRemaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(asOf.getTime() + 60 * 60 * 1000),
      band: 'partner_hourly',
    }
  }
  if (globalRemaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(asOf.getTime() + 24 * 60 * 60 * 1000),
      band: 'global_daily',
    }
  }

  // Both allow — report the tighter band.
  if (partnerRemaining <= globalRemaining) {
    return {
      allowed: true,
      remaining: partnerRemaining,
      resetAt: new Date(asOf.getTime() + 60 * 60 * 1000),
      band: 'partner_hourly',
    }
  }
  return {
    allowed: true,
    remaining: globalRemaining,
    resetAt: new Date(asOf.getTime() + 24 * 60 * 60 * 1000),
    band: 'global_daily',
  }
}
