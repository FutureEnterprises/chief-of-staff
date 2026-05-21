/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references: Letter (28523918-c7ef-481b-b818-d69b6151b768) — serif H1
 * with italic accent; Cori Corinne (08b879e1-2871-488f-b573-38e438e9a85c) —
 * gallery breathing between editorial sections.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SafetyBanner } from '@/components/safety/safety-banner'

export const metadata: Metadata = {
  title: 'Recovery — same-night re-entry. No spiral. No restart.',
  description: 'COYL catches you tonight, not next Monday. The slip is data, not damage. Same-night re-entry, 1-day grace on streaks, no Monday reset, no shame loop.',
  keywords: [
    'recovery from slip app',
    'shame-resistant behavior change',
    'no monday reset app',
    'streak forgiveness app',
    'slip recovery protocol',
  ],
  alternates: { canonical: '/recovery' },
  openGraph: {
    title: 'Recovery — same-night re-entry. No spiral. No restart.',
    description: 'COYL catches you tonight, not next Monday. The slip is data, not damage.',
    url: 'https://coyl.ai/recovery',
    images: [
      {
        url: '/api/og?title=Same-night+re-entry.+No+spiral.+No+restart.&kicker=Recovery+engine',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recovery — same-night re-entry. No spiral. No restart.',
    description: 'Same-night re-entry. No Monday reset. 1-day grace on streaks.',
    images: ['/api/og?title=Same-night+re-entry.+No+spiral.+No+restart.&kicker=Recovery+engine'],
  },
}

export default function RecoveryPage() {
  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">Recovery</span>
      </div>
      <h1 className="mb-10 font-serif text-5xl font-normal leading-[1.0] tracking-[-0.03em] text-gray-900 md:text-7xl">
        Same-night re-entry.<br />
        <span className="italic text-orange-600">No spiral. No restart.</span>
      </h1>
      <p className="mb-20 max-w-2xl text-lg leading-[1.7] text-gray-600">
        COYL catches you tonight, not next Monday. The slip is data, not damage.
        Same-night stabilizing actions, 1-day grace on the streak, no Monday reset,
        no shame loop. You resume the loop you were already running.
      </p>

      <section className="mb-20 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
        {[
          { title: 'No Monday reset', body: 'Today is still redeemable. Tomorrow is not a clean slate — it\'s the next move.' },
          { title: '1-day grace period on streaks', body: 'Miss one day? Streak holds. Resume, don\'t restart.' },
          { title: 'Same-night recovery protocol', body: 'Specific stabilizing actions within the next 2 hours and 24 hours. No vague advice.' },
          { title: 'Shame-resistant re-entry', body: 'After silence, COYL doesn\'t guilt you back. It meets you where you are.' },
          { title: 'Pattern note on every slip', body: 'What does this slip tell us about the script? Data, not judgment.' },
          { title: 'No starvation compensation', body: 'For weight loss users, we specifically block the "skip the next meal" script that makes bingeing worse.' },
        ].map((f) => (
          <div key={f.title} className="border-t border-gray-200 pt-5">
            <h3 className="mb-3 font-serif text-xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">{f.title}</h3>
            <p className="text-sm leading-[1.65] text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-20 border-t border-orange-500 pt-10">
        <p className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">The retention metric that matters</p>
        <h2 className="mb-6 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-5xl">
          Most apps optimize for DAU. <span className="italic text-orange-600">We optimize for one number.</span>
        </h2>
        <p className="mt-6 font-serif text-2xl font-normal italic leading-[1.3] text-gray-900 md:text-3xl">
          % of users who recover within 24 hours of a slip.
        </p>
        <p className="mt-6 text-sm leading-[1.65] text-gray-600">
          That&apos;s the measurement that aligns product value with user value.
        </p>
      </section>

      <SafetyBanner variant="inline" />

      <Link href="/sign-up" className="mt-12 inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600">
        Start anyway
      </Link>
    </>
  )
}
