import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getTodaysDailyNumber,
  incrementShareCount,
  formatDeltaLabel,
} from '@/lib/daily-number'

/**
 * /api/v1/daily-number/today
 *
 * GET  — fetch today's DailyNumber for the authed user. Auto-generates
 *        the row if it doesn't exist yet, so the in-app daily-card can
 *        always render something even if the 8-PM cron hasn't fired.
 *
 * POST — action='share' increments shareCount + bumps lastSharedAt on
 *        today's row. Idempotent at the bump level (every tap counts).
 *        Auth-checked — only the row's owner can record a share-from-
 *        within-the-app event (third-party viewers of /d/[code] are
 *        counted separately by the page itself).
 *
 * Auth: Clerk session. Same pattern as /api/v1/today.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const rl = await checkRateLimit('api', user.id)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const daily = await getTodaysDailyNumber(user.id)
  if (!daily) {
    return NextResponse.json({ error: 'Could not generate' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  return NextResponse.json({
    id: daily.id,
    date: daily.date,
    dayNumber: daily.dayNumber,
    selfTrustScore: daily.selfTrustScore,
    selfTrustDelta: daily.selfTrustDelta,
    deltaLabel: formatDeltaLabel(daily.selfTrustDelta),
    identitySentence: daily.identitySentence,
    archetype: daily.archetype,
    topWindowHeld: daily.topWindowHeld,
    topWindowMissed: daily.topWindowMissed,
    variant: daily.variant,
    shareCode: daily.shareCode,
    shareUrl: `${baseUrl}/d/${daily.shareCode}`,
    shareCount: daily.shareCount,
    lastSharedAt: daily.lastSharedAt,
  })
}

type PostBody = { action?: unknown }

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const rl = await checkRateLimit('api', user.id)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  let body: PostBody = {}
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action !== 'share') {
    return NextResponse.json(
      { error: 'invalid_action', allowed: ['share'] },
      { status: 400 },
    )
  }

  // Look up today's row (auto-generate if missing so a user who hits
  // share from a stale tab still counts).
  const daily = await getTodaysDailyNumber(user.id)
  if (!daily) {
    return NextResponse.json(
      { error: 'no_daily_number' },
      { status: 404 },
    )
  }

  const newCount = await incrementShareCount(daily.shareCode)
  return NextResponse.json({ ok: true, shareCount: newCount })
}
