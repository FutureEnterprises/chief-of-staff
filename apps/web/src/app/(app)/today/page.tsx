import { Suspense } from 'react'
import { randomBytes } from 'node:crypto'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { proposeAsCoylInternal } from '@/lib/coyl-internal-pap'
import { formatCatchLabel } from '@/lib/interrupt-schedule'
import { TodayView } from './today-view'

export const metadata = { title: 'Today' }

async function getTodayData(userId: string, userTimezone: string, userEmail: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [
    dueTodayTasks,
    followUpsDueToday,
    overdueTasks,
    recentlyCompleted,
    user,
    activeCommitment,
    dangerWindows,
    topExcuseLast7,
    selfTrustWeekAgo,
    pendingScheduledInterrupt,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { gte: today, lt: tomorrow },
      },
      include: { tags: { include: { tag: true } }, project: true },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        followUpRequired: true,
        nextFollowUpAt: { gte: today, lt: tomorrow },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { priority: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { lt: today },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: today },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.commitment.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dangerWindow.findMany({
      where: { userId, active: true },
    }),
    prisma.excuse.groupBy({
      by: ['category'],
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 1,
    }),
    prisma.productivityEvent.findFirst({
      where: {
        userId,
        eventType: 'WEEKLY_REPORT_SENT',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      select: { metadataJson: true },
    }),
    // The user's queued first catch (onboarding schedules one via
    // scheduleFirstInterrupt; the audit funnel can too). ScheduledInterrupt
    // has no userId — the account email IS the join key, same way the
    // scheduled-interrupts dispatcher resolves the account at send time.
    prisma.scheduledInterrupt.findFirst({
      where: { email: userEmail, status: 'PENDING' },
      orderBy: { scheduledFor: 'asc' },
      select: { scheduledFor: true, timezone: true },
    }),
  ])

  // Find next danger window crossing in user's TZ
  const nextWindow = computeNextDangerWindow(dangerWindows, userTimezone)
  // Find the window the user is INSIDE right now, if any. This is what
  // turns /today from "informational dashboard" into "real-time intervention
  // surface" — when a user is currently in a known risk window, the rescue
  // path should glow rather than wait for them to discover it. The same
  // computation the danger-window-interrupt cron uses for matching, just
  // surfaced server-side on page render.
  const activeWindow = computeActiveDangerWindow(dangerWindows, userTimezone)

  // Self-trust delta: compare current to ~1 week ago (from stored weekly report event)
  const prevScore = typeof selfTrustWeekAgo?.metadataJson === 'object' && selfTrustWeekAgo?.metadataJson !== null
    ? (selfTrustWeekAgo.metadataJson as { score?: number }).score ?? null
    : null
  const selfTrustDelta = prevScore != null && user?.selfTrustScore != null
    ? user.selfTrustScore - prevScore
    : null

  // "Tonight at 9:30 PM" label for the queued first catch. Formatted in
  // the timezone the row was scheduled against (falls back to the
  // user's current tz) so the promise reads in the user's own clock.
  const pendingCatch = pendingScheduledInterrupt
    ? formatCatchLabel(
        pendingScheduledInterrupt.scheduledFor,
        pendingScheduledInterrupt.timezone || userTimezone,
      )
    : null

  return {
    dueTodayTasks,
    followUpsDueToday,
    overdueTasks,
    recentlyCompleted,
    user,
    activeCommitment,
    nextDangerWindow: nextWindow,
    activeDangerWindow: activeWindow,
    topExcuseCategory: topExcuseLast7[0]?.category ?? null,
    topExcuseCount: topExcuseLast7[0]?._count ?? 0,
    selfTrustDelta,
    pendingCatch,
    // Web push enablement signals — passed to the banner so it knows
    // whether to render. Cheap booleans, computed from data already
    // fetched above.
    hasWebPushSubscription: user?.webPushSubscription !== null && user?.webPushSubscription !== undefined,
    hasMobilePush: Boolean(user?.expoPushToken),
    hasDangerWindows: dangerWindows.length > 0,
  }
}

