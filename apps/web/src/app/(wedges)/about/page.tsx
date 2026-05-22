/**
 * /about — founder + company story.
 *
 * Per the $6B Acquisition Roadmap doc, "no About page + no founder
 * visibility + no advisory board" was named as the single largest
 * fixable risk to the strategic exit. An anonymous founder reads as
 * a research project; a named founder with a stated motive reads as
 * a company an acquirer can underwrite.
 *
 * Composition follows the established (wedges)/* editorial template
 * (cream canvas, Instrument Serif H1, Geist Mono kicker, single
 * orange accent). Section order is single-scroll: eyebrow → H1 →
 * positioning subhead → founder block (with photo placeholder) →
 * why-now → advisory + clinical board callouts → recurring anchor →
 * press contact.
 *
 * Photo placeholder: when the founder is ready to ship a real
 * portrait, drop the file at `apps/web/public/founder/iman.jpg` —
 * the existing /public folder is already statically served. No
 * Next/Image until the asset lands; styled div placeholder keeps
 * the layout reserved.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

// ISR — static editorial content; 1-day revalidate window. Full cacheComponents migration with cacheTag-based surgical invalidation tracked as a follow-up.
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'About COYL — built by someone who needed it',
  description:
    "COYL is built by Iman Schrock — founder of the behavioral interface for AI. The founder's own behavior was the first dataset.",
  keywords: [
    'about coyl',
    'iman schrock',
    'coyl founder',
    'behavioral interface founder',
    'who built coyl',
  ],
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About COYL — built by someone who needed it',
    description:
      "COYL is built by Iman Schrock. The founder's own behavior was the first dataset.",
    url: 'https://coyl.ai/about',
    images: [
      {
        url: '/api/og?title=Built+by+someone+who+needed+it.&kicker=About',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About COYL',
    description: "Built by someone who needed it. The founder's own behavior was the first dataset.",
    images: ['/api/og?title=Built+by+someone+who+needed+it.&kicker=About'],
  },
}

export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'About', url: 'https://coyl.ai/about' },
        ]}
      />

      <article className="space-y-32 pb-12">
        {/* OPENING — eyebrow + headline + positioning */}
        <header className="space-y-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              About
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Built by someone who{' '}
            <span className="italic text-orange-600">needed it.</span>
          </h1>

          <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            COYL is built by Iman Schrock &mdash; a founder whose own
            behavior was the first dataset.
          </p>
        </header>

        {/* FOUNDER BLOCK — photo placeholder + name + story + social */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
              <span className="text-orange-600">Founder</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-[auto_1fr] md:gap-16">
            {/*
              FOUNDER PORTRAIT PLACEHOLDER
              ----------------------------
              When ready, drop the portrait at:
                apps/web/public/founder/iman.jpg
              Then swap this styled div for a <Image src="/founder/iman.jpg" .../>
              from next/image (priority + alt="Iman Schrock, founder of COYL").
              The orange-tinted block keeps the editorial mood until then.
            */}
            <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-100 via-orange-50 to-[#fafaf7] md:h-72 md:w-72">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Portrait
                </span>
                <span className="font-serif text-3xl italic text-gray-400">IS</span>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
                Iman Schrock
              </h2>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-gray-500">
                Founder &middot; COYL
              </p>

              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                I started COYL the night I watched myself open the fridge
                at 11:14 PM for the third time in a week, knowing I
                wasn&rsquo;t hungry, knowing I was tired and frustrated,
                and knowing that no app I&rsquo;d ever built or used would
                say anything about it at the right moment. The behavioral
                pattern was obvious in retrospect. The architecture to
                catch it didn&rsquo;t exist. So I built it.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="https://linkedin.com/in/imanschrock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
                >
                  LinkedIn
                </Link>
                <Link
                  href="https://twitter.com/imanschrock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
                >
                  Twitter
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* WHY NOW — the LLM moment + the missing behavioral layer */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Why now
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            AI has never met human{' '}
            <span className="italic text-orange-600">behavior</span> before.
          </h2>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            For thirty years software watched what you did and reported it
            back. For two years language models answered what you typed.
            Neither system has ever shown up at the moment your hand
            reached the handle &mdash; the moment between knowing better
            and doing it anyway.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            That moment is where life actually happens. The diet works
            until 9 PM. The deep-work block works until the third tab. The
            recovery plan works until Sunday night. The gap between
            intention and action is not a willpower problem; it is an
            interface problem. Nothing has ever sat in that gap.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Three things finally arrived at the same time: models that
            understand patterns in real human language, edge devices that
            are always on your wrist or in your pocket, and twenty years
            of behavioral science about the cue-action-recovery loop. COYL
            stands in that gap. It is a 30-second call-out from a system
            that already knows your script is about to load.
          </p>

          <p className="pt-2">
            <Link
              href="/protocol"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600 underline-offset-4 hover:underline"
            >
              Read the protocol &rarr;
            </Link>
          </p>
        </section>

        {/* ADVISORY + CLINICAL BOARD CALLOUTS — paired, lightweight */}
        <section className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-16 md:grid-cols-2 md:gap-10">
          <Link
            href="/advisors"
            className="group block rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-orange-300 hover:bg-orange-50"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Advisory board
            </p>
            <h3 className="mt-5 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900 group-hover:text-orange-700">
              The people in the room with us.
            </h3>
            <p className="mt-4 text-sm leading-[1.7] text-gray-600">
              Operators and researchers across pharma, behavioral health,
              mobile platforms, and AI &mdash; the people who push us
              harder than we push ourselves.
            </p>
            <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600">
              See the advisors &rarr;
            </p>
          </Link>

          <Link
            href="/clinical-board"
            className="group block rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-orange-300 hover:bg-orange-50"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Clinical board
            </p>
            <h3 className="mt-5 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900 group-hover:text-orange-700">
              The clinical eyes on the work.
            </h3>
            <p className="mt-4 text-sm leading-[1.7] text-gray-600">
              Researchers and clinicians who pressure-test the science,
              the protocol, the safety, and the claims.
            </p>
            <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600">
              See the clinical board &rarr;
            </p>
          </Link>
        </section>

        {/* RECURRING ANCHOR — the one-line category claim */}
        <section className="border-t border-orange-500 py-16 text-center md:py-24">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The anchor
          </p>
          <p className="mx-auto mt-10 max-w-4xl font-serif text-4xl font-normal leading-[1.02] tracking-[-0.025em] text-gray-900 md:text-7xl">
            AI for the moment{' '}
            <span className="italic text-orange-600">before</span> behavior happens.
          </p>
        </section>

        {/* PRESS — contact + link out */}
        <section className="space-y-6 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Press
            </span>
          </div>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
            For journalists and analysts.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Press inquiries:{' '}
            <Link
              href="mailto:press@coyl.ai"
              className="text-orange-600 underline-offset-4 hover:underline"
            >
              press@coyl.ai
            </Link>
            . The short version of the company, the category sentence,
            and the founder quote live on the press page.
          </p>
          <p className="pt-2">
            <Link
              href="/press"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600 underline-offset-4 hover:underline"
            >
              See the press kit &rarr;
            </Link>
          </p>
        </section>
      </article>
    </>
  )
}
