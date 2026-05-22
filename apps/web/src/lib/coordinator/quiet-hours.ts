import { prisma } from '@repo/database'

/**
 * Quiet hours gate — denies any LLM-driven proposal/action whose
 * scheduled local-time fires inside the user's configured quiet
 * window. The user's IANA timezone (User.timezone) governs the
 * conversion; "local hour" is computed via Intl.DateTimeFormat, same
 * trick the existing danger-window-interrupt cron uses so behavior
 * stays consistent across the platform.
 *
 * Schema reality: the coyl User model has no dedicated `quietHours`
 * column. Quiet-hour preferences already live inside the
 * `notificationPrefs` JSON blob — adding a new column for this
 * surface would force a migration the schema agent didn't ship. So
 * this reader supports TWO shapes:
 *
 *   1. PREFERRED: notificationPrefs.quietHours = [
 *        { dayOfWeek: -1 | 0..6, startHour: 0..23, endHour: 0..23 }
 *      ]
 *      dayOfWeek -1 = every day; 0=Sunday, 6=Saturday.
 *
 *   2. LEGACY:    notificationPrefs.quietHoursStart / .quietHoursEnd
 *      (the existing single-window-applies-every-day shape from
 *      lib/notification-prefs.ts).
 *
 * If neither is present, the user has no quiet hours → return false.
 *
 * Windows may wrap midnight (startHour=22, endHour=7 → 10pm–7am).
 */

export type QuietHourWindow = {
  /** -1 = every day; 0=Sunday, 6=Saturday. */
  dayOfWeek: number
  /** Inclusive start hour (0–23) in the user's local timezone. */
  startHour: number
  /** Exclusive end hour (0–23). May be < startHour to wrap midnight. */
  endHour: number
}

type NotificationPrefsShape = {
  quietHours?: QuietHourWindow[]
  quietHoursStart?: number | null
  quietHoursEnd?: number | null
}

export async function isInQuietHours(
  userId: string,
  asOf: Date = new Date(),
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, notificationPrefs: true },
  })
  if (!user) return false

  const prefs = parsePrefs(user.notificationPrefs)
  const tz = user.timezone ?? 'UTC'

  // Compute local hour + weekday in the user's timezone.
  const { hour, weekday } = localTimeParts(tz, asOf)

  // 1. Preferred shape: array of windows.
  if (Array.isArray(prefs.quietHours) && prefs.quietHours.length > 0) {
    return prefs.quietHours.some((w) => windowMatches(w, hour, weekday))
  }

  // 2. Legacy shape: single every-day window via quietHoursStart/End.
  const qs = prefs.quietHoursStart
  const qe = prefs.quietHoursEnd
  if (qs == null || qe == null) return false
  if (qs === qe) return false // degenerate — treat as no quiet hours

  return windowMatches({ dayOfWeek: -1, startHour: qs, endHour: qe }, hour, weekday)
}

// ─────────────────────── Helpers ───────────────────────

function parsePrefs(raw: unknown): NotificationPrefsShape {
  if (!raw || typeof raw !== 'object') return {}
  return raw as NotificationPrefsShape
}

function windowMatches(w: QuietHourWindow, hour: number, weekday: number): boolean {
  if (w.dayOfWeek !== -1 && w.dayOfWeek !== weekday) return false
  if (w.startHour === w.endHour) return false

  // Window wraps past midnight (e.g. 22 → 7 = 10pm-7am)
  if (w.endHour < w.startHour) {
    return hour >= w.startHour || hour < w.endHour
  }
  return hour >= w.startHour && hour < w.endHour
}

function localTimeParts(
  tz: string,
  now: Date,
): { hour: number; weekday: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
      weekday: 'short',
    }).formatToParts(now)

    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'

    return {
      hour: parseInt(hourStr, 10),
      weekday: WEEKDAY_INDEX[weekdayStr] ?? 0,
    }
  } catch {
    // Invalid timezone string — fall back to UTC rather than fire at
    // an unintended local hour. Better to under-suppress than over.
    return { hour: now.getUTCHours(), weekday: now.getUTCDay() }
  }
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}