/**
 * Returns the danger window the user is currently inside (their local
 * weekday + hour matches one of their active windows), or null. Wildcard
 * dayOfWeek (-1) matches every day. Mirrors the matching logic in the
 * danger-window-interrupt cron so the two surfaces never diverge: if the
 * cron is about to fire a push, /today is already lit.
 */
function computeActiveDangerWindow(
  windows: Array<{ id: string; label: string; dayOfWeek: number; startHour: number; endHour: number }>,
  tz: string
): { id: string; label: string; startHour: number; endHour: number; minutesIn: number } | null {
  if (windows.length === 0) return null
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0'
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const currentDay = dayMap[weekdayStr] ?? 0
  const currentHour = parseInt(hourStr, 10)
  const currentMinute = parseInt(minuteStr, 10)

  for (const w of windows) {
    if (w.dayOfWeek !== -1 && w.dayOfWeek !== currentDay) continue
    if (currentHour < w.startHour || currentHour >= w.endHour) continue
    const minutesIn = (currentHour - w.startHour) * 60 + currentMinute
    return { id: w.id, label: w.label, startHour: w.startHour, endHour: w.endHour, minutesIn }
  }
  return null
}

function computeNextDangerWindow(
  windows: Array<{ label: string; dayOfWeek: number; startHour: number; endHour: number }>,
  tz: string
): { label: string; whenText: string; hoursUntil: number } | null {
  if (windows.length === 0) return null
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0'
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const currentDay = dayMap[weekdayStr] ?? 0
  const currentHour = parseInt(hourStr, 10)
  const currentMinute = parseInt(minuteStr, 10)
  const currentMinutesOfDay = currentHour * 60 + currentMinute

  // Find the soonest matching window (same day or future day)
  let best: { label: string; whenText: string; hoursUntil: number } | null = null
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDay = (currentDay + dayOffset) % 7
    for (const w of windows) {
      if (w.dayOfWeek !== -1 && w.dayOfWeek !== checkDay) continue
      const startMinutes = w.startHour * 60
      if (dayOffset === 0 && startMinutes <= currentMinutesOfDay) continue // already past today
      const minutesUntil = dayOffset * 24 * 60 + startMinutes - currentMinutesOfDay
      const hoursUntil = Math.floor(minutesUntil / 60)
      if (!best || minutesUntil < best.hoursUntil * 60) {
        const whenText = dayOffset === 0
          ? `in ${hoursUntil}h`
          : dayOffset === 1
            ? `tomorrow · ${formatHour(w.startHour)}`
            : `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][checkDay]} · ${formatHour(w.startHour)}`
        best = { label: w.label, whenText, hoursUntil }
      }
    }
  }
  return best
}

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export default async function TodayPage() {
  const user = await requireDbUser()
  const data = await getTodayData(user.id, user.timezone ?? 'UTC', user.email)

  // First production PAP self-integration. Every /today render emits a
  // real PAPProposal row through the COYL Internal partner. The
  // coordinator evaluates against the user's real state (panic, quiet
  // hours, rate limit, dedup, confidence). Wrapped in try/catch so a
  // coordinator failure never blocks the user's render — fire-and-forget
  // by design.
  try {
    const scope =
      user.primaryWedge === 'WEIGHT_LOSS' ? 'proactive_food' : 'proactive_focus'
    const activeWindow = data.activeDangerWindow
    await proposeAsCoylInternal({
      userId: user.id,
      proposalKey: `today_render_${user.id}_${randomBytes(8).toString('hex')}`,
      scopeRequested: [scope],
      action: {
        kind: 'callout',
        modality: 'in_app',
        mode: activeWindow ? 'live_window_callout' : 'today_heartbeat',
        headline: activeWindow
          ? `Active danger window: ${activeWindow.label}`
          : 'Today render checkpoint',
        subhead: 'COYL Internal heartbeat — first production PAP integration.',
      },
      context: {
        trigger: '/today server render',
        confidence: activeWindow ? 0.92 : 0.85,
      },
    })
  } catch (err) {
    console.error('[coyl-internal-pap] propose failed', err)
  }

  return (
    <div className="h-full">
      <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading...</div>}>
        <TodayView {...data} user={user} />
      </Suspense>
    </div>
  )
}
