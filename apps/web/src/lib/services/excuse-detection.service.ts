import { prisma } from '@repo/database'
import type { ExcuseCategory, ExcuseSource } from '@repo/database'
import { generateText } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'

const CATEGORIES: ExcuseCategory[] = [
  'DELAY', 'REWARD', 'MINIMIZATION', 'COLLAPSE',
  'EXHAUSTION', 'EXCEPTION', 'COMPENSATION', 'SOCIAL_PRESSURE',
]

export type ExcuseDetectionResult = {
  detected: boolean
  category: ExcuseCategory | null
  evidence: string | null
} | null

/**
 * Classify a user's message for excuse patterns. Stores the result if detected.
 *
 * Returns the detection result so callers can surface it to the user if they
 * want real-time UI feedback ("That's your 'tomorrow' excuse again"). Returning
 * null means the classification itself failed; callers should treat that as
 * "no detection" for UI purposes.
 *
 * Called from chat/decide/rescue routes after the response is sent.
 * Safe to await or fire-and-forget depending on caller needs.
 */
export async function classifyAndStoreExcuse(
  userId: string,
  text: string,
  source: ExcuseSource = 'CHAT'
): Promise<ExcuseDetectionResult> {
  if (!text || text.trim().length < 10) return null

  try {
    const { text: raw } = await generateText({
      model: AI_MODEL_FAST,
      system: SYSTEM_PROMPTS.excuseDetection,
      prompt: text.slice(0, 1000),
    })

    const jsonMatch = raw.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0]) as {
      detected: boolean
      category: string | null
      evidence?: string
    }

    if (!parsed.detected || !parsed.category) {
      return { detected: false, category: null, evidence: null }
    }
    if (!CATEGORIES.includes(parsed.category as ExcuseCategory)) {
      return { detected: false, category: null, evidence: null }
    }

    const category = parsed.category as ExcuseCategory
    const evidence = parsed.evidence ?? text.slice(0, 200)

    await prisma.excuse.create({
      data: { userId, text: evidence, category, source },
    })

    await prisma.productivityEvent
      .create({
        data: {
          userId,
          eventType: 'EXCUSE_DETECTED',
          eventValue: category,
          metadataJson: { evidence: evidence.slice(0, 200), source },
        },
      })
      .catch(() => {})

    return { detected: true, category, evidence }
  } catch {
    return null
  }
}
