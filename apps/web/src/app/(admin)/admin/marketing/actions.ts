'use server'
/**
 * Server actions for the marketing approval queue (Phase 2 of
 * docs/marketing/automation-plan.md).
 *
 * Every action calls requireAdmin() first so non-admin Clerk users
 * cannot generate, edit, approve, reject, or post via these actions
 * even if they reach the network handler directly.
 *
 * Drafts are generated through the existing voice-locked templates
 * (apps/web/src/lib/marketing/templates.ts) so the founder cannot
 * accidentally bypass the safety preamble.
 */

import { revalidatePath } from 'next/cache'
import { generateText } from 'ai'
import { AI_MODEL, AI_MODEL_FAST } from '@repo/ai'
import {
  prisma,
  MarketingPlatform,
  MarketingPostStatus,
  type MarketingPost,
} from '@repo/database'
import {
  composePrompt,
  getRecipe,
  type MarketingArchetype,
  type MarketingPlatform as TemplatePlatform,
} from '@/lib/marketing/templates'
import { requireAdmin } from '@/lib/admin/is-admin'

/** Map Prisma enum → templates.ts platform slug. */
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

export type GenerateDraftInput = {
  platform: MarketingPlatform
  archetype?: string | null
  topic: string
  model?: 'sonnet' | 'haiku'
}

export type ListDraftsFilter = {
  status?: MarketingPostStatus
  platform?: MarketingPlatform
}

/**
 * Generate a fresh draft via the voice-locked recipe and persist it
 * with status DRAFT. Returns the created record so the caller can
 * redirect into the edit view.
 */
export async function generateDraft(input: GenerateDraftInput): Promise<MarketingPost> {
  await requireAdmin()

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set on this environment.')
  }
  const topic = input.topic.trim()
  if (!topic) {
    throw new Error('Topic is required.')
  }

  const templatePlatform = PRISMA_TO_TEMPLATE[input.platform]
  const recipe = getRecipe(templatePlatform)
  if (!recipe) {
    throw new Error(`No recipe registered for platform ${input.platform}`)
  }

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

  const created = await prisma.marketingPost.create({
    data: {
      platform: input.platform,
      archetype: archetype ?? null,
      topic,
      draftBody: result.text,
      status: MarketingPostStatus.DRAFT,
      model: modelChoice,
    },
  })

  revalidatePath('/admin/marketing')
  return created
}

export type UpdateDraftInput = {
  finalBody?: string | null
  archetype?: string | null
  topic?: string
}

export async function updateDraft(id: string, input: UpdateDraftInput): Promise<MarketingPost> {
  await requireAdmin()

  const updated = await prisma.marketingPost.update({
    where: { id },
    data: {
      finalBody: input.finalBody ?? undefined,
      archetype: input.archetype ?? undefined,
      topic: input.topic ?? undefined,
    },
  })

  revalidatePath('/admin/marketing')
  revalidatePath(`/admin/marketing/${id}`)
  return updated
}

export async function approveDraft(id: string): Promise<MarketingPost> {
  const admin = await requireAdmin()

  const updated = await prisma.marketingPost.update({
    where: { id },
    data: {
      status: MarketingPostStatus.APPROVED,
      approvedBy: admin.userId,
    },
  })

  revalidatePath('/admin/marketing')
  revalidatePath(`/admin/marketing/${id}`)
  return updated
}

export async function rejectDraft(id: string, reason: string): Promise<MarketingPost> {
  await requireAdmin()

  const trimmed = reason.trim()
  if (!trimmed) {
    throw new Error('Rejection reason is required.')
  }

  const updated = await prisma.marketingPost.update({
    where: { id },
    data: {
      status: MarketingPostStatus.REJECTED,
      rejectionReason: trimmed,
    },
  })

  revalidatePath('/admin/marketing')
  revalidatePath(`/admin/marketing/${id}`)
  return updated
}

export async function markPosted(id: string, url: string): Promise<MarketingPost> {
  await requireAdmin()

  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('Posted URL is required.')
  }

  const updated = await prisma.marketingPost.update({
    where: { id },
    data: {
      status: MarketingPostStatus.POSTED,
      postedAt: new Date(),
      postedUrl: trimmed,
    },
  })

  revalidatePath('/admin/marketing')
  revalidatePath(`/admin/marketing/${id}`)
  return updated
}

export async function deleteDraft(id: string): Promise<{ id: string }> {
  await requireAdmin()

  await prisma.marketingPost.delete({ where: { id } })

  revalidatePath('/admin/marketing')
  return { id }
}

export async function listDrafts(filter: ListDraftsFilter = {}): Promise<MarketingPost[]> {
  await requireAdmin()

  return prisma.marketingPost.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.platform ? { platform: filter.platform } : {}),
    },
    orderBy: { generatedAt: 'desc' },
    take: 200,
  })
}

export async function getDraft(id: string): Promise<MarketingPost | null> {
  await requireAdmin()
  return prisma.marketingPost.findUnique({ where: { id } })
}
