/**
 * Custom check-in schedules — service layer.
 *
 * Two surfaces:
 *
 *   1. computeNextFire(schedule, fromInstant, tz)
 *      Given a CheckinSchedule shape + a "from" instant + the user's
 *      IANA timezone, returns the next UTC Date the schedule should
 *      fire — or null if the schedule is paused/invalid.
 *
 *   2. materializePending(now)
 *      Runs every minute from /api/cron/custom-checkins. Picks every
 *      active schedule whose nextFiresAt has matured, fires it via the
 *      row's channel (EMAIL / SMS), then advances nextFiresAt via
 *      computeNextFire. Returns { processed, sent, failed } counts.
 *
 * Timezone handling: no date-fns-tz dependency — we use the
 * Intl.DateTimeFormat / naive-UTC-offset trick that the existing
 * lib/coordinator/quiet-hours.ts module also uses, so the platform
 * stays consistent on time math.
 *
 * The compute logic is intentionally deterministic + side-effect free
 * so a unit test can call it with a frozen "now" and verify boundary
 * behavior (DST shifts, end-of-month day numbers > month length, etc.).
 */

import { prisma } from '@repo/database'
import type { CheckinSchedule, User } from '@repo/database'
import { isUserCoachingPathClosed } from '@/lib/rap/store'

// ───────────────────────────────────────────────────────────────────
// Timezone helpers — copies of the zero-dep pattern used elsewhere
// in the platform (see lib/coordinator/quiet-hours.ts).
// ───────────────────────────────────────────────────────────────────

type LocalClock = {
  year: number
  month: number // 1-12
  day: number // 1-31
  hour: number // 0-23
  minute: number // 0-59
  weekday: number // 0=Sun..6=Sat
}

/** Read the wall-clock components of an Instant in a specific IANA tz. */
function localClockInTz(at: Date, tz: string): LocalClock {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  })
  const parts = fmt.formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    // Intl emits "24" for midnight in en-US for some engines; normalize.
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

/**
 * Convert a local (Y/M/D/H/M) clock in `tz` to the UTC Instant that,
 * when formatted in that tz, would show those exact components. This
 * is the inverse of localClockInTz. Handles DST by measuring the
 * offset at the candidate instant.
 */
function fromZonedClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string,
): Date {
  // First pass: pretend the local clock IS UTC and see how that instant
  // looks in the target tz. The difference is the offset we need to
  // subtract to get the real UTC instant.
  const naive = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const seen = localClockInTz(naive, tz)
  const seenUtcMs = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute)
  const offsetMs = seenUtcMs - naive.getTime()
  return new Date(naive.getTime() - offsetMs)
}

/** Parse "HH:MM" → [hour, minute]; returns null on bad input. */
function parseHHMM(s: string | null | undefined): [number, number] | null {
  if (!s) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return [h, min]
}

// ───────────────────────────────────────────────────────────────────
// computeNextFire — the public entry the API + cron both use.
// ───────────────────────────────────────────────────────────────────

type ScheduleInput = Pick<
  CheckinSchedule,
  | 'cadence'
  | 'intervalHours'
  | 'windowStart'
  | 'windowEnd'
  | 'dailyTime'
  | 'weeklyDay'
  | 'weeklyTime'
  | 'monthlyDay'
  | 'monthlyTime'
  | 'active'
>

export function computeNextFire(
  s: ScheduleInput,
  fromInstant: Date,
  tz: string,
): Date | null {
  if (!s.active) return null

  switch (s.cadence) {
    case 'HOURLY':
      return computeHourly(s, fromInstant, tz)
    case 'DAILY':
      return computeDaily(s, fromInstant, tz)
    case 'WEEKLY':
      return computeWeekly(s, fromInstant, tz)
    case 'MONTHLY':
      return computeMonthly(s, fromInstant, tz)
    default:
      return null
  }
}

