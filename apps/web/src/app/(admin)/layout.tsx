import { Suspense } from 'react'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { isCurrentUserAdmin } from '@/lib/admin/is-admin'

export const metadata = { title: 'COYL Admin', robots: { index: false, follow: false } }

/**
 * (admin) route-group layout. The admin-email check sits behind a
 * Suspense boundary so the dark operator chrome can render statically —
 * required by Next 16 cacheComponents, which forbids uncached data
 * fetches outside Suspense.
 *
 * Standard Clerk auth.protect() still fires in middleware before this
 * runs — the layout is the SECOND line of defense and the human-facing
 * Forbidden screen.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminGuardedShell>{children}</AdminGuardedShell>
    </Suspense>
  )
}

function AdminShellFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <header className="border-b border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
            COYL Admin
          </span>
        </div>
      </header>
    </div>
  )
}

async function AdminGuardedShell({ children }: { children: React.ReactNode }) {
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-gray-100">
        <div className="w-full max-w-md border border-white/10 bg-[#111] p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500">
            403 · Forbidden
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Admin only</h1>
          <p className="mt-3 text-sm text-gray-400">
            This surface is restricted to the COYL operator. If you reached this
            page in error, head back to the public site.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="border border-white/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-200 hover:border-orange-500 hover:text-orange-500"
            >
              ← Back to site
            </Link>
            <SignOutButton>
              <button className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500 hover:text-gray-200">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <header className="border-b border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-baseline gap-3">
            <Link
              href="/admin/marketing"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-100 hover:text-orange-500"
            >
              COYL Admin
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
              Marketing
            </span>
          </div>
          <SignOutButton>
            <button className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
