import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma, Prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

/**
 * POST /api/v1/mobile/checkin-response
 *
 * The learning-loop sink for edge layer 2: when an on-device danger-window
 * check-in fires and the user taps an action button on the notification
 * ("Caught me" / "I'm good") — or taps the body to open the app ("opened") —
 * the mobile client POSTs the response here so the danger-window-learner cron
 * and the interrupt-history feed see it.
 *
 * Auth: Clerk session token (Bearer) → clerkId → User via User.clerkId.
 * `auth()` is kept OUTSIDE try/catch per the Next 16 cacheComponents pattern
 * (see /api/v1/mobile/me).
 *
 * Body (Zod-validated):
 *   {
 *     kind:     'caught_me' | 'im_good' | 'opened',
 *     windowId?: string,          // DangerWindow.id this check-in was scheduled from
 *     firedAt?:  string (ISO)      // when the notification actually fired on-device
 *   }
 *
 * Persistence — why ProductivityEvent and not Checkin:
 *   The Checkin model is morning/night journaling (CheckinType MORNING|NIGHT,
 *   required promptedAt, summaryJson/rawTranscript). There is no MORNING/NIGHT
 *   fit for a window-scoped check-in and no existing web write path that
 *   completes a Checkin row, so forcing one would be inventing semantics.
 *   Instead we write a ProductivityEvent, the same sink the lock-screen
 *   interrupt-feedback route uses.
 *
 *   We map kind → an EXISTING EventType (no enum values added):
 *     'caught_me' → AUTOPILOT_INTERRUPTED  (the user said "yes, autopilot —
 *                    caught me": exactly an autopilot interruption signal)
 *     'im_good'   → CHECKIN_COMPLETED      (a completed, no-slip check-in)
 *     'opened'    → CHECKIN_STARTED        (opened the app from the prompt but
 *                    hasn't resolved either way — the in-app flow continues it)
 *   kind + windowId + firedAt + source go into metadataJson so the learner can
 *   weight by window. We additionally mirror to INTERRUPT_FEEDBACK (eventValue
 *   helpful/not_helpful) so the existing /api/v1/events join + <InterruptHistory />
 *   render keeps working unchanged — matching the interrupts/[id]/feedback route.
 */

export const maxDuration = 10

const bodySchema = z.object({
  kind: z.enum(['caught_me', 'im_good', 'opened']),
  windowId: z.string().min(1).max(64).optional(),
  firedAt: z.string().datetime().optional(),
})

type Kind = z.infer<typeof bodySchema>['kind']

// Closest-matching existing EventType per response kind. No enum values added.
const EVENT_TYPE_BY_KIND = {
  caught_me: 'AUTOPILOT_INTERRUPTED',
  im_good: 'CHECKIN_COMPLETED',
  opened: 'CHECKIN_STARTED',
} as const satisfies Record<Kind, string>

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { kind, windowId, firedAt } = parsed.data

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const metadata = {
    source: 'local_checkin',
    kind,
    ...(windowId ? { windowId } : {}),
    ...(firedAt ? { firedAt } : {}),
  } as Prisma.InputJsonValue

  // Primary event the danger-window-learner reads, plus a mirrored
  // INTERRUPT_FEEDBACK so the existing read-side feed picks it up. Only the
  // resolved kinds ('caught_me' / 'im_good') carry a helpful/not_helpful
  // signal; 'opened' is an in-progress open and gets no feedback mirror.
  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: EVENT_TYPE_BY_KIND[kind],
        eventValue: kind,
        metadataJson: metadata,
      },
    }),
  ]

  if (kind === 'caught_me' || kind === 'im_good') {
    writes.push(
      prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'INTERRUPT_FEEDBACK',
          // 'caught_me' = the interrupt landed (helpful); 'im_good' = no slip,
          // the prompt was a false alarm from the user's POV (not_helpful).
          eventValue: kind === 'caught_me' ? 'helpful' : 'not_helpful',
          metadataJson: {
            source: 'local_checkin',
            rawFeedback: kind,
            ...(windowId ? { windowId } : {}),
            ...(firedAt ? { firedAt } : {}),
          } as Prisma.InputJsonValue,
        },
      }),
    )
  }

  await prisma.$transaction(writes)

  return NextResponse.json({ ok: true, kind, eventType: EVENT_TYPE_BY_KIND[kind] })
}
