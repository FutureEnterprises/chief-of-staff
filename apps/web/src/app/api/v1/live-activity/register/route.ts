/**
 * POST /api/v1/live-activity/register — register an iOS Live Activity
 * so the server can push updates to it.
 *
 * When the iOS app starts a Live Activity, ActivityKit returns an
 * `Activity.id` immediately. A push token for the activity arrives
 * asynchronously via the `pushTokenUpdates` async sequence (and may
 * be regenerated mid-session if iOS rotates it). The Expo JS bridge
 * POSTs each new (activityId, pushToken) pair here so the server
 * always has the right target for an APNs liveactivity push.
 *
 * Body:
 *   {
 *     activityId: string        // Activity.id from ActivityKit
 *     pushToken: string         // hex-encoded APNs token for THIS activity
 *     interruptId?: string      // ProductivityEvent the activity tracks
 *     archetype?: string        // user's primary archetype, for analytics
 *   }
 *
 * Semantics:
 *   • Upsert by (userId, activityId). If the row exists, refresh the
 *     pushToken / interruptId / archetype and mark active=true.
 *   • Any OTHER active registration for this user (different activityId)
 *     is flipped to active=false. iOS only renders one Live Activity
 *     for a given attribute type at a time, so the server should never
 *     try to push to a stale one.
 *
 * Auth: Clerk Bearer token, same pattern as /api/v1/slip/quick.
 */

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

export const maxDuration = 10

type Body = {
  activityId?: unknown
  pushToken?: unknown
  interruptId?: unknown
  archetype?: unknown
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const activityId = typeof body.activityId === 'string' ? body.activityId.trim() : ''
  const pushToken = typeof body.pushToken === 'string' ? body.pushToken.trim() : ''
  const interruptId =
    typeof body.interruptId === 'string' && body.interruptId.trim().length > 0
      ? body.interruptId.trim()
      : null
  const archetype =
    typeof body.archetype === 'string' && body.archetype.trim().length > 0
      ? body.archetype.trim()
      : null

  if (!activityId) {
    return Response.json({ error: 'missing_activity_id' }, { status: 400 })
  }
  if (!pushToken) {
    return Response.json({ error: 'missing_push_token' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  // Single transaction:
  //  1. Flip any prior-active rows for this user (other activityIds) to
  //     active=false + endedAt=now. iOS guarantees only one activity per
  //     attribute type, so stale rows just mean the previous activity
  //     ended without firing an explicit /end push back to us.
  //  2. Upsert the (userId, activityId) row with the fresh pushToken.
  const now = new Date()
  const [, registration] = await prisma.$transaction([
    prisma.liveActivityRegistration.updateMany({
      where: {
        userId: user.id,
        active: true,
        activityId: { not: activityId },
      },
      data: { active: false, endedAt: now },
    }),
    prisma.liveActivityRegistration.upsert({
      where: {
        userId_activityId: { userId: user.id, activityId },
      },
      create: {
        userId: user.id,
        activityId,
        pushToken,
        interruptId,
        archetype,
        active: true,
      },
      update: {
        pushToken,
        interruptId: interruptId ?? undefined,
        archetype: archetype ?? undefined,
        active: true,
        endedAt: null,
      },
      select: { id: true },
    }),
  ])

  return Response.json({ ok: true, registrationId: registration.id })
}
