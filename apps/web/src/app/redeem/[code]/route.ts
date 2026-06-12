/**
 * GET /redeem/[code] — the wave-grant claim link.
 *
 * The "you're in" email points here. Flow:
 *   - valid (granted/redeemed) code → mark redeemed, drop the access
 *     cookie, redirect into /sign-up (past the gate when it's on).
 *   - invalid/ungranted/unknown code → redirect to /waitlist (no leak
 *     of whether the code exists; they just land on the join page).
 *
 * Public (no Clerk — the user isn't signed in yet). Registered in
 * proxy.ts isPublicRoute + SHOULD_BYPASS_CLERK.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getGrantState, markRedeemed } from '@/lib/waitlist'
import { INVITE_COOKIE } from '@/lib/waitlist-gate'
import { checkDistributedRateLimit } from '@/lib/rate-limit'

// Brute-force throttle: the code space is large but enumerable, so cap
// redemption attempts per IP. 10 / 10 min. Over-limit redirects to
// /waitlist (a user-facing link — a redirect leaks nothing about whether
// a code exists, unlike a 429 page).
const REDEEM_RATE_LIMIT = 10
const REDEEM_WINDOW_MS = 10 * 60 * 1000
const redeemRequests = new Map<string, number[]>()

function redeemRateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - REDEEM_WINDOW_MS
  const recent = (redeemRequests.get(ip) ?? []).filter((t) => t > cutoff)
  if (recent.length >= REDEEM_RATE_LIMIT) return false
  recent.push(now)
  redeemRequests.set(ip, recent)
  return true
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  // Distributed limiter first (cross-instance); per-process Map fallback.
  const dist = await checkDistributedRateLimit({
    prefix: 'redeem',
    identifier: ip,
    limit: REDEEM_RATE_LIMIT,
    windowMs: REDEEM_WINDOW_MS,
  })
  if (dist.limited || (!dist.configured && !redeemRateLimit(ip))) {
    return NextResponse.redirect(new URL('/waitlist', req.url))
  }

  const { code } = await params
  const trimmed = (code ?? '').trim()

  const state = trimmed ? (await getGrantState(trimmed)).state : 'unknown'

  if (state === 'granted' || state === 'redeemed') {
    await markRedeemed(trimmed)
    const res = NextResponse.redirect(
      new URL(`/sign-up?invite=${encodeURIComponent(trimmed)}&ref=wave`, req.url),
    )
    res.cookies.set(INVITE_COOKIE, trimmed, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour — enough to finish sign-up
    })
    return res
  }

  // Unknown / not-yet-granted → send to the waitlist join page.
  return NextResponse.redirect(new URL('/waitlist', req.url))
}
