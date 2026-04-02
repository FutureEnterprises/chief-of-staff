import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { DailyBriefingEmail } from '@repo/email'
import { getDaysOverdue } from '@/lib/utils'
import { isWithinUserTimeWindow } from '@/lib/services/reminder.service'
import * as React from 'react'

export const maxDuration = 300

export async function GET(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { emailBriefingEnabled: true, onboardingCompleted: true },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      briefingTime: true,
      emailBriefingDays: true,
    },
  })

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const user of users) {
    try {
      // Only send to users whose local briefing time matches the current UTC time (±30 min)
      if (!isWithinUserTimeWindow(user.timezone, user.briefingTime, 30)) {
        results.skipped++
        continue
      }

      // Check user's local day-of-week
      const localDayStr = new Date().toLocaleDateString('en-US', {
        timeZone: user.timezone,
        weekday: 'short',
      })
      const localDayCode = localDayStr.toUpperCase().slice(0, 3)
      if (!user.emailBriefingDays.includes(localDayCode)) {
        results.skipped++
        continue
      }

      const localToday = new Date(new Date().toLocaleString('en-US', { timeZone: user.timezone }))
      localToday.setHours(0, 0, 0, 0)
      const localYesterday = new Date(localToday)
      localYesterday.setDate(localYesterday.getDate() - 1)
      const localTomorrow = new Date(localToday)
      localTomorrow.setDate(localTomorrow.getDate() + 1)

      const [priorities, completed, overdue, followUpsDue, blocked] = await Promise.all([
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            priority: { in: ['CRITICAL', 'HIGH'] },
          },
          orderBy: [{ priority: 'asc' }],
          take: 5,
          select: { title: true },
        }),
        prisma.task.findMany({
          where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: localYesterday } },
          take: 10,
          select: { title: true },
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            dueAt: { lt: localToday },
          },
          orderBy: { dueAt: 'asc' },
          take: 5,
          select: { title: true, dueAt: true },
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
            followUpRequired: true,
            nextFollowUpAt: { lt: localTomorrow },
          },
          take: 5,
          select: { title: true },
        }),
        prisma.task.findMany({
          where: { userId: user.id, status: 'BLOCKED' },
          take: 3,
          select: { title: true },
        }),
      ])

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'briefing@chiefofstaff.app',
        to: user.email,
        subject: `Your daily briefing: ${priorities.length} priorities${overdue.length > 0 ? `, ${overdue.length} overdue` : ''}`,
        react: React.createElement(DailyBriefingEmail, {
          userName: user.name.split(' ')[0] ?? user.name,
          date: localToday.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
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
