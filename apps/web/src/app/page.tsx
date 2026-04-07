import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CoylLogo } from '@/components/brand/logo'
import { CoylHeroAnimation } from '@/components/brand/CoylHeroAnimation'

export default async function HomePage() {
  const clerkReady = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_...')
  if (clerkReady) {
    const { userId } = await auth()
    if (userId) redirect('/today')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0', color: '#1a1a1a' }}>

      {/* Nav — minimal, no CTA clutter */}
      <header className="flex items-center justify-between px-8 py-7">
        <CoylLogo size="md" />
        <Link
          href="/sign-in"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          Sign in
        </Link>
      </header>

      {/* Hero — animation takes center stage */}
      <section className="relative flex min-h-[90vh] flex-col">
        {/* Animation — full bleed */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div className="w-full max-w-3xl mx-auto" style={{ aspectRatio: '800/600' }}>
            <CoylHeroAnimation className="h-full w-full" />
          </div>
        </div>

        {/* Below animation: copy + CTA */}
        <div className="flex flex-col gap-8 px-8 pb-16 md:flex-row md:items-end md:justify-between">
          <p className="max-w-sm text-base leading-relaxed text-stone-500">
            A system that remembers everything you commit to, follows up until it&apos;s resolved,
            and surfaces what matters — every morning, every night.
          </p>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <Link
              href="/sign-up"
              className="inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#ff6600' }}
            >
              Get started
            </Link>
            <p className="text-xs text-stone-400">Free. No credit card.</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px mx-8" style={{ backgroundColor: '#e5e0d8' }} />

      {/* Three truths — not features, not bullets */}
      <section className="grid grid-cols-1 gap-px md:grid-cols-3" style={{ borderColor: '#e5e0d8' }}>
        {[
          {
            number: '01',
            heading: 'Morning & night.',
            body: 'Two structured reviews a day become your operating rhythm. Start with a plan. End with closed loops.',
          },
          {
            number: '02',
            heading: 'Follow-up or it didn\'t happen.',
            body: 'Every commitment you make gets tracked. The system resurfaces it until it\'s resolved — not ignored.',
          },
          {
            number: '03',
            heading: 'Briefed before you begin.',
            body: 'Wake up to a single, clean view of priorities, overdue items, and what needs your attention today.',
          },
        ].map((item) => (
          <div
            key={item.number}
            className="px-8 py-14"
            style={{ borderRight: '1px solid #e5e0d8' }}
          >
            <p className="mb-6 text-xs font-semibold tracking-[0.15em] text-stone-300">
              {item.number}
            </p>
            <h3 className="mb-4 text-xl font-bold tracking-[-0.02em]" style={{ color: '#1a1a1a' }}>
              {item.heading}
            </h3>
            <p className="text-sm leading-relaxed text-stone-500">{item.body}</p>
          </div>
        ))}
      </section>

      {/* Divider */}
      <div className="h-px mx-8" style={{ backgroundColor: '#e5e0d8' }} />

      {/* The coil statement — editorial, not a quote box */}
      <section className="px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <p
            className="text-[clamp(1.5rem,3.5vw,2.75rem)] font-bold leading-[1.15] tracking-[-0.025em]"
            style={{ color: '#1a1a1a' }}
          >
            A coil stores energy — compressed tension under control. Wound tight, ready to release
            exactly when <span style={{ color: '#ff6600' }}>you</span> decide.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px mx-8" style={{ backgroundColor: '#e5e0d8' }} />

      {/* Pricing — stripped back */}
      <section className="grid grid-cols-1 gap-px md:grid-cols-2">
        {/* Free */}
        <div className="px-8 py-14" style={{ borderRight: '1px solid #e5e0d8' }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">Free</p>
          <p className="mb-8 text-5xl font-bold tracking-[-0.03em]">$0</p>
          <ul className="mb-10 space-y-2 text-sm text-stone-500">
            {['100 tasks', 'Morning & night reviews', '20 AI assists / month', 'Daily email briefing'].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-px w-4 flex-shrink-0" style={{ backgroundColor: '#e5e0d8' }} />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="inline-block border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
          >
            Start free
          </Link>
        </div>

        {/* Pro */}
        <div className="px-8 py-14" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#ff6600' }}>Pro</p>
          <p className="mb-1 text-5xl font-bold tracking-[-0.03em] text-white">$12</p>
          <p className="mb-8 text-sm text-stone-500">per month · $96/year</p>
          <ul className="mb-10 space-y-2 text-sm text-stone-400">
            {['Unlimited tasks', 'Unlimited AI assists', 'Repeating follow-up automation', 'Full productivity history', 'Relentless reminder mode'].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-px w-4 flex-shrink-0" style={{ backgroundColor: '#ff6600', opacity: 0.5 }} />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="inline-block px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#ff6600' }}
          >
            Start Pro trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div className="h-px" style={{ backgroundColor: '#e5e0d8' }} />
      <footer className="flex items-center justify-between px-8 py-6">
        <CoylLogo size="sm" />
        <p className="text-xs tracking-wide text-stone-400">
          © {new Date().getFullYear()} COYL
        </p>
      </footer>
    </div>
  )
}
