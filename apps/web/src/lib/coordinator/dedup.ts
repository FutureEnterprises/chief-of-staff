import { prisma } from '@repo/database'
import type { PAPProposal } from '@repo/database'

/**
 * Semantic dedup over recent PAPProposals — catches two LLM partners
 * (or two prompts from the same partner) racing to interrupt the user
 * with effectively the same message. Without this, "Hey, you've been
 * sitting for 45 minutes" from partner A and "Time to stretch — been
 * sedentary nearly an hour" from partner B both fire, the user gets
 * double-pinged, and the trust contract erodes.
 *
 * Approach: TF cosine similarity over tokenized headline + subhead.
 * No ML library — the dedup window is intentionally narrow (15 min)
 * and the headline/subhead are short, so a basic word-vector cosine
 * with a small English stop-list is sufficient. If false-negative
 * rate proves too high, swap in an embedding API behind this same
 * function signature without touching callers.
 *
 * Behavior:
 *   - Compare against PAPProposal rows in the last 15 min for the
 *     same userId where decision === 'allowed' or 'queued'
 *     (denied proposals don't count as live competitors).
 *   - Similarity threshold: 0.85.
 *   - Returns isDuplicate=true plus all competing proposals so the
 *     coordinator can record which one(s) it's deduping against.
 */

export const DEDUP_WINDOW_MS = 15 * 60 * 1000
export const DEDUP_SIMILARITY_THRESHOLD = 0.85

type ProposalForDedup = {
  userId: string
  action: { headline?: string | undefined; subhead?: string | undefined }
}

export type DedupResult = {
  isDuplicate: boolean
  competingProposals: PAPProposal[]
  /** Highest similarity score observed across competitors (0 if none). */
  topSimilarity: number
}

export async function checkProposalDedup(
  proposal: ProposalForDedup,
  asOf: Date = new Date(),
): Promise<DedupResult> {
  const candidateText = `${proposal.action.headline ?? ''} ${proposal.action.subhead ?? ''}`.trim()
  if (!candidateText) {
    return { isDuplicate: false, competingProposals: [], topSimilarity: 0 }
  }

  const cutoff = new Date(asOf.getTime() - DEDUP_WINDOW_MS)
  const recents = await prisma.pAPProposal.findMany({
    where: {
      userId: proposal.userId,
      createdAt: { gte: cutoff },
      decision: { in: ['allowed', 'queued'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  if (recents.length === 0) {
    return { isDuplicate: false, competingProposals: [], topSimilarity: 0 }
  }

  const candidateTf = termFrequency(tokenize(candidateText))

  let topSimilarity = 0
  const competitors: PAPProposal[] = []

  for (const r of recents) {
    const action = (r.actionJson ?? {}) as { headline?: unknown; subhead?: unknown }
    const headline = typeof action.headline === 'string' ? action.headline : ''
    const subhead = typeof action.subhead === 'string' ? action.subhead : ''
    const otherText = `${headline} ${subhead}`.trim()
    if (!otherText) continue

    const otherTf = termFrequency(tokenize(otherText))
    const sim = cosineSimilarity(candidateTf, otherTf)
    if (sim > topSimilarity) topSimilarity = sim
    if (sim >= DEDUP_SIMILARITY_THRESHOLD) {
      competitors.push(r)
    }
  }

  return {
    isDuplicate: competitors.length > 0,
    competingProposals: competitors,
    topSimilarity,
  }
}

// ─────────────────────── TF cosine helpers ───────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as',
  'from', 'into', 'over', 'under', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
  'our', 'their', 'this', 'that', 'these', 'those', 'so', 'than',
  'too', 'very', 'just', 'now', 'then', 'there', 'here',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1)
  }
  return tf
}

export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  if (a.size === 0 || b.size === 0) return 0

  let dot = 0
  for (const [term, av] of a) {
    const bv = b.get(term)
    if (bv !== undefined) dot += av * bv
  }
  if (dot === 0) return 0

  let aMag = 0
  for (const v of a.values()) aMag += v * v
  let bMag = 0
  for (const v of b.values()) bMag += v * v

  const denom = Math.sqrt(aMag) * Math.sqrt(bMag)
  if (denom === 0) return 0
  return dot / denom
}
