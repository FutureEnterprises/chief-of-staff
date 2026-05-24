import { Prisma, prisma } from '@repo/database'

/**
 * Record a heartbeat for a named cron / workflow job.
 *
 * Best-effort: never throws. Failures are logged so the cron itself
 * still returns 200 to Vercel even if the heartbeat DB write fails.
 *
 * One row per `name` (CronHeartbeat.name is the primary key) — upserts
 * so the latest run always wins. Metadata is freeform JSONB; callers
 * are encouraged to include counts, durations, error info, and any
 * stats the admin dashboard surfaces when investigating staleness.
 *
 * Call this at the end of every cron route so an empty cron_heartbeats
 * table is a real signal (nothing is firing) rather than just an
 * implementation gap.
 *
 * @param name - stable identifier for the cron; matches the route path
 *   tail (e.g. 'morning' for /api/cron/morning). Do NOT change once a
 *   job has shipped — the dashboard tracks this name.
 * @param meta - optional run metadata persisted as JSONB.
 */
export async function recordHeartbeat(
  name: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  const now = new Date()
  // Cast through InputJsonValue because callers pass loose
  // `Record<string, unknown>` for ergonomics; Prisma can't statically
  // prove every value is JSON-safe but everything we put in is (numbers,
  // strings, plain objects, arrays). Runtime guard inside the catch.
  const safeMeta = (meta ?? {}) as Prisma.InputJsonValue

  try {
    await prisma.cronHeartbeat.upsert({
      where: { name },
      create: {
        name,
        lastRunAt: now,
        lastRunMeta: safeMeta,
      },
      update: {
        lastRunAt: now,
        lastRunMeta: safeMeta,
      },
    })
  } catch (err) {
    console.warn('[cron-heartbeat] upsert failed', { name, err })
  }
}
