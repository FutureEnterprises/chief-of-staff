/* eslint-disable no-console */
/**
 * verify-prod-env — runs before `next build` to catch environment
 * misconfigurations that silently break production.
 *
 * Targeted failures (fatal):
 *   1. Clerk: pk_test_ / sk_test_ keys in production.
 *      Dev keys force the accounts.dev handshake on every public
 *      request — public pages get 302'd to a handshake URL instead
 *      of loading, killing SEO / crawlers / link previews / first
 *      touch for logged-out visitors.
 *   2. Clerk: missing keys entirely when a Clerk instance is expected.
 *   3. DATABASE_URL: unset when building for production.
 *
 * Soft warnings (non-fatal, loud stderr):
 *   - CRON_SECRET unset (crons will 401 legitimate callers).
 *   - RESEND_API_KEY unset (churn + post-slip email channel dead).
 *   - ADMIN_EMAILS unset (/admin is 404 for everyone).
 *
 * Skipped entirely outside production builds. VERCEL_ENV === 'production'
 * is the signal we use (Vercel sets this; local `next build` doesn't).
 */

// Skip outside production deployments. VERCEL_ENV is set by Vercel:
// 'production' | 'preview' | 'development'.
const VERCEL_ENV = process.env.VERCEL_ENV
const isProd = VERCEL_ENV === 'production'

if (!isProd) {
  console.log(`[verify-prod-env] skip (VERCEL_ENV=${VERCEL_ENV ?? 'unset'})`)
  process.exit(0)
}

console.log('[verify-prod-env] production build — checking env...')

const errors: string[] = []
const warnings: string[] = []

// ─── 1. Clerk ────────────────────────────────────────────────
const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const sk = process.env.CLERK_SECRET_KEY

if (!pk || !sk) {
  errors.push(
    'CLERK keys missing. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in Vercel → Settings → Environment Variables → Production.',
  )
} else {
  if (pk.startsWith('pk_test_')) {
    errors.push(
      [
        'CLERK publishable key is a DEV-INSTANCE key (pk_test_).',
        '',
        'Consequence: every public request (/ /weight-loss etc) gets 302\'d through',
        'the Clerk accounts.dev handshake — public pages are unreachable to logged-',
        'out visitors, bots, and crawlers.',
        '',
        'Fix:',
        '  1. Clerk Dashboard → Production instance (create one if needed)',
        '  2. API Keys → copy the pk_live_... + sk_live_... pair',
        '  3. Vercel → Settings → Environment Variables → Production:',
        '     - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...',
        '     - CLERK_SECRET_KEY=sk_live_...',
        '  4. Redeploy.',
      ].join('\n'),
    )
  }
  if (sk.startsWith('sk_test_')) {
    errors.push(
      'CLERK_SECRET_KEY is a dev-instance key (sk_test_). See the publishable-key remediation above.',
    )
  }
  if (pk.startsWith('pk_...') || sk.startsWith('sk_...')) {
    errors.push('CLERK keys are placeholder values (pk_... / sk_...). Replace with real keys.')
  }
}

// ─── 2. Database ─────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  errors.push(
    'DATABASE_URL unset. Required for Prisma. Paste the pooler URL from Supabase → Settings → Database → Connection pooling.',
  )
}

// ─── 3. Soft warnings ────────────────────────────────────────
if (!process.env.CRON_SECRET || process.env.CRON_SECRET === 'your-cron-secret') {
  warnings.push('CRON_SECRET unset or placeholder — scheduled crons will 401.')
}
if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_...')) {
  warnings.push('RESEND_API_KEY unset — silent-user + post-slip emails will not send.')
}
if (!process.env.ADMIN_EMAILS) {
  warnings.push('ADMIN_EMAILS unset — /admin will 404 for all users.')
}

// ─── Output + exit ───────────────────────────────────────────
if (warnings.length) {
  console.warn('\n[verify-prod-env] WARNINGS:')
  for (const w of warnings) console.warn(`  \u2022 ${w}`)
}

if (errors.length) {
  console.error('\n\x1b[31m[verify-prod-env] FATAL \u2014 build blocked:\x1b[0m\n')
  for (const e of errors) {
    console.error(e)
    console.error('')
  }
  console.error('Fix the env vars in Vercel, then redeploy.\n')
  process.exit(1)
}

console.log('[verify-prod-env] ok')
process.exit(0)
