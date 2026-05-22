import { prisma } from '@repo/database'
import {
  encryptToken,
  exchangeLibreCode,
  getEncryptionKey,
  getLibreConfig,
} from '@/lib/integrations/libre'

/**
 * Libre OAuth — step 2. Persist (encrypted) tokens on ProductivityEvent.
 * TODO: real Libre API access requires Abbott partnership LOI; until then
 * `exchangeLibreCode` returns a mock token if the real endpoint isn't live.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) return Response.json({ error: `libre_${error}` }, { status: 400 })
  if (!code || !state) return Response.json({ error: 'missing_params' }, { status: 400 })

  if (!getLibreConfig() || !getEncryptionKey()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const [clerkId] = state.split(':')
  if (!clerkId) return Response.json({ error: 'invalid_state' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const token = await exchangeLibreCode(code)
  if (!token) return Response.json({ error: 'token_exchange_failed' }, { status: 502 })

  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: 'integration_token_libre',
      metadataJson: {
        accessToken: encryptToken(token.access_token),
        refreshToken: encryptToken(token.refresh_token),
        expiresAt,
        // TODO: real Libre API access requires Abbott partnership LOI.
        provisional: token.access_token.startsWith('libre_mock_'),
      },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  return Response.redirect(`${appUrl}/today?integration=libre_connected`, 302)
}
