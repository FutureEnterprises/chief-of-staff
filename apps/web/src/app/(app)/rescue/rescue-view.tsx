'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { StructuredResponse } from '@/components/structured-response'
import { CalloutPanel } from '@/components/callout/callout-panel'
import { Flame, ArrowLeft, AlertCircle } from 'lucide-react'

type Trigger = {
  key: string
  label: string
  emoji: string
  color: string
}

const TRIGGERS: Trigger[] = [
  { key: 'BINGE_URGE', label: 'I want to binge', emoji: '🍔', color: 'red' },
  { key: 'DELIVERY_URGE', label: "I'm ordering food", emoji: '📦', color: 'red' },
  { key: 'NICOTINE_URGE', label: 'I want nicotine', emoji: '💨', color: 'orange' },
  { key: 'ALCOHOL_URGE', label: 'I want to drink', emoji: '🍷', color: 'orange' },
  { key: 'SKIP_WORKOUT', label: 'I want to skip today', emoji: '😴', color: 'yellow' },
  { key: 'SKIP_WEIGHIN', label: "I don't want to weigh in", emoji: '⚖️', color: 'yellow' },
  { key: 'DOOMSCROLL', label: 'I keep scrolling', emoji: '📱', color: 'purple' },
  { key: 'IMPULSE_SPEND', label: "I'm about to buy something", emoji: '💳', color: 'purple' },
  { key: 'ALREADY_SLIPPED', label: 'I already slipped', emoji: '💥', color: 'red' },
  { key: 'SPIRALING', label: "I'm spiraling", emoji: '🌀', color: 'red' },
]

interface RescueViewProps {
  userId: string
}

