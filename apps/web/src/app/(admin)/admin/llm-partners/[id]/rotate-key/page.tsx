'use client'

import { useState, useTransition, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * /admin/llm-partners/[id]/rotate-key — confirmation + one-time
 * reveal of a newly-rotated API key.
 *
 * Why a dedicated page (vs. inline modal): rotating a partner's key
 * is a high-blast-radius action — the previous key becomes invalid
 * the instant rotation completes, and any partner deployment using
 * it starts 401'ing. Putting the confirmation behind a route makes
 * it impossible to "accidentally rotate while clicking around" and
 * forces an intentional URL transition.
 *
 * Flow:
 *   1. Operator lands on this page, sees the partner identity + a
 *      red-tinted warning explaining the consequence.
 *   2. Operator clicks "Rotate now". POST → /api/admin/.../rotate-key.
 *   3. Server mints a new keySecret, updates apiKeyHash +
 *      apiKeyLastFour, writes an EAPAuditEntry, returns the wire
 *      token (`coyl_pap_<id>_<secret>`) ONCE.
 *   4. Client renders a save-this-now reveal panel + copy-to-
 *      clipboard. On acknowledgement → redirect to detail page.
 */

type RotateResult = {
  apiKey: string
  apiKeyLastFour: string
}

type Partner = {
  id: string
  slug: string
  name: string
  publisher: string
  apiKeyLastFour: string
}

export default function RotateKeyPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [pending, start] = useTransition()
  const id = params?.id

  const [partner, setPartner] = useState<Partner | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RotateResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch identity so the operator knows what they're rotating
  // BEFORE they hit the button. We just need slug + name + last4
  // for the confirmation copy.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/llm-partners/${id}`)
        const data = (await res.json()) as { error?: string; partner?: Partner }
        if (cancelled) return
        if (!res.ok) {
          setLoadError(data.error ?? `Request failed (${res.status})`)
          return
        }
        setPartner(data.partner ?? null)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load partner')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const rotate = () => {
    if (!id) return
    setError(null)
    start(async () => {
      try {
        const res = await fetch(`/api/admin/llm-partners/${id}/rotate-key`, {
          method: 'POST',
        })
        const data = (await res.json()) as { error?: string } & RotateResult
        if (!res.ok) {
          setError(data.error ?? `Request failed (${res.status})`)
          return
        }
        setResult({ apiKey: data.apiKey, apiKeyLastFour: data.apiKeyLastFour })
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
      setError('Could not copy — copy the value manually')
    }
  }

  const acknowledge = () => {
    if (!id) return
    router.push(`/admin/llm-partners/${id}`)
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Rotate key</h1>
        <div className="border border-red-500/40 bg-red-500/[0.05] p-4 font-mono text-[11px] text-red-300">
          {loadError}
        </div>
        <Link
          href="/admin/llm-partners"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          ← back to partners
        </Link>
      </div>
    )
  }

  if (result && partner) {
    return (
      <div className="space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            LLM partners · {partner.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            New key issued
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
            previous key is now invalid · key …{result.apiKeyLastFour}
          </p>
        </div>

        <div className="border border-orange-500/40 bg-orange-500/[0.05] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            Save this now — you will NOT see this key again
          </p>
          <p className="mt-3 text-sm text-gray-300">
            Send to the foundation lab via a secure channel (1Password,
            signed envelope, encrypted email). The previous key has
            already been invalidated; any partner deployment using it
            is now 401'ing until they swap in this new value.
          </p>

          <div className="mt-5 break-all border border-white/[0.1] bg-black p-4 font-mono text-[12px] text-emerald-300">
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
              Got it — back to partner
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
            LLM partners · rotate key
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {partner ? partner.name : 'Loading…'}
          </h1>
          {partner && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
              {partner.slug} · current key …{partner.apiKeyLastFour}
            </p>
          )}
        </div>
        <Link
          href={id ? `/admin/llm-partners/${id}` : '/admin/llm-partners'}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          ← back
        </Link>
      </div>

      <div className="border border-red-500/40 bg-red-500/[0.05] p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-400">
          Heads up — this is destructive
        </p>
        <ul className="mt-3 space-y-1 text-sm text-gray-300">
          <li>
            • The previous key will be invalidated <em>immediately</em>{' '}
            on rotation.
          </li>
          <li>
            • Any of the partner's deployments using the old key will
            start returning <code className="font-mono">401</code>.
          </li>
          <li>
            • The new key is shown <em>once</em>. After you leave this
            page, it can't be retrieved — only rotated again.
          </li>
          <li>
            • An audit entry is written
            (<code className="font-mono">llm_partner_key_rotated</code>).
          </li>
        </ul>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/[0.05] p-3 font-mono text-[11px] text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
        <button
          type="button"
          onClick={rotate}
          disabled={pending || !partner}
          className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Rotating…' : 'Rotate now'}
        </button>
        <Link
          href={id ? `/admin/llm-partners/${id}` : '/admin/llm-partners'}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          cancel
        </Link>
      </div>
    </div>
  )
}
