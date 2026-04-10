'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'

interface DemoTask {
  id: string
  title: string
  priority: 'critical' | 'high' | 'medium'
  resolved: boolean
  reminders: number
}

const PRIORITY_COLORS = {
  critical: { bar: 'bg-red-500', dot: 'bg-red-500', label: 'Critical', ring: 'ring-red-500/30' },
  high: { bar: 'bg-orange-500', dot: 'bg-orange-500', label: 'High', ring: 'ring-orange-500/30' },
  medium: { bar: 'bg-yellow-500', dot: 'bg-yellow-500', label: 'Medium', ring: 'ring-yellow-500/30' },
}

const ESCALATION = [
  { text: 'Reminder sent', color: 'text-gray-400 bg-white/5' },
  { text: '2nd nudge', color: 'text-orange-400 bg-orange-500/10' },
  { text: 'Getting loud...', color: 'text-orange-500 bg-orange-500/15 font-semibold' },
  { text: "COYL won't stop", color: 'text-red-400 bg-red-500/15 font-bold' },
]

const SEED_TASKS: DemoTask[] = [
  { id: '1', title: 'Send the proposal to Mike', priority: 'critical', resolved: false, reminders: 2 },
  { id: '2', title: 'Review Q2 budget spreadsheet', priority: 'high', resolved: false, reminders: 1 },
  { id: '3', title: 'Book flights for the conference', priority: 'medium', resolved: false, reminders: 0 },
]

export function InteractiveDemo() {
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, margin: '-100px' })
  const [tasks, setTasks] = useState<DemoTask[]>(SEED_TASKS)
  const [input, setInput] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<DemoTask['priority']>('high')
  const [justResolved, setJustResolved] = useState<string | null>(null)

  // Escalation timer — every 4 seconds, bump reminders on unresolved tasks
  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) =>
          !t.resolved && t.reminders < ESCALATION.length
            ? { ...t, reminders: t.reminders + 1 }
            : t
        )
      )
    }, 4000)
    return () => clearInterval(interval)
  }, [inView])

  function addTask() {
    if (!input.trim()) return
    const newTask: DemoTask = {
      id: Date.now().toString(),
      title: input.trim(),
      priority: selectedPriority,
      resolved: false,
      reminders: 0,
    }
    setTasks((prev) => [newTask, ...prev])
    setInput('')
  }

  function resolveTask(id: string) {
    setJustResolved(id)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, resolved: true } : t)))
    setTimeout(() => setJustResolved(null), 1500)
  }

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl px-6 py-32 md:px-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        {/* Left — Interactive briefing card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="lg:col-span-7"
        >
          <div
            className="overflow-hidden rounded-2xl border border-white/5 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-white">
                  Morning Briefing
                </span>
                <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                  INTERACTIVE
                </span>
              </div>
              <span className="font-mono text-xs text-gray-500">Try it</span>
            </div>

            {/* Task input */}
            <div className="border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {(['critical', 'high', 'medium'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className={`h-4 w-4 rounded-full transition-all ${PRIORITY_COLORS[p].dot} ${
                        selectedPriority === p
                          ? `ring-2 ${PRIORITY_COLORS[p].ring} scale-125`
                          : 'opacity-40 hover:opacity-70'
                      }`}
                      title={PRIORITY_COLORS[p].label}
                    />
                  ))}
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a task and watch COYL hound you..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
                <button
                  onClick={addTask}
                  disabled={!input.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white transition-all hover:bg-orange-600 disabled:opacity-30"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="max-h-[400px] overflow-y-auto px-6 py-4">
              <AnimatePresence initial={false}>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{
                      opacity: task.resolved ? 0.5 : 1,
                      height: 'auto',
                      y: 0,
                      x: task.reminders >= 3 && !task.resolved ? [0, -3, 3, -2, 2, 0] : 0,
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.23, 1, 0.32, 1],
                      x: { duration: 0.4, repeat: task.reminders >= 3 && !task.resolved ? Infinity : 0, repeatDelay: 3 },
                    }}
                    className="mb-3"
                  >
                    <div
                      className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                        task.resolved
                          ? 'border-green-500/20 bg-green-500/5'
                          : task.reminders >= 3
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-white/5 bg-black/30'
                      }`}
                    >
                      {/* Priority bar */}
                      <div className={`h-10 w-1 shrink-0 rounded-full ${
                        task.resolved ? 'bg-green-500' : PRIORITY_COLORS[task.priority].bar
                      }`} />

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${
                          task.resolved
                            ? 'text-gray-500 line-through'
                            : 'text-white'
                        }`}>
                          {task.title}
                        </p>

                        {/* Escalation badges */}
                        {!task.resolved && task.reminders > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Array.from({ length: Math.min(task.reminders, ESCALATION.length) }).map((_, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${ESCALATION[i]!.color}`}
                              >
                                {ESCALATION[i]!.text}
                              </motion.span>
                            ))}
                          </div>
                        )}

                        {task.resolved && justResolved === task.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-1 inline-block text-xs text-green-400"
                          >
                            Handled. Finally.
                          </motion.span>
                        )}
                      </div>

                      {/* Resolve button */}
                      {!task.resolved ? (
                        <button
                          onClick={() => resolveTask(task.id)}
                          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-gray-500 transition-all hover:border-green-500 hover:text-green-500"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Right — Explanation */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="flex flex-col justify-center lg:col-span-5"
        >
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
            <span className="h-px w-6 bg-orange-500" />
            Try It
          </h2>
          <h3 className="mb-6 text-3xl font-black tracking-tight text-white md:text-4xl">
            This is what<br />6am looks like.
          </h3>
          <p className="mb-10 text-lg font-light leading-relaxed text-gray-400">
            Add a task. Ignore it. Watch what happens.<br />
            COYL doesn&apos;t forget and it doesn&apos;t stop.
          </p>

          <div className="space-y-6">
            {[
              {
                num: '01',
                title: 'Add it',
                desc: 'Type anything. A task, a promise, something you said you\'d do.',
              },
              {
                num: '02',
                title: 'Ignore it',
                desc: 'Go ahead. We dare you. The reminders start stacking up.',
              },
              {
                num: '03',
                title: 'Get hounded',
                desc: 'It only gets louder. Mark it done or admit you\'re ducking it.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
                className="flex gap-4"
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-gray-600">{step.num}</span>
                <div>
                  <h4 className="mb-1 text-sm font-bold text-white">{step.title}</h4>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
