/**
 * POST /api/v1/audit/event
 *
 * Anonymous funnel telemetry receiver. Client-side beacons in
 * audit-view.tsx fire here at each funnel stage:
 *
 *   started         — visitor selected the first question on /audit
 *   completed       — third question answered, result revealed
 *   email_captured  — also written via /capture; we still log here
 *                     for symmetric drop-off math
 *   signup_started  — visitor clicked a sign-up CTA from the result
 *
 * sessionId is a client-generated cookie that lives 24h, scoped to
 * the audit funnel only. It's the funnel-join key so the admin
 * dashboard can compute step-to-step conversion without a userId.
 *
 * Per-IP rate-limited (40 per 10 minutes — higher than the capture
 * endpoint because each visitor fires ~4 events through the funnel).
 *
 * Best-effort. We do not error the response on bad payload — the
 * caller is a beacon that doesn't care, and we don't want to break
 * the audit experience if telemetry hiccups.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { createHash } from 'node:crypto'
import { prisma } from '@repo/database'

const schema = z.object({
  sessionId: z.string().min(1).max(64),
  kind: z.enum(['started', 'completed', 'email_captured', 'signup_started']),
  archetypeFamily: z.string().min(1).max(64).optional(),
  archetypeSlug: z.string().min(1).max(64).optional(),
  wedge: z.string().min(1).max(32).optional(),
  window: z.string().min(1).max(16).optional(),
  script: z.string().min(1).max(32).optional(),
  source: z.string().min(1).max(64).optional(),
})

const RATE_LIMIT = 40
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
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
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

  const data = parsed.data
  const userAgent = hdrs.get('user-agent')?.slice(0, 512) ?? null

  try {
    await prisma.auditFunnelEvent.create({
      data: {
        sessionId: data.sessionId,
        kind: data.kind,
        archetypeFamily: data.archetypeFamily ?? null,
        archetypeSlug: data.archetypeSlug ?? null,
        wedge: data.wedge ?? null,
        window: data.window ?? null,
        script: data.script ?? null,
        source: data.source ?? null,
        userAgent,
        ipHash: ip !== 'anonymous' ? hashIp(ip) : null,
      },
    })
  } catch (err) {
    console.warn('[audit/event] persist failed', {
      err: err instanceof Error ? err.message : 'unknown',
    })
  }

  return NextResponse.json({ ok: true })
}
