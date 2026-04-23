import { SignUp } from '@clerk/nextjs'

/**
 * Post sign-up destination. New accounts go straight to /onboarding for
 * the 6-step autopilot-mapping wizard; /onboarding itself redirects to
 * /today if the user has already completed onboarding (for the rare case
 * someone completes sign-up and re-lands here with a stale session).
 *
 * Do NOT leave this unset \u2014 Clerk's default is `/`, which double-hops
 * through the marketing page before the logged-in redirect catches them.
 * Worse, if the middleware ever bypasses Clerk on `/` (see middleware.ts
 * SHOULD_BYPASS_CLERK), the signed-in user just sees the marketing page
 * and wonders why nothing happened.
 */
const AFTER_SIGN_UP = '/onboarding'

export default function SignUpPage() {
  return (
    <SignUp
      signInUrl="/sign-in"
      fallbackRedirectUrl={AFTER_SIGN_UP}
      forceRedirectUrl={AFTER_SIGN_UP}
    />
  )
}
