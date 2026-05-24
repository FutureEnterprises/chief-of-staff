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
 * Founder portrait shipped May 2026 — apps/web/public/founder/iman.jpg
 * (800x800 square JPEG, served statically). Replaced the monogram
 * placeholder block that previously held this slot; the Q3 2026 mono
 * label disappeared with it. If the photo ever needs to be updated,
 * swap the file at the same path (or change the src below) and the
 * cache tag will invalidate on next revalidation.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'


export const metadata: Metadata = {
  title: 'About COYL — built by someone who needed it',
  description:
    "COYL is built by Iman Schrock, PhD — an organizational psychologist who studied AI disruption at Harvard and Cornell and then built the behavioral interrupt protocol he needed at 11 PM on a Tuesday. The founder's own behavior was the first dataset.",
  keywords: [
    'about coyl',
    'iman schrock',
    'iman schrock phd',
    'coyl founder',
    'behavioral interface founder',
    'organizational psychology ai',
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
              Founder portrait — real photo (800x800 JPEG) replacing
              the prior monogram placeholder. The rounded-2xl orange-
              tinged border is preserved as the brand frame so the
              cinematic surface stays consistent with the rest of the
              page. priority=true: this image is above the fold on
              /about and a paid-acquisition visitor reads it inside
              the LCP window. quality=92: matches the editorial
              treatment, JPEG source is already optimized.
            */}
            <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-100 via-orange-50 to-[#fafaf7] md:h-72 md:w-72">
              <Image
                src="/founder/iman.jpg"
                alt="Iman Schrock, founder of COYL"
                width={576}
                height={576}
                quality={92}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-6">
              <h2 className="font-serif text-3xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-4xl">
                Iman Schrock, <span className="italic text-orange-600">PhD</span>
              </h2>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-gray-500">
                Founder &middot; COYL
              </p>
              <p className="font-mono text-[11px] leading-[1.7] tracking-[0.04em] text-gray-500">
                PhD, Organizational Psychology &middot; Disruptive
                Strategy certificate (AI focus), Harvard &middot; AI
                Strategy certificate, Cornell
              </p>

              {/* Founder origin — six movements, May 2026 romanced
                  rewrite per founder-told story. The arc:
                    1. Kitchen scene (italic) — the personal mirror.
                    2. The lens — PhD in organizational psychology +
                       lifelong fascination with the behavior-intention
                       gap. The literature meeting the life.
                    3. The mirror — weight lost twice, regained twice,
                       autopilot recognized in real time.
                    4. The ignition — Harvard Disruptive Strategy
                       course (AI focus) + Cornell AI Strategy
                       certificate. Psychology + AI agree.
                    5. The build — protocols that let LLMs step outside
                       the chatbot box and live in the three-second
                       window before behavior.
                    6. The principle — NOT a replacement for therapy,
                       physicians, psychologists, or real coaches. The
                       layer underneath. The disruption is that the
                       access cost of "someone in the room" falls to
                       the floor.
                    + closing dataset disclosure.
                  Tone: heartfelt, editorial, no gimmicks. The credentials
                  earn their place by anchoring the synthesis; they aren't
                  a brag. */}
              <p className="max-w-2xl font-serif text-xl italic leading-[1.5] text-gray-800 md:text-2xl">
                It was 11:14 PM on a Tuesday. The freezer drawer had been
                opened, closed, and reopened three times in twenty
                minutes. I wasn&rsquo;t hungry. I was tired, frustrated,
                stuck on a deadline I&rsquo;d already missed twice
                &mdash; and I was watching my own hand reach for the
                drawer for the third time that week.
              </p>
              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                I&rsquo;d spent most of my adult life studying behavior.
                A doctorate in organizational psychology. A lifelong
                fascination with the gap between what people say they
                will do and what they actually do under load. I knew the
                literature. I knew the frameworks. And the hand reaching
                for the freezer drawer belonged to someone who had lost
                the weight twice already and gained it back twice.
                Watching it happen in real time was the moment the
                question I&rsquo;d been studying academically became the
                question I was living in my own kitchen. The pattern
                wasn&rsquo;t a finding in someone else&rsquo;s data set.
                It was running on autopilot in mine.
              </p>
              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                What changed wasn&rsquo;t more psychology. It was a
                Disruptive Strategy certificate at Harvard, focused on what
                emergent AI was actually about to do &mdash; and an AI
                Strategy certificate at Cornell that gave the
                disruption a shape. Sitting in those rooms I watched the
                two halves of my work, the psychology and the
                technology, stop arguing with each other and start
                agreeing. The intervention I&rsquo;d needed at 11:14 PM
                didn&rsquo;t exist because nobody had given AI permission
                to live in the moment before the slip. They&rsquo;d
                given it permission to chat after.
              </p>
              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                COYL is what came out. A behavioral interrupt protocol,
                four open specs underneath it, a reference engine that
                runs them &mdash; built so a large language model can
                step outside the chatbot box and intervene at the exact
                three-second window where decisions actually get made.
                Not a coach you summon. Not a tracker that grades you
                the next morning. Something that lives in the moment,
                with the right context, with the right script, with one
                quiet sentence at the threshold.
              </p>
              <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
                This is not a replacement for therapy. It is not a
                replacement for your physician or your psychologist or
                your real coach. It is the layer underneath all of them
                &mdash; the moment-by-moment accountability that, until
                now, was only available to people who could afford
                someone in the room. COYL is what happens when the
                protocol underneath that &ldquo;someone in the
                room&rdquo; finally exists, and the access cost falls to
                the floor. Coaching, as it&rsquo;s been dispersed for a
                hundred years, is about to look different.
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
