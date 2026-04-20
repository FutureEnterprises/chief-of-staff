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
    script: `**Pattern**
This is your night loop. You\u2019ve been here dozens of times. The cue was crossing into the kitchen, not any thought you had.

**Truth**
You\u2019re not hungry. You\u2019re looking for a state change. Food is the habit, not the need.

**Prediction**
If you eat now, you already know. This turns into a full night of eating. Fine for 8 minutes. Then worse.

**Interrupt**
Close the fridge. Step away from the kitchen.

**Action**
One glass of water. Walk out of the kitchen for ten minutes.

**Follow-up**
If you still want food after ten, you can have it \u2014 and we log it honestly.`,
  },
  {
    key: 'ANGRY_TEXT',
    title: 'About to send the angry text',
    sub: 'The one I\u2019ll regret by morning.',
    wedge: 'Emotional reactivity',
    icon: MessageSquareWarning,
    script: `**Pattern**
This is reactive closure. You\u2019ve done it before. The script is: end the feeling fast, no matter what it costs.

**Truth**
You\u2019re picking the sharpest words because they feel like control. They\u2019re not.

**Prediction**
If you hit send, you feel powerful for 40 seconds. Then sick. Tomorrow you have to fix this plus that.

**Interrupt**
Don\u2019t send it. Put the phone face-down in another room.

**Action**
Write the whole thing in Notes. Don\u2019t send. Read it tomorrow at 8 AM.

**Follow-up**
You won\u2019t send it then. That\u2019s the point.`,
  },
  {
    key: 'DOOMSCROLL',
    title: 'I just lost an hour to my phone',
    sub: 'I told myself "one minute." It was sixty.',
    wedge: 'Focus / avoidance',
    icon: Smartphone,
    script: `**Pattern**
This is the displacement loop. Every hour avoided is an hour not processed. The bill comes due at night.

**Truth**
You weren\u2019t checking anything. You were avoiding. The scroll is a low-grade anesthetic for a feeling you haven\u2019t named.

**Prediction**
If you keep going, another hour vanishes. At 11 PM you\u2019ll tell yourself you\u2019ll \u201cstart fresh tomorrow.\u201d Tomorrow starts with scrolling.

**Interrupt**
Put the phone in another room. Not the desk. Not your pocket. Another room.

**Action**
Name the feeling out loud \u2014 bored, anxious, lonely. Do the first boring thing on your list for five minutes.

**Follow-up**
Come back to the phone in twenty. Check in with how you feel.`,
  },
  {
    key: 'URGE_RISING',
    title: 'An urge is rising',
    sub: 'The one I said I was done with.',
    wedge: 'Destructive pattern',
    icon: Flame,
    script: `**Pattern**
This is the craving loop. It peaks in about 20 minutes \u2014 always has.

**Truth**
A cue fired. Your brain predicted relief. That prediction is chemistry, not fact.

**Prediction**
If you feed it, you feel relief for 12 minutes. Then smaller. Tomorrow the urge is louder. Every feeding makes the next one louder.

**Interrupt**
Step away from whatever triggered this. Move your body.

**Action**
Water. Cold air. Call someone who knows. Do not be alone with this.

**Follow-up**
I\u2019m checking on you in 20 minutes. That\u2019s the peak. You ride it out, the wave breaks.`,
  },
  {
    key: 'SPIRALING',
    title: 'I\u2019m spiraling',
    sub: 'One slip turning into a night.',
    wedge: 'Mid-action',
    icon: Wind,
    script: `**Pattern**
This is the spiral loop. One slip, then the sentence that writes the rest of the night.

**Truth**
You\u2019re telling yourself "I already blew it." That sentence is the machinery. It converts one data point into a license for five more.

**Prediction**
If you keep going: another two hours tonight. Tomorrow you skip the thing. Monday you start a grand new plan. By Thursday you\u2019re here again.

**Interrupt**
Stop. No more tonight. One slip. One.

**Action**
Water. Brush your teeth. Bed thirty minutes early. That\u2019s the entire plan.

**Follow-up**
Tomorrow isn\u2019t starting over. It\u2019s the next rep. We continue.`,
  },
  {
    key: 'ALREADY_SLIPPED',
    title: 'I already folded last night',
    sub: 'Woke up thinking: not again.',
    wedge: 'Retroactive',
    icon: HeartCrack,
    script: `You slipped.
Good \u2014 now we stop the damage.

**Truth**
The mistake isn\u2019t the problem. The spiral is. The story you\u2019re telling yourself \u2014 "this always happens" or "I need a new plan" \u2014 that\u2019s the actual thing we\u2019re interrupting.

**Prediction**
If you keep going, this becomes a full bad day. Skip today, tomorrow gets easier to skip. By Wednesday you\u2019re in a week.

**Recovery**
Normal breakfast. Water. Ten minutes of movement. No compensation, no punishment, no grand new plan.

**Next move**
Next meal = clean reset. Exact time on your calendar. Do it whether you feel like it or not.

**Tomorrow**
We\u2019re not restarting. We\u2019re continuing. The streak, the rule, the identity \u2014 all continue. The slip is a blip.`,
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
