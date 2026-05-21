/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references: Letter (28523918-c7ef-481b-b818-d69b6151b768) — serif H1
 * with italic accent; Sequel (50c47480-9451-420b-a372-eb42eda75e56) — hairline
 * editorial section composition.
 */

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
      <div className="mb-8 mt-8 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">Decision support</span>
      </div>
      <h1 className="mb-10 font-serif text-5xl font-normal leading-[1.0] tracking-[-0.03em] text-gray-900 md:text-7xl">
        Real-time guidance<br />
        <span className="italic text-orange-600">at the 3-second window.</span>
      </h1>
      <p className="mb-20 max-w-2xl text-lg leading-[1.7] text-gray-600">
        The 3 seconds between the impulse and the action &mdash; that&rsquo;s where the
        decision actually happens. Ask COYL anything live: eat this, skip today, send
        this text, walk away. Structured answer, no therapy voice, in seconds.
      </p>

      <section className="mb-20 border-l border-orange-500 pl-6 md:pl-8">
        <p className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">Every decision gives you</p>
        <ul className="space-y-4 text-base leading-[1.65] text-gray-700">
          <li><strong className="font-serif font-normal italic text-gray-900">What you&apos;re actually deciding.</strong> The real question, not the surface one.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Best move.</strong> The action your future self will thank you for.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Cost of the worse move.</strong> Immediate cost + pattern cost.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">The excuse you&apos;re probably using.</strong> Classified into one of 8 known self-deception patterns.</li>
          <li><strong className="font-serif font-normal italic text-gray-900">Smallest next move.</strong> One thing you can do in the next 5 minutes.</li>
        </ul>
      </section>

      <section className="mb-20 border-t border-gray-200 pt-12">
        <h2 className="mb-8 font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">Example prompts.</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
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
            <div key={p} className="border-t border-gray-200 py-3 font-serif text-base italic text-gray-700">
              &ldquo;{p}&rdquo;
            </div>
          ))}
        </div>
      </section>

      <Link href="/sign-up" className="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600">
        Try a decision
      </Link>
    </>
  )
}
