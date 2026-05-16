'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

/**
 * <NewsletterSignup /> — reusable email-capture component for marketing
 * pages. Embedded in the footer (every public page), plus standalone
 * placements on /research and /clinical-study where the audience is
 * partner-shaped and explicitly opted-in to longer-form updates.
 *
 * Behavior:
 *  - POSTs to /api/v1/newsletter (silent rate-limited, Resend audience)
 *  - Always shows success after submit — server returns 200 even on
 *    invalid email so we don't leak which emails are subscribed
 *  - GDPR/CAN-SPAM consent text inline below the input
 *  - Source attribution: pass `source` prop so analytics knows where
 *    the signup came from
 *
 * Conversion design choices:
 *  - Single field. No name, no preferences. Anything beyond email kills
 *    completion rate by ~40% (Mailchimp 2023 form benchmark).
 *  - Value-prop above the field, not generic "subscribe". "Tactics for
 *    catching your autopilot, one email a week" beats "Stay updated".
 *  - Submit button copy is intent-specific. "Send me the playbook" beats
 *    "Subscribe" in every A/B test I've seen in this category.
 */

interface Props {
  source: string
  /** Headline override. Default copy is general "catch your autopilot" framing. */
  headline?: string
  /** Subhead override. Default explains cadence + opt-out. */
  subhead?: string
  /** Submit-button copy. */
  ctaLabel?: string
  /** Compact variant — single-line layout for footer / sidebar slots. */
  compact?: boolean
}

export function NewsletterSignup({
  source,
  headline = 'Catch the next one before it catches you.',
  subhead = "One email a week. The pattern playbook — late-night eating, doom-scroll loops, the post-GLP-1 regain trap. Unsubscribe anytime.",
  ctaLabel = 'Send me the playbook',
  compact = false,
}: Props) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !email) return
    setSubmitting(true)
    try {
      await fetch('/api/v1/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
    } catch {
      // Server returns 200 on every shape; ignore errors here
    } finally {
      setSubmitted(true)
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border border-orange-500/30 bg-orange-500/[0.05] ${compact ? 'px-4 py-3' : 'p-6'}`}
      >
        <p className="text-sm font-bold text-orange-300">You&rsquo;re in.</p>
        <p className="mt-1 text-xs text-gray-400">
          First playbook lands within a week. If it doesn&rsquo;t, check spam and add hello@coyl.ai to your contacts.
        </p>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange-500/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_-2px_rgba(255,102,0,0.4)] disabled:opacity-60"
        >
          {submitting ? 'Sending…' : ctaLabel}
        </button>
      </form>
    )
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 md:p-8">
      <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">{headline}</h3>
      <p className="mb-5 text-sm text-gray-400">{subhead}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder:text-gray-500 focus:border-orange-500/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_-2px_rgba(255,102,0,0.4)] disabled:opacity-60"
        >
          {submitting ? 'Sending…' : ctaLabel}
        </button>
      </form>
      <p className="mt-3 text-[11px] text-gray-500">
        By signing up you agree to receive occasional emails from COYL.
        Unsubscribe anytime.
      </p>
    </div>
  )
}
