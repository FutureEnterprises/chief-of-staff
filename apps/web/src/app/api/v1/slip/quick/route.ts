/**
 * POST /api/v1/slip/quick — one-tap "I slipped" confession.
 *
 * Sibling of /api/v1/slip but with zero required input. Designed to remove
 * the 3-8 taps of friction that were killing ground-truth slip data. The
 * user taps once; we infer everything else from their current context.
 *
 * Semantics diverge from /api/v1/slip:
 *  - Empty body is valid. Optional { context: 'kitchen' | 'phone' | ... }
 *    if the UI exposes 4 quick-buttons instead of 1.
 *  - We INFER the trigger from the user's active danger windows (the one
 *    they're inside right now in their local time).
 *  - We INFER an optional commitment link by matching the active window's
 *    triggerType to the most-broken commitment in a related domain.
 *  - We DO NOT fire the AI rescue stream. This endpoint is fast confession;
 *    the rescue stream lives on /api/v1/slip + /rescue. We return a
 *    rescueLink the client can route to if the user wants the full ritual.
 *
 * Same writes as /api/v1/slip otherwise: SlipRecord row, user state
 * update (lastSlipAt, slipsThisMonth, recoveryState='SLIPPED'),
 * commitment.breakCount increment if linked, ProductivityEvent
 * SLIP_LOGGED with source='quick' so we can compare conversion vs.
 * the verbose path.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { hasFeature } from '@/lib/services/entitlement.service'

export const maxDuration = 10

type QuickContext = 'kitchen' | 'phone' | 'work' | 'other'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, timezone: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'recoveryEngine')
  if (!canUse) {
    return Response.json(
      { error: 'feature_gated', feature: 'recoveryEngine', message: 'Recovery Engine is a Core feature.' },
      { status: 402 }
    )
  }

  // Body is optional. Tolerate empty/no-body POSTs — that's the whole
  // point of "one tap, zero friction". An invalid JSON body silently
  // degrades to "no context".
  let context: QuickContext | undefined
  try {
    const body = (await req.json()) as { context?: QuickContext } | null
    if (body && typeof body.context === 'string') {
      if (body.context === 'kitchen' || body.context === 'phone' || body.context === 'work' || body.context === 'other') {
        context = body.context
      }
    }
  } catch {
    // empty body or invalid JSON — fine, we infer from server-side context
  }

  // Infer trigger from active danger window in the user's local time.
  const tz = user.timezone ?? 'UTC'
  const dangerWindows = await prisma.dangerWindow.findMany({
    where: { userId: user.id, active: true },
  })
  const activeWindow = computeActiveDangerWindow(dangerWindows, tz)

  let trigger: string
  if (activeWindow) {
    trigger = `${activeWindow.label} (auto-detected window)`
  } else if (context) {
    trigger = `Quick slip — ${context}`
  } else {
    trigger = 'Quick slip — unspecified'
  }

  // Infer a commitment link from the active window's triggerType +
  // user's active commitments. Heuristic: if the window's triggerType
  // is "stress" and the user has a commitment in FOOD/CRAVING/SPENDING,
  // we pick the lowest-keepCount one (i.e. the one being broken the
  // most — the most likely culprit). If there's no window or no domain
  // overlap, we leave commitmentId null.
  let inferredCommitment: { id: string; rule: string } | null = null
  if (activeWindow?.triggerType) {
    const domains = domainsForTriggerType(activeWindow.triggerType)
    if (domains.length > 0) {
      const candidate = await prisma.commitment.findFirst({
        where: { userId: user.id, active: true, domain: { in: domains } },
        orderBy: [{ keepCount: 'asc' }, { breakCount: 'desc' }],
        select: { id: true, rule: true },
      })
      if (candidate) inferredCommitment = candidate
    }
  }

  // Create the slip record.
  const slip = await prisma.slipRecord.create({
    data: {
      userId: user.id,
      trigger,
      notes: null,
      commitmentId: inferredCommitment?.id ?? null,
    },
  })

  // Update user state — mirrors /api/v1/slip.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSlipAt: new Date(),
      slipsThisMonth: { increment: 1 },
      recoveryState: 'SLIPPED',
    },
  })

  // If we linked a commitment, count the break against it.
  if (inferredCommitment) {
    await prisma.commitment
      .updateMany({
        where: { id: inferredCommitment.id, userId: user.id },
        data: { breakCount: { increment: 1 }, lastCheckedAt: new Date() },
      })
      .catch(() => {})
  }

  // Telemetry: source='quick' lets us compare quick-vs-verbose slip
  // conversion in analytics.
  await prisma.productivityEvent
    .create({
      data: {
        userId: user.id,
        eventType: 'SLIP_LOGGED',
        eventValue: trigger,
        metadataJson: {
          slipId: slip.id,
          source: 'quick',
          inferredTrigger: trigger,
          inferredWindow: activeWindow?.label ?? null,
          inferredCommitment: inferredCommitment?.rule ?? null,
          context: context ?? null,
        },
      },
    })
    .catch(() => {})

  return Response.json({
    slip: {
      id: slip.id,
      trigger: slip.trigger,
      notes: slip.notes,
      commitmentId: slip.commitmentId,
      createdAt: slip.createdAt,
    },
    inferred: {
      window: activeWindow?.label ?? null,
      commitment: inferredCommitment?.rule ?? null,
    },
    rescueLink: `/rescue?slipId=${slip.id}`,
  })
}

/**
 * Mirrors today/page.tsx::computeActiveDangerWindow — returns the
 * window the user is currently inside (their local weekday + hour
 * matches one of their active windows). Wildcard dayOfWeek (-1)
 * matches every day.
 */
function computeActiveDangerWindow(
  windows: Array<{ id: string; label: string; dayOfWeek: number; startHour: number; endHour: number; triggerType: string | null }>,
  tz: string
): { id: string; label: string; triggerType: string | null } | null {
  if (windows.length === 0) return null
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const currentDay = dayMap[weekdayStr] ?? 0
  const currentHour = parseInt(hourStr, 10)

  for (const w of windows) {
    if (w.dayOfWeek !== -1 && w.dayOfWeek !== currentDay) continue
    if (currentHour < w.startHour || currentHour >= w.endHour) continue
    return { id: w.id, label: w.label, triggerType: w.triggerType }
  }
  return null
}

/**
 * Map a DangerWindow.triggerType to the CommitmentDomains most likely
 * being broken in that window. Conservative — we'd rather leave
 * commitmentId null than wrongly attribute a break.
 */
function domainsForTriggerType(triggerType: string): Array<'FOOD' | 'CRAVING' | 'SPENDING' | 'DIGITAL' | 'FOCUS' | 'SLEEP'> {
  switch (triggerType) {
    case 'stress':
      return ['FOOD', 'CRAVING', 'SPENDING']
    case 'social':
      return ['SPENDING', 'CRAVING']
    case 'idle':
      return ['DIGITAL', 'FOCUS']
    case 'post-work':
      return ['FOOD', 'DIGITAL']
    default:
      return []
  }
}
