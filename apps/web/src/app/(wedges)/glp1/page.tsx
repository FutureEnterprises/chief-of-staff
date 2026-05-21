/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references: Letter (28523918) — serif H1 with italic accent.
 * Sequel (50c47480) — drug-gap rows become editorial entries on hairline rules.
 * Medium (4784cf2e) — scripts list as italic serif blockquote chain.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL for GLP-1 \u2014 the shot quiets hunger. COYL catches the script.',
  description:
    "Built for the moments medication doesn't touch \u2014 rebound windows, emotional eating, routine drift, fear of regain. Ozempic, Wegovy, Mounjaro suppress appetite. COYL catches the autopilot the drug never reaches.",
  keywords: [
    'ozempic companion',
    'wegovy app',
    'glp-1 behavior coach',
    'ozempic behavior change',
    'glp-1 maintenance',
    'weight loss after glp-1',
    'ozempic rebound',
    'mounjaro companion app',
  ],
  alternates: { canonical: '/glp1' },
  openGraph: {
    title: 'The shot quiets hunger. COYL catches the script.',
    description:
      "Built for the moments medication doesn't touch \u2014 rebound windows, emotional eating, routine drift, fear of regain.",
    url: 'https://coyl.ai/glp1',
    images: [
      {
        url: '/api/og?title=The+shot+quiets+hunger.+COYL+catches+the+script.&kicker=GLP-1+companion',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The shot quiets hunger. COYL catches the script.',
    description: "Built for the moments medication doesn't touch \u2014 rebound, emotional eating, drift, fear of regain.",
    images: ['/api/og?title=The+shot+quiets+hunger.+COYL+catches+the+script.&kicker=GLP-1+companion'],
  },
}

/**
 * /glp1 \u2014 the GLP-1 companion wedge.
 *
 * Positioning (per Viral $100M ARR Playbook v2 \u00a74.1 + \u00a78):
 * GLP-1 prescriptions are growing to 15M+ new users who need behavioral
 * support. Noom hit $100M run-rate on the GLP-1 companion play in 4 months.
 * The drug suppresses hunger; it does not rewrite the late-night kitchen
 * loop, the stress-eating reflex, or the "I deserve this" script.
 *
 * COYL\u2019s angle is sharper than Noom\u2019s generic coaching: surgical
 * interrupts at the exact moments the drug doesn\u2019t cover. This is the
 * behavioral layer that determines whether the 20% loss stays off when the
 * prescription ends.
 *
 * Compliance note: we never say the drug is unsafe or that you should
 * stop it. COYL is behavioral support, not medical advice.
 */

const DRUG_GAPS = [
  {
    drug: 'Suppresses appetite',
    gap: 'Doesn\u2019t touch the 9pm kitchen habit',
    body: 'You\u2019re not hungry, but the script still runs. Walk past the fridge. Open it. Stand there. That\u2019s autopilot, not hunger. COYL catches it.',
  },
  {
    drug: 'Slows gastric emptying',
    gap: 'Doesn\u2019t touch the stress-eat reflex',
    body: 'Cortisol spike at 3pm and you reach anyway. Not because of hunger. Because of pattern. COYL interrupts before the reach.',
  },
  {
    drug: 'GLP-1 medications produce roughly 15\u201320% body-weight loss in published clinical trials (STEP 1 trial, Wilding et al., NEJM 2021)',
    gap: 'Medication can quiet appetite. It does not automatically retrain the late-night script.',
    body: 'The maintenance failure rate is the story nobody talks about. The drug ends. The autopilot comes back. COYL trains the interrupt you\u2019ll need when the prescription stops.',
  },
]

const SCRIPTS_THE_DRUG_WON_T_CATCH = [
  '"I deserve this."',
  '"Just one won\u2019t matter."',
  '"I\u2019m too tired to decide."',
  '"I already messed up today."',
  '"It\u2019s a celebration."',
  '"I\u2019ll start again Monday."',
]

export default function GLP1Page() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'GLP-1 companion', url: 'https://coyl.ai/glp1' },
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          GLP-1 companion
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        The shot quiets hunger.<br />
        <span className="text-orange-600">COYL catches the script.</span>
      </h1>

      <p className="mb-10 max-w-2xl text-lg text-gray-600">
        Built for the moments medication doesn&rsquo;t touch &mdash; rebound windows,
        emotional eating, routine drift, fear of regain. The drug quiets the hunger.
        The autopilot is still there. COYL catches it the second it fires.
      </p>

      <div className="mb-16 flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=glp1"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the companion
        </Link>
        <Link
          href="/audit"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          Find your autopilot (60s)
        </Link>
      </div>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          What the drug does. What it doesn&rsquo;t.
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {DRUG_GAPS.map((g) => (
            <div
              key={g.drug}
              className="rounded-xl border border-orange-500/30 bg-gray-100 p-5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-900">
                  {g.drug}
                </span>
                <span className="text-gray-500">&rarr;</span>
                <span className="rounded-full bg-orange-500/20 px-3 py-1 font-semibold text-orange-700">
                  {g.gap}
                </span>
              </div>
              <p className="text-base leading-relaxed text-gray-600">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Scripts the drug won&rsquo;t catch
        </h2>
        <h3 className="mb-6 text-2xl font-bold text-gray-900 md:text-4xl">
          COYL catches them in your head.
        </h3>
        <ul className="space-y-3">
          {SCRIPTS_THE_DRUG_WON_T_CATCH.map((line) => (
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
        <p className="text-sm uppercase tracking-widest text-gray-500">The maintenance problem</p>
        <p className="mt-2 text-lg text-gray-700">
          The weight loss is the easy part. The hard part is the day the prescription ends and the
          script is still there, waiting. <span className="font-bold text-gray-900">COYL trains the
          interrupt while you&rsquo;re on the drug so it&rsquo;s muscle memory when you&rsquo;re off.</span>
        </p>
      </section>

      <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        <p>
          <span className="font-bold text-gray-700">Not medical advice.</span> COYL is
          behavioral support, not treatment. Always work with your prescriber on medication
          decisions.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=glp1"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the companion
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          How COYL works
        </Link>
      </div>
    </>
  )
}
