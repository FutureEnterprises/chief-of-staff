'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Flame, X, Share2, RotateCw, Image as ImageIcon } from 'lucide-react'
import { StructuredResponse } from '@/components/structured-response'

/**
 * Callout Mode panel.
 *
 * Floats as a modal over /today (or anywhere you mount it). When the user
 * taps the trigger, we stream COYL's sharpest read on their current pattern
 * from /api/v1/callout. Copy is screenshot-worthy by design — short, specific,
 * predictive, designed to make the user feel seen and want to share.
 *
 * The panel includes a "Share" affordance that uses the Web Share API when
 * available (mobile) and falls back to clipboard (desktop). The share text
 * includes a discovery line so screenshots drive signups.
 */

interface Props {
  trigger: React.ReactNode
  /** Optional — when provided, enables the "Share as image" action which
   *  points at the OG-image share route for this user. Without it, only
   *  text-share works. */
  userId?: string
}

export function CalloutPanel({ trigger, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const cancelRef = useRef<boolean>(false)

  // Close on Escape so keyboard users aren't trapped in the modal
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function fetchCallout() {
    cancelRef.current = false
    setText('')
    setErrorMsg(null)
    setStreaming(true)

    try {
      const res = await fetch('/api/v1/callout', { method: 'POST' })
      if (res.status === 429) {
        setErrorMsg('Hold on \u2014 that was a lot of callouts. Wait a sec and try again.')
        setStreaming(false)
        return
      }
      if (!res.ok) {
        setErrorMsg('Couldn\u2019t generate your read. Try again in a moment.')
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('no reader')
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (cancelRef.current) return
        acc += decoder.decode(value, { stream: true })
        setText(acc)
      }
    } catch {
      setErrorMsg('Couldn\u2019t reach COYL. Try again in a moment.')
    } finally {
      setStreaming(false)
    }
  }

  function openAndFire() {
    setOpen(true)
    // Analytics: record that the user opened Callout Mode. This is a
    // high-intent signal — someone asked to be called out. Fire-and-forget.
    fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'CALLOUT_VIEWED',
        metadata: { surface: 'callout-panel' },
      }),
    }).catch(() => { /* silent */ })
    // Kick off the request on next tick so the modal is mounted first
    setTimeout(() => fetchCallout(), 50)
  }

  function close() {
    cancelRef.current = true
    setOpen(false)
    // Clear after animation finishes so the text doesn't flash on re-open
    setTimeout(() => {
      setText('')
      setErrorMsg(null)
    }, 250)
  }

  async function share() {
    const shareText = `${stripMarkdown(text)}\n\n\u2014 COYL just read me. coyl.ai`

    // Log intent before the share sheet opens
    fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'SHARE_CLICKED',
        metadata: { moment: 'pattern', surface: 'callout-panel' },
      }),
    }).catch(() => { /* silent */ })

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ text: shareText, title: 'COYL just read me.' })
        return
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText)
      // Fire a lightweight toast via window event; consumers can wire it
      window.dispatchEvent(new CustomEvent('coyl:toast', { detail: { text: 'Copied to clipboard.' } }))
    } catch {
      // No recourse — show inline
      setErrorMsg('Clipboard blocked. Select and copy manually.')
    }
  }

  return (
    <>
      <button onClick={openAndFire} className="contents">
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
            onClick={close}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl overflow-hidden rounded-t-3xl border border-orange-500/30 bg-[#0d0d0d] p-6 shadow-[0_0_80px_rgba(255,102,0,0.25)] md:rounded-3xl"
            >
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_20px_rgba(255,102,0,0.4)]">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-orange-500">
                      Callout mode
                    </p>
                    <p className="text-[11px] text-gray-500">Brutally honest read</p>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stream loader */}
              {streaming && !text && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full bg-orange-500"
                    />
                  ))}
                  <span className="ml-1 text-xs text-gray-400">Reading you\u2026</span>
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {errorMsg}
                </div>
              )}

              {/* Response */}
              {text && (
                <div className="max-h-[60vh] overflow-y-auto pr-1">
                  <StructuredResponse text={text} accentColor="orange" />
                </div>
              )}

              {/* Actions */}
              {text && !streaming && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={share}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-transform hover:scale-[1.02]"
                  >
                    <Share2 className="h-4 w-4" />
                    Share the read
                  </button>
                  {/* "Share as image" \u2014 opens the pattern-type OG image in a
                      new tab so the user can save/screenshot a clean card.
                      Only renders when we have a userId to point the OG URL at. */}
                  {userId && (
                    <a
                      href={`/api/share/${userId}?type=pattern`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      As image
                    </a>
                  )}
                  <button
                    onClick={fetchCallout}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Again
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Strip **bold** markers for share text so it reads clean outside the app
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
