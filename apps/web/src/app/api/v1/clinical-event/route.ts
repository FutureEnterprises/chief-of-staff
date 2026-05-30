/**
 * POST /api/v1/clinical-event
 *
 * Server-side ingest for PHI-adjacent free-tier events from the iOS
 * app (and future mobile surfaces). Marketing-funnel events route
 * elsewhere — see /api/v1/audit/event and the client-side PostHog
 * path in posthog-client.ts.
 *
 * Auth model today (May 30 2026 — Month 1 of v3 plan):
 *   - No auth required. The events are anonymous-id keyed.
 *   - Per-IP rate limiting prevents abuse.
 *   - The `anonymousUserId` is the SHA-256 of (raw user id + per-deploy
 *     salt) generated client-side. We trust the client to do that.
 *
 * Auth model when iOS app ships to TestFlight (Month 4-5):
 *   - Require a short-lived ingest token issued by /api/v1/uap/v1/grant.
 *   - Tie the token to the anonymousUserId so a client can't impersonate
 *     another user's anonymous id.
 *   - See docs/protocol/UAP-0.1.md §EXECUTE for the auth contract.
 *
 * Schema validation: the event body is the discriminated-union
 * payload from free-tier-events.ts, validated by name+props shape.
 * Reject anything that doesn't match — we never write unknown JSON
 * to ClinicalEvent.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { trackFreeTierEvent } from '@/lib/telemetry/track-free-tier'
import { FreeTierEventName } from '@/lib/telemetry/free-tier-events'

const baseProps = z.object({
  anonymousUserId: z.string().min(16).max(128),
  clientTimestamp: z.string().datetime(),
  surface: z.enum(['ios', 'apple-watch', 'android', 'wear-android', 'web']),
  buildVersion: z.string().min(1).max(32),
})

// Each clinical event has its own props shape. The union is exhaustive
// — any new clinical event added to free-tier-events.ts must also be
// added here, or the validator will reject it.
const bodySchema = z.discriminatedUnion('name', [
  z.object({
    name: z.literal(FreeTierEventName.APP_OPENED),
    props: baseProps.extend({ sessionNumber: z.number().int().nonnegative() }),
  }),
  z.object({
    name: z.literal(FreeTierEventName.DANGER_WINDOW_DETECTED),
    props: baseProps.extend({
      archetypeSlug: z.string().min(1).max(64),
      windowLabel: z.string().min(1).max(64),
      confidence: z.number().min(0).max(1),
    }),
  }),
  z.object({
    name: z.literal(FreeTierEventName.INTERRUPT_FIRED),
    props: baseProps.extend({
      interruptId: z.string().min(1).max(64),
      archetypeSlug: z.string().min(1).max(64),
      latencyMs: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    name: z.literal(FreeTierEventName.INTERRUPT_CHANGED_BEHAVIOR),
    props: baseProps.extend({
      interruptId: z.string().min(1).max(64),
      userReportedOutcome: z.enum(['changed', 'no_change', 'partial']),
    }),
  }),
  z.object({
    name: z.literal(FreeTierEventName.SLIP_REPORTED),
    props: baseProps.extend({ archetypeSlug: z.string().min(1).max(64) }),
  }),
  z.object({
    name: z.literal(FreeTierEventName.RECOVERY_COMPLETED),
    props: baseProps.extend({
      archetypeSlug: z.string().min(1).max(64),
      minutesFromSlip: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    name: z.literal(FreeTierEventName.KILL_SWITCH_FIRED),
    props: baseProps,
  }),
])

const RATE_LIMIT = 60
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

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

export async function POST(req: Request) {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let parsed
  try {
    const body = await req.json()
    parsed = bodySchema.safeParse(body)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    await trackFreeTierEvent(parsed.data, hashIp(ip))
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (err) {
    // Don't expose internal error details — the client doesn't need
    // them, and they could leak schema info.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[clinical-event] persist failed:', err)
    }
    return NextResponse.json({ error: 'persist_failed' }, { status: 500 })
  }
}
