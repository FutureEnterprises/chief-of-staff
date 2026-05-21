/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on "Someone you know just caught one."
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): loop-beat chapters set as
 *     editorial entries on top borders.
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): quotables list and wedge
 *     pivots rendered as gallery columns.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     section openers; AutopilotDemoCard preserved as a product surface.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { AutopilotDemoCard } from '@/components/landing/autopilot-demo-card'

export const metadata: Metadata = {
  title: 'Your real-life COYL moments — share, watch, recognize',
  description:
    "Someone you know just caught themselves in the act. The 9pm kitchen, the email they didn't send, the loop they were about to run. Real moments, caught in real life. Start catching yours.",
  keywords: [
    'stop the spiral',
    'slip recovery',
    'behavior interruption',
    'catch yourself',
    'break the pattern',
    'commitment app',
    'anti-autopilot',
  ],
  alternates: { canonical: '/caught' },
  openGraph: {
    title: 'Your real-life COYL moments',
    description:
      "Someone you know just caught themselves in the act. Start catching yours.",
    url: 'https://coyl.ai/caught',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your real-life COYL moments',
    description: "Someone you know just caught themselves in the act. Start catching yours.",
  },
}

/**
 * /caught — the public landing page every ShareMoment chip points at.
 *
 * Strategic purpose (per Viral $100M ARR Playbook §4.2.3, §5.1.1):
 * every shared recovery moment must land on a page built to convert the
 * viewer, not the generic homepage. This IS the "How did you make this?"
 * engine applied to behavior change — except the question is "How did
 * you break that pattern?" and the answer is the signup flow.
 *
 * Moment context is carried via the `m` query param (recovery | streak |
 * pattern | readme) so future copy tests can personalize per peak type.
 * For the first cut we render one emotionally-aligned frame that works
 * for all four moments — the recipient arrived because someone they
 * know caught themselves in the act. That's the hook.
 */

const LOOP_BEATS = [
  {
    n: '01',
    title: 'Drift',
    body: "The script runs. 9pm hits. The email doesn't get sent. The meeting action item quietly dies.",
  },
  {
    n: '02',
    title: 'Interrupt',
    body: 'COYL fires exactly when the fold is about to happen. Not a reminder. Not a nudge. An interrupt built for that moment.',
  },
  {
    n: '03',
    title: 'Recovery',
    body: "You didn't ruin it. You caught it. Same-night re-entry, not Monday-reset shame.",
  },
]

const QUOTABLES = [
  "You don't want the food. You want the feeling.",
  "You're not confused. You're avoiding.",
  'This is where you always lose.',
  'You already know what happens next.',
]

const WEDGES = [
  { href: '/weight-loss', label: 'Weight loss', body: '9pm kitchen. Weekend spirals. Skipped weigh-ins.' },
  { href: '/work', label: 'Work follow-through', body: 'The follow-up you said you’d send. Didn’t.' },
  { href: '/destructive-behaviors', label: 'Destructive patterns', body: 'The loop you keep returning to. Even when you know better.' },
  { href: '/decision-support', label: 'Decision support', body: 'You already know. You just need something to make you decide.' },
]

export default function CaughtPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Caught', url: 'https://coyl.ai/caught' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Someone shared a moment
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Real-life COYL moments.<br />
            <span className="italic text-orange-600">Someone you know just caught one.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Not Monday. Not tomorrow. The exact moment they were about to run the loop.
            COYL caught it. They shared it. Now you can catch yours.
          </p>

          {/* Demo card — the "wow in 1 second" screenshot, preserved as a product surface. */}
          <div className="max-w-md pt-2">
            <AutopilotDemoCard />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/sign-up?ref=caught"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Start catching yours
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              How it works
            </Link>
          </div>
        </header>

        {/* Loop beats — chapter entries */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The loop everyone runs
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            It&rsquo;s not the mistake. It&rsquo;s <span className="italic text-orange-600">what you do after.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The loop that runs every time you slip. COYL interrupts it at step 2.
          </p>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
            {LOOP_BEATS.map((b) => (
              <div key={b.n} className="border-t border-orange-500 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {b.n}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {b.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quotables */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              What COYL says in the moment
            </span>
          </div>
          <h3 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Not motivation. <span className="italic text-orange-600">Pattern recognition.</span>
          </h3>
          <ul className="space-y-6 pt-4">
            {QUOTABLES.map((line) => (
              <li
                key={line}
                className="border-t border-gray-200 pt-5 font-serif text-2xl font-normal italic leading-[1.2] text-gray-900"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>

        {/* Pattern routes */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Your pattern
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            What pattern do you <span className="italic text-orange-600">keep repeating?</span>
          </h2>
          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-2">
            {WEDGES.map((w) => (
              <Link
                key={w.href}
                href={w.href}
                className="group block border-t border-gray-200 pt-6 transition-colors hover:border-orange-500"
              >
                <p className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-orange-600">
                  {w.label}
                </p>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{w.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* The share you saw */}
        <section className="border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            The share you just saw
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-gray-700">
            It wasn&rsquo;t bragging. It was proof. Someone caught themselves in the act and wanted
            you to know you can too.{' '}
            <strong className="font-serif font-normal italic text-gray-900">
              Same loop. Same interrupt.
            </strong>{' '}
            One signup away.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-16">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up?ref=caught"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Start catching yours
            </Link>
            <Link
              href="/science"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              See the research
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
