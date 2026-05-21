'use client'
/**
 * AESTHETIC UPGRADE — May 2026 (operator surface)
 * Refero references applied:
 *   - 554b801c-3b31-4086-a7e5-ae613cdd618b (Linear): two-pane layered
 *     surfaces, 6px card radius, compact element gap, hairline borders
 *     instead of heavy panels.
 *   - 6e9baa82-2f2f-4e77-8b0d-566325635dbe (Axiom): single orange CTA
 *     spotlight, 2px-ish rectangular interactive surfaces, monospace
 *     timer/data, charcoal feature cards (no glassy gloss).
 *   - 11d3e58a-87d7-4a9a-bbf5-720f4fd3ffc6 (Linear Changelog): mono
 *     timestamps for the countdown, ghost capsule feedback chips, refined
 *     medium-weight headlines.
 * Rescue-specific: crisis surface needs INSTANT readability — denser type,
 * fewer competing accents, monospace for the urgent countdown.
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { StructuredResponse } from '@/components/structured-response'
import { CalloutPanel } from '@/components/callout/callout-panel'
import { AutopilotCard } from '@/components/share/autopilot-card'
import { ShareActions } from '@/components/share/share-actions'
import type { ShareCardData } from '@/lib/rescue-share'
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
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null)
  const [shareCard, setShareCard] = useState<(ShareCardData & { shareUrl: string }) | null>(null)
  const [generatingCard, setGeneratingCard] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Deep-link entry handling. When the user taps a push notification or
  // clicks the /today danger-window banner, the URL carries context:
  //   ?from=danger_window&windowId=X
  //   ?from=push&trigger=BINGE_URGE
  //   ?from=demo&t=SPIRALING       (homepage rescue-demo deep link)
  // We surface "why you're here" so the user feels seen rather than
  // surveilled — the single most effective lever against the surveillance
  // perception risk for JITAI products.
  const searchParams = useSearchParams()
  const fromSource = searchParams.get('from')
  const windowId = searchParams.get('windowId')
  const triggerParam = searchParams.get('trigger') ?? searchParams.get('t')
  const cameFromDangerWindow = fromSource === 'danger_window'
  const cameFromPush = fromSource === 'push' || cameFromDangerWindow

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

  /**
   * Generate the Autopilot Interrupted card. Creates a RescueSession
   * row with shareCode + returns the card payload + the public share
   * URL at /i/[code]. Idempotent at the client — once we have a card
   * in state, the button becomes share-actions.
   */
  async function generateShareCard() {
    if (shareCard || generatingCard || !selectedTrigger) return
    setGeneratingCard(true)
    try {
      const res = await fetch('/api/v1/rescue/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: selectedTrigger.key }),
      })
      if (!res.ok) return
      const data = (await res.json()) as ShareCardData & { shareUrl: string }
      setShareCard(data)
    } catch {
      // silent — user can retry by tapping the button again
    } finally {
      setGeneratingCard(false)
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
        <div className="border-b border-white/[0.06] px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_16px_-2px_rgba(239,68,68,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-[13px] font-semibold tracking-[-0.01em]">Rescue</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">Tap what you&apos;re facing right now</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-2xl">
            {/* "Why this fired" — consent-architecture transparency.
                If the user got here from a push or the /today banner, show
                them WHY the interrupt fired before showing the triggers.
                This is what converts the surveillance perception into
                trust: the user can see the reasoning, not just the
                notification. */}
            {cameFromPush && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-md border-l-2 border border-l-orange-500/60 border-orange-500/20 bg-orange-500/[0.04] px-4 py-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-400">
                  Why this fired
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                  {cameFromDangerWindow
                    ? "You're inside one of your mapped danger windows. The pattern from past slips puts this hour in your top risk band."
                    : "A precision interrupt fired based on your danger window history."}
                </p>
                {windowId && (
                  <Link
                    href="/patterns"
                    className="mt-1.5 inline-block text-[11px] font-semibold text-orange-300 hover:text-orange-200"
                  >
                    See the full pattern &rarr;
                  </Link>
                )}
              </motion.div>
            )}

            <p className="mb-5 text-center text-[13px] leading-relaxed text-muted-foreground">
              You&apos;re not alone in the moment. Tap what&apos;s happening and COYL will interrupt the script.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TRIGGERS.map((t, i) => (
                <motion.button
                  key={t.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTrigger(t)}
                  className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-all hover:border-orange-500/40 hover:bg-orange-500/[0.04] hover:shadow-[0_0_18px_-6px_rgba(255,102,0,0.3)]"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[13px] font-semibold tracking-[-0.005em] text-foreground">{t.label}</span>
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
      {/* Header — operator pattern: thin border, mono metadata sublabel */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-3.5">
        <button
          onClick={reset}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xl">{selectedTrigger.emoji}</span>
        <div className="flex-1">
          <h1 className="text-[13px] font-semibold tracking-[-0.01em]">{selectedTrigger.label}</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">You&apos;re here. That&apos;s the first move.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {loading && !response && (
            <div className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 animate-pulse text-orange-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.10em] text-muted-foreground">Interrupting…</span>
            </div>
          )}

          {response && <StructuredResponse text={response} accentColor="red" />}

          {!loading && response && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startDelay}
                disabled={delayActive}
                className="rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_18px_-4px_rgba(255,102,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-shadow hover:shadow-[0_0_28px_-4px_rgba(255,102,0,0.6)] disabled:opacity-60 disabled:shadow-none"
              >
                {delayActive ? <span className="font-mono tabular-nums tracking-[0.02em] normal-case">{formatTime(delayRemaining)}</span> : 'Start 10-min delay'}
              </button>
              <button
                onClick={reset}
                className="rounded-md border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-white/[0.05]"
              >
                I got it from here
              </button>
            </div>
          )}

          {/* Consent-architecture feedback bar.
              Every push notification needs an in-app "was this helpful or
              creepy?" loop. The signal does two things: (1) the user feels
              agency over the surveillance, which converts the perception
              from creepy → useful; (2) the data trains the interrupt
              guard's rate cap and the danger-window-learner cron's risk
              weighting. Fire-and-forget POST to /api/v1/events. */}
          {!loading && response && cameFromPush && !feedback && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Was this fire helpful?
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setFeedback('helpful')
                    void fetch('/api/v1/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'INTERRUPT_FEEDBACK',
                        eventValue: 'helpful',
                        metadata: { source: fromSource, windowId, trigger: selectedTrigger?.key ?? null },
                      }),
                    }).catch(() => {})
                  }}
                  className="flex-1 rounded-sm border border-emerald-500/35 bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/[0.16]"
                >
                  Caught me
                </button>
                <button
                  onClick={() => {
                    setFeedback('not_helpful')
                    void fetch('/api/v1/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'INTERRUPT_FEEDBACK',
                        eventValue: 'not_helpful',
                        metadata: { source: fromSource, windowId, trigger: selectedTrigger?.key ?? null },
                      }),
                    }).catch(() => {})
                  }}
                  className="flex-1 rounded-sm border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                >
                  Wasn&rsquo;t the moment
                </button>
              </div>
            </motion.div>
          )}
          {feedback && (
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">
              {feedback === 'helpful' ? 'Logged. The model gets sharper.' : "Logged. We'll back off this window."}
            </p>
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
              className="rounded-md border-l-2 border border-l-orange-500/60 border-orange-500/15 bg-orange-500/[0.03] px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold tracking-[-0.005em] text-orange-300">
                    Want the deeper read?
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    COYL&rsquo;s pattern call on what&rsquo;s actually running you right now.
                  </p>
                </div>
                <CalloutPanel
                  userId={userId}
                  trigger={
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-orange-500/40 bg-orange-500/[0.08] px-2.5 py-1 text-[11px] font-bold text-orange-300 transition-all hover:border-orange-500/60 hover:bg-orange-500/[0.16]">
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
              className="rounded-md border border-orange-500/30 bg-orange-500/[0.04] px-4 py-4 text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Time passing is what breaks the urge.</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-[-0.01em] text-orange-500">
                {formatTime(delayRemaining)}
              </p>
            </motion.div>
          )}

          {/* Follow-up check after 10-min delay completes */}
          {showFollowUp && !followUpLogged && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center"
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500">10 minutes in</p>
              <p className="mb-4 text-lg font-semibold tracking-[-0.015em] text-foreground">Did you pull back?</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => logFollowUp(true)}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-warm px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[0_0_18px_-4px_rgba(255,102,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                >
                  ✅ Yes, I pulled back
                </button>
                <button
                  onClick={() => logFollowUp(false)}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/[0.04] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-red-400 transition-colors hover:bg-red-500/[0.10]"
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
              className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.04] px-5 py-4 text-center"
            >
              <p className="mb-1 text-xl">🔥</p>
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-emerald-300">You interrupted the script.</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">That&apos;s the rep. Do it again next time.</p>

              {/* Did it catch you? — §6 non-negotiable feedback */}
              <CatchFeedback trigger={selectedTrigger?.key} />

              {/* Autopilot Interrupted card — the shareable artifact promised
                  across three strategy docs. Generated on demand so we only
                  create a RescueSession row when the user actually wants to
                  share, not on every pull. */}
              {!shareCard ? (
                <button
                  onClick={generateShareCard}
                  disabled={generatingCard}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_16px_-4px_rgba(255,102,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.15)] disabled:opacity-60"
                >
                  {generatingCard ? 'Making the card…' : 'Share the moment'}
                </button>
              ) : (
                <div className="mt-5 text-left">
                  <AutopilotCard data={shareCard} />
                  <ShareActions
                    shareUrl={shareCard.shareUrl}
                    shareText={`Autopilot interrupted at ${shareCard.localTimeLabel}. ${shareCard.triggerLabel}. COYL caught me.`}
                  />
                </div>
              )}
            </motion.div>
          )}

          {followUpLogged === 'slipped' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-orange-500/30 bg-orange-500/[0.04] px-5 py-4 text-center"
            >
              <p className="mb-1.5 text-[15px] font-semibold tracking-[-0.01em] text-foreground">Okay. That happened.</p>
              <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">No Monday reset. No spiral. Next move matters more.</p>
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
                className="inline-block rounded-md bg-gradient-warm px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
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
        className="mt-4 font-mono text-[10px] uppercase tracking-[0.10em] text-emerald-400"
      >
        Got it. This is the metric that matters.
      </motion.p>
    )
  }

  return (
    <div className="mt-4">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Which one fits?</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {FEEDBACK_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => send(o.key)}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.04] px-3 py-0.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/[0.14]"
          >
            &ldquo;{o.label}&rdquo;
          </button>
        ))}
      </div>
    </div>
  )
}
