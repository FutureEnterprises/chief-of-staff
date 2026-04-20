import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { RescueTrigger } from '@repo/database'
import { SYSTEM_PROMPTS, AI_MODEL, composeSystem } from '@repo/ai'
import { consumeAiAssistAtomic, hasFeature } from '@/lib/services/entitlement.service'
import { checkRateLimit } from '@/lib/rate-limit'
import { effectiveTone, classifyState, type ToneMode } from '@/lib/user-state'
import type { UIMessage } from 'ai'

export const maxDuration = 45

const VALID_TRIGGERS = [
  'BINGE_URGE', 'DELIVERY_URGE', 'NICOTINE_URGE', 'ALCOHOL_URGE',
  'SKIP_WORKOUT', 'SKIP_WEIGHIN', 'ALREADY_SLIPPED', 'SPIRALING',
  'DOOMSCROLL', 'IMPULSE_SPEND', 'OTHER',
] as const

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true, primaryWedge: true, excuseStyle: true, toneMode: true,
      createdAt: true, lastActiveAt: true, currentStreak: true,
      onboardingCompleted: true,
    },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'rescueFlows')
  if (!canUse) {
    return Response.json(
      { error: 'feature_gated', feature: 'rescueFlows', message: 'Rescue flows are a Core feature.' },
      { status: 402 }
    )
  }

  const rl = await checkRateLimit('chat', user.id)
  if (rl.limited) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
  }

  const { trigger, customText, messages } = (await req.json()) as {
    trigger: string
    customText?: string
    messages?: UIMessage[]
  }

  if (!VALID_TRIGGERS.includes(trigger as typeof VALID_TRIGGERS[number])) {
    return Response.json({ error: 'invalid_trigger' }, { status: 400 })
  }

  const quota = await consumeAiAssistAtomic(user.id)
  if (!quota.consumed) {
    return Response.json({ error: 'ai_quota_exceeded' }, { status: 402 })
  }

  // Create rescue session
  const session = await prisma.rescueSession.create({
    data: {
      userId: user.id,
      trigger: trigger as RescueTrigger,
      customText: customText ?? null,
      intervention: {},
    },
  })

  await prisma.productivityEvent
    .create({
      data: {
        userId: user.id,
        eventType: 'RESCUE_TRIGGERED',
        eventValue: trigger,
        metadataJson: { sessionId: session.id, customText },
      },
    })
    .catch(() => {})

  // Compute state + adaptive tone. A user mid-SLIPPED who chose BEAST
  // gets softened to NO_BS so we don't pile drill-sergeant onto a raw
  // moment (first week is always MENTOR regardless of pick).
  const daysSinceSignup = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000),
  )
  const state = classifyState({
    onboardingCompleted: user.onboardingCompleted,
    lastActiveAt: user.lastActiveAt,
    lastSlipAt: null,
    lastSlipRecoveredAt: null,
    insideDangerWindow: false,
    currentStreak: user.currentStreak,
  })
  const tone = effectiveTone(
    (user.toneMode ?? 'MENTOR') as ToneMode,
    state,
    daysSinceSignup,
  )

  const taskPrompt = SYSTEM_PROMPTS.rescueFlow
    .replace('{TRIGGER}', trigger)
    .replace('{WEDGE}', user.primaryWedge ?? 'PRODUCTIVITY')
    .replace('{EXCUSE_STYLE}', user.excuseStyle ?? 'unknown')
    .replace('{TONE_MODE}', tone)

  const tonePrompt =
    SYSTEM_PROMPTS[`tone${toneSuffix(tone)}` as keyof typeof SYSTEM_PROMPTS] ?? ''

  const systemPrompt = composeSystem({
    core: SYSTEM_PROMPTS.coyl,
    task: taskPrompt,
    tone: tonePrompt,
  })

  const baseMessages: UIMessage[] = messages ?? [
    {
      id: 'trigger',
      role: 'user',
      parts: [{ type: 'text', text: customText ?? `Emergency: ${trigger}. Interrupt me now.` }],
    } as UIMessage,
  ]

  const modelMessages = await convertToModelMessages(baseMessages)
  const result = streamText({ model: AI_MODEL, system: systemPrompt, messages: modelMessages })
  return result.toUIMessageStreamResponse()
}

function toneSuffix(mode: string | null | undefined) {
  switch (mode) {
    case 'STRATEGIST': return 'Strategist'
    case 'NO_BS': return 'NoBs'
    case 'BEAST': return 'Beast'
    default: return 'Mentor'
  }
}
