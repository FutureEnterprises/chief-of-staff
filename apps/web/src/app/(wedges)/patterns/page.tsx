import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'See how you keep getting in your own way',
  description: 'COYL remembers the excuses you forget. Your danger windows. Your failure chains. Your recovery speed. Visible truth.',
}

export default function PatternsMarketingPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Patterns</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        It remembers the excuses<br />you forget you use.
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-400">
        &ldquo;I&apos;ll start tomorrow&rdquo; — 9 times in 3 weeks. That&apos;s not a plan. That&apos;s your
        avoidance phrase. COYL shows you.
      </p>

      <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: 'Your danger windows', body: 'The exact hours and days your autopilot fires. Heatmap view.' },
          { title: 'Top excuses by category', body: 'Ranked across 8 patterns: Delay, Reward, Minimization, Collapse, Exhaustion, Exception, Compensation, Social pressure.' },
          { title: 'Failure chains', body: 'Missed weigh-in → binge next day. Skipped workout → weekend collapse. The sequences you run.' },
          { title: 'Recovery speed', body: 'How fast you get back after a slip. The self-trust metric.' },
          { title: 'What actually works', body: 'Interventions that interrupted scripts for YOU specifically.' },
          { title: 'Identity trend', body: 'From sleepwalking → avoidant → recovering → resilient → high-self-trust.' },
        ].map((p) => (
          <div key={p.title} className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5">
            <h3 className="mb-2 text-base font-bold text-white">{p.title}</h3>
            <p className="text-sm text-gray-400">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-12 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <blockquote className="text-lg italic text-gray-300">
          &ldquo;You said &lsquo;I&apos;ll start tomorrow&rsquo; 9 times in 3 weeks. That is not a plan. That is your avoidance phrase.&rdquo;
        </blockquote>
        <p className="mt-3 text-xs text-gray-500">— Example COYL pattern callout</p>
      </section>

      <Link href="/sign-up" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">
        Map my autopilot
      </Link>
    </>
  )
}
