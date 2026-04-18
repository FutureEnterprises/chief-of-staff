import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'

export const maxDuration = 120

const PAGE_SIZE = 300
const COOLDOWN_MINUTES = 120 // don't fire same window more than once per 2 hours

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
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_MINUTES * 60 * 1000)
  let fired = 0
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
        dangerWindowRecords: {
          where: { active: true },
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

      // Cooldown check — any DANGER_WINDOW_CROSSED event in last 2h?
      const recentFire = await prisma.productivityEvent.findFirst({
        where: {
          userId: user.id,
          eventType: 'DANGER_WINDOW_CROSSED',
          createdAt: { gt: cooldownCutoff },
        },
      })
      if (recentFire) return

      // Check for recent activity (rescue or task completion) — if user is already engaged, skip
      const recentActivity = await prisma.productivityEvent.findFirst({
        where: {
          userId: user.id,
          eventType: { in: ['RESCUE_TRIGGERED', 'TASK_COMPLETED', 'CHECKIN_COMPLETED'] },
          createdAt: { gt: cooldownCutoff },
        },
      })
      if (recentActivity) return

      const window = matching[0]!
      const firstName = user.name.split(' ')[0]

      // Log the event
      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'DANGER_WINDOW_CROSSED',
          eventValue: window.id,
          metadataJson: { label: window.label, hour: currentHour },
        },
      })

      // Expo push notification
      if (user.expoPushToken) {
        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              to: user.expoPushToken,
              sound: 'default',
              title: 'Danger window',
              body: `${window.label}. Tap to rescue yourself.`,
              data: { type: 'danger_window', windowId: window.id },
              priority: 'high',
            }),
          })
        } catch {
          // silent
        }
      }

      // Email fallback
      if (resend) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: `${firstName}, you're in your ${window.label.toLowerCase()}`,
            text: `${firstName},\n\nYou're in one of your known danger windows right now: ${window.label}.\n\nThis is the moment your autopilot usually takes over. Don't let it.\n\nOpen rescue: https://coyl.ai/rescue\n\n— COYL`,
          })
        } catch {
          // silent
        }
      }

      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'AUTOPILOT_INTERRUPTED',
          eventValue: window.id,
          metadataJson: { channel: user.expoPushToken ? 'push' : 'email' },
        },
      })

      fired++
    })

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ fired, timestamp: now.toISOString() })
}
