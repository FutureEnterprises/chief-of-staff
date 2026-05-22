/**
 * GET /api/v1/health/cluster
 *
 * Returns the user's most recent SignalCluster plus the previous 24
 * hours of cluster history.
 *
 * Consumers:
 *   - The predictive model's `/predict` endpoint, which feeds the
 *     current cluster into the per-user logistic regression.
 *   - The mobile today-view, which renders "what we see right now"
 *     (HRV trend arrow, sedentary pill, location tag) so the user
 *     understands why an interrupt fired (or didn't).
 *
 * PII discipline: we NEVER ship raw HRV millisecond values to the
 * client. Only the % delta from baseline + an enum classification.
 * Same goes for raw lat/lng (already stripped at write time — only
 * `locationKind` is persisted).
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 10

type ClusterDTO = {
  id: string
  capturedAt: string
  hrvDeltaPct: number | null
  hrvTrend: 'down' | 'flat' | 'up' | null
  sedentaryMins: number | null
  unlockRateDelta: number | null
  screenOnMins: number | null
  locationKind: string | null
  dayOfWeek: number
  hourOfDay: number
  meetingDensity: number | null
  weekdayStress: string | null
  outcomeWithin30Min: string | null
  outcomeWithin60Min: string | null
}

const ONE_HOUR_MS = 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const rl = await checkRateLimit('api', user.id)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const now = new Date()
  const since = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS)

  let clusters: Awaited<ReturnType<typeof prisma.signalCluster.findMany>>
  try {
    clusters = await prisma.signalCluster.findMany({
      where: { userId: user.id, capturedAt: { gte: since } },
      orderBy: { capturedAt: 'desc' },
      take: 200,
    })
  } catch (err) {
    console.error('[health/cluster] query failed', err)
    return NextResponse.json(
      { error: 'failed to load clusters' },
      { status: 500 },
    )
  }

  const dto = clusters.map(toClusterDTO)
  const latest = dto[0] ?? null
  const isActive = latest
    ? now.getTime() - new Date(latest.capturedAt).getTime() < ONE_HOUR_MS
    : false

  return NextResponse.json(
    {
      latest,
      isActive,
      history: dto,
      meta: {
        count: dto.length,
        windowHours: 24,
        generatedAt: now.toISOString(),
      },
    },
    { headers: rl.headers },
  )
}

/**
 * Strip raw HRV samples and convert to a client-safe DTO. Adds an
 * `hrvTrend` summary the today-view can render as an arrow without
 * having to know about the magnitude threshold.
 */
function toClusterDTO(c: {
  id: string
  capturedAt: Date
  hrvDeltaPct: number | null
  sedentaryMins: number | null
  unlockRateDelta: number | null
  screenOnMins: number | null
  locationKind: string | null
  dayOfWeek: number
  hourOfDay: number
  meetingDensity: number | null
  weekdayStress: string | null
  outcomeWithin30Min: string | null
  outcomeWithin60Min: string | null
}): ClusterDTO {
  return {
    id: c.id,
    capturedAt: c.capturedAt.toISOString(),
    hrvDeltaPct: c.hrvDeltaPct,
    hrvTrend: hrvTrendFromDelta(c.hrvDeltaPct),
    sedentaryMins: c.sedentaryMins,
    unlockRateDelta: c.unlockRateDelta,
    screenOnMins: c.screenOnMins,
    locationKind: c.locationKind,
    dayOfWeek: c.dayOfWeek,
    hourOfDay: c.hourOfDay,
    meetingDensity: c.meetingDensity,
    weekdayStress: c.weekdayStress,
    outcomeWithin30Min: c.outcomeWithin30Min,
    outcomeWithin60Min: c.outcomeWithin60Min,
  }
}

function hrvTrendFromDelta(delta: number | null): 'down' | 'flat' | 'up' | null {
  if (delta == null) return null
  if (delta <= -5) return 'down'
  if (delta >= 5) return 'up'
  return 'flat'
}
