import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { computeExecutionScore } from '@/lib/services/execution-score.service'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 300

const PAGE_SIZE = 500

/**
 * Daily cron: recalculate execution scores and reset stale streaks.
 * Runs at 4:00 UTC daily.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  let processed = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true },
      select: { id: true, timezone: true, currentStreak: true, lastCompletionDate: true },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      // Recalculate execution score
      await computeExecutionScore(user.id)

      // Check if streak should be reset (no completion yesterday in user TZ)
      if (user.lastCompletionDate && user.currentStreak > 0) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: user.timezone || 'UTC' })
        const lastStr = user.lastCompletionDate.toLocaleDateString('en-CA', { timeZone: user.timezone || 'UTC' })

        if (lastStr < yesterdayStr) {
          await prisma.user.update({
            where: { id: user.id },
            data: { currentStreak: 0 },
          })
        }
      }
    })

    processed += users.length
    cursor = users[users.length - 1]!.id

    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ processed, timestamp: now.toISOString() })
}
