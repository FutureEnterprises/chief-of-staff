import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import {
  computeAllCohorts,
  readCohortTrend,
  type CohortKind,
  type CohortMetric,
} from '@/lib/retention'

export const metadata = { title: 'Retention — COYL Admin' }

/**
 * /admin/retention — cohort retention dashboard.
 *
 * Two surfaces:
 *   1. Live cohort grid — D1/D7/D14/D30 computed as-of right now from
 *      the users table. The exact same numbers /admin shows on its
 *      hero band, but with cohort window dates and "low signal" tags
 *      on cohorts under 20.
 *   2. 30-day trend per cohort — sparkline-ish bar list of the last
 *      30 daily snapshots so the founder can see whether retention
 *      is moving, not just where it is today.
 *
 * Per the founder action master list: do NOT push viral until D7 is
 * >= 15%. This page is the gate.
 */
export default function RetentionPage() {
  return (
    <div className="space-y-10">
      <header className="border-b border-white/[0.08] pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
          Admin · Retention
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cohort retention</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Cohorts under N=20 are noisy — the page marks them as low signal.
          Per the founder action master list: do not run viral acquisition
          until D7 is at or above 15%.
        </p>
      </header>

      <Suspense fallback={<div className="text-sm text-gray-500">Computing cohorts…</div>}>
        <LiveCohortGrid />
      </Suspense>

      <Suspense fallback={<div className="text-sm text-gray-500">Loading 30-day trend…</div>}>
        <TrendBlock />
      </Suspense>

      <footer className="border-t border-white/[0.08] pt-6 text-xs text-gray-500">
        Trend rows come from the daily retention-snapshot cron (04:00 UTC).
        See <code className="font-mono text-orange-400">/api/cron/retention-snapshot</code>{' '}
        and <code className="font-mono text-orange-400">lib/retention.ts</code>.{' '}
        <Link href="/admin" className="text-orange-500 hover:underline">
          ← admin home
        </Link>
      </footer>
    </div>
  )
}

async function LiveCohortGrid() {
  // connection() opts this segment into request-time evaluation so the
  // `new Date()` reads below satisfy Next 16 cacheComponents' "no
  // current-time outside cached/dynamic boundary" contract.
  await connection()
  const asOf = new Date()
  const cohorts = await computeAllCohorts(asOf)
  return (
    <section>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-gray-500">
        Live · as of {asOf.toISOString().slice(0, 19).replace('T', ' ')} UTC
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cohorts.map((c) => (
          <CohortCard key={c.cohortKind} metric={c} />
        ))}
      </div>
    </section>
  )
}

function CohortCard({ metric }: { metric: CohortMetric }) {
  const value = metric.retentionPct
  const color = colorForRetention(metric.cohortKind, value)
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-500">
          {metric.cohortKind}
        </span>
        {metric.lowSignal && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.12em] text-amber-400">
            Low signal
          </span>
        )}
      </div>
      <p className={`mt-3 text-3xl font-black tabular-nums ${color}`}>
        {value === null ? '—' : `${value}%`}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {metric.retainedCount} / {metric.cohortSize} returned
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
        Cohort: {fmtDate(metric.cohortStartAt)} → {fmtDate(metric.cohortEndAt)}
      </p>
    </div>
  )
}

async function TrendBlock() {
  await connection()
  const [d1, d7, d14, d30] = await Promise.all([
    readCohortTrend('D1', 30),
    readCohortTrend('D7', 30),
    readCohortTrend('D14', 30),
    readCohortTrend('D30', 30),
  ])
  return (
    <section>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-gray-500">
        30-day trend · per cohort
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendList kind="D1" rows={d1} />
        <TrendList kind="D7" rows={d7} />
        <TrendList kind="D14" rows={d14} />
        <TrendList kind="D30" rows={d30} />
      </div>
    </section>
  )
}

function TrendList({
  kind,
  rows,
}: {
  kind: CohortKind
  rows: Awaited<ReturnType<typeof readCohortTrend>>
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-orange-500">
          {kind}
        </p>
        <p className="mt-3 text-sm text-gray-400">
          No snapshots recorded yet — the daily cron writes the first row at
          04:00 UTC.
        </p>
      </div>
    )
  }
  const max = Math.max(...rows.map((r) => r.retentionPct), 1)
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-orange-500">
        {kind}
      </p>
      <div className="mt-4 flex h-32 items-end gap-[2px]">
        {rows.map((r) => {
          const h = Math.max(2, Math.round((r.retentionPct / max) * 100))
          return (
            <div
              key={r.date.toISOString()}
              className="flex-1 rounded-t-sm bg-orange-500/40 hover:bg-orange-500"
              style={{ height: `${h}%` }}
              title={`${fmtDate(r.date)} · ${r.retentionPct}% (${r.retainedCount}/${r.cohortSize})`}
            />
          )
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
        {rows.length} day{rows.length === 1 ? '' : 's'} · latest{' '}
        {rows[rows.length - 1]?.retentionPct ?? 0}%
      </p>
    </div>
  )
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Color thresholds per cohort kind. D1 we expect higher (40%+), D30 lower.
function colorForRetention(kind: CohortKind, value: number | null): string {
  if (value === null) return 'text-gray-500'
  const thresholds: Record<CohortKind, { warn: number; good: number }> = {
    D1: { warn: 40, good: 60 },
    D7: { warn: 15, good: 30 },
    D14: { warn: 10, good: 20 },
    D30: { warn: 8, good: 15 },
  }
  const t = thresholds[kind]
  if (value >= t.good) return 'text-emerald-400'
  if (value >= t.warn) return 'text-amber-400'
  return 'text-red-400'
}
