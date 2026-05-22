/**
 * POST /api/v1/interrupts/[id]/feedback — tag an interrupt with the
 * user's judgment after it fired.
 *
 * Wired to:
 *   • The iOS Live Activity widget's App Intents ("Held it" / "Snooze")
 *   • The Expo notification action buttons on the lock screen
 *   • Any in-app manual tagging UI
 *
 * The "I slipped" path runs through /api/v1/slip/quick — it creates a
 * SlipRecord, and the auto-tag-interrupt-feedback cron later infers
 * 'ignored' on the originating interrupt event. Callers can still pass
 * feedback='ignored' here as a manual confession when there's no slip
 * record to write (e.g. when the user is tagging an old interrupt).
 *
 * Body:
 *   {
 *     feedback: 'caught_me' | 'snoozed' | 'ignored',
 *     source: 'live_activity' | 'lock_screen' | 'manual'
 *   }
 *
 * Side effects:
 *   • Merge feedback / feedbackSource / feedbackTaggedAt into the
 *     interrupt event's metadataJson (preserves existing windowId etc.)
 *   • Write a FEATURE_USED audit event (type='interrupt_feedback_tagged')
 *     so the inference itself is queryable in analytics.
 *   • Mirror to an INTERRUPT_FEEDBACK event so the read-side
 *     /api/v1/events join + <InterruptHistory /> renderer keep working
 *     without a schema change.
 *
 * Idempotency:
 *   • Re-POSTing the same feedback returns 200 with idempotent=true.
 *   • A manual tag overwrites a prior INFERRED tag (the human's tap
 *     wins over the cron's guess).
 *   • A manual tag does NOT overwrite a prior manual tag — the first
 *     manual tap stands. Returns 200 with conflict=true so the widget
 *     doesn't show an error.
 *
 * Auth: Clerk Bearer token, same pattern as /api/v1/slip/quick.
 */

import { auth } from '@clerk/nextjs/server'
import { prisma, Prisma } from '@repo/database'

export const maxDuration = 10

type FeedbackTag = 'caught_me' | 'snoozed' | 'ignored'
type FeedbackSource = 'live_activity' | 'lock_screen' | 'manual'

function isFeedbackTag(v: unknown): v is FeedbackTag {
  return v === 'caught_me' || v === 'snoozed' || v === 'ignored'
}
function isFeedbackSource(v: unknown): v is FeedbackSource {
  return v === 'live_activity' || v === 'lock_screen' || v === 'manual'
}

/**
 * Map the three-way feedback tag down to the two-way
 * helpful/not_helpful eventValue that <InterruptHistory /> and the
 * /api/v1/events join expect. Keeps the read-side untouched.
 */
function toLegacyEventValue(tag: FeedbackTag): 'helpful' | 'not_helpful' {
  return tag === 'caught_me' ? 'helpful' : 'not_helpful'
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: interruptId } = await params
  if (!interruptId) {
    return Response.json({ error: 'missing_interrupt_id' }, { status: 400 })
  }

  let body: { feedback?: unknown; source?: unknown } = {}
  try {
    body = (await req.json()) as { feedback?: unknown; source?: unknown }
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!isFeedbackTag(body.feedback)) {
    return Response.json(
      { error: 'invalid_feedback', allowed: ['caught_me', 'snoozed', 'ignored'] },
      { status: 400 },
    )
  }
  if (!isFeedbackSource(body.source)) {
    return Response.json(
      { error: 'invalid_source', allowed: ['live_activity', 'lock_screen', 'manual'] },
      { status: 400 },
    )
  }
  const feedback: FeedbackTag = body.feedback
  const source: FeedbackSource = body.source

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const interrupt = await prisma.productivityEvent.findUnique({
    where: { id: interruptId },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      metadataJson: true,
    },
  })
  if (!interrupt) {
    return Response.json({ error: 'interrupt_not_found' }, { status: 404 })
  }
  if (interrupt.userId !== user.id) {
    // Don't leak existence — 404 to anyone but the owner.
    return Response.json({ error: 'interrupt_not_found' }, { status: 404 })
  }

  const existingMeta =
    interrupt.metadataJson &&
    typeof interrupt.metadataJson === 'object' &&
    !Array.isArray(interrupt.metadataJson)
      ? (interrupt.metadataJson as Record<string, unknown>)
      : {}

  const existingFeedback =
    typeof existingMeta.feedback === 'string' ? (existingMeta.feedback as string) : null
  const existingSource =
    typeof existingMeta.feedbackSource === 'string'
      ? (existingMeta.feedbackSource as string)
      : null

  const priorIsInferred = existingSource === 'inferred'
  const priorIsManual = existingFeedback !== null && !priorIsInferred

  // Re-tagging with the same value is a 200 no-op so the widget can
  // safely retry on flaky cellular without producing duplicate audit
  // events.
  if (priorIsManual && existingFeedback === feedback) {
    return Response.json({
      ok: true,
      feedback: existingFeedback,
      taggedAt:
        typeof existingMeta.feedbackTaggedAt === 'string'
          ? existingMeta.feedbackTaggedAt
          : null,
      idempotent: true,
    })
  }

  // Different manual tag arrived after the first. The first one wins —
  // unusual enough (user taps Held it, then Snooze) to warrant a log
  // but not a 4xx; the widget should keep going.
  if (priorIsManual && existingFeedback !== feedback) {
    console.warn('[interrupts/feedback] ignoring conflicting manual tag', {
      interruptId,
      userId: user.id,
      existing: existingFeedback,
      incoming: feedback,
    })
    return Response.json({
      ok: true,
      feedback: existingFeedback,
      taggedAt:
        typeof existingMeta.feedbackTaggedAt === 'string'
          ? existingMeta.feedbackTaggedAt
          : null,
      idempotent: true,
      conflict: true,
    })
  }

  // Case: no prior tag, OR prior tag was inferred → write/overwrite.
  const now = new Date()
  const nextMeta = {
    ...existingMeta,
    feedback,
    feedbackSource: source,
    feedbackTaggedAt: now.toISOString(),
  } as Prisma.InputJsonValue

  const windowId =
    typeof existingMeta.windowId === 'string' ? (existingMeta.windowId as string) : null

  // One transaction: update the original interrupt, write the audit
  // event, mirror to INTERRUPT_FEEDBACK so the existing read-side
  // <InterruptHistory /> + /api/v1/events join keeps working unchanged.
  await prisma.$transaction([
    prisma.productivityEvent.update({
      where: { id: interrupt.id },
      data: { metadataJson: nextMeta },
    }),
    prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'FEATURE_USED',
        eventValue: 'interrupt_feedback_tagged',
        metadataJson: {
          type: 'interrupt_feedback_tagged',
          interruptEventId: interrupt.id,
          feedback,
          source,
          overrodeInferred: priorIsInferred,
          ...(windowId ? { windowId } : {}),
        },
      },
    }),
    prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'INTERRUPT_FEEDBACK',
        eventValue: toLegacyEventValue(feedback),
        metadataJson: {
          interruptId: interrupt.id,
          source,
          rawFeedback: feedback,
          ...(windowId ? { windowId } : {}),
        },
      },
    }),
  ])

  return Response.json({
    ok: true,
    feedback,
    taggedAt: now.toISOString(),
    overrodeInferred: priorIsInferred,
  })
}
