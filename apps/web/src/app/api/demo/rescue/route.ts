import { streamText, convertToModelMessages } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { UIMessage } from 'ai'

export const maxDuration = 30

// Public no-auth rescue demo for landing page.
// Rate-limited by IP to prevent abuse.
const DEMO_TRIGGERS = ['BINGE_URGE', 'DELIVERY_URGE', 'SPIRALING', 'ALREADY_SLIPPED', 'SKIP_WORKOUT'] as const

export async function POST(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const rl = await checkRateLimit('demo', ip)
  if (rl.limited) {
    return Response.json({ error: 'Rate limit — try again in a minute' }, { status: 429 })
  }

  const { trigger } = (await req.json()) as { trigger?: string }
  if (!trigger || !DEMO_TRIGGERS.includes(trigger as typeof DEMO_TRIGGERS[number])) {
    return Response.json({ error: 'Invalid trigger' }, { status: 400 })
  }

  const systemPrompt = SYSTEM_PROMPTS.rescueFlow
    .replace('{TRIGGER}', trigger)
    .replace('{WEDGE}', 'WEIGHT_LOSS')
    .replace('{EXCUSE_STYLE}', 'REWARD')
    .replace('{TONE_MODE}', 'MENTOR')
    + '\n\n' + SYSTEM_PROMPTS.toneMentor
    + '\n\nDEMO MODE: This is a public demo. Keep output SHORT — max 4 sections, max 2 sentences per section.'

  const baseMessages: UIMessage[] = [
    {
      id: 'demo',
      role: 'user',
      parts: [{ type: 'text', text: `Emergency: ${trigger}. Interrupt me now.` }],
    } as UIMessage,
  ]

  const modelMessages = await convertToModelMessages(baseMessages)
  const result = streamText({ model: AI_MODEL_FAST, system: systemPrompt, messages: modelMessages })
  return result.toUIMessageStreamResponse()
}
