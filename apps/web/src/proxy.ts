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
  '/free',
  '/patterns-we-catch',
  // /card/[slug] — public archetype share-card landing pages (10 of them).
  // The viral loop lands here; must be reachable without auth so social
  // crawlers scrape the 9:16 OG image and friends can view the card.
  '/card/(.*)',
  '/start',
  '/weight-loss',
  '/work',
  '/recurring-loops',
  '/decision-support',
  '/recovery',
  '/autopilot-map',
  '/science',
  '/caught',
  '/audit(.*)',
  '/a/(.*)',
  '/glp1',
  '/pricing',
  '/research',
  '/research/(.*)',
  '/clinical-study',
  '/procrastination',
  '/teams',
  '/catch-me',
  '/changelog',
  '/manifesto',
  '/psyche',
  '/press',
  '/safety',
  '/trust',
  '/protocol',
  '/bip',
  '/pap',
  '/eap',
  '/uap',
  '/rap',
  // /kill — dedicated UAP global kill-switch surface. Per UAP-0.1.md §8
  // (kill switch ≤2 taps away) this URL must be reachable to anyone in
  // crisis even if they're signed out. The POST to
  // /api/uap/v1/kill-switch itself enforces user identity via Clerk
  // session; the page just renders the button + drives a sign-in flow.
  '/kill',
  '/rebound',
  '/rebound/(.*)',
  '/platform',
  '/developers',
  '/about',
  '/advisors',
  '/clinical-board',
  '/clinician',
  '/clinician/onboarding',
  '/i/(.*)',
  '/i/provider/(.*)',
  '/r/(.*)',
  '/rb/(.*)',
  // /m/[slug] — Autopilot Map snapshot share pages (Spotify Wrapped
  // for self-sabotage). Anyone with the link can view the four-card
  // weekly snapshot; no identity is revealed in the render. Must be
  // public so social crawlers can scrape OG meta.
  '/m/(.*)',
  '/api/og/autopilot-map/(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/health',
  // NOTE: /content was previously public (marketing playbook). It has
  // been removed entirely — playbook now lives at
  // docs/marketing/content-playbook.md (private). Do not re-add to
  // this list without an explicit policy review.
  // PAP + EAP + UAP coordinator endpoints — LLM partners auth via Bearer
  // API keys (coyl_pap_<id>_<secret>) instead of Clerk session cookies.
  '/api/eap/v1/(.*)',
  '/api/pap/v1/(.*)',
  '/api/uap/v1/(.*)',
  // RAP coordinator endpoints — risk-assessment partner API. UAP-key
  // authenticated for assess/escalation/status; Clerk-session for audit
  // + reopen. Lives at the same /api/<protocol>/v1/<verb> shape as
  // EAP/PAP/UAP. See docs/protocol/RAP-0.1.md and apps/web/src/lib/rap/.
  '/api/rap/v1/(.*)',
  // Live coordinator simulator — public read-only POST endpoint that
  // backs the /protocol "Try the protocol" interactive section. Runs
  // the production confidence-gate function in-process with no DB writes.
  // See apps/web/src/app/api/v1/protocol/demo/route.ts.
  '/api/v1/protocol/demo',
  // Public audit funnel — anonymous visitors POST here to capture their
  // archetype result (capture) or schedule a one-shot interrupt (schedule).
  // Per-IP rate-limited; both routes are open.
  '/api/v1/audit/(.*)',
  // Free-tier clinical-event ingest — the iOS app (and future mobile
  // surfaces) POST PHI-adjacent telemetry here keyed by anonymousUserId,
  // not a Clerk session. Per-IP rate-limited + Zod-validated at the route
  // level (apps/web/src/app/api/v1/clinical-event/route.ts). Must be public
  // or Clerk 307s the POST to /sign-in and the iOS telemetry silently dies.
  // When the iOS app ships to TestFlight, this gets an additional
  // short-lived ingest-token check per UAP §EXECUTE — but it stays out of
  // the Clerk session gate.
  '/api/v1/clinical-event',
  // Open Graph image generator + public share-card endpoint — must be
  // anonymous so Twitter/X, iMessage, Slack, LinkedIn, Discord, Facebook,
  // Threads etc. can fetch link previews. Previously gated behind Clerk,
  // which collapsed every scraped preview to 307 → /sign-in and silently
  // killed the share funnel.
  '/api/og',
  '/api/og/(.*)',
  '/api/share/(.*)',
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
  '/api/v1/teams/bot/messages',
  '/api/v1/teams/install',
  // Microsoft Graph delegated-OAuth callback — Microsoft can't send a
  // Clerk JWT on the redirect-back. User attribution comes from the
  // HMAC-signed `state` payload, verified inside the route handler.
  // The /connect step on the other side stays Clerk-protected.
  '/api/v1/teams/auth/callback',
  '/api/v1/slack/events',
  '/api/v1/slack/install',
  // Inbound message webhooks — Twilio (SMS replies) and Resend (email
  // replies) cannot send a Clerk JWT. Authentication is provided by the
  // provider signature header, verified inside each route handler.
  '/api/v1/inbound/twilio',
  '/api/v1/inbound/email',
  // Microsoft Teams app manifest + icons — fetched anonymously by Microsoft
  // AppSource crawlers, the Teams client during sideload, and Vercel's
  // CDN for static asset distribution. Must be public.
  '/microsoft-teams/(.*)',
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
  '/free',
  '/patterns-we-catch',
  // /card/[slug] — public archetype share-card landing pages (10 of them).
  // The viral loop lands here; must be reachable without auth so social
  // crawlers scrape the 9:16 OG image and friends can view the card.
  '/card/(.*)',
  '/start',
  '/weight-loss',
  '/work',
  '/recurring-loops',
  '/decision-support',
  '/recovery',
  '/autopilot-map',
  '/science',
  '/caught',
  '/audit(.*)',
  '/a/(.*)',
  '/glp1',
  '/pricing',
  '/research',
  '/research/(.*)',
  '/clinical-study',
  '/procrastination',
  '/teams',
  '/catch-me',
  '/changelog',
  '/manifesto',
  '/psyche',
  '/press',
  '/safety',
  '/trust',
  '/protocol',
  '/bip',
  '/pap',
  '/eap',
  '/uap',
  '/rap',
  // /kill — dedicated UAP global kill-switch surface. Must bypass the
  // dev-instance Clerk handshake so a user in crisis can reach
  // coyl.ai/kill without being 302'd through accounts.dev. The page
  // itself uses /api/v1/user to detect identity client-side; the
  // POST to /api/uap/v1/kill-switch still requires the Clerk session.
  '/kill',
  '/rebound',
  '/rebound/(.*)',
  '/platform',
  '/developers',
  '/about',
  '/advisors',
  '/clinical-board',
  '/clinician',
  '/clinician/onboarding',
  '/i/(.*)',
  '/i/provider/(.*)',
  '/r/(.*)',
  '/rb/(.*)',
  // Autopilot Map snapshot shares — must also bypass the dev-instance
  // Clerk handshake so unauthenticated viewers (and Twitter/iMessage/
  // Slack crawlers) can reach the page and its OG image directly.
  '/m/(.*)',
  '/api/og/autopilot-map/(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/v1/newsletter',
  '/api/v1/sms/intro',
  '/api/v1/protocol/demo',
  '/api/v1/audit/(.*)',
  '/api/og',
  '/api/og/(.*)',
  '/api/share/(.*)',
  '/api/uap/v1/(.*)',
  // RAP coordinator endpoints — risk-assessment partner API. UAP-key
  // authenticated for assess/escalation/status; Clerk-session for audit
  // + reopen. Lives at the same /api/<protocol>/v1/<verb> shape as
  // EAP/PAP/UAP. See docs/protocol/RAP-0.1.md and apps/web/src/lib/rap/.
  '/api/rap/v1/(.*)',
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
  '/api/v1/teams/bot/messages',
  '/api/v1/teams/install',
  // Graph OAuth callback bypasses the dev-instance Clerk handshake for
  // the same reason as the Dexcom/Libre/Withings callbacks — Microsoft
  // redirects here without a session cookie.
  '/api/v1/teams/auth/callback',
  '/api/v1/slack/events',
  '/api/v1/slack/install',
  // Inbound webhooks — provider-signature-authenticated; must bypass the
  // dev-instance Clerk handshake so Twilio and Resend can POST back.
  '/api/v1/inbound/twilio',
  '/api/v1/inbound/email',
  // Microsoft Teams app manifest + icons — public static assets.
  '/microsoft-teams/(.*)',
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
    // `.well-known/workflow/` carries the Workflow DevKit's internal
    // queue POSTs (e.g. POST /.well-known/workflow/v1/flow). Intercepting
    // those with Clerk breaks step execution.
    '/((?!_next|\\.well-known/workflow/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
