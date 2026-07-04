/**
 * /waitlist — the invite-only FOMO surface.
 *
 * "COYL is invite-only. Join the waitlist or get a code from a friend."
 * Robinhood/Lapse mechanic: join → position → jump the line by sharing.
 * The interactive join/position/share lives in the client island
 * (waitlist-view.tsx); this server shell carries the framing + metadata.
 *
 * Public route — added to proxy.ts isPublicRoute as '/waitlist'.
 * NEDA-safe: no body/weight/calorie copy.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { WaitlistView } from './waitlist-view'

export const metadata: Metadata = {
  title: 'COYL is invite-only — request access',
  description:
    'COYL opens to the people who want it first. Request access, or skip the line with a code from a friend. The 60-second pattern audit is free right now.',
  alternates: { canonical: '/waitlist' },
  openGraph: {
    title: 'COYL is invite-only — request access',
    description: 'Request access, or skip the line with a code from a friend.',
    url: 'https://coyl.ai/waitlist',
    images: [{ url: '/api/og?title=COYL+is+invite-only&kicker=Request+access', width: 1200, height: 630 }],
  },
}

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-[#0e0c0a] px-6 py-20 text-[#f5efe6]">
      <div className="mx-auto grid max-w-5xl gap-16 md:grid-cols-2 md:gap-24">
        {/* Left — the pitch */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-500">
              Invite only
            </span>
          </div>
          <h1 className="font-serif text-5xl font-normal leading-[0.98] tracking-[-0.03em] md:text-7xl">
            COYL opens to{' '}
            <span className="italic text-orange-400">the ones who want it first.</span>
          </h1>
          <p className="max-w-md text-lg leading-[1.6] text-[#cdc2ad]">
            We&rsquo;re letting people in a wave at a time. Request access, or skip the line
            with a code from a friend. Every friend who joins through you moves you up.
          </p>
          <p className="text-sm text-[#a59a87]">
            Already know your pattern?{' '}
            <Link href="/audit" className="font-semibold text-orange-400 underline-offset-4 hover:underline">
              Take the 60-second audit →
            </Link>{' '}
            It&rsquo;s free, no account needed.
          </p>
        </div>

        {/* Right — the engine */}
        <div className="flex flex-col justify-center">
          <WaitlistView />
        </div>
      </div>
    </main>
  )
}
