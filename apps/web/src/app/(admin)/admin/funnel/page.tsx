import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { prisma } from '@repo/database'
import { FAMILY_IDS, getFamily, type ArchetypeFamily } from '@/lib/audit-archetype'

export const metadata = { title: 'Funnel — COYL Admin' }

/**
 * /admin/funnel — step-by-step funnel analytics for the /audit flow.
 *
 * Sister page to /admin/audit-funnel (which is the headline 4-card
 * distinct-session view). This page is the OPERATOR view: a step
 * table, per-step sparklines, an archetype-family filter, and a raw
 * events tail for debugging.
 *
 * Read-only. All queries are server-side; the only client surface is
 * the family-filter <select> which round-trips via search params so
 * the page stays a server component end-to-end.
 *
 * Data shape:
 *   - Step counts: COUNT(*) per `kind` for 7d + 30d windows
 *   - Conversion: count / count of previous step in the canonical
 *     order (started → completed → email_captured → signup_started)
 *   - Sparkline: 30 daily buckets per step, rendered as inline SVG
 *     path so we add no chart library to the bundle
 *   - Raw tail: last 50 rows, newest first
 *
 * Archetype filter applies to all queries via the `family` URL param.
 * When set, only events with matching `archetypeFamily` are counted.
 */

/* ───────────────────────────────────────────────────────────────────
 * Canonical step order. The audit beacon (/api/v1/audit/event) writes
 * exactly these four kinds today; if the schema grows, append here in
 * funnel order and the table + sparklines + conversion math follow.
 * Kept in sync with the zod enum in the beacon route handler.
 * ─────────────────────────────────────────────────────────────────── */
const STEP_ORDER = ['started', 'completed', 'email_captured', 'signup_started'] as const
type StepKind = (typeof STEP_ORDER)[number]

const STEP_LABEL: Record<StepKind, string> = {
  started: 'Started',
  completed: 'Completed',
  email_captured: 'Email captured',
  signup_started: 'Signup started',
}

type SearchParams = Promise<{ family?: string }>

