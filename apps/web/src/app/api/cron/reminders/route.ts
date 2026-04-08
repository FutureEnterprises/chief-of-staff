import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { scheduleAttentionEvents, isWithinUserTimeWindow } from '@/lib/services/reminder.service'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 300

const PAGE_SIZE = 500

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const results = { processed: 0, remindersCreated: 0, errors: 0, skipped: 0 }
  let cursor: string | undefined

  // Paginate through users to avoid loading all into memory
  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true },
      select: {
        id: true,
        timezone: true,
        morningCheckinTime: true,
        nightCheckinTime: true,
      },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })

    if (users.length === 0) break
    cursor = users[users.length - 1]!.id

    // Process this page in concurrent batches of 20
    const outcomes = await batchProcess(users, async (user) => {
      let created = 0
      created += await scheduleAttentionEvents(user.id)

      if (isWithinUserTimeWindow(user.timezone, user.morningCheckinTime, 30)) {
        await prisma.reminder.upsert({
          where: { id: `morning-${user.id}-${new Date().toDateString()}` },
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

      if (isWithinUserTimeWindow(user.timezone, user.nightCheckinTime, 30)) {
        await prisma.reminder.upsert({
          where: { id: `night-${user.id}-${new Date().toDateString()}` },
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

      return created
    }, 20)

    for (const outcome of outcomes) {
      if (outcome.error) {
        results.errors++
      } else {
        results.processed++
        results.remindersCreated += outcome.result ?? 0
      }
    }

    // Safety: if we're running out of time, stop and report partial progress
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ success: true, ...results })
}
