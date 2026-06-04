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
import { getGrantState, markRedeemed } from '@/lib/waitlist'
import { INVITE_COOKIE } from '@/lib/waitlist-gate'

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
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
