import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import type { VoiceCallStatus } from '@repo/database'
import { verifyTwilioWebhook } from '@/lib/twilio-signature'

/**
 * POST /api/v1/voice/status?session=<VoiceCallSession.id>
 *
 * Twilio's call-lifecycle statusCallback webhook. Public route (same
 * signature-based auth as /api/v1/voice/twiml) — updates VoiceCallSession
 * status as the call rings, connects, and ends. Twilio may POST this
 * several times per call (once per lifecycle event); each POST is
 * idempotent — it just overwrites status with the latest CallStatus.
 */
export const maxDuration = 10

const STATUS_MAP: Record<string, VoiceCallStatus> = {
  queued: 'INITIATED',
  initiated: 'INITIATED',
  ringing: 'RINGING',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED',
  busy: 'BUSY',
  failed: 'FAILED',
  'no-answer': 'NO_ANSWER',
  canceled: 'FAILED',
}

const TERMINAL: readonly VoiceCallStatus[] = ['COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY']

export async function POST(req: Request) {
  const verified = await verifyTwilioWebhook(req)
  if (!verified) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  const { params } = verified

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session')
  if (!sessionId) return NextResponse.json({ ok: true })

  const callStatus = typeof params.CallStatus === 'string' ? params.CallStatus : null
  const mapped = callStatus ? STATUS_MAP[callStatus] : undefined
  if (!mapped) return NextResponse.json({ ok: true })

  await prisma.voiceCallSession
    .update({
      where: { id: sessionId },
      data: {
        status: mapped,
        callSid: typeof params.CallSid === 'string' ? params.CallSid : undefined,
        ...(TERMINAL.includes(mapped) ? { endedAt: new Date() } : {}),
      },
    })
    .catch(() => {
      // Session may not exist (bad/expired id) — Twilio doesn't need to
      // know; ack so it doesn't retry.
    })

  return NextResponse.json({ ok: true })
}
