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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
