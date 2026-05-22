import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  anonymizePatientName,
  assertProviderAccess,
  getCurrentProvider,
} from '@/lib/provider-rbac'
import { prisma } from '@repo/database'

export const metadata = {
  title: 'Provider · Patient',
  robots: { index: false, follow: false },
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * /provider/[patientId] — single-patient clinical view.
 *
 * Server-rendered to keep PHI out of the client bundle entirely. The
 * data fetched here is HIPAA-light (anonymized name, no raw biometric
 * samples) but we'd rather not ship even that down a fat client
 * bundle.
 *
 * Gating:
 *   1. (provider)/layout.tsx — verifies the viewer is a provider.
 *   2. assertProviderAccess(provider.id, patientId) — verifies the
 *      patient has explicitly granted this provider access via the
 *      opt-in token model.
 *
 * Sections (per spec):
 *   - Patient demographics (anonymized)
 *   - Intervention effectiveness (per-trigger hold rate)
 *   - Recent slips timeline (last 30 days)
 *   - Excuse breakdown (top categories)
 *   - Danger windows (calendar grid by day of week)
 *   - Weight velocity sparkline (if Withings data present)
 *   - HIPAA caveat footer
 */
export default async function PatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const provider = await getCurrentProvider()
  if (!provider) return null

  const { patientId } = await params

  try {
    await assertProviderAccess(provider.id, patientId)
  } catch {
    notFound()
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    patient,
    recentSlips,
    excuseRows,
    dangerWindows,
    rescueRows,
    weightRows,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        planType: true,
        primaryWedge: true,
        currentStreak: true,
        longestStreak: true,
        selfTrustScore: true,
        executionScore: true,
        slipsThisMonth: true,
        lastSlipAt: true,
        createdAt: true,
        glp1Drug: true,
        glp1InjectionWeekday: true,
        glp1StartedAt: true,
      },
    }),
    prisma.slipRecord.findMany({
      where: { userId: patientId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.excuse.findMany({
      where: { userId: patientId, createdAt: { gte: thirtyDaysAgo } },
      select: { category: true },
    }),
    prisma.dangerWindow.findMany({
      where: { userId: patientId, active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    }),
    prisma.rescueSession.findMany({
      where: { userId: patientId, startedAt: { gte: thirtyDaysAgo } },
      select: { trigger: true, outcome: true },
    }),
    prisma.productivityEvent.findMany({
      where: {
        userId: patientId,
        eventType: 'FEATURE_USED',
        eventValue: 'weight_reading',
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadataJson: true },
      take: 200,
    }),
  ])

  if (!patient) notFound()

  const displayName = anonymizePatientName(patient.name)
  const daysOnPlatform = Math.max(
    0,
    Math.floor(
      (Date.now() - patient.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )

  // Excuse breakdown (top categories ranked).
  const excuseBreakdown = Object.entries(
    excuseRows.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])
  const excuseMax = excuseBreakdown[0]?.[1] ?? 0

  // Intervention effectiveness — per-trigger hold rate. INTERRUPTED =
  // the patient pulled back; SLIPPED = the urge won. PENDING /
  // UNRESOLVED rows are excluded from the denominator.
  const byTrigger = new Map<string, { held: number; slipped: number }>()
  for (const r of rescueRows) {
    const bucket = byTrigger.get(r.trigger) ?? { held: 0, slipped: 0 }
    if (r.outcome === 'INTERRUPTED') bucket.held += 1
    else if (r.outcome === 'SLIPPED') bucket.slipped += 1
    byTrigger.set(r.trigger, bucket)
  }
  const interventionRows = Array.from(byTrigger.entries())
    .map(([trigger, { held, slipped }]) => ({
      trigger,
      held,
      slipped,
      holdRate: held + slipped > 0 ? held / (held + slipped) : null,
    }))
    .sort((a, b) => (b.held + b.slipped) - (a.held + a.slipped))

  // Weight velocity points for sparkline. Reads only decimated points
  // from the productivity event stream — never the raw Withings scale
  // samples.
  const weightPoints = weightRows
    .map((row) => {
      const md = row.metadataJson as { weightKg?: number } | null
      const w = md?.weightKg
      if (typeof w !== 'number') return null
      return { at: row.createdAt, weightKg: w }
    })
    .filter((p): p is { at: Date; weightKg: number } => p !== null)

  return (
    <div className="space-y-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <Link
            href="/provider/cohort"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-900"
          >
            ← Cohort
          </Link>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-slate-900">
            {displayName}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {patient.planType} · {patient.primaryWedge.toLowerCase()} ·{' '}
            {daysOnPlatform} days on platform
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Streak" value={`${patient.currentStreak}d`} />
        <Stat label="Slips · month" value={`${patient.slipsThisMonth}`} />
        <Stat label="Self-trust" value={`${patient.selfTrustScore}`} />
        <Stat label="Execution" value={`${patient.executionScore}`} />
      </section>

      {patient.glp1Drug ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-700">
            GLP-1 Companion
          </p>
          <p className="mt-1">
            On <strong>{patient.glp1Drug}</strong>
            {patient.glp1InjectionWeekday !== null
              ? ` · injects ${DAY_LABELS[patient.glp1InjectionWeekday]}`
              : ''}
            {patient.glp1StartedAt
              ? ` · since ${patient.glp1StartedAt.toLocaleDateString()}`
              : ''}
            .
          </p>
        </section>
      ) : null}

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl tracking-tight">
          Intervention effectiveness
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Per-mode hold rate over the last 30 days. Held = patient pulled
          through the autopilot interrupt. Slipped = the urge won.
        </p>
        {interventionRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No rescue sessions in the last 30 days.
          </p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="py-2 font-mono font-normal">Trigger</th>
                <th className="py-2 font-mono font-normal">Held</th>
                <th className="py-2 font-mono font-normal">Slipped</th>
                <th className="py-2 font-mono font-normal">Hold rate</th>
              </tr>
            </thead>
            <tbody>
              {interventionRows.map((r) => (
                <tr key={r.trigger} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{r.trigger}</td>
                  <td className="py-2">{r.held}</td>
                  <td className="py-2">{r.slipped}</td>
                  <td className="py-2">
                    {r.holdRate === null
                      ? '—'
                      : `${Math.round(r.holdRate * 100)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl tracking-tight">Recent slips</h2>
        <p className="mt-1 text-sm text-slate-600">
          Last 30 days · {recentSlips.length} total.
        </p>
        {recentSlips.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No slips logged in the last 30 days.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentSlips.map((s) => (
              <li
                key={s.id}
                className="flex items-baseline justify-between border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
                  {s.createdAt.toLocaleDateString()}{' '}
                  {s.createdAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-sm text-slate-700">
                  {s.trigger ?? '(no trigger noted)'}{' '}
                  {s.recoveredAt ? (
                    <span className="ml-2 text-xs text-emerald-700">
                      · recovered
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl tracking-tight">Excuse breakdown</h2>
          <p className="mt-1 text-sm text-slate-600">
            Top excuse categories, last 30 days.
          </p>
          {excuseBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No excuses logged.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {excuseBreakdown.map(([cat, count]) => (
                <li key={cat}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-slate-700">{cat}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-slate-700"
                      style={{
                        width: `${excuseMax > 0 ? (count / excuseMax) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl tracking-tight">Danger windows</h2>
          <p className="mt-1 text-sm text-slate-600">
            Active autopilot risk periods, by day of week.
          </p>
          {dangerWindows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No active danger windows.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px]">
              {DAY_LABELS.map((label, idx) => {
                const dayWindows = dangerWindows.filter(
                  (w) => w.dayOfWeek === idx || w.dayOfWeek === -1,
                )
                return (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="font-mono uppercase tracking-[0.12em] text-slate-500">
                      {label}
                    </div>
                    <div className="flex w-full flex-col gap-0.5">
                      {dayWindows.length === 0 ? (
                        <div className="h-6 rounded-sm bg-slate-50" />
                      ) : (
                        dayWindows.map((w) => (
                          <div
                            key={w.id}
                            title={`${w.label} · ${w.startHour}:00–${w.endHour}:00`}
                            className="rounded-sm bg-orange-200 px-1 py-0.5 font-mono text-[9px] text-orange-900"
                          >
                            {w.startHour}–{w.endHour}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl tracking-tight">Weight velocity</h2>
        <p className="mt-1 text-sm text-slate-600">
          Decimated weight readings from the connected scale, last 30 days.
        </p>
        {weightPoints.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No weight data. Patient has not connected a scale, or no readings
            in the last 30 days.
          </p>
        ) : (
          <WeightSparkline points={weightPoints} />
        )}
      </section>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        Aggregate clinical-grade data only. Raw biometric samples not exposed.
        Patient retains full export rights.
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  )
}

function WeightSparkline({
  points,
}: {
  points: Array<{ at: Date; weightKg: number }>
}) {
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  if (points.length < 2 || !firstPoint || !lastPoint) {
    return (
      <p className="mt-4 font-mono text-sm text-slate-700">
        Single reading · {firstPoint?.weightKg.toFixed(1) ?? '—'} kg on{' '}
        {firstPoint?.at.toLocaleDateString() ?? '—'}
      </p>
    )
  }

  const w = 480
  const h = 80
  const padding = 4
  const ws = points.map((p) => p.weightKg)
  const min = Math.min(...ws)
  const max = Math.max(...ws)
  const range = max - min || 1
  const tStart = firstPoint.at.getTime()
  const tEnd = lastPoint.at.getTime()
  const tRange = tEnd - tStart || 1

  const pathD = points
    .map((p, i) => {
      const x =
        padding + ((p.at.getTime() - tStart) / tRange) * (w - padding * 2)
      const y =
        padding + (1 - (p.weightKg - min) / range) * (h - padding * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const first = firstPoint.weightKg
  const last = lastPoint.weightKg
  const delta = last - first
  const deltaSign = delta > 0 ? '+' : ''

  return (
    <div className="mt-4 space-y-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Weight velocity sparkline"
      >
        <path
          d={pathD}
          fill="none"
          stroke="rgb(15 23 42)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="font-mono text-xs text-slate-600">
        {first.toFixed(1)} kg → {last.toFixed(1)} kg ·{' '}
        <span
          className={delta < 0 ? 'text-emerald-700' : delta > 0 ? 'text-red-700' : ''}
        >
          {deltaSign}
          {delta.toFixed(1)} kg
        </span>{' '}
        over {points.length} readings
      </p>
    </div>
  )
}
