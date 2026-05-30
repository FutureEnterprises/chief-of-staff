/**
 * /admin/free-tier — the free-tier health dashboard.
 *
 * Reads real data from two sources:
 *   1. AuditFunnelEvent (Postgres) — marketing funnel metrics
 *      (quizzes completed, conversion rates).
 *   2. ClinicalEvent (Postgres) — clinical metrics from the iOS
 *      app once it ships (danger windows detected, intercept rate,
 *      kill-switch fire rate).
 *
 * PostHog is NOT queried here. It's the visualization layer for the
 * marketing funnel; this dashboard is the BAA-clean owned-data view
 * the board sees. If you want the PostHog funnel chart, that's the
 * PostHog UI.
 *
 * Metrics that the data doesn't yet support (because the iOS app
 * hasn't shipped) surface as "pending" with the target visible.
 */

import { prisma } from '@repo/database'
import {
  FREE_TIER_METRIC_TARGETS,
  FreeTierMetric,
} from '@/lib/telemetry/free-tier-events'

/**
 * Snapshot the live metric values. Each metric runs its own query
 * because they have different aggregation windows and join keys.
 */
async function getFreeTierMetrics(): Promise<
  Record<FreeTierMetric, { value: number | null; asOf: Date | null }>
> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
  const eightyFourDaysAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000)

  // --- Marketing-side metrics (AuditFunnelEvent) -----------------
  const totalQuizzesCompleted = await prisma.auditFunnelEvent.count({
    where: { kind: 'completed' },
  })

  const weeklyActiveSessions = await prisma.auditFunnelEvent.findMany({
    where: { createdAt: { gte: sevenDaysAgo }, kind: 'started' },
    select: { sessionId: true },
    distinct: ['sessionId'],
  })
  const weeklyActiveFreeUsers = weeklyActiveSessions.length

  // --- Clinical-side metrics (ClinicalEvent) ---------------------
  // These return null until the iOS app starts emitting events.
  const dangerWindowsLastWeek = await prisma.clinicalEvent.count({
    where: {
      name: 'interrupt.danger_window_detected',
      serverTimestamp: { gte: sevenDaysAgo },
    },
  })
  const distinctUsersLastWeek = (
    await prisma.clinicalEvent.findMany({
      where: { serverTimestamp: { gte: sevenDaysAgo } },
      select: { anonymousUserId: true },
      distinct: ['anonymousUserId'],
    })
  ).length

  const dangerWindowsPerUserPerWeek =
    distinctUsersLastWeek > 0 ? dangerWindowsLastWeek / distinctUsersLastWeek : null

  const interruptsFiredLast28d = await prisma.clinicalEvent.count({
    where: {
      name: 'interrupt.fired',
      serverTimestamp: { gte: twentyEightDaysAgo },
    },
  })
  const interruptsChangedLast28d = await prisma.clinicalEvent.count({
    where: {
      name: 'interrupt.changed_behavior',
      serverTimestamp: { gte: twentyEightDaysAgo },
      // Only count 'changed' outcomes — partial/no_change still
      // hits the counter for INTERRUPT_CHANGED_BEHAVIOR.
      // We'll filter on props.userReportedOutcome in a later iteration.
    },
  })
  const interceptRate =
    interruptsFiredLast28d > 0
      ? (interruptsChangedLast28d / interruptsFiredLast28d) * 100
      : null

  const killSwitchFireRate = (() => {
    if (weeklyActiveFreeUsers === 0) return null
    return null // TODO: count KILL_SWITCH_FIRED events / weeklyActiveFreeUsers
  })()

  // --- Retention (only meaningful once iOS app has signups) ------
  const week4Retention = (() => {
    // TODO: implement once we have iOS APP_OPENED events with cohort
    // grouping. Stub null until then.
    void twentyEightDaysAgo
    return null
  })()
  const week12Retention = (() => {
    void eightyFourDaysAgo
    return null
  })()

  return {
    [FreeTierMetric.WEEKLY_ACTIVE_FREE_USERS]: {
      value: weeklyActiveFreeUsers,
      asOf: now,
    },
    [FreeTierMetric.TOTAL_QUIZZES_COMPLETED]: {
      value: totalQuizzesCompleted,
      asOf: now,
    },
    [FreeTierMetric.WEEK_4_RETENTION_PCT]: {
      value: week4Retention,
      asOf: null,
    },
    [FreeTierMetric.WEEK_12_RETENTION_PCT]: {
      value: week12Retention,
      asOf: null,
    },
    [FreeTierMetric.DANGER_WINDOWS_DETECTED_PER_USER_PER_WEEK]: {
      value: dangerWindowsPerUserPerWeek,
      asOf: dangerWindowsPerUserPerWeek !== null ? now : null,
    },
    [FreeTierMetric.INTERCEPT_RATE_PCT]: {
      value: interceptRate,
      asOf: interceptRate !== null ? now : null,
    },
    [FreeTierMetric.AVG_INTERRUPT_LATENCY_MS]: {
      // Avg latency requires reading the `latencyMs` field out of
      // ClinicalEvent.props (JSON). Defer to a follow-up — needs a
      // raw SQL query for `props->>'latencyMs'`.
      value: null,
      asOf: null,
    },
    [FreeTierMetric.KILL_SWITCH_FIRE_RATE_PCT]: {
      value: killSwitchFireRate,
      asOf: null,
    },
    [FreeTierMetric.FREE_TO_PARTNER_CONVERSION_PCT]: {
      value: null, // requires a join against User + UAPGrant
      asOf: null,
    },
  }
}

