'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { MarketingPlatform } from '@repo/database'
import { generateDraft } from '../actions'

/**
 * Archetypes — surfaced as a select for the founder. Includes the six
 * autopilot families plus the three "category" archetypes from
 * apps/web/src/lib/marketing/templates.ts. Kept as a flat array so it
 * renders into a tight native select on the dark surface.
 */
const ARCHETYPES = [
  { value: '', label: '(no archetype focus)' },
  { value: 'the-9pm-negotiator', label: 'The 9 PM Negotiator' },
  { value: 'the-monday-resetter', label: 'The Monday Resetter' },
  { value: 'the-deserver', label: 'The Deserver' },
  { value: 'the-one-more-tabber', label: 'The One-More-Tabber' },
  { value: 'the-spiral-extender', label: 'The Spiral Extender' },
  { value: 'the-capitulator', label: 'The Capitulator' },
  { value: 'category-launch', label: 'Category launch' },
  { value: 'why-now', label: 'Why now' },
  { value: 'product-update', label: 'Product update' },
] as const

const PLATFORMS: { value: MarketingPlatform; label: string }[] = [
  { value: 'REDDIT', label: 'Reddit' },
  { value: 'TWITTER_THREAD', label: 'Twitter · thread' },
  { value: 'TWITTER_SINGLE', label: 'Twitter · single' },
  { value: 'THREADS', label: 'Threads' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'INDIEHACKERS', label: 'IndieHackers' },
  { value: 'PRODUCTHUNT', label: 'ProductHunt' },
  { value: 'HACKERNEWS', label: 'HackerNews' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
]

export function NewDraftForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<MarketingPlatform>('REDDIT')
  const [archetype, setArchetype] = useState<string>('')
  const [topic, setTopic] = useState('')
  const [model, setModel] = useState<'sonnet' | 'haiku'>('sonnet')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!topic.trim()) {
      setError('Topic is required.')
      return
    }
    start(async () => {
      try {
        const created = await generateDraft({
          platform,
          archetype: archetype || null,
          topic,
          model,
        })
        router.push(`/admin/marketing/${created.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed.')
      }
    })
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      animate={{ opacity: pending ? 0.6 : 1 }}
      className="space-y-6 border border-white/[0.08] bg-[#101010] p-6"
    >
      <Field label="Platform">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as MarketingPlatform)}
          disabled={pending}
          className="w-full border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Archetype focus (optional)">
        <select
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
          disabled={pending}
          className="w-full border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
        >
          {ARCHETYPES.map((a) => (
            <option key={a.value || 'none'} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Topic">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={pending}
          rows={3}
          placeholder='e.g. "the 9 PM kitchen — post-GLP-1 weight regain anxiety"'
          className="w-full resize-y border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600 focus:border-orange-500 focus:outline-none"
        />
      </Field>

      <Field label="Model">
        <div className="flex gap-3">
          {(['sonnet', 'haiku'] as const).map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-2 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] ${
                model === m
                  ? 'border-orange-500 text-orange-500'
                  : 'border-white/15 text-gray-300 hover:border-white/30'
              }`}
            >
              <input
                type="radio"
                name="model"
                value={m}
                checked={model === m}
                onChange={() => setModel(m)}
                disabled={pending}
                className="sr-only"
              />
              {m}
            </label>
          ))}
        </div>
      </Field>

      {error && (
        <p className="border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-[11px] text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400 disabled:opacity-50"
        >
          {pending ? 'Generating…' : 'Generate draft'}
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
          uses voice-locked recipe · LLM call may take 5-30s
        </p>
      </div>
    </motion.form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">
        {label}
      </span>
      {children}
    </label>
  )
}
