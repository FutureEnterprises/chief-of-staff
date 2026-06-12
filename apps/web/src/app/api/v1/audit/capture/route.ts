/**
 * POST /api/v1/audit/capture
 *
 * Lower-commitment companion to /api/v1/audit/schedule. Captures an
 * email + archetype from a visitor who finished /audit and wants to
 * "email me my result" without scheduling a real SMS/email interrupt.
 *
 * Two side-effects:
 *   1. Persists an AuditLead row (so the founder can attribute viral
 *      acquisition by archetype, wedge, and source).
 *   2. Fires a one-shot result email through Resend with the visitor's
 *      family + signature + three interrupts + a sign-up CTA.
 *
 * Public route, no auth. Per-IP rate limit (5 per 10 minutes) — same
 * default as /api/v1/audit/schedule. The email send is best-effort;
 * a Resend failure does NOT 500 the request.
 *
 * Returns 200 with { ok: true } on success even if the email send
 * silently failed, so the visitor doesn't see a scary error after they
 * just gave us their email. Server logs capture the failure.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { createHash } from 'node:crypto'
import { Resend } from 'resend'
import { prisma } from '@repo/database'
import { renderAuditResultEmail } from '@/lib/audit-result-email'
import type { WedgeId, WindowId, ScriptId } from '@/lib/audit-archetype'
import { checkDistributedRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email().max(254),
  archetypeFamily: z.string().min(1).max(64),
  archetypeSlug: z.string().min(1).max(64).optional(),
  wedge: z.enum(['weight', 'work', 'destructive', 'consistency', 'spending', 'focus']),
  window: z.enum(['morning', 'afternoon', 'afterwork', 'latenight']),
  script: z.enum(['reward', 'delay', 'collapse', 'minimize', 'exhaustion', 'social']),
  source: z.string().max(64).optional(),
})

const RATE_LIMIT = 5
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

  // Distributed limiter first (cross-instance under Fluid Compute);
  // fall back to the per-process Map when Upstash is unset.
  const dist = await checkDistributedRateLimit({
    prefix: 'audit-capture',
    identifier: ip,
    limit: RATE_LIMIT,
    windowMs: WINDOW_MS,
  })
  if (dist.limited || (!dist.configured && !rateLimit(ip))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data
  const userAgent = hdrs.get('user-agent')?.slice(0, 512) ?? null

  const row = await prisma.auditLead.create({
    data: {
      email: data.email.toLowerCase(),
      archetypeFamily: data.archetypeFamily,
      archetypeSlug: data.archetypeSlug ?? null,
      wedge: data.wedge,
      window: data.window,
      script: data.script,
      source: data.source ?? null,
      userAgent,
      ipHash: ip !== 'anonymous' ? hashIp(ip) : null,
    },
    select: { id: true },
  })

  // Fire-and-forget result email. We persisted the lead already; the
  // visitor's response is decoupled from Resend's. A failure here is
  // logged but never surfaces to the user.
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && !resendKey.startsWith('re_...')) {
    try {
      const { subject, html, text } = renderAuditResultEmail({
        wedge: data.wedge as WedgeId,
        window: data.window as WindowId,
        script: data.script as ScriptId,
      })
      const resend = new Resend(resendKey)
      const result = await resend.emails.send({
        from: 'COYL <hello@coyl.ai>',
        to: data.email,
        subject,
        html,
        text,
      })
      await prisma.auditLead.update({
        where: { id: row.id },
        data: {
          emailSentAt: new Date(),
          emailMessageId: result.data?.id ?? null,
        },
      })
    } catch (err) {
      console.warn('[audit/capture] Resend send failed', {
        leadId: row.id,
        err: err instanceof Error ? err.message : 'unknown',
      })
    }
  } else {
    console.log('[audit/capture] RESEND_API_KEY not configured — lead saved, email skipped', {
      leadId: row.id,
    })
  }

  return NextResponse.json({ ok: true, id: row.id })
}
