import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

function applyCSPHeaders(response: NextResponse, nonce: string): NextResponse {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://*.clerk.accounts.dev`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://img.clerk.com https://*.public.blob.vercel-storage.com data:",
    "connect-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://api.stripe.com",
    "font-src 'self' data:",
    "frame-src https://js.stripe.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  // Pass nonce to Next.js so it can inject into inline scripts
  response.headers.set('x-nonce', nonce)
  return response
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clerkHandler: any = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  const nonce = generateNonce()
  const response = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  })
  response.headers.set('x-nonce', nonce)
  return applyCSPHeaders(response, nonce)
})

function devPassthrough(_req: NextRequest) {
  const nonce = generateNonce()
  const response = NextResponse.next()
  response.headers.set('x-nonce', nonce)
  return applyCSPHeaders(response, nonce)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const middleware: any = clerkConfigured ? clerkHandler : devPassthrough

export default middleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
