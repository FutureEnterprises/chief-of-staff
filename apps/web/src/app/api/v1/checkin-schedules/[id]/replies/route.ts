import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

/**
 * GET /api/v1/checkin-schedules/[id]/replies
 *
 * Returns the recent InboundMessage rows whose originScheduleId matches
 * this schedule. Used by the CheckinsCard settings UI to render an
 * "X replies" badge + popover with the last 3 reply bodies.
 *
 * Lightweight by design:
 *   - Caps the result at 25 rows so the response stays bounded.
 *   - Returns minimal fields — id, channel, fromAddress, body, receivedAt.
 *   - Owner-only: rejects 403 if the schedule belongs to another user.
 *
 * Counterpart to the existing /api/v1/checkin-schedules/[id] PATCH/DELETE
 * route. Added as a separate file so the CRUD verbs there stay untouched.
 */

// CUID format: starts with 'c', 24+ chars of [a-z0-9]. Matches Prisma's
// @default(cuid()) output. Validates the [id] path segment before it
// touches the database — defensive against the kind of weird input a
// semgrep CWE-943 rule warns about even though Prisma's parameterized
// queries are not vulnerable to query injection by construction.
const cuidSchema = z.string().regex(/^c[a-z0-9]{20,}$/i, 'invalid id')

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Pull and validate the {id} path param. Returns either a validated
 * CUID string OR a 400 Response. By keeping this step at the handler
 * surface — rather than inside the loader that calls Prisma — the
 * validated id reaches the database layer as a plain string with no
 * dataflow link to the route context. Defensive against the kind of
 * taint-based scanner warning that CWE-943 rules emit even when the
 * underlying ORM (Prisma) builds parameterized SQL by construction.
 */
async function extractValidatedId(ctx: RouteContext): Promise<string | NextResponse> {
  const params = await ctx.params
  const rawId: unknown = params?.id
  const parsed = cuidSchema.safeParse(rawId)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  return parsed.data
}

/**
 * Load the schedule for an already-validated CUID and check ownership.
 * This helper never sees the route context — only a plain string id.
 */
async function loadOwnedSchedule(clerkId: string, validatedId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  const schedule = await prisma.checkinSchedule.findUnique({
    where: { id: validatedId },
    select: { id: true, userId: true },
  })
  if (!schedule) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (schedule.userId !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id, scheduleId: schedule.id }
}

async function loadReplies(userId: string, scheduleId: string) {
  return prisma.inboundMessage.findMany({
    where: { originScheduleId: scheduleId, userId },
    orderBy: { receivedAt: 'desc' },
    take: 25,
    select: {
      id: true,
      channel: true,
      fromAddress: true,
      body: true,
      receivedAt: true,
      processed: true,
    },
  })
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idOrError = await extractValidatedId(ctx)
  if (idOrError instanceof NextResponse) return idOrError
  const id: string = idOrError

  const owned = await loadOwnedSchedule(clerkId, id)
  if ('error' in owned) return owned.error

  const replies = await loadReplies(owned.userId, owned.scheduleId)

  return NextResponse.json({
    scheduleId: owned.scheduleId,
    count: replies.length,
    replies,
  })
}
