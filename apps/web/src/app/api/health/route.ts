import { prisma } from '@repo/database'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Health + deployment diagnostic endpoint.
 *
 * Public, no auth. Reports enough to diagnose why a visitor might be
 * seeing a broken experience without leaking anything sensitive. In
 * particular, surfaces the Clerk key MODE (dev vs prod) + the Vercel
 * environment + a quick DB reachability probe.
 *
 * Hit it with:
 *   curl https://www.coyl.ai/api/health
 *
 * Intended as a manual / uptime-check surface. The payload is
 * stable-shape JSON so uptime monitors can key off `status === 'ok'`.
 */
export async function GET() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const sk = process.env.CLERK_SECRET_KEY

  const clerkMode: 'live' | 'test' | 'unset' | 'placeholder' =
    !pk || !sk
      ? 'unset'
      : pk.startsWith('pk_...') || sk.startsWith('sk_...')
        ? 'placeholder'
        : pk.startsWith('pk_test_')
          ? 'test'
          : pk.startsWith('pk_live_')
            ? 'live'
            : 'unset'

  const deployment = {
    vercelEnv: process.env.VERCEL_ENV ?? 'unset',
    nodeEnv: process.env.NODE_ENV ?? 'unset',
    region: process.env.VERCEL_REGION ?? 'unset',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unset',
    host: process.env.VERCEL_URL ?? 'unset',
  }

  // Quick DB reachability probe. Wrapped so a DB outage doesn't cascade
  // the whole endpoint — we want it to STILL return even when Prisma
  // can't connect, so we can see whether the failure is DB-only.
  let db: { reachable: boolean; error?: string } = { reachable: false }
  try {
    await prisma.$queryRaw`SELECT 1`
    db = { reachable: true }
  } catch (err) {
    db = { reachable: false, error: (err as Error).message.slice(0, 160) }
  }

  const warnings: string[] = []
  if (deployment.vercelEnv === 'production' && clerkMode === 'test') {
    // Middleware bypasses Clerk for public routes (see middleware.ts +
    // docs/ENGINEERING.md §11), so the site is reachable. Signed-in
    // surfaces still handshake through accounts.dev — inconvenient but
    // functional. Not a status-level degradation.
    warnings.push(
      'WARN: dev-instance Clerk keys in production (pk_test_). Public pages work via middleware bypass; authed surfaces still handshake through accounts.dev. Set up Clerk Production (pk_live_/sk_live_) for full prod experience.',
    )
  }
  if (clerkMode === 'unset' || clerkMode === 'placeholder') {
    warnings.push('CRITICAL: Clerk keys missing or placeholder — auth is off.')
  }
  if (!db.reachable) {
    warnings.push(`CRITICAL: DB unreachable: ${db.error ?? 'unknown'}`)
  }

  // Only truly-broken states count as degraded. pk_test_ is a WARN —
  // the site works, just with a non-ideal Clerk posture.
  const status =
    clerkMode === 'unset' ||
    clerkMode === 'placeholder' ||
    !db.reachable
      ? 'degraded'
      : 'ok'

  return Response.json(
    {
      status,
      clerkMode,
      deployment,
      db,
      warnings,
      checkedAt: new Date().toISOString(),
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  )
}
