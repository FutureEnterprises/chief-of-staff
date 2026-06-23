/**
 * /api/v1/waitlist
 *
 * POST — join the waitlist. Body: { email, ref?, archetypeSlug?, source? }
 *   → { position, total, inviteCode, referralCount, spotsPerReferral, alreadyOnList }
 *   Idempotent on email. Crediting the referrer (ref code) bumps THEIR
 *   effective position by SPOTS_PER_REFERRAL.
 *
 * GET ?code=COYL-XXXX — live status for an invite code (the position page
 *   polls this to show "+5" jumps as friends join in real time).
 *
 * Public (no Clerk). Per-IP rate limited. Zod-validated.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { z } from 'zod'
import { prisma } from '@repo/database'
import {
  joinWaitlist,
  getWaitlistStatus,
  getWaitlistTotal,
  hashIp,
  SPOTS_PER_REFERRAL,
  WaitlistRateLimitError,
} from '@/lib/waitlist'
import { renderWaitlistEmail } from '@/lib/email/waitlist-email'
import { checkDistributedRateLimit } from '@/lib/rate-limit'

const joinSchema = z.object({
  email: z.string().email().max(254),
  ref: z.string().min(1).max(32).optional(),
  archetypeSlug: z.string().min(1).max(64).optional(),
  source: z.string().min(1).max(64).optional(),
})

const RATE_LIMIT = 20
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

async function trackWaitlistFunnelEvent(args: {
  kind: 'waitlist_joined' | 'waitlist_referral_joined'
  inviteCode: string
  archetypeSlug: string | null
  source: string | null
  userAgent: string | null
  ipHash: string
}) {
  try {
    await prisma.auditFunnelEvent.create({
      data: {
        sessionId: `waitlist:${args.inviteCode}`.slice(0, 64),
        kind: args.kind,
        archetypeFamily: args.archetypeSlug,
        archetypeSlug: args.archetypeSlug,
        source: args.source,
        userAgent: args.userAgent,
        ipHash: args.ipHash,
      },
    })
  } catch (err) {
    console.warn('[waitlist] funnel event persist failed', {
      err: err instanceof Error ? err.message : 'unknown',
    })
  }
}

export async function POST(req: Request) {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  // Distributed limiter first (authoritative across Fluid Compute
  // instances); fall back to the per-process Map when Upstash is unset.
  const dist = await checkDistributedRateLimit({
    prefix: 'waitlist',
    identifier: ip,
    limit: RATE_LIMIT,
    windowMs: WINDOW_MS,
  })
  if (dist.limited || (!dist.configured && !rateLimit(ip))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let parsed
  try {
    parsed = joinSchema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const ipHash = hashIp(ip)
    const status = await joinWaitlist({
      email: parsed.data.email,
      referredByCode: parsed.data.ref ?? null,
      archetypeSlug: parsed.data.archetypeSlug ?? null,
      source: parsed.data.source ?? null,
      ipHash,
    })
    const total = await getWaitlistTotal()
    const userAgent = hdrs.get('user-agent')?.slice(0, 512) ?? null

    if (!status.alreadyOnList) {
      await trackWaitlistFunnelEvent({
        kind: status.referredByCode ? 'waitlist_referral_joined' : 'waitlist_joined',
        inviteCode: status.inviteCode,
        archetypeSlug: status.archetypeSlug,
        source: status.referredByCode ? 'referral' : parsed.data.source ?? 'direct',
        userAgent,
        ipHash,
      })
    }

    // Fire-and-forget confirmation email — ONLY on a genuinely new join
    // (never on re-join, so refreshes/double-submits don't re-send). The
    // email carries their position + invite link, activating the referral
    // loop. Decoupled from the response; a Resend failure is logged, not
    // surfaced. Guard mirrors api/v1/audit/capture.
    const resendKey = process.env.RESEND_API_KEY
    if (!status.alreadyOnList && resendKey && !resendKey.startsWith('re_...')) {
      try {
        const { subject, html, text } = renderWaitlistEmail({
          position: status.effectivePosition,
          total,
          inviteCode: status.inviteCode,
          archetypeSlug: status.archetypeSlug,
        })
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'COYL <hello@coyl.ai>',
          to: status.email,
          subject,
          html,
          text,
        })
      } catch (err) {
        console.warn('[waitlist] Resend send failed', {
          err: err instanceof Error ? err.message : 'unknown',
        })
      }
    }

    return NextResponse.json(
      {
        position: status.effectivePosition,
        rawPosition: status.joinedPosition,
        total,
        inviteCode: status.inviteCode,
        referralCount: status.referralCount,
        spotsPerReferral: SPOTS_PER_REFERRAL,
        archetypeSlug: status.archetypeSlug,
        alreadyOnList: status.alreadyOnList,
      },
      { status: status.alreadyOnList ? 200 : 201 },
    )
  } catch (err) {
    // Per-IP daily join cap tripped inside joinWaitlist → 429, not 500.
    if (err instanceof WaitlistRateLimitError) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    return NextResponse.json({ error: 'join_failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  const status = await getWaitlistStatus(code)
  if (!status) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const total = await getWaitlistTotal()
  return NextResponse.json({
    position: status.effectivePosition,
    rawPosition: status.joinedPosition,
    total,
    inviteCode: status.inviteCode,
    referralCount: status.referralCount,
    spotsPerReferral: SPOTS_PER_REFERRAL,
    archetypeSlug: status.archetypeSlug,
  })
}
