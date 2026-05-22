import { prisma } from '@repo/database'
import {
  encryptToken,
  exchangeDexcomCode,
  getDexcomConfig,
  getEncryptionKey,
} from '@/lib/integrations/dexcom'

/**
 * Dexcom OAuth — step 2: exchange the authorization code for an access
 * token and persist (encrypted) on a ProductivityEvent so we can poll
 * /v3/users/self/egvs on a 15-min cron.
 *
 * Public route (Clerk doesn't see the redirect-back). User attribution
 * comes from the state param, which we minted in /auth as `clerkId:nonce`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) return Response.json({ error: `dexcom_${error}` }, { status: 400 })
  if (!code || !state) return Response.json({ error: 'missing_params' }, { status: 400 })

  if (!getDexcomConfig() || !getEncryptionKey()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const [clerkId] = state.split(':')
  if (!clerkId) return Response.json({ error: 'invalid_state' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const token = await exchangeDexcomCode(code)
  if (!token) return Response.json({ error: 'token_exchange_failed' }, { status: 502 })

  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: 'integration_token_dexcom',
      metadataJson: {
        accessToken: encryptToken(token.access_token),
        refreshToken: encryptToken(token.refresh_token),
        expiresAt,
      },
    },
  })

  // Use the configured app URL, never req.url — req.url is attacker-controlled
  // and naive base-URL construction is an open-redirect vector (CWE-601).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  return Response.redirect(`${appUrl}/today?integration=dexcom_connected`, 302)
}
