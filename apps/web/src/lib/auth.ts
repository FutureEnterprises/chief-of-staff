import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { User } from '@repo/database'
import { claimReferralFromCookie } from '@/lib/referrals'

export async function getCurrentDbUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  return prisma.user.findUnique({ where: { clerkId: userId } })
}

export async function requireDbUser(): Promise<User> {
  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error('Unauthorized')

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || email

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name, avatarUrl: clerkUser.imageUrl },
    create: { clerkId: clerkUser.id, email, name, avatarUrl: clerkUser.imageUrl },
  })
}

export async function ensureUserExists(): Promise<User> {
  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error('Not authenticated')

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || email
  const avatarUrl = clerkUser.imageUrl ?? null

  try {
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: { email, name, avatarUrl },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        avatarUrl,
      },
    })

    // Attempt to attribute this signup to a referrer if there's a
    // pending `coyl_ref` cookie. Idempotent — re-running on an
    // already-attributed user is a no-op. Failures here MUST NOT
    // break signup, so we swallow and log only.
    await claimReferralFromCookie(user.id, user.email).catch((err) => {
      console.warn('claimReferralFromCookie failed (non-fatal)', {
        userId: user.id,
        err: err instanceof Error ? err.message : 'unknown',
      })
    })

    return user
  } catch (err) {
    const e = err as {
      message?: string
      code?: string
      meta?: { target?: string[] | string }
    }

    // P2002 = unique constraint violation. On the `email` constraint this
    // means: a row exists with this email, but under a DIFFERENT clerkId
    // than the one we're seeing now. Most common cause: user's Clerk
    // account was recreated (dev instance → prod instance migration, or
    // account deleted + re-signed-up), so Clerk minted them a new id.
    // The DB row still holds the old id. We rebind by email and update
    // clerkId to the new value. Idempotent — safe to run whenever.
    const hitEmailConstraint =
      e.code === 'P2002' &&
      (Array.isArray(e.meta?.target)
        ? e.meta.target.includes('email')
        : typeof e.meta?.target === 'string' && e.meta.target.includes('email'))

    if (hitEmailConstraint && email) {
      console.warn(
        '[ensureUserExists] rebind email→clerkId (Clerk account was recreated)',
        JSON.stringify({ email, newClerkId: clerkUser.id }),
      )
      return await prisma.user.update({
        where: { email },
        data: { clerkId: clerkUser.id, name, avatarUrl },
      })
    }

    // Any other error: full dump, then rethrow. Keep the dump verbose so
    // the next outage doesn't require a redeploy to diagnose.
    console.error(
      '[ensureUserExists] FULL_ERROR_DUMP',
      JSON.stringify({
        code: e.code,
        message: e.message,
        meta: e.meta,
        inputSnapshot: {
          clerkId: clerkUser.id,
          emailLen: email.length,
          nameLen: name.length,
          avatarUrlIsNull: avatarUrl === null,
        },
      }),
    )
    throw err
  }
}
