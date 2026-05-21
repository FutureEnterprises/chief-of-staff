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

  // Warm charcoal canvas + `dark` class on the app shell. The hardcoded
  // bg covers the outer container; the `dark` class flips every shadcn
  // CSS-var-driven primitive inside (Card, Skeleton, Input, Dialog,
  // Popover, etc.) to its dark variant. Without `dark` here, child
  // components resolve --background/--card/--muted to the LIGHT marketing
  // variants (white cards), which on top of our hardcoded dark canvas
  // produced the "huge grey panels on black" failure mode seen on
  // /patterns and /projects.
  //
  // Marketing surfaces stay light because they're under (wedges) and
  // don't inherit this `dark` class.
  return (
    <div className="dark flex h-screen overflow-hidden bg-[#0e0d0b] text-[#f5f3ee]">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
