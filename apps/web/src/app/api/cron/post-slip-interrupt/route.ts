import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { classifyState } from '@/lib/user-state'
import { guardInterrupt, recordInterrupt } from '@/lib/interrupt-guard'

export const maxDuration = 60

/**
 * Post-slip interrupt cron — runs every 15 min.
 *
 * After a user logs a slip, the 2 hours and 24 hours that follow are
 * the retention-critical windows. The spec's recovery loop says:
 *   → the spiral is the actual problem, not the slip
 *   → stabilize inside 2h, re-enter at 24h
 *
 * This cron fires two waves, gated by metadata so each slip record gets
 * each ping exactly once:
 *
 *   T + 2h   "2h_check"    → "How are the last 2 hours going?"
 *   T + 24h  "24h_resolve" → "24 hours. Are you back, or still in it?"
 *
 * Pushes go via Expo + email via Resend. Misses are logged but the
 * next slip still gets its interrupts \u2014 we don't silently fall off.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  const now = new Date()
  // Window 1: slips that happened 2\u20132.25h ago and haven't been checked.
  // Window 2: slips that happened 24\u201324.25h ago and haven't been resolved.
  // The 15-min tail matches the cron interval so every slip is caught once.
  const fifteenMin = 15 * 60 * 1000
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const twoHoursFifteenAgo = new Date(twoHoursAgo.getTime() - fifteenMin)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twentyFourHoursFifteenAgo = new Date(twentyFourHoursAgo.getTime() - fifteenMin)

  // Look up all candidate slips in both windows, plus the user for channels.
  const candidates = await prisma.slipRecord.findMany({
    where: {
      OR: [
        { createdAt: { gte: twoHoursFifteenAgo, lt: twoHoursAgo } },
        { createdAt: { gte: twentyFourHoursFifteenAgo, lt: twentyFourHoursAgo } },
      ],
      recoveredAt: null,
    },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, expoPushToken: true,
          timezone: true, lastActiveAt: true, currentStreak: true,
          onboardingCompleted: true,
        },
      },
    },
    take: 500,
  })

  let fired = 0
  let suppressed = 0
  let errors = 0

  for (const slip of candidates) {
    const ageMs = now.getTime() - slip.createdAt.getTime()
    const wave: '2h_check' | '24h_resolve' =
      ageMs < 3 * 60 * 60 * 1000 ? '2h_check' : '24h_resolve'

    // Use the shared guard. idempotencyKey baked from slip.id + wave so the
    // same slip never receives the same wave twice \u2014 also satisfies
    // recent-action + rate-cap + quiet-hours + state-policy rules in one call.
    const state = classifyState({
      onboardingCompleted: slip.user.onboardingCompleted,
      lastActiveAt: slip.user.lastActiveAt,
      lastSlipAt: slip.createdAt,
      lastSlipRecoveredAt: slip.recoveredAt,
      insideDangerWindow: false,
      currentStreak: slip.user.currentStreak,
    }, now)
    const decision = await guardInterrupt({
      userId: slip.user.id,
      state,
      kind: wave === '2h_check' ? 'POST_SLIP_2H' : 'POST_SLIP_24H',
      timezone: slip.user.timezone,
      idempotencyKey: `${slip.id}:${wave}`,
    }, now)
    if (!decision.allow) {
      suppressed++
      continue
    }

    const firstName = slip.user.name.split(' ')[0] ?? 'you'
    const triggerText = slip.trigger ?? 'the slip'

    let pushTitle: string
    let pushBody: string
    let emailSubject: string
    let emailBody: string

    if (wave === '2h_check') {
      pushTitle = `${firstName}. It\u2019s been 2 hours.`
      pushBody = `How is the recovery going? Stabilize or spiral \u2014 pick one.`
      emailSubject = `${firstName} \u2014 the 2-hour check-in`
      emailBody = [
        `${firstName},`,
        '',
        `Two hours ago you told me you slipped on ${triggerText}.`,
        '',
        `This is the window where the spiral writes itself. The sentence in your head right now \u2014 "might as well," "I\u2019ll start tomorrow," "no point now" \u2014 that IS the spiral. Not the slip.`,
        '',
        `Stabilize: water, movement, bed early. Don\u2019t compensate. Don\u2019t plan.`,
        '',
        `Open COYL: https://coyl.ai/slip`,
        '',
        `\u2014 COYL`,
      ].join('\n')
    } else {
      pushTitle = `${firstName}. 24 hours since the slip.`
      pushBody = `Are you back, or still in it? One tap to mark it resolved.`
      emailSubject = `${firstName}, 24 hours \u2014 where are you?`
      emailBody = [
        `${firstName},`,
        '',
        `24 hours ago you logged: "${triggerText}".`,
        '',
        `Two paths from here:`,
        `  \u2022 Back on it \u2014 mark it resolved, continue the streak.`,
        `  \u2022 Still in it \u2014 open rescue. Don\u2019t let 24 hours become 72.`,
        '',
        `Neither is failure. Disappearing is. Tell me where you are.`,
        '',
        `Open COYL: https://coyl.ai/slip`,
        '',
        `\u2014 COYL`,
      ].join('\n')
    }

    // Expo push
    if (slip.user.expoPushToken) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            to: slip.user.expoPushToken,
            sound: 'default',
            title: pushTitle,
            body: pushBody,
            data: { type: 'post_slip', slipId: slip.id, wave },
            priority: 'high',
          }),
        })
      } catch (err) {
        console.warn('[post-slip] push failed for %s: %s', slip.user.id, (err as Error).message)
        errors++
      }
    }

    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: fromEmail,
          to: slip.user.email,
          subject: emailSubject,
          text: emailBody,
        })
      } catch (err) {
        console.warn('[post-slip] email failed for %s: %s', slip.user.id, (err as Error).message)
        errors++
      }
    }

    await recordInterrupt({
      userId: slip.user.id,
      kind: wave === '2h_check' ? 'POST_SLIP_2H' : 'POST_SLIP_24H',
      idempotencyKey: `${slip.id}:${wave}`,
      channel: slip.user.expoPushToken ? 'push+email' : 'email',
      metadata: { wave, slipId: slip.id },
    })

    fired++
  }

  return NextResponse.json({
    processed: candidates.length,
    fired,
    suppressed,
    errors,
    timestamp: now.toISOString(),
  })
}
