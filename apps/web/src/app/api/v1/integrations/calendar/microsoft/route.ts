import { auth } from '@clerk/nextjs/server'
import crypto from 'node:crypto'
import { prisma } from '@repo/database'
import {
  aggregateByDay,
  buildMicrosoftCalendarAuthorizeUrl,
  encryptToken,
  exchangeMicrosoftCalendarCode,
  fetchMicrosoftCalendarEvents,
  getEncryptionKey,
  getMicrosoftCalendarConfig,
} from '@/lib/integrations/calendar'

/**
 * Microsoft Calendar (Graph API) — combined auth + callback.
 *
 * - GET without `code` → kick off OAuth (Clerk-required).
 * - GET with `code`    → exchange + persist + immediate poll.
 *
 * No webhook subroute — calendar data is polled periodically.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (!getMicrosoftCalendarConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  if (code) {
    if (error) return Response.json({ error: `microsoft_${error}` }, { status: 400 })
    if (!state) return Response.json({ error: 'missing_state' }, { status: 400 })
    if (!getEncryptionKey()) {
      return Response.json({ error: 'integration_not_configured' }, { status: 503 })
    }

    const [clerkId] = state.split(':')
    if (!clerkId) return Response.json({ error: 'invalid_state' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

    const token = await exchangeMicrosoftCalendarCode(code)
    if (!token) return Response.json({ error: 'token_exchange_failed' }, { status: 502 })

    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    await prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'FEATURE_USED',
        eventValue: 'integration_token_microsoft_calendar',
        metadataJson: {
          accessToken: encryptToken(token.access_token),
          refreshToken: token.refresh_token ? encryptToken(token.refresh_token) : null,
          expiresAt,
        },
      },
    })

    try {
      const events = await fetchMicrosoftCalendarEvents(token.access_token)
      const days = aggregateByDay(events)
      if (days.length > 0) {
        await prisma.productivityEvent.createMany({
          data: days.map((d) => ({
            userId: user.id,
            eventType: 'FEATURE_USED' as const,
            eventValue: 'calendar_event',
            metadataJson: {
              source: 'microsoft_calendar',
              date: d.date,
              eventCount: d.eventCount,
              busyMinutes: d.busyMinutes,
              density: d.density,
            },
          })),
        })
      }
    } catch {
      // Swallow — the cron will retry on the next tick.
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
    return Response.redirect(
      `${appUrl}/today?integration=microsoft_calendar_connected`,
      302,
    )
  }

  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const nonce = crypto.randomBytes(16).toString('hex')
  const stateOut = `${clerkId}:${nonce}`
  const authorize = buildMicrosoftCalendarAuthorizeUrl(stateOut)
  if (!authorize) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }
  return Response.redirect(authorize, 302)
}
