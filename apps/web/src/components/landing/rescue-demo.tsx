'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'motion/react'
import {
  Refrigerator, MessageSquareWarning, Smartphone, Flame,
  Wind, HeartCrack, ArrowRight, type LucideIcon,
} from 'lucide-react'
import { StructuredResponse } from '@/components/structured-response'

/**
 * Landing-page rescue demo.
 *
 * Intentionally NOT backed by the live AI. The demo's job is to show the
 * interaction pattern — a caught-moment prompt meeting a calm, structured
 * response — not to prove the AI works. Streaming is scripted word-by-word
 * client-side: zero network, zero failure modes, consistent every time.
 * The real AI is the product. This is the trailer.
 *
 * Triggers are deliberately spread across autopilot wedges so visitors see
 * the mechanism is universal, not weight-loss-specific:
 *   • Weight / food pattern
 *   • Emotional reactivity
 *   • Focus / avoidance
 *   • Destructive patterns (alcohol / porn / smoking / etc. — framed vaguely)
 *   • Mid-spiral (universal)
 *   • Retroactive shame (universal)
 */

type Trigger = {
  key: string
  title: string
  sub: string
  wedge: string
  icon: LucideIcon
  script: string
}

const DEMO_TRIGGERS: Trigger[] = [
  {
    key: 'FRIDGE_STARE',
    title: 'I\u2019m staring into the fridge',
    sub: 'Not hungry. Just restless.',
    wedge: 'Food / weight',
    icon: Refrigerator,
    script: `**Pause**
Close the door. Ten seconds before you decide anything.

**What\u2019s actually happening**
You\u2019re not hungry. You\u2019re looking for a state change. Food is the habit, not the need.

**Least-damaging move right now**
Water. Walk out of the kitchen. Come back in ten minutes if you still want something.

**Pattern**
This is the 9 PM loop. The cue was crossing into the kitchen, not any thought you had. That\u2019s why it feels automatic.`,
  },
  {
    key: 'ANGRY_TEXT',
    title: 'About to send the angry text',
    sub: 'The one I\u2019ll regret by morning.',
    wedge: 'Emotional reactivity',
    icon: MessageSquareWarning,
    script: `**Pause**
Don\u2019t send it. Put the phone down and walk somewhere you can\u2019t see it.

**What\u2019s actually happening**
You\u2019re about to choose the sharpest words because they feel like control. They\u2019re not. They\u2019re the autopilot ending the discomfort by creating a bigger one.

**Least-damaging move right now**
Wait until tomorrow morning. Re-read it then. Rewrite it if you still want to send anything.

**Pattern**
This is reactive closure. Common. Not wisdom. A loop.`,
  },
  {
    key: 'DOOMSCROLL',
    title: 'I just lost an hour to my phone',
    sub: 'I told myself "one minute." It was sixty.',
    wedge: 'Focus / avoidance',
    icon: Smartphone,
    script: `**Pause**
Put the phone in another room. Not on the desk. Not in your pocket. Another room.

**What\u2019s actually happening**
You weren\u2019t checking anything. You were avoiding something. The scroll is a low-grade anesthetic for a feeling you haven\u2019t named.

**Least-damaging move right now**
Name the feeling out loud \u2014 bored, anxious, avoidant, lonely. Then do one boring thing on your actual list. Just one.

**Pattern**
This is the displacement loop. Every hour avoided is an hour not processed. The bill comes at night.`,
  },
  {
    key: 'URGE_RISING',
    title: 'An urge is rising',
    sub: 'The one I said I was done with.',
    wedge: 'Destructive pattern',
    icon: Flame,
    script: `**Pause**
The urge is a signal, not a command. You can feel it without obeying it.

**What\u2019s actually happening**
A cue fired. Your brain predicted relief. That prediction is chemistry, not truth \u2014 and it peaks in about 20 minutes.

**Least-damaging move right now**
Ride the wave. Drink water. Move your body. Call someone who knows. Don\u2019t be alone with it.

**Pattern**
Urges get quieter the more times you don\u2019t feed them. Feeding them makes the next one louder.`,
  },
  {
    key: 'SPIRALING',
    title: 'I\u2019m spiraling',
    sub: 'One slip turning into a night.',
    wedge: 'Mid-action',
    icon: Wind,
    script: `**Stop the spiral**
One slip is one slip. A spiral is a second choice.

**What\u2019s actually happening**
You\u2019re telling yourself "I already blew it." That sentence is the machinery of the spiral \u2014 it converts one data point into a license.

**Least-damaging move right now**
Water. Brush your teeth. Bed thirty minutes early. That\u2019s the whole plan.

**Tomorrow re-entry**
Tomorrow isn\u2019t "starting over." It\u2019s the next rep. Do the same thing you\u2019d do if tonight hadn\u2019t happened.`,
  },
  {
    key: 'ALREADY_SLIPPED',
    title: 'I already folded last night',
    sub: 'Woke up thinking: not again.',
    wedge: 'Retroactive',
    icon: HeartCrack,
    script: `**No shame, no spiral**
You slipped. One data point. Not who you are.

**What NOT to do**
Don\u2019t skip today. Don\u2019t compensate with a punishment. Don\u2019t build a grand new plan. All three are the same escape.

**Next 2 hours**
Eat your normal breakfast. Drink water. Ten minutes of movement. Small, normal, boring.

**Pattern note**
The slip is useful information. What happened in the hour before? That\u2019s where the real interruption lives for next time.`,
  },
]

