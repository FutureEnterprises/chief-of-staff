import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { ensureUserExists } from '@/lib/auth'
import { OnboardingWizard } from './onboarding-wizard'

export const metadata = { title: 'Welcome to COYL' }

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}

async function OnboardingContent() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await ensureUserExists()
  if (user.onboardingCompleted) redirect('/today')

  return <OnboardingWizard user={user} />
}
