import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { SYSTEM_PROMPTS, AI_MODEL } from '@repo/ai'
import { consumeAiAssistAtomic, hasFeature } from '@/lib/services/entitlement.service'
import type { UIMessage } from 'ai'

export const maxDuration = 45

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, primaryWedge: true, toneMode: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'scenarioSimulator')
  if (!canUse) {
    return Response.json({ error: 'feature_gated', feature: 'scenarioSimulator' }, { status: 402 })
  }

  const { scenario } = (await req.json()) as { scenario?: string }
  if (!scenario || scenario.trim().length < 5) {
    return Response.json({ error: 'scenario too short' }, { status: 400 })
  }

  const quota = await consumeAiAssistAtomic(user.id)
  if (!quota.consumed) {
    return Response.json({ error: 'ai_quota_exceeded' }, { status: 402 })
  }

  // Log the scenario
  const sim = await prisma.scenarioSim.create({
    data: { userId: user.id, scenario: scenario.trim() },
  })

  await prisma.productivityEvent
    .create({
      data: {
        userId: user.id,
        eventType: 'SCENARIO_SIMULATED',
        eventValue: sim.id,
        metadataJson: { scenario: scenario.slice(0, 200) },
      },
    })
    .catch(() => {})

  const systemPrompt =
    SYSTEM_PROMPTS.scenarioSim
      .replace('{SCENARIO}', scenario.trim())
      .replace('{WEDGE}', user.primaryWedge ?? 'PRODUCTIVITY')
      .replace('{TONE_MODE}', user.toneMode ?? 'MENTOR') +
    '\n\n' +
    (SYSTEM_PROMPTS[`tone${toneSuffix(user.toneMode)}` as keyof typeof SYSTEM_PROMPTS] ?? '')

  const baseMessages: UIMessage[] = [
    {
      id: 'sim',
      role: 'user',
      parts: [{ type: 'text', text: `Play out this scenario: ${scenario.trim()}` }],
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
