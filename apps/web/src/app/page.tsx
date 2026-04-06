import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CoylLogo } from '@/components/brand/logo'
import { CheckCircle2, Clock, MessageSquare, TrendingUp, ArrowRight, Zap } from 'lucide-react'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/today')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0' }}>

      {/* Nav */}
      <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-[#f5f5f0]/80 px-8 backdrop-blur-sm sticky top-0 z-50">
        <CoylLogo size="md" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-stone-600 hover:text-stone-900">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="bg-[#1a1a1a] text-white hover:bg-stone-800">
            <Link href="/sign-up">Get started free</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-8 pt-28 pb-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-4 py-1.5 text-xs font-medium text-stone-500 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff6600]" />
          Control Your Life
        </div>

        <h1 className="text-6xl font-bold tracking-[-0.04em] text-[#1a1a1a] leading-[1.05]">
          Your life is a coil.<br />
          <span style={{ color: '#ff6600' }}>COYL</span> keeps it wound tight.
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-lg text-stone-500 leading-relaxed">
          Morning planning, follow-up enforcement, AI breakdowns, and daily briefings —
          so nothing important slips through the cracks.
        </p>

        <div className="mt-12 flex items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="bg-[#ff6600] text-white hover:bg-[#e05c00] shadow-lg shadow-orange-200 px-8"
          >
            <Link href="/sign-up">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-stone-300 text-stone-700 bg-white hover:bg-stone-50">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>

        <p className="mt-5 text-xs text-stone-400 tracking-wide">
          FREE PLAN · NO CREDIT CARD · 20 AI ASSISTS/MONTH
        </p>
      </section>

      {/* Coil callout */}
      <section className="mx-auto max-w-3xl px-8 pb-16">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-700 leading-relaxed">
            &ldquo;A coil stores energy — compressed tension under your command.
            <br />
            <span className="font-bold text-[#1a1a1a]">Ready to release on YOUR signal.</span>&rdquo;
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stone-200 bg-white px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold tracking-[-0.03em] text-[#1a1a1a]">
            Built for people who execute
          </h2>
          <p className="mb-14 text-center text-stone-500">Not for people who collect apps.</p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: 'Morning & Night Reviews',
                description: 'Twice-daily structured check-ins that become your operating rhythm. Plan in the morning. Close loops at night.',
              },
              {
                icon: Clock,
                title: 'Follow-up Enforcement',
                description: "Every outreach task gets a follow-up cadence. The system resurfaces items until they're resolved — not just ignored.",
              },
              {
                icon: CheckCircle2,
                title: 'Nothing Gets Dropped',
                description: "Tasks can't silently disappear. Complete, snooze, block, or archive with reason. Accountability is built in.",
              },
              {
                icon: Zap,
                title: 'AI Task Breakdown',
                description: 'Say "Break this down" on any task. Get subtasks, effort estimates, a simplified version, and delegation candidates.',
              },
              {
                icon: TrendingUp,
                title: 'Productivity Coaching',
                description: 'Pattern recognition across your work. When you complete, what you postpone, where attention actually goes.',
              },
              {
                icon: CheckCircle2,
                title: 'Daily Email Briefings',
                description: 'Wake up to a clean summary of priorities, completed work, overdue items, and follow-ups due today.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-stone-200 bg-[#f5f5f0]/60 p-6 hover:border-stone-300 transition-colors">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff6600]/10">
                  <feature.icon className="h-5 w-5 text-[#ff6600]" />
                </div>
                <h3 className="mb-2 font-semibold text-[#1a1a1a]">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-8 py-20" style={{ backgroundColor: '#f5f5f0' }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-[-0.03em] text-[#1a1a1a]">
            Simple, honest pricing
          </h2>
          <p className="mb-14 text-stone-500">Start free. Upgrade when you need the full system.</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-stone-200 bg-white p-7 text-left">
              <h3 className="font-semibold text-stone-900">Free</h3>
              <div className="mt-2 text-4xl font-bold text-[#1a1a1a] tracking-tight">$0</div>
              <p className="mt-1 text-sm text-stone-400">Forever free</p>
              <ul className="mt-7 space-y-2.5 text-sm text-stone-600">
                {['Up to 100 tasks', 'Morning & night reviews', '20 AI assists/month', 'Basic daily briefing', '7-day insights'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#ff6600]" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-7 w-full" variant="outline" asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-[#1a1a1a] bg-[#1a1a1a] p-7 text-left">
              <div className="mb-1 text-xs font-semibold tracking-widest text-[#ff6600]">MOST POPULAR</div>
              <h3 className="font-semibold text-white">Pro</h3>
              <div className="mt-2 text-4xl font-bold text-white tracking-tight">
                $12<span className="text-lg font-normal text-stone-400">/mo</span>
              </div>
              <p className="mt-1 text-sm text-stone-400">or $96/year — save 33%</p>
              <ul className="mt-7 space-y-2.5 text-sm text-stone-300">
                {['Unlimited tasks', 'Unlimited AI assists', 'Repeating follow-up automation', 'Advanced daily briefings', 'Full productivity history', 'Relentless reminder mode', 'Task export', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#ff6600]" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-7 w-full bg-[#ff6600] text-white hover:bg-[#e05c00]"
                asChild
              >
                <Link href="/sign-up">Start Pro free trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 px-8 py-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <CoylLogo size="sm" />
          <p className="text-xs text-stone-400 tracking-wide">
            © {new Date().getFullYear()} COYL — CONTROL YOUR LIFE
          </p>
        </div>
      </footer>
    </div>
  )
}
