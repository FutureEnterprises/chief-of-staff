import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'
import { sendWebPushForUser } from '@/lib/web-push'
import {
  generateDailyNumber,
  userLocalDateKey,
  formatDeltaLabel,
} from '@/lib/daily-number'

export const maxDuration = 120

const PAGE_SIZE = 300

/**
 * Daily-Number cron — the Wrapped ritual firing loop.
 *
 * Wordle taught us: humans share daily rituals more reliably than
 * moment-triggered events. This cron runs HOURLY (`0 * * * *`) but the
 * per-user fire is gated to ONE local hour — the user's local wind-down
 * time (8 PM default).
 *
 * For each onboarded user whose local clock just hit the target hour
 * AND who hasn't generated a DailyNumber for today:
 *   1. generateDailyNumber(userId, userLocalDateKey)
 *   2. Send Expo push with the identity sentence + deep link to /d/{code}
 *   3. Send web-push fallback
 *
 * The cron is idempotent at the row level: generateDailyNumber uses
 * an upsert keyed on (userId, date). If the user opened the in-app
 * daily-card earlier and that auto-generated the row, the cron just
 * fetches it back and pushes the sentence.
 */

// Target local hour for the daily fire — 8 PM is the founder's chosen
// wind-down moment. Configurable per-user later; for now a global
// constant lets us ship the ritual without a settings UI.
const TARGET_LOCAL_HOUR = 20 // 8 PM

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  let generated = 0
  let pushed = 0
  let errored = 0
  let skippedWrongHour = 0
  let skippedAlreadyGenerated = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        expoPushToken: true,
        webPushSubscription: true,
      },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      try {
        // Gate 1 — has the user's local clock just hit the target hour?
        // We use the user's timezone; the cron firing globally each
        // hour means every timezone gets its 8 PM in turn.
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: user.timezone || 'UTC',
          hour: 'numeric',
          hour12: false,
        }).formatToParts(now)
        const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
        const localHour = parseInt(hourStr, 10)

        if (localHour !== TARGET_LOCAL_HOUR) {
          skippedWrongHour++
          return
        }

        // Gate 2 — has a DailyNumber already been generated for today?
        // generateDailyNumber is idempotent, but we want to skip the
        // push for users who already saw their number in-app this
        // local day (avoid push noise when the row predates the cron
        // tick because the user opened /today earlier).
        const todayKey = userLocalDateKey(now, user.timezone || 'UTC')
        const existing = await prisma.dailyNumber.findUnique({
          where: { userId_date: { userId: user.id, date: todayKey } },
          select: { id: true, shareCode: true, identitySentence: true },
        })
        if (existing) {
          skippedAlreadyGenerated++
          return
        }

        // Generate.
        const daily = await generateDailyNumber(user.id, todayKey)
        generated++

        const firstName = user.name.split(' ')[0] ?? 'You'
        const deltaLabel = formatDeltaLabel(daily.selfTrustDelta)
        const deepLink = `/d/${daily.shareCode}`

        // Push copy. Two-clause: "{firstName}. Day {N}." then the
        // identity sentence. Lock-screen-readable in 3 seconds.
        const pushTitle = `${firstName}. Day ${daily.dayNumber}. ${deltaLabel}`
        const pushBody = daily.identitySentence
        const pushData = {
          type: 'daily_number',
          dailyNumberId: daily.id,
          shareCode: daily.shareCode,
          screen: 'daily',
          deepLink,
        }

        // Expo push — same pattern as danger-window-interrupt cron.
        if (user.expoPushToken) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                to: user.expoPushToken,
                sound: 'default',
                title: pushTitle,
                body: pushBody,
                data: pushData,
                priority: 'high',
                channelId: 'coyl-daily',
              }),
            })
            pushed++
          } catch {
            // Single bad token shouldn't fail the whole batch.
          }
        }

        // Web-push fallback — helper auto-clears expired subscriptions.
        const webResult = await sendWebPushForUser({
          userId: user.id,
          subscription: user.webPushSubscription,
          payload: { title: pushTitle, body: pushBody, data: pushData },
        })
        if (webResult === 'sent') pushed++
      } catch (err) {
        errored++
        console.warn('[cron/daily-number] user failed', {
          userId: user.id,
          message: err instanceof Error ? err.message : 'unknown',
        })
      }
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({
    generated,
    pushed,
    errored,
    skippedWrongHour,
    skippedAlreadyGenerated,
    timestamp: now.toISOString(),
  })
}
