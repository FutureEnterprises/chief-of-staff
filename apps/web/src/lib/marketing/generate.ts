/**
 * Core marketing-draft generation — usable WITHOUT an admin session.
 *
 * The admin server action (admin/marketing/actions.ts) generates one
 * draft on demand behind requireAdmin(). This module is the same
 * generation, callable from the cron (which has no Clerk session, only
 * the CRON_SECRET). Both paths produce a DRAFT a human still approves.
 *
 * Safety: the recipe prompts already REFUSE off-limits topics
 * (templates.ts HARD RULES — NEDA / medical / diagnostic). As a
 * belt-and-braces gate, the generated text is run through
 * containsCrisisKeyword() and rejected if it trips — that draft is
 * simply skipped, never queued.
 */

import { generateText } from 'ai'
import { AI_MODEL, AI_MODEL_FAST } from '@repo/ai'
import { prisma, MarketingPlatform, MarketingPostStatus } from '@repo/database'
import {
  composePrompt,
  getRecipe,
  type MarketingPlatform as TemplatePlatform,
  type MarketingArchetype,
} from './templates'
import { containsCrisisKeyword } from './safety-words'

const PRISMA_TO_TEMPLATE: Record<MarketingPlatform, TemplatePlatform> = {
  REDDIT: 'reddit',
  TWITTER_THREAD: 'twitter-thread',
  TWITTER_SINGLE: 'twitter-single',
  THREADS: 'threads',
  LINKEDIN: 'linkedin',
  INDIEHACKERS: 'indiehackers',
  PRODUCTHUNT: 'producthunt',
  HACKERNEWS: 'hackernews',
  NEWSLETTER: 'newsletter',
}

export type GenerateInput = {
  platform: MarketingPlatform
  archetype?: string | null
  topic: string
  model?: 'sonnet' | 'haiku'
}

export type GenerateOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: 'no_recipe' | 'crisis_keyword' | 'error'; detail?: string }

/**
 * Generate one draft and persist it as DRAFT. Never throws — returns a
 * structured outcome so the cron can tally successes/skips without one
 * bad topic aborting the whole batch.
 */
export async function generateMarketingDraft(input: GenerateInput): Promise<GenerateOutcome> {
  try {
    const topic = input.topic.trim()
    if (!topic) return { ok: false, reason: 'error', detail: 'empty topic' }

    const recipe = getRecipe(PRISMA_TO_TEMPLATE[input.platform])
    if (!recipe) return { ok: false, reason: 'no_recipe' }

    const archetype = input.archetype?.trim() || undefined
    const prompt = composePrompt(recipe, {
      topic,
      archetype: archetype as MarketingArchetype | undefined,
    })

    const modelChoice = input.model ?? 'sonnet'
    const result = await generateText({
      model: modelChoice === 'sonnet' ? AI_MODEL : AI_MODEL_FAST,
      prompt,
    })

    // Belt-and-braces compliance gate. The recipe should already refuse
    // unsafe topics; if anything trips the crisis-keyword list, skip it.
    const safety = containsCrisisKeyword(result.text)
    if (safety.hit) {
      return { ok: false, reason: 'crisis_keyword', detail: safety.matched ?? undefined }
    }

    const created = await prisma.marketingPost.create({
      data: {
        platform: input.platform,
        archetype: archetype ?? null,
        topic,
        draftBody: result.text,
        status: MarketingPostStatus.DRAFT,
        model: modelChoice,
      },
      select: { id: true },
    })

    return { ok: true, id: created.id }
  } catch (e) {
    return { ok: false, reason: 'error', detail: (e as Error)?.message }
  }
}

/** How many DRAFT posts are waiting for approval (don't over-fill). */
export async function pendingDraftCount(): Promise<number> {
  return prisma.marketingPost.count({ where: { status: MarketingPostStatus.DRAFT } })
}

/**
 * All-time MarketingPost count — used as the rotation cursor so the
 * content plan advances every run (monotonic), instead of repeating
 * the same combos when the cron fires more than once in a day.
 */
export async function totalPostCount(): Promise<number> {
  return prisma.marketingPost.count()
}
