import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { getFamily, parseFamilySlug } from '@/lib/audit-archetype'
import { sendWebPushForUser } from '@/lib/web-push'
import { recordInterrupt } from '@/lib/interrupt-guard'
import {
  composeInterrupt,
  createComposerBudget,
} from '@/lib/services/intervention-composer.service'

export const maxDuration = 60

/**
 * Above this many matured rows in one tick, skip LLM composition
 * entirely (template copy for the whole batch) so the every-minute
 * dispatcher can never back up behind model latency.
 */
const MAX_BATCH_FOR_COMPOSITION = 50

/**
 * GET /api/cron/scheduled-interrupts
 *
 * The dispatcher for the first-hour felt-interrupt funnel. Runs every
 * minute (see apps/web/vercel.json). Picks PENDING ScheduledInterrupt
 * rows whose scheduledFor has matured (<= now + 1 minute lookahead to
 * absorb minor scheduler skew) and fires one or both of:
 *
 *   - SMS via Twilio (same provider /catch-me uses) — if a phone is on
 *     the row AND TWILIO_* env is configured.
 *   - Web Push — if the row's email resolves to a signed-up user who
 *     has subscribed (the /today enable banner). Preferred over email
 *     for those users: a lock-screen push at the danger-window moment
 *     IS the product; an email is a description of it. The onboarding
 *     first-catch path (completeOnboarding → scheduleFirstInterrupt)
 *     feeds these rows.
 *   - Email via Resend — if an email is on the row AND RESEND_API_KEY
 *     is configured AND web push didn't already carry it.
 *
 * Rows that resolve to a signed-up account also get an
 * AUTOPILOT_INTERRUPTED event via recordInterrupt() so the catch shows
 * up in /today's InterruptHistory — same visibility a cron-fired
 * danger-window interrupt gets.
 *
 * On success, status flips to SENT with sentAt. On failure (provider
 * error, missing config for the contact method that was captured), the
 * row flips to FAILED with errorMessage. Either way the row is no
 * longer matched by future cron ticks — guaranteed at-most-once delivery
 * even if the cron overlaps.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const lookahead = new Date(Date.now() + 60 * 1000)

  const pending = await prisma.scheduledInterrupt.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: lookahead } },
    orderBy: { scheduledFor: 'asc' },
    take: 200,
  })

  if (pending.length === 0) {
    await recordHeartbeat('scheduled-interrupts', { processed: 0, sent: 0, failed: 0 })
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const twilioReady = Boolean(accountSid && authToken && (fromNumber || messagingServiceSid))

  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey ? new Resend(resendKey) : null
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>'

  // Dynamic-import Twilio only if we'll actually use it. Same approach
  // as /api/v1/sms/intro — keeps cold start lean when SMS isn't wired.
  // The twilio package ships `export = lib`, so Turbopack's type
  // checker treats it as a namespace. We narrow to the surface we use
  // (messages.create) and cast the module factory through unknown.
  type TwilioMessageOpts = {
    to: string
    body: string
    from?: string
    messagingServiceSid?: string
  }
  type TwilioClient = {
    messages: { create: (opts: TwilioMessageOpts) => Promise<unknown> }
  }
  let twilio: TwilioClient | null = null
  if (twilioReady) {
    try {
      const mod = (await import('twilio')) as unknown as {
        default: (sid: string, token: string) => TwilioClient
      }
      twilio = mod.default(accountSid!, authToken!)
    } catch (err) {
      console.warn('Twilio module load failed', {
        err: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  let sent = 0
  let failed = 0

  // Per-run LLM budget; composition is skipped wholesale for oversized
  // batches so template copy keeps the dispatcher inside its minute.
  const composerBudget = createComposerBudget()
  const composeAllowed = pending.length <= MAX_BATCH_FOR_COMPOSITION

  for (const row of pending) {
    // Atomic claim — an overlapping run (a prior invocation still doing
    // network I/O past its minute, or a maxDuration truncation mid-batch)
    // re-SELECTs still-PENDING rows; without this conditional flip both
    // runs dispatch the same row (duplicate SMS/email). Claim-first makes
    // delivery at-most-once: a crash between claim and dispatch loses that
    // send, which for an interrupt is strictly better than double-texting.
    // Genuine dispatch failures below still flip the row to FAILED.
    const claim = await prisma.scheduledInterrupt.updateMany({
      where: { id: row.id, status: 'PENDING' },
      data: { status: 'SENT', sentAt: new Date() },
    })
    if (claim.count === 0) continue // another run owns this row

    const family = resolveFamily(row.archetypeFamily)
    const errors: string[] = []
    let dispatched = false
    const channels: string[] = []

    // Resolve the row to a signed-up account when possible. Anonymous
    // audit-funnel emails usually won't match; onboarding first-catch
    // rows always will. The account unlocks web push + interrupt-history
    // visibility.
    const account = row.email
      ? await prisma.user.findUnique({
          where: { email: row.email },
          select: { id: true, name: true, timezone: true, webPushSubscription: true },
        })
      : null

    // LLM-composed copy when the batch is small enough; null → the
    // verbatim template below. Anonymous rows compose from the family
    // archetype alone (no account history); the family name doubles as
    // the addressee, matching the existing template's register.
    const composed = composeAllowed
      ? await composeInterrupt({
          userId: account?.id ?? null,
          firstName: account?.name?.trim().split(/\s+/)[0] || family.name,
          windowLabel: row.window || 'your danger window',
          timezone: account?.timezone ?? row.timezone,
          archetype: { name: family.name, signature: family.signature },
          budget: composerBudget,
        })
      : null

    // CTA mirrors composeBody's routing: signed-up users go straight to
    // rescue, anonymous audit-takers get the sign-up funnel.
    const cta = account
      ? 'Open your rescue: https://coyl.ai/rescue?from=first_catch'
      : 'Lock the full system: https://coyl.ai/sign-up?ref=interrupt'

    const body = composed ? `${composed.body} ${cta}` : composeBody(family, Boolean(account))
    const subject = composed ? composed.title : composeSubject(family)

    if (row.phoneNumber && twilio) {
      try {
        await twilio.messages.create({
          to: row.phoneNumber,
          body,
          ...(messagingServiceSid
            ? { messagingServiceSid }
            : { from: fromNumber! }),
        })
        dispatched = true
        channels.push('sms')
      } catch (err) {
        errors.push(`sms: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    } else if (row.phoneNumber && !twilio) {
      // Phone was captured but no SMS provider configured — fall through
      // to email if available; otherwise this row will FAIL below.
      errors.push('sms: provider not configured')
    }

    // Channel preference for signed-up users: web push when subscribed,
    // else email. Push failures (expired sub, VAPID misconfig) fall
    // through to the email branch below so the row still lands.
    let webPushSent = false
    if (account?.webPushSubscription) {
      const result = await sendWebPushForUser({
        userId: account.id,
        subscription: account.webPushSubscription,
        payload: {
          title: subject,
          body,
          data: { type: 'scheduled_interrupt', screen: 'rescue' },
        },
      })
      if (result === 'sent') {
        dispatched = true
        webPushSent = true
        channels.push('web')
      } else {
        errors.push(`web: ${result}`)
      }
    }

    if (!webPushSent && row.email && resend) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: row.email,
          subject,
          text: body,
        })
        dispatched = true
        channels.push('email')
      } catch (err) {
        errors.push(`email: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    } else if (!webPushSent && row.email && !resend) {
      errors.push('email: provider not configured')
    }

    // Make the catch visible in /today's InterruptHistory for account
    // holders. Fire-and-forget shaped: a logging failure must not stop
    // the row from flipping to SENT (the send already happened).
    if (dispatched && account) {
      try {
        await recordInterrupt({
          userId: account.id,
          kind: 'DANGER_WINDOW',
          channel: channels.join('+') || 'none',
          metadata: {
            source: 'scheduled_interrupt',
            scheduledInterruptId: row.id,
            label: family.name,
          },
        })
      } catch (err) {
        console.warn('[scheduled-interrupts] recordInterrupt failed', {
          err: err instanceof Error ? err.message : 'unknown',
        })
      }
    }

    if (dispatched) {
      await prisma.scheduledInterrupt.update({
        where: { id: row.id },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: errors.length ? errors.join('; ') : null },
      })
      sent += 1
    } else {
      await prisma.scheduledInterrupt.update({
        where: { id: row.id },
        data: {
          status: 'FAILED',
          errorMessage: errors.length ? errors.join('; ') : 'no contact channel available',
        },
      })
      failed += 1
    }
  }

  await recordHeartbeat('scheduled-interrupts', {
    processed: pending.length,
    sent,
    failed,
  })
  return NextResponse.json({ ok: true, processed: pending.length, sent, failed })
}

function resolveFamily(slug: string): { name: string; signature: string } {
  const parsed = parseFamilySlug(slug)
  if (parsed) {
    const f = getFamily(parsed)
    return { name: f.name, signature: f.signature }
  }
  // Defensive fallback — should never hit since the schedule API
  // writes a slug that came straight from buildArchetype, but the
  // model column is a free String so future drift is possible.
  return { name: 'COYL', signature: 'Your danger window is opening.' }
}

function composeBody(family: { name: string; signature: string }, isAccount: boolean): string {
  // Anonymous audit-takers get the sign-up CTA; signed-up users get
  // routed straight into the rescue ritual instead of a funnel they
  // already completed.
  const cta = isAccount
    ? 'Open your rescue: https://coyl.ai/rescue?from=first_catch'
    : 'Lock the full system: https://coyl.ai/sign-up?ref=interrupt'
  return [
    `${family.name}: your danger window is opening now.`,
    `${family.signature} ← this is your script tonight.`,
    'Pause. Walk five minutes. Decide after.',
    cta,
  ].join(' ')
}

function composeSubject(family: { name: string }): string {
  return `${family.name} — your window is opening.`
}
