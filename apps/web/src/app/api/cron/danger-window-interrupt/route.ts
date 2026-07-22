import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { batchProcess } from '@/lib/batch'
import { classifyState } from '@/lib/user-state'
import { guardInterrupt, recordInterrupt } from '@/lib/interrupt-guard'
import { sendWebPushForUser } from '@/lib/web-push'
import { shouldFire, voiceCallAllowed } from '@/lib/notification-prefs'
import { isUserCoachingPathClosed } from '@/lib/rap/store'
import {
  pushLiveActivityUpdate,
  isLiveActivityTokenDead,
} from '@/lib/live-activity-push'
import {
  composeInterrupt,
  createComposerBudget,
} from '@/lib/services/intervention-composer.service'
import { PLAN_LIMITS } from '@/lib/services/entitlement.service'
import { initiateVoiceCall } from '@/lib/twilio-voice'

export const maxDuration = 120

const PAGE_SIZE = 300

/**
 * EXISTING hardcoded copy, kept VERBATIM as the guaranteed fallback.
 * The LLM composer (intervention-composer.service) personalizes the
 * push when it can; on ANY composition failure (no key, >4s timeout,
 * parse fail, unsafe output, budget spent) these fire unchanged, so
 * composition never blocks or degrades a send.
 */
const FALLBACK_PUSH_TITLE = (firstName: string) => `${firstName}. This is the moment.`
const FALLBACK_PUSH_BODY = (label: string) =>
  `${label}. You already know how this ends. Open before it does.`

/**
 * Freemium taste cap. The /free page promises "The behavioral interrupt
 * is free. Forever." — so FREE users DO get real interrupts, not a
 * teaser. We cap them at 3 fired interrupts per rolling 7 days: enough
 * to feel the product catch them, scarce enough that unlimited is the
 * reason to upgrade. Paid tiers (CORE/PLUS/PREMIUM/TEAM) are unlimited.
 * Counted across BOTH interrupt crons via the shared AUTOPILOT_INTERRUPTED
 * record (see recordInterrupt in lib/interrupt-guard.ts).
 */
const FREE_WEEKLY_INTERRUPT_CAP = 3

/**
 * Precision Interrupt Hotline — proactive outbound voice channel.
 * "The app calls you first" is real per-minute Twilio spend, not a free
 * push notification, so this run-wide cap bounds cost the same way
 * ComposerBudget bounds LLM calls: past it, the cron just doesn't place
 * more calls this tick (push/web/email still fire normally). Opt-in only
 * (notificationPrefs.voiceCall === true) and gated to paid tiers via
 * PLAN_LIMITS[...].precisionInterrupt — see voiceCallAllowed() and the
 * per-user check below.
 */
