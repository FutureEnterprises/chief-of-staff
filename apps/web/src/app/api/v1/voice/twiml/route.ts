import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyTwilioWebhook } from '@/lib/twilio-signature'
import { twimlSayAndGather, twimlSayAndHangup } from '@/lib/twilio-voice'
import { composeVoiceLine, type VoiceStep } from '@/lib/services/voice-composer.service'
import { archetypeForUser } from '@/lib/services/intervention-composer.service'

/**
 * POST /api/v1/voice/twiml?session=<VoiceCallSession.id>&step=<beat>
 *
 * The Precision Interrupt Hotline's TwiML turn machine. Twilio's webhook
 * is stateless per-request — this route reloads the VoiceCallSession row
 * on every POST to know which of the four scripted beats (open -> react
 * -> action -> commit) it's on, composes that beat's line, and returns
 * TwiML telling Twilio to say it and gather the next beat.
 *
 * Public route (Twilio can't send a Clerk JWT) — authenticated instead
 * by X-Twilio-Signature, verified in twilio-signature.ts. Must be listed
 * in isPublicRoute + SHOULD_BYPASS_CLERK in proxy.ts.
 */
export const maxDuration = 15

const STEP_ORDER: readonly VoiceStep[] = ['open', 'react', 'action', 'commit']
const NEXT_STEP: Record<VoiceStep, VoiceStep | null> = {
  open: 'react',
  react: 'action',
  action: 'commit',
  commit: null,
}

function isVoiceStep(value: string): value is VoiceStep {
  return (STEP_ORDER as readonly string[]).includes(value)
}

function hangupNow(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function xmlResponse(body: string): NextResponse {
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/xml' } })
}

export async function POST(req: Request) {
  const verified = await verifyTwilioWebhook(req)
  if (!verified) return new NextResponse('Forbidden', { status: 403 })
  const { params } = verified

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session')
  const stepParam = url.searchParams.get('step') ?? 'open'
  const step: VoiceStep = isVoiceStep(stepParam) ? stepParam : 'open'
  if (!sessionId) return hangupNow()

  const call = await prisma.voiceCallSession.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          name: true,
          primaryWedge: true,
          excuseStyle: true,
          toneMode: true,
          driveProfile: true,
          replacementMenu: true,
        },
      },
    },
  })
  // Dead/unknown session, or a stale webhook arriving after we already
  // closed this call out — hang up rather than re-running the script.
  if (!call || call.status === 'COMPLETED' || call.status === 'FAILED') return hangupNow()

  type TranscriptTurn = { role: 'coyl' | 'user'; text: string; at: string }
  const existingTranscript: TranscriptTurn[] = Array.isArray(call.transcript)
    ? (call.transcript as unknown as TranscriptTurn[])
    : []

  const whatTheyJustSaid = typeof params.SpeechResult === 'string' ? params.SpeechResult.trim() || null : null
  const now = new Date()
  const transcript = [...existingTranscript]
  if (whatTheyJustSaid) {
    transcript.push({ role: 'user', text: whatTheyJustSaid, at: now.toISOString() })
  }

  const archetype = archetypeForUser(call.user.primaryWedge, call.user.excuseStyle)
  const firstName = call.user.name.trim().split(/\s+/)[0] || 'you'

  const line = await composeVoiceLine(step, {
    firstName,
    trigger: call.trigger,
    windowLabel: call.contextLabel,
    archetypeName: archetype?.name ?? null,
    archetypeSignature: archetype?.signature ?? null,
    excuseStyle: call.user.excuseStyle,
    toneMode: call.user.toneMode,
    driveProfile: call.user.driveProfile,
    replacementMenu: call.user.replacementMenu,
    whatTheyJustSaid,
    priorLines: transcript.filter((t) => t.role === 'coyl').map((t) => t.text),
  })
  transcript.push({ role: 'coyl', text: line, at: now.toISOString() })

  const callSid = typeof params.CallSid === 'string' ? params.CallSid : call.callSid
  const nextStep = NEXT_STEP[step]

  if (!nextStep) {
    // Final beat. Persist the full transcript onto the linked
    // RescueSession so a phone rescue shows up in the same analytics
    // pipeline as a text rescue's `intervention` field.
    await Promise.all([
      prisma.voiceCallSession.update({
        where: { id: call.id },
        data: { transcript, status: 'IN_PROGRESS', callSid: callSid ?? undefined },
      }),
      call.rescueSessionId
        ? prisma.rescueSession.update({
            where: { id: call.rescueSessionId },
            data: { intervention: { channel: 'voice', transcript } },
          })
        : Promise.resolve(),
    ])
    return xmlResponse(twimlSayAndHangup(line))
  }

  await prisma.voiceCallSession.update({
    where: { id: call.id },
    data: { transcript, status: 'IN_PROGRESS', callSid: callSid ?? undefined },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  return xmlResponse(
    twimlSayAndGather({
      line,
      actionUrl: `${appUrl}/api/v1/voice/twiml?session=${call.id}&step=${nextStep}`,
      fallbackLine: "I'm still here.",
    }),
  )
}
