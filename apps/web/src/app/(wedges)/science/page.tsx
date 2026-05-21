/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references: Letter (28523918) — serif H1; Christopher Ireland
 * (f293bacf) — citations as editorial entries with hairline rules.
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Science — the behavioral mechanism behind COYL',
  description:
    'Pattern interrupts. JITAI. Dual-process theory. Habit automaticity. Implementation intentions. The behavioral mechanism behind catching yourself in real life, every claim cited to a primary source.',
  keywords: [
    'jitai research',
    'behavior change science',
    'habit automaticity research',
    'dietary lapse research',
    'implementation intentions',
    'relapse prevention research',
    'behavioral medicine app',
  ],
  alternates: { canonical: '/science' },
  openGraph: {
    title: 'The behavioral mechanism behind COYL',
    description:
      'Pattern interrupts. JITAI. Dual-process. Every claim cited.',
    url: 'https://coyl.ai/science',
    images: [
      {
        url: '/api/og?title=The+behavioral+mechanism+behind+COYL.&kicker=The+science',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The behavioral mechanism behind COYL',
    description: 'Pattern interrupts. JITAI. Dual-process. Every claim cited.',
    images: ['/api/og?title=The+behavioral+mechanism+behind+COYL.&kicker=The+science'],
  },
}

type Citation = {
  claim: string
  explanation: string
  sources: Array<{ title: string; url: string }>
}

const CITATIONS: Citation[] = [
  {
    claim: 'Behavior in stable contexts can become automatic, reducing the role of conscious intention.',
    explanation: 'This is why reminders and willpower often fail — the script runs before the user decides. COYL is designed around detecting and interrupting those automatic moments.',
    sources: [
      { title: 'Time to Form a Habit: systematic review and meta-analysis (2024)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623/' },
      { title: 'Habits automatically achieve long-term goals (2024)', url: 'https://pubmed.ncbi.nlm.nih.gov/39321606/' },
    ],
  },
  {
    claim: 'Dietary lapses happen in specific moments driven by internal and external triggers — not by lack of plan quality.',
    explanation: 'Ecological momentary assessment research shows lapses are predictable and moment-level. COYL builds the Risk Window Setup around exactly these triggers.',
    sources: [
      { title: 'Ecological momentary assessment of dietary lapses', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5591758/' },
      { title: 'Everyday activities and lapse risk', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10164199/' },
    ],
  },
  {
    claim: 'Just-in-time adaptive interventions (JITAIs) deliver support at the right moment based on real-time state.',
    explanation: 'Precision interrupts in COYL are a direct implementation of JITAI principles: adapt timing, content, and intensity based on the user\'s changing context.',
    sources: [
      { title: 'JITAI systematic review (2024)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11470223/' },
      { title: 'JITAI framework application (2023)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11272684/' },
    ],
  },
  {
    claim: 'Effective behavioral weight-loss programs combine self-monitoring, goal setting, problem solving, and relapse prevention.',
    explanation: 'COYL covers all four: commitments (goal setting), pattern tracking (self-monitoring), decision engine (problem solving), recovery engine (relapse prevention).',
    sources: [
      { title: 'NIDDK — behavioral weight-loss interventions', url: 'https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/behavioral-weight-loss-interventions' },
    ],
  },
  {
    claim: 'Implementation intentions ("if-then" plans) help translate intention into action under temptation.',
    explanation: 'Every commitment in COYL is structured as a specific, trackable rule — and every rescue flow is an if-then plan for a known failure moment.',
    sources: [
      { title: 'Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493–503.', url: 'https://psycnet.apa.org/doi/10.1037/0003-066X.54.7.493' },
      { title: 'Nahum-Shani, I. et al. (2018). Just-in-Time Adaptive Interventions (JITAIs) in Mobile Health. Annals of Behavioral Medicine, 52(6), 446–462.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6082242/' },
    ],
  },
  {
    claim: 'Obesity is at population-level scale in the U.S., making behavioral support a large-audience problem.',
    explanation: 'CDC data shows adult obesity prevalence at 40.3% (Aug 2021–Aug 2023). This is a mainstream wedge, not a niche one.',
    sources: [
      { title: 'CDC Data Brief #508', url: 'https://www.cdc.gov/nchs/products/databriefs/db508.htm' },
      { title: 'CDC adult obesity prevalence maps', url: 'https://www.cdc.gov/obesity/data-and-statistics/adult-obesity-prevalence-maps.html' },
    ],
  },
]

export default function SciencePage() {
  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">Science</span>
      </div>
      <h1 className="mb-10 font-serif text-5xl font-normal leading-[1.0] tracking-[-0.03em] text-gray-900 md:text-7xl">
        The behavioral mechanism<br />
        <span className="italic text-orange-600">behind COYL.</span>
      </h1>
      <p className="mb-20 max-w-2xl text-lg leading-[1.7] text-gray-600">
        Pattern interrupts. Just-in-time adaptive interventions (JITAI). Dual-process
        theory. Habit automaticity. Implementation intentions. Every claim cited to a
        primary source &mdash; the science behind catching yourself in real life.
      </p>

      <div className="mb-16 space-y-12">
        {CITATIONS.map((c, i) => (
          <section key={i} className="border-t border-gray-200 pt-6">
            <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">FINDING {String(i + 1).padStart(2, '0')}</p>
            <h3 className="mb-5 font-serif text-2xl font-normal leading-[1.2] tracking-[-0.015em] text-gray-900 md:text-3xl">{c.claim}</h3>
            <p className="mb-6 text-base leading-[1.65] text-gray-600">{c.explanation}</p>
            <ul className="space-y-2 text-sm">
              {c.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-serif italic text-orange-600 underline-offset-4 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mb-16 border-t border-gray-200 pt-12">
        <p className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">Important</p>
        <h2 className="mb-6 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-gray-900 md:text-5xl">What COYL is <span className="italic text-orange-600">not.</span></h2>
        <ul className="space-y-3 text-base leading-[1.65] text-gray-700">
          <li>COYL is a behavioral support tool, not medical treatment.</li>
          <li>It is not a substitute for a doctor, therapist, dietitian, or licensed clinician.</li>
          <li>If you&apos;re dealing with an eating disorder, addiction, or severe distress, please seek qualified professional care.</li>
          <li>Our AI provides general behavioral support, not personalized medical, psychological, or nutritional advice.</li>
        </ul>
      </section>

      <blockquote className="mb-10 max-w-3xl border-l border-orange-500 pl-6 font-serif text-2xl italic leading-[1.4] text-gray-900 md:text-3xl">
        COYL is built from known behavioral science. The new invention is timing, interface, and intervention delivery.
      </blockquote>

      <Link href="/sign-up" className="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(255,102,0,0.45)] transition-all hover:bg-orange-600">
        Start your anti-autopilot map
      </Link>
    </>
  )
}
