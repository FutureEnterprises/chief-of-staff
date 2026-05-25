/**
 * Microsoft Graph integration — revoke the signed-in user's connection.
 *
 * POST endpoint called by /settings/teams's TeamsCard when the user
 * clicks "Disconnect". Deletes their TeamsUserAuth row, which
 * immediately stops the /api/cron/teams-graph-pull dispatcher from
 * pulling their calendar + email (the cron filters on `active`/token-
 * present rows).
 *
 * Best-effort: we don't currently call Microsoft's token-revocation
 * endpoint because Microsoft's documented OAuth2 revocation path for
 * Entra ID is not always honored for personal MSAs. Deleting the row
 * server-side is the source of truth; the access token + refresh
 * token become unreachable from our side and naturally expire at
 * Microsoft (~1h for access, ~90d for refresh-token-with-no-use).
 *
 * Clerk-authed. Idempotent — disconnecting a user who isn't connected
 * returns 200 with `{ disconnected: false }`.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const existing = await prisma.teamsUserAuth.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  if (!existing) {
    return Response.json({ ok: true, disconnected: false })
  }

  await prisma.teamsUserAuth.delete({ where: { userId: user.id } })

  return Response.json({ ok: true, disconnected: true })
}
