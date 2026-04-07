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

  try {
    return await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: { email, name, avatarUrl: clerkUser.imageUrl },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        avatarUrl: clerkUser.imageUrl,
      },
    })
  } catch (err) {
    const e = err as { message?: string; code?: string }
    console.error('[ensureUserExists] error:', e.code ?? 'UNKNOWN', e.message ?? '')
    throw err
  }
}
