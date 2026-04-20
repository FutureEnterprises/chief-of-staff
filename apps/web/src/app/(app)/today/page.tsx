import { Suspense } from 'react'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { TodayView } from './today-view'

export const metadata = { title: 'Today' }

async function getTodayData(userId: string, userTimezone: string) {
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
  ])

  // Find next danger window crossing in user's TZ
  const nextWindow = computeNextDangerWindow(dangerWindows, userTimezone)

  // Self-trust delta: compare current to ~1 week ago (from stored weekly report event)
  const prevScore = typeof selfTrustWeekAgo?.metadataJson === 'object' && selfTrustWeekAgo?.metadataJson !== null
    ? (selfTrustWeekAgo.metadataJson as { score?: number }).score ?? null
    : null
  const selfTrustDelta = prevScore != null && user?.selfTrustScore != null
    ? user.selfTrustScore - prevScore
    : null

  return {
    dueTodayTasks,
    followUpsDueToday,
    overdueTasks,
    recentlyCompleted,
    user,
    activeCommitment,
    nextDangerWindow: nextWindow,
    topExcuseCategory: topExcuseLast7[0]?.category ?? null,
    topExcuseCount: topExcuseLast7[0]?._count ?? 0,
    selfTrustDelta,
  }
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
  const data = await getTodayData(user.id, user.timezone ?? 'UTC')

  return (
    <div className="h-full">
      <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading...</div>}>
        <TodayView {...data} user={user} />
      </Suspense>
    </div>
  )
}
