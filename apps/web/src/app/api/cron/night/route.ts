import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { NightReviewEmail } from '@repo/email'
import { isWithinUserTimeWindow } from '@/lib/services/reminder.service'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { batchProcess } from '@/lib/batch'
import { isUserCoachingPathClosed } from '@/lib/rap/store'
import {
  composeCheckin,
  createComposerBudget,
} from '@/lib/services/intervention-composer.service'
import * as React from 'react'

export const maxDuration = 300

const PAGE_SIZE = 500

/**
 * EXISTING subject logic, kept VERBATIM as the guaranteed fallback
 * when the LLM check-in composer returns null.
 */
const FALLBACK_SUBJECT = (completedCount: number) =>
  completedCount > 0
    ? `${completedCount} task${completedCount !== 1 ? 's' : ''} done — evening review ready`
    : 'Evening review: close out the day'

/** Above this many eligible users in a page, skip composition wholesale. */
const MAX_BATCH_FOR_COMPOSITION = 50

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  const results = { sent: 0, skipped: 0, errors: 0, rapSuppressed: 0 }
  let cursor: string | undefined
  const composerBudget = createComposerBudget()

  while (true) {
    const users = await prisma.user.findMany({
      where: { emailBriefingEnabled: true, onboardingCompleted: true },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        nightCheckinTime: true,
      },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })

    if (users.length === 0) break
    cursor = users[users.length - 1]!.id

    const eligibleUsers = users.filter((u) =>
      isWithinUserTimeWindow(u.timezone, u.nightCheckinTime, 30)
    )
    results.skipped += users.length - eligibleUsers.length
    const composeAllowed = eligibleUsers.length <= MAX_BATCH_FOR_COMPOSITION

    const outcomes = await batchProcess(eligibleUsers, async (user) => {
      // Safety floor: if RAP closed this user's coaching path
      // (crisis/emergency), do not send the review — a user in crisis
      // must not be nudged about behavior, not even a cheerful evening
      // review. Checked first, before any task query or email send.
      if (await isUserCoachingPathClosed(user.id)) {
        return { rapSuppressed: true as const }
      }

      const localToday = new Date(new Date().toLocaleString('en-US', { timeZone: user.timezone }))
      localToday.setHours(0, 0, 0, 0)

      const [completedToday, openTasks] = await Promise.all([
        prisma.task.findMany({
          where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: localToday } },
          orderBy: { completedAt: 'desc' },
          take: 10,
          select: { title: true },
        }),
        prisma.task.findMany({
          where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED', 'SNOOZED'] } },
          orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
          take: 3,
          select: { title: true },
        }),
      ])

      // LLM-composed subject from the user's context (archetype,
      // tonight's danger windows, streak, today's outcome); null →
      // verbatim fallback with the existing completed-count logic.
      const composed = composeAllowed
        ? await composeCheckin(user.id, 'night', composerBudget)
        : null

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'briefing@coyl.app',
        to: user.email,
        subject: composed?.title ?? FALLBACK_SUBJECT(completedToday.length),
        react: React.createElement(NightReviewEmail, {
          userName: user.name.split(' ')[0] ?? user.name,
          completedToday: (completedToday as Array<{ title: string }>).map((t) => t.title),
          openTomorrow: (openTasks as Array<{ title: string }>).map((t) => t.title),
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat?mode=night`,
        }),
      })

      return { rapSuppressed: false as const }
    }, 20)

    for (const outcome of outcomes) {
      if (outcome.error) results.errors++
      else if (outcome.result?.rapSuppressed) results.rapSuppressed++
      else results.sent++
    }

    if (users.length < PAGE_SIZE) break
  }

  await recordHeartbeat('night', results)
  return NextResponse.json({ success: true, ...results })
}
