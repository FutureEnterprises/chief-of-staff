/**
 * /psyche — the consumer-facing destination for the "Psyche AI" category.
 *
 * Per the May 2026 audit brief: name the category we are building.
 * Every AI before COYL wrapped around external reality (documents,
 * language, software, codebases). COYL is the first AI wrapped around
 * the internal reality — the psyche. The pattern layer that runs
 * underneath conscious thought.
 *
 * Two-layer brand discipline:
 *   - /protocol + /developers retain the developer/infrastructure spine
 *     (the Behavioral Interrupt Protocol, spec, SDKs, integrations).
 *   - /psyche + /manifesto carry the consumer-voice "Psyche AI" frame.
 *
 * Editorial luxury treatment matches /manifesto, /science, /protocol,
 * /developers: Instrument Serif H1 with italic-orange accent, Geist
 * Mono kicker eyebrow, hairline rules, cream canvas. Code block is the
 * exact same calm warm-dark surface used by /protocol + /developers so
 * the three pages read as one editorial system.
 *
 * Section spine, in order:
 *   01  EYEBROW + H1 + subhead — open the category
 *   02  "Every AI wraps around something" — the gap (4-line stanza)
 *   03  "What COYL does differently" — 01–04 numbered claim
 *   04  "The psyche has structure" — 4 dimensions of autopilot
 *   05  "Why the data is the moat" — 4 dimensions of the COYL dataset
 *   06  "The MCP parallel" — protocol claim + Behavioral Context Object
 *   07  Closing CTA — /protocol for builders, /audit for consumers
 *
 * No new colors, no new fonts. No emojis. No product screenshots — this
 * page exists to install one sentence in the reader's head:
 * "COYL is Psyche AI — the behavioral interface layer."
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'


export const metadata: Metadata = {
  title: 'Psyche AI — the behavioral interface layer · COYL',
  description:
    'Every AI before COYL wrapped around external reality. COYL wraps around the internal one — the psyche. The pattern layer that runs underneath conscious thought.',
  keywords: [
    'psyche ai',
    'behavioral interface layer',
    'ai wrapped around the psyche',
    'pre-conscious ai',
    'behavioral context object',
    'coyl psyche',
    'pattern layer ai',
    'autopilot ai category',
  ],
  alternates: { canonical: '/psyche' },
  openGraph: {
    title: 'Psyche AI — the behavioral interface layer',
    description:
      'The first AI wrapped around the human psyche. The pattern layer that runs underneath conscious thought.',
    url: 'https://coyl.ai/psyche',
    images: [
      {
        url: '/api/og?title=The+first+AI+wrapped+around+the+human+psyche.&kicker=Psyche+AI',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Psyche AI — COYL',
    description:
      'The first AI wrapped around the human psyche. The behavioral interface layer.',
    images: [
      '/api/og?title=The+first+AI+wrapped+around+the+human+psyche.&kicker=Psyche+AI',
    ],
  },
}

export default async function PsychePage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-psyche')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Psyche AI', url: 'https://coyl.ai/psyche' },
        ]}
      />

      <article className="space-y-32 pb-12">
        {/* OPENING — the category claim */}
        <header className="space-y-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Psyche AI · May 2026
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            The first AI wrapped<br />
            around the human{' '}
            <span className="italic text-orange-600">psyche.</span>
          </h1>

          <p className="max-w-2xl font-serif text-2xl font-normal italic leading-[1.35] text-gray-700 md:text-3xl">
            Every AI before COYL wrapped around external reality. We
            wrapped around the internal one.
          </p>
        </header>

        {/* SECTION 01 — Every AI wraps around something */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
              <span className="text-orange-600">01</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">The map so far</span>
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            Every AI wraps around{' '}
            <span className="italic text-orange-600">something.</span>
          </h2>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Look at the breakthroughs of the last three years. Each one
            picked a slice of external reality and built an interface
            into it. None of them touched the part of you that runs
            underneath conscious thought.
          </p>

          {/* The 4-line stanza — editorial column on the cream canvas,
              hairline left rule, mono labels on the left, serif targets
              on the right. Designed to be screenshotted. */}
          <figure className="border-l border-orange-500 pl-8 md:pl-12">
            <dl className="space-y-5">
              {[
                { who: 'Claude', what: 'documents, code, the web' },
                { who: 'ChatGPT', what: 'language and knowledge' },
                { who: 'MCP', what: 'software systems' },
                { who: 'Cursor', what: 'codebases' },
              ].map((row) => (
                <div
                  key={row.who}
                  className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6"
                >
                  <dt className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-gray-500 md:w-32">
                    {row.who}
                  </dt>
                  <dd className="font-serif text-2xl font-normal leading-[1.25] tracking-[-0.01em] text-gray-900 md:text-3xl">
                    <span aria-hidden className="mr-3 text-orange-600">
                      &rarr;
                    </span>
                    {row.what}
                  </dd>
                </div>
              ))}
            </dl>
            <figcaption className="mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
              External reality · what AI has wrapped around so far
            </figcaption>
          </figure>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Nobody has wrapped AI around the internal reality &mdash; the
            psyche. The pattern layer that runs underneath conscious
            thought. The part that opens the fridge before you&rsquo;ve
            decided to.
          </p>
        </section>

        {/* SECTION 02 — What COYL does differently */}
        <section className="space-y-12">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
              <span className="text-orange-600">02</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">What COYL does differently</span>
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            COYL is the first AI that{' '}
            <span className="italic text-orange-600">
              fires at the moment the psyche fires.
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-10 pt-4 md:grid-cols-2 md:gap-x-16 md:gap-y-14">
            {[
              {
                n: '01',
                t: 'Doesn’t wait to be asked.',
                d: 'Every other AI sits in a prompt box and waits for you to start the conversation. COYL is the conversation that starts on its own — at the exact second your script is loading.',
              },
              {
                n: '02',
                t: 'Learns the structural signature of your psyche.',
                d: 'Danger windows. Excuse taxonomy. Archetype. The shape of your autopilot is not the shape of someone else’s. COYL learns yours.',
              },
              {
                n: '03',
                t: 'Wraps an intervention layer around that structure.',
                d: 'A precision interrupt, voice-matched to the user, calibrated to the moment. Not a daily affirmation. Not a weekly check-in. A 30-second call-out, positioned in the 3-second window.',
              },
              {
                n: '04',
                t: 'Fires at the moment the psyche fires — not after.',
                d: 'Trackers tell you what happened. Coaches respond after you message them. COYL meets you in the moment before behavior happens, the only window where saying something useful changes the outcome.',
              },
            ].map((p) => (
              <div key={p.n} className="space-y-4">
                <p className="font-serif text-5xl font-normal leading-none text-orange-600 md:text-6xl">
                  {p.n}
                </p>
                <h3 className="font-serif text-2xl font-normal leading-[1.2] tracking-[-0.015em] text-gray-900 md:text-3xl">
                  {p.t}
                </h3>
                <p className="text-base leading-[1.7] text-gray-700">
                  {p.d}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-orange-500 pt-8">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The category name
            </p>
            <p className="mt-4 max-w-3xl font-serif text-3xl font-normal italic leading-[1.3] text-gray-900 md:text-4xl">
              Psyche AI. The behavioral interface layer.
            </p>
          </div>
        </section>

        {/* SECTION 03 — The psyche has structure */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
              <span className="text-orange-600">03</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">Why the psyche is learnable</span>
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            The psyche has{' '}
            <span className="italic text-orange-600">structure.</span>
          </h2>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Autopilot behavior is not random. It is not chaos. It is a
            shape with measurable dimensions &mdash; the same way grammar
            has structure, the same way a heartbeat has structure. Four
            dimensions, all of them learnable.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                k: 'Temporal',
                t: 'Fires in specific windows.',
                d: '9–11pm. Monday morning. Post-lunch. The window where the script runs is the same window, week after week. Predictable in time.',
              },
              {
                k: 'Cue-based',
                t: 'Fires from specific triggers.',
                d: 'Stress. Boredom. Isolation. A location, a notification, a feeling. The pattern doesn’t fire arbitrarily &mdash; it fires from a finite set of cues.',
              },
              {
                k: 'Narrative',
                t: 'Runs through specific excuse scripts.',
                d: 'Eight classifiable categories. The sentence you say to yourself before you fold is not unique to the night. It is a script you have run before.',
              },
              {
                k: 'Recovery',
                t: 'Fails and rebounds in predictable sequences.',
                d: 'How you slip, how you spiral, how you come back — or don’t. The recovery curve is its own shape, measurable on its own.',
              },
            ].map((row) => (
              <div
                key={row.k}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {row.k}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {row.t}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">
                  {row.d}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl font-serif text-2xl font-normal leading-[1.4] text-gray-900 md:text-3xl">
            Because the psyche has structure{' '}
            <span className="text-orange-600">&rarr;</span> it can be
            modeled <span className="text-orange-600">&rarr;</span>{' '}
            predicted <span className="text-orange-600">&rarr;</span>{' '}
            <span className="italic text-orange-600">intercepted.</span>
          </p>
        </section>

        {/* SECTION 04 — Why the data is the moat */}
        <section className="space-y-10">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
              <span className="text-orange-600">04</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">The data moat</span>
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            Why the data is the{' '}
            <span className="italic text-orange-600">moat.</span>
          </h2>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Every COYL interaction &mdash; every slip, interrupt,
            recovery, and excuse &mdash; builds a behavioral model of
            that individual&rsquo;s psyche. Four properties make this
            dataset different from anything any other AI can collect.
          </p>



          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                k: 'Longitudinal',
                t: 'Months of data, not a session.',
                d: 'A chatbot sees you for one conversation. COYL sees the same window fire at 9:47pm twelve weeks in a row. Time is the signal no single-turn model can collect.',
              },
              {
                k: 'Pre-conscious',
                t: 'Captures behavior before rationalization.',
                d: 'A journal records what you tell yourself happened. COYL records what actually happened, in the second it happened, before your story about it gets written.',
              },
              {
                k: 'Ground-truth',
                t: 'Measures what people do, not what they report.',
                d: 'Self-report data is filtered through identity, mood, and memory. Behavioral signal is what the body actually did. The gap between the two is most of the failure mode of behavior change.',
              },
              {
                k: 'Population-comparable',
                t: 'Six archetypes cluster across millions of users.',
                d: 'Your 9 PM kitchen has a shape. So does your archetype’s. COYL learns the individual model and the population model simultaneously — the only way to give precision advice at scale.',
              },
            ].map((row) => (
              <div
                key={row.k}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {row.k}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {row.t}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-gray-700">
                  {row.d}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl font-serif text-2xl font-normal leading-[1.4] text-gray-900 md:text-3xl">
            This dataset is the moat.{' '}
            <span className="italic text-orange-600">
              The app is how you build it.
            </span>
          </p>
        </section>

        {/* SECTION 05 — The MCP parallel */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em]">
              <span className="text-orange-600">05</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">The MCP parallel</span>
            </span>
          </div>

          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            The platform{' '}
            <span className="italic text-orange-600">play.</span>
          </h2>

          {/* The parallel — two clean lines, hairline rule between */}
          <div className="space-y-6 border-l border-orange-500 pl-8 md:pl-12">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                MCP
              </p>
              <p className="mt-3 font-serif text-2xl font-normal leading-[1.3] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Protocol between LLMs and{' '}
                <span className="italic">software systems.</span>
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                COYL Protocol
              </p>
              <p className="mt-3 font-serif text-2xl font-normal leading-[1.3] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Protocol between LLMs and{' '}
                <span className="italic text-orange-600">
                  human behavioral reality.
                </span>
              </p>
            </div>
          </div>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            The Behavioral Context Object any LLM can consume &mdash; no
            PII, only behavioral abstractions. A read API that turns any
            generic assistant into a psyche-aware advisor.
          </p>

          <CodeBlock
            lang="json"
            code={`{
  "archetype": "9PM_NEGOTIATOR",
  "danger_window_active": true,
  "window_confidence": 0.87,
  "current_excuse_category": "DESERVER",
  "self_trust_score": 74,
  "risk_level": "HIGH"
}`}
          />

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            When Claude or GPT-4o has this object, they stop being
            generic assistants and become psyche-aware advisors.
            That&rsquo;s the platform play. COYL owns the behavioral
            context layer no LLM can generate on its own.
          </p>
        </section>

        {/* CLOSING — recurring anchor + dual CTAs */}
        <section className="space-y-10 border-t border-orange-500 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The recurring anchor
          </p>
          <h2 className="max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
            AI for the moment{' '}
            <span className="italic text-orange-600">
              before behavior happens.
            </span>
          </h2>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Psyche AI is the category. COYL is the first product in it.
            If you build with LLMs, the protocol surface is where you
            start. If you live with your own autopilot, the audit is
            where you start.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/audit"
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600"
            >
              Find your autopilot &middot; 60-second audit
            </Link>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-all hover:border-orange-300"
            >
              Read the protocol spec
            </Link>
            <Link
              href="/manifesto"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
            >
              Read the manifesto
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}

/**
 * Calm dark code-block surface &mdash; same shape as /protocol and
 * /developers so the three pages read as one editorial system. Inlined
 * rather than extracted to a shared util because the surface area is
 * three pages; a util adds indirection without gains.
 */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#1b1f24] bg-[#0f1115] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)]">
      <figcaption className="border-b border-white/[0.04] bg-white/[0.02] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
        {lang}
      </figcaption>
      <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.55] text-[#e6e2da]">
        {code}
      </pre>
    </figure>
  )
}
