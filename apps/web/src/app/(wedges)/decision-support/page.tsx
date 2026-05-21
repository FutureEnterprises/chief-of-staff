import type { Metadata } from 'next'
import Link from 'next/link'
import { SafetyBanner } from '@/components/safety/safety-banner'

export const metadata: Metadata = {
  title: 'COYL decision engine \u2014 real-time guidance at the 3-second window',
  description:
    "The 3 seconds between the impulse and the action \u2014 that's where the decision actually happens. COYL gives you the structured answer right there. Best move, cost of the worse one, the excuse you're using, the smallest next step.",
  alternates: { canonical: '/decision-support' },
  openGraph: {
    title: 'Real-time guidance at the 3-second window',
    description:
      "The 3 seconds between the impulse and the action \u2014 that's where the decision actually happens. COYL is there.",
    url: 'https://coyl.ai/decision-support',
    images: [
      {
        url: '/api/og?title=Real-time+guidance+at+the+3-second+window.&kicker=Decision+engine',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real-time guidance at the 3-second window',
    description: "The 3 seconds between the impulse and the action. COYL is there.",
    images: ['/api/og?title=Real-time+guidance+at+the+3-second+window.&kicker=Decision+engine'],
  },
}

export default function DecisionSupportPage() {
  return (
    <>
      <SafetyBanner variant="inline" />
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Decision support</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Real-time guidance<br />
        <span className="text-orange-600">at the 3-second window.</span>
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-600">
        The 3 seconds between the impulse and the action &mdash; that&rsquo;s where the
        decision actually happens. Ask COYL anything live: eat this, skip today, send
        this text, walk away. Structured answer, no therapy voice, in seconds.
      </p>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-orange-500">Every decision gives you</p>
        <ul className="space-y-4 text-sm text-gray-700">
          <li><strong className="text-gray-900">What you&apos;re actually deciding</strong> — the real question, not the surface one.</li>
          <li><strong className="text-gray-900">Best move</strong> — the action your future self will thank you for.</li>
          <li><strong className="text-gray-900">Cost of the worse move</strong> — immediate cost + pattern cost.</li>
          <li><strong className="text-gray-900">The excuse you&apos;re probably using</strong> — classified into one of 8 known self-deception patterns.</li>
          <li><strong className="text-gray-900">Smallest next move</strong> — one thing you can do in the next 5 minutes.</li>
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Example prompts</h2>
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
          {[
            'Should I eat this?',
            'Should I skip the workout?',
            'Should I order takeout?',
            'Should I send the follow-up?',
            'Should I buy this?',
            'Should I send this text?',
            'Should I close my laptop?',
            'Should I keep scrolling?',
          ].map((p) => (
            <div key={p} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
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
