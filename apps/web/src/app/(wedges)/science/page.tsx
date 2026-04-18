import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The science behind COYL',
  description: 'Grounded in peer-reviewed behavioral research: habit automaticity, dietary lapse triggers, just-in-time adaptive interventions, relapse prevention, and implementation intentions.',
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
      { title: 'Meta-analysis of planning and implementation intentions (2024)', url: 'https://www.researchgate.net/publication/378870694_The_When_and_How_of_Planning_Meta-Analysis_of_the_Scope_and_Components_of_Implementation_Intentions_in_642_Tests' },
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
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        Grounded in real<br />behavior science.
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-400">
        Every engine in COYL maps to peer-reviewed research. Here&apos;s what we&apos;re built on and
        where to read the primary sources.
      </p>

      <div className="mb-12 space-y-8">
        {CITATIONS.map((c, i) => (
          <section key={i} className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-6">
            <p className="mb-3 text-xs font-mono text-orange-500">FINDING {String(i + 1).padStart(2, '0')}</p>
            <h3 className="mb-3 text-lg font-bold text-white">{c.claim}</h3>
            <p className="mb-4 text-sm text-gray-400">{c.explanation}</p>
            <ul className="space-y-1.5 text-xs">
              {c.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 underline underline-offset-2 hover:text-orange-300">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mb-12 rounded-3xl border border-white/10 bg-black/40 p-8 text-sm text-gray-400">
        <h2 className="mb-3 text-lg font-bold text-white">Important: what COYL is NOT</h2>
        <ul className="space-y-2">
          <li>• COYL is a behavioral support tool, not medical treatment.</li>
          <li>• It is not a substitute for a doctor, therapist, dietitian, or licensed clinician.</li>
          <li>• If you&apos;re dealing with an eating disorder, addiction, or severe distress, please seek qualified professional care.</li>
          <li>• Our AI provides general behavioral support, not personalized medical, psychological, or nutritional advice.</li>
        </ul>
      </section>

      <Link href="/sign-up" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Start your anti-autopilot map
      </Link>
    </>
  )
}
