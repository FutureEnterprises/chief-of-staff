import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'

/**
 * POST /api/v1/newsletter
 *
 * Public endpoint for capturing emails from marketing pages BEFORE the
 * user is ready to sign up. Every visitor who bounces is a free signup we
 * lose; this is the rescue net.
 *
 * Behavior:
 *  1. Validate email shape
 *  2. Rate-limit per IP to prevent abuse (no auth, no userId scope)
 *  3. POST to Resend audiences API if RESEND_AUDIENCE_ID is set
 *  4. Always return 200 to the client so attackers can't probe whether
 *     an email is already subscribed
 *
 * Honest tradeoffs:
 *  - No DB write at v1 — would require either a new EmailSignup model
 *    (migration) or piggybacking on ProductivityEvent (requires userId).
 *    Resend's audience IS the source of truth. If we outgrow that
 *    (>10k subscribers), migrate to first-party + Resend mirror.
 *  - No double-opt-in. Resend audience handles unsubscribe links in
 *    every send, which is the CAN-SPAM requirement. GDPR consent text
 *    lives on the form itself ("By signing up you agree to receive
 *    occasional emails. Unsubscribe anytime.").
 */

const schema = z.object({
  email: z.string().email().max(320), // RFC 5321 max
  source: z.string().max(64).optional(),
})

// In-memory rate limit — good enough for v1, replace with Redis when
// we get serious traffic. 5 requests per IP per 10 minutes.
const RATE_LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000
const requests = new Map<string, number[]>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const recent = (requests.get(ip) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT) return false
  recent.push(now)
  requests.set(ip, recent)
  return true
}

export async function POST(req: Request) {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ??
    (await headers()).get('x-real-ip') ??
    'anonymous'

  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: true }, { status: 200 }) // silent rate-limit
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const { email, source } = parsed.data
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  // Optionally write to Resend audience. If unset, log and return success
  // so the form is functional in dev / pre-Resend states. The marketing
  // team can wire RESEND_AUDIENCE_ID once they create the audience.
  if (apiKey && audienceId) {
    try {
      await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      })
    } catch (err) {
      console.warn('Resend audience contact create failed', { err: err instanceof Error ? err.message : 'unknown' })
    }
  } else {
    console.log('Newsletter signup (no Resend audience configured):', { email, source })
  }

  return NextResponse.json({ ok: true })
}
