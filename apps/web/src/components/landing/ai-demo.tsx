'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'

type DemoMode = 'mentor' | 'beast'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const DEMO_FLOWS: Record<DemoMode, ChatMsg[]> = {
  mentor: [
    { id: 'm1', role: 'user', text: "I didn't finish the proposal today." },
    { id: 'm2', role: 'assistant', text: "That's okay — progress isn't always linear. What got in the way? Let's figure out what you can realistically tackle tomorrow morning, and I'll make sure you start with that. You've got this. 💛" },
    { id: 'm3', role: 'user', text: "I kept getting distracted by emails." },
    { id: 'm4', role: 'assistant', text: "Classic trap. Here's what I'd suggest: block 90 minutes tomorrow AM with notifications off. I'll remind you at 8am sharp. The proposal is your #1 — everything else can wait. Sound good?" },
  ],
  beast: [
    { id: 'b1', role: 'user', text: "I didn't finish the proposal today." },
    { id: 'b2', role: 'assistant', text: "Third day in a row. The proposal was due yesterday. You said you'd handle it — twice. What's the actual blocker or are you just avoiding it? 🔥" },
    { id: 'b3', role: 'user', text: "I kept getting distracted by emails." },
    { id: 'b4', role: 'assistant', text: "Emails aren't distractions. They're your excuse. Tomorrow 8am, proposal first. Phone on airplane mode. I'll be checking at 10am. If it's not done, we're having a different conversation." },
  ],
}

export function AiDemo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [mode, setMode] = useState<DemoMode>('beast')
  const [visibleCount, setVisibleCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = DEMO_FLOWS[mode]

  // Auto-play messages with delay
  useEffect(() => {
    if (!inView) return
    setVisibleCount(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    messages.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), (i + 1) * 1200))
    })
    return () => timers.forEach(clearTimeout)
  }, [inView, mode, messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [visibleCount])

  function replay() {
    setVisibleCount(0)
    setTimeout(() => {
      messages.forEach((_, i) => {
        setTimeout(() => setVisibleCount(i + 1), (i + 1) * 1200)
      })
    }, 300)
  }

  return (
    <section ref={ref} className="relative mx-auto max-w-7xl px-6 py-32 md:px-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        {/* Left — explanation */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col justify-center lg:col-span-5"
        >
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
            <span className="h-px w-6 bg-orange-500" />
            Charges
          </h2>
          <h3 className="mb-6 text-3xl font-black tracking-tight text-white md:text-4xl">
            Every interaction<br />is a Charge.
          </h3>
          <p className="mb-6 text-lg font-light leading-relaxed text-gray-400">
            Each time the AI fires — planning, reviewing, breaking down tasks, calling you out — that&apos;s one Charge. Free gets 20/mo. Pro gets 500.
          </p>
          <p className="mb-8 text-sm text-gray-500">
            Pick your vibe. <strong className="text-white">Mentor Mode</strong> is supportive.{' '}
            <strong className="text-red-400">Beast Mode</strong> is savage. Same AI, different energy.
          </p>

          <div className="space-y-4">
            {[
              { icon: '💛', title: 'Mentor Mode', desc: 'Warm coach. Celebrates wins. Frames challenges as growth.' },
              { icon: '🔥', title: 'Beast Mode', desc: 'Drill sergeant. Calls out avoidance. No sugarcoating.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                className="flex gap-3"
              >
                <span className="mt-0.5 text-lg">{item.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — interactive chat demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="lg:col-span-7"
        >
          <div
            className="overflow-hidden rounded-2xl border border-white/5 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Header with mode toggle */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${mode === 'beast' ? 'bg-red-500' : 'bg-orange-500'}`} />
                <span className="text-sm font-bold uppercase tracking-wider text-white">
                  {mode === 'beast' ? 'Beast Mode' : 'Mentor Mode'}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
                <button
                  onClick={() => setMode('mentor')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    mode === 'mentor'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  💛 Mentor
                </button>
                <button
                  onClick={() => setMode('beast')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    mode === 'beast'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  🔥 Beast
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="max-h-[350px] overflow-y-auto px-6 py-5">
              <AnimatePresence initial={false}>
                {messages.slice(0, visibleCount).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className={`mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        mode === 'beast' ? 'bg-red-500' : 'bg-gradient-to-br from-orange-500 to-red-500'
                      }`}>
                        <span className="text-[10px]">{mode === 'beast' ? '🔥' : '💛'}</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-white/10 text-white'
                          : mode === 'beast'
                            ? 'border border-red-500/20 bg-red-500/5 text-gray-200'
                            : 'border border-orange-500/20 bg-orange-500/5 text-gray-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {visibleCount > 0 && visibleCount < messages.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 px-8"
                >
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, delay, repeat: Infinity }}
                      className={`h-1.5 w-1.5 rounded-full ${mode === 'beast' ? 'bg-red-500' : 'bg-orange-500'}`}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Fake input */}
            <div className="border-t border-white/5 px-6 py-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex-1 text-sm text-gray-500">
                  {mode === 'beast' ? 'What excuse are you making today?' : 'What can I help you with?'}
                </span>
                <button
                  onClick={replay}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all ${
                    mode === 'beast'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  Replay
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
