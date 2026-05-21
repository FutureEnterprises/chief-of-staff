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
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Science</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        The behavioral mechanism<br />
        <span className="text-orange-600">behind COYL.</span>
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-600">
        Pattern interrupts. Just-in-time adaptive interventions (JITAI). Dual-process
        theory. Habit automaticity. Implementation intentions. Every claim cited to a
        primary source &mdash; the science behind catching yourself in real life.
      </p>

      <div className="mb-12 space-y-8">
        {CITATIONS.map((c, i) => (
          <section key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="mb-3 text-xs font-mono text-orange-500">FINDING {String(i + 1).padStart(2, '0')}</p>
            <h3 className="mb-3 text-lg font-bold text-gray-900">{c.claim}</h3>
            <p className="mb-4 text-sm text-gray-600">{c.explanation}</p>
            <ul className="space-y-1.5 text-xs">
              {c.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline underline-offset-2 hover:text-orange-700">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mb-12 rounded-3xl border border-gray-200 bg-gray-100 p-8 text-sm text-gray-600">
        <h2 className="mb-3 text-lg font-bold text-gray-900">Important: what COYL is NOT</h2>
        <ul className="space-y-2">
          <li>• COYL is a behavioral support tool, not medical treatment.</li>
          <li>• It is not a substitute for a doctor, therapist, dietitian, or licensed clinician.</li>
          <li>• If you&apos;re dealing with an eating disorder, addiction, or severe distress, please seek qualified professional care.</li>
          <li>• Our AI provides general behavioral support, not personalized medical, psychological, or nutritional advice.</li>
        </ul>
      </section>

      <blockquote className="mb-8 max-w-2xl rounded-2xl border-l-4 border-orange-500 bg-orange-50 px-5 py-3 italic text-gray-900">
        COYL is built from known behavioral science. The new invention is timing, interface, and intervention delivery.
      </blockquote>

      <Link href="/sign-up" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Start your anti-autopilot map
      </Link>
    </>
  )
}
