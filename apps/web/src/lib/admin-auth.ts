import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'

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

// ============================================================
// LLM-partner admin gate (ADMIN_USER_IDS — Clerk userId allowlist)
// ============================================================
//
// The LLM-partner admin dashboard (registering foundation labs,
// minting keys, monitoring usage, auditing scope grants) is gated by
// a separate env var — ADMIN_USER_IDS — that takes COMMA-SEPARATED
// Clerk user IDs rather than emails. Reason: the partner-success
// team will eventually own this surface, and they'll be invited via
// Clerk-internal accounts that may not have a stable email mirror
// in our User table yet. Clerk userId is the immutable handle.
//
// The original email-based gate above (ADMIN_EMAILS) remains the
// gate for the legacy /admin metrics dashboard and the marketing
// queue. The two gates intentionally diverge so we can grant
// LLM-partner-admin access without exposing the metrics dashboard
// (or vice versa).

/**
 * Synchronous admin check against ADMIN_USER_IDS. Returns true if
 * the given Clerk userId appears in the comma-separated env list,
 * false otherwise. Fail-closed: missing env → no admins.
 */
export function isAdmin(userId: string): boolean {
  if (!userId) return false
  const allowed = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (allowed.length === 0) return false
  return allowed.includes(userId)
}

/** Result envelope: either an authenticated admin userId, or a 401/403 NextResponse. */
export type AdminAssertion =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: NextResponse }

/**
 * Route-handler admin gate. Returns `{ userId }` on success or
 * `{ error: NextResponse }` on failure so callers can write:
 *
 *   const gate = await assertAdmin(req)
 *   if ('error' in gate) return gate.error
 *   const { userId } = gate
 *
 * 401 when not signed in, 403 when signed in but not on the
 * ADMIN_USER_IDS allow-list.
 */
export async function assertAdmin(_req: Request): Promise<AdminAssertion> {
  const { userId } = await auth()
  if (!userId) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  if (!isAdmin(userId)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { userId }
}
