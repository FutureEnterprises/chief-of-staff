import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL for procrastination — catch the tab switch before it costs the day',
  description:
    "You don't have a focus problem. You have a 30-second tab-switch problem that compounds into a lost day. COYL fires the moment you reach for the doom scroll — not after you've already lost two hours.",
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
    title: 'COYL for procrastination — catch the tab switch before it costs the day',
    description:
      "30-second tab-switches compound into lost days. COYL fires the moment you reach.",
    url: 'https://coyl.ai/procrastination',
    images: [
      {
        url: '/api/og?title=Catch+the+tab+switch+before+it+costs+the+day.&kicker=Procrastination',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL for procrastination — catch the tab switch before it costs the day',
    description: '30-second tab-switches compound into lost days. COYL fires the moment you reach.',
    images: ['/api/og?title=Catch+the+tab+switch+before+it+costs+the+day.&kicker=Procrastination'],
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

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Procrastination
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        You don&rsquo;t have a focus problem.<br />
        <span className="text-orange-600">You have a 30-second tab-switch problem.</span>
      </h1>

      <p className="mb-12 max-w-2xl text-lg text-gray-600">
        The tab switch happens in half a second. The recovery from it costs 23 minutes &mdash;
        if you ever actually recover. COYL fires before the gesture completes, not after the
        deep-work block is already dead.
      </p>

      <div className="mb-16 flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=procrastination"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Stop the tab switch
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          How it works
        </Link>
      </div>

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        {MOMENTS.map((m, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white/5 to-transparent p-5"
          >
            <p className="text-base font-semibold italic text-orange-700">{m.you}</p>
            <p className="mt-2 text-sm text-gray-600">{m.real}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Tab switch &rarr; excuse &rarr; interrupt &rarr; back in the block.
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          The procrastination loop runs the same way every time. COYL fires at step 2.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-orange-500/30 bg-gray-100 p-5"
            >
              <p className="text-xs font-mono uppercase tracking-widest text-orange-500">
                Stage
              </p>
              <h3 className="mt-2 text-base font-bold text-gray-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The six sentences that kill the block
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-gray-900 md:text-4xl">
          COYL catches them in your head.
        </h3>
        <ul className="space-y-3">
          {SCRIPTS.map((line) => (
            <li
              key={line}
              className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-3 text-lg font-semibold italic text-gray-900"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-16 rounded-2xl border border-gray-200 bg-white p-8">
        <p className="text-sm uppercase tracking-widest text-gray-500">Same engine</p>
        <p className="mt-2 text-lg text-gray-700">
          COYL for weight loss catches the 9 PM kitchen. COYL for procrastination catches the
          11 AM Twitter tab. <span className="font-bold text-gray-900">Different trigger, same loop.</span>{' '}
          A compulsion is happening before you decide. COYL fires in the half-second between
          the impulse and the action.
        </p>
      </section>

      <section className="mb-16 rounded-2xl border border-orange-500/20 bg-orange-50 p-8">
        <p className="text-sm uppercase tracking-widest text-orange-500">For employers</p>
        <p className="mt-2 text-lg font-bold text-gray-900">
          Workplace procrastination is the #1 hidden cost on every knowledge-worker P&amp;L.
        </p>
        <p className="mt-3 text-base text-gray-700">
          The average focus session is destroyed every 11 minutes. The recovery cost is 23.
          Multiply by your headcount. COYL embeds in the workflow as the interrupt your team
          actually wants. Outcome reporting available.
        </p>
        <Link
          href="/research"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-100 px-4 py-2 text-sm font-bold text-orange-200 hover:border-orange-500/60 hover:text-gray-900"
        >
          For partners &rarr;
        </Link>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=procrastination"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Catch the next switch
        </Link>
        <Link
          href="/science"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          The research
        </Link>
      </div>
    </>
  )
}
