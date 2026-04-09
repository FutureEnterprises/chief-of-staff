import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
])

const secretKey = process.env.CLERK_SECRET_KEY
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const clerkConfigured =
  secretKey &&
  !secretKey.startsWith('sk_...') &&
  publishableKey &&
  !publishableKey.startsWith('pk_...')

if (!clerkConfigured && process.env.NODE_ENV === 'production') {
  throw new Error('CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be configured in production')
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

function applySecurityHeaders(headers: Headers, nonce: string): void {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://img.clerk.com https://*.public.blob.vercel-storage.com data:",
    "connect-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://api.stripe.com",
    "font-src 'self' data:",
    "frame-src https://js.stripe.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  headers.set('Content-Security-Policy', csp)
  headers.set('x-nonce', nonce)
}

// Clerk middleware that protects non-public routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clerkHandler: any = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

// Wrap Clerk middleware to add CSP headers AFTER Clerk processes the request
async function withSecurityHeaders(req: NextRequest, evt: NextFetchEvent): Promise<NextResponse> {
  // Let Clerk handle auth first
  const response: NextResponse = await clerkHandler(req, evt)

  // Add security headers to whatever response Clerk produced
  const nonce = generateNonce()
  applySecurityHeaders(response.headers, nonce)

  return response
}

function devPassthrough(_req: NextRequest) {
  const nonce = generateNonce()
  const response = NextResponse.next()
  applySecurityHeaders(response.headers, nonce)
  return response
}

export default clerkConfigured ? withSecurityHeaders : devPassthrough

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
