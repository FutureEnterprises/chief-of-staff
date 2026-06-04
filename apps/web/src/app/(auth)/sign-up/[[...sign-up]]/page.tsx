import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'
import { INVITE_COOKIE, signupAllowed } from '@/lib/waitlist-gate'

/**
 * Post sign-up destination. New accounts go straight to /onboarding for
 * the 6-step autopilot-mapping wizard; /onboarding itself redirects to
 * /today if the user has already completed onboarding (for the rare case
 * someone completes sign-up and re-lands here with a stale session).
 *
 * Do NOT leave this unset — Clerk's default is `/`, which double-hops
 * through the marketing page before the logged-in redirect catches them.
 */
const AFTER_SIGN_UP = '/onboarding'

/**
 * The page shell is static. ALL dynamic reads (the gate's cookies() +
 * searchParams, and Clerk's internal cookies()/headers()) live inside
 * the Suspense boundary via <GatedSignUp> — required by Next 16
 * cacheComponents, which rejects uncached reads outside <Suspense>.
 */
export default function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ 'sign-up'?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <Suspense fallback={null}>
      <GatedSignUp params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function GatedSignUp({
  params,
  searchParams,
}: {
  params: Promise<{ 'sign-up'?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { 'sign-up': segments } = await params
  const sp = await searchParams

  // Invite-only gate (OPT-IN via WAITLIST_GATE_ENABLED; default OFF).
  // Gate ONLY the bare /sign-up entry — never Clerk's internal sub-steps
  // (verify-email-address, sso-callback, continue), so a mid-flow user is
  // never bounced. The access cookie + bypass refs carry through anyway.
  const isRoot = !segments || segments.length === 0
  if (isRoot) {
    const jar = await cookies()
    const hasInviteCookie = Boolean(jar.get(INVITE_COOKIE)?.value)
    if (!signupAllowed({ hasInviteCookie, searchParams: sp })) {
      redirect('/waitlist')
    }
  }

  return (
    <SignUp
      signInUrl="/sign-in"
      fallbackRedirectUrl={AFTER_SIGN_UP}
      forceRedirectUrl={AFTER_SIGN_UP}
    />
  )
}
