import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { DailyBriefingEmail } from '@repo/email'
import { getDaysOverdue } from '@/lib/utils'
import { isWithinUserTimeWindow } from '@/lib/services/reminder.service'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'
import * as React from 'react'

export const maxDuration = 300

const PAGE_SIZE = 500

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  const results = { sent: 0, skipped: 0, errors: 0 }
  let cursor: string | undefined

  while (true) {
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
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })

    if (users.length === 0) break
    cursor = users[users.length - 1]!.id

    // Filter eligible users (time window + day-of-week)
    const eligibleUsers = users.filter((user) => {
      if (!isWithinUserTimeWindow(user.timezone, user.briefingTime, 30)) return false
      const localDayStr = new Date().toLocaleDateString('en-US', {
        timeZone: user.timezone,
        weekday: 'short',
      })
      return user.emailBriefingDays.includes(localDayStr.toUpperCase().slice(0, 3))
    })
    results.skipped += users.length - eligibleUsers.length

    const outcomes = await batchProcess(eligibleUsers, async (user) => {
      const localToday = new Date(new Date().toLocaleString('en-US', { timeZone: user.timezone }))
      localToday.setHours(0, 0, 0, 0)
      const localYesterday = new Date(localToday)
      localYesterday.setDate(localYesterday.getDate() - 1)
      const localTomorrow = new Date(localToday)
      localTomorrow.setDate(localTomorrow.getDate() + 1)

      const [priorities, completed, overdue, followUpsDue, blocked] = await Promise.all([
        prisma.task.findMany({
          where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] }, priority: { in: ['CRITICAL', 'HIGH'] } },
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
          where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] }, dueAt: { lt: localToday } },
          orderBy: { dueAt: 'asc' },
          take: 5,
          select: { title: true, dueAt: true },
        }),
        prisma.task.findMany({
          where: { userId: user.id, status: { notIn: ['COMPLETED', 'ARCHIVED'] }, followUpRequired: true, nextFollowUpAt: { lt: localTomorrow } },
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
        from: process.env.RESEND_FROM_EMAIL ?? 'briefing@coyl.app',
        to: user.email,
        subject: `Your daily briefing: ${priorities.length} priorities${overdue.length > 0 ? `, ${overdue.length} overdue` : ''}`,
        react: React.createElement(DailyBriefingEmail, {
          userName: user.name.split(' ')[0] ?? user.name,
          date: localToday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          topPriorities: (priorities as Array<{ title: string }>).map((t) => t.title),
          completedItems: (completed as Array<{ title: string }>).map((t) => t.title),
          overdueItems: (overdue as Array<{ title: string; dueAt: Date | null }>).map((t) => ({
            title: t.title,
            daysOverdue: t.dueAt ? getDaysOverdue(t.dueAt) : 0,
          })),
          followUpsDue: (followUpsDue as Array<{ title: string }>).map((t) => t.title),
          blockedItems: (blocked as Array<{ title: string }>).map((t) => t.title),
          coachingNote: priorities.length > 5
            ? 'You have a lot on your plate. Focus on the top 2-3 things that move the needle most.'
            : '',
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app',
        }),
      })
    }, 20)

    for (const outcome of outcomes) {
      if (outcome.error) results.errors++
      else results.sent++
    }

    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ success: true, ...results })
}
