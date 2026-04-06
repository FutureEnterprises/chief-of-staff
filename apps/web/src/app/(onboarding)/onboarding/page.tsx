import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { ensureUserExists } from '@/lib/auth'
import { OnboardingWizard } from './onboarding-wizard'

export const metadata = { title: 'Welcome to Chief of Staff' }

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await ensureUserExists()
  if (user.onboardingCompleted) redirect('/today')

  return <OnboardingWizard user={user} />
}
