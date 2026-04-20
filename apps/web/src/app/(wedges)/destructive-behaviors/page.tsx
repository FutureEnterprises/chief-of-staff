import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'COYL for destructive patterns \u2014 break the craving loop',
  description:
    "Cravings, doomscrolling, impulse spending, the drink you said you\u2019d stop \u2014 the repetitive patterns that take over your day. COYL interrupts them at the moment of drift. Not a recovery program; a commitment engine.",
  keywords: [
    'craving interruption app',
    'stop doomscrolling',
    'impulse spending app',
    'break bad habits',
    'behavioral pattern app',
    'addictive behavior tracker',
  ],
  alternates: { canonical: '/destructive-behaviors' },
  openGraph: {
    title: 'COYL for destructive patterns \u2014 break the craving loop',
    description:
      "Craving, scrolling, impulse spending, the drink you said you'd stop. COYL catches the moment of drift.",
    url: 'https://coyl.ai/destructive-behaviors',
  },
}

export default function DestructiveBehaviorsPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-red-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Destructive behaviors</span>
      </div>
      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        The loops that keep running you.
      </h1>
      <p className="mb-4 max-w-2xl text-lg text-gray-400">
        Cravings. Doomscrolling. Impulse spending. Weed drift. Vape urges. Sugar cycles.
        The patterns you&apos;re not proud of, running on autopilot, in the moments you can&apos;t see them.
      </p>
      <p className="mb-12 max-w-2xl text-sm italic text-gray-500">
        COYL is a behavioral support tool. It is not medical treatment and is not a substitute
        for professional care. If you&apos;re struggling with a serious addiction, please reach out to a
        qualified clinician.
      </p>

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: 'Nicotine / vape', body: 'The urge spike → the reach → the rationalization. COYL interrupts the sequence before the reach.' },
          { title: 'Alcohol moderation', body: 'The first drink, the second drink, the night narrative. COYL logs the pattern and calls the leak point.' },
          { title: 'Cannabis drift', body: 'Not a crisis. Just… every night. COYL maps the drift and gives you an honest mirror.' },
          { title: 'Sugar and binge cycles', body: 'The craving, the permission story, the collapse. Interrupt the permission story.' },
          { title: 'Doomscrolling', body: 'It\'s not the scroll. It\'s what you\'re avoiding with the scroll. COYL names it.' },
          { title: 'Impulse spending', body: 'The cart is already full. Delay 10 minutes. Most carts don\'t survive 10 minutes.' },
        ].map((p) => (
          <div key={p.title} className="rounded-2xl border border-white/5 bg-gradient-to-br from-red-500/5 to-transparent p-5">
            <h3 className="mb-2 text-base font-bold text-white">{p.title}</h3>
            <p className="text-sm text-gray-400">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-16 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
        <h2 className="mb-4 text-2xl font-bold text-white">The shared loop</h2>
        <p className="mb-4 text-sm text-gray-400">
          Every destructive behavior runs the same sequence. Different object, identical shape.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
          {['Cue', 'Urge', 'Excuse', 'Lapse', 'Shame', 'Hiding', 'Repeat'].map((node, i) => (
            <span key={node} className="flex items-center gap-3">
              <span className="rounded-full border border-red-500/30 bg-black/40 px-3 py-1.5 font-mono">{node}</span>
              {i < 6 && <span className="text-red-500">→</span>}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-400">
          COYL detects the cue, names the excuse, interrupts the sequence, and meets you at shame with recovery instead of punishment.
        </p>
      </section>

      <Link href="/sign-up?wedge=destructive-behaviors" className="inline-block rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 text-sm font-bold text-white">
        Map my loop
      </Link>
    </>
  )
}
