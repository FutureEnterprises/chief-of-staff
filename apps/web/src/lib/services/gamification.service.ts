import { prisma } from '@repo/database'

/**
 * XP thresholds per level. Level N requires LEVEL_XP[N-1] cumulative XP.
 * Exponential curve — early levels are easy, later ones require grind.
 */
const LEVEL_XP = [
  0,     // Level 1: 0 XP
  50,    // Level 2: 50 XP
  150,   // Level 3: 150 XP
  300,   // Level 4: 300 XP
  500,   // Level 5: 500 XP
  800,   // Level 6: 800 XP
  1200,  // Level 7: 1200 XP
  1800,  // Level 8: 1800 XP
  2500,  // Level 9: 2500 XP
  3500,  // Level 10: 3500 XP (max)
]

function getLevelForXp(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]!) return i + 1
  }
  return 1
}

/**
 * Award XP and check for level ups.
 */
export async function awardXp(
  userId: string,
  amount: number,
  reason: string
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  })
  if (!user) return { newXp: 0, newLevel: 1, leveledUp: false }

  const newXp = user.xp + amount
  const newLevel = getLevelForXp(newXp)
  const leveledUp = newLevel > user.level

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  })

  if (leveledUp) {
    await prisma.productivityEvent.create({
      data: {
        userId,
        eventType: 'LEVEL_UP',
        metadataJson: { oldLevel: user.level, newLevel, xp: newXp, reason },
      },
    })
  }

  return { newXp, newLevel, leveledUp }
}

/** XP rewards for actions */
export const XP_REWARDS = {
  TASK_COMPLETED: 5,
  TASK_ON_TIME: 3,       // bonus for completing before due date
  FOLLOW_UP_RESOLVED: 5,
  MORNING_REVIEW: 10,
  NIGHT_REVIEW: 10,
  ASSESSMENT_RUN: 15,
  STREAK_DAY: 2,         // per day of active streak
  BADGE_EARNED: 0,       // XP from badge itself
} as const

/**
 * Check and award badges the user has earned but doesn't yet have.
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const [user, existingBadgeIds, allBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        executionScore: true,
        currentStreak: true,
        longestStreak: true,
        level: true,
        xp: true,
        _count: { select: { tasks: { where: { status: 'COMPLETED' } } } },
      },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    }),
    prisma.badge.findMany(),
  ])

  if (!user) return []

  const earnedIds = new Set(existingBadgeIds.map((b) => b.badgeId))
  const newBadges: string[] = []

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue

    const req = badge.requirement as { type: string; value: number }
    let earned = false

    switch (req.type) {
      case 'streak':
        earned = user.longestStreak >= req.value
        break
      case 'score':
        earned = user.executionScore >= req.value
        break
      case 'completions':
        earned = user._count.tasks >= req.value
        break
      case 'level':
        earned = user.level >= req.value
        break
    }

    if (earned) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      })
      await prisma.productivityEvent.create({
        data: {
          userId,
          eventType: 'BADGE_EARNED',
          metadataJson: { badgeSlug: badge.slug, badgeName: badge.name },
        },
      })
      if (badge.xpReward > 0) {
        await awardXp(userId, badge.xpReward, `Badge: ${badge.name}`)
      }
      newBadges.push(badge.slug)
    }
  }

  return newBadges
}

/**
 * Get level progress info for display.
 */
export function getLevelProgress(xp: number, level: number) {
  const currentThreshold = LEVEL_XP[level - 1] ?? 0
  const nextThreshold = LEVEL_XP[level] ?? LEVEL_XP[LEVEL_XP.length - 1]!
  const progress = nextThreshold > currentThreshold
    ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100
  return {
    level,
    xp,
    xpForNext: nextThreshold,
    xpInLevel: xp - currentThreshold,
    xpNeeded: nextThreshold - currentThreshold,
    progress: Math.min(100, Math.round(progress)),
    isMaxLevel: level >= LEVEL_XP.length,
  }
}
