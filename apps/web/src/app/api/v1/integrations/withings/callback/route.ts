import { prisma } from '@repo/database'
import {
  encryptToken,
  exchangeWithingsCode,
  getEncryptionKey,
  getWithingsConfig,
} from '@/lib/integrations/withings'

/**
 * Withings OAuth — step 2. Exchange code for token, persist (encrypted)
 * on ProductivityEvent. Subsequent webhook pings drive weight ingest.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) return Response.json({ error: `withings_${error}` }, { status: 400 })
  if (!code || !state) return Response.json({ error: 'missing_params' }, { status: 400 })

  if (!getWithingsConfig() || !getEncryptionKey()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const [clerkId] = state.split(':')
  if (!clerkId) return Response.json({ error: 'invalid_state' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const token = await exchangeWithingsCode(code)
  if (!token) return Response.json({ error: 'token_exchange_failed' }, { status: 502 })

  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: 'integration_token_withings',
      metadataJson: {
        accessToken: encryptToken(token.access_token),
        refreshToken: encryptToken(token.refresh_token),
        withingsUserId: token.userid,
        expiresAt,
      },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  return Response.redirect(`${appUrl}/today?integration=withings_connected`, 302)
}
