import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { SYSTEM_PROMPTS, AI_MODEL, composeSystem } from '@repo/ai'
import { consumeAiAssistAtomic, hasFeature } from '@/lib/services/entitlement.service'
import { checkRateLimit } from '@/lib/rate-limit'
import { effectiveTone, classifyState, type ToneMode } from '@/lib/user-state'
import type { UIMessage } from 'ai'

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true, planType: true, primaryWedge: true, excuseStyle: true, toneMode: true,
      createdAt: true, lastActiveAt: true, currentStreak: true, onboardingCompleted: true,
    },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'decisionEngine')
  if (!canUse) {
    return Response.json(
      { error: 'feature_gated', feature: 'decisionEngine', message: 'Decision Engine is a Core feature.' },
      { status: 402 }
    )
  }

  const rl = await checkRateLimit('chat', user.id)
  if (rl.limited) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...rl.headers },
    })
  }

  const { messages, context } = (await req.json()) as { messages: UIMessage[]; context?: string }
  if (!messages?.length) {
    return Response.json({ error: 'messages required' }, { status: 400 })
  }

  const quota = await consumeAiAssistAtomic(user.id)
  if (!quota.consumed) {
    return Response.json(
      { error: 'ai_quota_exceeded', used: quota.used, limit: quota.limit },
      { status: 402 }
    )
  }

  // Adaptive tone: first-week MENTOR override + state-based softening.
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

  const taskPrompt = SYSTEM_PROMPTS.decisionSupport
    .replace('{DATE}', new Date().toLocaleDateString())
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

  // Log the decision (fire and forget)
  if (context) {
    prisma.decisionLog
      .create({ data: { userId: user.id, context } })
      .catch(() => {})
  }

  await prisma.productivityEvent
    .create({ data: { userId: user.id, eventType: 'DECISION_MADE', eventValue: context?.slice(0, 200) } })
    .catch(() => {})

  const modelMessages = await convertToModelMessages(messages)
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
