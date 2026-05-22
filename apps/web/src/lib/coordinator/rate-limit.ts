import { prisma } from '@repo/database'

/**
 * Per-LLM-partner × per-user rate limiter for the PAP + EAP planes.
 *
 * Two bands, both enforced — the tighter binding constraint wins:
 *
 *   A. PER-PARTNER HOURLY  — pulled from LLMPartner.rateLimitPerHour
 *      (default 1000/hr). Counts PAPProposal + ActionRequest rows in
 *      the last hour for this (llmPartnerId, userId) pair. This is
 *      the contract surface the partner sees on their dashboard.
 *
 *   B. GLOBAL PER-USER DAILY  — 50 interventions / 24h across ALL
 *      LLM partners combined. Even if 5 partners each have 1000/hr
 *      headroom, the human only tolerates so many AI nudges per
 *      day — this cap is the user-protection backstop.
 *
 * Returns { allowed, remaining, resetAt } where the numbers reflect
 * the tighter of the two bands (so the partner gets the most-pessimistic
 * signal back). `resetAt` is the wall-clock time the tighter band
 * opens up by at least one slot.
 */

export const GLOBAL_USER_DAILY_LIMIT = 50

export type RateLimitCheck = {
  allowed: boolean
  remaining: number
  resetAt: Date
  /** Which band was the tightest binding constraint. */
  band: 'partner_hourly' | 'global_daily'
}

export async function checkLLMPartnerRateLimit(
  llmPartnerId: string,
  userId: string,
  asOf: Date = new Date(),
): Promise<RateLimitCheck> {
  // Resolve per-partner hourly cap (and confirm the partner exists +
  // is active — an inactive partner has effectively zero headroom).
  const partner = await prisma.lLMPartner.findUnique({
    where: { id: llmPartnerId },
    select: { rateLimitPerHour: true, active: true },
  })

  // Unknown partner: caller has bigger problems than the rate limit,
  // but return a deny so the coordinator denies safely rather than
  // proceeding to dedup/exec.
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

  // Per-partner hourly count — proposals + actions for THIS partner.
  const [partnerProposals, partnerActions] = await Promise.all([
    prisma.pAPProposal.count({
      where: {
        llmPartnerId,
        userId,
        createdAt: { gte: hourCutoff },
      },
    }),
    prisma.actionRequest.count({
      where: {
        llmPartnerId,
        userId,
        createdAt: { gte: hourCutoff },
      },
    }),
  ])
  const partnerUsed = partnerProposals + partnerActions
  const partnerRemaining = Math.max(0, partner.rateLimitPerHour - partnerUsed)

  // Global per-user daily count — proposals + actions across ALL partners.
  const [globalProposals, globalActions] = await Promise.all([
    prisma.pAPProposal.count({
      where: { userId, createdAt: { gte: dayCutoff } },
    }),
    prisma.actionRequest.count({
      where: { userId, createdAt: { gte: dayCutoff } },
    }),
  ])
  const globalUsed = globalProposals + globalActions
  const globalRemaining = Math.max(0, GLOBAL_USER_DAILY_LIMIT - globalUsed)

  // Pick the tighter band — that's what the caller sees.
  const partnerAllowed = partnerRemaining > 0
  const globalAllowed = globalRemaining > 0

  if (!partnerAllowed && partnerRemaining <= globalRemaining) {
    return {
      allowed: false,
      remaining: partnerRemaining,
      resetAt: new Date(asOf.getTime() + 60 * 60 * 1000),
      band: 'partner_hourly',
    }
  }
  if (!globalAllowed) {
    return {
      allowed: false,
      remaining: globalRemaining,
      resetAt: new Date(asOf.getTime() + 24 * 60 * 60 * 1000),
      band: 'global_daily',
    }
  }

  // Both allow — report the band with less headroom so the partner's
  // dashboard accurately surfaces the binding constraint.
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
