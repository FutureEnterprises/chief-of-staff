import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { batchProcess } from '@/lib/batch'
import { buildModelSnapshot, type SnapshotPeriod } from '@/lib/model-snapshot'

export const maxDuration = 300

const PAGE_SIZE = 500

const SNAPSHOT_DAY_BOUNDARIES: readonly SnapshotPeriod[] = [30, 60, 90]

/**
 * Day-30 / 60 / 90 Model Snapshot generator.
 *
 * Vercel cron schedule: "0 11 * * *" (11:00 UTC — see vercel.json).
 *
 * Runs daily. For each onboarded user whose days-since-creation is
 * exactly 30, 60, or 90, builds a Model Snapshot, persists it as a
 * ProductivityEvent (WEEKLY_REPORT_SENT, type='model_snapshot'), and
 * emails the user a link to the in-app snapshot page.
 *
 * Why exact day boundaries (not "≥30"):
 *   • Each user gets exactly one day-30 / day-60 / day-90 snapshot.
 *     Re-running the cron next day won't re-send.
 *   • The snapshot is meant to feel like a milestone, not a recurring
 *     report. Day 30 lands the morning of day 30.
 *
 * Idempotency: belt-and-suspenders. Before generating, we look up
 * any existing snapshot of the same period for this user. If one
 * exists, we skip. This protects against duplicate sends from
 * manual re-triggers within the same day.
 *
 * Email subject: "{firstName}, your COYL model at day {N}."
 * Email body links to /snapshot/{id} (the in-app render owned by
 * the snapshot UI agent; we just send the URL).
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
  }
  const resend = new Resend(resendKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'

  const now = new Date()
  let generated = 0
  let sent = 0
  let errored = 0
  let cursor: string | undefined

  while (true) {
    const users = await prisma.user.findMany({
      where: { onboardingCompleted: true },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (users.length === 0) break

    const eligible = users
      .map((u) => ({
        user: u,
        days: floorDaysBetween(u.createdAt, now),
      }))
      .filter((row) => SNAPSHOT_DAY_BOUNDARIES.includes(row.days as SnapshotPeriod))

    if (eligible.length === 0) {
      cursor = users[users.length - 1]!.id
      if (users.length < PAGE_SIZE) break
      continue
    }

    const results = await batchProcess(eligible, async ({ user, days }) => {
      // Idempotency guard — skip if we already emitted this snapshot.
      const existing = await prisma.productivityEvent.findFirst({
        where: {
          userId: user.id,
          eventType: 'WEEKLY_REPORT_SENT',
          eventValue: `model_snapshot:${days}`,
        },
        select: { id: true },
      })
      if (existing) return { skipped: true }

      const snapshot = await buildModelSnapshot(user.id, days)

      const event = await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'WEEKLY_REPORT_SENT',
          eventValue: `model_snapshot:${days}`,
          metadataJson: {
            type: 'model_snapshot',
            periodDays: days,
            snapshot,
            generatedAt: now.toISOString(),
          },
        },
        select: { id: true },
      })

      const firstName = user.name.split(' ')[0] ?? user.name
      const url = `${appOrigin}/snapshot/${event.id}`
      const subject = `${firstName}, your COYL model at day ${days}.`
      const text = composeEmail({
        firstName,
        days,
        url,
        identityClaim: snapshot.identityClaim,
      })

      try {
        await resend.emails.send({ from: fromEmail, to: user.email, subject, text })
        return { skipped: false, sent: true }
      } catch (err) {
        console.warn(
          '[model-snapshot] resend failed for user %s: %s',
          user.id,
          (err as Error).message,
        )
        return { skipped: false, sent: false }
      }
    })

    for (const r of results) {
      if (r.error) {
        errored++
        console.warn(
          '[model-snapshot] user %s failed: %s',
          (r.item as { user: { id: string } }).user.id,
          (r.error as Error).message,
        )
        continue
      }
      const v = r.result
      if (!v || v.skipped) continue
      generated++
      if (v.sent) sent++
    }

    cursor = users[users.length - 1]!.id
    if (users.length < PAGE_SIZE) break
  }

  return NextResponse.json({ generated, sent, errored, timestamp: now.toISOString() })
}

// ───────────────────────── helpers ─────────────────────────

function floorDaysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

function composeEmail(args: {
  firstName: string
  days: number
  url: string
  identityClaim: string
}): string {
  // Plain text — short, declarative, no marketing voice. The
  // identity claim is the hook; the URL is the action. The model
  // snapshot does the persuading once the user clicks through.
  return [
    `${args.firstName},`,
    '',
    `Day ${args.days}. Your COYL model snapshot is ready.`,
    '',
    args.identityClaim,
    '',
    `Open your snapshot: ${args.url}`,
    '',
    '— COYL',
  ].join('\n')
}