function computeHourly(s: ScheduleInput, from: Date, tz: string): Date | null {
  const interval = s.intervalHours ?? 0
  if (interval < 1 || interval > 24) return null
  const ws = parseHHMM(s.windowStart) ?? [0, 0]
  const we = parseHHMM(s.windowEnd) ?? [23, 59]
  const startMin = ws[0] * 60 + ws[1]
  const endMin = we[0] * 60 + we[1]
  if (endMin <= startMin) return null // window must span forward within a day

  // Start from `from + 1 minute` so we never re-fire on the same minute
  // we just dispatched.
  const cursor = new Date(from.getTime() + 60_000)
  // Walk at most 8 days forward to cover DST transitions + weird gaps.
  // For HOURLY this should resolve in <= 1 iteration in steady state.
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const probe = new Date(cursor.getTime() + dayOffset * 86_400_000)
    const clock = localClockInTz(probe, tz)
    // Candidate fire times today: windowStart, +interval, +interval, ...
    // up to (but not past) windowEnd.
    for (let hourOffset = 0; ; hourOffset += interval) {
      const minuteOfDay = startMin + hourOffset * 60
      if (minuteOfDay > endMin) break
      const h = Math.floor(minuteOfDay / 60)
      const m = minuteOfDay % 60
      const candidate = fromZonedClock(clock.year, clock.month, clock.day, h, m, tz)
      if (candidate.getTime() >= cursor.getTime()) return candidate
    }
  }
  return null
}

function computeDaily(s: ScheduleInput, from: Date, tz: string): Date | null {
  const t = parseHHMM(s.dailyTime)
  if (!t) return null
  const [hour, minute] = t
  const cursor = new Date(from.getTime() + 60_000)
  // Try today, then up to +8 days for DST/edge safety.
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const probe = new Date(cursor.getTime() + dayOffset * 86_400_000)
    const clock = localClockInTz(probe, tz)
    const candidate = fromZonedClock(clock.year, clock.month, clock.day, hour, minute, tz)
    if (candidate.getTime() >= cursor.getTime()) return candidate
  }
  return null
}

function computeWeekly(s: ScheduleInput, from: Date, tz: string): Date | null {
  const t = parseHHMM(s.weeklyTime)
  const dow = s.weeklyDay
  if (!t || dow == null || dow < 0 || dow > 6) return null
  const [hour, minute] = t
  const cursor = new Date(from.getTime() + 60_000)
  // Walk forward up to 8 days; one of them will match the target dow.
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const probe = new Date(cursor.getTime() + dayOffset * 86_400_000)
    const clock = localClockInTz(probe, tz)
    if (clock.weekday !== dow) continue
    const candidate = fromZonedClock(clock.year, clock.month, clock.day, hour, minute, tz)
    if (candidate.getTime() >= cursor.getTime()) return candidate
  }
  return null
}

function computeMonthly(s: ScheduleInput, from: Date, tz: string): Date | null {
  const t = parseHHMM(s.monthlyTime)
  const dom = s.monthlyDay
  if (!t || dom == null || dom < 1 || dom > 28) return null
  const [hour, minute] = t
  const cursor = new Date(from.getTime() + 60_000)
  const start = localClockInTz(cursor, tz)
  // Try this month first, then next two months (defensive — covers any
  // weird wrap or DST edges around the candidate instant).
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const targetMonth = start.month + monthOffset
    const yr = start.year + Math.floor((targetMonth - 1) / 12)
    const mo = ((targetMonth - 1) % 12) + 1
    const candidate = fromZonedClock(yr, mo, dom, hour, minute, tz)
    if (candidate.getTime() >= cursor.getTime()) return candidate
  }
  return null
}

// ───────────────────────────────────────────────────────────────────
// materializePending — the dispatcher the cron calls.
// ───────────────────────────────────────────────────────────────────

export type MaterializeOutcome = {
  processed: number
  sent: number
  failed: number
  /** Users skipped because RAP closed their coaching path (crisis/emergency). */
  rapSuppressed: number
  errors: Array<{ id: string; error: string }>
}

