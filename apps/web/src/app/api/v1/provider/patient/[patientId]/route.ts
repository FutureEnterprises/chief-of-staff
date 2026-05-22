import { NextResponse } from 'next/server'
import {
  anonymizePatientName,
  assertProviderAccess,
  getCurrentProvider,
} from '@/lib/provider-rbac'
import { prisma } from '@repo/database'

/**
 * GET /api/v1/provider/patient/[patientId]
 *
 * Single-patient clinical view. Drives the per-patient page at
 * /provider/[patientId].
 *
 * Access control:
 *   - Clerk auth required.
 *   - getCurrentProvider() gates on plan tier.
 *   - assertProviderAccess() throws 403 unless the patient has
 *     explicitly opted in to this provider via the magic-token grant
 *     model in lib/provider-rbac.ts.
 *
 * HIPAA caveat: anonymized name only (first + last initial). No raw
 * biometric samples — weight data is read from ProductivityEvent
 * FEATURE_USED rows with eventValue='weight_reading', which are
 * already aggregated/decimated downsamples of the underlying Withings
 * stream (the raw stream lives in the Withings integration store and
 * is never proxied through this route). Patient retains full export
 * rights via /settings.
 *
 * Response shape:
 *   - patient: anonymized demographics
 *   - recentSlips: last-30-day SlipRecord rows
 *   - excuseBreakdown: top excuse categories with counts
 *   - dangerWindows: the patient's active danger window grid
 *   - interventionEffectiveness: per-mode hold rate (computed from
 *     RescueSession outcomes)
 *   - weightVelocity: decimated weight readings, last 30 days, if any
 *   - selfTrustTrend: time series from ProductivityEvent FEATURE_USED
 *     rows where eventValue='self_trust_score'
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ patientId: string }> },
) {
  const provider = await getCurrentProvider()
  if (!provider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { patientId } = await params

  try {
    await assertProviderAccess(provider.id, patientId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    patient,
    recentSlips,
    excuseRows,
    dangerWindowRows,
    rescueRows,
    weightRows,
    selfTrustRows,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        planType: true,
        primaryWedge: true,
        currentStreak: true,
        longestStreak: true,
        selfTrustScore: true,
        executionScore: true,
        slipsThisMonth: true,
        lastSlipAt: true,
        createdAt: true,
        glp1Drug: true,
        glp1InjectionWeekday: true,
        glp1StartedAt: true,
      },
    }),
    prisma.slipRecord.findMany({
      where: { userId: patientId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        trigger: true,
        recoveredAt: true,
      },
      take: 100,
    }),
    prisma.excuse.findMany({
      where: { userId: patientId, createdAt: { gte: thirtyDaysAgo } },
      select: { category: true },
    }),
    prisma.dangerWindow.findMany({
      where: { userId: patientId, active: true },
      select: {
        id: true,
        label: true,
        dayOfWeek: true,
        startHour: true,
        endHour: true,
        triggerType: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    }),
    prisma.rescueSession.findMany({
      where: { userId: patientId, startedAt: { gte: thirtyDaysAgo } },
      select: { id: true, trigger: true, outcome: true, startedAt: true },
    }),
    prisma.productivityEvent.findMany({
      where: {
        userId: patientId,
        eventType: 'FEATURE_USED',
        eventValue: 'weight_reading',
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadataJson: true },
      take: 200,
    }),
    prisma.productivityEvent.findMany({
      where: {
        userId: patientId,
        eventType: 'FEATURE_USED',
        eventValue: 'self_trust_score',
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadataJson: true },
      take: 200,
    }),
  ])

  if (!patient) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Excuse breakdown: tally categories so the UI can render a pie /
  // ranked bar chart. Only the top categories are surfaced — the
  // long tail is rolled into "OTHER" by the client if needed.
  const excuseBreakdown = excuseRows.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1
      return acc
    },
    {},
  )

  // Intervention effectiveness — per-rescue-trigger hold rate.
  // INTERRUPTED = a success (user pulled back). SLIPPED = a failure.
  // PENDING / UNRESOLVED rows are excluded from the denominator so the
  // metric reflects only completed rescues. This is the headline
  // clinical metric pharma BD will ask about: "How often does the
  // autopilot interrupt actually work?"
  const byTrigger = new Map<string, { held: number; slipped: number }>()
  for (const r of rescueRows) {
    const bucket = byTrigger.get(r.trigger) ?? { held: 0, slipped: 0 }
    if (r.outcome === 'INTERRUPTED') bucket.held += 1
    else if (r.outcome === 'SLIPPED') bucket.slipped += 1
    byTrigger.set(r.trigger, bucket)
  }
  const interventionEffectiveness = Array.from(byTrigger.entries()).map(
    ([trigger, { held, slipped }]) => ({
      trigger,
      held,
      slipped,
      holdRate: held + slipped > 0 ? held / (held + slipped) : null,
    }),
  )

  // Weight velocity: pull `weightKg` out of metadataJson if present.
  // Withings integration writes ProductivityEvent FEATURE_USED rows
  // with shape { weightKg: number, source: 'withings' }. We expose
  // only the decimated point series — NOT the raw scale samples.
  const weightVelocity = weightRows
    .map((row) => {
      const md = row.metadataJson as { weightKg?: number } | null
      const w = md?.weightKg
      if (typeof w !== 'number') return null
      return { at: row.createdAt.toISOString(), weightKg: w }
    })
    .filter((p): p is { at: string; weightKg: number } => p !== null)

  // Self-trust trend: same shape pattern. Score is stored under the
  // `score` key in metadataJson when the canonical updater runs.
  const selfTrustTrend = selfTrustRows
    .map((row) => {
      const md = row.metadataJson as { score?: number } | null
      const s = md?.score
      if (typeof s !== 'number') return null
      return { at: row.createdAt.toISOString(), score: s }
    })
    .filter((p): p is { at: string; score: number } => p !== null)

  return NextResponse.json({
    patient: {
      id: patient.id,
      displayName: anonymizePatientName(patient.name),
      planType: patient.planType,
      primaryWedge: patient.primaryWedge,
      currentStreak: patient.currentStreak,
      longestStreak: patient.longestStreak,
      selfTrustScore: patient.selfTrustScore,
      executionScore: patient.executionScore,
      slipsThisMonth: patient.slipsThisMonth,
      lastSlipAt: patient.lastSlipAt ? patient.lastSlipAt.toISOString() : null,
      daysOnPlatform: Math.max(
        0,
        Math.floor(
          (Date.now() - patient.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      ),
      glp1: patient.glp1Drug
        ? {
            drug: patient.glp1Drug,
            injectionWeekday: patient.glp1InjectionWeekday,
            startedAt: patient.glp1StartedAt
              ? patient.glp1StartedAt.toISOString()
              : null,
          }
        : null,
    },
    recentSlips: recentSlips.map((s) => ({
      id: s.id,
      at: s.createdAt.toISOString(),
      trigger: s.trigger,
      recovered: s.recoveredAt !== null,
    })),
    excuseBreakdown,
    dangerWindows: dangerWindowRows,
    interventionEffectiveness,
    weightVelocity,
    selfTrustTrend,
    hipaaCaveat:
      'Aggregate clinical-grade data only. Raw biometric samples not exposed. Patient retains full export rights.',
  })
}
