import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { NightReviewEmail } from '@repo/email'
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
      nightCheckinTime: true,
    },
  })

  const results = { sent: 0, skipped: 0, errors: 0 }

  for (const user of users) {
    try {
      if (!isWithinUserTimeWindow(user.timezone, user.nightCheckinTime, 30)) {
        results.skipped++
        continue
      }

      // Local start-of-day for the user
      const localToday = new Date(new Date().toLocaleString('en-US', { timeZone: user.timezone }))
      localToday.setHours(0, 0, 0, 0)

      const [completedToday, openTasks] = await Promise.all([
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            completedAt: { gte: localToday },
          },
          orderBy: { completedAt: 'desc' },
          take: 10,
          select: { title: true },
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { notIn: ['COMPLETED', 'ARCHIVED', 'SNOOZED'] },
          },
          orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
          take: 3,
          select: { title: true },
        }),
      ])

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'briefing@chiefofstaff.app',
        to: user.email,
        subject:
          completedToday.length > 0
            ? `${completedToday.length} task${completedToday.length !== 1 ? 's' : ''} done — evening review ready`
            : 'Evening review: close out the day',
        react: React.createElement(NightReviewEmail, {
          userName: user.name.split(' ')[0] ?? user.name,
          completedToday: (completedToday as Array<{ title: string }>).map((t) => t.title),
          openTomorrow: (openTasks as Array<{ title: string }>).map((t) => t.title),
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat?mode=night`,
        }),
      })

      results.sent++
    } catch (error) {
      console.error('Failed to send night review email', { userId: user.id, error })
      results.errors++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
