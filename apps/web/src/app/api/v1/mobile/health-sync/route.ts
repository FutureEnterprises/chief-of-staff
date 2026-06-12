import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/v1/mobile/health-sync
 *
 * COYL Edge Layer 3 ingest. The mobile app passively reads a NEDA-safe slice
 * of Apple HealthKit on-device (steps, sleep, heart rate, resting HR, HRV) and
 * POSTs aggregated signals here; we upsert them into `health_signals` for the
 * autopilot danger-window model.
 *
 * NEDA HARD GATE (enforced at this boundary): the `kind` enum below is the
 * ONLY accepted set. NO body-measurement kinds — no weight, BMI, or body-fat.
 * Any other kind fails Zod validation and the whole batch is rejected (400).
 *
 * Auth: Clerk session token (Bearer) → clerkId → User row (User.clerkId).
 * `auth()` is kept OUTSIDE any try/catch per the Next 16 cacheComponents
 * pattern used across the api/v1/mobile/* routes (catching the dynamic-access
 * sentinel makes Next treat the route as static and then runtime access
 * throws). Mirrors api/v1/mobile/me and api/v1/mobile/push-token.
 *
 * Body: { signals: [{ kind, value, unit?, startedAt, endedAt? }] }  (max 200)
 * Idempotent: upsert on the @@unique([userId, kind, startedAt]) constraint
 * (`userId_kind_startedAt`) — devices re-send overlapping samples; we update
 * value/endedAt rather than duplicating.
 *
 * Returns: { ok: true, accepted: n }
 */

// The NEDA-safe kind set — the API-boundary allow-list. Keep in lockstep with
// the mobile `HealthSignalKind` union and the Prisma model's documented kinds.
const healthSignalSchema = z.object({
  kind: z.enum(['steps', 'sleep_minutes', 'heart_rate', 'resting_heart_rate', 'hrv']),
  value: z.number().finite(),
  unit: z.string().max(16).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
})

const healthSyncSchema = z.object({
  signals: z.array(healthSignalSchema).max(200),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit before any DB work (mirrors push-token / me). 'auth' tier =
  // 20 req/min/user — a batched 48h sync is a handful of requests, well under.
  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const parsed = healthSyncSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    // A rejected batch here is also the NEDA gate firing on a disallowed kind.
    return NextResponse.json({ error: 'Invalid health signals' }, { status: 400 })
  }

  // Resolve the local User row — `userId` on health_signals is the local id,
  // not the clerkId.
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { signals } = parsed.data
  if (signals.length === 0) {
    return NextResponse.json({ ok: true, accepted: 0 })
  }

  // Upsert each signal idempotently on userId_kind_startedAt. Re-sent samples
  // update value/endedAt (later reads may refine an interval). source pinned
  // to 'healthkit'. We tolerate a per-row failure (e.g. a malformed date that
  // slipped Zod) without failing the whole batch.
  let accepted = 0
  await Promise.all(
    signals.map(async (s) => {
      const startedAt = new Date(s.startedAt)
      const endedAt = s.endedAt ? new Date(s.endedAt) : null
      try {
        await prisma.healthSignal.upsert({
          where: {
            userId_kind_startedAt: {
              userId: user.id,
              kind: s.kind,
              startedAt,
            },
          },
          update: {
            value: s.value,
            unit: s.unit ?? null,
            endedAt,
            source: 'healthkit',
          },
          create: {
            userId: user.id,
            kind: s.kind,
            value: s.value,
            unit: s.unit ?? null,
            startedAt,
            endedAt,
            source: 'healthkit',
          },
        })
        accepted += 1
      } catch {
        /* skip this row; the rest of the batch still lands */
      }
    }),
  )

  return NextResponse.json({ ok: true, accepted })
}
