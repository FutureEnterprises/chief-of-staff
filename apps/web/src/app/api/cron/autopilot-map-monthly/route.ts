import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { generateText } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 300

const PAGE_SIZE = 200

/**
 * Monthly Autopilot Map — runs the 1st of each month at 10:00 UTC.
 *
 * The cartographic counterpart to the weekly autopsy. Per the May 2026
 * product blueprint memo, the monthly map is what the user keeps for the
 * year — the trajectory document, not the forensic-of-last-week document.
 *
 * Reads from existing tables only (User / RescueSession / SlipRecord /
 * Excuse / DangerWindow / ProductivityEvent / Task). No schema additions.
 *
 * Output is persisted on a ProductivityEvent row (eventType
 * MONTHLY_REPORT_SENT) so the in-app /autopilot-map page can render the
 * latest map without re-running AI.
 *
 * Entitlement: CORE+ (matches the weekly autopsy gate). Free users get
 * the weekly recovery summary, not the monthly map — the map is the
 * commitment-device deliverable.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }
  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  const now = new Date()
  const periodEnd = now
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  // Same window, one period earlier — for the month-over-month delta.
  const priorPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const priorPeriodEnd = periodStart

  const monthRange = `${periodStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${periodEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`

  let sent = 0
  let skipped = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        emailBriefingEnabled: true,
        // Monthly map is a CORE+ deliverable per the product blueprint.
        planType: { in: ['CORE', 'PLUS', 'PREMIUM', 'PRO', 'TEAM'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        primaryWedge: true,
        timezone: true,
      },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      // Aggregate 30-day window data + the prior 30 days for the
      // month-over-month delta. All reads are scoped by userId.
      const [
        excuses,
        slips,
        rescues,
        completedCount,
        priorCompletedCount,
        priorSlipCount,
        priorRescueCount,
        dangerWindows,
      ] = await Promise.all([
        prisma.excuse.groupBy({
          by: ['category'],
          where: { userId: user.id, createdAt: { gte: periodStart, lte: periodEnd } },
          _count: true,
        }),
        prisma.slipRecord.findMany({
          where: { userId: user.id, createdAt: { gte: periodStart, lte: periodEnd } },
          select: { trigger: true, createdAt: true, recoveredAt: true },
          take: 60,
        }),
        prisma.rescueSession.groupBy({
          by: ['outcome'],
          where: { userId: user.id, startedAt: { gte: periodStart, lte: periodEnd } },
          _count: true,
        }),
        prisma.task.count({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            completedAt: { gte: periodStart, lte: periodEnd },
          },
        }),
        prisma.task.count({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            completedAt: { gte: priorPeriodStart, lt: priorPeriodEnd },
          },
        }),
        prisma.slipRecord.count({
          where: { userId: user.id, createdAt: { gte: priorPeriodStart, lt: priorPeriodEnd } },
        }),
        prisma.rescueSession.count({
          where: { userId: user.id, startedAt: { gte: priorPeriodStart, lt: priorPeriodEnd } },
        }),
        prisma.dangerWindow.findMany({
          where: { userId: user.id, active: true },
          select: {
            label: true,
            dayOfWeek: true,
            startHour: true,
            endHour: true,
          },
          take: 10,
        }),
      ])

      // If the user has nothing material to map this month, skip the
      // send. We do NOT want to email a CORE subscriber an empty map.
      const hasSignal =
        excuses.length > 0 ||
        slips.length > 0 ||
        rescues.length > 0 ||
        completedCount > 0 ||
        dangerWindows.length > 0
      if (!hasSignal) {
        skipped++
        return
      }

      // Group slips by hour-of-day to feed the prompt a clear "danger
      // hour" histogram without making the AI count timestamps itself.
      const slipHourCounts: Record<number, number> = {}
      for (const s of slips) {
        const hour = s.createdAt.getHours()
        slipHourCounts[hour] = (slipHourCounts[hour] ?? 0) + 1
      }
      const topSlipHours = Object.entries(slipHourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([h, c]) => `- ${h}:00 — ${c} slip${c === 1 ? '' : 's'}`)
        .join('\n')

      // Hold-rate calculation: rescues with outcome INTERRUPTED (user
      // pulled back) / total rescues. Per the RescueOutcome enum in
      // schema.prisma — INTERRUPTED is the "rescue worked, user did
      // not slip" state.
      const rescueTotal = rescues.reduce((acc, r) => acc + r._count, 0)
      const rescueHeld =
        rescues.find((r) => r.outcome === 'INTERRUPTED')?._count ?? 0
      const holdRate =
        rescueTotal > 0 ? Math.round((rescueHeld / rescueTotal) * 100) : null

      // Month-over-month deltas.
      const completedDelta = completedCount - priorCompletedCount
      const slipsDelta = slips.length - priorSlipCount
      const rescueDelta = rescueTotal - priorRescueCount

      const dataContext = `
USER BATTLEFIELD: ${user.primaryWedge}
PERIOD: ${monthRange}

TOP EXCUSES THIS MONTH (count):
${
  excuses
    .sort((a, b) => b._count - a._count)
    .slice(0, 8)
    .map((e) => `- ${e.category}: ${e._count}×`)
    .join('\n') || '(none logged)'
}

SLIP RECORD (most recent 60):
${
  slips
    .map(
      (s) =>
        `- ${s.trigger ?? 'slip'} on ${s.createdAt.toLocaleDateString()} at ${s.createdAt.getHours()}:${String(s.createdAt.getMinutes()).padStart(2, '0')}${s.recoveredAt ? ' (recovered)' : ' (open)'}`,
    )
    .join('\n') || '(no slips this month)'
}

TOP SLIP HOURS:
${topSlipHours || '(no slips this month)'}

RESCUE OUTCOMES:
${rescues.map((r) => `- ${r.outcome}: ${r._count}`).join('\n') || '(no rescues this month)'}
RESCUE HOLD RATE: ${holdRate !== null ? `${holdRate}%` : 'n/a'}

TASKS COMPLETED THIS MONTH: ${completedCount}

DANGER WINDOWS (active):
${
  dangerWindows
    .map(
      (w) =>
        `- ${w.label} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w.dayOfWeek] ?? 'all'}, ${w.startHour}-${w.endHour})`,
    )
    .join('\n') || '(none mapped)'
}

MONTH-OVER-MONTH DELTA:
- Tasks completed: ${completedDelta >= 0 ? '+' : ''}${completedDelta} vs prior 30d (${priorCompletedCount})
- Slips: ${slipsDelta >= 0 ? '+' : ''}${slipsDelta} vs prior 30d (${priorSlipCount})
- Rescues: ${rescueDelta >= 0 ? '+' : ''}${rescueDelta} vs prior 30d (${priorRescueCount})
`.trim()

      try {
        const { text } = await generateText({
          model: AI_MODEL_FAST,
          system: SYSTEM_PROMPTS.autopilotMapMonthly
            .replace('{DATE}', now.toLocaleDateString())
            .replace('{WEDGE}', user.primaryWedge)
            .replace('{MONTH_RANGE}', monthRange),
          prompt: dataContext,
        })

        const firstName = user.name.split(' ')[0] ?? user.name

        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: `${firstName}, your Autopilot Map for ${monthRange}`,
          text: [
            `${firstName},`,
            '',
            `Your Autopilot Map for ${monthRange}.`,
            '',
            'The weekly autopsy is the forensic view. This is the map. Read it once, decide whether the trajectory is the one you want, then come back to the work.',
            '',
            text,
            '',
            '— COYL',
            '',
            'Open the full map: https://coyl.ai/autopilot-map',
            'Adjust your danger windows: https://coyl.ai/today',
          ].join('\n'),
        })

        // Persist the map on a ProductivityEvent so the /autopilot-map
        // page can render the latest without re-running AI.
        //
        // We reuse the WEEKLY_REPORT_SENT eventType because the
        // EventType enum is intentionally finite (any new value
        // requires a Prisma migration + Postgres enum ALTER, and we
        // already have a pending ScheduledInterrupt migration from
        // Agent A). The autopsy uses the same eventType and
        // discriminates via metadataJson.type — we follow that
        // convention here. Filter the /autopilot-map page on
        // metadataJson.type = 'autopilot_map_monthly'.
        await prisma.productivityEvent.create({
          data: {
            userId: user.id,
            eventType: 'WEEKLY_REPORT_SENT',
            metadataJson: {
              type: 'autopilot_map_monthly',
              mapText: text,
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
              monthRange,
              wedge: user.primaryWedge,
              counts: {
                excuses: excuses.reduce((acc, e) => acc + e._count, 0),
                slips: slips.length,
                rescues: rescueTotal,
                rescueHeld,
                holdRate,
                tasksCompleted: completedCount,
                dangerWindows: dangerWindows.length,
              },
              deltas: {
                tasksCompleted: completedDelta,
                slips: slipsDelta,
                rescues: rescueDelta,
              },
              topExcuses: excuses
                .sort((a, b) => b._count - a._count)
                .slice(0, 3)
                .map((e) => ({ category: e.category, count: e._count })),
              topSlipHours: Object.entries(slipHourCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([h, c]) => ({ hour: Number(h), count: c })),
            },
          },
        })

        sent++
      } catch (err) {
        console.warn(
          '[autopilot-map-monthly] Failed for user %s: %s',
          user.id,
          (err as Error).message,
        )
      }
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({
    sent,
    skipped,
    monthRange,
    timestamp: now.toISOString(),
  })
}
