'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

/**
 * <PilotRequestForm /> — pilot lead-capture form for /teams (anchor #pilot).
 *
 * Sale-grade replacement for the previous mailto: CTAs. An HR / benefits
 * buyer can request a 30-day pilot with their company, name, work email,
 * team size, and what they want to solve. POSTs to /api/v1/teams/pilot-
 * inquiry, which emails the COYL teams inbox. On success we show an inline
 * confirmation rather than a redirect, so the buyer stays in context.
 *
 * Styling mirrors <NewsletterSignup /> (rounded-full inputs, orange→red
 * gradient submit, motion-fade confirmation) so the form reads as native
 * to the rest of the marketing site.
 *
 * NEDA-safe: employer surface. Copy is focus / follow-through only — no
 * weight or eating language.
 */

const TEAM_SIZES = ['1–49', '50–199', '200–999', '1,000+'] as const

const MAX_GOAL = 500

export function PilotRequestForm() {
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [teamSize, setTeamSize] = useState<(typeof TEAM_SIZES)[number] | ''>('')
  const [goal, setGoal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!company || !name || !email || !teamSize) return
    setSubmitting(true)
    setError(false)
    try {
      const res = await fetch('/api/v1/teams/pilot-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, name, email, teamSize, goal }),
      })
      if (!res.ok) {
        setError(true)
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-orange-200 bg-orange-50 p-6 md:p-8"
      >
        <p className="font-serif text-2xl font-normal italic text-orange-700">
          Request received.
        </p>
        <p className="mt-3 max-w-xl text-base leading-[1.65] text-gray-700">
          We&rsquo;ll reply within 1 business day with pilot terms and next
          steps. Want to brief your team first? The{' '}
          <a href="/teams/pilot" className="font-semibold text-orange-700 underline">
            one-page pilot brief
          </a>{' '}
          is built to forward internally.
        </p>
      </motion.div>
    )
  }

  const inputClass =
    'w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-orange-500/40 focus:outline-none'

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pilot-company" className="sr-only">
              Company
            </label>
            <input
              id="pilot-company"
              type="text"
              required
              maxLength={120}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="pilot-name" className="sr-only">
              Your name
            </label>
            <input
              id="pilot-name"
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="pilot-email" className="sr-only">
              Work email
            </label>
            <input
              id="pilot-email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="pilot-team-size" className="sr-only">
              Team size
            </label>
            <select
              id="pilot-team-size"
              required
              value={teamSize}
              onChange={(e) =>
                setTeamSize(e.target.value as (typeof TEAM_SIZES)[number])
              }
              className={`${inputClass} appearance-none ${teamSize ? 'text-gray-900' : 'text-gray-500'}`}
            >
              <option value="" disabled>
                Team size
              </option>
              {TEAM_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} people
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="pilot-goal" className="sr-only">
            What you want to solve
          </label>
          <textarea
            id="pilot-goal"
            rows={3}
            maxLength={MAX_GOAL}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What are you trying to solve? (procrastination, focus, follow-through…) — optional"
            className="w-full resize-none rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-orange-500/40 focus:outline-none"
          />
          <p className="mt-1 pl-5 text-[11px] text-gray-500">
            {goal.length}/{MAX_GOAL}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            Something went wrong. Email{' '}
            <a href="mailto:teams@coyl.ai" className="underline">
              teams@coyl.ai
            </a>{' '}
            and we&rsquo;ll sort it.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_-2px_rgba(255,102,0,0.4)] disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Request a pilot'}
          </button>
          <p className="text-xs text-gray-600">
            We reply within 1 business day. No weight or eating data ever —
            focus and follow-through only.
          </p>
        </div>
      </form>
    </div>
  )
}
