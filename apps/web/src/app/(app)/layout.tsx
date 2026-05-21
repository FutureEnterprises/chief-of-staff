import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Toaster } from '@/components/ui/toaster'
import { ensureUserExists } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await ensureUserExists()
  if (!user.onboardingCompleted) redirect('/onboarding')

  // Warm charcoal canvas — the operator surface stays dark across every
  // logged-in route. The luxury overhaul (5e03bb7 / 848bafa) introduced
  // off-white serif text (#f5f3ee) and section accents that ONLY read on
  // a warm dark bg. Previously `bg-background` resolved via the CSS vars
  // in globals.css to the cream marketing surface, which made signed-in
  // headers invisible (light text on cream). Hardcoded so the contract
  // is explicit: app = warm dark, marketing = cream.
  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0d0b] text-[#f5f3ee]">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