export default async function FunnelPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const familyFilter = parseFamilyParam(params.family)

  return (
    <div className="space-y-10">
      <header className="border-b border-white/[0.08] pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
          Admin · Funnel
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          /audit funnel · step analytics
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Step-by-step counts for the last 7 and 30 days, with conversion
          from previous step, daily sparklines, and a raw events tail.
          See <code className="font-mono text-orange-400">/admin/audit-funnel</code>{' '}
          for the headline distinct-session view.
        </p>
        <FamilyFilter active={familyFilter} />
      </header>

      <Suspense fallback={<div className="text-sm text-gray-500">Loading step table…</div>}>
        <StepTable family={familyFilter} />
      </Suspense>

      <Suspense fallback={<div className="text-sm text-gray-500">Loading sparklines…</div>}>
        <SparklineGrid family={familyFilter} />
      </Suspense>

      <Suspense fallback={<div className="text-sm text-gray-500">Loading raw events…</div>}>
        <RawEvents family={familyFilter} />
      </Suspense>

      <footer className="border-t border-white/[0.08] pt-6 text-xs text-gray-500">
        Source: <code className="font-mono text-orange-400">audit_funnel_events</code>.{' '}
        Beacon: <code className="font-mono text-orange-400">/api/v1/audit/event</code>.{' '}
        <Link href="/admin/marketing" className="text-orange-500 hover:underline">
          ← admin home
        </Link>
      </footer>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * STEP TABLE — step name | 7d count | 30d count | conv % from prev
 *
 * Conversion is computed against the previous step in STEP_ORDER, not
 * against the first step, so each row answers "of the people who got
 * to the previous step, how many made it here?" — the operator
 * question that matters for finding the leakiest junction.
 * ─────────────────────────────────────────────────────────────────── */
async function StepTable({ family }: { family: ArchetypeFamily | null }) {
  await connection()
  const now = Date.now()
  const cutoff7 = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const cutoff30 = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const where7 = family
    ? { createdAt: { gte: cutoff7 }, archetypeFamily: family }
    : { createdAt: { gte: cutoff7 } }
  const where30 = family
    ? { createdAt: { gte: cutoff30 }, archetypeFamily: family }
    : { createdAt: { gte: cutoff30 } }

  const [rows7, rows30] = await Promise.all([
    prisma.auditFunnelEvent.groupBy({
      by: ['kind'],
      where: where7,
      _count: { _all: true },
    }),
    prisma.auditFunnelEvent.groupBy({
      by: ['kind'],
      where: where30,
      _count: { _all: true },
    }),
  ])

  const count7: Record<string, number> = Object.fromEntries(
    rows7.map((r) => [r.kind, r._count._all]),
  )
  const count30: Record<string, number> = Object.fromEntries(
    rows30.map((r) => [r.kind, r._count._all]),
  )

  return (
    <section>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-gray-500">
        Step table · events fired
      </h2>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
              <th className="px-5 py-3">Step</th>
              <th className="px-5 py-3 text-right">7d</th>
              <th className="px-5 py-3 text-right">30d</th>
              <th className="px-5 py-3 text-right">Conv from prev (30d)</th>
            </tr>
          </thead>
          <tbody>
            {STEP_ORDER.map((kind, idx) => {
              const prev = idx > 0 ? STEP_ORDER[idx - 1] : null
              const c7 = count7[kind] ?? 0
              const c30 = count30[kind] ?? 0
              const prevCount30 = prev ? (count30[prev] ?? 0) : 0
              const conv = prev ? pct(c30, prevCount30) : null
              return (
                <tr key={kind} className="border-b border-white/5 last:border-b-0">
                  <td className="px-5 py-3 font-semibold text-gray-100">
                    {STEP_LABEL[kind]}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-gray-200">
                    {c7}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-gray-200">
                    {c30}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-orange-400">
                    {conv === null ? '—' : `${conv}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * SPARKLINES — daily counts last 30 days, one per step.
 *
 * Inline SVG, no chart library. 30 daily buckets aggregated in a
 * single raw query (one row per kind × day_index) so we avoid 4 × 30
 * round trips. day_index is 0 today, 29 oldest.
 * ─────────────────────────────────────────────────────────────────── */
async function SparklineGrid({ family }: { family: ArchetypeFamily | null }) {
  await connection()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Bucket by day in the DB and pivot in app code. The family clause
  // is parameterised either-way to keep the same plan cache entry.
  const rows = family
    ? await prisma.$queryRawUnsafe<Array<{ kind: string; day: string; n: number }>>(
        `
          SELECT
            "kind",
            to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS n
          FROM "audit_funnel_events"
          WHERE "createdAt" >= $1 AND "archetypeFamily" = $2
          GROUP BY 1, 2
        `,
        since,
        family,
      )
    : await prisma.$queryRawUnsafe<Array<{ kind: string; day: string; n: number }>>(
        `
          SELECT
            "kind",
            to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS n
          FROM "audit_funnel_events"
          WHERE "createdAt" >= $1
          GROUP BY 1, 2
        `,
        since,
      )

  // Build day -> count map per kind, indexed by day-offset (0 = today).
  const days30: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    days30.push(d.toISOString().slice(0, 10))
  }
  const byKind: Record<string, number[]> = {}
  for (const k of STEP_ORDER) byKind[k] = new Array(30).fill(0)
  for (const r of rows) {
    const idx = days30.indexOf(r.day)
    if (idx === -1) continue
    if (!byKind[r.kind]) byKind[r.kind] = new Array(30).fill(0)
    const arr = byKind[r.kind]
    if (arr) arr[idx] = r.n
  }

  return (
    <section>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-gray-500">
        Last 30 days · daily counts per step
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STEP_ORDER.map((kind) => {
          const series = byKind[kind] ?? new Array(30).fill(0)
          const total = series.reduce((a, b) => a + b, 0)
          return (
            <div key={kind} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">
                {STEP_LABEL[kind]}
              </p>
              <Sparkline series={series} />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 tabular-nums">
                {total} events · 30d
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Sparkline — pure-SVG line chart of a numeric series. Width is fixed
 * at the viewBox; CSS scales it responsive. We render a filled area
 * (lighter) under a stroke (brighter) so even one-or-two-point series
 * read as a shape rather than a flatline.
 */
function Sparkline({ series }: { series: number[] }) {
  const W = 200
  const H = 40
  const max = Math.max(...series, 1)
  const stepX = series.length > 1 ? W / (series.length - 1) : 0
  const points = series.map((v, i) => {
    const x = i * stepX
    const y = H - (v / max) * (H - 4) - 2
    return [x, y] as const
  })
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
  const fillPath = `${path} L ${W} ${H} L 0 ${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-10 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={fillPath} fill="rgba(249, 115, 22, 0.15)" />
      <path d={path} fill="none" stroke="rgb(249, 115, 22)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * RAW EVENTS — last 50 rows, native <details> to keep the tail
 * collapsed by default (server-rendered, no client JS).
 * ─────────────────────────────────────────────────────────────────── */
async function RawEvents({ family }: { family: ArchetypeFamily | null }) {
  await connection()
  const where = family ? { archetypeFamily: family } : {}
  const events = await prisma.auditFunnelEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      kind: true,
      sessionId: true,
      archetypeFamily: true,
      archetypeSlug: true,
      wedge: true,
      window: true,
      script: true,
      source: true,
      createdAt: true,
    },
  })

  return (
    <section>
      <details className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <summary className="cursor-pointer px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-gray-400 hover:text-gray-200">
          Raw events · last {events.length}
        </summary>
        {events.length === 0 ? (
          <p className="px-5 pb-4 text-sm text-gray-500">
            No events in this slice yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-y border-white/10 bg-white/[0.02]">
                <tr className="text-left font-mono uppercase tracking-[0.16em] text-gray-500">
                  <th className="px-3 py-2">When (UTC)</th>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2">Family</th>
                  <th className="px-3 py-2">Wedge</th>
                  <th className="px-3 py-2">Window</th>
                  <th className="px-3 py-2">Script</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Session</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2 font-mono tabular-nums text-gray-400">
                      {e.createdAt.toISOString().slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-3 py-2 text-gray-100">{e.kind}</td>
                    <td className="px-3 py-2 text-gray-300">{e.archetypeFamily ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-300">{e.wedge ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-300">{e.window ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-300">{e.script ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-300">{e.source ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{e.sessionId.slice(0, 10)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * FAMILY FILTER — plain GET form, no client JS. Submitting changes
 * the `family` query param which all server components above read.
 * Empty value clears the filter.
 * ─────────────────────────────────────────────────────────────────── */
function FamilyFilter({ active }: { active: ArchetypeFamily | null }) {
  return (
    <form method="GET" className="mt-5 flex flex-wrap items-center gap-3">
      <label
        htmlFor="family"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500"
      >
        Filter · archetype family
      </label>
      <select
        id="family"
        name="family"
        defaultValue={active ?? ''}
        className="rounded-md border border-white/15 bg-[#111] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-200 focus:border-orange-500 focus:outline-none"
      >
        <option value="">All families</option>
        {FAMILY_IDS.map((slug) => (
          <option key={slug} value={slug}>
            {getFamily(slug).name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-orange-300 hover:border-orange-500 hover:text-orange-200"
      >
        Apply
      </button>
      {active && (
        <Link
          href="/admin/funnel"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          Reset
        </Link>
      )}
    </form>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────────── */
function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function parseFamilyParam(raw: string | undefined): ArchetypeFamily | null {
  if (!raw) return null
  if ((FAMILY_IDS as readonly string[]).includes(raw)) {
    return raw as ArchetypeFamily
  }
  return null
}
