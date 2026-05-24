import { NextResponse } from 'next/server'
import { prisma, Prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { batchProcess } from '@/lib/batch'
import {
  inferInterruptFeedback,
  type DangerWindowMatcher,
  type InferredFeedback,
} from '@/lib/interrupt-feedback'

export const maxDuration = 120

/**
 * Auto-tag interrupt feedback.
 *
 * Today an interrupt fires and the user is supposed to tap "caught me"
 * or "wrong time" to give the model a judgment signal. ~70% of
 * interrupts never get a tag — so the model gets worse-than-average
 * interrupts forever for those users (per the /how-coyl-knows-you copy).
 *
 * This cron infers the tag from observed behavior:
 *
 *   • Scans AUTOPILOT_INTERRUPTED events fired 30 min – 2 hours ago
 *     that have no `metadataJson.feedback` set yet (user OR inferred).
 *   • For each: did the user log a slip in the 30-min window after the
 *     interrupt fired? → 'ignored'.
 *   • No slip + the originating danger window has ended → 'caught_me'.
 *   • No slip + window still active → DEFER until next 15-min tick.
 *
 * Persists the inferred tag on the original interrupt's metadataJson
 * (with `feedbackSource: 'inferred'`) AND writes a separate FEATURE_USED
 * audit event so the inference itself is queryable.
 *
 * Manual user tags always win — the candidate filter skips any
 * interrupt whose metadataJson.feedback is already set.
 */

const LOOKBACK_END_MS = 30 * 60 * 1000 // 30 minutes — newer than this is "still live"
const LOOKBACK_START_MS = 2 * 60 * 60 * 1000 // 2 hours — older than this is stale
const INFERENCE_WINDOW_MS = 30 * 60 * 1000 // 30 minutes after interrupt fired
const SCAN_LIMIT = 1000

type InterruptCandidate = {
  id: string
  userId: string
  createdAt: Date
  metadataJson: unknown
}

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  const interruptCutoffStart = new Date(now.getTime() - LOOKBACK_START_MS)
  const interruptCutoffEnd = new Date(now.getTime() - LOOKBACK_END_MS)

  // Fetch all AUTOPILOT_INTERRUPTED events in the lookback range. We
  // filter "feedback already set" in-memory because Prisma's JSON-path
  // filter doesn't cleanly express "field is missing OR null" across
  // legacy rows with metadataJson = null. The lookback range bounds the
  // scan to ≤2h of interrupts, so the row count is small regardless.
  const raw = await prisma.productivityEvent.findMany({
    where: {
      eventType: 'AUTOPILOT_INTERRUPTED',
      createdAt: { gte: interruptCutoffStart, lte: interruptCutoffEnd },
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      metadataJson: true,
    },
    orderBy: { createdAt: 'asc' },
    take: SCAN_LIMIT,
  })

  // Idempotency: skip anything already tagged (user OR previously inferred).
  const candidates: InterruptCandidate[] = raw.filter((e) => {
    const meta = (e.metadataJson ?? {}) as Record<string, unknown>
    return meta.feedback === undefined || meta.feedback === null
  })

  let taggedCaughtMe = 0
  let taggedIgnored = 0
  let deferred = 0
  let errored = 0

  await batchProcess(
    candidates,
    async (candidate) => {
      const windowEnd = new Date(candidate.createdAt.getTime() + INFERENCE_WINDOW_MS)

      // 1. Did the user log a slip in the 30-min window after the fire?
      const slipInWindow = await prisma.slipRecord.findFirst({
        where: {
          userId: candidate.userId,
          createdAt: { gte: candidate.createdAt, lte: windowEnd },
        },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })

      // 2. If the interrupt was a danger-window kind, resolve the window
      //    so we can check "is it still active right now?". Other kinds
      //    (post-slip, silence, scheduled) don't have an ongoing window
      //    to align with — inference treats those as scoreable
      //    immediately once they're ≥30 min old.
      const meta = (candidate.metadataJson ?? {}) as Record<string, unknown>
      const windowId = typeof meta.windowId === 'string' ? meta.windowId : null
      let originatingWindow: DangerWindowMatcher | null = null
      let timezone: string | null = null

      if (windowId) {
        const [window, user] = await Promise.all([
          prisma.dangerWindow.findUnique({
            where: { id: windowId },
            select: {
              id: true,
              dayOfWeek: true,
              startHour: true,
              endHour: true,
              active: true,
            },
          }),
          prisma.user.findUnique({
            where: { id: candidate.userId },
            select: { timezone: true },
          }),
        ])
        originatingWindow = window
        timezone = user?.timezone ?? null
      }

      const inferred = inferInterruptFeedback({
        interruptCreatedAt: candidate.createdAt,
        slipInWindow,
        originatingWindow,
        timezone,
        now,
      })

      if (inferred === 'defer') {
        deferred++
        return
      }

      // 3. Persist on the original event's metadataJson. Spread the
      //    existing metadata so we don't drop windowId/kind/etc.
      const nextMeta = {
        ...meta,
        feedback: inferred,
        feedbackSource: 'inferred',
        feedbackInferredAt: now.toISOString(),
      } as Prisma.InputJsonValue

      // 4. Audit event — captures the inference itself, so we can later
      //    measure how often each branch fired and spot-check accuracy
      //    against any manual tags that arrived afterward. Using
      //    FEATURE_USED because the EventType enum has no
      //    INTERRUPT_FEEDBACK_INFERRED value and we're avoiding a
      //    migration on this ship.
      await prisma.$transaction([
        prisma.productivityEvent.update({
          where: { id: candidate.id },
          data: { metadataJson: nextMeta },
        }),
        prisma.productivityEvent.create({
          data: {
            userId: candidate.userId,
            eventType: 'FEATURE_USED',
            eventValue: 'interrupt_feedback_inferred',
            metadataJson: {
              type: 'interrupt_feedback_inferred',
              interruptEventId: candidate.id,
              feedback: inferred,
              slipId: slipInWindow?.id ?? null,
              windowId: windowId ?? null,
              inferenceWindowMinutes: INFERENCE_WINDOW_MS / 60_000,
            },
          },
        }),
      ])

      if (inferred === 'caught_me') taggedCaughtMe++
      else taggedIgnored++
    },
    20,
  ).then((results) => {
    for (const r of results) {
      if (r.error) errored++
    }
  })

  await recordHeartbeat('auto-tag-interrupt-feedback', {
    scanned: candidates.length,
    taggedCaughtMe,
    taggedIgnored,
    deferred,
    errored,
  })

  return NextResponse.json({
    scanned: candidates.length,
    taggedCaughtMe,
    taggedIgnored,
    deferred,
    errored,
    timestamp: now.toISOString(),
  })
}
