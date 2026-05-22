'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * /admin/llm-partners/new — register a new foundation lab and mint
 * its first API key.
 *
 * Two-phase UX:
 *   1. Form (slug / name / publisher / pricingTier / rateLimitPerHour /
 *      bundledScopes). On submit, POST /api/admin/llm-partners.
 *   2. Reveal — the API key is shown ONCE on the success screen with
 *      a copy-to-clipboard control and a "save this now" warning.
 *      Only after the operator confirms ("Got it") do we redirect to
 *      the partner detail page. The key cannot be re-shown — only
 *      rotated.
 *
 * The (admin)/layout email gate plus the API-route assertAdmin call
 * both backstop this. The client form trusts nothing; the API does
 * all validation.
 *
 * NOTE: route group (admin)/layout.tsx forbids client components at
 * the top level because of the SignOutButton context. That layout
 * gates server-side, so this client page renders fine inside it.
 */

const PRICING_TIERS = ['free', 'usage', 'enterprise', 'strategic'] as const
type PricingTier = (typeof PRICING_TIERS)[number]

// Common scopes a partner might bundle by default. Operator can edit
// these post-creation via the partner-detail PATCH endpoint.
const COMMON_SCOPES = [
  'edge:watch:haptic',
  'edge:phone:push',
  'edge:phone:voice_tts',
  'edge:laptop:dim_screen',
  'sensor:hrv_proxy',
  'sensor:motion',
  'sensor:location_geofence',
  'proactive_food',
  'proactive_focus',
  'proactive_sleep',
]

type CreateResult = {
  partner: { id: string; slug: string; name: string }
  apiKey: string
}

export default function NewLLMPartnerPage() {
  const router = useRouter()
  const [pending, start] = useTransition()

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [publisher, setPublisher] = useState('')
  const [pricingTier, setPricingTier] = useState<PricingTier>('usage')
  const [rateLimitPerHour, setRateLimitPerHour] = useState(1000)
  const [bundledScopes, setBundledScopes] = useState<string[]>([])

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleScope = (scope: string) => {
    setBundledScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const res = await fetch('/api/admin/llm-partners', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: slug.trim(),
            name: name.trim(),
            publisher: publisher.trim(),
            pricingTier,
            rateLimitPerHour,
            bundledScopes,
          }),
        })
        const data = (await res.json()) as { error?: string } & CreateResult
        if (!res.ok) {
          setError(data.error ?? `Request failed (${res.status})`)
          return
        }
        setResult({ partner: data.partner, apiKey: data.apiKey })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    })
  }

  const copyKey = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Could not copy to clipboard — copy the value manually')
    }
  }

  const acknowledge = () => {
    if (!result) return
    router.push(`/admin/llm-partners/${result.partner.id}`)
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            LLM partners · new
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Partner created
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
            {result.partner.slug}
          </p>
        </div>

        <div className="border border-orange-500/40 bg-orange-500/[0.05] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            Save this now — you will NOT see this key again
          </p>
          <p className="mt-3 text-sm text-gray-300">
            COYL only stores a bcrypt hash. If this token is lost, the
            operator will have to rotate it (which invalidates the old
            one). Share it with the foundation lab via a secure channel
            (1Password, signed envelope) — not Slack, not email.
          </p>

          <div className="mt-5 break-all rounded-none border border-white/[0.1] bg-black p-4 font-mono text-[12px] text-emerald-300">
            {result.apiKey}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={copyKey}
              className="border border-white/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-200 hover:border-orange-500 hover:text-orange-500"
            >
              {copied ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
            <button
              type="button"
              onClick={acknowledge}
              className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400"
            >
              Got it — continue to partner
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            LLM partners
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            New partner
          </h1>
        </div>
        <Link
          href="/admin/llm-partners"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          ← back
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Field label="Slug" hint="Lowercase + hyphens, e.g. anthropic-claude-sonnet-3.7">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9][a-z0-9.\-]+"
            className="w-full border border-white/[0.1] bg-black px-3 py-2 font-mono text-[12px] text-gray-100 focus:border-orange-500 focus:outline-none"
            placeholder="anthropic-claude-sonnet-3.7"
          />
        </Field>

        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-white/[0.1] bg-black px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
            placeholder="Anthropic Claude Sonnet 3.7"
          />
        </Field>

        <Field label="Publisher">
          <input
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            required
            className="w-full border border-white/[0.1] bg-black px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
            placeholder="Anthropic"
          />
        </Field>

        <Field label="Pricing tier">
          <select
            value={pricingTier}
            onChange={(e) => setPricingTier(e.target.value as PricingTier)}
            className="w-full border border-white/[0.1] bg-black px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-gray-100 focus:border-orange-500 focus:outline-none"
          >
            {PRICING_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rate limit (requests / hour)">
          <input
            type="number"
            min={1}
            max={1_000_000}
            value={rateLimitPerHour}
            onChange={(e) => setRateLimitPerHour(Number(e.target.value))}
            required
            className="w-full border border-white/[0.1] bg-black px-3 py-2 font-mono text-[12px] text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </Field>

        <Field
          label="Bundled scopes"
          hint="Default scope packages the partner is eligible to request. Toggle on/off; editable post-creation."
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMMON_SCOPES.map((scope) => {
              const checked = bundledScopes.includes(scope)
              return (
                <label
                  key={scope}
                  className={`flex cursor-pointer items-center gap-2 border px-3 py-2 font-mono text-[11px] tracking-[0.04em] transition ${
                    checked
                      ? 'border-orange-500/60 bg-orange-500/[0.08] text-orange-300'
                      : 'border-white/[0.08] text-gray-400 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleScope(scope)}
                    className="h-3 w-3 accent-orange-500"
                  />
                  {scope}
                </label>
              )
            })}
          </div>
        </Field>

        {error && (
          <div className="border border-red-500/40 bg-red-500/[0.05] p-3 font-mono text-[11px] text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
          <button
            type="submit"
            disabled={pending}
            className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create partner + mint key'}
          </button>
          <Link
            href="/admin/llm-partners"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
          >
            cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-mono text-[10px] tracking-[0.04em] text-gray-600">
          {hint}
        </p>
      )}
    </div>
  )
}
