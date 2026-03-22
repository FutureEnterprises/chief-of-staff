import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { DailyBriefingEmail } from '@repo/email'
import { getDaysOverdue } from '@/lib/utils'
import * as React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { emailBriefingEnabled: true, onboardingCompleted: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const results = { sent: 0, errors: 0 }

  for (const user of users) {
    try {
      // Skip if today is not in user's briefing days
      const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()]!
      if (!user.emailBriefingDays.includes(dayOfWeek)) continue

      const [priorities, completed, overdue, followUpsDue, blocked] = await Promise.all([
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            priority: { in: ['CRITICAL', 'HIGH'] },
          },
          orderBy: [{ priority: 'asc' }],
          take: 5,
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            completedAt: { gte: yesterday },
          },
          take: 10,
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            dueAt: { lt: today },
          },
          orderBy: { dueAt: 'asc' },
          take: 5,
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            followUpRequired: true,
            nextFollowUpAt: { lt: new Date(today.getTime() + 86400000) },
          },
          take: 5,
        }),
        prisma.task.findMany({
          where: { userId: user.id, status: 'BLOCKED' },
          take: 3,
        }),
      ])

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'briefing@chiefofstaff.app',
        to: user.email,
        subject: `Your daily briefing: ${priorities.length} priorities${overdue.length > 0 ? `, ${overdue.length} overdue` : ''}`,
        react: React.createElement(DailyBriefingEmail, {
          userName: user.name.split(' ')[0] ?? user.name,
          date: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          topPriorities: (priorities as Array<{ title: string }>).map((t) => t.title),
          completedItems: (completed as Array<{ title: string }>).map((t) => t.title),
          overdueItems: (overdue as Array<{ title: string; dueAt: Date | null }>).map((t) => ({
            title: t.title,
            daysOverdue: t.dueAt ? getDaysOverdue(t.dueAt) : 0,
          })),
          followUpsDue: (followUpsDue as Array<{ title: string }>).map((t) => t.title),
          blockedItems: (blocked as Array<{ title: string }>).map((t) => t.title),
          coachingNote:
            priorities.length > 5
              ? 'You have a lot on your plate. Focus on the top 2-3 things that move the needle most.'
              : '',
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://chiefofstaff.app',
        }),
      })

      results.sent++
    } catch (error) {
      console.error('Failed to send briefing email', { userId: user.id, error })
      results.errors++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
