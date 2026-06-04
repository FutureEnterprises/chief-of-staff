/**
 * Waitlist logic — the invite-only FOMO engine.
 *
 * Join → get an invite code → jump the line (+SPOTS_PER_REFERRAL) per
 * friend who joins through your code. Effective position is computed
 * here (never stored) so the boost math is tunable without a backfill.
 *
 * NEDA-safe: email + archetype only, no health/body fields.
 */

import { prisma } from '@repo/database'
import { createHash, randomBytes } from 'node:crypto'

/** Line-jump per referral. Tunable — not baked into the DB. */
export const SPOTS_PER_REFERRAL = 5

/** Unambiguous code alphabet (no 0/O/1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function genCode(): string {
  const bytes = randomBytes(4)
  let out = ''
  for (let i = 0; i < 4; i++) out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  return `COYL-${out}`
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

export type WaitlistStatus = {
  email: string
  inviteCode: string
  joinedPosition: number
  referralCount: number
  /** joinedPosition - referrals*SPOTS, floored at 1. The number to flaunt. */
  effectivePosition: number
  archetypeSlug: string | null
  alreadyOnList: boolean
}

function effectivePosition(joinedPosition: number, referralCount: number): number {
  return Math.max(1, joinedPosition - referralCount * SPOTS_PER_REFERRAL)
}

/**
 * Join (or return existing). Idempotent on email — re-joining returns the
 * existing entry rather than erroring or creating a duplicate.
 *
 * Position is assigned inside a transaction as count()+1 to avoid a race
 * where two simultaneous joins get the same number. A unique inviteCode
 * is retried a few times on the (astronomically rare) collision.
 */
export async function joinWaitlist(input: {
  email: string
  referredByCode?: string | null
  archetypeSlug?: string | null
  source?: string | null
  ipHash?: string | null
}): Promise<WaitlistStatus> {
  const email = normalizeEmail(input.email)

  const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (existing) {
    return {
      email: existing.email,
      inviteCode: existing.inviteCode,
      joinedPosition: existing.joinedPosition,
      referralCount: existing.referralCount,
      effectivePosition: effectivePosition(existing.joinedPosition, existing.referralCount),
      archetypeSlug: existing.archetypeSlug,
      alreadyOnList: true,
    }
  }

  // Validate the referrer code before crediting it.
  let referredByCode: string | null = null
  if (input.referredByCode) {
    const referrer = await prisma.waitlistEntry.findUnique({
      where: { inviteCode: input.referredByCode },
      select: { inviteCode: true },
    })
    if (referrer) referredByCode = referrer.inviteCode
  }

  let created: { email: string; inviteCode: string; joinedPosition: number; referralCount: number; archetypeSlug: string | null } | null = null
  for (let attempt = 0; attempt < 4 && !created; attempt++) {
    const inviteCode = genCode()
    try {
      created = await prisma.$transaction(async (tx) => {
        const count = await tx.waitlistEntry.count()
        const row = await tx.waitlistEntry.create({
          data: {
            email,
            inviteCode,
            referredByCode,
            joinedPosition: count + 1,
            archetypeSlug: input.archetypeSlug ?? null,
            source: input.source ?? null,
            ipHash: input.ipHash ?? null,
          },
          select: { email: true, inviteCode: true, joinedPosition: true, referralCount: true, archetypeSlug: true },
        })
        // Credit the referrer (best-effort, same tx).
        if (referredByCode) {
          await tx.waitlistEntry.update({
            where: { inviteCode: referredByCode },
            data: { referralCount: { increment: 1 } },
          })
        }
        return row
      })
    } catch (e) {
      // Unique collision on inviteCode → retry with a new code. Unique
      // collision on email → someone joined in the race; fetch + return.
      const msg = (e as Error)?.message ?? ''
      if (msg.includes('email')) {
        const row = await prisma.waitlistEntry.findUnique({ where: { email } })
        if (row) {
          return {
            email: row.email,
            inviteCode: row.inviteCode,
            joinedPosition: row.joinedPosition,
            referralCount: row.referralCount,
            effectivePosition: effectivePosition(row.joinedPosition, row.referralCount),
            archetypeSlug: row.archetypeSlug,
            alreadyOnList: true,
          }
        }
      }
      // otherwise loop and retry the code
    }
  }

  if (!created) throw new Error('waitlist_join_failed')

  return {
    email: created.email,
    inviteCode: created.inviteCode,
    joinedPosition: created.joinedPosition,
    referralCount: created.referralCount,
    effectivePosition: effectivePosition(created.joinedPosition, created.referralCount),
    archetypeSlug: created.archetypeSlug,
    alreadyOnList: false,
  }
}

