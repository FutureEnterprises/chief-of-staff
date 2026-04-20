import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

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
  '/work',
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

/**
 * Routes we must keep out of Clerk's hands while a dev-instance Clerk
 * deployment is live. Dev instances force a handshake to accounts.dev on
 * every request, which 302s public visitors. By bypassing clerkMiddleware
 * entirely for these URLs, public pages stay reachable.
 *
 * Trade-off: auth() is unavailable for these routes, which means the
 * logged-in redirect on `/` (auth → /today) won't fire. Acceptable \u2014
 * logged-in users can still tap "Today" manually. Logged-out visibility
 * matters more for SEO / first-touch / crawlers / link previews.
 *
 * Once Clerk Production is set up (pk_live_/sk_live_), this bypass
 * becomes redundant but harmless.
 */
const SHOULD_BYPASS_CLERK = createRouteMatcher([
  '/',
  '/terms',
  '/privacy',
  '/cookies',
  '/how-it-works',
  '/weight-loss',
  '/work',
  '/destructive-behaviors',
  '/decision-support',
  '/recovery',
  '/autopilot-map',
  '/content',
  '/science',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/health',
  '/profile/(.*)',
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

/**
 * Reusable Clerk handler \u2014 used only for routes that aren't in the
 * SHOULD_BYPASS_CLERK list. Calls auth.protect() on non-public routes.
 */
const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

/**
 * Top-level middleware. If the incoming request is for a public marketing
 * or health route, skip Clerk entirely so the dev-browser handshake never
 * fires. Everything else goes through Clerk as before.
 */
function handler(req: NextRequest, event: Parameters<typeof clerkHandler>[1]) {
  if (SHOULD_BYPASS_CLERK(req)) {
    return NextResponse.next()
  }
  return clerkHandler(req, event)
}

export default clerkConfigured ? handler : () => undefined // dev passthrough

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
