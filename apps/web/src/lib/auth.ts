import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { User } from '@repo/database'

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
    return await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: { email, name, avatarUrl },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        avatarUrl,
      },
    })
  } catch (err) {
    // VERBOSE intentional — the truncated Prisma error in Vercel's log
    // viewer left us blind during the 2026-04-22 post-signup outage.
    // Leave the full dump in place until we have structured error
    // reporting (Sentry tags) wired through.
    const e = err as {
      message?: string
      code?: string
      meta?: unknown
      clientVersion?: string
      stack?: string
      name?: string
    }
    console.error(
      '[ensureUserExists] FULL_ERROR_DUMP',
      JSON.stringify({
        name: e.name,
        code: e.code,
        clientVersion: e.clientVersion,
        message: e.message,
        meta: e.meta,
        stack: e.stack?.split('\n').slice(0, 8).join(' | '),
        inputSnapshot: {
          clerkId: clerkUser.id,
          emailProvided: !!email,
          emailLen: email.length,
          nameProvided: !!name,
          nameLen: name.length,
          avatarUrlType: typeof clerkUser.imageUrl,
          avatarUrlPreview:
            avatarUrl === null ? 'null' : String(avatarUrl).slice(0, 40),
        },
      }),
    )
    throw err
  }
}
