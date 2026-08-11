/**
 * EAP action-request rate limiting — shared by BOTH LLM-initiated
 * action surfaces:
 *
 *   POST /api/eap/v1/action/request       (single action)
 *   POST /api/eap/v1/orchestration        (multi-step, per step)
 *
 * It MUST be the same limiter with the same counters: when the
 * orchestration route carried its own placeholder that always returned
 * allowed=true, a partner throttled on the single-action band could
 * bypass the cap entirely by wrapping the same actions in
 * orchestrations (32 steps per call, unlimited calls). Each
 * orchestration STEP consumes the same budget one action/request does.
 *
 * Two sliding-window bands, both enforced — the FIRST to trip denies:
 *
 *   A. PER-PARTNER × USER  — caps how hard a single LLM partner can
 *      push one user. Default 30 action-requests / 10 min.
 *   B. PER-USER GLOBAL     — backstop across ALL partners combined, so
 *      no amount of partner headroom can bury one human in nudges.
 *      Default 120 action-requests / 10 min.
 *
 * Distributed-first (Upstash, authoritative across Fluid Compute
 * instances) with a per-process fallback when Upstash isn't configured
 * — never hard-fail the route on a missing or hiccuping Redis.
 */

import { checkDistributedRateLimit } from '@/lib/rate-limit'

// Band A — per (llmPartner, user).
export const PARTNER_USER_LIMIT = 30
// Band B — per user across all partners.
export const USER_GLOBAL_LIMIT = 120
// Shared sliding window for both bands.
export const ACTION_RL_WINDOW_MS = 10 * 60 * 1000 // 10 min

// retryAfter we advertise on a deny — the full window is the safe upper
// bound for a sliding window without tracking per-key reset times.
const ACTION_RL_RETRY_AFTER_SEC = Math.ceil(ACTION_RL_WINDOW_MS / 1000)

// Per-process fallback counters (only consulted when Upstash is unset).
// Keyed by band identifier → recent hit timestamps. Per-instance under
// Fluid Compute, which is why Upstash is preferred when present.
const partnerUserHits = new Map<string, number[]>()
const userGlobalHits = new Map<string, number[]>()

function inProcessAllowed(
  store: Map<string, number[]>,
  key: string,
  limit: number,
): boolean {
  const now = Date.now()
  const cutoff = now - ACTION_RL_WINDOW_MS
  const recent = (store.get(key) ?? []).filter((t) => t > cutoff)
  if (recent.length >= limit) {
    store.set(key, recent)
    return false
  }
  recent.push(now)
  store.set(key, recent)
  return true
}

/**
 * Consume one action's worth of budget for (partner, user). Returns
 * allowed=false with a band-specific reason ('rate_limited_partner' |
 * 'rate_limited_user') the caller folds into its denial audit row.
 */
export async function checkActionRateLimit(args: {
  partnerId: string
  userId: string
  deviceId: string
  actuator: string
}): Promise<{ allowed: boolean; reason?: string; retryAfterSec?: number }> {
  // Band A: per (partner, user).
  const partnerKey = `${args.partnerId}:${args.userId}`
  const partnerBand = await checkDistributedRateLimit({
    prefix: 'eap-action-partner',
    identifier: partnerKey,
    limit: PARTNER_USER_LIMIT,
    windowMs: ACTION_RL_WINDOW_MS,
  })
  const partnerLimited = partnerBand.configured
    ? partnerBand.limited
    : !inProcessAllowed(partnerUserHits, partnerKey, PARTNER_USER_LIMIT)
  if (partnerLimited) {
    return {
      allowed: false,
      reason: 'rate_limited_partner',
      retryAfterSec: ACTION_RL_RETRY_AFTER_SEC,
    }
  }

  // Band B: per user, across all partners.
  const userBand = await checkDistributedRateLimit({
    prefix: 'eap-action-user',
    identifier: args.userId,
    limit: USER_GLOBAL_LIMIT,
    windowMs: ACTION_RL_WINDOW_MS,
  })
  const userLimited = userBand.configured
    ? userBand.limited
    : !inProcessAllowed(userGlobalHits, args.userId, USER_GLOBAL_LIMIT)
  if (userLimited) {
    return {
      allowed: false,
      reason: 'rate_limited_user',
      retryAfterSec: ACTION_RL_RETRY_AFTER_SEC,
    }
  }

  return { allowed: true }
}
