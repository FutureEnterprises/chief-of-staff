'use client'
/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (rescue, dark)
 * Refero references applied:
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): luxury dark editorial
 *     restraint; cream typography cuts crisply through the warm canvas.
 *   - c00d3961-a100-4c22-91fe-75f6e488e579 (Pipe): one molten orange CTA,
 *     no rainbow accents — the rescue moment is severe, not festive.
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): serif headline
 *     as monumental gesture; the trigger label reads like a chapter title.
 *   - c18d1c89-bb32-4a3c-bdc8-42d3355b8905 (DNA Capital): whispered
 *     authority for the consent-architecture preamble.
 * Rescue is a crisis surface — typography that calms rather than shouts.
 * Serif on the focal "what's happening" line, mono for the urgent
 * countdown (precision matters in the moment), warm body sans for guidance.
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
import {
  Flame, ArrowLeft, AlertCircle,
  // Trigger icons — replace the prior cross-OS-inconsistent emojis so
  // the surface reads premium and stays on-brand. Each rescue moment
  // gets a thin-stroke Lucide glyph in its semantic color.
  Cookie, Package, Wind, Wine, BedDouble, Scale,
  Smartphone, CreditCard, Zap, Loader,
  type LucideIcon,
} from 'lucide-react'

type Trigger = {
  key: string
  label: string
  Icon: LucideIcon
  color: string
}

