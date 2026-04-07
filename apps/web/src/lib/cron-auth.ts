import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

/**
 * Verify cron route authorization using timing-safe comparison.
 * Returns a 401 NextResponse if unauthorized, or null if authorized.
 */
export function verifyCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const provided = authHeader.replace('Bearer ', '')

  const expected = Buffer.from(secret)
  const actual = Buffer.from(provided)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return null
}
