import { auth } from '@clerk/nextjs/server'
import { prisma, type EventType } from '@repo/database'

/**
 * GET /api/v1/events?type=<EventType>&limit=N
 *
 * Read-side companion to the POST log endpoint. Used by the
 * <InterruptHistory /> component on /today to render recent
 * AUTOPILOT_INTERRUPTED events with their INTERRUPT_FEEDBACK matches.
 *
 * Scoped to the authenticated user. Limit clamped to 50.
 */
export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? 'AUTOPILOT_INTERRUPTED'
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10) || 10, 50)

  // Fetch interrupts + recent feedback events in parallel. Match feedback
  // to interrupt by the windowId in metadata when present; falls back to
  // null when no feedback was given.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [interrupts, feedbacks] = await Promise.all([
    prisma.productivityEvent.findMany({
      where: {
        userId: user.id,
        eventType: type as EventType,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        metadataJson: true,
      },
    }),
    prisma.productivityEvent.findMany({
      where: {
        userId: user.id,
        eventType: 'INTERRUPT_FEEDBACK',
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        eventValue: true,
        metadataJson: true,
      },
    }),
  ])

  // Build a map: windowId → 'helpful' | 'not_helpful'. Most recent
  // feedback wins for a given window.
  const feedbackByWindow = new Map<string, 'helpful' | 'not_helpful'>()
  for (const f of feedbacks) {
    const wid =
      typeof f.metadataJson === 'object' && f.metadataJson !== null
        ? (f.metadataJson as Record<string, unknown>).windowId
        : null
    if (typeof wid === 'string' && !feedbackByWindow.has(wid)) {
      const v = f.eventValue === 'helpful' ? 'helpful' : 'not_helpful'
      feedbackByWindow.set(wid, v)
    }
  }

  const events = interrupts.map((e) => {
    const meta = (e.metadataJson ?? {}) as Record<string, unknown>
    const windowId = typeof meta.windowId === 'string' ? meta.windowId : null
    return {
      id: e.id,
      firedAt: e.createdAt.toISOString(),
      kind: typeof meta.kind === 'string' ? meta.kind : 'INTERRUPT',
      label: typeof meta.label === 'string' ? meta.label : null,
      channel: typeof meta.channel === 'string' ? meta.channel : 'unknown',
      feedback: windowId ? feedbackByWindow.get(windowId) ?? null : null,
    }
  })

  return Response.json({ events })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  try {
    const { eventType, metadata } = await req.json()

    if (!eventType || typeof eventType !== 'string') {
      return Response.json({ error: 'eventType required' }, { status: 400 })
    }

    // Allowlist of trackable events
    const allowed: EventType[] = [
      'PAYWALL_SEEN', 'UPGRADE_STARTED', 'FEATURE_USED',
      'ASSESSMENT_RUN', 'CHAT_SESSION', 'MORNING_REVIEW', 'NIGHT_REVIEW',
      'RESCUE_RESOLVED', 'SLIP_LOGGED', 'DECISION_MADE',
      'SHARE_CLICKED', 'CALLOUT_VIEWED', 'PROMPT_DISMISSED',
      'INTERRUPT_FEEDBACK',
    ]
    if (!allowed.includes(eventType as EventType)) {
      return Response.json({ error: 'Invalid event type' }, { status: 400 })
    }

    await prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: eventType as EventType,
        ...(metadata ? { metadataJson: metadata } : {}),
      },
    })

    // Update lastActiveAt for churn tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
