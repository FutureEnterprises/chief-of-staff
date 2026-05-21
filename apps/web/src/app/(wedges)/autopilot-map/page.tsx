import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, Clock, Layers, MessageSquareQuote } from 'lucide-react'

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
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Patterns</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Your danger windows,<br />
        <span className="text-orange-600">visualized.</span>
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-gray-600">
        The exact hours your script fires. The excuses you forget you use. The chains
        you keep running. COYL maps the autopilot so it stops being invisible &mdash;
        and so it can be caught.
      </p>

      {/* Share-card machine — Spotify Wrapped for self-sabotage. Screenshot-able
          mini-posters that surface a user's autopilot signature in one frame.    */}
      <section className="mb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-orange-500">
              Your autopilot, on a card
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
              Spotify Wrapped for self-sabotage.
            </h2>
          </div>
          <p className="max-w-md text-sm text-gray-600">
            Finish the audit and COYL prints your pattern signature on cards built
            for the camera roll. Examples below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                My danger window
              </p>
              <p className="mt-2 text-5xl font-black leading-none tracking-tight text-gray-900">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
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
                <p className="text-2xl font-black leading-tight text-gray-900">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                My archetype
              </p>
              <p className="mt-2 text-3xl font-black leading-tight tracking-tight text-gray-900">
                Monday
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                My pattern week
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Tue', 'Thu', 'Sun'].map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-orange-300 bg-white px-3 py-1.5 text-sm font-bold text-orange-600 shadow-[0_2px_8px_-4px_rgba(255,102,0,0.4)]"
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

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(255,102,0,0.6)]"
          >
            Generate yours &rarr;
          </Link>
          <p className="text-xs text-gray-500">
            ~3 minutes. No signup to see your cards.
          </p>
        </div>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: 'Your danger windows', body: 'The exact hours and days your autopilot fires. Heatmap view.' },
          { title: 'Top excuses by category', body: 'Ranked across 8 patterns: Delay, Reward, Minimization, Collapse, Exhaustion, Exception, Compensation, Social pressure.' },
          { title: 'Failure chains', body: 'Missed weigh-in → binge next day. Skipped workout → weekend collapse. The sequences you run.' },
          { title: 'Recovery speed', body: 'How fast you get back after a slip. The self-trust metric.' },
          { title: 'What actually works', body: 'Interventions that interrupted scripts for YOU specifically.' },
          { title: 'Identity trend', body: 'From sleepwalking → avoidant → recovering → resilient → high-self-trust.' },
        ].map((p) => (
          <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-2 text-base font-bold text-gray-900">{p.title}</h3>
            <p className="text-sm text-gray-600">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-12 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <blockquote className="text-lg italic text-gray-700">
          &ldquo;You said &lsquo;I&apos;ll start tomorrow&rsquo; 9 times in 3 weeks. That is not a plan. That is your avoidance phrase.&rdquo;
        </blockquote>
        <p className="mt-3 text-xs text-gray-500">— Example COYL pattern callout</p>
      </section>

      <Link href="/sign-up" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Map my autopilot
      </Link>
    </>
  )
}
