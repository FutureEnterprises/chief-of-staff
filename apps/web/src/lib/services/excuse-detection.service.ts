import { prisma } from '@repo/database'
import type { ExcuseCategory, ExcuseSource } from '@repo/database'
import { generateText } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'

const CATEGORIES: ExcuseCategory[] = [
  'DELAY', 'REWARD', 'MINIMIZATION', 'COLLAPSE',
  'EXHAUSTION', 'EXCEPTION', 'COMPENSATION', 'SOCIAL_PRESSURE',
]

/**
 * Silently classify a user's message for excuse patterns. Fire-and-forget.
 * Called from chat/decide/rescue routes after the response is sent.
 */
export async function classifyAndStoreExcuse(
  userId: string,
  text: string,
  source: ExcuseSource = 'CHAT'
): Promise<void> {
  if (!text || text.trim().length < 10) return

  try {
    const { text: raw } = await generateText({
      model: AI_MODEL_FAST,
      system: SYSTEM_PROMPTS.excuseDetection,
      prompt: text.slice(0, 1000),
    })

    // Parse JSON output
    const jsonMatch = raw.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return
    const parsed = JSON.parse(jsonMatch[0]) as {
      detected: boolean
      category: string | null
      evidence?: string
    }

    if (!parsed.detected || !parsed.category) return
    if (!CATEGORIES.includes(parsed.category as ExcuseCategory)) return

    await prisma.excuse.create({
      data: {
        userId,
        text: parsed.evidence ?? text.slice(0, 200),
        category: parsed.category as ExcuseCategory,
        source,
      },
    })

    await prisma.productivityEvent
      .create({
        data: {
          userId,
          eventType: 'EXCUSE_DETECTED',
          eventValue: parsed.category,
          metadataJson: { evidence: parsed.evidence?.slice(0, 200), source },
        },
      })
      .catch(() => {})
  } catch {
    // Silent failure — excuse detection is best-effort
  }
}
