/**
 * GET /api/cron/marketing-generate
 *
 * The autonomous content agent. On each scheduled run it tops up the
 * marketing DRAFT queue with a small batch of platform-native posts
 * (Reddit value posts, Twitter threads/singles, Threads, LinkedIn,
 * newsletter) drawn from the content rotation — so the founder/VA
 * always has fresh, on-voice, NEDA-safe drafts to approve at
 * /admin/marketing.
 *
 * It does NOT auto-post. Drafts land in status DRAFT; a human approves
 * and posts. This is deliberate — autonomous posting to Reddit/the
 * GLP-1 communities is a shadowban + brand-damage trap. The agent
 * keeps the IDEA queue full; the human owns the final post.
 *
 * Guardrails:
 *   - CRON_SECRET auth (verifyCronAuth).
 *   - Queue cap: if there are already MAX_PENDING drafts waiting, skip
 *     this run entirely (no point generating into a backlog).
 *   - Per-draft crisis-keyword gate (inside generateMarketingDraft).
 *   - Recipe-level HARD RULES refuse off-limits topics.
 *
 * Schedule: see apps/web/vercel.json crons.
 */

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { pickBatch } from '@/lib/marketing/content-plan'
import {
  generateMarketingDraft,
  pendingDraftCount,
  totalPostCount,
} from '@/lib/marketing/generate'

/** Stop generating once this many drafts are already awaiting approval. */
const MAX_PENDING = 12
/** Drafts generated per run when the queue has room. */
const BATCH_SIZE = 3

export async function GET(req: Request) {
  const unauthorized = verifyCronAuth(req)
  if (unauthorized) return unauthorized

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, skipped: 'ANTHROPIC_API_KEY not configured' },
      { status: 200 },
    )
  }

  // Queue cap — don't pile drafts on top of an unreviewed backlog.
  const pending = await pendingDraftCount()
  if (pending >= MAX_PENDING) {
    return NextResponse.json({
      ok: true,
      skipped: 'queue_full',
      pending,
      max: MAX_PENDING,
    })
  }

  // Monotonic rotation cursor: all-time post count advances the plan
  // every run, so back-to-back runs never regenerate the same combos.
  const cursor = await totalPostCount()

  const room = MAX_PENDING - pending
  const batch = pickBatch(cursor, Math.min(BATCH_SIZE, room))

  const results = []
  for (const combo of batch) {
    const outcome = await generateMarketingDraft({
      platform: combo.platform,
      archetype: combo.archetype,
      topic: combo.topic,
      model: 'sonnet',
    })
    results.push({
      platform: combo.platform,
      archetype: combo.archetype,
      ...outcome,
    })
  }

  const generated = results.filter((r) => r.ok).length
  const skipped = results.filter((r) => !r.ok)

  return NextResponse.json({
    ok: true,
    cursor,
    pendingBefore: pending,
    generated,
    skippedCount: skipped.length,
    results,
  })
}
