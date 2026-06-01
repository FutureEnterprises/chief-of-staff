/**
 * GET /api/v1/archetype-rarity
 *
 * Live archetype distribution from completed audits → the "1 in N people
 * are X" stat on the share cards. The data flywheel made visible: the
 * more people take the audit, the sharper the rarity numbers get.
 *
 * Returns: { total, bySlug: { [slug]: { count, pct, oneInN } } }
 *   - pct: share of completed audits, rounded to 1 decimal
 *   - oneInN: human "1 in N" rounding (e.g. 23.8% → "1 in 4")
 *
 * Cached in-module for 5 minutes so a viral spike doesn't hammer the DB.
 * Public, read-only, no PII. Falls back gracefully (the /card page uses
 * the curated copy when a slug has too little data to be meaningful).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

type RarityRow = { count: number; pct: number; oneInN: number }
type RarityResult = { total: number; bySlug: Record<string, RarityRow> }

let cache: { at: number; data: RarityResult } | null = null
const TTL_MS = 5 * 60 * 1000

/** Minimum completed audits for a slug before we trust its live stat. */
const MIN_SAMPLE = 50

async function computeRarity(): Promise<RarityResult> {
  const groups = await prisma.auditFunnelEvent.groupBy({
    by: ['archetypeSlug'],
    where: { kind: 'completed', archetypeSlug: { not: null } },
    _count: { _all: true },
  })

  const total = groups.reduce((sum, g) => sum + g._count._all, 0)
  const bySlug: Record<string, RarityRow> = {}
  if (total === 0) return { total: 0, bySlug }

  for (const g of groups) {
    const slug = g.archetypeSlug
    if (!slug) continue
    const count = g._count._all
    const pct = (count / total) * 100
    const oneInN = pct > 0 ? Math.max(1, Math.round(100 / pct)) : 0
    bySlug[slug] = { count, pct: Math.round(pct * 10) / 10, oneInN }
  }
  return { total, bySlug }
}

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) {
    return NextResponse.json({ ...cache.data, minSample: MIN_SAMPLE, cached: true })
  }
  try {
    const data = await computeRarity()
    cache = { at: now, data }
    return NextResponse.json({ ...data, minSample: MIN_SAMPLE, cached: false })
  } catch {
    // DB hiccup → return empty so the page falls back to curated copy.
    return NextResponse.json({ total: 0, bySlug: {}, minSample: MIN_SAMPLE, error: true })
  }
}
