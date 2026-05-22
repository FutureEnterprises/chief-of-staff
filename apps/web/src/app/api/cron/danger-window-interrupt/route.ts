import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'
import { classifyState } from '@/lib/user-state'
import { guardInterrupt, recordInterrupt } from '@/lib/interrupt-guard'
import { sendWebPushForUser } from '@/lib/web-push'
import { shouldFire } from '@/lib/notification-prefs'

export const maxDuration = 120

const PAGE_SIZE = 300

/**
 * Precision Interrupt Engine — the JITAI firing loop.
 *
 * Runs every 15 min. For each user:
 * 1. Compute current local time in user's timezone.
 * 2. Find active danger windows matching current day/hour.
 * 3. Check cooldown — don't spam the same window more than once per 2h.
 * 4. Check if the user has a recent rescue/check-in — if so, skip.
 * 5. Fire Expo push (if token) + email fallback with interrupt prompt.
 *
 * Gated to PLUS+ users via precisionInterrupt entitlement.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey ? new Resend(resendKey) : null
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  const now = new Date()
  let fired = 0
  let suppressed = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        planType: { in: ['PLUS', 'PREMIUM', 'TEAM'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        expoPushToken: true,
        webPushSubscription: true,
        notificationPrefs: true,
        lastActiveAt: true,
        currentStreak: true,
        dangerWindowRecords: {
          where: { active: true },
        },
        slipRecords: {
          where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, recoveredAt: true },
        },
      },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    await batchProcess(users, async (user) => {
      if (user.dangerWindowRecords.length === 0) return

      // Get current day/hour in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: user.timezone ?? 'UTC',
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
      })
      const parts = formatter.formatToParts(now)
      const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
      const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      const currentDay = dayMap[weekdayStr] ?? 0
      const currentHour = parseInt(hourStr, 10)

      // Find matching windows (dayOfWeek === -1 means all days)
      const matching = user.dangerWindowRecords.filter((w) =>
        (w.dayOfWeek === -1 || w.dayOfWeek === currentDay) &&
        currentHour >= w.startHour &&
        currentHour < w.endHour
      )
      if (matching.length === 0) return

      // Honor per-class opt-out + quiet hours from notificationPrefs.
      // The interrupt-guard already handles cooldown/rate-cap; this is
      // the user-policy layer on top.
      if (!shouldFire({
        type: 'dangerWindow',
        prefs: user.notificationPrefs,
        timezone: user.timezone,
        now,
      })) {
        suppressed++
        return
      }

      // Classify user state + ask the shared interrupt guard whether to fire.
      // The guard handles cooldown, recent-action suppression, rate cap, quiet
      // hours, and state-policy checks in one place.
      const lastSlip = user.slipRecords[0]
      const state = classifyState({
        onboardingCompleted: true, // already filtered above
        lastActiveAt: user.lastActiveAt,
        lastSlipAt: lastSlip?.createdAt ?? null,
        lastSlipRecoveredAt: lastSlip?.recoveredAt ?? null,
        insideDangerWindow: true,
        currentStreak: user.currentStreak,
      }, now)
      const decision = await guardInterrupt({
        userId: user.id,
        state,
        kind: 'DANGER_WINDOW',
        timezone: user.timezone,
      }, now)
      if (!decision.allow) {
        suppressed++
        return
      }

      const window = matching[0]!
      const firstName = user.name.split(' ')[0]

      // Log the sector-specific crossing event (used by analytics + patterns),
      // separate from the unified AUTOPILOT_INTERRUPTED record written by
      // recordInterrupt() below.
      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'DANGER_WINDOW_CROSSED',
          eventValue: window.id,
          metadataJson: { label: window.label, hour: currentHour },
        },
      })

      // Channel string reflects every wire the interrupt will be sent on.
      // Used by the autopilot-autopsy analytics + interrupt-feedback
      // weighting; an interrupt that fired on push+web+email gets the
      // same dedupe key but the cost-accounting recognizes the fanout.
      const channels: string[] = []
      if (user.expoPushToken) channels.push('expo')
      if (user.webPushSubscription) channels.push('web')
      if (resend) channels.push('email')

      // Record the interrupt FIRST so we can include its id in the
      // outgoing push payload. iOS lock-screen action buttons
      // (COYL_INTERRUPT category) POST back to
      // /api/v1/interrupts/<id>/feedback — they need the id pre-baked
      // into the push data, hence the reorder. If push delivery later
      // fails the record is still useful for cooldown/rate-cap.
      const interrupt = await recordInterrupt({
        userId: user.id,
        kind: 'DANGER_WINDOW',
        channel: channels.join('+') || 'none',
        metadata: { windowId: window.id, label: window.label, hour: currentHour },
      })

      // Expo push notification — pattern-calling tone.
      // The push IS the interruption. Copy has to land in the 3 seconds
      // it takes a person to read a lock-screen notification.
      const pushTitle = `${firstName}. This is the moment.`
      const pushBody = `${window.label}. You already know how this ends. Open before it does.`
      const pushData = {
        type: 'danger_window',
        windowId: window.id,
        interruptId: interrupt.id,
        screen: 'rescue',
      }

      if (user.expoPushToken) {
        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              to: user.expoPushToken,
              sound: 'default',
              title: pushTitle,
              body: pushBody,
              data: pushData,
              priority: 'high',
              // categoryId tells iOS to render the three action buttons
              // registered under COYL_INTERRUPT in apps/mobile/lib/notifications.ts.
              // Without this, the same push arrives without action buttons
              // and the user has to unlock + open the app to tag it.
              categoryId: 'COYL_INTERRUPT',
              channelId: 'coyl-interrupts',
            }),
          })
        } catch {
          // silent
        }
      }

      // Web Push — fires the same notification to browsers subscribed
      // via the /today enable banner. Helper handles the expired-cleanup
      // branch (404/410 from the push service clears the DB row so the
      // next cron tick doesn't hammer a dead endpoint).
      await sendWebPushForUser({
        userId: user.id,
        subscription: user.webPushSubscription,
        payload: { title: pushTitle, body: pushBody, data: pushData },
      })

      // Email fallback — same voice, slightly longer form
      if (resend) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: `${firstName}. You're in your ${window.label.toLowerCase()}.`,
            text: [
              `${firstName},`,
              '',
              `You're inside ${window.label} right now.`,
              '',
              `This is the window your autopilot runs. You already know how this ends if nothing interrupts it. Tonight\u2019s script:`,
              `  \u2022 The cue: ${window.triggerType ?? 'the usual trigger'}`,
              `  \u2022 The routine: whatever you told yourself you\u2019d stop doing`,
              `  \u2022 The aftermath: tomorrow morning`,
              '',
              `Open rescue before it runs: https://coyl.ai/rescue`,
              '',
              `I'm here. Don\u2019t hide from me.`,
              '',
              `\u2014 COYL`,
            ].join('\n'),
          })
        } catch {
          // silent
        }
      }

      fired++
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ fired, suppressed, timestamp: now.toISOString() })
}
