import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { scheduleAttentionEvents, isWithinUserTimeWindow } from '@/lib/services/reminder.service'

export const maxDuration = 300

/**
 * Runs every 15–30 minutes via Vercel cron.
 * Computes attention events for all active users and schedules their reminders.
 *
 * Add to vercel.json:
 *   { "path": "/api/cron/reminders", "schedule": "*/15 * * * *" }
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { onboardingCompleted: true },
    select: {
      id: true,
      timezone: true,
      morningCheckinTime: true,
      nightCheckinTime: true,
    },
  })

  const results = { processed: 0, remindersCreated: 0, errors: 0 }

  for (const user of users) {
    try {
      const created = await scheduleAttentionEvents(user.id)
      results.remindersCreated += created
      results.processed++

      // Also schedule morning check-in reminder if within window
      if (isWithinUserTimeWindow(user.timezone, user.morningCheckinTime, 30)) {
        await prisma.reminder.upsert({
          where: {
            // We create a synthetic unique by checking if there's one scheduled today
            // Using findFirst pattern via create + catch is fine here
            id: `morning-${user.id}-${new Date().toDateString()}`,
          },
          update: {},
          create: {
            id: `morning-${user.id}-${new Date().toDateString()}`,
            userId: user.id,
            reminderType: 'MORNING_CHECKIN',
            scheduledAt: new Date(),
            channel: 'IN_APP',
            status: 'PENDING',
          },
        })
      }

      // Night check-in reminder
      if (isWithinUserTimeWindow(user.timezone, user.nightCheckinTime, 30)) {
        await prisma.reminder.upsert({
          where: {
            id: `night-${user.id}-${new Date().toDateString()}`,
          },
          update: {},
          create: {
            id: `night-${user.id}-${new Date().toDateString()}`,
            userId: user.id,
            reminderType: 'NIGHT_CHECKIN',
            scheduledAt: new Date(),
            channel: 'IN_APP',
            status: 'PENDING',
          },
        })
      }
    } catch (error) {
      console.error('Failed to schedule reminders for user', { userId: user.id, error })
      results.errors++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
