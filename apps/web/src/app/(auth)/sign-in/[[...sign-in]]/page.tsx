import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'

/**
 * Post sign-in destination. Returning users go straight to /today, the
 * primary surface of the autopilot interruption system.
 *
 * Do NOT leave this unset \u2014 Clerk's default is `/`, which either
 * double-hops through the marketing page (best case) or leaves the user
 * stranded on the marketing page (if the homepage auth redirect is
 * bypassed by middleware config).
 */
const AFTER_SIGN_IN = '/today'

export default function SignInPage() {
  // Suspense wraps the Clerk widget so its internal cookies()/headers()
  // reads satisfy Next 16 cacheComponents during prerender.
  return (
    <Suspense fallback={null}>
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl={AFTER_SIGN_IN}
        forceRedirectUrl={AFTER_SIGN_IN}
      />
    </Suspense>
  )
}
