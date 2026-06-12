import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

if (!redis && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY] Rate limiting is DISABLED — UPSTASH_REDIS_REST_URL not configured')
}

/**
 * Rate limiters for different API tiers.
 * Falls back to no-op if Upstash is not configured (dev mode).
 */
export const rateLimiters = {
  /** General API: 60 req/min per user */
  api: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'rl:api' })
    : null,

  /** AI chat: 10 req/min per user */
  chat: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl:chat' })
    : null,

  /** Stripe checkout: 5 req/min per user */
  checkout: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'rl:checkout' })
    : null,

  /** Auth-adjacent (push token, user update): 20 req/min per user */
  auth: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), prefix: 'rl:auth' })
    : null,
}

/**
 * Check rate limit for a given tier and identifier.
 * Returns null if rate limiting is not configured (dev mode).
 * Returns { success: false, ... } if rate limited.
 */
export async function checkRateLimit(
  tier: keyof typeof rateLimiters,
  identifier: string
): Promise<{ limited: boolean; headers: Record<string, string> }> {
  const limiter = rateLimiters[tier]
  if (!limiter) return { limited: false, headers: {} }

  const result = await limiter.limit(identifier)

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }

  return { limited: !result.success, headers }
}

/* ───────────────────────────────────────────────────────────────────
 * Ad-hoc distributed limiters for public routes whose limits don't map
 * onto the fixed tiers above (waitlist 20/10m, audit event 40/10m,
 * audit capture 5/10m, redeem 10/10m). Each route owns its own
 * limit/window, so we build (and memoize) a Ratelimit per (prefix,
 * limit, window) on first use. Cross-instance via Upstash — the in-memory
 * Maps in the routes only work per-process under Fluid Compute.
 * ─────────────────────────────────────────────────────────────────── */

const customLimiters = new Map<string, Ratelimit>()

/**
 * Distributed sliding-window check for a custom limit/window.
 *
 * Returns:
 *   - { configured: false }  → Upstash not set up; caller MUST fall back
 *     to its in-process limiter (never hard-fail on a missing Redis).
 *   - { configured: true, limited }  → authoritative cross-instance result.
 *
 * `windowMs` is rounded up to whole seconds (Upstash duration granularity).
 * `prefix` namespaces the route so counters don't collide.
 */
export async function checkDistributedRateLimit(opts: {
  prefix: string
  identifier: string
  limit: number
  windowMs: number
}): Promise<{ configured: boolean; limited: boolean }> {
  if (!redis) return { configured: false, limited: false }

  const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000))
  const key = `${opts.prefix}:${opts.limit}:${windowSec}`
  let limiter = customLimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.limit, `${windowSec} s`),
      prefix: `rl:${opts.prefix}`,
    })
    customLimiters.set(key, limiter)
  }

  try {
    const result = await limiter.limit(opts.identifier)
    return { configured: true, limited: !result.success }
  } catch {
    // Redis hiccup mid-request → don't hard-fail the route; let the
    // caller's in-memory limiter cover this request as belt-and-braces.
    return { configured: false, limited: false }
  }
}
