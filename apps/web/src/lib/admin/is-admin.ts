import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

/**
 * Single-admin email for the marketing queue and (eventually) any other
 * sensitive ops surfaces. Kept hardcoded for v1 — the codebase already
 * has a separate ADMIN_EMAILS-driven helper (`lib/admin-auth.ts`) for
 * the loop-health dashboard. This helper is scoped to surfaces under
 * the `(admin)` route group and uses Clerk's primary-email lookup so
 * we don't depend on the User row being mirrored to our DB (the marketing
 * admin doesn't need a User row to function).
 *
 * If we ever onboard a second admin, swap the equality check for a Set
 * membership test — DO NOT externalize this to env until the dashboard
 * + marketing surfaces are both migrated, otherwise the two gates would
 * drift.
 */
const ADMIN_EMAIL = 'iman.schrock@gmail.com'

export type AdminContext = {
  userId: string
  email: string
}

/**
 * Returns true if the currently-signed-in Clerk user's primary email
 * matches the configured admin. Returns false for unauthenticated
 * requests, mismatched emails, and any Clerk lookup error.
 *
 * Read this as a soft check — UI surfaces can use it to decide whether
 * to show admin links. Server actions and protected routes should call
 * `requireAdmin()` instead.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId) return false
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return user.primaryEmailAddress?.emailAddress?.toLowerCase() === ADMIN_EMAIL
  } catch {
    return false
  }
}

/**
 * Hard gate. Returns the admin context on success. Throws on any failure
 * — unauthenticated, wrong email, Clerk lookup error — so callers can
 * let the (admin) layout catch it and render Forbidden.
 *
 * Use this in server actions and server components. Never call it from
 * a client component.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Forbidden — sign in required')
  }
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase()
  if (email !== ADMIN_EMAIL) {
    throw new Error('Forbidden — admin only')
  }
  return { userId, email }
}
