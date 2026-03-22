import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, CheckCircle2, Clock, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/today')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold">Chief of Staff</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">Get started free</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          <Zap className="h-3 w-3" /> AI-Powered Execution Partner
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
          The AI assistant that makes sure{' '}
          <span className="text-zinc-400">nothing important gets dropped.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
          Morning planning, night review, follow-up enforcement, task breakdowns, and daily briefings
          — so you stop losing track of what matters.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          Free plan · No credit card required · 20 AI assists/month
        </p>
      </section>

      {/* Features */}
      <section className="border-t bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-zinc-900">
            Built for people who get things done
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: 'Morning & Night Interviews',
                description:
                  'Twice-daily structured check-ins that become your operating rhythm. Plan in the morning. Close loops at night.',
              },
              {
                icon: Clock,
                title: 'Follow-up Enforcement',
                description:
                  "Every outreach task gets a follow-up cadence. The system resurfaces items until they're resolved — not just ignored.",
              },
              {
                icon: CheckCircle2,
                title: 'Non-Dismissable Persistence',
                description:
                  "Tasks can't silently disappear. Complete, snooze, block, or archive with reason. Nothing falls through the cracks.",
              },
              {
                icon: Zap,
                title: 'AI Task Breakdown',
                description:
                  'Say "Break this down" on any task. Get subtasks, effort estimates, a simplified version, and delegation candidates.',
              },
              {
                icon: TrendingUp,
                title: 'Productivity Coaching',
                description:
                  'Pattern recognition across your work. When you complete work, what you postpone, where attention goes.',
              },
              {
                icon: CheckCircle2,
                title: 'Daily Email Briefings',
                description:
                  'Wake up to a clean summary of priorities, completed work, overdue items, and follow-ups due today.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-white p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                  <feature.icon className="h-5 w-5 text-zinc-700" />
                </div>
                <h3 className="mb-2 font-semibold text-zinc-900">{feature.title}</h3>
                <p className="text-sm text-zinc-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900">
            Simple, honest pricing
          </h2>
          <p className="mb-12 text-zinc-500">Start free. Upgrade when you need the full assistant.</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border p-6 text-left">
              <h3 className="font-semibold text-zinc-900">Free</h3>
              <div className="mt-2 text-3xl font-bold">$0</div>
              <p className="mt-1 text-sm text-zinc-500">Forever free</p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-600">
                {[
                  'Up to 100 tasks',
                  'Morning & night interviews',
                  '20 AI assists/month',
                  'Basic daily briefing',
                  '7-day insights',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant="outline" asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>
            {/* Pro */}
            <div className="rounded-xl border-2 border-zinc-900 bg-zinc-900 p-6 text-left">
              <h3 className="font-semibold text-white">Pro</h3>
              <div className="mt-2 text-3xl font-bold text-white">
                $12<span className="text-lg font-normal text-zinc-400">/month</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">or $96/year (save 33%)</p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-300">
                {[
                  'Unlimited tasks',
                  'Unlimited AI assists',
                  'Repeating follow-up automation',
                  'Advanced daily briefings',
                  'Full productivity history',
                  'Relentless reminder mode',
                  'Task export',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full bg-white text-zinc-900 hover:bg-zinc-100" asChild>
                <Link href="/sign-up">Upgrade to Pro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-zinc-400">
        <p>© {new Date().getFullYear()} Chief of Staff. Your AI execution partner.</p>
      </footer>
    </div>
  )
}
