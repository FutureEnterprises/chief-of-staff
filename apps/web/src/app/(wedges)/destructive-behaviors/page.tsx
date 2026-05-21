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
  alternates: { canonical: '/destructive-behaviors' },
  openGraph: {
    title: 'Patterns COYL catches — recurring autopilot loops',
    description:
      'Cravings, scrolling, impulse spending, the tab you reopened. COYL catches the moment of drift.',
    url: 'https://coyl.ai/destructive-behaviors',
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
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
          Patterns COYL catches
        </span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Recurring autopilot loops.
      </h1>
      <p className="mb-4 max-w-2xl text-lg text-gray-600">
        COYL works at the behavioral pattern layer &mdash; the recurring loops
        people return to even when they know better. The 9:12 PM kitchen. The
        tab you reopened. The cart you filled at midnight. The scroll you
        promised was just five minutes.
      </p>
      <p className="mb-8 max-w-2xl text-base text-gray-700">
        This is about pattern recognition and interrupt design. It is not
        therapy, not recovery, not dependency treatment. COYL maps the shape
        of your autopilot moments and stands in the doorway before the loop
        runs.
      </p>

      <SafetyBanner variant="prominent" />

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div
            key={p.title}
            className="rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-500/5 to-transparent p-5"
          >
            <h3 className="mb-2 text-base font-bold text-gray-900">{p.title}</h3>
            <p className="text-sm text-gray-600">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">The shared loop</h2>
        <p className="mb-4 text-sm text-gray-600">
          Every autopilot moment runs the same sequence. Different object,
          identical shape.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
          {['Cue', 'Urge', 'Excuse', 'Lapse', 'Reset', 'Repeat'].map((node, i, arr) => (
            <span key={node} className="flex items-center gap-3">
              <span className="rounded-full border border-orange-500/30 bg-gray-100 px-3 py-1.5 font-mono">
                {node}
              </span>
              {i < arr.length - 1 && <span className="text-orange-500">&rarr;</span>}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          COYL detects the cue, names the excuse, and interrupts the sequence
          before the lapse becomes the night.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/audit"
          className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the audit
        </Link>
        <Link
          href="/how-it-works"
          className="inline-block rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
        >
          See how it works
        </Link>
      </div>
    </>
  )
}
