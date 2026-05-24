import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { headers } from 'next/headers'
import { prisma } from '@repo/database'

/**
 * POST /api/v1/inbound/twilio
 *
 * Twilio inbound-SMS webhook receiver. Closes the loop on user-defined
 * check-ins: when the cron at /api/cron/custom-checkins fires an SMS to
 * the user's phone, the user can text back and that reply lands here.
 *
 * Public route — must be listed in isPublicRoute in apps/web/src/proxy.ts
 * because Twilio cannot send a Clerk JWT. Authentication is provided by
 * the X-Twilio-Signature header (HMAC-SHA1 of URL + sorted form params
 * keyed by TWILIO_AUTH_TOKEN), validated below.
 *
 * Pipeline:
 *   1. Verify X-Twilio-Signature. Reject 403 on mismatch.
 *   2. Parse the form-encoded body (From, Body, To, MessageSid, …).
 *   3. Resolve the User by phone via SmsSignup.convertedUserId.
 *   4. Find the most recent CheckinSchedule we sent that user in the
 *      last 12 hours (best-effort link to originScheduleId).
 *   5. Write an InboundMessage row (channel=SMS, processed=false).
 *   6. Reply with an empty TwiML <Response/> so Twilio doesn't auto-text
 *      the user back. The /api/cron/inbound-process cron picks it up
 *      within ~5 min and routes it through excuse-detection.
 *
 * Twilio webhook security: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Edge cases:
 *   - No SmsSignup row for this phone → drop the row silently (200 with
 *     empty TwiML; we still return success so Twilio doesn't retry).
 *   - Twilio signature invalid → 403. Twilio retries with backoff.
 *   - No CheckinSchedule fired in the last 12h → originScheduleId stays
 *     null. The inbound is still captured for the excuse-detection pass.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Compute the expected X-Twilio-Signature value the way Twilio's own
 * helper library does:
 *   1. Take the full request URL.
 *   2. Sort the POST params by key and append each "<key><value>" pair.
 *   3. HMAC-SHA1 the result with TWILIO_AUTH_TOKEN, base64-encode.
 * Then compare to the X-Twilio-Signature header in constant time.
 */
function expectedTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string,
): string {
  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) {
    data += key + params[key]
  }
  return createHmac('sha1', authToken).update(data).digest('base64')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Empty TwiML reply. Twilio accepts an empty <Response/> as "no reply
 * needed" — keeps us from accidentally auto-texting the user back when
 * they reply to a check-in.
 */
function twimlEmpty(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function POST(req: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    // Not configured; refuse rather than silently accept unauthed input.
    return NextResponse.json(
      { error: 'TWILIO_AUTH_TOKEN not configured' },
      { status: 503 },
    )
  }

  // Twilio posts application/x-www-form-urlencoded.
  let bodyText: string
  try {
    bodyText = await req.text()
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  }

  const params: Record<string, string> = {}
  const usp = new URLSearchParams(bodyText)
  for (const [k, v] of usp.entries()) params[k] = v

  // Build the URL Twilio used to sign. Twilio signs against the URL the
  // webhook was POSTed to — prefer the public URL from x-forwarded-host
  // (Vercel sets this) over req.url (which may be the internal alias).
  const h = await headers()
  const forwardedHost = h.get('x-forwarded-host') ?? h.get('host')
  const forwardedProto = h.get('x-forwarded-proto') ?? 'https'
  const reqUrl = new URL(req.url)
  const url = forwardedHost
    ? `${forwardedProto}://${forwardedHost}${reqUrl.pathname}${reqUrl.search}`
    : req.url

  const providedSig = h.get('x-twilio-signature') ?? ''
  const expectedSig = expectedTwilioSignature(url, params, authToken)
  if (!providedSig || !constantTimeEqual(providedSig, expectedSig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const fromPhone = (params.From ?? '').trim()
  const body = (params.Body ?? '').trim()
  const messageSid = params.MessageSid ?? null
  if (!fromPhone || !body) {
    // Signature was valid but payload was malformed; ack so Twilio doesn't
    // retry, but no DB write.
    return twimlEmpty()
  }

  // Resolve the User behind this phone via SmsSignup.convertedUserId.
  const signup = await prisma.smsSignup.findUnique({
    where: { phoneNumber: fromPhone },
    select: { convertedUserId: true },
  })
  const userId = signup?.convertedUserId ?? null
  if (!userId) {
    // No linked user — drop silently. This commonly happens for inbound
    // STOP replies from anonymous /catch-me captures who never converted.
    return twimlEmpty()
  }

  // Best-effort link to the most recent CheckinSchedule we sent the user
  // in the last 12 hours.
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
  const recentSchedule = await prisma.checkinSchedule.findFirst({
    where: {
      userId,
      lastFiredAt: { gte: twelveHoursAgo, not: null },
    },
    orderBy: { lastFiredAt: 'desc' },
    select: { id: true },
  })

  await prisma.inboundMessage.create({
    data: {
      userId,
      channel: 'SMS',
      fromAddress: fromPhone,
      body: body.slice(0, 4000),
      originScheduleId: recentSchedule?.id ?? null,
      processed: false,
      metadata: {
        messageSid,
        to: params.To ?? null,
        accountSid: params.AccountSid ?? null,
        numMedia: params.NumMedia ?? null,
      },
    },
  })

  return twimlEmpty()
}
