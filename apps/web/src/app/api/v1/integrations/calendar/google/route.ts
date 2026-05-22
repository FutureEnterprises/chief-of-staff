import { auth } from '@clerk/nextjs/server'
import crypto from 'node:crypto'
import { prisma } from '@repo/database'
import {
  aggregateByDay,
  buildGoogleCalendarAuthorizeUrl,
  encryptToken,
  exchangeGoogleCalendarCode,
  fetchGoogleCalendarEvents,
  getEncryptionKey,
  getGoogleCalendarConfig,
} from '@/lib/integrations/calendar'

/**
 * Google Calendar — combined auth + callback in a single route file.
 *
 * - GET without `code` → kick off OAuth (Clerk-required to mint state).
 * - GET with `code`    → exchange + persist + immediate poll.
 *
 * No webhook subroute — calendar data is polled periodically (cron entry
 * added by main thread). Read-only scope; we never read titles, attendees,
 * or descriptions — only counts + windows.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (!getGoogleCalendarConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  // Callback path: code present means Google redirected back to us.
  if (code) {
    if (error) return Response.json({ error: `google_${error}` }, { status: 400 })
    if (!state) return Response.json({ error: 'missing_state' }, { status: 400 })
    if (!getEncryptionKey()) {
      return Response.json({ error: 'integration_not_configured' }, { status: 503 })
    }

    const [clerkId] = state.split(':')
    if (!clerkId) return Response.json({ error: 'invalid_state' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

    const token = await exchangeGoogleCalendarCode(code)
    if (!token) return Response.json({ error: 'token_exchange_failed' }, { status: 502 })

    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    await prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'FEATURE_USED',
        eventValue: 'integration_token_google_calendar',
        metadataJson: {
          accessToken: encryptToken(token.access_token),
          refreshToken: token.refresh_token ? encryptToken(token.refresh_token) : null,
          expiresAt,
        },
      },
    })

    // Immediate poll so the user sees signal density populated right away.
    try {
      const events = await fetchGoogleCalendarEvents(token.access_token)
      const days = aggregateByDay(events)
      if (days.length > 0) {
        await prisma.productivityEvent.createMany({
          data: days.map((d) => ({
            userId: user.id,
            eventType: 'FEATURE_USED' as const,
            eventValue: 'calendar_event',
            metadataJson: {
              source: 'google_calendar',
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
    return Response.redirect(`${appUrl}/today?integration=google_calendar_connected`, 302)
  }

  // Auth-init path: no code → start OAuth flow. Requires a signed-in Clerk user.
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const nonce = crypto.randomBytes(16).toString('hex')
  const stateOut = `${clerkId}:${nonce}`
  const authorize = buildGoogleCalendarAuthorizeUrl(stateOut)
  if (!authorize) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }
  return Response.redirect(authorize, 302)
}
