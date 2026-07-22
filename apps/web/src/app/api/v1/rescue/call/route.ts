import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { RescueTrigger } from '@repo/database'
import { hasFeature } from '@/lib/services/entitlement.service'
import { checkDistributedRateLimit } from '@/lib/rate-limit'
import { VALID_TRIGGERS } from '@/lib/rescue-triggers'
import { initiateVoiceCall } from '@/lib/twilio-voice'

export const maxDuration = 20

/**
 * POST /api/v1/rescue/call — "Call me now."
 *
 * The Precision Interrupt Hotline's on-demand entry point. Same gate as
 * text /api/v1/rescue (rescueFlows feature), but places a real phone
 * call instead of streaming a chat response. Rate-limited separately
 * from the AI-assist quota (3/day) because the cost driver here is
 * Twilio per-minute voice pricing, not LLM tokens — a user shouldn't
 * burn their monthly text-rescue allowance on a phone call, and voice
 * calls need their own, tighter abuse ceiling regardless of plan.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, name: true, phoneNumber: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'rescueFlows')
  if (!canUse) {
    return NextResponse.json(
      { error: 'feature_gated', feature: 'rescueFlows', message: 'The rescue hotline is a Core feature.' },
      { status: 402 },
    )
  }

  if (!user.phoneNumber) {
    return NextResponse.json(
      { error: 'phone_required', message: 'Add your phone number to use the rescue hotline.' },
      { status: 400 },
    )
  }

  const { limited } = await checkDistributedRateLimit({
    prefix: 'rescue-call',
    identifier: user.id,
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
  })
  if (limited) {
    return NextResponse.json(
      { error: 'too_many_calls', message: "You've used today's rescue calls. Try the text rescue instead." },
      { status: 429 },
    )
  }

  const { trigger } = (await req.json().catch(() => ({}))) as { trigger?: string }
  if (!trigger || !VALID_TRIGGERS.includes(trigger as (typeof VALID_TRIGGERS)[number])) {
    return NextResponse.json({ error: 'invalid_trigger' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'

  const rescueSession = await prisma.rescueSession.create({
    data: { userId: user.id, trigger: trigger as RescueTrigger, intervention: {} },
    select: { id: true },
  })

  const call = await prisma.voiceCallSession.create({
    data: {
      userId: user.id,
      rescueSessionId: rescueSession.id,
      kind: 'RESCUE_ON_DEMAND',
      trigger: trigger as RescueTrigger,
    },
  })

  const result = await initiateVoiceCall({
    to: user.phoneNumber,
    twimlUrl: `${appUrl}/api/v1/voice/twiml?session=${call.id}`,
    statusCallbackUrl: `${appUrl}/api/v1/voice/status?session=${call.id}`,
  })

  if (!result.ok) {
    await prisma.voiceCallSession.update({
      where: { id: call.id },
      data: { status: 'FAILED', endedAt: new Date() },
    })
    return NextResponse.json({ error: 'call_failed', detail: result.error }, { status: 502 })
  }

  await Promise.all([
    prisma.voiceCallSession.update({
      where: { id: call.id },
      data: { callSid: result.callSid, status: 'RINGING' },
    }),
    prisma.productivityEvent.create({
      data: {
        userId: user.id,
        eventType: 'RESCUE_TRIGGERED',
        eventValue: trigger,
        metadataJson: { sessionId: rescueSession.id, channel: 'voice', callSessionId: call.id },
      },
    }),
  ])

  return NextResponse.json({ ok: true, callSessionId: call.id })
}
