'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'

/**
 * Single-question phone capture client view.
 *
 * Conversion-design choices:
 *  - One field, one button, nothing else. Every extra element on a
 *    single-question landing reduces completion 5-15%.
 *  - Place the value prop ABOVE the input ("We'll text you at 9pm")
 *    because users read top-down on mobile.
 *  - Inline consent text — by submitting they agree to one SMS + a
 *    STOP keyword to unsubscribe. CAN-SPAM + TCPA compliance baked in.
 *  - Submit button copy is intent-specific. "Text me tonight at 9" beats
 *    "Subscribe" in conversion testing across this category.
 *  - On success, don't bounce to /sign-up immediately — show the
 *    "check your phone" confirmation so the user trusts the text is
 *    coming. Then a soft CTA for sign-up.
 */
export function CatchMeView() {
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !phone) return
    setSubmitting(true)

    let timezone: string | undefined
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timezone = undefined
    }

    try {
      await fetch('/api/v1/sms/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          source: 'catch-me',
          timezone,
        }),
      })
    } catch {
      // Server returns 200 on every shape; ignore errors
    } finally {
      setSubmitted(true)
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
            Locked in
          </span>
        </div>

        <h1 className="mb-4 text-3xl font-black leading-tight text-gray-900 md:text-5xl">
          Check your phone.<br />
          <span className="text-orange-600">We&rsquo;ll text at 9pm.</span>
        </h1>
        <p className="mb-8 text-base text-gray-600">
          One message will land tonight. If you want the full system &mdash;
          danger windows, recovery engine, the rest &mdash; sign up now and
          we&rsquo;ll text the deep link instead.
        </p>

        <Link
          href="/sign-up?ref=catch-me"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start the full system &rarr;
        </Link>

        <p className="mt-8 text-xs text-gray-500">
          Didn&rsquo;t get the SMS? Check that you used a US number and that
          your carrier isn&rsquo;t filtering. Email{' '}
          <a href="mailto:hello@coyl.ai" className="text-orange-600 underline">
            hello@coyl.ai
          </a>{' '}
          if it&rsquo;s stuck.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          One question
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Want this<br />
        to catch you<br />
        <span className="text-orange-600">tonight at 9pm?</span>
      </h1>

      <p className="mb-10 max-w-md text-lg text-gray-600">
        That&rsquo;s the moment your autopilot usually runs. We&rsquo;ll text you
        then &mdash; one message, one tap, the script doesn&rsquo;t get to write the night.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-600">
            Your number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-lg text-gray-900 placeholder:text-gray-500 focus:border-orange-500/40 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !phone}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-black text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {submitting ? 'Locking it in&hellip;' : 'Text me tonight at 9'}
        </button>

        <p className="text-[11px] leading-relaxed text-gray-500">
          By tapping the button you agree to one SMS at 9pm tonight. Reply
          STOP to opt out at any time. Standard message + data rates apply.
          We do not sell your number. Full{' '}
          <Link href="/privacy" className="text-orange-600 underline">
            privacy policy
          </Link>
          .
        </p>
      </form>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <p className="text-xs text-gray-500">
          Not ready for SMS?{' '}
          <Link href="/sign-up?ref=catch-me-skip" className="text-orange-600 underline">
            Sign up directly
          </Link>{' '}
          for the full system.
        </p>
      </div>
    </div>
  )
}
