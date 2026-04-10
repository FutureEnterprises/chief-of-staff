import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 300

const PAGE_SIZE = 500

/**
 * Weekly performance report — runs Monday 9:00 UTC.
 * Sends a 7-day summary: score, streak, completions, biggest win/miss, coaching.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  if (!resendKey) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }

  const resend = new Resend(resendKey)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  let sent = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true, emailBriefingEnabled: true },
      select: { id: true, email: true, name: true, executionScore: true, currentStreak: true },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      const [completed, created, biggestWin, biggestMiss] = await Promise.all([
        prisma.task.count({
          where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
        }),
        prisma.task.count({
          where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
        }),
        prisma.task.findFirst({
          where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
          orderBy: { priority: 'asc' },
          select: { title: true },
        }),
        prisma.task.findFirst({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            dueAt: { lt: now, gte: sevenDaysAgo },
          },
          orderBy: { priority: 'asc' },
          select: { title: true },
        }),
      ])

      const firstName = user.name.split(' ')[0]
      const score = user.executionScore
      const streak = user.currentStreak

      // Generate coaching note
      let coaching: string
      if (score >= 80) coaching = 'Execution is sharp. Keep the pressure on.'
      else if (score >= 60) coaching = 'Solid week. Push harder on follow-through.'
      else if (score >= 40) coaching = "Below average. Time to cut the excuses and focus."
      else coaching = "Rough week. Pick ONE task today and finish it. Start rebuilding."

      const weekRange = `${sevenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

      const text = [
        `${firstName}, here's your weekly COYL report.`,
        `Week: ${weekRange}`,
        '',
        `EXECUTION SCORE: ${score}/100`,
        `STREAK: ${streak} day${streak !== 1 ? 's' : ''}`,
        `COMPLETED: ${completed} tasks`,
        `CREATED: ${created} tasks`,
        '',
        biggestWin ? `BIGGEST WIN: ${biggestWin.title}` : '',
        biggestMiss ? `BIGGEST MISS: ${biggestMiss.title} (overdue)` : '',
        '',
        coaching,
        '',
        'Open COYL: https://coyl.ai/today',
        '',
        '— COYL (the behavior enforcement engine)',
      ].filter(Boolean).join('\n')

      const subject = score >= 70
        ? `${firstName}, your Execution Score: ${score}/100 🔥`
        : `${firstName}, your Execution Score: ${score}/100 — time to step up`

      try {
        await resend.emails.send({ from: fromEmail, to: user.email, subject, text })
        sent++
      } catch (err) {
        console.warn('[weekly] Failed to email user %s: %s', user.id, (err as Error).message)
      }

      await prisma.productivityEvent.create({
        data: { userId: user.id, eventType: 'WEEKLY_REPORT_SENT', metadataJson: { score, streak, completed } },
      })
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ sent, timestamp: now.toISOString() })
}
