import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

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
