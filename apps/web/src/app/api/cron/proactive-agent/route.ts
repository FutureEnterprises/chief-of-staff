import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import { runProactiveAgent } from '@/lib/proactive-agent'

export const maxDuration = 120

/**
 * GET /api/cron/proactive-agent
 *
 * The internal "LLM wakes up" loop. Vercel Cron wakes this route; the
 * service chooses eligible moments, asks the LLM for intervention copy,
 * runs COYL's guardrails, then dispatches via existing push/web/email
 * channels.
 *
 * Live sending is gated by PROACTIVE_AGENT_ENABLED=1. Dry-runs are always
 * allowed for demos and operator inspection:
 *   /api/cron/proactive-agent?dryRun=1&copy=0
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === '1'
  const generateCopy = url.searchParams.get('copy') !== '0'
  const limit = Number(url.searchParams.get('limit') ?? '50')
  const enabled = process.env.PROACTIVE_AGENT_ENABLED === '1'

  if (!enabled && !dryRun) {
    await recordHeartbeat('proactive-agent', {
      enabled: false,
      processed: 0,
      fired: 0,
    })
    return NextResponse.json({
      ok: true,
      enabled: false,
      message: 'Set PROACTIVE_AGENT_ENABLED=1 to allow live sends.',
    })
  }

  const outcome = await runProactiveAgent({
    dryRun,
    generateCopy,
    limit: Number.isFinite(limit) ? limit : undefined,
  })

  await recordHeartbeat('proactive-agent', {
    enabled,
    dryRun,
    processed: outcome.processed,
    candidates: outcome.candidates,
    fired: outcome.fired,
    suppressed: outcome.suppressed,
    errored: outcome.errored,
  })

  return NextResponse.json({ ok: true, enabled, ...outcome })
}
