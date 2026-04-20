import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import type { IdentityState } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'

export const maxDuration = 60

/**
 * Identity update cron \u2014 runs nightly at 04:30 UTC.
 *
 * Spec \u00a77 (COYL_system_behavior_rules.md):
 *   \u2022 IF user recovers <24h repeatedly  \u2192 upgrade state
 *   \u2022 IF user disappears after slip     \u2192 downgrade state
 *
 * Identity is the retention moat. Users stay for who they're becoming,
 * not for the feature set. This cron translates slip + recovery data
 * into state transitions on user.identityState, which drives:
 *   \u2022 the "Identity read" card on /today
 *   \u2022 the tone layer (DISAPPEARED \u2192 Mentor only)
 *   \u2022 the identity sentence used in /patterns and share cards
 *
 * Runs in one sweep over onboarded users. Idempotent \u2014 re-running within
 * the same day produces the same output, no state churn.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  const oneDayMs = 24 * 60 * 60 * 1000
  const twoDaysAgo = new Date(now.getTime() - 2 * oneDayMs)
  const sevenDaysAgo = new Date(now.getTime() - 7 * oneDayMs)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * oneDayMs)

  let updated = 0
  let unchanged = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true },
      select: {
        id: true,
        identityState: true,
        lastActiveAt: true,
        currentStreak: true,
        longestStreak: true,
        slipsThisMonth: true,
        slipRecords: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true, recoveredAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
      orderBy: { id: 'asc' },
      take: 200,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    for (const user of users) {
      const next = computeNextIdentityState({
        current: user.identityState,
        lastActiveAt: user.lastActiveAt,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        slipsThisMonth: user.slipsThisMonth,
        slipRecords: user.slipRecords,
        now,
        twoDaysAgo,
        sevenDaysAgo,
      })

      if (next === user.identityState) {
        unchanged++
        continue
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { identityState: next },
      })
      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'IDENTITY_CHANGED',
          eventValue: next,
          metadataJson: { from: user.identityState, to: next },
        },
      })
      updated++
    }

    cursor = users[users.length - 1]!.id
    if (users.length < 200) break
  }

  return NextResponse.json({ updated, unchanged, timestamp: now.toISOString() })
}

/**
 * Pure function so the transition rules can be tested. Inputs are all
 * plain data. Returns the identity state to set.
 *
 * Rule order (first matching rule wins):
 *   1. DISAPPEARED-downgrade (disappeared after slip) \u2192 AVOIDANT
 *   2. Repeated fast recovery (3+ slips, all recovered <24h) \u2192 RESILIENT
 *   3. Recent fast recovery (>=1 slip, recovered <24h, 7d active) \u2192 RECOVERING
 *   4. Multiple recent slips with long gap since active \u2192 AVOIDANT
 *   5. Sustained discipline (21+ day streak, <=1 slip/month) \u2192 DISCIPLINED
 *   6. Moderate streak (>=7d, <=2 slips/month) \u2192 INCREASINGLY_CONSCIOUS
 *   7. Fall-through: UNSTABLE_BUT_TRYING or SLEEPWALKING
 */
function computeNextIdentityState(input: {
  current: IdentityState | null
  lastActiveAt: Date
  currentStreak: number
  longestStreak: number
  slipsThisMonth: number
  slipRecords: Array<{ createdAt: Date; recoveredAt: Date | null }>
  now: Date
  twoDaysAgo: Date
  sevenDaysAgo: Date
}): IdentityState {
  const oneDay = 24 * 60 * 60 * 1000
  const mostRecentSlip = input.slipRecords[0]
  const silent2d = input.lastActiveAt < input.twoDaysAgo

  // Rule 1: disappeared after a slip \u2014 that specific combo is AVOIDANT.
  if (mostRecentSlip && silent2d && !mostRecentSlip.recoveredAt) {
    return 'AVOIDANT'
  }

  const recoveredSlips = input.slipRecords.filter(
    (s) => s.recoveredAt && s.recoveredAt.getTime() - s.createdAt.getTime() <= oneDay,
  )

  // Rule 2: repeated fast recovery \u2014 3+ slips, all recovered <24h.
  if (
    input.slipRecords.length >= 3 &&
    recoveredSlips.length === input.slipRecords.length
  ) {
    return 'RESILIENT'
  }

  // Rule 3: recent fast recovery + active this week.
  if (recoveredSlips.length >= 1 && input.lastActiveAt >= input.sevenDaysAgo) {
    return 'RECOVERING'
  }

  // Rule 4: multiple slips + long silence = avoidant (not disappeared outright).
  if (input.slipRecords.length >= 2 && silent2d) {
    return 'AVOIDANT'
  }

  // Rule 5: sustained discipline.
  if (input.currentStreak >= 21 && input.slipsThisMonth <= 1) {
    return 'DISCIPLINED'
  }

  // Rule 6: moderate streak with minimal slips.
  if (input.currentStreak >= 7 && input.slipsThisMonth <= 2) {
    return 'INCREASINGLY_CONSCIOUS'
  }

  // Rule 7 fall-through \u2014 trying vs sleepwalking depends on activity.
  if (input.currentStreak > 0 || input.slipRecords.length > 0) {
    return 'UNSTABLE_BUT_TRYING'
  }
  return 'SLEEPWALKING'
}
