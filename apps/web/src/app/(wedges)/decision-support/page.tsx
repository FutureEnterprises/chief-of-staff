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
      <div className="mb-20 max-w-2xl space-y-4 font-serif text-2xl font-normal leading-[1.35] text-gray-900 md:text-3xl">
        <p>9:47 PM. You&rsquo;re standing at the fridge. The door is open.</p>
        <p>You&rsquo;re not hungry. You know you&rsquo;re not hungry.</p>
        <p>You ask COYL anyway: <span className="italic text-orange-600">&ldquo;Should I eat this?&rdquo;</span></p>
        <p>Here&rsquo;s exactly what you get back.</p>
      </div>

      <blockquote className="mb-20 max-w-3xl border-l border-orange-500 pl-6 font-serif text-3xl italic leading-[1.3] text-gray-900 md:text-4xl">
        AI for the moment before behavior happens.
      </blockquote>

      <section className="mb-20 border-l border-orange-500 pl-6 md:pl-8">
        <p className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">Your question: &ldquo;Should I eat this at 9:47 PM?&rdquo;</p>
        <ul className="space-y-6 text-base leading-[1.65] text-gray-700">
          <li>
            <strong className="font-serif font-normal italic text-gray-900">Best move.</strong>{' '}
            Close the fridge. Drink a glass of water. Walk to another room for five minutes. If you&rsquo;re still thinking about it then, decide.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">Worst case if you don&rsquo;t.</strong>{' '}
            One handful turns into the whole bag. Tomorrow starts with &ldquo;I already blew it.&rdquo; The Tuesday-night pattern wins again.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">Excuse detected.</strong>{' '}
            &ldquo;I deserve this.&rdquo; Category: Reward. You&rsquo;ve said it 14&times; this month. It&rsquo;s the sentence, not the snack.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">Smallest step.</strong>{' '}
            Close the door. That&rsquo;s it. One physical move. The next decision gets easier.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">Your choice.</strong>{' '}
            COYL doesn&rsquo;t decide for you. It hands you the structure. The hand on the door is still yours.
          </li>
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
        Should I eat this? &rarr;
      </Link>
    </>
  )
}
