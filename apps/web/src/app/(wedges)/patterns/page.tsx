/**
 * /patterns — the engine-of-engines hub.
 *
 * Per the v4 audit (May 2026): "Create a single 'Patterns we catch'
 * page that explains the engine and then links to vertical subpages
 * with tailored copy. Avoid repeating the same research across
 * multiple pages; instead, emphasise that these problems share a
 * common loop."
 *
 * This page sits as the connective tissue between the homepage's
 * "Patterns COYL catches" breadth band (which is a teaser) and the
 * existing vertical pages (/weight-loss, /work, /procrastination,
 * /recovery, /recurring-loops, /decision-support — which are
 * drill-downs). It establishes the claim "one coordinator, many
 * surfaces" once, so the verticals can each focus on their specific
 * audience without re-stating the engine narrative.
 *
 * Research citations live in lib/research-stats.ts (single source of
 * truth) — this page imports from there rather than restating the
 * numbers inline.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { researchStat } from '@/lib/research-stats'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Patterns we catch — one engine, many surfaces',
  description:
    'COYL has one coordinator. It catches food at 9 PM, tab switches at 11 AM, follow-ups that drift past Thursday, and the decision you keep deferring — same engine, six surfaces.',
  keywords: [
    'coyl patterns',
    'behavioral interrupt engine',
    'multi-vertical behavior change',
    'jitai consumer app',
    'autopilot loop taxonomy',
  ],
  alternates: { canonical: '/patterns' },
  openGraph: {
    title: 'Patterns we catch — one engine, many surfaces',
    description:
      'COYL has one coordinator. It catches food at 9 PM, tab switches at 11 AM, follow-ups that drift past Thursday — same engine, six surfaces.',
    url: 'https://coyl.ai/patterns',
    images: [
      {
        url: '/api/og?title=Patterns+we+catch&kicker=One+engine.+Many+surfaces.',
        width: 1200,
        height: 630,
      },
    ],
  },
}

const VERTICALS = [
  {
    eyebrow: 'NIGHT · FRIDGE',
    title: 'The 9 PM kitchen',
    body: '"Not hungry. Just restless." The fridge. The snack you said you wouldn’t. The script the willpower can’t touch.',
    href: '/weight-loss',
    cta: 'Late-night kitchen',
  },
  {
    eyebrow: 'FOCUS · TAB',
    title: 'The 11 AM tab switch',
    body: '"One more tab won’t hurt." The doom-scroll. The Reddit pivot mid-deep-work. The afternoon collapse.',
    href: '/procrastination',
    cta: 'Procrastination',
  },
  {
    eyebrow: 'FOLLOW-THROUGH · DEAL',
    title: 'The follow-up that died',
    body: '"I’ll send it Tuesday." Tuesday becomes Friday. Friday becomes Monday. Monday becomes never.',
    href: '/work',
    cta: 'Work follow-through',
  },
  {
    eyebrow: 'DECISIONS · LATE',
    title: 'The decision you keep deferring',
    body: 'The conversation you’ve been avoiding. The email in drafts. The thing your gut said three weeks ago.',
    href: '/decision-support',
    cta: 'Decision support',
  },
  {
    eyebrow: 'RECOVERY · POST-SLIP',
    title: 'The same-night recovery',
    body: 'You already slipped. The next 90 minutes is the whole game. COYL holds the line.',
    href: '/recovery',
    cta: 'Recovery engine',
  },
  {
    eyebrow: 'RECURRING · LOOP',
    title: 'The pattern you keep running',
    body: 'Same time. Same script. Same outcome. COYL learns the rhythm and breaks it.',
    href: '/recurring-loops',
    cta: 'Recurring loops',
  },
]

export default function PatternsPage() {
  const interruptionRecovery = researchStat('INTERRUPTION_RECOVERY_COST')
  const interruptionCadence = researchStat('INTERRUPTION_CADENCE')
  const jitai = researchStat('JITAI_FOUNDATION')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Patterns', url: 'https://coyl.ai/patterns' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* HEADER */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Patterns we catch
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            One engine.{' '}
            <span className="italic text-orange-600">
              Many surfaces.
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            COYL is not six apps. It&rsquo;s one coordinator that catches food
            at 9 PM, tab switches at 11 AM, follow-ups that drift past Thursday,
            and the decision you keep deferring. The mechanic is the same;
            the windows differ. This page is the engine&rsquo;s map.
          </p>
        </header>

        {/* SAME ENGINE EXPLANATION */}
        <section className="space-y-8 border-t border-gray-200 pt-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The mechanic
            </span>
          </div>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Detect the danger window.{' '}
            <span className="italic text-orange-600">
              Interrupt before the script runs.
            </span>{' '}
            Recover same-night.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The autopilot loop has seven steps: commitment, drift, excuse,
            interrupt, action, recovery, learning. Every loop you run uses
            the same seven steps. COYL fires at step 4 — the moment when a
            cued behavior can still be re-routed. That&rsquo;s the
            three-second window. Same window for food, focus, follow-up,
            spending, scrolling, sleep.
          </p>
          <div className="grid grid-cols-1 gap-8 pt-4 md:grid-cols-2">
            <div className="border-t border-orange-500 pt-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-orange-600">
                Why interrupts work
              </p>
              <p className="mt-2 text-sm leading-[1.65] text-gray-700">
                {interruptionRecovery.headline} is the median recovery cost
                after a focus interruption ({interruptionRecovery.citation}).
                You’re interrupted{' '}
                <strong className="font-semibold">
                  {interruptionCadence.headline}
                </strong>{' '}
                in knowledge work ({interruptionCadence.citation}). COYL
                doesn&rsquo;t add interruptions — it turns the ones already
                happening into a precise re-route.
              </p>
            </div>
            <div className="border-t border-orange-500 pt-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-orange-600">
                Why now
              </p>
              <p className="mt-2 text-sm leading-[1.65] text-gray-700">
                {jitai.headline}: just-in-time adaptive interventions (JITAIs)
                are the research foundation for what COYL operationalizes
                ({jitai.citation}). The science exists. The consumer surface
                didn&rsquo;t — until now.
              </p>
            </div>
          </div>
        </section>

        {/* VERTICAL GRID */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-orange-500" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Six surfaces
              </span>
            </div>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Same coordinator.{' '}
              <span className="italic text-orange-600">
                Different windows.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((v) => (
              <Link
                key={v.eyebrow}
                href={v.href}
                className="group block h-full border-t border-gray-200 pt-6 transition-all hover:border-gray-900"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {v.eyebrow}
                </p>
                <p className="mt-5 font-serif text-2xl font-normal italic leading-[1.15] tracking-[-0.01em] text-gray-900">
                  {v.title}
                </p>
                <p className="mt-4 text-sm leading-[1.7] text-gray-600">{v.body}</p>
                <p className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500 transition-colors group-hover:text-orange-600">
                  {v.cta} <span aria-hidden>&rarr;</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* THE GLP-1 BRIDGE */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            For GLP-1 patients
          </p>
          <h2 className="max-w-3xl font-serif text-2xl font-normal leading-[1.2] tracking-[-0.015em] text-gray-900 md:text-4xl">
            On Ozempic, Wegovy, or Zepbound?{' '}
            <span className="italic text-orange-600">
              Take the Rebound quiz.
            </span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            The general autopilot patterns translate to four GLP-1-specific
            rebound archetypes (Night, Weekend, Stress, Reward). If
            you&rsquo;re on or coming off a GLP-1, the Rebound quiz tunes
            the coordinator to the post-taper window. Same engine, GLP-1-
            specific protocol.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/rebound/quiz"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Take the Rebound quiz &rarr;
            </Link>
            <Link
              href="/audit"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              General autopilot audit
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Start
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-5xl">
            Take the 90-second audit.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Three questions. No signup. Your autopilot family on the other
            side. The pattern you keep running, named and mapped.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/audit"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Start the audit &rarr;
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              How the engine works
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}
