import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/v1/mobile/danger-windows
 *
 * Returns the user's ACTIVE danger windows in a shape the mobile client can
 * schedule on-device weekly local notifications from (edge layer 2 — the
 * tap-to-respond check-ins that fire even offline).
 *
 * Auth: Clerk session token (Bearer). `auth()` resolves the clerkId → local
 * User via User.clerkId. Kept OUTSIDE try/catch per the Next 16 cacheComponents
 * pattern used across api/v1 (see /api/v1/mobile/me): catching auth()'s
 * dynamic-access sentinel makes Next treat the route as static and the runtime
 * access then throws.
 *
 * Source model: DangerWindow (packages/database schema). The real stored fields
 * are:
 *   - dayOfWeek   Int   — 0 (Sun)..6 (Sat), with -1 meaning "all days"
 *   - startHour   Int   — 0..23 local-time hour
 *   - endHour     Int   — 0..23 local-time hour (not surfaced; the check-in
 *                          fires at the window START)
 *   - label       String
 *   - active      Boolean
 * DangerWindow has NO per-row timezone column — windows are stored in the
 * user's local wall-clock time. The owning timezone lives on User.timezone
 * (default "America/New_York"), so we attach it to every row for the client.
 *
 * Normalization we apply (we derive, we do not invent):
 *   - The schema has no startMinute, so startMinute is always 0.
 *   - dayOfWeek = -1 ("all days") is expanded to daysOfWeek = [0,1,2,3,4,5,6].
 *     A concrete dayOfWeek becomes a single-element daysOfWeek = [n] so the
 *     client only ever sees an int array of 0-6 values.
 *
 * Returns: { windows: [{ id, label, daysOfWeek, startHour, startMinute,
 *   timezone }] }
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 'auth' tier = 20 req/min/user — matches the sibling mobile routes
  // (/me, /push-token). Generous for a once-per-cold-start sync.
  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      timezone: true,
      dangerWindowRecords: {
        where: { active: true },
        select: {
          id: true,
          label: true,
          dayOfWeek: true,
          startHour: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const timezone = user.timezone ?? 'America/New_York'

  const windows = user.dangerWindowRecords.map((w) => ({
    id: w.id,
    label: w.label,
    // -1 ("all days") fans out to the full week; a concrete day becomes a
    // single-element array. Client always receives ints in 0 (Sun)..6 (Sat).
    daysOfWeek: w.dayOfWeek === -1 ? [0, 1, 2, 3, 4, 5, 6] : [w.dayOfWeek],
    startHour: w.startHour,
    // No minute granularity exists in the schema — windows are whole-hour.
    startMinute: 0,
    timezone,
  }))

  return NextResponse.json({ windows })
}