const TRIGGERS: Trigger[] = [
  { key: 'BINGE_URGE', label: 'I want to binge', Icon: Cookie, color: 'red' },
  { key: 'DELIVERY_URGE', label: "I'm ordering food", Icon: Package, color: 'red' },
  { key: 'NICOTINE_URGE', label: 'I want nicotine', Icon: Wind, color: 'orange' },
  { key: 'ALCOHOL_URGE', label: 'I want to drink', Icon: Wine, color: 'orange' },
  { key: 'SKIP_WORKOUT', label: 'I want to skip today', Icon: BedDouble, color: 'yellow' },
  { key: 'SKIP_WEIGHIN', label: "I don't want to weigh in", Icon: Scale, color: 'yellow' },
  { key: 'DOOMSCROLL', label: 'I keep scrolling', Icon: Smartphone, color: 'purple' },
  { key: 'IMPULSE_SPEND', label: "I'm about to buy something", Icon: CreditCard, color: 'purple' },
  { key: 'ALREADY_SLIPPED', label: 'I already slipped', Icon: Zap, color: 'red' },
  { key: 'SPIRALING', label: "I'm spiraling", Icon: Loader, color: 'red' },
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
      <PageTransition className="flex h-full flex-col bg-[#0e0d0b]">
        {/* Editorial header — eyebrow + serif title. No icon medallions.
            The page itself is the medallion. */}
        <header className="border-b border-white/[0.05] px-6 pb-8 pt-12 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-orange-500/70" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Rescue
              </p>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
              What&rsquo;s happening?
            </h1>
            <p className="mt-3 max-w-xl font-sans text-[14px] leading-relaxed text-[#a39d92]">
              Tap what you&rsquo;re facing right now. COYL interrupts the script.
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-12 sm:px-10">
          <div className="mx-auto max-w-3xl">
            {/* "Why this fired" — consent-architecture transparency.
                If the user got here from a push or the /today banner, show
                them WHY the interrupt fired before showing the triggers. */}
            {cameFromPush && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-10 border-l-[1.5px] border-orange-500/50 pl-5 py-1"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                  Why this fired
                </p>
                <p className="mt-2 font-serif text-xl font-normal leading-snug tracking-[-0.01em] text-[#f5f3ee]">
                  {cameFromDangerWindow
                    ? "You're inside one of your mapped danger windows. The pattern from past slips puts this hour in your top risk band."
                    : "A precision interrupt fired based on your danger window history."}
                </p>
                {windowId && (
                  <Link
                    href="/patterns"
                    className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300 transition-colors hover:text-orange-200"
                  >
                    See the full pattern &rarr;
                  </Link>
                )}
              </motion.div>
            )}

            <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
              Pick the moment
            </p>

            <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] sm:grid-cols-2">
              {TRIGGERS.map((t, i) => (
                <motion.button
                  key={t.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.035 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleTrigger(t)}
                  className="group flex items-center gap-4 bg-[#0e0d0b] px-5 py-5 text-left transition-colors hover:bg-[#13110d]"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.06] transition-colors group-hover:bg-orange-500/10 group-hover:ring-orange-500/30"
                  >
                    <t.Icon className="h-5 w-5 text-[#a39d92] transition-colors group-hover:text-orange-400" strokeWidth={1.5} />
                  </span>
                  <span className="font-serif text-[19px] font-normal leading-tight tracking-[-0.005em] text-[#f5f3ee] transition-colors group-hover:text-orange-300">
                    {t.label}.
                  </span>
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
    <PageTransition className="flex h-full flex-col bg-[#0e0d0b]">
      {/* Editorial chapter header — back glyph, serif trigger label as
          monumental composition, mono "you're here" subtitle. */}
      <header className="border-b border-white/[0.05] px-6 pb-8 pt-10 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={reset}
            className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a] transition-colors hover:text-[#f5f3ee]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500/70" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
              Rescue &middot; in session
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-4">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/30"
            >
              <selectedTrigger.Icon className="h-6 w-6 text-orange-400" strokeWidth={1.5} />
            </span>
            <h1 className="font-serif text-3xl font-normal leading-[1.06] tracking-[-0.015em] text-[#f5f3ee] sm:text-4xl">
              {selectedTrigger.label}.
            </h1>
          </div>
          <p className="mt-3 font-sans text-[13px] leading-relaxed text-[#a39d92]">
            You&rsquo;re here. That&rsquo;s the first move.
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-5">
          {loading && !response && (
            <div className="flex items-center gap-3 border-l-[1.5px] border-orange-500/40 bg-white/[0.02] px-5 py-4">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 animate-pulse text-orange-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a39d92]">
                Interrupting&hellip;
              </span>
            </div>
          )}

          {response && <StructuredResponse text={response} accentColor="red" />}

          {!loading && response && (
            <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] sm:grid-cols-2">
              <button
                onClick={startDelay}
                disabled={delayActive}
                className="group bg-[#13110d] px-5 py-5 text-left transition-colors hover:bg-[#181510] disabled:opacity-60"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                  {delayActive ? 'Counting down' : 'Buy time'}
                </p>
                <p className="mt-2 font-serif text-xl font-normal leading-tight tracking-[-0.005em] text-[#f5f3ee]">
                  {delayActive ? (
                    <span className="font-mono tabular-nums">{formatTime(delayRemaining)}</span>
                  ) : (
                    'Start the 10-minute delay.'
                  )}
                </p>
              </button>
              <button
                onClick={reset}
                className="group bg-[#0e0d0b] px-5 py-5 text-left transition-colors hover:bg-[#13110d]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
                  Already through
                </p>
                <p className="mt-2 font-serif text-xl font-normal leading-tight tracking-[-0.005em] text-[#f5f3ee]">
                  I got it from here.
                </p>
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
              className="border-t border-white/[0.05] pt-5"
            >
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
                Was this the moment?
              </p>
              <div className="flex flex-wrap gap-2">
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
                  className="rounded-full border border-emerald-500/35 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300 transition-colors hover:bg-emerald-500/[0.08]"
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
                  className="rounded-full border border-white/[0.10] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#a39d92] transition-colors hover:bg-white/[0.04] hover:text-[#f5f3ee]"
                >
                  Wasn&rsquo;t the moment
                </button>
              </div>
            </motion.div>
          )}
          {feedback && (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
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
              className="border-l-[1.5px] border-orange-500/40 pl-5 py-1"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                    Deeper read
                  </p>
                  <p className="mt-1 font-serif text-lg font-normal italic leading-snug tracking-[-0.005em] text-[#f5f3ee]">
                    What&rsquo;s actually running you right now.
                  </p>
                </div>
                <CalloutPanel
                  userId={userId}
                  trigger={
                    <span className="inline-flex shrink-0 items-center gap-2 border-b border-orange-500/40 pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300 transition-colors hover:border-orange-500 hover:text-orange-200">
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
              className="border-y border-orange-500/20 py-10 text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
                Time passing is what breaks the urge
              </p>
              <p className="mt-4 font-mono text-6xl font-light tabular-nums tracking-[-0.02em] text-orange-400">
                {formatTime(delayRemaining)}
              </p>
            </motion.div>
          )}

          {/* Follow-up check after 10-min delay completes */}
          {showFollowUp && !followUpLogged && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-y border-white/[0.05] py-8 text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Ten minutes in
              </p>
              <p className="mt-3 font-serif text-3xl font-normal tracking-[-0.015em] text-[#f5f3ee]">
                Did you pull back?
              </p>
              <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] sm:grid-cols-2">
                <button
                  onClick={() => logFollowUp(true)}
                  className="group bg-[#13110d] px-5 py-5 text-left transition-colors hover:bg-[#181510]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                    Yes
                  </p>
                  <p className="mt-2 font-serif text-xl font-normal leading-tight text-[#f5f3ee]">
                    I pulled back.
                  </p>
                </button>
                <button
                  onClick={() => logFollowUp(false)}
                  className="group bg-[#0e0d0b] px-5 py-5 text-left transition-colors hover:bg-[#13110d]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-400/80">
                    No
                  </p>
                  <p className="mt-2 font-serif text-xl font-normal leading-tight text-[#f5f3ee]">
                    I slipped.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {followUpLogged === 'pulled' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-y border-emerald-500/20 py-10 text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400/90">
                Autopilot interrupted
              </p>
              <p className="mt-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-[#f5f3ee] sm:text-4xl">
                You interrupted the script.
              </p>
              <p className="mt-3 font-sans text-[13px] text-[#a39d92]">
                That&rsquo;s the rep. Do it again next time.
              </p>

              {/* Did it catch you? — §6 non-negotiable feedback */}
              <CatchFeedback trigger={selectedTrigger?.key} />

              {!shareCard ? (
                <button
                  onClick={generateShareCard}
                  disabled={generatingCard}
                  className="mt-6 inline-flex items-center gap-2 border-b border-orange-500/40 pb-0.5 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-300 transition-colors hover:border-orange-500 hover:text-orange-200 disabled:opacity-60"
                >
                  {generatingCard ? 'Making the card…' : 'Share the moment →'}
                </button>
              ) : (
                <div className="mt-6 text-left">
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
              className="border-y border-orange-500/20 py-10 text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
                Okay
              </p>
              <p className="mt-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-[#f5f3ee] sm:text-4xl">
                That happened. We continue now.
              </p>
              <p className="mt-3 font-sans text-[13px] leading-relaxed text-[#a39d92]">
                No Monday reset. No spiral. Next move matters more.
              </p>
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
                className="mt-6 inline-flex items-center gap-2 border-b border-orange-500/40 pb-0.5 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-300 transition-colors hover:border-orange-500 hover:text-orange-200"
              >
                Get recovery plan &rarr;
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
        className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400"
      >
        Got it. This is the metric that matters.
      </motion.p>
    )
  }

  return (
    <div className="mt-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
        Which one fits?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {FEEDBACK_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => send(o.key)}
            className="rounded-full border border-emerald-500/30 px-4 py-1.5 font-serif text-sm italic text-emerald-300 transition-colors hover:bg-emerald-500/[0.08]"
          >
            &ldquo;{o.label}&rdquo;
          </button>
        ))}
      </div>
    </div>
  )
}
