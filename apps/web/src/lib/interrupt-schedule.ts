import { prisma } from '@repo/database'
import { resolveFamily, type ScriptId, type WedgeId, type WindowId } from '@/lib/audit-archetype'

/**
 * Interrupt scheduling — shared timezone math + the first-catch
 * scheduler for signed-up users.
 *
 * The timezone helpers (partsInTimezone / zonedToUtc / formatTime12h)
 * were extracted from app/api/v1/audit/schedule/route.ts so the
 * anonymous /audit funnel and the onboarding first-catch path compute
 * send times with the exact same math. Both write ScheduledInterrupt
 * rows that the every-minute /api/cron/scheduled-interrupts dispatcher
 * fires — one pipeline, two entry points.
 *
 * scheduleFirstInterrupt() closes the day-one activation gap: the
 * 15-minute danger-window-interrupt cron only fires when the user's
 * local clock is INSIDE a seeded window, so the first felt interrupt
 * used to land 2–9h after onboarding (sometimes days, for weekend-only
 * windows). Now completeOnboarding schedules a one-shot for the next
 * instance of the user's soonest seeded window — or a ~1h "first
 * catch" when nothing lands within 20h — so every invited user feels
 * the product on day one.
 */

/**
 * Read the "now" calendar fields (Y/M/D/H/M) as they appear in the
 * user's timezone. We use Intl.DateTimeFormat — the same approach the
 * danger-window-interrupt cron uses for matching local hours.
 */
export function partsInTimezone(d: Date, timezone: string): {
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
export function zonedToUtc(
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

export function formatTime12h(hour: number, minute: number): string {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const meridiem = hour < 12 ? 'AM' : 'PM'
  const mm = String(minute).padStart(2, '0')
  return `${h12}:${mm} ${meridiem}`
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

/** 0=Sun..6=Sat for the given instant, as it reads in the timezone. */
function weekdayInTimezone(d: Date, timezone: string): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(d)
  return DAY_MAP[wd] ?? 0
}

/** The shape completeOnboarding seeds from WINDOW_TEMPLATES. dayOfWeek -1 = every day. */
export type SeededWindow = {
  label: string
  dayOfWeek: number
  startHour: number
  endHour: number
}

/**
 * Next upcoming instance across the user's seeded danger windows.
 *
 * The send time is startHour:30 local — 30 minutes INSIDE the window,
 * matching the audit funnel's WINDOW_HOURS (9:30 / 14:30 / 17:30 /
 * 21:30), which are all half-past times inside their canonical windows.
 * The interrupt should land while the autopilot is running, not as a
 * forecast before it starts.
 *
 * Scans 8 day-offsets (today..next week) so weekly windows (dayOfWeek
 * 0–6) always produce a candidate. Day arithmetic anchors on local
 * noon to dodge DST day-rollover bugs — same trick the audit route uses.
 */
export function computeNextWindowInstance(
  windows: SeededWindow[],
  timezone: string,
  now: Date = new Date(),
): { scheduledFor: Date; window: SeededWindow } | null {
  if (windows.length === 0) return null

  const local = partsInTimezone(now, timezone)
  const todayNoonUtc = zonedToUtc(local.year, local.month, local.day, 12, 0, timezone)

  let best: { scheduledFor: Date; window: SeededWindow } | null = null
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const anchor = new Date(todayNoonUtc.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const date = partsInTimezone(anchor, timezone)
    const weekday = weekdayInTimezone(anchor, timezone)
    for (const w of windows) {
      if (w.dayOfWeek !== -1 && w.dayOfWeek !== weekday) continue
      const candidate = zonedToUtc(date.year, date.month, date.day, w.startHour, 30, timezone)
      if (candidate.getTime() <= now.getTime()) continue
      if (!best || candidate.getTime() < best.scheduledFor.getTime()) {
        best = { scheduledFor: candidate, window: w }
      }
    }
    // Windows with dayOfWeek -1 fire daily, so once we have a hit there
    // is nothing sooner on later offsets.
    if (best) break
  }
  return best
}

/**
 * Warm display label for a scheduled catch, in the user's timezone:
 * "Tonight at 9:30 PM" / "Today at 2:30 PM" / "Tomorrow at 9:30 PM" /
 * "Friday at 5:30 PM". Same voice the audit funnel's confirmation card
 * uses.
 */
export function formatCatchLabel(
  scheduledFor: Date,
  timezone: string,
  now: Date = new Date(),
): string {
  const localNow = partsInTimezone(now, timezone)
  const target = partsInTimezone(scheduledFor, timezone)
  const timeLabel = formatTime12h(target.hour, target.minute)

  const sameDay =
    target.year === localNow.year && target.month === localNow.month && target.day === localNow.day
  if (sameDay) {
    return `${target.hour >= 17 ? 'Tonight' : 'Today'} at ${timeLabel}`
  }

  const todayNoonUtc = zonedToUtc(localNow.year, localNow.month, localNow.day, 12, 0, timezone)
  const tomorrow = partsInTimezone(new Date(todayNoonUtc.getTime() + 24 * 60 * 60 * 1000), timezone)
  if (target.year === tomorrow.year && target.month === tomorrow.month && target.day === tomorrow.day) {
    return `Tomorrow at ${timeLabel}`
  }

  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  }).format(scheduledFor)
  return `${weekdayName} at ${timeLabel}`
}

