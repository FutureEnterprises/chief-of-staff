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

/**
 * Trailing-window counter behind the `frequency_cap` rule.
 *
 * Counts UAPAuditEntry rows that represent a CONSUMED unit of the
 * user's cap: operation='execute', decision='allowed', for this exact
 * (user, grant, action kind) tuple, at or after `since`.
 *
 * Why this table and this filter:
 *   • Same source of truth as the limiter above, so "an action reached
 *     this user" counts once, in one place, for both gates.
 *   • decision='allowed' only. Denials and needs_per_action_confirmation
 *     rows are audit-worthy but consumed nothing, and counting them
 *     would let a partner exhaust a user's cap by firing actions that
 *     were REFUSED — a self-inflicted denial of service.
 *   • PRECHECK writes no audit row at all, so a precheck can evaluate a
 *     frequency cap without consuming against it. That is the property
 *     the PRECHECK contract promises ("no side effects"), and it holds
 *     here by construction rather than by a flag.
 *
 * `tx` lets the caller run the count inside an open transaction — the
 * audit writer passes its advisory-locked transaction client so the
 * count-then-append is serialized per user. Omit it for the coordinator's
 * optimistic pre-check.
 */
export type AllowedExecuteWindow = {
  userId: string
  grantId: string
  actionKind: string
  since: Date
}

/**
 * The exact `where` clause the cap counts. Exported so the atomic
 * re-check in lib/uap/audit.ts and the coordinator's optimistic count
 * are provably the same query, not two clauses that drifted apart.
 */
export function allowedExecuteWindowWhere(params: AllowedExecuteWindow) {
  return {
    userId: params.userId,
    grantId: params.grantId,
    actionKind: params.actionKind,
    operation: 'execute',
    decision: 'allowed',
    createdAt: { gte: params.since },
  }
}

/** Minimal structural client — satisfied by both `prisma` and a `$transaction` tx. */
export type AuditCountClient = {
  uAPAuditEntry: {
    count: (args: {
      where: ReturnType<typeof allowedExecuteWindowWhere>
    }) => Promise<number>
  }
}

export async function countAllowedExecutesInWindow(
  params: AllowedExecuteWindow,
  client?: AuditCountClient,
): Promise<number> {
  const db = client ?? (prisma as unknown as AuditCountClient)
  return db.uAPAuditEntry.count({ where: allowedExecuteWindowWhere(params) })
}
