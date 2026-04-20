import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'

export const maxDuration = 60

/**
 * "You're disappearing" cron — runs daily at 10 AM UTC.
 *
 * Detects users who have gone silent and fires a proactive interruption
 * in COYL's voice. This is an autopilot-interrupter, not a task-reminder —
 * we do NOT gate on "open tasks." A user who disappeared without any
 * tasks is still disappearing from the thing that was supposed to keep
 * them honest.
 *
 * Tiers (faster cycles than a typical churn loop):
 *   2 days silent → "You stopped showing up."
 *   5 days silent → "You're disappearing. We've seen this pattern before."
 *   10 days silent → "Your autopilot won. Come back."
 *
 * Channels: Expo push (primary) + email (fallback). 3-day cooldown on the
 * CHURN_EMAIL_SENT event so we never spam.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // Anyone onboarded who has gone silent for 2+ days.
  // We do NOT filter on open tasks — the product catches autopilot, not inboxes.
  const silentUsers = await prisma.user.findMany({
    where: {
      onboardingCompleted: true,
      lastActiveAt: { lt: twoDaysAgo },
    },
    select: {
      id: true,
      email: true,
      name: true,
      lastActiveAt: true,
      expoPushToken: true,
      primaryWedge: true,
      currentStreak: true,
      longestStreak: true,
    },
    take: 200,
  })

  let interrupted = 0
  let errors = 0
  const nowTs = now.getTime()

  for (const user of silentUsers) {
    const daysSilent = Math.floor((nowTs - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
    const firstName = user.name.split(' ')[0] ?? 'you'

    // Cooldown — if we pinged in the last 3 days, skip.
    const recentPing = await prisma.productivityEvent.findFirst({
      where: {
        userId: user.id,
        eventType: 'CHURN_EMAIL_SENT',
        createdAt: { gt: threeDaysAgo },
      },
    })
    if (recentPing) continue

    // Pick tier — only fire at the boundary days (2/5/10) to avoid daily
    // pings and keep the cadence meaningful. Off-boundary days we skip.
    let tier: 'soft' | 'direct' | 'final' | null = null
    if (daysSilent >= 10 && user.lastActiveAt < tenDaysAgo) tier = 'final'
    else if (daysSilent >= 5 && user.lastActiveAt < fiveDaysAgo) tier = 'direct'
    else if (daysSilent >= 2) tier = 'soft'
    if (!tier) continue

    // Messaging — all written in COYL's voice. Pattern-calling over task-nagging.
    let pushTitle: string
    let pushBody: string
    let emailSubject: string
    let emailBody: string

    if (tier === 'final') {
      pushTitle = `${firstName}. Your autopilot won.`
      pushBody = `You've been gone 10 days. Come back before the pattern locks in.`
      emailSubject = `${firstName}. Your autopilot won this round.`
      emailBody = [
        `${firstName},`,
        '',
        `You've been silent for ${daysSilent} days.`,
        '',
        `This is the exact behavior the product was built to interrupt. Whatever the script is \u2014 avoidance, shame after a slip, "I'll come back when I'm ready" \u2014 it runs longer every day you're not here to catch it.`,
        '',
        user.longestStreak > 0
          ? `Your longest streak was ${user.longestStreak} days. That was you. That is still you.`
          : `You haven't set a streak yet. This is where it starts.`,
        '',
        `One tap, one honest check-in, and we're back: https://coyl.ai/today`,
        '',
        `I'm not going anywhere. \u2014 COYL`,
      ].join('\n')
    } else if (tier === 'direct') {
      pushTitle = `${firstName}. You're disappearing.`
      pushBody = `Day ${daysSilent}. We've seen this pattern. Tap before it becomes identity.`
      emailSubject = `${firstName}, you're disappearing.`
      emailBody = [
        `${firstName},`,
        '',
        `${daysSilent} days silent. No check-in, no rescue, no slip log. Nothing.`,
        '',
        `This is a script. Whatever happened \u2014 a slip you didn't want to log, a week that got away, a feeling that said "I'll come back when I'm ready" \u2014 that voice is the autopilot. The one we're supposed to catch.`,
        '',
        `One tap. One honest sentence. That's the re-entry: https://coyl.ai/today`,
        '',
        `\u2014 COYL`,
      ].join('\n')
    } else {
      pushTitle = `${firstName}. You stopped showing up.`
      pushBody = `2 days silent. What happened? Open before it becomes a week.`
      emailSubject = `${firstName}, you stopped showing up.`
      emailBody = [
        `${firstName},`,
        '',
        `Two days without a check-in.`,
        '',
        `Usually when someone disappears from COYL, one of three things just happened: a slip they didn't want to log, a window of life that got busy, or a feeling that said "I'll come back when I'm ready." All three are the script. All three get easier to break the moment you show up.`,
        '',
        `One tap: https://coyl.ai/today`,
        '',
        `\u2014 COYL`,
      ].join('\n')
    }

    // Expo push — primary channel for engaged mobile users
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
            data: { type: 'silent_interrupt', tier, daysSilent },
            priority: 'high',
          }),
        })
      } catch (err) {
        console.warn('[churn] push failed for %s: %s', user.id, (err as Error).message)
        errors++
      }
    }

    // Email fallback / secondary
    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: emailSubject,
          text: emailBody,
        })
      } catch (err) {
        console.warn('[churn] email failed for %s: %s', user.id, (err as Error).message)
        errors++
      }
    }

    // Log the event — reuses existing CHURN_EMAIL_SENT type so analytics
    // and the 3-day cooldown continue to work without a schema migration.
    await prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'CHURN_EMAIL_SENT',
        metadataJson: {
          daysSilent,
          tier,
          channel: user.expoPushToken ? 'push+email' : 'email',
          wedge: user.primaryWedge,
        },
      },
    })

    interrupted++
  }

  return NextResponse.json({
    processed: silentUsers.length,
    interrupted,
    errors,
    timestamp: now.toISOString(),
  })
}
