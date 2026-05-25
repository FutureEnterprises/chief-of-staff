/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1
 *     with italic accent on "visualized."
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): the Wrapped
 *     card grid retains its glossy character (it's the product surface),
 *     but the page composition around it becomes gallery-mast hairlines.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): pattern-feature grid
 *     rendered as paired editorial entries on top borders.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): pull-quote callout in
 *     oversized italic serif on hairline.
 *
 * Design note: the four "Wrapped" cards retain their soft-gradient form
 * because they are screenshot artifacts — the product literally hands these
 * to the user. Editorial pattern applies to the page chrome around them,
 * not the artifacts themselves.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, Clock, Layers, MessageSquareQuote } from 'lucide-react'
import { YourAutopilotMapBanner } from '@/components/landing/your-autopilot-map-banner'

export const metadata: Metadata = {
  title: 'Autopilot map — your danger windows, visualized',
  description: 'The exact hours your script fires. The excuses you forget you use. The chains you keep running. COYL maps the autopilot so it stops being invisible.',
  keywords: [
    'autopilot map',
    'behavior pattern visualization',
    'excuse tracker',
    'danger window heatmap',
    'self-trust score',
    'failure chain detection',
  ],
  alternates: { canonical: '/autopilot-map' },
  openGraph: {
    title: 'Autopilot map — your danger windows, visualized',
    description: 'The exact hours your script fires. The excuses you forget you use. The chains you keep running.',
    url: 'https://coyl.ai/autopilot-map',
    images: [
      {
        url: '/api/og?title=Your+danger+windows%2C+visualized.&kicker=Autopilot+map',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autopilot map — your danger windows, visualized',
    description: 'The exact hours your script fires. The excuses you forget you use.',
    images: ['/api/og?title=Your+danger+windows%2C+visualized.&kicker=Autopilot+map'],
  },
}

export default function PatternsMarketingPage() {
  return (
    <div className="space-y-24 pb-12">
      {/* Personalized banner — renders the signed-in visitor's most
          recent AutopilotMapSnapshot when one exists, a "publishes
          Monday" banner if they're signed in but have none yet, or
          nothing at all for signed-out prospects. Client component so
          the marketing surface stays statically rendered (Cache
          Components contract). See its module doc for the full state
          contract. */}
      <YourAutopilotMapBanner />

      <header className="space-y-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Patterns
          </span>
        </div>
        <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
          Your danger windows,<br />
          <span className="italic text-orange-600">visualized.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
          The exact hours your script fires. The excuses you forget you use. The chains
          you keep running. COYL maps the autopilot so it stops being invisible &mdash;
          and so it can be caught.
        </p>
      </header>

      {/* Share-card machine — Spotify Wrapped for self-sabotage. Screenshot-able
          mini-posters that surface a user's autopilot signature in one frame. The
          cards themselves are product artifacts, kept in soft-gradient form. */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-orange-500" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Your autopilot, on a card
              </span>
            </div>
            <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Spotify Wrapped <span className="italic text-orange-600">for self-sabotage.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-[1.65] text-gray-700">
            Finish the audit and COYL prints your pattern signature on cards built
            for the camera roll. Examples below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 — Danger window */}
          <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                <Clock className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
                COYL / Wrapped
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                My danger window
              </p>
              <p className="mt-2 font-serif text-5xl font-normal leading-none tracking-tight text-gray-900">
                9:08 <span className="text-orange-500">PM</span>
              </p>
              <p className="mt-3 text-xs text-gray-600">
                Tue–Thu spike. Always after dinner. Always alone.
              </p>
            </div>
          </div>

          {/* Card 2 — Top excuse */}
          <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                <MessageSquareQuote className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
                COYL / Wrapped
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                My excuse
              </p>
              <div className="mt-2 flex items-start gap-1">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="-mt-1 h-7 w-7 flex-shrink-0 text-orange-400"
                  fill="currentColor"
                >
                  <path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3v2a5 5 0 0 0 5-5V9a2 2 0 0 0 0-2zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3v2a5 5 0 0 0 5-5V9a2 2 0 0 0 0-2z" />
                </svg>
                <p className="font-serif text-2xl font-normal italic leading-tight text-gray-900">
                  I deserve this.
                </p>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="-mt-1 h-7 w-7 flex-shrink-0 rotate-180 text-orange-400"
                  fill="currentColor"
                >
                  <path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3v2a5 5 0 0 0 5-5V9a2 2 0 0 0 0-2zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3v2a5 5 0 0 0 5-5V9a2 2 0 0 0 0-2z" />
                </svg>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Said 14&times; this month. Category: Reward.
              </p>
            </div>
          </div>

          {/* Card 3 — Archetype */}
          <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
                COYL / Wrapped
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                My archetype
              </p>
              <p className="mt-2 font-serif text-3xl font-normal leading-tight tracking-tight text-gray-900">
                Monday
                <br />
                <span className="italic text-orange-600">
                  Resetter
                </span>
              </p>
              <p className="mt-3 text-xs text-gray-600">
                Lives for the clean slate. Hates the Thursday wobble.
              </p>
            </div>
          </div>

          {/* Card 4 — Pattern week */}
          <div className="relative flex aspect-[280/320] flex-col justify-between overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-[0_24px_60px_-12px_rgba(255,102,0,0.18)]">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                <Layers className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500/80">
                COYL / Wrapped
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
                My pattern week
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Tue', 'Thu', 'Sun'].map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-orange-300 bg-white px-3 py-1.5 font-serif text-sm font-normal italic text-orange-600 shadow-[0_2px_8px_-4px_rgba(255,102,0,0.4)]"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-600">
                3 of 7 nights run the same script. COYL stands in the doorway.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(255,102,0,0.6)]"
          >
            Generate yours &rarr;
          </Link>
          <p className="text-xs text-gray-600">
            ~3 minutes. No signup to see your cards.
          </p>
        </div>
      </section>

      {/* Pattern features — demo outputs, paired editorial entries on hairlines */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Example output. Your map is yours.
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Six views of your autopilot, <span className="italic text-orange-600">side by side.</span>
        </h2>
        <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-2">
          {[
            {
              label: 'FAILURE CHAIN DETECTED',
              lines: [
                'You missed your weigh-in Tuesday.',
                'You binged Wednesday night.',
                'This has happened 4 times in 6 weeks.',
              ],
              cta: 'COYL will interrupt the Tuesday pattern — before Wednesday becomes inevitable.',
            },
            {
              label: 'DANGER WINDOW MAPPED',
              lines: [
                'Tuesday + Thursday, 9:08 PM.',
                '14 of your last 18 slips fired in this hour.',
                'You haven’t once made it to 10 PM clean on a Thursday.',
              ],
              cta: 'COYL will fire at 9:05 PM Tuesday — three minutes before the door opens.',
            },
            {
              label: 'TOP EXCUSE DETECTED',
              lines: [
                '“I deserve this.”',
                'Said 14 times this month. Category: Reward.',
                'Wins 71% of the time it shows up.',
              ],
              cta: 'COYL will name it back to you the next time it loads — before you finish the sentence.',
            },
            {
              label: 'RECOVERY SPEED TRACKED',
              lines: [
                'Six weeks ago: a slip cost you 4 days.',
                'Two weeks ago: a slip cost you 1 day.',
                'Last week: a slip cost you the next morning. That’s it.',
              ],
              cta: 'COYL is training your self-trust metric. The bounce-back is the product.',
            },
            {
              label: 'WHAT ACTUALLY WORKED',
              lines: [
                'The 9:08 PM push lands when it’s phrased as a question, not a command.',
                '“Walk five minutes” succeeds 3× more than “close the fridge.”',
                'The cold-water interrupt works on Tuesday. Not on Sunday.',
              ],
              cta: 'COYL keeps the moves that work for YOU. Drops the ones that don’t.',
            },
            {
              label: 'IDENTITY TREND',
              lines: [
                'Week 1: sleepwalking.',
                'Week 4: avoidant.',
                'Week 9: recovering.',
                'Week 14: resilient.',
              ],
              cta: 'COYL is tracking who you’re becoming — not who you were when you signed up.',
            },
          ].map((p) => (
            <div key={p.label} className="border-t border-gray-200 pt-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {p.label}
              </p>
              <div className="mt-4 space-y-2 font-serif text-xl font-normal leading-[1.35] text-gray-900 md:text-2xl">
                {p.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <p className="mt-4 text-base italic leading-[1.65] text-orange-600">{p.cta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pull-quote callout */}
      <section className="border-t border-orange-500 pt-16">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Example callout
        </p>
        <blockquote className="mt-6 max-w-3xl font-serif text-3xl font-normal italic leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-4xl">
          &ldquo;You said &lsquo;I&apos;ll start tomorrow&rsquo; 9 times in 3 weeks. That is not a plan. That is your avoidance phrase.&rdquo;
        </blockquote>
        <p className="mt-6 text-xs text-gray-600">— Example COYL pattern callout</p>
      </section>

      <section className="border-t border-gray-200 pt-16">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/sign-up"
            className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Map my autopilot
          </Link>
          {/* Secondary CTA — explicit invitation to non-signed-in
              visitors who want to see THEIR map, not the example. The
              signed-in YourAutopilotMapBanner above covers the inverse
              path (already-authed users see their map inline). */}
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            See your real map &rarr;
          </Link>
        </div>
      </section>
    </div>
  )
}