export async function materializePending(now: Date): Promise<MaterializeOutcome> {
  const lookahead = new Date(now.getTime() + 60_000)

  const due = await prisma.checkinSchedule.findMany({
    where: { active: true, nextFiresAt: { lte: lookahead, not: null } },
    include: { user: { select: { id: true, email: true, name: true, timezone: true } } },
    take: 200,
    orderBy: { nextFiresAt: 'asc' },
  })

  const outcome: MaterializeOutcome = { processed: 0, sent: 0, failed: 0, rapSuppressed: 0, errors: [] }
  if (due.length === 0) return outcome

  // Lazy-load delivery deps so /api/cron/custom-checkins boots fast even
  // when no rows are due.
  const { Resend } = await import('resend')
  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey ? new Resend(resendKey) : null

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const twilioReady = Boolean(accountSid && authToken && (fromNumber || messagingServiceSid))

  // SMS requires a phone. The User model has no phoneNumber column;
  // SmsSignup stores it keyed by convertedUserId once an anonymous SMS
  // capture is linked to a signed-in user (the upgrade path lives in
  // /api/v1/sms/intro + the auth conversion flow).
  const userIds = Array.from(new Set(due.map((r) => r.userId)))
  const smsRows = await prisma.smsSignup.findMany({
    where: { convertedUserId: { in: userIds } },
    select: { convertedUserId: true, phoneNumber: true },
  })
  const phoneByUser = new Map<string, string>()
  for (const r of smsRows) {
    if (r.convertedUserId && r.phoneNumber) phoneByUser.set(r.convertedUserId, r.phoneNumber)
  }

  for (const row of due) {
    outcome.processed++
    // Safety floor: if RAP closed this user's coaching path (crisis/
    // emergency), do not fire — a user in crisis must not be nudged
    // about behavior. Same gate the UAP coordinator + interrupt crons use.
    if (await isUserCoachingPathClosed(row.userId)) {
      outcome.rapSuppressed++
      continue
    }
    const tz = row.user.timezone || 'America/New_York'
    const body = row.message?.trim() || defaultMessageFor(row.cadence)

    try {
      if (row.channel === 'EMAIL') {
        if (!resend) throw new Error('resend_not_configured')
        await resend.emails.send({
          from: 'COYL <hello@coyl.ai>',
          to: row.user.email,
          subject: row.label.slice(0, 100),
          text: body,
        })
      } else if (row.channel === 'SMS') {
        const phone = phoneByUser.get(row.userId)
        if (!phone) throw new Error('no_phone_on_file')
        if (!twilioReady) throw new Error('twilio_not_configured')
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        const params = new URLSearchParams()
        params.set('To', phone)
        params.set('Body', `${row.label}: ${body}`.slice(0, 320))
        if (messagingServiceSid) params.set('MessagingServiceSid', messagingServiceSid)
        else if (fromNumber) params.set('From', fromNumber)
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        )
        if (!res.ok) throw new Error(`twilio_${res.status}`)
      }

      const next = computeNextFire(row, now, tz)
      await prisma.checkinSchedule.update({
        where: { id: row.id },
        data: { lastFiredAt: now, nextFiresAt: next },
      })
      outcome.sent++
    } catch (err) {
      outcome.failed++
      outcome.errors.push({
        id: row.id,
        error: err instanceof Error ? err.message : 'unknown',
      })
      // Don't advance nextFiresAt on failure — the next cron tick will
      // retry the same row. After 5 consecutive failures the caller may
      // want to flip active=false; that policy lives at the cron edge.
    }
  }

  return outcome
}

function defaultMessageFor(cadence: ScheduleInput['cadence']): string {
  switch (cadence) {
    case 'HOURLY':
      return "Quick check-in: how's the pattern holding right now?"
    case 'DAILY':
      return 'Daily check-in. One line: what was loud today?'
    case 'WEEKLY':
      return 'Weekly check-in. What pattern showed up this week?'
    case 'MONTHLY':
      return 'Monthly review. What changed? What loop is still live?'
    default:
      return 'COYL check-in.'
  }
}

/**
 * Public utility for the CRUD API to set nextFiresAt on create/update
 * without duplicating the now/tz wiring.
 */
export async function recomputeNextFiresAt(scheduleId: string): Promise<void> {
  const row = await prisma.checkinSchedule.findUnique({
    where: { id: scheduleId },
    include: { user: { select: { timezone: true } } },
  })
  if (!row) return
  const tz = row.user.timezone || 'America/New_York'
  const next = computeNextFire(row, new Date(), tz)
  await prisma.checkinSchedule.update({
    where: { id: scheduleId },
    data: { nextFiresAt: next },
  })
}

/**
 * Helper for the User type-narrowing surface — service callers can pass
 * a hydrated User and we still resolve tz consistently.
 */
export function resolveTimezone(user: Pick<User, 'timezone'> | null | undefined): string {
  return user?.timezone || 'America/New_York'
}