const MAX_VOICE_CALLS_PER_RUN = 20

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
 * Runs for ALL plan types. FREE users are capped at
 * FREE_WEEKLY_INTERRUPT_CAP fired interrupts per rolling 7 days (the
 * /free "free forever" promise + the upgrade hook); paid tiers are
 * unlimited.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey ? new Resend(resendKey) : null
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'
  if (!resend) {
    console.warn('[danger-window-interrupt] RESEND_API_KEY not set — email channel disabled')
  }

  const now = new Date()
  let fired = 0
  let suppressed = 0
  let voiceCallsThisRun = 0
  let cursor: string | undefined

  // One budget per cron run: ≤5 concurrent LLM calls, ≤50 total.
  // Past the cap composeInterrupt returns null instantly and the
  // template fallback fires — run duration stays bounded.
  const composerBudget = createComposerBudget()

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        // All plan types fire. FREE is capped per-user below; paid tiers
        // (CORE/PLUS/PREMIUM/TEAM) are unlimited. Honors the /free
        // "free forever" interrupt promise.
        planType: { in: ['FREE', 'CORE', 'PLUS', 'PREMIUM', 'TEAM'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        planType: true,
        timezone: true,
        expoPushToken: true,
        webPushSubscription: true,
        phoneNumber: true,
        notificationPrefs: true,
        lastActiveAt: true,
        currentStreak: true,
        // Composer context: archetype family + signature script are
        // derived from primaryWedge + excuseStyle; toneMode steers voice.
        primaryWedge: true,
        excuseStyle: true,
        toneMode: true,
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
      // Safety floor: if RAP closed this user's coaching path
      // (crisis/emergency), do not fire — a user in crisis must not be
      // nudged about behavior. Checked first, before any windows or
      // policy gates, so a crisis user is skipped before any other work.
      if (await isUserCoachingPathClosed(user.id)) {
        suppressed++
        return
      }

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

      // FREE-tier weekly cap. Paid tiers are unlimited; FREE users get a
      // real taste — FREE_WEEKLY_INTERRUPT_CAP fired interrupts per rolling
      // 7 days. Counts the same AUTOPILOT_INTERRUPTED record recordInterrupt
      // writes (shared across both interrupt crons), so the cap is global to
      // the user, not per-cron. Past the cap we skip firing for this user.
      if (user.planType === 'FREE') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const firedThisWeek = await prisma.productivityEvent.count({
          where: {
            userId: user.id,
            eventType: 'AUTOPILOT_INTERRUPTED',
            createdAt: { gte: weekAgo },
          },
        })
        if (firedThisWeek >= FREE_WEEKLY_INTERRUPT_CAP) {
          suppressed++
          return
        }
      }

      const window = matching[0]!
      const firstName = user.name.split(' ')[0] ?? user.name

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

      // Pre-flight the Live Activity registration so the channel string
      // can include 'live_activity' before recordInterrupt freezes it.
      // The actual APNs push happens further down alongside the other
      // wires; here we're only checking eligibility.
      const liveActivity = await prisma.liveActivityRegistration.findFirst({
        where: { userId: user.id, active: true },
        orderBy: { startedAt: 'desc' },
        select: { id: true, activityId: true, pushToken: true },
      })

      // Channel string reflects every wire the interrupt will be sent on.
      // Used by the autopilot-autopsy analytics + interrupt-feedback
      // weighting; an interrupt that fired on push+web+email gets the
      // same dedupe key but the cost-accounting recognizes the fanout.
      // Proactive voice call eligibility: paid tier (precisionInterrupt),
      // explicit opt-in (voiceCallAllowed checks notificationPrefs.voiceCall
      // === true + quiet hours), a phone on file, and the per-run cost cap
      // not yet exhausted. Unlike the other channels, this one is opt-IN —
      // an unsolicited phone call is a materially bigger ask than a push.
      const wantsVoiceCall =
        Boolean(user.phoneNumber) &&
        PLAN_LIMITS[user.planType]?.precisionInterrupt === true &&
        voiceCallAllowed({ prefs: user.notificationPrefs, timezone: user.timezone, now }) &&
        voiceCallsThisRun < MAX_VOICE_CALLS_PER_RUN

      const channels: string[] = []
      if (user.expoPushToken) channels.push('expo')
      if (user.webPushSubscription) channels.push('web')
      if (liveActivity?.pushToken) channels.push('live_activity')
      if (resend) channels.push('email')
      if (wantsVoiceCall) channels.push('voice')

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
      // LLM-composed from the user's context (signature script, window,
      // recent caught/ignored outcomes, latest excuse); null → the
      // verbatim hardcoded fallback. Never blocks the send.
      const composed = await composeInterrupt({
        userId: user.id,
        firstName,
        windowLabel: window.label,
        timezone: user.timezone,
        primaryWedge: user.primaryWedge,
        excuseStyle: user.excuseStyle,
        toneMode: user.toneMode,
        currentStreak: user.currentStreak,
        budget: composerBudget,
        now,
      })
      const pushTitle = composed?.title ?? FALLBACK_PUSH_TITLE(firstName)
      const pushBody = composed?.body ?? FALLBACK_PUSH_BODY(window.label)
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
        } catch (err) {
          console.warn('[danger-window-interrupt] expo push failed for %s: %s', user.id, (err as Error).message)
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

      // iOS Live Activity update — uses the pre-flighted `liveActivity`
      // row (queried above so the channel string could include it).
      // APNs Live Activity pushes use a separate auth channel (token-auth
      // JWT with .p8 key) from Expo's push gateway.
      //
      // Silent skip when:
      //   • the user has no active LiveActivityRegistration row
      //     (most users; they're on web or pre-iOS-release)
      //   • the row has no pushToken yet (iOS hasn't finished the
      //     pushTokenUpdates handshake)
      //   • APNS_* env vars aren't configured yet (founder pre-launch
      //     state — the helper returns apns_not_configured and we
      //     swallow it here).
      if (liveActivity?.pushToken) {
        // Compute a coarse minutes-remaining for the widget timer. The
        // window has integer-hour bounds; using the end-of-current-hour
        // as the floor gives us at least one tick of "59 min" and
        // counts down naturally as the cron re-fires every 15 min.
        const minutesRemaining = Math.max(0, (window.endHour - currentHour) * 60)
        const result = await pushLiveActivityUpdate({
          pushToken: liveActivity.pushToken,
          activityId: liveActivity.activityId,
          contentState: {
            headline: pushTitle,
            subhead: pushBody,
            timeRemainingSec: minutesRemaining * 60,
          },
          event: 'update',
          staleAfterSec: 60 * 60,
        })
        if (!result.ok && isLiveActivityTokenDead(result)) {
          // APNs says the token is dead — flip the row inactive so
          // the next cron tick doesn't keep trying the same dead
          // endpoint. The user's next /api/v1/live-activity/register
          // call will create a fresh active row.
          await prisma.liveActivityRegistration
            .update({
              where: { id: liveActivity.id },
              data: { active: false, endedAt: new Date() },
            })
            .catch(() => {})
        }
      }

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
        } catch (err) {
          console.warn('[danger-window-interrupt] email failed for %s: %s', user.id, (err as Error).message)
        }
      }

      // Precision Interrupt Hotline — proactive outbound call. Placed
      // last (after the free channels) so a Twilio outage or cost-cap
      // hit never blocks the push/web/email fan-out above.
      if (wantsVoiceCall) {
        voiceCallsThisRun++
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
        const voiceCall = await prisma.voiceCallSession.create({
          data: {
            userId: user.id,
            kind: 'DANGER_WINDOW',
            contextLabel: window.label,
          },
        })
        const callResult = await initiateVoiceCall({
          to: user.phoneNumber!,
          twimlUrl: `${appUrl}/api/v1/voice/twiml?session=${voiceCall.id}`,
          statusCallbackUrl: `${appUrl}/api/v1/voice/status?session=${voiceCall.id}`,
        })
        if (callResult.ok) {
          await prisma.voiceCallSession.update({
            where: { id: voiceCall.id },
            data: { callSid: callResult.callSid, status: 'RINGING' },
          })
        } else {
          await prisma.voiceCallSession.update({
            where: { id: voiceCall.id },
            data: { status: 'FAILED', endedAt: new Date() },
          })
          console.warn('[danger-window-interrupt] voice call failed for %s: %s', user.id, callResult.error)
        }
      }

      fired++
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  await recordHeartbeat('danger-window-interrupt', { fired, suppressed, voiceCallsThisRun })
  return NextResponse.json({ fired, suppressed, voiceCallsThisRun, timestamp: now.toISOString() })
}
