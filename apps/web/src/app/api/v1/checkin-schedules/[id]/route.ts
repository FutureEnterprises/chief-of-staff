import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { recomputeNextFiresAt } from '@/lib/services/checkin-schedule.service'

/**
 * /api/v1/checkin-schedules/[id]
 *
 * PATCH → partial update. Common case: { active: false } to pause a
 *         schedule, or { label, message } to retitle. Time-shape edits
 *         (intervalHours, dailyTime, etc.) trigger a recompute of
 *         nextFiresAt so the cron picks up the new cadence immediately.
 * DELETE → hard delete. The on-delete cascade comes from the FK; this
 *         endpoint just authorizes the action.
 *
 * Both verbs check ownership before touching the row.
 */

// CUID format: starts with 'c', 24+ chars of [a-z0-9]. Matches Prisma's
// @default(cuid()) output. Validates the [id] path segment before it
// touches the database — defensive against the kind of weird input a
// semgrep CWE-943 rule warns about even though Prisma's parameterized
// queries are not vulnerable to query injection by construction.
const cuidSchema = z.string().regex(/^c[a-z0-9]{20,}$/i, 'invalid id')

const HHMM = z.string().regex(/^\d{1,2}:\d{2}$/, 'Use HH:MM').optional()

const patchSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  message: z.string().max(280).nullable().optional(),
  channel: z.enum(['EMAIL', 'SMS']).optional(),
  active: z.boolean().optional(),
  intervalHours: z.number().int().min(1).max(12).nullable().optional(),
  windowStart: HHMM,
  windowEnd: HHMM,
  dailyTime: HHMM,
  weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
  weeklyTime: HHMM,
  monthlyDay: z.number().int().min(1).max(28).nullable().optional(),
  monthlyTime: HHMM,
})

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
 * Load the row for an already-validated CUID and check ownership.
 * This helper never sees the route context — only a plain string id.
 */
async function loadOwnedRow(clerkId: string, validatedId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  const row = await prisma.checkinSchedule.findUnique({ where: { id: validatedId } })
  if (!row) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (row.userId !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id, row }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idOrError = await extractValidatedId(ctx)
  if (idOrError instanceof NextResponse) return idOrError
  const id: string = idOrError

  const owned = await loadOwnedRow(clerkId, id)
  if ('error' in owned) return owned.error

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const updated = await prisma.checkinSchedule.update({
    where: { id },
    data: parsed.data,
  })

  // Recompute nextFiresAt if anything that affects cadence changed, or
  // if the row was just unpaused. Cheap — single update with no fire.
  const shouldRecompute =
    parsed.data.active !== undefined ||
    parsed.data.intervalHours !== undefined ||
    parsed.data.windowStart !== undefined ||
    parsed.data.windowEnd !== undefined ||
    parsed.data.dailyTime !== undefined ||
    parsed.data.weeklyDay !== undefined ||
    parsed.data.weeklyTime !== undefined ||
    parsed.data.monthlyDay !== undefined ||
    parsed.data.monthlyTime !== undefined
  if (shouldRecompute) {
    await recomputeNextFiresAt(id)
  }

  const fresh = await prisma.checkinSchedule.findUnique({ where: { id } })
  return NextResponse.json({ schedule: fresh ?? updated })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idOrError = await extractValidatedId(ctx)
  if (idOrError instanceof NextResponse) return idOrError
  const id: string = idOrError

  const owned = await loadOwnedRow(clerkId, id)
  if ('error' in owned) return owned.error

  await prisma.checkinSchedule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
