import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'COYL decision engine \u2014 cut through your own rationalization',
  description:
    "When your autopilot is about to decide for you, COYL cuts through. Structured decisions: best move, cost of the worse one, the excuse you're using, smallest next step. Under 120 words, no therapy voice.",
  alternates: { canonical: '/decision-support' },
  openGraph: {
    title: 'COYL decision engine',
    description:
      "Structured decisions. Best move, cost of the worse one, the excuse you're using, smallest next step.",
    url: 'https://coyl.ai/decision-support',
  },
}

export default function DecisionSupportPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Decision support</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        When you don&apos;t trust your own<br />judgment in the moment.
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-400">
        Ask COYL any live decision — should I eat this, skip today, send this text, buy this,
        walk away? You get a structured answer in seconds.
      </p>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-orange-500">Every decision gives you</p>
        <ul className="space-y-4 text-sm text-gray-300">
          <li><strong className="text-white">What you&apos;re actually deciding</strong> — the real question, not the surface one.</li>
          <li><strong className="text-white">Best move</strong> — the action your future self will thank you for.</li>
          <li><strong className="text-white">Cost of the worse move</strong> — immediate cost + pattern cost.</li>
          <li><strong className="text-white">The excuse you&apos;re probably using</strong> — classified into one of 8 known self-deception patterns.</li>
          <li><strong className="text-white">Smallest next move</strong> — one thing you can do in the next 5 minutes.</li>
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">Example prompts</h2>
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-400 md:grid-cols-2">
          {[
            'Should I eat this?',
            'Should I skip the workout?',
            'Should I order takeout?',
            'Should I drink tonight?',
            'Should I buy this?',
            'Should I send this text?',
            'Is this a craving or real hunger?',
            'Should I keep scrolling?',
          ].map((p) => (
            <div key={p} className="rounded-lg border border-white/5 bg-black/30 px-4 py-3">
              &ldquo;{p}&rdquo;
            </div>
          ))}
        </div>
      </section>

      <Link href="/sign-up" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Try a decision
      </Link>
    </>
  )
}
