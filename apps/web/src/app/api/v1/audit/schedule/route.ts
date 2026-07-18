import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { prisma } from '@repo/database'
import {
  formatTime12h,
  isValidTimezone,
  partsInTimezone,
  zonedToUtc,
} from '@/lib/interrupt-schedule'

/**
 * POST /api/v1/audit/schedule
 *
 * The first-hour interrupt funnel. An anonymous audit-taker has just
 * finished /audit and chosen their wedge × window × script. Instead of
 * routing them to /sign-up (deferred value, retention dies), we capture
 * a phone or email and schedule a one-shot SMS + email for the next
 * instance of their predicted danger window — TONIGHT if the window
 * hasn't passed yet, else TOMORROW.
 *
 * The /api/cron/scheduled-interrupts route fires every minute and
 * dispatches matured PENDING rows. Result: the visitor feels the
 * product within hours, not after a multi-day onboarding drip.
 *
 * Public route. No auth. Light rate-limit (per-IP) since each row
 * causes downstream SMS spend.
 *
 * Returns a warm, human "Tonight at 9:30 PM" string in the user's own
 * timezone — this is what the confirmation card displays.
 */

const schema = z
  .object({
    phoneNumber: z
      .string()
      .max(20)
      .regex(/^\+?1?\s*\(?[2-9]\d{2}\)?\s*-?\s*\d{3}\s*-?\s*\d{4}$/, 'Invalid US phone format')
      .optional(),
    email: z.string().email().max(254).optional(),
    archetypeFamily: z.string().min(1).max(64),
    wedge: z.string().min(1).max(32),
    window: z.enum(['morning', 'afternoon', 'afterwork', 'latenight']),
    script: z.string().min(1).max(32),
    timezone: z.string().min(1).max(64),
  })
  .refine(
    (data) => Boolean(data.phoneNumber || data.email),
    { message: 'Provide phoneNumber or email' },
  )

const RATE_LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000
const requests = new Map<string, number[]>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const recent = (requests.get(ip) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT) return false
  recent.push(now)
  requests.set(ip, recent)
  return true
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

const WINDOW_HOURS: Record<'morning' | 'afternoon' | 'afterwork' | 'latenight', { hour: number; minute: number }> = {
  morning: { hour: 9, minute: 30 },
  afternoon: { hour: 14, minute: 30 },
  afterwork: { hour: 17, minute: 30 },
  latenight: { hour: 21, minute: 30 },
}

// partsInTimezone / zonedToUtc / formatTime12h / isValidTimezone were
// extracted to @/lib/interrupt-schedule so the onboarding first-catch
// scheduler computes send times with the exact same math as this route.

/**
 * Compute the next instance of the user's danger window:
 *   - today at H:MM if "now" in their tz is still BEFORE that time
 *   - else tomorrow at H:MM
 *
 * Returns the UTC Date and a warm display string (e.g. "Tonight at 9:30 PM").
 */
function computeNextWindow(
  windowId: 'morning' | 'afternoon' | 'afterwork' | 'latenight',
  timezone: string,
  now: Date,
): { scheduledFor: Date; scheduledForLocal: string } {
  const target = WINDOW_HOURS[windowId]
  const local = partsInTimezone(now, timezone)
  const isToday =
    local.hour < target.hour ||
    (local.hour === target.hour && local.minute < target.minute)

  let y = local.year
  let m = local.month
  let d = local.day
  if (!isToday) {
    // Add one calendar day in the local tz. Use UTC arithmetic on a
    // noon-anchored Date for that local date to avoid DST edge-case
    // day-rollover bugs.
    const noonUtc = zonedToUtc(local.year, local.month, local.day, 12, 0, timezone)
    const tomorrowNoon = new Date(noonUtc.getTime() + 24 * 60 * 60 * 1000)
    const tomorrow = partsInTimezone(tomorrowNoon, timezone)
    y = tomorrow.year
    m = tomorrow.month
    d = tomorrow.day
  }

  const scheduledFor = zonedToUtc(y, m, d, target.hour, target.minute, timezone)

  // Build the warm local string. We always say "Tonight" for latenight
  // if it's still today, "Today" for earlier windows that haven't
  // passed, otherwise "Tomorrow."
  const todayLabel =
    windowId === 'latenight' ? 'Tonight' : windowId === 'afterwork' ? 'Tonight' : 'Today'
  const dayLabel = isToday ? todayLabel : 'Tomorrow'
  const timeLabel = formatTime12h(target.hour, target.minute)

  return { scheduledFor, scheduledForLocal: `${dayLabel} at ${timeLabel}` }
}

export async function POST(req: Request) {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ??
    (await headers()).get('x-real-ip') ??
    'anonymous'

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data
  const timezone = isValidTimezone(data.timezone) ? data.timezone : 'America/New_York'
  const phone = data.phoneNumber ? normalizePhone(data.phoneNumber) : null
  if (data.phoneNumber && !phone) {
    return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
  }

  const { scheduledFor, scheduledForLocal } = computeNextWindow(
    data.window,
    timezone,
    new Date(),
  )

  const row = await prisma.scheduledInterrupt.create({
    data: {
      phoneNumber: phone ?? null,
      // Lowercase so the row joins to a signed-up account: both the
      // dispatcher's user lookup and /today's pendingCatch query match
      // on exact (case-sensitive) email equality.
      email: data.email?.toLowerCase() ?? null,
      archetypeFamily: data.archetypeFamily,
      wedge: data.wedge,
      window: data.window,
      script: data.script,
      scheduledFor,
      timezone,
    },
    select: { id: true },
  })

  return NextResponse.json({
    id: row.id,
    scheduledForIso: scheduledFor.toISOString(),
    scheduledForLocal,
  })
}
