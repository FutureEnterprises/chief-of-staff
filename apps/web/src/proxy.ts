import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

// Provider dashboard routes (/provider, /provider/cohort, /provider/[id])
// and the matching /api/v1/provider/* data routes are intentionally NOT
// listed in isPublicRoute below — they fall through to Clerk's default
// auth.protect() gate, which rejects unauthenticated requests with a
// sign-in redirect. The second gate (provider-tier check, patient
// authorization) lives inside lib/provider-rbac.ts and runs on every
// request in (provider)/layout.tsx + each API route. This file is left
// unchanged on purpose for the provider milestone — see lib/provider-rbac.ts.
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/terms',
  '/privacy',
  '/cookies',
  '/profile/(.*)',
  '/how-it-works',
  '/how-coyl-knows-you',
  '/weight-loss',
  '/work',
  '/recurring-loops',
  '/decision-support',
  '/recovery',
  '/autopilot-map',
  '/content',
  '/science',
  '/caught',
  '/audit(.*)',
  '/a/(.*)',
  '/glp1',
  '/pricing',
  '/research',
  '/clinical-study',
  '/procrastination',
  '/teams',
  '/catch-me',
  '/changelog',
  '/manifesto',
  '/psyche',
  '/press',
  '/safety',
  '/protocol',
  '/developers',
  '/about',
  '/advisors',
  '/clinical-board',
  '/i/(.*)',
  '/r/(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/health',
  // Third-party OAuth callbacks & webhooks — providers redirect/POST here
  // without a Clerk session cookie, so Clerk's protect would 302 them to
  // sign-in and break the integration handshake. /auth subroutes stay
  // Clerk-protected so we can mint OAuth state with a real user id.
  '/api/v1/integrations/dexcom/callback',
  '/api/v1/integrations/dexcom/webhook',
  '/api/v1/integrations/libre/callback',
  '/api/v1/integrations/libre/webhook',
  '/api/v1/integrations/withings/callback',
  '/api/v1/integrations/withings/webhook',
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
  '/how-coyl-knows-you',
  '/weight-loss',
  '/work',
  '/recurring-loops',
  '/decision-support',
  '/recovery',
  '/autopilot-map',
  '/content',
  '/science',
  '/caught',
  '/audit(.*)',
  '/a/(.*)',
  '/glp1',
  '/pricing',
  '/research',
  '/clinical-study',
  '/procrastination',
  '/teams',
  '/catch-me',
  '/changelog',
  '/manifesto',
  '/psyche',
  '/press',
  '/safety',
  '/protocol',
  '/developers',
  '/about',
  '/advisors',
  '/clinical-board',
  '/i/(.*)',
  '/r/(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/v1/newsletter',
  '/api/v1/sms/intro',
  '/api/health',
  '/profile/(.*)',
  // Integration OAuth callbacks + webhook receivers must also bypass the
  // dev-instance Clerk handshake so Dexcom/Libre/Withings can POST back.
  '/api/v1/integrations/dexcom/callback',
  '/api/v1/integrations/dexcom/webhook',
  '/api/v1/integrations/libre/callback',
  '/api/v1/integrations/libre/webhook',
  '/api/v1/integrations/withings/callback',
  '/api/v1/integrations/withings/webhook',
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
 * Top-level middleware. The SHOULD_BYPASS_CLERK list exists ONLY to
 * dodge the Clerk dev-instance accounts.dev handshake \u2014 on production
 * keys (pk_live_), clerkMiddleware on public routes is harmless (no
 * external redirect) AND necessary (so auth() in page.tsx can detect
 * signed-in users and route them to /today after sign-up).
 *
 * So: bypass only when we're on dev keys. On production, every request
 * goes through clerkMiddleware \u2014 public routes still skip auth.protect()
 * via isPublicRoute, but the request gets enriched with auth context.
 */
function handler(req: NextRequest, event: Parameters<typeof clerkHandler>[1]) {
  if (isDevClerkKey && SHOULD_BYPASS_CLERK(req)) {
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
