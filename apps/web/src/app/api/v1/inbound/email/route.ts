import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@repo/database'

/**
 * POST /api/v1/inbound/email
 *
 * Resend inbound-email webhook receiver. Closes the loop on user-defined
 * check-ins sent over EMAIL: when the cron at /api/cron/custom-checkins
 * emails a check-in, the user can reply and that reply lands here via
 * Resend's inbound-parse webhook.
 *
 * Public route — must be listed in isPublicRoute in apps/web/src/proxy.ts
 * because Resend cannot send a Clerk JWT. Authentication is provided by
 * the Svix signature headers (Resend signs all webhooks with Svix); we
 * verify with RESEND_WEBHOOK_SECRET.
 *
 * Reference: https://resend.com/docs/dashboard/webhooks/introduction
 *
 * Pipeline:
 *   1. Verify svix-id / svix-timestamp / svix-signature headers.
 *   2. Parse the inbound-event payload (event type + data envelope).
 *   3. Resolve User by from-email (case-insensitive exact match on
 *      User.email).
 *   4. Find the most recent CheckinSchedule we sent that user in the
 *      last 12 hours (best-effort link to originScheduleId).
 *   5. Write an InboundMessage row (channel=EMAIL, processed=false).
 *
 * Edge cases:
 *   - No matching User → drop silently with 200 so Resend doesn't retry.
 *   - Svix signature invalid → 400. Resend retries with backoff.
 *   - Resend sends both delivery + inbound events on the same webhook
 *     URL; we only persist inbound events (email.inbound.* or whatever
 *     shape Resend ships). All other event types are ack'd 200.
 */

// Note: do NOT add `export const dynamic = 'force-dynamic'` — Next 16
// with cacheComponents enabled (see next.config.ts) rejects that route
// segment config at build time. Routes are dynamic by default unless
// they declare `'use cache'`, so the inbound webhook is dynamic
// automatically without the explicit flag.
export const maxDuration = 30

type ResendInboundPayload = {
  type?: string
  data?: {
    from?: string | { email?: string; name?: string }
    to?: string | string[] | { email?: string }[]
    subject?: string
    text?: string
    html?: string
    headers?: Record<string, string>
    messageId?: string
    message_id?: string
    [k: string]: unknown
  }
}

/**
 * Pluck the bare "user@host" address out of whatever shape Resend hands
 * us. Resend currently ships `from` as either a string ("Name <a@b.com>")
 * or a structured `{ email, name }` object depending on event type.
 */
function extractEmailAddress(input: unknown): string | null {
  if (!input) return null
  if (typeof input === 'string') {
    // Pull "<addr>" first, else the whole trimmed value if it looks like an email.
    const angle = input.match(/<([^>]+)>/)
    const candidate = (angle?.[1] ?? input).trim()
    return candidate.includes('@') ? candidate.toLowerCase() : null
  }
  if (typeof input === 'object' && input !== null) {
    const obj = input as { email?: unknown }
    if (typeof obj.email === 'string' && obj.email.includes('@')) {
      return obj.email.trim().toLowerCase()
    }
  }
  return null
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'RESEND_WEBHOOK_SECRET not configured' },
      { status: 503 },
    )
  }

  const h = await headers()
  const svixId = h.get('svix-id')
  const svixTimestamp = h.get('svix-timestamp')
  const svixSignature = h.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const rawBody = await req.text()
  const wh = new Webhook(secret)
  let evt: ResendInboundPayload
  try {
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendInboundPayload
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // Only handle inbound-parsed events. Delivery / bounce / open / click
  // events arrive on the same webhook URL but aren't relevant here.
  const type = (evt.type ?? '').toLowerCase()
  if (!type.startsWith('email.inbound') && !type.startsWith('inbound.')) {
    return NextResponse.json({ ok: true, skipped: type || 'unknown' })
  }

  const data = evt.data ?? {}
  const fromEmail = extractEmailAddress(data.from)
  const textBody = (typeof data.text === 'string' && data.text.trim().length > 0
    ? data.text
    : typeof data.html === 'string'
      ? data.html
      : ''
  ).trim()

  if (!fromEmail || !textBody) {
    return NextResponse.json({ ok: true, skipped: 'no_from_or_body' })
  }

  // Match by User.email — Prisma's @unique on User.email makes this an
  // O(1) lookup. Case-insensitive: we lowercased fromEmail above and
  // store User.email as-entered, so use Prisma's `equals` with `mode`.
  const user = await prisma.user.findFirst({
    where: { email: { equals: fromEmail, mode: 'insensitive' } },
    select: { id: true },
  })
  if (!user) {
    // No matching user — drop silently. Common for catch-all aliases or
    // forwarded threads from external addresses.
    return NextResponse.json({ ok: true, skipped: 'no_matching_user' })
  }

  // Best-effort link to the most recent CheckinSchedule we sent the user
  // in the last 12 hours.
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
  const recentSchedule = await prisma.checkinSchedule.findFirst({
    where: {
      userId: user.id,
      lastFiredAt: { gte: twelveHoursAgo, not: null },
    },
    orderBy: { lastFiredAt: 'desc' },
    select: { id: true },
  })

  await prisma.inboundMessage.create({
    data: {
      userId: user.id,
      channel: 'EMAIL',
      fromAddress: fromEmail,
      body: textBody.slice(0, 8000),
      originScheduleId: recentSchedule?.id ?? null,
      processed: false,
      metadata: {
        subject: typeof data.subject === 'string' ? data.subject.slice(0, 300) : null,
        messageId: data.messageId ?? data.message_id ?? null,
        svixId,
        eventType: type,
      },
    },
  })

  return NextResponse.json({ ok: true })
}
