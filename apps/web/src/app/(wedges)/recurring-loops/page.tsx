/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): pattern grid as gallery
 *     columns on hairline rules.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): shared-loop sequence
 *     re-rendered as serif-italic chain on hairline.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     openers; SafetyBanner preserved.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SafetyBanner } from '@/components/safety/safety-banner'

/**
 * Autopilot loops page — the wedge URL is kept for SEO inheritance,
 * but the page now reframes COYL as a PATTERN RECOGNITION tool, not
 * a treatment / recovery / dependency product.
 *
 * Strategy note (May 2026):
 *   "Recovery Lite" was dropped as a marketed beachhead because of
 *   FDA/FTC exposure. The page reads as "patterns COYL catches" —
 *   recurring autopilot loops people return to even when they know
 *   better — not clinical crisis. A hard SafetyBanner routes any
 *   user in real dependency/crisis to 988, SAMHSA, or a clinician
 *   before any feature copy.
 *
 *   The replacement vocabulary throughout is: "autopilot moments",
 *   "autopilot loops", "recurring loops", or "the patterns COYL
 *   catches."
 */

export const metadata: Metadata = {
  title: 'Patterns COYL catches — recurring autopilot loops',
  description:
    'Doomscrolling, impulse spending, the snack at 9:12 PM, the tab you reopened. COYL works at the behavioral pattern layer — recurring loops people return to even when they know better. Not treatment, not crisis support: pattern recognition and interrupt design.',
  keywords: [
    'autopilot loop app',
    'recurring behavior patterns',
    'stop doomscrolling',
    'impulse spending app',
    'break bad habits',
    'behavioral pattern app',
    'pattern interrupt',
  ],
  alternates: { canonical: '/recurring-loops' },
  openGraph: {
    title: 'Patterns COYL catches — recurring autopilot loops',
    description:
      'Cravings, scrolling, impulse spending, the tab you reopened. COYL catches the moment of drift.',
    url: 'https://coyl.ai/recurring-loops',
    images: [
      {
        url: '/api/og?title=The+patterns+COYL+catches.&kicker=Recurring+autopilot+loops',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Patterns COYL catches — recurring autopilot loops',
    description: 'Cravings, scrolling, impulse spending. COYL catches the moment of drift.',
    images: ['/api/og?title=The+patterns+COYL+catches.&kicker=Recurring+autopilot+loops'],
  },
}

export default function AutopilotLoopsPage() {
  return (
    <div className="space-y-24 pb-12">
      <header className="space-y-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Patterns COYL catches
          </span>
        </div>
        <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
          Recurring <span className="italic text-orange-600">autopilot loops.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
          COYL works at the behavioral pattern layer &mdash; the recurring loops
          people return to even when they know better. The 9:12 PM kitchen. The
          tab you reopened. The cart you filled at midnight. The scroll you
          promised was just five minutes.
        </p>
        <p className="max-w-2xl text-base leading-[1.65] text-gray-700">
          This is about pattern recognition and interrupt design. It is{' '}
          <strong className="font-serif font-normal italic text-gray-900">
            not therapy, not recovery, not dependency treatment.
          </strong>{' '}
          COYL maps the shape of your autopilot moments and stands in the doorway
          before the loop runs.
        </p>
      </header>

      <SafetyBanner variant="prominent" />

      {/* Pattern gallery */}
      <section className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-16 md:grid-cols-2">
        {[
          {
            title: 'Doomscrolling',
            body: "It's not the scroll. It's what you're avoiding with the scroll. COYL names it.",
          },
          {
            title: 'Impulse spending',
            body: "The cart is already full. Delay 10 minutes. Most carts don't survive 10 minutes.",
          },
          {
            title: 'Late-night snacking',
            body: 'The 9:12 PM kitchen has a shape. COYL learns the time, the cue, and the permission story you tell yourself on the way there.',
          },
          {
            title: 'Tab and app drift',
            body: 'The tab you reopened mid-deep-work. The app you launched without deciding to. COYL catches the reach, not the click.',
          },
          {
            title: 'Sugar craving loops',
            body: 'The craving, the permission story, the collapse. Interrupt the permission story.',
          },
          {
            title: 'Sunday-night spiral',
            body: 'Tomorrow as a reset day. The week as a clean slate. COYL meets you in the script before Monday is the excuse.',
          },
        ].map((p) => (
          <div key={p.title} className="border-t border-gray-200 pt-6">
            <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
              {p.title}
            </h3>
            <p className="mt-3 text-base leading-[1.65] text-gray-700">{p.body}</p>
          </div>
        ))}
      </section>

      {/* Shared loop */}
      <section className="space-y-8 border-t border-orange-500 pt-16">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          The shared loop
        </p>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Different object, <span className="italic text-orange-600">identical shape.</span>
        </h2>
        <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
          Every autopilot moment runs the same sequence.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-4 font-mono text-sm text-gray-700">
          {['Cue', 'Urge', 'Excuse', 'Lapse', 'Reset', 'Repeat'].map((node, i, arr) => (
            <span key={node} className="flex items-center gap-4">
              <span className="font-serif text-2xl font-normal italic text-gray-900">
                {node}
              </span>
              {i < arr.length - 1 && <span className="text-orange-500">&rarr;</span>}
            </span>
          ))}
        </div>
        <p className="max-w-2xl pt-4 text-base leading-[1.7] text-gray-700">
          COYL detects the cue, names the excuse, and interrupts the sequence
          before the lapse becomes the night.
        </p>
      </section>

      <section className="border-t border-gray-200 pt-16">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/audit"
            className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Start the audit
          </Link>
          <Link
            href="/how-it-works"
            className="inline-block rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            See how it works
          </Link>
        </div>
      </section>
    </div>
  )
}
