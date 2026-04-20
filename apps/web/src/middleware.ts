import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/terms',
  '/privacy',
  '/cookies',
  '/profile/(.*)',
  '/how-it-works',
  '/weight-loss',
  '/destructive-behaviors',
  '/decision-support',
  '/recovery',
  '/autopilot-map',
  '/content',
  '/science',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/health',
])

const secretKey = process.env.CLERK_SECRET_KEY
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const clerkConfigured =
  secretKey &&
  !secretKey.startsWith('sk_...') &&
  publishableKey &&
  !publishableKey.startsWith('pk_...')

/**
 * Detect the Clerk dev-instance → prod-deployment misconfiguration that
 * causes public pages to be 302'd to accounts.dev. One-shot warning
 * per cold start so Vercel logs make it obvious.
 *
 * See docs/ENGINEERING.md §11 "Clerk production key setup" for the fix.
 */
const isProdDeployment = process.env.VERCEL_ENV === 'production'
const isDevClerkKey =
  publishableKey?.startsWith('pk_test_') || secretKey?.startsWith('sk_test_')

if (isProdDeployment && isDevClerkKey) {
  console.error(
    '\n\x1b[31m[CLERK CONFIG FATAL]\x1b[0m Production deployment is running DEV-INSTANCE Clerk keys (pk_test_ / sk_test_).',
  )
  console.error(
    'Consequence: every public request is redirected through the Clerk accounts.dev handshake.',
  )
  console.error(
    'Fix: Vercel → Settings → Environment Variables → Production → set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to pk_live_/sk_live_ values.\n',
  )
}

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect()
      }
    })
  : () => undefined // dev passthrough — no-op

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
