import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { verifyCronAuth } from '@/lib/cron-auth'
import { handleDangerWindowLearner } from '@/workflows/danger-window-learner'

/**
 * Cron entry point — thin shim that kicks off the durable workflow.
 *
 * Vercel Cron fires this on schedule; the workflow runs to completion
 * async with per-step retries (see workflows/danger-window-learner.ts).
 * The route returns 200 immediately with the runId so the Vercel Cron
 * dashboard records a successful invocation; the actual work is
 * tracked in the Workflow dashboard via the runId.
 *
 * The 10s maxDuration is intentional — `start()` returns the moment
 * the workflow is queued, so the cron route should never hold the
 * connection open. The previous in-handler version needed 120s to
 * paginate through every user; that work now lives in retryable steps.
 */
export const maxDuration = 10

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  try {
    const run = await start(handleDangerWindowLearner)
    return NextResponse.json({ ok: true, runId: run.runId })
  } catch (err) {
    console.error('[cron] danger-window-learner workflow.start failed', err)
    // Return 200 so the Vercel Cron schedule doesn't enter alarm state;
    // the failure is logged + visible in the Workflow dashboard.
    return NextResponse.json(
      { ok: false, error: 'workflow_start_failed' },
      { status: 200 },
    )
  }
}
