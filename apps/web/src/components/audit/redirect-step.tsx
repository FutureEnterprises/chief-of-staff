'use client'

/**
 * RedirectStep — audit collection screen for the user's three
 * pre-approved alternatives.
 *
 * This is the "Plan B in writing" step of the Layer 3 flow:
 *   "When the autopilot fires, what would you rather do instead?"
 *
 * Three labeled inputs (#1 / #2 / #3) seeded with archetype-specific
 * defaults so the user does not stare at a blank page. They can edit,
 * replace, or swap categories before saving. On submit we POST each
 * row to /api/v1/redirect-choices and then call onComplete() so the
 * parent audit flow can advance.
 *
 * Voice + palette match audit-view.tsx: cream surface, hairline rules,
 * Instrument Serif (font-serif) for signature lines, Geist mono for
 * the small uppercase kicker, COYL orange for accents.
 *
 * IMPORTANT: This file deliberately does not import or modify
 * audit-view.tsx. The mainline integration commit (separate from this
 * commit) will wire it into the audit flow. We expose a focused
 * client-component API to keep this safe to land in parallel with
 * other agents working on the audit surface.
 */

import { useMemo, useState } from 'react'
import { defaultRedirectsFor } from '@/lib/intervention-copy'
import type { ArchetypeFamily } from '@/lib/audit-archetype'

type Category = 'connection' | 'creative' | 'physical' | 'rest' | 'other'
type Slot = { text: string; category: Category }

const CATEGORY_LABELS: Record<Category, string> = {
  connection: 'connection',
  creative: 'creative',
  physical: 'physical',
  rest: 'rest',
  other: 'other',
}

const CATEGORY_OPTIONS: Category[] = ['connection', 'creative', 'physical', 'rest', 'other']

export type RedirectStepProps = {
  /** Family slug (e.g. 'the-9pm-negotiator') used to pre-populate defaults. */
  archetype?: ArchetypeFamily | string | null
  /** Called after all three POST requests resolve successfully. */
  onComplete?: (createdIds: string[]) => void
  /** Optional skip handler. When provided, a subtle skip link renders. */
  onSkip?: () => void
  /** Override default seed (useful in tests / previews). */
  initialSlots?: Slot[]
}

export function RedirectStep({
  archetype,
  onComplete,
  onSkip,
  initialSlots,
}: RedirectStepProps) {
  const seeded = useMemo<Slot[]>(() => {
    if (initialSlots && initialSlots.length === 3) return initialSlots
    const defaults = defaultRedirectsFor(archetype)
    return [0, 1, 2].map((i) => ({
      text: defaults[i]?.text ?? '',
      category: (defaults[i]?.category ?? 'physical') as Category,
    }))
  }, [archetype, initialSlots])

  const [slots, setSlots] = useState<Slot[]>(seeded)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateSlot(idx: number, patch: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    )
  }

  async function handleSave() {
    setError(null)
    // Validation: all three need content. We could allow fewer but the
    // product rule is "three, in writing, before any interrupt fires".
    const trimmed = slots.map((s) => ({ ...s, text: s.text.trim() }))
    if (trimmed.some((s) => s.text.length < 3)) {
      setError('Each redirect needs at least a few words. Be concrete.')
      return
    }

    setSubmitting(true)
    const created: string[] = []
    try {
      for (let i = 0; i < trimmed.length; i++) {
        const slot = trimmed[i]
        if (!slot) continue
        const res = await fetch('/api/v1/redirect-choices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: slot.text,
            category: slot.category,
            rank: i + 1,
          }),
        })
        // 400 limit_reached means the user already had 3 saved before
        // this step ran (rare — usually a retry). We treat it as a
        // soft success and continue.
        if (!res.ok && res.status !== 400) {
          throw new Error(`save_failed_${res.status}`)
        }
        const payload = (await res.json().catch(() => ({}))) as {
          choice?: { id?: string }
        }
        if (payload.choice?.id) created.push(payload.choice.id)
      }
      onComplete?.(created)
    } catch (err) {
      console.warn('[redirect-step] save failed', err)
      setError('Something glitched on save. Try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      aria-label="Choose your three redirects"
      className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-14"
    >
      {/* Kicker */}
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px w-10 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Step · redirects in writing
        </span>
      </div>

      {/* Headline + lede */}
      <h1 className="font-serif text-3xl leading-tight text-gray-900 sm:text-4xl">
        When the autopilot fires, what would you rather do instead?
      </h1>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-gray-700">
        Three options. Pre-approved by you, in this calm moment, before
        the loop has any say. The interrupt will surface these — not
        generic advice — when the danger window opens.
      </p>
      <p className="mt-3 font-serif text-base italic text-orange-700">
        Your future self will not be in a position to brainstorm.
      </p>

      {/* Slots */}
      <ol className="mt-8 space-y-5">
        {slots.map((slot, idx) => {
          const rank = idx + 1
          const inputId = `redirect-text-${rank}`
          const catId = `redirect-category-${rank}`
          return (
            <li
              key={rank}
              className="rounded-2xl border border-gray-200 bg-[#f5f5f0] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={inputId}
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600"
                >
                  Redirect · {rank}
                </label>
                <CategorySelect
                  id={catId}
                  value={slot.category}
                  onChange={(category) => updateSlot(idx, { category })}
                  disabled={submitting}
                />
              </div>
              <input
                id={inputId}
                type="text"
                value={slot.text}
                onChange={(e) => updateSlot(idx, { text: e.target.value })}
                placeholder="Concrete. Short. Doable in two minutes."
                disabled={submitting}
                maxLength={160}
                className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-serif text-base italic text-gray-900 placeholder:not-italic placeholder:text-gray-400 placeholder:font-sans focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </li>
          )
        })}
      </ol>

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,102,0,0.5)] transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save my three'}
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="text-sm text-gray-500 underline-offset-4 hover:text-gray-700 hover:underline disabled:opacity-60"
          >
            Skip for now
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * CategorySelect — small native <select> styled to match the audit
 * surface. Native on purpose: it's a 5-option list, accessibility for
 * free, no popover library needed.
 */
function CategorySelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string
  value: Category
  onChange: (v: Category) => void
  disabled?: boolean
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Category)}
      disabled={disabled}
      className="rounded-full border border-gray-200 bg-white px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-60"
    >
      {CATEGORY_OPTIONS.map((c) => (
        <option key={c} value={c}>
          {CATEGORY_LABELS[c]}
        </option>
      ))}
    </select>
  )
}

export default RedirectStep
