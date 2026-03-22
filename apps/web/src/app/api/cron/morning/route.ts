import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { MorningCheckinEmail } from '@repo/email'
import * as React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

export const maxDuration = 300

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Find users with email briefing enabled
  const users = await prisma.user.findMany({
    where: {
      emailBriefingEnabled: true,
      onboardingCompleted: true,
    },
  })

  const results = { sent: 0, errors: 0 }

  for (const user of users) {
    try {
      // Get top open tasks for context
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
        from: process.env.RESEND_FROM_EMAIL ?? 'briefing@chiefofstaff.app',
        to: user.email,
        subject: 'Your morning planning session is ready',
        react: React.createElement(MorningCheckinEmail, {
          userName: user.name.split(' ')[0] ?? user.name,
          checkinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat?mode=morning`,
          topOpenTasks: (openTasks as Array<{ title: string }>).map((t) => t.title),
        }),
      })

      results.sent++
    } catch (error) {
      console.error('Failed to send morning email', { userId: user.id, error })
      results.errors++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
