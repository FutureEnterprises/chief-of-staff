/**
 * POST /api/eap/v1/panic — EAP primitive #10 Panic Switch.
 *
 * The user's "airplane mode of proactive AI." One tap (or one
 * authenticated POST) flips PanicState.active=true for 24h. While
 * panic is active, every LLM-partner ActionRequest + Orchestration
 * is denied at the top of the gate stack regardless of any
 * outstanding ScopeGrant. This is the trust circuit-breaker.
 *
 * Auth: Clerk-only (the user themselves; an LLM partner CANNOT trip
 * panic on the user's behalf).
 *
 * Body (optional):
 *   {
 *     reason?: string,                       // free-form, audit only
 *     durationSec?: number                   // override the default 24h
 *   }
 *
 * Returns:
 *   { ok: true, expiresAt: <ISO> }
 *
 * Writes an EAPAuditEntry with eventKind='panic_triggered'.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma, Prisma } from '@repo/database'

export const maxDuration = 10

const DEFAULT_PANIC_DURATION_SEC = 24 * 60 * 60 // 24h
const MAX_PANIC_DURATION_SEC = 7 * 24 * 60 * 60 // 7d cap as a sanity bound

type PanicBody = {
  reason?: string
  durationSec?: number
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: PanicBody = {}
  try {
    const json = await req.json()
    if (json && typeof json === 'object') body = json as PanicBody
  } catch {
    // empty body is fine — defaults to 24h, no reason
  }

  let durationSec = DEFAULT_PANIC_DURATION_SEC
  if (typeof body.durationSec === 'number' && body.durationSec > 0) {
    durationSec = Math.min(body.durationSec, MAX_PANIC_DURATION_SEC)
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + durationSec * 1000)
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 280) : null

  // Upsert: one PanicState row per user (unique on userId). Toggling
  // panic on while it's already active simply extends the window.
  await prisma.panicState.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      active: true,
      activatedAt: now,
      expiresAt,
      reason,
    },
    update: {
      active: true,
      activatedAt: now,
      expiresAt,
      reason,
    },
  })

  const ip = await getRequestIp()
  await prisma.eAPAuditEntry
    .create({
      data: {
        userId: user.id,
        llmPartnerId: null,
        eventKind: 'panic_triggered',
        referenceId: null,
        payloadJson: {
          durationSec,
          reason,
          expiresAt: expiresAt.toISOString(),
        } as Prisma.InputJsonValue,
        ipAddress: ip,
      },
    })
    .catch(() => {
      // never let audit failure prevent the panic from latching
    })

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() })
}

async function getRequestIp(): Promise<string | null> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    null
  )
}
