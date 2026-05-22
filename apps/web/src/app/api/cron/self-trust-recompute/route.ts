import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'
import { computeSelfTrustScore } from '@/lib/self-trust-score'

export const maxDuration = 300

const PAGE_SIZE = 500

/**
 * Nightly Self-Trust Score recompute.
 *
 * Vercel cron schedule: "0 5 * * *" (05:00 UTC — see vercel.json).
 * Runs 1 hour after the execution-score cron (04:00) so any score-
 * derived signals it writes are already in place.
 *
 * For each onboarded user, compute the composite Self-Trust Score
 * over the last 30 days and persist it as a ProductivityEvent of
 * type FEATURE_USED. Reads in /today, the share card, and the
 * Model Snapshot all read back from this stream (via
 * lib/self-trust-score.ts::getCurrentScore).
 *
 *   eventType:    FEATURE_USED
 *   eventValue:   'self_trust_score'           ← lets us index/filter
 *   metadataJson: {
 *     type:      'self_trust_score',
 *     score:     0-100,
 *     breakdown: { windowPredictionAccuracy, interruptHoldRate, ... },
 *     computedAt: ISO timestamp,
 *   }
 *
 * Idempotency: writes one row per user per pass. If the cron runs
 * twice in the same day (manual re-trigger), the newest row wins on
 * the cached-read path in getCurrentScore.
 *
 * Cursor pagination matches the rest of the cron directory — never
 * load the entire User table into memory.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  let computed = 0
  let errored = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    if (users.length === 0) break

    const results = await batchProcess(users, async (user) => {
      const { score, breakdown } = await computeSelfTrustScore(user.id)
      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'FEATURE_USED',
          eventValue: 'self_trust_score',
          metadataJson: {
            type: 'self_trust_score',
            score,
            breakdown,
            computedAt: now.toISOString(),
          },
        },
      })
      return score
    })

    for (const r of results) {
      if (r.error) {
        errored++
        console.warn(
          '[self-trust-recompute] user %s failed: %s',
          (r.item as { id: string }).id,
          (r.error as Error).message,
        )
      } else {
        computed++
      }
    }

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ computed, errored, timestamp: now.toISOString() })
}
