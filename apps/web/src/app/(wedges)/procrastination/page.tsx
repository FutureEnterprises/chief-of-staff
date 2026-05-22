/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1
 *     with italic accent on "You need the moment caught."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): MOMENTS rendered as
 *     paired editorial columns on hairline rules.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): the loop stages and
 *     six-script blockquote chain re-rendered as gallery entries.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     openers, no card chrome, generous breath between sections.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: "COYL for procrastination — you don't need another to-do list. You need the moment caught.",
  description:
    "Productivity tools organize intentions. COYL interrupts avoidance. Fires the moment you reach for the doom scroll — not after the deep-work block is dead.",
  keywords: [
    'procrastination app',
    'stop procrastinating',
    'adhd focus app',
    'tab switching app',
    'doom scrolling intervention',
    'workplace productivity app',
    'pattern interrupt focus',
    'cold turkey alternative',
  ],
  alternates: { canonical: '/procrastination' },
  openGraph: {
    title: "You don't need another to-do list. You need the moment caught.",
    description:
      "Productivity tools organize intentions. COYL interrupts avoidance.",
    url: 'https://coyl.ai/procrastination',
    images: [
      {
        url: '/api/og?title=You+don%27t+need+another+to-do+list.+You+need+the+moment+caught.&kicker=Procrastination',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "You don't need another to-do list. You need the moment caught.",
    description: 'Productivity tools organize intentions. COYL interrupts avoidance.',
    images: ['/api/og?title=You+don%27t+need+another+to-do+list.+You+need+the+moment+caught.&kicker=Procrastination'],
  },
}

/**
 * /procrastination — workplace + focus wedge.
 *
 * Parallel to /glp1 in surface weight. Per the May 2026 wedge ultrathink:
 * COYL has been over-indexed on weight (4 of 6 wedge pages weight-adjacent).
 * This page rebalances by giving the productivity lane a first-class home.
 *
 * Positioning: not a focus app, not a Pomodoro timer, not Forest/Cold Turkey.
 * Real-time pattern interrupt at the moment you reach for the doom scroll.
 * Same engine as the weight-loss surface — different trigger, different
 * excuse vocabulary, identical product loop.
 *
 * Note: distinct from /work (which targets sales-follow-through). /work
 * is "did you send the email?" — about commitment-keeping. /procrastination
 * is "stop reaching for the tab that derails the deep-work block." Different
 * audience, different intent, deliberately separate SEO surfaces.
 */

const SCRIPTS = [
  '"I’ll just check Twitter for 5 minutes."',
  '"I’m too tired to focus. I’ll restart after lunch."',
  '"I just need to read this one thing."',
  '"I deserve a break."',
  '"My brain is fried. Tomorrow."',
  '"I’ll do the hard thing after the easy ones."',
]

const MOMENTS = [
  {
    you: '"Just one tab."',
    real: 'It’s 11 minutes later. The deep-work block is gone. The hard task is still there. You will pretend tomorrow is different.',
  },
  {
    you: '"I’ll start after this email."',
    real: 'Five emails in. None were urgent. You filled an hour with the appearance of work and the actual work didn’t move.',
  },
  {
    you: '"My brain is mush, I need a snack."',
    real: 'You’re not hungry. You’re avoiding the spreadsheet. The snack is the ritual that lets you not start.',
  },
  {
    you: '"I’ll restart Monday."',
    real: 'It’s Wednesday. Last Monday you said the same. The week is the unit of pretending.',
  },
]

const CAPABILITIES = [
  {
    title: 'Tab-switch → interrupt',
    body: 'You reach for the tab. COYL fires before the thumb completes the gesture. "You’re about to do the thing you said you’d stop doing. Three minutes left in the block. Stay."',
  },
  {
    title: 'Excuse → callout',
    body: 'Every excuse you’ve used this week is a category. COYL names the category back at you. "That’s your DELAY excuse. You’ve used it 4 times this week."',
  },
  {
    title: 'Slip → same-block recovery',
    body: 'You doom-scrolled for 8 minutes. The block isn’t dead. No streak reset. No Monday restart. The next 22 minutes still count.',
  },
]

export default function ProcrastinationWedgePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Procrastination', url: 'https://coyl.ai/procrastination' },
        ]}
      />

      <div className="space-y-24 pb-12">
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Procrastination
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            You don&rsquo;t need another to-do list.<br />
            <span className="italic text-orange-600">You need the moment caught.</span>
          </h1>

          <div className="max-w-2xl space-y-4">
            <p className="text-lg leading-[1.7] text-gray-700">
              Productivity tools organize intentions. COYL interrupts avoidance.
              The tab switch takes half a second. Recovery costs 23 minutes &mdash; if you ever
              actually recover. COYL fires before the gesture completes.
            </p>
            <p className="text-xs text-gray-500">
              23-minute recovery cost: Mark et al., 2008 &mdash;{' '}
              <em className="font-serif italic">The cost of interrupted work</em>, UC Irvine.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/sign-up?ref=procrastination"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Stop the tab switch
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              How it works
            </Link>
          </div>
        </header>

        {/* Brand anchor — recurring pullquote across consumer surfaces */}
        <section className="border-t border-gray-200 pt-16">
          <p className="mx-auto max-w-3xl text-center font-serif text-3xl font-normal italic leading-[1.2] tracking-[-0.02em] text-gray-900 md:text-5xl">
            AI for the moment <span className="text-orange-600">before behavior happens.</span>
          </p>
        </section>

        {/* Moment-pairs gallery */}
        <section className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {MOMENTS.map((m, i) => (
            <div key={i} className="border-t border-gray-200 pt-6">
              <p className="font-serif text-2xl font-normal italic leading-[1.2] text-orange-600">
                {m.you}
              </p>
              <p className="mt-4 text-base leading-[1.65] text-gray-700">{m.real}</p>
            </div>
          ))}
        </section>

        {/* Stages */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The loop
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Tab switch. Excuse. Interrupt. <span className="italic text-orange-600">Back in the block.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The procrastination loop runs the same way every time. COYL fires at step 2.
          </p>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="border-t border-orange-500 pt-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Stage
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {c.title}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Six scripts */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The six sentences that kill the block
            </span>
          </div>
          <h3 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            COYL catches them <span className="italic text-orange-600">in your head.</span>
          </h3>
          <ul className="space-y-6 pt-4">
            {SCRIPTS.map((line) => (
              <li
                key={line}
                className="border-t border-gray-200 pt-5 font-serif text-2xl font-normal italic leading-[1.2] text-gray-900"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>

        {/* Same engine */}
        <section className="border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            Same engine
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL for weight loss catches the 9 PM kitchen. COYL for procrastination catches the
            11 AM Twitter tab.{' '}
            <strong className="font-serif font-normal italic text-gray-900">
              Different trigger, same loop.
            </strong>{' '}
            A compulsion is happening before you decide. COYL fires in the half-second between
            the impulse and the action.
          </p>
        </section>

        {/* For employers */}
        <section className="border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            For employers
          </p>
          <p className="mt-6 max-w-2xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
            Workplace procrastination is the{' '}
            <span className="italic text-orange-600">#1 hidden cost</span> on every
            knowledge-worker P&amp;L.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-[1.65] text-gray-700">
            The average focus session is destroyed every 11 minutes. The recovery cost is 23.
            Multiply by your headcount. COYL embeds in the workflow as the interrupt your team
            actually wants. Outcome reporting available.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            11-minute interruption cadence: Microsoft Work Trend Index, 2023. 23-minute recovery
            cost: Mark et al., 2008 (UC Irvine).
          </p>
          <Link
            href="/teams"
            className="mt-8 inline-flex items-center gap-1.5 font-serif text-base italic text-orange-600 underline-offset-4 hover:underline"
          >
            For partners &rarr;
          </Link>
        </section>

        <section className="border-t border-gray-200 pt-16">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up?ref=procrastination"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Catch the next switch
            </Link>
            <Link
              href="/science"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              The research
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
