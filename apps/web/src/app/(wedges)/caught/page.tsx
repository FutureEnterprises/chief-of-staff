import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'They caught themselves. You can too. \u2014 COYL',
  description:
    "Someone you know just broke the loop. COYL is the system that catches you right before you fold \u2014 the 9pm kitchen, the email you didn't send, the promise you were about to drop. Start catching yours.",
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
    title: 'They caught themselves. You can too.',
    description:
      "Someone you know just broke the loop. COYL catches you right before you fold. Start catching yours.",
    url: 'https://coyl.ai/caught',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'They caught themselves. You can too.',
    description: "Someone you know just broke the loop. COYL catches you right before you fold.",
  },
}

/**
 * /caught \u2014 the public landing page every ShareMoment chip points at.
 *
 * Strategic purpose (per Viral $100M ARR Playbook \u00a74.2.3, \u00a75.1.1):
 * every shared recovery moment must land on a page built to convert the
 * viewer, not the generic homepage. This IS the "How did you make this?"
 * engine applied to behavior change \u2014 except the question is "How did
 * you break that pattern?" and the answer is the signup flow.
 *
 * Moment context is carried via the `m` query param (recovery | streak |
 * pattern | readme) so future copy tests can personalize per peak type.
 * For the first cut we render one emotionally-aligned frame that works
 * for all four moments \u2014 the recipient arrived because someone they
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
  { href: '/work', label: 'Work follow-through', body: 'The follow-up you said you\u2019d send. Didn\u2019t.' },
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

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Someone shared a moment
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        They caught themselves.<br />
        <span className="text-orange-400">You can too.</span>
      </h1>

      <p className="mb-10 max-w-2xl text-lg text-gray-400">
        Someone you know just used COYL to stop the spiral. Not Monday. Not tomorrow.
        The exact moment they were about to fold. That&rsquo;s the whole product.
      </p>

      <div className="mb-16 flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=caught"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start catching yours
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          How it works
        </Link>
      </div>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-2 text-2xl font-bold text-white">
          It&rsquo;s not the mistake. It&rsquo;s what you do after.
        </h2>
        <p className="mb-8 text-sm text-gray-400">
          The loop that runs every time you slip. COYL interrupts it at step 2.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LOOP_BEATS.map((b) => (
            <div
              key={b.n}
              className="rounded-xl border border-orange-500/30 bg-black/40 p-5"
            >
              <p className="text-xs font-mono text-orange-500">{b.n}</p>
              <h3 className="mt-2 text-base font-bold text-white">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          What COYL says in the moment
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-white md:text-4xl">
          Not motivation. Pattern recognition.
        </h3>
        <ul className="space-y-3">
          {QUOTABLES.map((line) => (
            <li
              key={line}
              className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-3 text-lg font-semibold text-white"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          What pattern do you keep repeating?
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {WEDGES.map((w) => (
            <Link
              key={w.href}
              href={w.href}
              className="group rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5 transition-all hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <p className="text-base font-bold text-white group-hover:text-orange-300">
                {w.label}
              </p>
              <p className="mt-1 text-sm text-gray-400">{w.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <p className="text-sm uppercase tracking-widest text-gray-500">The share you just saw</p>
        <p className="mt-2 text-lg text-gray-300">
          It wasn&rsquo;t bragging. It was proof. Someone caught themselves in the act and wanted
          you to know you can too. <span className="font-bold text-white">Same loop. Same interrupt.</span>{' '}
          One signup away.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=caught"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start catching yours
        </Link>
        <Link
          href="/science"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          See the research
        </Link>
      </div>
    </>
  )
}
