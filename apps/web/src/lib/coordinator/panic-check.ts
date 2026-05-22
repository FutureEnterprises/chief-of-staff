import { prisma } from '@repo/database'

/**
 * Panic gate — when a user trips the panic switch, EVERY LLM partner's
 * scope grants are effectively suspended until `expiresAt`. This is
 * the highest-priority deny in the coordinator pipeline: it short-
 * circuits before quiet hours, confidence, rate limit, and dedup.
 *
 * Reads PanicState (one row per user, unique on userId). A panic is
 * "active" only when both:
 *   1. active === true
 *   2. expiresAt > now (or null = open-ended, but coordinator UI
 *      always sets a 24h default — null is treated as "still active"
 *      so a missing/forgotten expiry never silently unlocks)
 *
 * Pure read — no writes. Coordinator audit logging happens in the
 * composed entry points in index.ts, not here.
 */
export async function isPanicActive(
  userId: string,
  asOf: Date = new Date(),
): Promise<boolean> {
  const panic = await prisma.panicState.findUnique({
    where: { userId },
    select: { active: true, expiresAt: true },
  })

  if (!panic) return false
  if (!panic.active) return false

  // null expiresAt = open-ended panic; still considered active
  if (panic.expiresAt === null) return true
  return panic.expiresAt.getTime() > asOf.getTime()
}
