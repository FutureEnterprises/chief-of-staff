import { prisma } from '@repo/database'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

/**
 * Referral mechanic — code generation, claim, conversion, credit grant.
 *
 * Three lifecycle points:
 *   1. ensureReferralCode — every user gets a unique 8-char code on
 *      first read; lazy so we don't write to every signup row.
 *   2. claimReferralFromCookie — when a new user signs up after
 *      landing on /r/[code], we read the `coyl_ref` cookie and create
 *      a Referral row (referredId set, converted = false).
 *   3. markReferralConverted — when the referred user starts paying
 *      (Stripe checkout.session.completed), we flip converted = true,
 *      grant +1 month credit to both parties via referralCreditMonths,
 *      and attempt to apply the referrer's credit immediately if they
 *      have an active Stripe subscription.
 *
 * Credit redemption: at next Stripe checkout, if the user has
 * referralCreditMonths > 0, we mint a one-time 100%-off coupon and
 * attach it to the subscription, then decrement the credit counter.
 * Users already on a subscription with no upcoming checkout: their
 * credit applies the next time they start a new checkout (e.g. upgrade,
 * re-subscribe, or annual renewal flow).
 */

const REFERRAL_COOKIE = 'coyl_ref'
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Generate or read the user's permanent referral code. 8-char base32
 * (Crockford alphabet, no I/L/O/U) for shareability. Idempotent.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })
  if (user?.referralCode) return user.referralCode

  // Retry loop on the unique constraint — collision probability is
  // ~1e-12 per attempt, so this almost never loops more than once.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(8)
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      })
      return code
    } catch (err) {
      const e = err as { code?: string }
      if (e.code !== 'P2002') throw err
      // collided; try again
    }
  }
  throw new Error('Could not allocate referral code')
}

/**
 * Set the referral cookie. Called by /r/[code] route handler before
 * redirecting to /sign-up. 30-day TTL gives a reasonable window for
 * the visitor to convert without keeping a forever-stale attribution.
 */
export async function setReferralCookie(code: string): Promise<void> {
  const store = await cookies()
  store.set(REFERRAL_COOKIE, code, {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
}

/**
 * Called from ensureUserExists at signup time. Looks up the referrer
 * by code, creates the Referral row, sets referredByUserId on the new
 * user, and clears the cookie. Self-referral attempts are silently
 * ignored. Idempotent — re-running on an already-attributed user is a
 * no-op.
 */
export async function claimReferralFromCookie(newUserId: string, newUserEmail: string): Promise<void> {
  const store = await cookies()
  const code = store.get(REFERRAL_COOKIE)?.value
  if (!code) return

  try {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    })
    if (!referrer) return
    if (referrer.id === newUserId) return // self-ref attempt

    // Atomic: only create the Referral row + set referredByUserId if
    // the new user doesn't already have one. Prevents a returning
    // user from re-attributing themselves to a second referrer.
    const updated = await prisma.user.updateMany({
      where: { id: newUserId, referredByUserId: null },
      data: { referredByUserId: referrer.id },
    })
    if (updated.count === 0) return // already attributed

    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        referredEmail: newUserEmail,
        code,
        converted: false,
      },
    }).catch(() => {
      // Code uniqueness collision — Referral.code is unique. If a row
      // already exists for this code with a different referredId,
      // we've lost the race. Best-effort: don't crash signup.
    })
  } finally {
    // Always clear the cookie after a signup attempt — no double-claims
    store.delete(REFERRAL_COOKIE)
  }
}

/**
 * Called from the Stripe webhook when checkout.session.completed fires
 * AND the user has a referredByUserId. Flips the Referral row to
 * converted, grants +1 month credit to both referrer and referred,
 * and records a REFERRAL_CONVERTED event for analytics.
 *
 * Returns the referrer's ID if a conversion happened, null otherwise
 * (e.g. no referral row, or already converted). Caller can use the
 * returned ID to attempt immediate credit application if desired.
 */
export async function markReferralConverted(referredUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { id: true, referredByUserId: true },
  })
  if (!user?.referredByUserId) return null

  const referral = await prisma.referral.findFirst({
    where: { referrerId: user.referredByUserId, referredId: referredUserId, converted: false },
    select: { id: true },
  })
  if (!referral) return null

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { converted: true, convertedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.referredByUserId },
      data: { referralCreditMonths: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: referredUserId },
      data: { referralCreditMonths: { increment: 1 } },
    }),
    prisma.productivityEvent.create({
      data: {
        userId: user.referredByUserId,
        eventType: 'REFERRAL_CONVERTED',
        eventValue: 'referrer',
        metadataJson: { referredUserId, referralId: referral.id },
      },
    }),
    prisma.productivityEvent.create({
      data: {
        userId: referredUserId,
        eventType: 'REFERRAL_CONVERTED',
        eventValue: 'referred',
        metadataJson: { referrerId: user.referredByUserId, referralId: referral.id },
      },
    }),
  ])

  return user.referredByUserId
}

/**
 * Mint a one-time 100%-off Stripe coupon for ONE billing cycle and
 * return its ID. Caller attaches it to subscription_data.discounts on
 * the next checkout session. Coupons are throwaway — one user, one
 * cycle — so we don't need to dedupe.
 */
export async function mintReferralCoupon(stripe: Stripe, userId: string): Promise<string | null> {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      name: `COYL Referral · 1 free month · ${userId.slice(0, 8)}`,
      metadata: { userId, source: 'referral' },
    })
    return coupon.id
  } catch (err) {
    console.warn('mintReferralCoupon failed', { err: err instanceof Error ? err.message : 'unknown' })
    return null
  }
}

/**
 * Decrement the user's referral credit counter by 1. Called after
 * successfully attaching a coupon to a checkout session. Atomic guard
 * against double-spend if two checkouts race: updateMany with the
 * minimum-credit predicate.
 */
export async function consumeReferralCredit(userId: string): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: { id: userId, referralCreditMonths: { gt: 0 } },
    data: { referralCreditMonths: { decrement: 1 } },
  })
  return result.count === 1
}

/**
 * Get share-ready referral stats for the Settings tile.
 */
export async function getReferralStats(userId: string): Promise<{
  code: string
  shareUrl: string
  invitesSent: number
  invitesConverted: number
  creditMonthsPending: number
}> {
  const code = await ensureReferralCode(userId)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'

  const [user, totalSent, totalConverted] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCreditMonths: true },
    }),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, converted: true } }),
  ])

  return {
    code,
    shareUrl: `${baseUrl}/r/${code}`,
    invitesSent: totalSent,
    invitesConverted: totalConverted,
    creditMonthsPending: user?.referralCreditMonths ?? 0,
  }
}

// ─────────────────────────── helpers ───────────────────────────

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
function randomCode(length: number): string {
  let out = ''
  const buf = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < length; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < length; i++) {
    out += CROCKFORD[buf[i]! % CROCKFORD.length]
  }
  return out
}
