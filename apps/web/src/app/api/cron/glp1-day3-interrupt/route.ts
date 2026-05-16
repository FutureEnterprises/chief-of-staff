import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { sendWebPushForUser } from '@/lib/web-push'

export const maxDuration = 120

const PAGE_SIZE = 200

/**
 * GLP-1 day-3 interrupt cron.
 *
 * Runs hourly. For every user with a configured glp1Drug + injection
 * weekday + still-on-drug status, checks whether the user's local time
 * is currently the afternoon (5–9 PM in their timezone) of day 3 after
 * their last injection. Day 3 is the empirically-stable point where
 * appetite suppression from semaglutide / tirzepatide tapers and the
 * autopilot script that sends users to the kitchen returns.
 *
 * Fires a single Expo push per user per cycle (cooldown enforced by
 * the most-recent FEATURE_USED event with eventValue 'glp1_day3_push'
 * — gives us a 7-day floor before re-firing, which matches the weekly
 * injection cycle).
 *
 * Why a separate cron from danger-window-interrupt:
 *   • Different audience (only GLP-1 users), different schedule
 *     (hourly with timezone gating instead of every-15-min).
 *   • Different copy (drug-specific framing, not generic pattern call).
 *   • Cleaner separation for the eventual B2B clinician summary which
 *     consumes these events as a separate stream.
 *
 * Compliance note: copy never claims to influence drug efficacy. We say
 * "your appetite is coming back" — observation, not medical advice.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  let cursor: string | undefined
  let candidates = 0
  let fired = 0
  let suppressed = 0

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        glp1Drug: { not: null },
        glp1InjectionWeekday: { not: null },
        glp1EndedAt: null, // still on the drug
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        expoPushToken: true,
        webPushSubscription: true,
        glp1Drug: true,
        glp1InjectionWeekday: true,
      },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    })

    if (users.length === 0) break
    cursor = users[users.length - 1]!.id

    for (const user of users) {
      candidates++

      // Compute "what day-of-week is today in the user's local tz, and
      // what hour is it?" without bringing in a TZ library.
      let localDay: number
      let localHour: number
      try {
        const local = new Date(
          now.toLocaleString('en-US', { timeZone: user.timezone || 'UTC' }),
        )
        localDay = local.getDay() // 0=Sun..6=Sat
        localHour = local.getHours()
      } catch {
        continue // bad timezone string — skip this user
      }

      // Inject day = N. Day-3 push fires when localDay === (N + 3) % 7
      // and the user is in their evening (5pm-9pm local).
      const injectDay = user.glp1InjectionWeekday!
      const day3 = (injectDay + 3) % 7
      if (localDay !== day3) continue
      if (localHour < 17 || localHour >= 21) continue

      // Cooldown: skip if we already fired a glp1_day3 push in the last
      // 6 days. The injection cycle is 7 days, so 6 days gives us a 1-day
      // safety margin while still allowing weekly firing.
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      const recent = await prisma.productivityEvent
        .findFirst({
          where: {
            userId: user.id,
            eventType: 'FEATURE_USED',
            eventValue: 'glp1_day3_push',
            createdAt: { gte: sixDaysAgo },
          },
          select: { id: true },
        })
        .catch(() => null)

      if (recent) {
        suppressed++
        continue
      }

      const firstName = user.name.split(' ')[0] || 'You'
      const drugName = user.glp1Drug || 'the drug'

      // Push payload — tone matches the brand voice (direct, observational,
      // not motivational). Single line that lands on the lock screen.
      const pushTitle = `${firstName}. Day 3 after ${drugName}.`
      const pushBody = `Hunger comes back tonight. The 9pm kitchen is the test. Catch yourself before it does.`
      const pushData = { type: 'glp1_day3', deepLinkPath: '/rescue?from=push&t=BINGE_URGE' }

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
            }),
          })
        } catch {
          // silent — push delivery failures shouldn't break the cron
        }
      }

      // Web Push parity with mobile. The helper handles expired-
      // subscription cleanup so the next cron tick doesn't retry a
      // dead endpoint.
      await sendWebPushForUser({
        userId: user.id,
        subscription: user.webPushSubscription,
        payload: { title: pushTitle, body: pushBody, data: pushData },
      })

      // Record the event for cooldown + analytics + the eventual
      // clinician-shareable summary. Even if push delivery silently
      // fails we still record (the user got into the cycle, which is
      // what the clinician summary cares about).
      await prisma.productivityEvent
        .create({
          data: {
            userId: user.id,
            eventType: 'FEATURE_USED',
            eventValue: 'glp1_day3_push',
            metadataJson: {
              drug: user.glp1Drug,
              injectionDay: user.glp1InjectionWeekday,
              firedAt: now.toISOString(),
              localHour,
            },
          },
        })
        .catch(() => null)

      fired++
    }

    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ ok: true, candidates, fired, suppressed })
}
