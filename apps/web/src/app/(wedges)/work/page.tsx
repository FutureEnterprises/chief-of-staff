import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL for work \u2014 catch the follow-ups that kill deals',
  description:
    "You don't fail at work. You fail when you don't follow up. COYL catches the email you didn't send, the meeting you didn't close out, the follow-up you let slip \u2014 before it costs a deal.",
  keywords: [
    'sales follow up tool',
    'follow through at work',
    'meeting action items',
    'sales commitment tracker',
    'stop dropping follow-ups',
    'accountability for sales',
    'work follow-through app',
  ],
  alternates: { canonical: '/work' },
  openGraph: {
    title: 'COYL for work \u2014 catch the follow-ups that kill deals',
    description:
      "You don't fail at work. You fail when you don't follow up. COYL catches the commitment before it drops.",
    url: 'https://coyl.ai/work',
  },
}

/**
 * /work \u2014 the employee / work-follow-through wedge page.
 *
 * Positioning (per GODFILE \u00a712): COYL makes sure you follow through at
 * work. Not a productivity app. Not a task manager. A commitment engine
 * that catches the broken promises \u2014 the email you didn\u2019t send, the
 * meeting you didn\u2019t close, the follow-up that dropped \u2014 before they
 * compound into missed deals or dropped balls.
 *
 * Same engine as the weight-loss wedge; different language and examples.
 */

const WORK_MOMENTS = [
  {
    you: '"I\u2019ll follow up."',
    real: 'You never did. The thread went cold. The deal moved on.',
  },
  {
    you: '"I\u2019ll respond tomorrow."',
    real: '14 days later it\u2019s buried under 200 emails you also haven\u2019t answered.',
  },
  {
    you: '"No reply means stop."',
    real: 'No reply means follow up again. Waiting is not action.',
  },
  {
    you: '"I\u2019ll get to it after lunch."',
    real: 'After lunch is after standup is after the 3 PM slump is tomorrow.',
  },
]

const CAPABILITIES = [
  {
    title: 'Meeting \u2192 commitment',
    body: 'Every meeting you log generates the list of things you said you\u2019d do. No lost action items.',
  },
  {
    title: 'Commitment \u2192 follow-up',
    body: 'Each follow-up is tracked. Deadline, channel, owner. COYL pings before it slips.',
  },
  {
    title: 'Follow-up \u2192 closure',
    body: 'Either you closed it or you didn\u2019t. No middle ground. The loop either reports kept or broken.',
  },
]

export default function WorkWedgePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Work', url: 'https://coyl.ai/work' },
        ]}
      />
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Work
        </span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        You don&apos;t fail at work.<br />
        <span className="text-orange-400">You fail when you don\u2019t follow up.</span>
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        Most work misses aren\u2019t about competence. They\u2019re about follow-through.
        The email you didn\u2019t send. The meeting you didn\u2019t close out. The task you
        promised and let slip. COYL catches those moments \u2014 before they become
        missed deals or dropped balls.
      </p>

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        {WORK_MOMENTS.map((m, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5"
          >
            <p className="text-base font-semibold italic text-orange-300">{m.you}</p>
            <p className="mt-2 text-sm text-gray-400">{m.real}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Meeting \u2192 commitment \u2192 follow-up \u2192 closure.
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-orange-500/30 bg-black/40 p-5"
            >
              <p className="text-xs font-mono uppercase tracking-widest text-orange-500">
                Stage
              </p>
              <h3 className="mt-2 text-base font-bold text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The four sentences that kill deals
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-4xl">
          COYL catches them in your head.
        </h3>
        <ul className="space-y-3">
          {[
            'You said you\u2019d follow up. Did you?',
            'Waiting is not action.',
            'No reply doesn\u2019t mean stop.',
            'Send the email.',
          ].map((line) => (
            <li
              key={line}
              className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-3 text-lg font-semibold text-white"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <p className="text-sm uppercase tracking-widest text-gray-500">Same engine</p>
        <p className="mt-2 text-lg text-gray-300">
          COYL for weight loss catches the 9 PM kitchen. COYL for work catches the email
          you never sent. <span className="font-bold text-white">Different problem, same
          loop.</span> A commitment is broken before you realize it. COYL interrupts.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=work"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start following through
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200"
        >
          How it works
        </Link>
      </div>
    </>
  )
}
