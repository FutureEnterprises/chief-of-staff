import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { computeNextFire } from '@/lib/services/checkin-schedule.service'

/**
 * /api/v1/checkin-schedules
 *
 * Authenticated CRUD for user-defined recurring check-ins. The cron at
 * /api/cron/custom-checkins reads what we write here.
 *
 * GET  → list the signed-in user's schedules (newest first).
 * POST → create one. Server computes nextFiresAt before insert so the
 *        cron picks it up on the very next tick.
 *
 * Per-cadence shape is enforced by a discriminated union schema so the
 * client can't ship, e.g., a HOURLY row with a dailyTime field.
 */

const HHMM = z.string().regex(/^\d{1,2}:\d{2}$/, 'Use HH:MM')

const hourlyBody = z.object({
  cadence: z.literal('HOURLY'),
  intervalHours: z.number().int().min(1).max(12),
  windowStart: HHMM,
  windowEnd: HHMM,
})
const dailyBody = z.object({
  cadence: z.literal('DAILY'),
  dailyTime: HHMM,
})
const weeklyBody = z.object({
  cadence: z.literal('WEEKLY'),
  weeklyDay: z.number().int().min(0).max(6),
  weeklyTime: HHMM,
})
const monthlyBody = z.object({
  cadence: z.literal('MONTHLY'),
  monthlyDay: z.number().int().min(1).max(28),
  monthlyTime: HHMM,
})

const createSchema = z
  .object({
    label: z.string().min(1).max(80),
    channel: z.enum(['EMAIL', 'SMS']).default('EMAIL'),
    message: z.string().max(280).optional(),
  })
  .and(z.discriminatedUnion('cadence', [hourlyBody, dailyBody, weeklyBody, monthlyBody]))

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const rows = await prisma.checkinSchedule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ schedules: rows })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, timezone: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const body = parsed.data

  const data = {
    userId: user.id,
    label: body.label,
    channel: body.channel,
    message: body.message ?? null,
    cadence: body.cadence,
    intervalHours: body.cadence === 'HOURLY' ? body.intervalHours : null,
    windowStart: body.cadence === 'HOURLY' ? body.windowStart : null,
    windowEnd: body.cadence === 'HOURLY' ? body.windowEnd : null,
    dailyTime: body.cadence === 'DAILY' ? body.dailyTime : null,
    weeklyDay: body.cadence === 'WEEKLY' ? body.weeklyDay : null,
    weeklyTime: body.cadence === 'WEEKLY' ? body.weeklyTime : null,
    monthlyDay: body.cadence === 'MONTHLY' ? body.monthlyDay : null,
    monthlyTime: body.cadence === 'MONTHLY' ? body.monthlyTime : null,
    active: true,
  }

  const tz = user.timezone || 'America/New_York'
  const nextFiresAt = computeNextFire(
    { ...data, active: true },
    new Date(),
    tz,
  )

  const row = await prisma.checkinSchedule.create({
    data: { ...data, nextFiresAt },
  })
  return NextResponse.json({ schedule: row }, { status: 201 })
}
