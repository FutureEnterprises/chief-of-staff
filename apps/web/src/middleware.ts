import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
])

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

const clerkConfigured =
  process.env.CLERK_SECRET_KEY &&
  !process.env.CLERK_SECRET_KEY.startsWith('sk_...') &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_...')

export default function middleware(req: NextRequest) {
  if (!clerkConfigured) {
    return NextResponse.next()
  }
  return clerkHandler(req)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
