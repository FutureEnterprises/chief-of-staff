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
  '/science',
  '/api/webhooks/(.*)',
  '/api/demo/(.*)',
  '/api/cron/(.*)',
])

const secretKey = process.env.CLERK_SECRET_KEY
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const clerkConfigured =
  secretKey &&
  !secretKey.startsWith('sk_...') &&
  publishableKey &&
  !publishableKey.startsWith('pk_...')

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