/** Bucket a local hour into the audit funnel's WindowId vocabulary. */
export function windowBucketForHour(hour: number): WindowId {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'afterwork'
  return 'latenight'
}

// Onboarding vocab → audit-archetype vocab. The ScheduledInterrupt row
// stores the audit funnel's wedge/window/script strings because the
// dispatcher resolves message copy through the archetype family table.
const WEDGE_FROM_PRIMARY: Record<string, WedgeId> = {
  PRODUCTIVITY: 'work',
  WEIGHT_LOSS: 'weight',
  CRAVINGS: 'destructive',
  DESTRUCTIVE_BEHAVIORS: 'destructive',
  CONSISTENCY: 'consistency',
  SPENDING: 'spending',
  FOCUS: 'focus',
}

const SCRIPT_FROM_EXCUSE: Record<string, ScriptId> = {
  DELAY: 'delay',
  REWARD: 'reward',
  MINIMIZATION: 'minimize',
  COLLAPSE: 'collapse',
  EXHAUSTION: 'exhaustion',
  EXCEPTION: 'minimize',
  COMPENSATION: 'reward',
  SOCIAL_PRESSURE: 'social',
}

/** Soonest-window instances further out than this fall back to a ~1h first catch. */
const FIRST_CATCH_MAX_LEAD_HOURS = 20
const FIRST_CATCH_FALLBACK_MS = 60 * 60 * 1000

/**
 * Schedule the user's FIRST felt interrupt at onboarding completion.
 *
 * Time selection:
 *   1. Next instance of the soonest seeded danger window (startHour:30
 *      local, honoring dayOfWeek) — if it lands within 20 hours.
 *   2. Otherwise a "first catch" ~1 hour from now, so a user whose
 *      windows are days away (weekend-only picks) or who onboarded
 *      just past tonight's window still feels one interrupt on day one.
 *
 * Channel: the row carries the user's account email. The dispatcher
 * resolves the account at send time and prefers web push when the user
 * has subscribed by then (the /today enable banner), falling back to
 * email — see /api/cron/scheduled-interrupts.
 *
 * Guard: no-op if a PENDING row already exists for this email (repeat
 * onboarding submits, audit-funnel signups that already scheduled one).
 *
 * Never throws on the scheduling queries' behalf beyond what the
 * caller wraps — onboarding completion must not fail because of this.
 */
export async function scheduleFirstInterrupt(args: {
  email: string
  timezone: string
  windows: SeededWindow[]
  primaryWedge?: string | null
  failurePattern?: string | null
  now?: Date
}): Promise<{ scheduledFor: Date; scheduledForLocal: string } | null> {
  const now = args.now ?? new Date()
  const timezone = isValidTimezone(args.timezone) ? args.timezone : 'America/New_York'

  const existing = await prisma.scheduledInterrupt.findFirst({
    where: { email: args.email, status: 'PENDING' },
    select: { id: true },
  })
  if (existing) return null

  const next = computeNextWindowInstance(args.windows, timezone, now)
  const withinLead =
    next !== null &&
    next.scheduledFor.getTime() - now.getTime() <= FIRST_CATCH_MAX_LEAD_HOURS * 60 * 60 * 1000

  const scheduledFor = withinLead
    ? next.scheduledFor
    : new Date(now.getTime() + FIRST_CATCH_FALLBACK_MS)

  const localHour = withinLead
    ? next.window.startHour
    : partsInTimezone(scheduledFor, timezone).hour
  const windowBucket = windowBucketForHour(localHour)
  const wedge: WedgeId = WEDGE_FROM_PRIMARY[args.primaryWedge ?? ''] ?? 'consistency'
  const script: ScriptId = SCRIPT_FROM_EXCUSE[args.failurePattern ?? ''] ?? 'minimize'
  const archetypeFamily = resolveFamily(wedge, windowBucket, script)

  await prisma.scheduledInterrupt.create({
    data: {
      email: args.email,
      archetypeFamily,
      wedge,
      window: windowBucket,
      script,
      scheduledFor,
      timezone,
    },
    select: { id: true },
  })

  return { scheduledFor, scheduledForLocal: formatCatchLabel(scheduledFor, timezone, now) }
}
