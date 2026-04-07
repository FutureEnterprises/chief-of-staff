import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { MorningCheckinEmail } from '@repo/email'
import { isWithinUserTimeWindow } from '@/lib/services/reminder.service'
import { batchProcess } from '@/lib/batch'
import * as React from 'react'

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const users = await prisma.user.findMany({
    where: { emailBriefingEnabled: true, onboardingCompleted: true },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      morningCheckinTime: true,
    },
  })

  // Filter to users in the right time window first (no DB queries needed)
  const eligibleUsers = users.filter((u) =>
    isWithinUserTimeWindow(u.timezone, u.morningCheckinTime, 30)
  )

  const results = { sent: 0, skipped: users.length - eligibleUsers.length, errors: 0 }

  // Process eligible users in batches of 10
  const outcomes = await batchProcess(eligibleUsers, async (user) => {
    const openTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
      },
      orderBy: [{ priority: 'asc' }],
      take: 5,
      select: { title: true },
    })

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'briefing@coyl.app',
      to: user.email,
      subject: 'Your morning planning session is ready',
      react: React.createElement(MorningCheckinEmail, {
        userName: user.name.split(' ')[0] ?? user.name,
        checkinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat?mode=morning`,
        topOpenTasks: (openTasks as Array<{ title: string }>).map((t) => t.title),
      }),
    })
  }, 10)

  for (const outcome of outcomes) {
    if (outcome.error) {
      console.error('Failed to send morning email', { userId: outcome.item.id })
      results.errors++
    } else {
      results.sent++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
