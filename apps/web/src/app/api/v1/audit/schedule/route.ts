import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { prisma } from '@repo/database'

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

/**
 * Read the "now" calendar fields (Y/M/D/H/M) as they appear in the
 * user's timezone. We use Intl.DateTimeFormat — the same approach the
 * danger-window-interrupt cron uses for matching local hours.
 */
function partsInTimezone(d: Date, timezone: string): {
  year: number; month: number; day: number; hour: number; minute: number
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
  // "24" hour cycle in en-US returns "24" at midnight in some ICU builds; normalize.
  let hour = get('hour')
  if (hour === 24) hour = 0
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
  }
}

/**
 * Compute the UTC instant that corresponds to the given wall-clock
 * (year, month, day, hour, minute) in the named timezone.
 *
 * Approach: pretend the wall-clock IS UTC (Date.UTC), then measure the
 * offset between that and how it actually renders in the timezone, and
 * subtract. Repeat once to handle DST cusps. Pure stdlib — no deps.
 */
function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  const rendered = partsInTimezone(guess, timezone)
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  const renderedAsUtc = Date.UTC(
    rendered.year,
    rendered.month - 1,
    rendered.day,
    rendered.hour,
    rendered.minute,
    0,
    0,
  )
  const offsetMs = renderedAsUtc - wallAsUtc
  let adjusted = new Date(guess.getTime() - offsetMs)
  // One more refinement pass for DST transitions.
  const rendered2 = partsInTimezone(adjusted, timezone)
  if (rendered2.hour !== hour || rendered2.minute !== minute) {
    const r2Utc = Date.UTC(
      rendered2.year,
      rendered2.month - 1,
      rendered2.day,
      rendered2.hour,
      rendered2.minute,
      0,
      0,
    )
    adjusted = new Date(adjusted.getTime() - (r2Utc - wallAsUtc))
  }
  return adjusted
}

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

function formatTime12h(hour: number, minute: number): string {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const meridiem = hour < 12 ? 'AM' : 'PM'
  const mm = String(minute).padStart(2, '0')
  return `${h12}:${mm} ${meridiem}`
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
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
      email: data.email ?? null,
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
