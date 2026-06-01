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
import { z } from 'zod'
import {
  joinWaitlist,
  getWaitlistStatus,
  getWaitlistTotal,
  hashIp,
  SPOTS_PER_REFERRAL,
} from '@/lib/waitlist'

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

export async function POST(req: Request) {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
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
    const status = await joinWaitlist({
      email: parsed.data.email,
      referredByCode: parsed.data.ref ?? null,
      archetypeSlug: parsed.data.archetypeSlug ?? null,
      source: parsed.data.source ?? null,
      ipHash: hashIp(ip),
    })
    const total = await getWaitlistTotal()
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
  } catch {
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
