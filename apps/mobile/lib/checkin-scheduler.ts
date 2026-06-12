import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { COYL_CHECKIN_CATEGORY } from './notifications'

/**
 * Edge layer 2 — on-device scheduled danger-window check-ins.
 *
 * `syncLocalCheckins(api)` pulls the user's active danger windows from the web
 * API and (re)schedules a WEEKLY repeating local notification at the start of
 * each window×day. These fire ON-DEVICE — no server, no network at fire time —
 * so the check-in lands even when the phone is offline, which is the whole
 * point: the danger window is often exactly when connectivity is bad or the
 * user is somewhere they're trying not to autopilot.
 *
 * Each notification:
 *   - tags content.data.coylCheckin = true (so we can find + cancel our own
 *     scheduled notifications without touching server-push ones) and
 *     content.data.windowId (so the response POST can attribute the window)
 *   - uses categoryIdentifier 'coyl-checkin' → the "Caught me / I'm good"
 *     lock-screen action buttons (registered by ensureCheckinCategory())
 *   - on Android, channelId 'interrupts' (MAX importance) so it breaks through
 *
 * Copy is NEDA-safe: pattern-framed, no weight/diet/food-restriction language.
 */

/** Minimal shape syncLocalCheckins needs from the mobile API client. */
export type CheckinSchedulerApi = {
  getDangerWindows: () => Promise<{ windows: DangerWindowDto[] }>
}

export type DangerWindowDto = {
  id: string
  label?: string | null
  daysOfWeek: number[] // 0 (Sun)..6 (Sat)
  startHour: number // 0..23
  startMinute: number // 0..59
  timezone: string // IANA tz the wall-clock hour is stored in
}

// iOS caps PENDING local notifications at 64; anything past that is silently
// dropped by the OS. We cap ourselves well under that to leave headroom for
// any other local notifications the app schedules. If windows×days exceed the
// cap we schedule nearest-first (see ordering below) and log the overflow.
const MAX_SCHEDULED_CHECKINS = 21

/**
 * Expo's calendar trigger uses weekday 1..7 with Sunday = 1. Our API encodes
 * day-of-week as 0..6 with Sunday = 0 (matching DangerWindow.dayOfWeek). Convert.
 */
function toExpoWeekday(apiDayOfWeek: number): number {
  return apiDayOfWeek + 1
}

/**
 * Formats a 24h hour/minute into a friendly 12h clock string for the body copy,
 * e.g. (21, 0) → "9:00 PM".
 */
function formatClock(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  const mm = minute.toString().padStart(2, '0')
  return `${h12}:${mm} ${period}`
}

type PlannedCheckin = {
  windowId: string
  label: string | null
  expoWeekday: number
  hour: number
  minute: number
}

/**
 * Cancels every previously-scheduled COYL check-in local notification.
 * We identify our own by content.data.coylCheckin === true so we never touch
 * notifications scheduled by anything else.
 */
async function cancelExistingCheckins(): Promise<void> {
  let scheduled: Notifications.NotificationRequest[] = []
  try {
    scheduled = await Notifications.getAllScheduledNotificationsAsync()
  } catch {
    scheduled = []
  }
  await Promise.all(
    scheduled
      .filter((req) => {
        const data = (req.content.data ?? {}) as Record<string, unknown>
        return data.coylCheckin === true
      })
      .map((req) =>
        Notifications.cancelScheduledNotificationAsync(req.identifier).catch(
          () => null,
        ),
      ),
  )
}

/**
 * Fetches active danger windows and reschedules the on-device weekly check-ins.
 * Idempotent — always cancels our prior schedule first, so repeated calls
 * converge on the current server state without duplicating notifications.
 *
 * No-op on web. Throttle to once per cold start at the call site
 * (app/(app)/_layout.tsx).
 */
export async function syncLocalCheckins(
  api: CheckinSchedulerApi,
): Promise<void> {
  if (Platform.OS === 'web') return

  let windows: DangerWindowDto[] = []
  try {
    const res = await api.getDangerWindows()
    windows = res.windows ?? []
  } catch (err) {
    // Offline or auth blip — keep whatever's already scheduled on-device rather
    // than wiping it. The previously-scheduled notifications keep firing.
    console.warn('[COYL] syncLocalCheckins: fetch failed, keeping prior schedule:', err)
    return
  }

  // Always clear our prior schedule before laying down the new one.
  await cancelExistingCheckins()

  // Flatten windows × days into individual planned notifications.
  //
  // TIMEZONE SIMPLIFICATION: calendar triggers fire in DEVICE-local time, but
  // the API returns the window's stored wall-clock hour in the window's own
  // timezone. We do NOT convert across zones — we schedule at the stored
  // wall-clock hour as-is in device-local time. When the device timezone equals
  // the stored timezone (the overwhelmingly common case) this is exactly
  // correct. When they differ (user travelling), the check-in fires at the same
  // clock number in the new zone rather than the original zone's instant — an
  // intentional simplification: the on-device scheduler has no robust per-zone
  // weekly-trigger primitive, and "9 PM wherever you are" is a reasonable
  // behavior for a habit check-in. Re-syncing after a timezone change on the
  // server would re-pull corrected windows.
  const planned: PlannedCheckin[] = []
  for (const w of windows) {
    for (const day of w.daysOfWeek) {
      if (day < 0 || day > 6) continue
      planned.push({
        windowId: w.id,
        label: w.label ?? null,
        expoWeekday: toExpoWeekday(day),
        hour: w.startHour,
        minute: w.startMinute,
      })
    }
  }

  // Order nearest-first relative to "now" in device-local time so that if we hit
  // the cap, the soonest-firing check-ins are the ones that survive.
  const now = new Date()
  const nowWeekday = now.getDay() // 0..6, Sun=0
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const minutesUntil = (p: PlannedCheckin): number => {
    // expoWeekday is 1..7 (Sun=1); convert back to 0..6 for the delta math.
    const planDay = p.expoWeekday - 1
    const planMinutes = p.hour * 60 + p.minute
    let dayDelta = planDay - nowWeekday
    if (dayDelta < 0) dayDelta += 7
    let total = dayDelta * 24 * 60 + (planMinutes - nowMinutes)
    if (total < 0) total += 7 * 24 * 60 // already passed today → next week
    return total
  }
  planned.sort((a, b) => minutesUntil(a) - minutesUntil(b))

  if (planned.length > MAX_SCHEDULED_CHECKINS) {
    console.warn(
      `[COYL] syncLocalCheckins: ${planned.length} check-ins exceed cap of ` +
        `${MAX_SCHEDULED_CHECKINS}; scheduling nearest-first, dropping ` +
        `${planned.length - MAX_SCHEDULED_CHECKINS}.`,
    )
  }
  const toSchedule = planned.slice(0, MAX_SCHEDULED_CHECKINS)

  for (const p of toSchedule) {
    const clock = formatClock(p.hour, p.minute)
    const windowName = p.label ?? 'danger'
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your window is open.',
          body: `${clock} — the ${windowName} window. Still you, or autopilot?`,
          categoryIdentifier: COYL_CHECKIN_CATEGORY,
          data: {
            coylCheckin: true,
            windowId: p.windowId,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: p.expoWeekday,
          hour: p.hour,
          minute: p.minute,
          ...(Platform.OS === 'android' ? { channelId: 'interrupts' } : {}),
        },
      })
    } catch (err) {
      console.warn('[COYL] syncLocalCheckins: failed to schedule a check-in:', err)
    }
  }
}
