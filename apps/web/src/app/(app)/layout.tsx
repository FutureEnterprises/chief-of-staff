import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Toaster } from '@/components/ui/toaster'
import { ensureUserExists } from '@/lib/auth'

/**
 * App shell with auth gate. The auth check (`auth()` + `ensureUserExists()`)
 * lives in AuthGuardedShell behind a Suspense boundary so the surrounding
 * dark canvas can render statically — required by Next 16 cacheComponents,
 * which forbids uncached data fetches outside Suspense.
 *
 * The `dark` class flips every shadcn CSS-var-driven primitive (Card,
 * Skeleton, Input, Dialog, Popover, etc.) inside the app shell. Marketing
 * surfaces stay light because they're under (wedges) and don't inherit
 * this `dark` class.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex h-screen overflow-hidden bg-[#0e0d0b] text-[#f5f3ee]">
      <Suspense fallback={<div className="flex-1" />}>
        <AuthGuardedShell>{children}</AuthGuardedShell>
      </Suspense>
      <Toaster />
    </div>
  )
}

async function AuthGuardedShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await ensureUserExists()
  if (!user.onboardingCompleted) redirect('/onboarding')

  return (
    <>
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </>
  )
}
