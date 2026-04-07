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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav — glass */}
      <header className="fixed top-0 z-50 w-full">
        <div className="glass mx-4 mt-4 flex items-center justify-between rounded-2xl px-6 py-3">
          <CoylLogo size="md" />
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-block rounded-xl bg-gradient-warm px-5 py-2 text-sm font-semibold text-white shadow-glow-orange transition-all hover:brightness-110"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div className="w-full max-w-3xl mx-auto" style={{ aspectRatio: '800/600' }}>
            <CoylHeroAnimation className="h-full w-full" />
          </div>
        </div>
        <div className="relative flex flex-col gap-8 px-8 pb-16 md:flex-row md:items-end md:justify-between">
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            A system that remembers everything you commit to, follows up until it&apos;s resolved,
            and surfaces what matters — every morning, every night.
          </p>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <Link
              href="/sign-up"
              className="inline-block rounded-2xl bg-gradient-warm px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-glow-orange hover:brightness-110"
            >
              Get started
            </Link>
            <p className="text-xs text-muted-foreground">Free. No credit card.</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px mx-8 bg-border" />

      {/* Three truths */}
      <section className="grid grid-cols-1 gap-px md:grid-cols-3">
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
          <div key={item.number} className="border-r border-border px-8 py-14 last:border-r-0">
            <p className="mb-6 label-xs text-muted-foreground/50">{item.number}</p>
            <h3 className="heading-2 mb-4">{item.heading}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>

      {/* Divider */}
      <div className="h-px mx-8 bg-border" />

      {/* The coil statement */}
      <section className="px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="text-[clamp(1.5rem,3.5vw,2.75rem)] font-bold leading-[1.15] tracking-[-0.025em]">
            A coil stores energy — compressed tension under control. Wound tight, ready to release
            exactly when <span className="text-gradient-warm">you</span> decide.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px mx-8 bg-border" />

      {/* Pricing */}
      <section className="grid grid-cols-1 gap-px md:grid-cols-2">
        {/* Free */}
        <div className="glass mx-4 my-4 rounded-2xl p-8 md:mx-0 md:my-0 md:rounded-none md:border-r md:border-border">
          <p className="mb-2 label-xs text-muted-foreground">Free</p>
          <p className="mb-8 text-5xl font-bold tracking-[-0.03em]">$0</p>
          <ul className="mb-10 space-y-3 text-sm text-muted-foreground">
            {['100 tasks', 'Morning & night reviews', '20 AI assists / month', 'Daily email briefing'].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="glass inline-block rounded-xl px-6 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            Start free
          </Link>
        </div>

        {/* Pro */}
        <div className="relative overflow-hidden rounded-2xl mx-4 my-4 md:mx-0 md:my-0 md:rounded-none bg-charcoal text-white p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="relative">
            <p className="mb-2 label-xs text-orange-400">Pro</p>
            <p className="mb-1 text-5xl font-bold tracking-[-0.03em] text-gradient-warm">$12</p>
            <p className="mb-8 text-sm text-white/50">per month</p>
            <ul className="mb-10 space-y-3 text-sm text-white/70">
              {['Unlimited tasks', 'Unlimited AI assists', 'Repeating follow-up automation', 'Full productivity history', 'Relentless reminder mode'].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="inline-block rounded-xl bg-gradient-warm px-6 py-3 text-sm font-semibold text-white shadow-glow-orange transition-all hover:brightness-110"
            >
              Start Pro trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="h-px bg-border" />
      <footer className="glass flex items-center justify-between px-8 py-6">
        <CoylLogo size="sm" />
        <p className="text-xs tracking-wide text-muted-foreground">&copy; {new Date().getFullYear()} COYL</p>
      </footer>
    </div>
  )
}
