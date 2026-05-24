/**
 * Microsoft Graph delegated-OAuth — step 1: redirect the user to
 * Microsoft's authorize URL.
 *
 * Clerk-protected so we can encode the userId in the signed state
 * payload (the callback can't trust a query param). The 302 lands the
 * user on `login.microsoftonline.com/common/oauth2/v2.0/authorize`;
 * once they consent, Microsoft 302s back to
 * `/api/v1/teams/auth/callback` with `code` and `state`.
 *
 * 503 `integration_not_configured` until MS_GRAPH_CLIENT_ID +
 * MS_GRAPH_CLIENT_SECRET are wired in the environment. See
 * lib/integrations/microsoft-graph.ts header comment.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import {
  buildAuthorizeUrl,
  getGraphConfig,
} from '@/lib/integrations/microsoft-graph'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!getGraphConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  // tenantHint is intentionally NOT read from the request — the
  // callback re-derives the tenant from Microsoft's token response
  // (id_token claim), so a hint here was only ever cosmetic. Removing
  // the read entirely also removes any taint surface from req.url to
  // the outgoing 302, which a strict scanner (CWE-601) was unable to
  // exonerate even with a regex allowlist.
  const authorize = buildAuthorizeUrl(user.id, null)
  if (!authorize) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }
  return Response.redirect(authorize.url, 302)
}
