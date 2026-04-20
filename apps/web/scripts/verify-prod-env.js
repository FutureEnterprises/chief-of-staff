/* eslint-disable no-console */
/**
 * verify-prod-env — runs before `next build` to catch environment
 * misconfigurations that silently break production.
 *
 * Plain CommonJS (no TypeScript, no tsx) so it runs with bare `node`
 * on Vercel's build runner with zero dependencies.
 *
 * Fatal (exit 1):
 *   - Clerk keys missing entirely.
 *   - Clerk keys are placeholders (pk_... / sk_...).
 *   - DATABASE_URL unset in production.
 *
 * Warn-only (exit 0 with stderr noise):
 *   - pk_test_ / sk_test_ in production. The middleware bypass
 *     (see middleware.ts + docs/ENGINEERING.md §11) keeps public
 *     pages reachable; we warn but don't block.
 *   - CRON_SECRET unset.
 *   - RESEND_API_KEY unset.
 *   - ADMIN_EMAILS unset.
 *
 * Skipped entirely outside production deployments.
 */

const VERCEL_ENV = process.env.VERCEL_ENV

if (VERCEL_ENV !== 'production') {
  console.log('[verify-prod-env] skip (VERCEL_ENV=' + (VERCEL_ENV || 'unset') + ')')
  process.exit(0)
}

console.log('[verify-prod-env] production build — checking env...')

const errors = []
const warnings = []

const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const sk = process.env.CLERK_SECRET_KEY

if (!pk || !sk) {
  errors.push(
    'CLERK keys missing. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in Vercel → Settings → Environment Variables → Production.',
  )
} else {
  if (pk.startsWith('pk_...') || sk.startsWith('sk_...')) {
    errors.push(
      'CLERK keys are placeholder values (pk_... / sk_...). Replace with real keys.',
    )
  } else if (pk.startsWith('pk_test_') || sk.startsWith('sk_test_')) {
    warnings.push(
      'CLERK keys are dev-instance (pk_test_/sk_test_). Middleware bypass keeps public pages reachable, but /today, /rescue, etc still go through the accounts.dev handshake. Set up Clerk Production (docs/ENGINEERING.md §11) for full prod experience.',
    )
  }
}

if (!process.env.DATABASE_URL) {
  errors.push(
    'DATABASE_URL unset. Required for Prisma. Paste the pooler URL from Supabase → Settings → Database.',
  )
}

if (!process.env.CRON_SECRET || process.env.CRON_SECRET === 'your-cron-secret') {
  warnings.push('CRON_SECRET unset or placeholder — scheduled crons will 401.')
}
if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_...')) {
  warnings.push('RESEND_API_KEY unset — silent-user + post-slip emails will not send.')
}
if (!process.env.ADMIN_EMAILS) {
  warnings.push('ADMIN_EMAILS unset — /admin will 404 for all users.')
}

if (warnings.length) {
  console.warn('\n[verify-prod-env] WARNINGS:')
  for (let i = 0; i < warnings.length; i++) {
    console.warn('  • ' + warnings[i])
  }
}

if (errors.length) {
  console.error('\n\x1b[31m[verify-prod-env] FATAL — build blocked:\x1b[0m\n')
  for (let i = 0; i < errors.length; i++) {
    console.error(errors[i])
    console.error('')
  }
  console.error('Fix the env vars in Vercel, then redeploy.\n')
  process.exit(1)
}

console.log('[verify-prod-env] ok')
process.exit(0)
