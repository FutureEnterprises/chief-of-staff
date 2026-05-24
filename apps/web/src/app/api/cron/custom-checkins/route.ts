import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { materializePending } from '@/lib/services/checkin-schedule.service'

export const maxDuration = 60

/**
 * GET /api/cron/custom-checkins
 *
 * Dispatcher for the user-defined CheckinSchedule rows. Registered in
 * apps/web/vercel.json on a 1-minute tick (`* * * * *`).
 *
 * Picks every active row whose nextFiresAt <= now + 1 min, fires it
 * via the row's channel (EMAIL via Resend, SMS via Twilio), then the
 * service advances nextFiresAt to the next computed instant in the
 * user's local timezone. On failure the row stays at its current
 * nextFiresAt and the next tick retries — at-most-once-per-tick
 * delivery, eventual consistency on the schedule.
 *
 * No DB writes if no rows are due (materializePending early-returns),
 * keeping the cost of an empty tick to one indexed query.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const now = new Date()
  const outcome = await materializePending(now)

  return NextResponse.json({
    ok: true,
    processed: outcome.processed,
    sent: outcome.sent,
    failed: outcome.failed,
    errors: outcome.errors,
  })
}
