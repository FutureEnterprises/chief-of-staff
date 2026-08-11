/**
 * EAP shared action rate limiter — the two-band budget both the
 * single-action route AND the orchestration route consume.
 *
 * Upstash is unconfigured in the test environment, so
 * checkDistributedRateLimit returns { configured: false } and the
 * module's in-process fallback is authoritative — which is exactly the
 * path we exercise here.
 */

import { describe, it, expect } from 'vitest'
import {
  checkActionRateLimit,
  PARTNER_USER_LIMIT,
  USER_GLOBAL_LIMIT,
} from '../action-rate-limit'

describe('checkActionRateLimit (in-process fallback)', () => {
  it('trips band A (per partner × user) after PARTNER_USER_LIMIT hits', async () => {
    const partnerId = 'p_bandA'
    const userId = 'u_bandA'
    for (let i = 0; i < PARTNER_USER_LIMIT; i++) {
      const res = await checkActionRateLimit({
        partnerId,
        userId,
        deviceId: 'd1',
        actuator: 'push_notification',
      })
      expect(res.allowed).toBe(true)
    }
    const denied = await checkActionRateLimit({
      partnerId,
      userId,
      deviceId: 'd1',
      actuator: 'push_notification',
    })
    expect(denied.allowed).toBe(false)
    expect(denied.reason).toBe('rate_limited_partner')
    expect(denied.retryAfterSec).toBeGreaterThan(0)
  })

  it('trips band B (per user across partners) even when each partner is under band A', async () => {
    const userId = 'u_bandB'
    // Enough distinct partners that no single partner hits band A, but
    // the user-global count crosses USER_GLOBAL_LIMIT.
    const partnersNeeded = Math.ceil(USER_GLOBAL_LIMIT / (PARTNER_USER_LIMIT - 1)) + 1
    let denied: Awaited<ReturnType<typeof checkActionRateLimit>> | null = null
    outer: for (let p = 0; p < partnersNeeded; p++) {
      for (let i = 0; i < PARTNER_USER_LIMIT - 1; i++) {
        const res = await checkActionRateLimit({
          partnerId: `p_bandB_${p}`,
          userId,
          deviceId: 'd1',
          actuator: 'push_notification',
        })
        if (!res.allowed) {
          denied = res
          break outer
        }
      }
    }
    expect(denied).not.toBeNull()
    expect(denied!.reason).toBe('rate_limited_user')
  })
})