export function RescueDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [selected, setSelected] = useState<Trigger | null>(null)
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)
  const cancelRef = useRef<boolean>(false)

  function fire(trigger: Trigger) {
    // Cancel any in-flight stream
    cancelRef.current = true
    setTimeout(() => {
      cancelRef.current = false
      setSelected(trigger)
      setResponse('')
      streamScript(trigger)
    }, 0)
  }

  async function streamScript(trigger: Trigger) {
    setStreaming(true)
    setResponse('')

    // Initial "thinking" pause so it feels like COYL is actually responding,
    // not instantly flashing prewritten text.
    await delay(420)
    if (cancelRef.current) return

    // Split on whitespace while preserving it — the join reads natural.
    const tokens = trigger.script.split(/(\s+)/)
    let acc = ''
    for (const tok of tokens) {
      if (cancelRef.current) return
      acc += tok
      setResponse(acc)
      // Per-token delay: 14-32ms gives a smooth, slightly irregular cadence
      // that reads as streaming rather than mechanical.
      await delay(14 + Math.random() * 18)
    }
    setStreaming(false)

    // Analytics hook — fires after a complete demo view
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('coyl:demo-completed', { detail: { trigger: trigger.key } }),
        )
      } catch {
        /* silent */
      }
    }
  }

  useEffect(() => {
    return () => {
      cancelRef.current = true
    }
  }, [])

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Try it right now
        </h2>
        <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Pick a moment<br />you already know.
        </h3>
        <p className="mt-4 max-w-xl text-sm text-gray-400">
          One of these has happened to you this month. Tap it. Watch what COYL says.
          Not a hypothetical.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Trigger list */}
        <div className="md:col-span-5">
          <div className="space-y-2">
            {DEMO_TRIGGERS.map((t, i) => {
              const Icon = t.icon
              const isSelected = selected?.key === t.key
              return (
                <motion.button
                  key={t.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fire(t)}
                  className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_24px_rgba(255,102,0,0.22)]'
                      : 'border-white/10 bg-white/5 hover:border-orange-500/30 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      isSelected
                        ? 'border-orange-500/50 bg-orange-500/15 text-orange-400'
                        : 'border-white/10 bg-white/5 text-gray-400 group-hover:text-orange-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{t.sub}</p>
                    <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-gray-600">
                      {t.wedge}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Response panel */}
        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            {!selected && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center"
              >
                <p className="text-sm text-gray-500">
                  <span className="hidden md:inline">&larr; Pick one.</span>
                  <span className="md:hidden">Pick one above.</span>
                </p>
                <p className="mt-2 max-w-xs text-xs text-gray-600">
                  COYL responds in the same voice you&apos;d hear at the real moment.
                </p>
              </motion.div>
            )}

            {selected && (
              <motion.div
                key={selected.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <selected.icon className="h-4 w-4 shrink-0 text-orange-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{selected.title}</p>
                    <p className="text-xs text-gray-400">{selected.sub}</p>
                  </div>
                </div>

                {streaming && !response && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                        className="h-1.5 w-1.5 rounded-full bg-orange-500"
                      />
                    ))}
                    <span className="ml-1 text-xs text-gray-400">COYL is responding\u2026</span>
                  </div>
                )}

                {response && <StructuredResponse text={response} accentColor="orange" />}

                {response && !streaming && (
                  <Link
                    href={`/sign-up?ref=demo&t=${selected.key}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-transform hover:scale-[1.01]"
                  >
                    <span>Want this at the real moment \u2014 not on a landing page?</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
