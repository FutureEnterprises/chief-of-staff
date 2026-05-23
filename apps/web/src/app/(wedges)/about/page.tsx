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
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'


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

export default async function AboutPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-about')

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
              Founder mark — monogram block that reads as an intentional
              brand element, not a portrait placeholder. The explicit
              "Portrait · Q3 2026" mono label below disambiguates this
              for the auditor who reads the standalone IS as a missing
              image. When a real photo lands, drop it at
              apps/web/public/founder/iman.jpg, swap the inner span for
              an <Image src="/founder/iman.jpg" .../>, and remove the
              mono label.
            */}
            <div className="flex flex-col items-start gap-3">
              <div
                aria-hidden
                className="relative h-64 w-64 shrink-0 overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-100 via-orange-50 to-[#fafaf7] md:h-72 md:w-72"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-7xl italic leading-none text-orange-600/80 md:text-8xl">
                    IS
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-400">
                Founder mark &middot; portrait Q3 2026
              </span>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
                Iman Schrock
              </h2>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-gray-500">
                Founder &middot; COYL
              </p>

              {/* Founder origin — three movements. The first paragraph
                  is the kitchen scene, told in the present tense the
                  brand voice keeps coming back to. The second is the
                  pattern recognition that turns one bad Tuesday into a
                  thesis. The third is the build. Kept honest: no
                  fabricated employers, schools, or fund names — just the
                  arc the rest of the site is downstream of. When real
                  career credentials are ready to publish, drop them in
                  as a fourth paragraph under "Before COYL." */}
              <p className="max-w-2xl font-serif text-xl italic leading-[1.5] text-gray-800 md:text-2xl">
                It was 11:14 PM on a Tuesday. The freezer drawer had been
                opened, closed, and reopened three times in twenty
                minutes. I wasn&rsquo;t hungry. I was tired, frustrated,
                stuck on a deadline I&rsquo;d already missed twice
                &mdash; and I was watching my own hand reach for the
                drawer for the third time that week.
              </p>
              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                The pattern was obvious in retrospect. It always is. The
                meeting that ran past 9 PM. The Friday I told myself
                I&rsquo;d close the laptop early and didn&rsquo;t. The
                Sunday I promised the gym and lost to the couch. Every
                behavior I&rsquo;ve ever wanted to change has a moment
                &mdash; a thin three-second window between the impulse
                and the action &mdash; where an outside voice could have
                caught me. No app I&rsquo;d ever built, used, or read
                about lived in that window. Therapy showed up Tuesday at
                3 PM. Coaching showed up in a weekly text. The habit
                trackers showed up the next morning, after the slip, with
                a guilt notification I&rsquo;d swipe away.
              </p>
              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                The architecture to live in those three seconds
                didn&rsquo;t exist. So I started building it. COYL is
                what came out: a behavioral interrupt protocol, four
                open specs underneath it, a reference engine that runs
                them, and a single quiet promise &mdash; that the next
                time the pattern fires, something will be there.
              </p>
              <p className="max-w-2xl text-base leading-[1.7] text-gray-600">
                The founder&rsquo;s own behavior was the first dataset.
                It still is. Every interrupt in this product was tested
                against the worst version of the person who built it,
                before it was ever tested against anyone else.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="https://www.linkedin.com/in/ischrock/"
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

        {/* ADVISORY + CLINICAL BOARD CALLOUTS — temporarily hidden per
            the May 2026 audit decision. Listing "forming" seats reads as
            a weak signal in the absence of at least one published name.
            The /advisors and /clinical-board pages still exist for
            direct links; this section will return when a credible name
            is ready to publish (target: Q3 2026 with the GLP-1 RCT
            enrollment milestone). */}

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
