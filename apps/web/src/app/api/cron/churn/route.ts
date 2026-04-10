import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'

export const maxDuration = 60

/**
 * Churn detection cron — runs daily.
 *
 * Identifies users who haven't been active in 3+ days and sends
 * a re-engagement email. Logs CHURN_RISK event for analytics.
 *
 * Tiers:
 * - 3 days inactive: gentle nudge ("Your tasks are piling up")
 * - 7 days inactive: direct ("You've been quiet. COYL hasn't forgotten.")
 * - 14 days inactive: final ("We're still here. Your tasks aren't going away.")
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Find users inactive for 3+ days who haven't been sent a churn email recently
  const inactiveUsers = await prisma.user.findMany({
    where: {
      onboardingCompleted: true,
      lastActiveAt: { lt: threeDaysAgo },
    },
    select: {
      id: true,
      email: true,
      name: true,
      lastActiveAt: true,
      _count: {
        select: {
          tasks: { where: { status: { notIn: ['COMPLETED', 'ARCHIVED'] } } },
        },
      },
    },
    take: 100,
  })

  let nudged = 0
  let errors = 0

  for (const user of inactiveUsers) {
    const daysSinceActive = Math.floor((now.getTime() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
    const openTasks = user._count.tasks

    // Skip if no open tasks — they might actually be done
    if (openTasks === 0) continue

    // Check if we already sent a churn email in the last 3 days
    const recentChurnEvent = await prisma.productivityEvent.findFirst({
      where: {
        userId: user.id,
        eventType: 'CHURN_EMAIL_SENT',
        createdAt: { gt: threeDaysAgo },
      },
    })
    if (recentChurnEvent) continue

    // Pick the right message tier
    let subject: string
    let preheader: string

    if (daysSinceActive >= 14) {
      subject = `${user.name.split(' ')[0]}, your ${openTasks} tasks aren't going away.`
      preheader = "We're still here. They're still overdue."
    } else if (daysSinceActive >= 7) {
      subject = `You've been quiet. COYL hasn't forgotten.`
      preheader = `${openTasks} tasks waiting. The longer you wait, the louder we get.`
    } else {
      subject = `Your tasks are piling up, ${user.name.split(' ')[0]}.`
      preheader = `${openTasks} open tasks. Time to handle your sh*t.`
    }

    // Send email if Resend is configured
    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject,
          text: `${preheader}\n\nYou have ${openTasks} open task${openTasks !== 1 ? 's' : ''} waiting for you.\n\nOpen COYL: https://coyl.ai/today\n\n— COYL (the AI that won't shut up)`,
        })
        nudged++
      } catch (err) {
        console.warn('[churn] Failed to email user %s: %s', user.id, (err as Error).message)
        errors++
      }
    }

    // Log churn event regardless of email
    await prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'CHURN_EMAIL_SENT',
        outputJson: { daysSinceActive, openTasks, tier: daysSinceActive >= 14 ? 'final' : daysSinceActive >= 7 ? 'direct' : 'gentle' },
      },
    })
  }

  return NextResponse.json({
    processed: inactiveUsers.length,
    nudged,
    errors,
    timestamp: now.toISOString(),
  })
}
