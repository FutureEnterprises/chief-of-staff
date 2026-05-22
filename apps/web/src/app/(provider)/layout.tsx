import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { getCurrentProvider, anonymizePatientName } from '@/lib/provider-rbac'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'COYL Provider',
  robots: { index: false, follow: false },
}

/**
 * (provider) route-group layout — the clinical / clinician surface.
 *
 * Distinct from /(wedges) (marketing, cream bg, serif headings) and
 * /(admin) (operator, near-black bg, monospace). This surface is the
 * one a prescriber or pharma BD partner will see in a demo or during
 * diligence, so the aesthetic is deliberately clinical-light:
 *   - gray-50 background, slate text, white cards
 *   - smaller serif headings (Charter / serif fallback via Tailwind's
 *     font-serif token already loaded on the marketing pages)
 *   - sidebar nav with Cohort / Settings / Help
 *   - top bar with provider's anonymized display name + sign out
 *
 * Gating: Clerk's middleware (proxy.ts) already requires sign-in
 * because /provider is NOT in the public-route matcher. This layout
 * is the SECOND gate — getCurrentProvider() rejects users without
 * planType ∈ {PRO, TEAM}. Non-providers get a Forbidden surface, not
 * a 404, so a curious user knows they're authenticated but ungated.
 */
export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const provider = await getCurrentProvider()

  if (!provider) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-slate-900">
        <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            403 · Forbidden
          </p>
          <h1 className="mt-3 font-serif text-2xl tracking-tight">
            Provider access only
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This surface is restricted to clinicians and partner organizations
            with a provider plan. If you reached this page in error, head back
            to the main app.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <Link
              href="/today"
              className="rounded-sm border border-slate-300 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-700 hover:border-slate-900 hover:text-slate-900"
            >
              Back to app
            </Link>
            <SignOutButton>
              <button className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500 hover:text-slate-900">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-5 py-5">
          <Link
            href="/provider"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-900 hover:text-slate-600"
          >
            COYL · Provider
          </Link>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-2 text-sm">
          <Link
            href="/provider/cohort"
            className="rounded-sm px-2 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Cohort
          </Link>
          <Link
            href="/provider"
            className="rounded-sm px-2 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Overview
          </Link>
          <span className="rounded-sm px-2 py-1.5 text-slate-400">Settings</span>
          <span className="rounded-sm px-2 py-1.5 text-slate-400">Help</span>
        </nav>
        <div className="mt-auto px-5 py-4 text-[10px] uppercase tracking-[0.12em] text-slate-400">
          v0.1 · HIPAA-light
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-base tracking-tight">
                {anonymizePatientName(provider.name)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                Provider · {provider.planType}
              </span>
            </div>
            <SignOutButton>
              <button className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-900">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
