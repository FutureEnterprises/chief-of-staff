import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { PatternsView } from './patterns-view'

export const metadata = { title: 'Patterns' }

// Used by the predictive warning card to resolve user's current day-of-week
// from an Intl formatter string.
const DAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}
const DAY_NAMES_FULL: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
}
// The sentence that shows up in the user's head when their top excuse fires.
// Quoted verbatim in the Predictive Warnings card so the callout lands as
// recognition ("yeah, that IS what I say") rather than description.
const EXCUSE_RECURRENCE_QUOTES: Record<string, string> = {
  DELAY: "I'll start tomorrow.",
  REWARD: "I deserve this.",
  MINIMIZATION: "Just this once.",
  COLLAPSE: "I already blew it.",
  EXHAUSTION: "I'm too tired tonight.",
  EXCEPTION: "This week is weird.",
  COMPENSATION: "I'll make up for it.",
  SOCIAL_PRESSURE: "I couldn't say no.",
}

export default async function PatternsPage() {
  const user = await requireDbUser()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    excusesByCategory,
    dangerWindows,
    recentSlips,
    allSlips30d,
    preSlipEvents,
    rescueSessions,
    completedWeek,
    completedMonth,
    openTasks,
    overdueTasks,
    tasksByPriority,
  ] = await Promise.all([
    prisma.excuse.groupBy({
      by: ['category'],
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.dangerWindow.findMany({
      where: { userId: user.id, active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    }),
    prisma.slipRecord.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Full 30-day slip set for Recovery Strength metric
    prisma.slipRecord.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, recoveredAt: true },
    }),
    // All events in last 30 days — we'll correlate in memory to find pre-slip triggers
    prisma.productivityEvent.findMany({
      where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.rescueSession.findMany({
      where: { userId: user.id, startedAt: { gte: thirtyDaysAgo } },
      orderBy: { startedAt: 'desc' },
      take: 20,
    }),
    prisma.task.count({
      where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
    }),
    prisma.task.count({
      where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.task.count({
      where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
    }),
    prisma.task.count({
      where: {
        userId: user.id,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueAt: { lt: new Date() },
      },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
      _count: { id: true },
    }),
  ])

  // ──── Failure Trigger: most common event type in the hour preceding slips ────
  const HOUR_MS = 60 * 60 * 1000
  const triggerCounts: Record<string, number> = {}
  let totalPreSlipSignals = 0
  for (const slip of allSlips30d) {
    const windowStart = slip.createdAt.getTime() - HOUR_MS
    const windowEnd = slip.createdAt.getTime()
    for (const ev of preSlipEvents) {
      const t = ev.createdAt.getTime()
      if (t >= windowStart && t < windowEnd) {
        // Skip the slip-logging event itself to avoid tautology
        if (ev.eventType === 'SLIP_LOGGED' || ev.eventType === 'SLIP_RECOVERED') continue
        triggerCounts[ev.eventType] = (triggerCounts[ev.eventType] ?? 0) + 1
        totalPreSlipSignals++
      }
    }
  }
  const topFailureTrigger = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([eventType, count]) => ({ eventType, count }))

  // ──── Recovery Strength: % of slips recovered within 24h over last 30d ────
  const TWENTY_FOUR_HOURS_MS = 24 * HOUR_MS
  const recoveredFast = allSlips30d.filter(
    (s) => s.recoveredAt && s.recoveredAt.getTime() - s.createdAt.getTime() <= TWENTY_FOUR_HOURS_MS,
  ).length
  const recoveryStrengthPct =
    allSlips30d.length > 0 ? Math.round((recoveredFast / allSlips30d.length) * 100) : null
  const totalSlips30d = allSlips30d.length

  // ──── Predictive Warnings — the "If nothing changes..." cards ────
  // Deterministic, data-driven, no AI latency. These appear at the TOP
  // of the patterns page and turn passive history into future-tense
  // warnings the user can feel coming.
  const predictions: Array<{
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    prediction: string
    basis: string
    hookAction: string
  }> = []

  // Prediction 1: next danger window firing — uses user's timezone
  // to compute hours-until the next active window.
  if (dangerWindows.length > 0) {
    const tz = user.timezone ?? 'UTC'
    const now = new Date()
    const nowParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const nowDay = DAY_INDEX[nowParts.find((p) => p.type === 'weekday')?.value ?? 'Mon'] ?? 1
    const nowHour = parseInt(nowParts.find((p) => p.type === 'hour')?.value ?? '0', 10)
    const nowMinute = parseInt(nowParts.find((p) => p.type === 'minute')?.value ?? '0', 10)
    const nowMinutes = nowDay * 24 * 60 + nowHour * 60 + nowMinute

    let nearest: { window: (typeof dangerWindows)[number]; minutesUntil: number } | null = null
    for (const w of dangerWindows) {
      // Treat dayOfWeek = -1 (every day) as each day of the week
      const days = w.dayOfWeek === -1 ? [0, 1, 2, 3, 4, 5, 6] : [w.dayOfWeek]
      for (const d of days) {
        const start = d * 24 * 60 + w.startHour * 60
        // Minutes from now to window start, wrapping within the week
        let diff = start - nowMinutes
        if (diff < 0) diff += 7 * 24 * 60
        if (!nearest || diff < nearest.minutesUntil) {
          nearest = { window: w, minutesUntil: diff }
        }
      }
    }

    if (nearest && nearest.minutesUntil <= 24 * 60) {
      const hours = Math.floor(nearest.minutesUntil / 60)
      const minutes = nearest.minutesUntil % 60
      const whenText =
        hours === 0
          ? `in ${minutes} min`
          : hours < 2
            ? `in ${hours}h ${minutes}m`
            : `in about ${hours} hours`
      predictions.push({
        severity: hours < 3 ? 'HIGH' : 'MEDIUM',
        prediction: `Your next danger window \u2014 ${nearest.window.label} \u2014 fires ${whenText}.`,
        basis: `Mapped as active in your autopilot profile. ${nearest.window.triggerType ? `Trigger type: ${nearest.window.triggerType}.` : ''}`.trim(),
        hookAction: 'Set a reminder 10 minutes before. Pre-commit the first move.',
      })
    }
  }

  // Prediction 2: day-of-week slip clustering —
  // if the same day has 2+ slips in the last 4 weeks, warn.
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const recentSlipsAll = allSlips30d.filter((s) => s.createdAt >= fourWeeksAgo)
  if (recentSlipsAll.length >= 2) {
    const slipDayCounts: Record<number, number> = {}
    for (const s of recentSlipsAll) {
      const day = new Date(s.createdAt).getDay()
      slipDayCounts[day] = (slipDayCounts[day] ?? 0) + 1
    }
    const [topDay, topCount] = Object.entries(slipDayCounts).sort(
      (a, b) => b[1] - a[1],
    )[0] ?? ['0', 0]
    const dayNum = parseInt(topDay, 10)
    if (typeof topCount === 'number' && topCount >= 2) {
      const dayName = DAY_NAMES_FULL[dayNum] ?? 'that day'
      predictions.push({
        severity: topCount >= 3 ? 'HIGH' : 'MEDIUM',
        prediction: `You'll slip again this ${dayName} if nothing changes.`,
        basis: `You've slipped on ${dayName} ${topCount} of the last 4 weeks.`,
        hookAction: `Set a commitment before ${dayName} morning. Tell COYL at your morning check-in.`,
      })
    }
  }

  // Prediction 3: top-excuse recurrence — your next slip likely begins
  // with this sentence, and we'll catch it.
  const topExcuse = excusesByCategory.sort((a, b) => b._count - a._count)[0]
  if (topExcuse && topExcuse._count >= 3) {
    const quote = EXCUSE_RECURRENCE_QUOTES[topExcuse.category] ?? 'the excuse you always use.'
    predictions.push({
      severity: topExcuse._count >= 6 ? 'HIGH' : 'LOW',
      prediction: `Next time you're about to slip, the sentence in your head will be: "${quote}"`,
      basis: `You've used the ${topExcuse.category.toLowerCase()} excuse pattern ${topExcuse._count} times in the last 30 days.`,
      hookAction: `The moment you hear that sentence, open COYL. That IS the interruption.`,
    })
  }

  return (
    <PatternsView
      userId={user.id}
      userName={user.name}
      selfTrustScore={user.selfTrustScore}
      executionScore={user.executionScore}
      currentStreak={user.currentStreak}
      longestStreak={user.longestStreak}
      identityState={user.identityState ?? 'SLEEPWALKING'}
      recoveryState={user.recoveryState ?? 'ACTIVE'}
      excusesByCategory={excusesByCategory.map((e) => ({ category: e.category, count: e._count }))}
      dangerWindows={dangerWindows.map((w) => ({
        id: w.id,
        label: w.label,
        dayOfWeek: w.dayOfWeek,
        startHour: w.startHour,
        endHour: w.endHour,
        triggerType: w.triggerType,
      }))}
      recentSlips={recentSlips.map((s) => ({
        id: s.id,
        trigger: s.trigger,
        createdAt: s.createdAt.toISOString(),
        recoveredAt: s.recoveredAt?.toISOString() ?? null,
      }))}
      rescueSessions={rescueSessions.map((r) => ({
        id: r.id,
        trigger: r.trigger,
        outcome: r.outcome,
        startedAt: r.startedAt.toISOString(),
      }))}
      completedLast7Days={completedWeek}
      completedLast30Days={completedMonth}
      openTasks={openTasks}
      overdueTasks={overdueTasks}
      tasksByPriority={(tasksByPriority as Array<{ priority: string; _count: { id: number } }>).map((r) => ({
        priority: r.priority,
        count: r._count.id,
      }))}
      topFailureTrigger={topFailureTrigger}
      totalPreSlipSignals={totalPreSlipSignals}
      recoveryStrengthPct={recoveryStrengthPct}
      totalSlips30d={totalSlips30d}
      predictions={predictions}
    />
  )
}
