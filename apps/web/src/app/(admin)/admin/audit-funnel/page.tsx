import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { prisma } from '@repo/database'

export const metadata = { title: 'Audit funnel — COYL Admin' }

/**
 * /admin/audit-funnel — anonymous /audit funnel telemetry.
 *
 * Reads from audit_funnel_events (and audit_leads for the emailed
 * cohort) and renders the four-stage funnel:
 *
 *   started → completed → email_captured → signup_started
 *
 * Step-to-step conversion is computed by counting DISTINCT sessionIds
 * that fired the start of each stage. Drop-off between stages is the
 * complement of the conversion ratio.
 *
 * Per-stage windows: last 7 days (the headline strip), last 30 days
 * (the trend strip below). Sessions older than 30 days are clipped
 * so the dashboard stays useful at scale.
 */
export default function AuditFunnelPage() {
  return (
    <div className="space-y-10">
      <header className="border-b border-white/[0.08] pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
          Admin · Audit funnel
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          /audit conversion funnel
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Anonymous sessionId-keyed funnel. Started → completed →
          email captured → signup started. Read from audit_funnel_events.
          Per the founder master list: confirm new-user D7 retention
          before scaling acquisition — but use this dashboard to confirm
          the FUNNEL is working before debating retention.
        </p>
      </header>

      <Suspense
        fallback={<div className="text-sm text-gray-500">Computing funnel…</div>}
      >
        <FunnelBlock days={7} />
      </Suspense>

      <Suspense
        fallback={<div className="text-sm text-gray-500">Computing 30-day window…</div>}
      >
        <FunnelBlock days={30} />
      </Suspense>

      <footer className="border-t border-white/[0.08] pt-6 text-xs text-gray-500">
        Events fire from <code className="font-mono text-orange-400">audit-view.tsx</code>{' '}
        via the funnel beacon. Per-IP rate-limited at 40/10min.{' '}
        <Link href="/admin" className="text-orange-500 hover:underline">
          ← admin home
        </Link>
      </footer>
    </div>
  )
}

async function FunnelBlock({ days }: { days: 7 | 30 }) {
  await connection()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Count DISTINCT sessionIds per stage. A session counts at a stage
  // if it ever fired that beacon — once started, always counted as
  // started, regardless of later drop-off.
  const rows = await prisma.auditFunnelEvent.groupBy({
    by: ['kind'],
    where: { createdAt: { gte: cutoff } },
    _count: { sessionId: true },
  })
  // Distinct session count per stage requires a raw query — groupBy
  // _count counts events, not distinct sessions. A visitor who
  // refreshes can re-fire `started` twice; we want the distinct count.
  const distinct = await prisma.$queryRawUnsafe<
    Array<{ kind: string; n: number }>
  >(`
    SELECT "kind", COUNT(DISTINCT "sessionId")::int AS n
    FROM "audit_funnel_events"
    WHERE "createdAt" >= $1
    GROUP BY "kind"
  `, cutoff)

  const counts: Record<string, number> = Object.fromEntries(
    distinct.map((r) => [r.kind, r.n]),
  )
  const started = counts.started ?? 0
  const completed = counts.completed ?? 0
  const emailed = counts.email_captured ?? 0
  const signups = counts.signup_started ?? 0

  // Event totals (not distinct sessions) — useful when a single session
  // re-fires within the window (refresh + retry). Visualized below the
  // headline as a secondary signal so the founder can spot bots or
  // noisy retries.
  const totalEvents: Record<string, number> = Object.fromEntries(
    rows.map((r) => [r.kind, r._count.sessionId]),
  )

  return (
    <section>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-gray-500">
        Last {days} days · distinct sessions
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StageCard
          label="Started"
          count={started}
          totalEvents={totalEvents.started ?? 0}
          tone="primary"
        />
        <StageCard
          label="Completed"
          count={completed}
          totalEvents={totalEvents.completed ?? 0}
          conversion={pct(completed, started)}
          tone="primary"
        />
        <StageCard
          label="Email captured"
          count={emailed}
          totalEvents={totalEvents.email_captured ?? 0}
          conversion={pct(emailed, completed)}
          tone="orange"
        />
        <StageCard
          label="Signup started"
          count={signups}
          totalEvents={totalEvents.signup_started ?? 0}
          conversion={pct(signups, completed)}
          tone="emerald"
        />
      </div>
    </section>
  )
}

function StageCard({
  label,
  count,
  totalEvents,
  conversion,
  tone = 'primary',
}: {
  label: string
  count: number
  totalEvents: number
  conversion?: number | null
  tone?: 'primary' | 'orange' | 'emerald'
}) {
  const color =
    tone === 'orange'
      ? 'text-orange-400'
      : tone === 'emerald'
        ? 'text-emerald-400'
        : 'text-gray-100'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-black tabular-nums ${color}`}>
        {count}
      </p>
      <p className="mt-1 text-xs text-gray-500 tabular-nums">
        {totalEvents} event{totalEvents === 1 ? '' : 's'} fired
      </p>
      {conversion !== undefined && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-orange-500">
          {conversion === null ? '—' : `${conversion}% step conversion`}
        </p>
      )}
    </div>
  )
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return Number(((numerator / denominator) * 100).toFixed(1))
}
