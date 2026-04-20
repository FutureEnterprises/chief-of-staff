import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { notFound } from 'next/navigation'

/**
 * Admin gate. Reads a comma-separated ADMIN_EMAILS env var; users whose
 * Clerk-linked email matches are allowed through. Everyone else gets
 * notFound() — we return 404 rather than 403 so the admin surface is
 * invisible to non-admins in probes and logs.
 *
 * Set ADMIN_EMAILS="you@example.com,teammate@example.com" in Vercel prod
 * and .env.local for dev.
 */
export async function requireAdmin(): Promise<{ id: string; email: string; name: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) notFound()

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, name: true },
  })
  if (!user) notFound()

  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowed.length === 0) {
    // Fail-closed when env isn't configured. Better 404 than accidental exposure.
    notFound()
  }
  if (!allowed.includes(user.email.toLowerCase())) notFound()

  return user
}