export function RescueView({ userId }: RescueViewProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [delayActive, setDelayActive] = useState(false)
  const [delayRemaining, setDelayRemaining] = useState(0)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpLogged, setFollowUpLogged] = useState<'pulled' | 'slipped' | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function handleTrigger(trigger: Trigger) {
    setSelectedTrigger(trigger)
    setResponse('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: trigger.key }),
      })

      if (res.status === 402) {
        setPaywallOpen(true)
        setLoading(false)
        setSelectedTrigger(null)
        return
      }

      // Stream the response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('no reader')

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // AI SDK streams data in chunks — append text deltas
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const obj = JSON.parse(line.slice(6))
              if (obj.type === 'text-delta' && typeof obj.textDelta === 'string') {
                accumulated += obj.textDelta
                setResponse(accumulated)
              }
            } catch {
              // Non-JSON line, skip
            }
          }
        }
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function startDelay() {
    setDelayActive(true)
    setDelayRemaining(600) // 10 minutes
    setShowFollowUp(false)
    setFollowUpLogged(null)

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setDelayRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setDelayActive(false)
          setShowFollowUp(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function logFollowUp(pulled: boolean) {
    setFollowUpLogged(pulled ? 'pulled' : 'slipped')
    try {
      await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: pulled ? 'RESCUE_RESOLVED' : 'SLIP_LOGGED',
          metadata: { source: 'rescue_followup', trigger: selectedTrigger?.key },
        }),
      })
    } catch {
      // silent — client state already reflects the choice
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function reset() {
    setSelectedTrigger(null)
    setResponse('')
    setDelayActive(false)
    setDelayRemaining(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  if (!selectedTrigger) {
    return (
      <PageTransition className="flex h-full flex-col">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Rescue</h1>
              <p className="text-xs text-muted-foreground">Tap what you&apos;re facing right now</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-6 text-center text-sm text-muted-foreground">
              You&apos;re not alone in the moment. Tap what&apos;s happening and COYL will interrupt the script.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TRIGGERS.map((t, i) => (
                <motion.button
                  key={t.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTrigger(t)}
                  className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-left transition-all hover:border-orange-500/30 hover:shadow-glow-orange"
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{t.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <PaywallDialog
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          trigger="rescue"
          defaultTier="core"
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <button
          onClick={reset}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-2xl">{selectedTrigger.emoji}</span>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">{selectedTrigger.label}</h1>
          <p className="text-xs text-muted-foreground">You&apos;re here. That&apos;s the first move.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {loading && !response && (
            <div className="glass flex items-center gap-3 rounded-2xl p-4">
              <AlertCircle className="h-5 w-5 shrink-0 animate-pulse text-orange-500" />
              <span className="text-sm text-muted-foreground">Interrupting…</span>
            </div>
          )}

          {response && <StructuredResponse text={response} accentColor="red" />}

          {!loading && response && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startDelay}
                disabled={delayActive}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] disabled:opacity-60"
              >
                {delayActive ? formatTime(delayRemaining) : 'Start 10-min delay'}
              </button>
              <button
                onClick={reset}
                className="glass rounded-xl px-4 py-3 text-sm font-medium"
              >
                I got it from here
              </button>
            </div>
          )}

          {/* Callout trigger — appears after the rescue response streams.
              Someone mid-rescue is already self-aware; a deeper pattern read
              here lands differently than the same button on /today. Framed
              as an optional deeper cut, not a required step. */}
          {!loading && response && !delayActive && !showFollowUp && !followUpLogged && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-orange-300">
                    Want the deeper read?
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    COYL\u2019s pattern call on what\u2019s actually running you right now.
                  </p>
                </div>
                <CalloutPanel
                  userId={userId}
                  trigger={
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 text-xs font-bold text-orange-300 transition-all hover:border-orange-500/60 hover:bg-orange-500/20">
                      <Flame className="h-3 w-3" />
                      Call it out
                    </span>
                  }
                />
              </div>
            </motion.div>
          )}

          {delayActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-center"
            >
              <p className="text-xs text-muted-foreground">Time passing is what breaks the urge.</p>
              <p className="mt-2 font-mono text-2xl font-bold text-orange-500">
                {formatTime(delayRemaining)}
              </p>
            </motion.div>
          )}

          {/* Follow-up check after 10-min delay completes */}
          {showFollowUp && !followUpLogged && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 text-center"
            >
              <p className="mb-1 label-xs text-orange-500">10 minutes in</p>
              <p className="mb-5 text-lg font-bold text-foreground">Did you pull back?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => logFollowUp(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-warm px-4 py-3 text-sm font-bold text-white shadow-glow-orange"
                >
                  ✅ Yes, I pulled back
                </button>
                <button
                  onClick={() => logFollowUp(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10"
                >
                  💥 I slipped
                </button>
              </div>
            </motion.div>
          )}

          {followUpLogged === 'pulled' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center"
            >
              <p className="mb-1 text-2xl">🔥</p>
              <p className="text-base font-bold text-emerald-300">You interrupted the script.</p>
              <p className="mt-1 text-xs text-muted-foreground">That&apos;s the rep. Do it again next time.</p>

              {/* Did it catch you? — §6 non-negotiable feedback */}
              <CatchFeedback trigger={selectedTrigger?.key} />
            </motion.div>
          )}

          {followUpLogged === 'slipped' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 text-center"
            >
              <p className="mb-2 text-base font-bold text-foreground">Okay. That happened.</p>
              <p className="mb-4 text-sm text-muted-foreground">No Monday reset. No spiral. Next move matters more.</p>
              <a
                href="/api/v1/slip"
                onClick={(e) => {
                  e.preventDefault()
                  fetch('/api/v1/slip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trigger: selectedTrigger?.key, notes: 'Slipped after rescue delay' }),
                  }).finally(() => reset())
                }}
                className="inline-block rounded-xl bg-gradient-warm px-5 py-2.5 text-sm font-bold text-white"
              >
                Get recovery plan →
              </a>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const FEEDBACK_OPTIONS = [
  { key: 'caught', label: 'It caught me' },
  { key: 'excuse', label: 'It knew my excuse' },
  { key: 'stopped', label: 'It stopped me' },
]

function CatchFeedback({ trigger }: { trigger: string | undefined }) {
  const [submitted, setSubmitted] = useState<string | null>(null)

  async function send(key: string) {
    setSubmitted(key)
    try {
      await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'FEATURE_USED',
          metadata: { kind: 'rescue_feedback', phrase: key, trigger },
        }),
      })
    } catch {
      // silent
    }
  }

  if (submitted) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-xs text-emerald-400"
      >
        Got it. This is the metric that matters.
      </motion.p>
    )
  }

  return (
    <div className="mt-5">
      <p className="mb-2 label-xs text-muted-foreground">Which one fits?</p>
      <div className="flex flex-wrap justify-center gap-2">
        {FEEDBACK_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => send(o.key)}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15"
          >
            &ldquo;{o.label}&rdquo;
          </button>
        ))}
      </div>
    </div>
  )
}
