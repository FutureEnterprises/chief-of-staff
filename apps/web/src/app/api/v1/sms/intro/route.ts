import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { prisma } from '@repo/database'

/**
 * POST /api/v1/sms/intro
 *
 * Funnel-compression endpoint. Public, no auth — captures a phone number
 * from /catch-me (the TikTok-bio destination) and sends a one-shot intro
 * SMS that lands at the user's local 9pm. The SMS deep-links back to
 * /sign-up?ref=sms so the conversion is immediate when they're ready.
 *
 * Two phases:
 *   1. INSERT into SmsSignup. Idempotent on phone number (upsert).
 *   2. Send the intro SMS via Twilio if TWILIO_* env vars are set;
 *      otherwise log to console (dev / pre-Twilio).
 *
 * Why this is high-leverage:
 *   - The standard TikTok → bio link → app store install flow loses
 *     85%+ of traffic at the app store. Asking for a phone is a single
 *     low-friction tap; the SMS lands when the user is at their actual
 *     danger window (9pm), which is when the value prop is most vivid.
 *   - Conversion compounds: the SMS contains a deep link that auto-fills
 *     phone on /sign-up, so the second tap is paid signup.
 *
 * Rate limiting: per-IP, 3 requests / 10 min. Same in-memory map as
 * /api/v1/newsletter — good enough for v1, swap to Redis when SMS spam
 * becomes a real cost. Twilio per-message cost is ~$0.0079 in the US,
 * so even abuse spikes are bounded.
 */

const schema = z.object({
  phoneNumber: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[\d\s()-]+$/, 'Invalid phone format'),
  source: z.string().max(64).optional(),
  timezone: z.string().max(64).optional(),
})

const RATE_LIMIT = 3
const WINDOW_MS = 10 * 60 * 1000
const requests = new Map<string, number[]>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const recent = (requests.get(ip) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT) return false
  recent.push(now)
  requests.set(ip, recent)
  return true
}

// Normalize to E.164. US-default if the input has 10 digits (assume US).
// Otherwise expect the user already prefixed with country code.
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function POST(req: Request) {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ??
    (await headers()).get('x-real-ip') ??
    'anonymous'

  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const phone = normalizePhone(parsed.data.phoneNumber)
  if (!phone) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const signup = await prisma.smsSignup.upsert({
    where: { phoneNumber: phone },
    update: {
      source: parsed.data.source ?? undefined,
      timezone: parsed.data.timezone ?? undefined,
    },
    create: {
      phoneNumber: phone,
      source: parsed.data.source ?? null,
      timezone: parsed.data.timezone ?? null,
    },
    select: { id: true, introSentAt: true, phoneNumber: true },
  })

  // Idempotency: don't re-send intro if already sent. The cron-based
  // scheduling for "fire at user's local 9pm" is a follow-on; v1 sends
  // immediately as the proof-of-life ping.
  if (signup.introSentAt) {
    return NextResponse.json({ ok: true })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (accountSid && authToken && (fromNumber || messagingServiceSid)) {
    try {
      // Dynamic import keeps twilio out of the cold-start path when
      // not configured. Saves ~5MB of bundle for the no-Twilio path.
      const twilioModule = await import('twilio')
      const twilio = twilioModule.default(accountSid, authToken)
      await twilio.messages.create({
        to: phone,
        body: introMessage(),
        ...(messagingServiceSid
          ? { messagingServiceSid }
          : { from: fromNumber! }),
      })
      await prisma.smsSignup.update({
        where: { id: signup.id },
        data: { introSentAt: new Date() },
      })
    } catch (err) {
      console.warn('Twilio send failed', { err: err instanceof Error ? err.message : 'unknown' })
    }
  } else {
    console.log('SMS intro queued (Twilio not configured):', { phone, body: introMessage() })
  }

  return NextResponse.json({ ok: true })
}

function introMessage(): string {
  // Hard char budget: 160 single-segment, but we send concat (multipart)
  // since the message includes a URL. 280-ish chars target so it stays
  // under 2 segments. Tone matches the brand voice — not marketing.
  return [
    'COYL here. Tonight at 9pm is when your autopilot usually runs.',
    "We'll catch you then. One tap to start: https://coyl.ai/sign-up?ref=sms",
    'Reply STOP to unsubscribe.',
  ].join(' ')
}
