import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How COYL works',
  description: 'The autopilot interruption loop: detect the script, interrupt the moment, recover before the spiral.',
}

export default function HowItWorksPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">How it works</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        Detect the script.<br />Interrupt the moment.<br />Recover before the spiral.
      </h1>
      <p className="mb-16 max-w-2xl text-lg text-gray-400">
        COYL is a behavior interruption and decision support system. It learns where your
        autopilot takes over, fires in the exact moments it matters, and keeps one bad
        decision from becoming a bad week.
      </p>

      <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            n: '01',
            title: 'Detect the script',
            body: 'COYL learns your danger windows, your excuse patterns, and your failure sequences. It sees the shape of your autopilot before you do.',
          },
          {
            n: '02',
            title: 'Interrupt the moment',
            body: 'Precision interrupts fire when the script is about to run. Tap a rescue trigger. Ask a decision. Get called out on the exact excuse you were about to use.',
          },
          {
            n: '03',
            title: 'Recover before the spiral',
            body: 'Built for bad days, not perfect users. Shame-resistant re-entry. Same-night recovery. Resume the streak, don\'t restart the plan.',
          },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-6">
            <p className="mb-3 text-xs font-mono text-orange-500">{s.n}</p>
            <h3 className="mb-2 text-lg font-bold text-white">{s.title}</h3>
            <p className="text-sm text-gray-400">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-3 text-2xl font-bold text-white">The 7-stage loop</h2>
        <p className="mb-6 text-sm text-gray-400">
          This is the proprietary orchestration. It&apos;s what separates COYL from chatbots and reminders.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
          {[
            'Signal',
            'State inference',
            'Script detection',
            'Precision interrupt',
            'Honest response',
            'Recovery branch',
            'Pattern update',
          ].map((node, i) => (
            <span key={node} className="flex items-center gap-3">
              <span className="rounded-full border border-orange-500/30 bg-black/40 px-3 py-1.5 font-mono">
                {node}
              </span>
              {i < 6 && <span className="text-orange-500">→</span>}
            </span>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/sign-up" className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white">Build my anti-autopilot plan</Link>
        <Link href="/science" className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200">See the research</Link>
      </div>
    </>
  )
}
