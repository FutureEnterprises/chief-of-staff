import { NextResponse } from 'next/server'
import { setReferralCookie } from '@/lib/referrals'

/**
 * GET /r/[code]
 *
 * Public referral link target. Sets the `coyl_ref` cookie with the
 * incoming code (30-day TTL) and redirects to /sign-up. If the visitor
 * is already signed in, /sign-up will pass them through to /today.
 *
 * The code is NOT validated here — we accept any string and let the
 * cookie ride. Validation happens at signup time when
 * claimReferralFromCookie looks up the referrer; bad codes silently
 * fail to attribute and the new user signs up un-attributed. This
 * keeps the redirect cheap (no DB hit) and removes a denial-of-service
 * vector (bot-flooding random codes can't exhaust db connections).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  // Sanity-clamp the code length so we don't write 10KB blobs into a
  // cookie. Real codes are 8 chars; allow up to 64 to be lenient with
  // future formats.
  const clean = code.slice(0, 64).toUpperCase()
  if (clean.length > 0) {
    await setReferralCookie(clean)
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  return NextResponse.redirect(`${base}/sign-up?ref=referral&code=${encodeURIComponent(clean)}`, 302)
}
