'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

/**
 * /provider/cohort — sortable patient list (client component).
 *
 * Implemented client-side because:
 *   - Sorting + free-text search is fully interactive and we don't
 *     want a server round-trip per sort change.
 *   - The data shape is already exposed by /api/v1/provider/cohort,
 *     which is RBAC-gated. The browser fetch piggy-backs on Clerk's
 *     session cookie so we don't re-implement auth here.
 *
 * Gating: this page is inside /(provider) and the layout has already
 * verified the user is a provider. If a non-provider somehow lands
 * here, the API route will return 403 and we render an empty table
 * + an error notice.
 *
 * HIPAA caveat: the API returns first-name + last-initial only. We
 * never receive raw PHI in this client component.
 */

type CohortRow = {
  id: string
  displayName: string
  planType: string
  daysOnPlatform: number
  lastSlipAt: string | null
  slipsThisMonth: number
  currentStreak: number
  selfTrustScore: number
  executionScore: number
}

type CohortResponse = {
  patients: CohortRow[]
  summary: {
    totalPatients: number
    slipsThisWeek: number
    averageSelfTrust: number
  }
  hipaaCaveat: string
}

type SortKey =
  | 'displayName'
  | 'daysOnPlatform'
  | 'lastSlipAt'
  | 'slipsThisMonth'
  | 'selfTrustScore'
  | 'currentStreak'

export default function CohortPage() {
  const [data, setData] = useState<CohortResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('lastSlipAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/v1/provider/cohort', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({ error: 'Request failed' }))
          throw new Error(body?.error ?? `HTTP ${r.status}`)
        }
        return r.json() as Promise<CohortResponse>
      })
      .then((d) => {
        if (cancelled) return
        setData(d)
        setError(null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Unknown error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    const filtered = q
      ? data.patients.filter((p) => p.displayName.toLowerCase().includes(q))
      : data.patients

    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]

      if (av === null && bv === null) return 0
      if (av === null) return sortDir === 'asc' ? -1 : 1
      if (bv === null) return sortDir === 'asc' ? 1 : -1

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const as = String(av)
      const bs = String(bv)
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })

    return sorted
  }, [data, query, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'displayName' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Cohort
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-slate-900">
          Patients
        </h1>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          Click a row for the per-patient view. Sortable columns; search by
          name. All names are anonymized to first-name + last-initial.
        </p>
      </header>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        />
        {data ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {rows.length} / {data.patients.length} shown
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Failed to load cohort: {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <Th
                onClick={() => toggleSort('displayName')}
                active={sortKey === 'displayName'}
                dir={sortDir}
              >
                Name
              </Th>
              <Th
                onClick={() => toggleSort('daysOnPlatform')}
                active={sortKey === 'daysOnPlatform'}
                dir={sortDir}
              >
                Days
              </Th>
              <Th
                onClick={() => toggleSort('lastSlipAt')}
                active={sortKey === 'lastSlipAt'}
                dir={sortDir}
              >
                Last slip
              </Th>
              <Th
                onClick={() => toggleSort('slipsThisMonth')}
                active={sortKey === 'slipsThisMonth'}
                dir={sortDir}
              >
                Slips · month
              </Th>
              <Th
                onClick={() => toggleSort('currentStreak')}
                active={sortKey === 'currentStreak'}
                dir={sortDir}
              >
                Streak
              </Th>
              <Th
                onClick={() => toggleSort('selfTrustScore')}
                active={sortKey === 'selfTrustScore'}
                dir={sortDir}
              >
                Self-trust
              </Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  {data && data.patients.length === 0
                    ? 'No patients have invited you yet. Share your invite link to onboard your first.'
                    : 'No patients match that search.'}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <Td>
                    <Link
                      href={`/provider/${p.id}`}
                      className="text-slate-900 hover:underline"
                    >
                      {p.displayName}
                    </Link>
                  </Td>
                  <Td>{p.daysOnPlatform}</Td>
                  <Td>
                    {p.lastSlipAt
                      ? new Date(p.lastSlipAt).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td>{p.slipsThisMonth}</Td>
                  <Td>{p.currentStreak}</Td>
                  <Td>{p.selfTrustScore}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        {data?.hipaaCaveat ??
          'Aggregate clinical-grade data only. Raw biometric samples not exposed. Patient retains full export rights.'}
      </footer>
    </div>
  )
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  dir: 'asc' | 'desc'
}) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-mono text-[10px] font-normal uppercase tracking-[0.12em]"
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 ${
          active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <span>{children}</span>
        {active ? <span aria-hidden>{dir === 'asc' ? '↑' : '↓'}</span> : null}
      </button>
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>
}
