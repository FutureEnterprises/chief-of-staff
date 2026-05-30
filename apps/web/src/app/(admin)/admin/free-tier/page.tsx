/**
 * /admin/free-tier — the free-tier health dashboard.
 *
 * Single page. Shows the 9 metrics that prove (or disprove) that the
 * free consumer tier is doing its job. Used in:
 *   - weekly investor updates
 *   - monthly board updates
 *   - seed pitch (the rolled-up version)
 *
 * Data sources today: stubs (the telemetry sink is a console-log
 * stub — see src/lib/telemetry/track-free-tier.ts). When the
 * analytics stack lands (Month 2 of v3 plan), swap getFreeTierMetrics()
 * to read from PostHog + Prisma.
 *
 * Page is intentionally simple. The point is to see whether each
 * metric is above or below the target, not to drill into per-event
 * timelines. Per-event timelines live in the funnel admin (existing).
 */

import {
  FREE_TIER_METRIC_TARGETS,
  FreeTierMetric,
} from '@/lib/telemetry/free-tier-events'

/**
 * Current metric snapshots. STUB — replace with real queries once the
 * analytics stack is wired. The stub returns "not yet measured" for
 * every metric, which is the honest state today and prevents anyone
 * from screenshotting fake numbers into a deck by accident.
 */
async function getFreeTierMetrics(): Promise<
  Record<FreeTierMetric, { value: number | null; asOf: Date | null }>
> {
  // TODO(month-2): wire to real provider.
  // For dev / pre-wire: every metric is null (= "not yet measured").
  return Object.fromEntries(
    Object.values(FreeTierMetric).map((m) => [m, { value: null, asOf: null }]),
  ) as Record<FreeTierMetric, { value: number | null; asOf: Date | null }>
}

/** Pretty-format a metric value with its unit. */
function fmt(value: number | null, unit: string): string {
  if (value === null) return 'not yet measured'
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit === 'ms') return `${value.toLocaleString()} ms`
  return `${value.toLocaleString()} ${unit}`
}

/** Status pill — above target / below target / unmeasured. */
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
  // Kill-switch is the only metric where LOWER is better.
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
          Source: src/lib/telemetry/free-tier-events.ts · Stub data ·
          Replace getFreeTierMetrics() in this file when analytics
          provider lands.
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
