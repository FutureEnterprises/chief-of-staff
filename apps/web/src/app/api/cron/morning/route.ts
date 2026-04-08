import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { MorningCheckinEmail } from '@repo/email'
import { isWithinUserTimeWindow } from '@/lib/services/reminder.service'
import { batchProcess } from '@/lib/batch'
import { verifyCronAuth } from '@/lib/cron-auth'
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
        morningCheckinTime: true,
      },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })

    if (users.length === 0) break
    cursor = users[users.length - 1]!.id

    const eligibleUsers = users.filter((u) =>
      isWithinUserTimeWindow(u.timezone, u.morningCheckinTime, 30)
    )
    results.skipped += users.length - eligibleUsers.length

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
    }, 20)

    for (const outcome of outcomes) {
      if (outcome.error) results.errors++
      else results.sent++
    }

    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ success: true, ...results })
}
