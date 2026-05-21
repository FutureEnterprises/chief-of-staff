import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { Resend } from 'resend'
import { verifyCronAuth } from '@/lib/cron-auth'
import { getFamily, parseFamilySlug } from '@/lib/audit-archetype'

export const maxDuration = 60

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
 *   - Email via Resend — if an email is on the row AND RESEND_API_KEY
 *     is configured.
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

  for (const row of pending) {
    const family = resolveFamily(row.archetypeFamily)
    const body = composeBody(family)
    const subject = composeSubject(family)
    const errors: string[] = []
    let dispatched = false

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
      } catch (err) {
        errors.push(`sms: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    } else if (row.phoneNumber && !twilio) {
      // Phone was captured but no SMS provider configured — fall through
      // to email if available; otherwise this row will FAIL below.
      errors.push('sms: provider not configured')
    }

    if (row.email && resend) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: row.email,
          subject,
          text: body,
        })
        dispatched = true
      } catch (err) {
        errors.push(`email: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    } else if (row.email && !resend) {
      errors.push('email: provider not configured')
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

function composeBody(family: { name: string; signature: string }): string {
  return [
    `${family.name}: your danger window is opening now.`,
    `${family.signature} ← this is your script tonight.`,
    'Pause. Walk five minutes. Decide after.',
    'Lock the full system: https://coyl.ai/sign-up?ref=interrupt',
  ].join(' ')
}

function composeSubject(family: { name: string }): string {
  return `${family.name} — your window is opening.`
}
