'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * /provider/invite — provider-facing list of patient invite codes.
 *
 * Two affordances on one screen:
 *   1. "Create invite" — mints an 8-char code via POST /api/v1/provider/invite
 *   2. List of every invite this provider has minted, with status
 *      (pending / claimed / revoked) and a copy-to-clipboard for the
 *      shareable URL /i/provider/<code>.
 *
 * Client component because both actions are interactive. Auth + RBAC
 * happens on the API route side; this page is rendered inside
 * /(provider)/layout.tsx which has already gated on planType.
 */

type Invite = {
  id: string
  code: string
  label: string
  status: string
  claimedBy: string | null
  createdAt: string
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/provider/invite', { cache: 'no-store' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { invites: Invite[] }
      setInvites(data.invites)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createInvite() {
    setCreating(true)
    try {
      const res = await fetch('/api/v1/provider/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bootstrapClinic: false,
          label: labelDraft.trim() || 'Patient invite',
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setLabelDraft('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mint invite')
    } finally {
      setCreating(false)
    }
  }

  const inviteUrlBase = useMemo(() => {
    // Canonical host first so provider invite links don't fragment across
    // apex/preview/localhost origins. NEXT_PUBLIC_APP_URL is inlined at build.
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== 'undefined' ? window.location.origin : 'https://www.coyl.ai')
    return `${origin}/i/provider/`
  }, [])

  async function copy(code: string) {
    const url = `${inviteUrlBase}${code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1800)
    } catch {
      // navigator.clipboard can fail in older Safari iOS contexts and on
      // non-HTTPS dev hosts — fall back to a visible selection so the
      // provider can still copy manually. This keeps the dashboard
      // resilient in low-trust browser contexts.
      // eslint-disable-next-line no-alert
      alert(`Copy this URL manually:\n${url}`)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Invite codes
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-slate-900">
          Onboard a patient.
        </h1>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          Mint an 8-character invite code, share the link by email or SMS.
          The patient lands on a consent page and either accepts or declines.
          Codes don’t expire in v0.1 — revoke from this list when you need to.
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          New invite
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            placeholder="Label (optional) — e.g. ‘Mrs. K, Wegovy start’"
            className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none md:max-w-md"
            disabled={creating}
          />
          <button
            type="button"
            onClick={createInvite}
            disabled={creating}
            className="rounded-sm bg-slate-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {creating ? 'Minting…' : 'Mint invite →'}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-mono font-normal">Code</th>
              <th className="px-4 py-3 font-mono font-normal">Label</th>
              <th className="px-4 py-3 font-mono font-normal">Status</th>
              <th className="px-4 py-3 font-mono font-normal">Created</th>
              <th className="px-4 py-3 font-mono font-normal" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Loading…
                </td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No invites yet. Mint your first above.
                </td>
              </tr>
            ) : (
              invites.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 align-middle">
                    <Link
                      href={`/provider/invite/${inv.code}`}
                      className="font-mono text-sm text-slate-900 hover:underline"
                    >
                      {inv.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-700">
                    {inv.label}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-500">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <button
                      type="button"
                      onClick={() => copy(inv.code)}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-900"
                    >
                      {copiedCode === inv.code ? 'Copied ✓' : 'Copy link'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        Patient-facing link is{' '}
        <span className="font-mono">/i/provider/&lt;code&gt;</span>. v0.1
        invites don’t expire; v0.2 ships time-bound codes + revocation
        audit trail.
      </footer>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'claimed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'revoked'
      ? 'border-slate-300 bg-slate-100 text-slate-500'
      : 'border-amber-200 bg-amber-50 text-amber-800'
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${styles}`}
    >
      {status}
    </span>
  )
}
