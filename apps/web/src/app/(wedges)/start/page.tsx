import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock, Eye, Hand, Wrench } from 'lucide-react'

/**
 * /start — the COYL contract page.
 *
 * Per founder mandate (May 2026): before the audit, COYL must introduce
 * itself honestly. What it is. How it can help if the user is honest.
 * Where the data lives. What it expects in return. What it does NOT do.
 *
 * This page is intentionally pre-audit. Visitors lands here from "Get
 * started" CTAs. Returning users skip it (sign-in routes around).
 *
 * The voice: third-person, sparse, editorial. No first-person from the
 * AI (avoids the anthropomorphism trap). No motivational copy.
 * Identity-grounded language. The contract is the deliverable.
 */

export const metadata: Metadata = {
  title: 'Start — what COYL is, and the deal · COYL',
  description:
    'Before the audit: what COYL is, how it works if you are honest with it, and where your data lives. The contract, in two minutes.',
  alternates: { canonical: '/start' },
  openGraph: {
    title: 'Start — what COYL is, and the deal',
    description:
      'Before the audit: what COYL is, how it works if you are honest with it, and where your data lives.',
    url: 'https://coyl.ai/start',
    images: [
      {
        url: '/api/og?title=Start&kicker=What+COYL+is%2C+and+the+deal',
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default function StartPage() {
  return (
    <div className="space-y-20 pb-12">
      {/* HEADER */}
      <header className="space-y-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Before you start
          </span>
        </div>
        <h1 className="font-serif text-5xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[5.5rem]">
          The deal. <span className="italic text-orange-600">In two minutes.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
          Before the audit, read this. COYL is not a wellness app. It is built
          for the moments nobody else can be there — 9:47 PM at the fridge, 2 AM
          rereading the text you almost sent, the third tab, the fourth excuse.
          Here is what COYL actually is, what it needs from you, and where your
          data lives.
        </p>
      </header>

      {/* WHAT COYL IS */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What it is
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          A behavioral interrupt layer.<br />
          <span className="italic text-orange-600">Not a coach. Not a therapist. Not a tracker.</span>
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <p className="text-base leading-[1.7] text-gray-700">
            COYL catches the script before it runs. The 3-second window between
            intention and action. Once. Then a second time. Then a hundred
            times.
          </p>
          <p className="text-base leading-[1.7] text-gray-700">
            The pattern does not break. The pattern wears down. That is the
            only way patterns ever change — by being interrupted in the moment
            they fire, not lectured at in the morning.
          </p>
        </div>
      </section>

      {/* WHAT COYL NEEDS FROM YOU */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What it needs from you
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Three things. <span className="italic text-orange-600">All free, but not optional.</span>
        </h2>
        <div className="space-y-10">
          {[
            {
              n: '01',
              title: 'Honesty.',
              body: 'The audit takes 60 seconds. The slip log takes one tap. If you log the slips, the model gets sharper. If you do not, the interrupts stay generic.',
            },
            {
              n: '02',
              title: 'Feedback.',
              body: 'Two taps after each interrupt: caught me / wrong time. That is how the model learns YOU specifically — not the 9 PM Negotiator average, you.',
            },
            {
              n: '03',
              title: 'Real time.',
              body: 'Not 30 days. Real time. The decay-curve evidence shows up at month 3, deepens at month 6, locks in at year one. There is no shortcut.',
            },
          ].map((step) => (
            <div key={step.n} className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {step.n}
                </p>
                <p className="mt-4 font-serif text-3xl font-normal italic leading-[1] tracking-[-0.02em] text-gray-900 md:text-4xl">
                  {step.title}
                </p>
              </div>
              <div className="md:col-span-9">
                <p className="text-lg leading-[1.65] text-gray-700">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET BACK */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What you get back
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          A model of your own autopilot.<br />
          <span className="italic text-orange-600">Built only from your data.</span>
        </h2>
        <ul className="space-y-4 text-lg leading-[1.7] text-gray-700">
          <li className="flex items-start gap-3">
            <span className="mt-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">Interrupts that get sharper every week.</strong>{' '}
              At day 30, COYL fires within 4 minutes of your actual danger window.
              At day 90, within 30 seconds. At year one, before your conscious mind
              has named the urge.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">A receipt at day 30, 60, 90.</strong>{' '}
              The full model of your psyche — your top windows, your top excuses,
              your interventions that worked, the patterns that loosened. Yours to
              download as JSON or PDF anytime.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">One number per day.</strong>{' '}
              Your Self-Trust Score. The single metric that tracks whether the
              pattern is loosening or strengthening. Shown once. Same time.
              Every day.
            </span>
          </li>
        </ul>
      </section>

      {/* WHERE YOUR DATA LIVES */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Where your data lives
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          The privacy layer is the product.
        </h2>
        <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
          COYL is built for behaviors nobody else can help with — the fridge, the
          text, the third tab, the spiral. That only works if your data is yours.
          The privacy architecture is not a footnote. It is the product.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              Icon: Lock,
              title: 'The pattern model lives on your phone.',
              body: 'Your personal predictive model — the one that learns your specific danger windows — runs on-device. Encrypted at rest. Never leaves unless you grant export.',
            },
            {
              Icon: Eye,
              title: 'Your slip log stays with you.',
              body: 'The slips you log are stored in your phone first. We sync them to a BAA-covered cloud only if you opt in to cross-device backup. You can turn that off anytime.',
            },
            {
              Icon: Hand,
              title: 'No ads. No data sale. No third-party training.',
              body: 'COYL does not sell your data. COYL does not run ads. COYL does not let other AI companies train models on your behavioral data. Period.',
            },
            {
              Icon: Wrench,
              title: 'Full export. Anytime.',
              body: 'One tap. JSON or PDF. Everything COYL knows about you, in your hands. If you delete your account, the model goes with you — including the ability to import it into the next tool you trust.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"
              >
                <card.Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <p className="font-serif text-xl font-normal leading-[1.2] text-gray-900">
                {card.title}
              </p>
              <p className="text-sm leading-[1.6] text-gray-700">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT COYL DOES NOT DO */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What COYL does not do
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          The honest part. <span className="italic text-orange-600">Read it.</span>
        </h2>
        <ul className="space-y-3 text-base leading-[1.7] text-gray-700">
          <li className="flex items-start gap-3">
            <span className="mt-2.5 inline-block h-1 w-3 shrink-0 bg-gray-300" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">COYL is not therapy.</strong>{' '}
              If you are in crisis, please contact a clinician or call 988.
              COYL is behavioral support, not medical treatment.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2.5 inline-block h-1 w-3 shrink-0 bg-gray-300" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">COYL does not fix you.</strong>{' '}
              You do not need fixing. COYL catches the script before it runs.
              The work happens inside you. The interrupt makes it possible.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2.5 inline-block h-1 w-3 shrink-0 bg-gray-300" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">COYL is not magic.</strong>{' '}
              At day 1, the model is family-level (you are a 9 PM Negotiator).
              At day 30 it gets you-specific. At year one it knows you better
              than your conscious mind. The math takes real time.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2.5 inline-block h-1 w-3 shrink-0 bg-gray-300" aria-hidden />
            <span>
              <strong className="font-semibold text-gray-900">COYL does not promise you will not slip.</strong>{' '}
              Sometimes the interrupt lands and you slip anyway. The point of
              COYL is to make the slip catchable, then recoverable, then rarer.
              Not to make you a different person overnight.
            </span>
          </li>
        </ul>
      </section>

      {/* CTA */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <figure className="border-l border-orange-500 pl-8">
          <blockquote className="font-serif text-3xl font-normal italic leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-5xl">
            AI for the moment before behavior happens.
          </blockquote>
          <figcaption className="mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            The recurring anchor
          </figcaption>
        </figure>

        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            That is the deal. <span className="italic text-orange-600">Take the audit.</span>
          </h2>
          <p className="max-w-xl text-base leading-[1.65] text-gray-700">
            60 seconds. Three questions. You leave with your archetype + the
            first inferred danger windows + a scheduled first interrupt. No
            email. No credit card. No commitment.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/audit?ref=start"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-orange-600"
            >
              Take the audit
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/how-coyl-knows-you"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-gray-700 transition-colors hover:border-gray-400"
            >
              Read more first
            </Link>
          </div>
          <p className="pt-2 text-xs text-gray-500">
            Privacy policy:{' '}
            <Link href="/privacy" className="underline decoration-orange-500 underline-offset-4 hover:text-orange-600">
              coyl.ai/privacy
            </Link>
            {' · '}How it works:{' '}
            <Link href="/how-it-works" className="underline decoration-orange-500 underline-offset-4 hover:text-orange-600">
              coyl.ai/how-it-works
            </Link>
            {' · '}Safety:{' '}
            <Link href="/safety" className="underline decoration-orange-500 underline-offset-4 hover:text-orange-600">
              coyl.ai/safety
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