function fmt(value: number | null, unit: string): string {
  if (value === null) return 'not yet measured'
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit === 'ms') return `${value.toLocaleString()} ms`
  return `${value.toLocaleString()} ${unit}`
}

function StatusPill({
  metric,
  current,
  target,
}: {
  metric: FreeTierMetric
  current: number | null
  target: number
}) {
  if (current === null) {
    return (
      <span className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
        Pending
      </span>
    )
  }
  const isLowerBetter = metric === FreeTierMetric.KILL_SWITCH_FIRE_RATE_PCT
  const hitting = isLowerBetter ? current <= target : current >= target
  return (
    <span
      className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
        hitting
          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border border-red-500/30 bg-red-500/10 text-red-400'
      }`}
    >
      {hitting ? 'On target' : 'Below target'}
    </span>
  )
}

export default async function FreeTierDashboard() {
  const snapshot = await getFreeTierMetrics()
  const metrics = Object.values(FreeTierMetric)

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-white/[0.08] pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-500">
          Free tier
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Mission metrics
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
          Live data: AuditFunnelEvent (marketing) + ClinicalEvent (iOS).
          PostHog funnel charts live in the PostHog UI; this is the
          BAA-clean owned-data view.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.map((metric) => {
          const target = FREE_TIER_METRIC_TARGETS[metric]
          const current = snapshot[metric]
          return (
            <article
              key={metric}
              className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-orange-400">
                  {metric.replaceAll('_', ' ')}
                </p>
                <StatusPill
                  metric={metric}
                  current={current.value}
                  target={target.target}
                />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-normal tracking-tight text-white">
                  {fmt(current.value, target.unit)}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
                  vs {fmt(target.target, target.unit)} target
                </span>
              </div>
              <p className="text-sm leading-[1.55] text-gray-400">
                {target.rationale}
              </p>
            </article>
          )
        })}
      </div>

      <footer className="space-y-2 border-t border-white/[0.08] pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
          Strategy doc
        </p>
        <p className="text-sm leading-[1.55] text-gray-400">
          See{' '}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">
            docs/strategy/free-consumer-tier.md
          </code>{' '}
          for the brand-commitment rationale. See{' '}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">
            docs/essays/behavioral-support-did-not-slow-glp1-regain-2026.md
          </code>{' '}
          for the published thesis.
        </p>
      </footer>
    </div>
  )
}