/** Look up live status by invite code (for the position page polling). */
export async function getWaitlistStatus(inviteCode: string): Promise<WaitlistStatus | null> {
  const row = await prisma.waitlistEntry.findUnique({ where: { inviteCode } })
  if (!row) return null
  return {
    email: row.email,
    inviteCode: row.inviteCode,
    joinedPosition: row.joinedPosition,
    referralCount: row.referralCount,
    effectivePosition: effectivePosition(row.joinedPosition, row.referralCount),
    archetypeSlug: row.archetypeSlug,
    alreadyOnList: true,
  }
}

/** Total people on the list — for "you're #N of M" framing. */
export async function getWaitlistTotal(): Promise<number> {
  return prisma.waitlistEntry.count()
}

/* ───────────────────────────────────────────────────────────────────
 * Wave grants — the invite-only "open access to the next N" engine.
 * grantedAt → granted; grantEmailSentAt → emailed; redeemedAt → claimed.
 * ─────────────────────────────────────────────────────────────────── */

export type WaitlistCounts = {
  total: number
  granted: number
  redeemed: number
  waiting: number
}

/** Headline counts for the admin dashboard. */
export async function getWaitlistCounts(): Promise<WaitlistCounts> {
  const [total, granted, redeemed] = await Promise.all([
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { grantedAt: { not: null } } }),
    prisma.waitlistEntry.count({ where: { redeemedAt: { not: null } } }),
  ])
  return { total, granted, redeemed, waiting: total - granted }
}

export type GrantedEntry = {
  id: string
  email: string
  inviteCode: string
  effectivePosition: number
  archetypeSlug: string | null
}

/**
 * Grant access to the next `count` ungranted entries, ordered by
 * EFFECTIVE position (referrals factored in — line-jumpers go first).
 * Sets grantedAt. Returns the granted rows so the caller can email them;
 * this function never sends email (keeps it pure + testable).
 *
 * Effective position is computed in JS (it's never stored), so we pull
 * the ungranted set and sort — fine for launch-scale lists. If the list
 * ever reaches 6 figures, switch to a stored/denormalized rank.
 */
export async function grantNextWave(count: number): Promise<GrantedEntry[]> {
  const n = Math.floor(count)
  if (!Number.isFinite(n) || n <= 0) return []

  const ungranted = await prisma.waitlistEntry.findMany({
    where: { grantedAt: null },
    select: {
      id: true,
      email: true,
      inviteCode: true,
      joinedPosition: true,
      referralCount: true,
      archetypeSlug: true,
    },
  })

  ungranted.sort(
    (a, b) =>
      effectivePosition(a.joinedPosition, a.referralCount) -
      effectivePosition(b.joinedPosition, b.referralCount),
  )

  const chosen = ungranted.slice(0, n)
  if (chosen.length === 0) return []

  await prisma.waitlistEntry.updateMany({
    where: { id: { in: chosen.map((c) => c.id) } },
    data: { grantedAt: new Date() },
  })

  return chosen.map((c) => ({
    id: c.id,
    email: c.email,
    inviteCode: c.inviteCode,
    effectivePosition: effectivePosition(c.joinedPosition, c.referralCount),
    archetypeSlug: c.archetypeSlug,
  }))
}

/** Mark the grant email as sent (idempotency — never double-email). */
export async function markGrantEmailSent(id: string): Promise<void> {
  await prisma.waitlistEntry.update({
    where: { id },
    data: { grantEmailSentAt: new Date() },
  })
}

export type GrantState = 'unknown' | 'not_granted' | 'granted' | 'redeemed'

/** Validate an invite code at redemption time. */
export async function getGrantState(inviteCode: string): Promise<{
  state: GrantState
  email: string | null
  archetypeSlug: string | null
}> {
  const row = await prisma.waitlistEntry.findUnique({
    where: { inviteCode },
    select: { grantedAt: true, redeemedAt: true, email: true, archetypeSlug: true },
  })
  if (!row) return { state: 'unknown', email: null, archetypeSlug: null }
  if (row.redeemedAt) return { state: 'redeemed', email: row.email, archetypeSlug: row.archetypeSlug }
  if (row.grantedAt) return { state: 'granted', email: row.email, archetypeSlug: row.archetypeSlug }
  return { state: 'not_granted', email: row.email, archetypeSlug: row.archetypeSlug }
}

/**
 * Mark an invite as redeemed (first claim wins, idempotent). Only a
 * GRANTED code can be redeemed. Returns true if the code is valid to
 * proceed into sign-up (granted or already redeemed), false otherwise.
 */
export async function markRedeemed(inviteCode: string): Promise<boolean> {
  const row = await prisma.waitlistEntry.findUnique({
    where: { inviteCode },
    select: { grantedAt: true, redeemedAt: true },
  })
  if (!row || !row.grantedAt) return false
  if (!row.redeemedAt) {
    await prisma.waitlistEntry.update({
      where: { inviteCode },
      data: { redeemedAt: new Date() },
    })
  }
  return true
}
