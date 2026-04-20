import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@repo/database'
import { Activity, Shield, Users, Zap, Flame, TrendingUp, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin \u2014 COYL' }

/**
 * Admin metrics dashboard.
 *
 * Every number the GODMODE spec \u00a712 asks for, aggregated across all users:
 *   \u2022 % of users rescued before slip
 *   \u2022 % of users recovering within 24h
 *   \u2022 D7 retention
 *   \u2022 D30 retention
 *
 * Plus a handful of adjacent numbers that let a founder gut-check the
 * loop health: active users, total slips, most-common excuse, most-fired
 * danger window, share + callout engagement.
 *
 * Auth-gated via ADMIN_EMAILS env var. No third-party analytics \u2014 this
 * reads directly from the product DB so it stays in sync with what
 * users actually see.
 */
export default async function AdminPage() {
  const admin = await requireAdmin()

  const now = new Date()
  const day = 24 * 60 * 60 * 1000
  const sevenDaysAgo = new Date(now.getTime() - 7 * day)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * day)
  const sevenToFourteenDaysAgo = new Date(now.getTime() - 14 * day)
  const thirtyToSixtyDaysAgo = new Date(now.getTime() - 60 * day)
  const oneHour = 60 * 60 * 1000
  const twentyFourHours = 24 * oneHour

  // All queries fan out in parallel. Each is modest; running them concurrently
  // keeps the dashboard under a second on reasonable datasets.
  const [
    totalUsers,
    active7d,
    active30d,
    onboardedUsers,
    // D7 retention cohort: signed up 14\u20137 days ago, still active in last 7
    d7CohortRegistered,
    d7CohortRetained,
    // D30 retention cohort: signed up 60\u201330 days ago, still active in last 30
    d30CohortRegistered,
    d30CohortRetained,
    totalSlips30d,
    slipsRecoveredFast,
    totalRescues30d,
    rescuesInterrupted,
    topExcuses,
    topDangerWindows,
    totalShareClicks,
    totalCalloutViews,
    slipsLogged30d,
    rescueTriggered30d,
    excuseDetected30d,
    onboardingCompleted7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { onboardingCompleted: true } }),

    prisma.user.count({
      where: {
        onboardingCompleted: true,
        createdAt: { gte: sevenToFourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.user.count({
      where: {
        onboardingCompleted: true,
        createdAt: { gte: sevenToFourteenDaysAgo, lt: sevenDaysAgo },
        lastActiveAt: { gte: sevenDaysAgo },
      },
    }),

    prisma.user.count({
      where: {
        onboardingCompleted: true,
        createdAt: { gte: thirtyToSixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    prisma.user.count({
      where: {
        onboardingCompleted: true,
        createdAt: { gte: thirtyToSixtyDaysAgo, lt: thirtyDaysAgo },
        lastActiveAt: { gte: thirtyDaysAgo },
      },
    }),

    prisma.slipRecord.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM slip_records
      WHERE "createdAt" >= ${thirtyDaysAgo}
        AND "recoveredAt" IS NOT NULL
        AND ("recoveredAt" - "createdAt") <= INTERVAL '24 hours'
    `,

    prisma.rescueSession.count({ where: { startedAt: { gte: thirtyDaysAgo } } }),
    prisma.rescueSession.count({
      where: { startedAt: { gte: thirtyDaysAgo }, outcome: 'INTERRUPTED' },
    }),

    prisma.excuse.groupBy({
      by: ['category'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    }),

    prisma.dangerWindow.groupBy({
      by: ['label'],
      where: { active: true },
      _count: true,
      orderBy: { _count: { label: 'desc' } },
      take: 5,
    }),

    prisma.productivityEvent.count({
      where: { eventType: 'SHARE_CLICKED', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.productivityEvent.count({
      where: { eventType: 'CALLOUT_VIEWED', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.productivityEvent.count({
      where: { eventType: 'SLIP_LOGGED', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.productivityEvent.count({
      where: { eventType: 'RESCUE_TRIGGERED', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.productivityEvent.count({
      where: { eventType: 'EXCUSE_DETECTED', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.productivityEvent.count({
      where: {
        eventType: 'ONBOARDING_COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ])

  const recoveryRate =
    totalSlips30d > 0 ? Math.round((Number(slipsRecoveredFast[0]?.count ?? 0) / totalSlips30d) * 100) : null
  const rescueInterruptRate =
    totalRescues30d > 0 ? Math.round((rescuesInterrupted / totalRescues30d) * 100) : null
  const d7Retention =
    d7CohortRegistered > 0 ? Math.round((d7CohortRetained / d7CohortRegistered) * 100) : null
  const d30Retention =
    d30CohortRegistered > 0 ? Math.round((d30CohortRetained / d30CohortRegistered) * 100) : null

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-8 text-gray-100">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="label-xs mb-1 text-orange-500">Admin</p>
          <h1 className="text-3xl font-black">Loop health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {admin.email}. Last 30 days unless noted.
          </p>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {now.toISOString().slice(0, 19).replace('T', ' ')} UTC
        </p>
      </div>

      {/* HERO METRICS \u2014 the four GODMODE \u00a712 numbers */}
      <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric
          icon={Activity}
          label="Rescue interrupt rate"
          value={rescueInterruptRate}
          suffix="%"
          sub={`${rescuesInterrupted} / ${totalRescues30d} rescues`}
          tone={toneFor(rescueInterruptRate, 60, 80)}
        />
        <Metric
          icon={Shield}
          label="Recovery within 24h"
          value={recoveryRate}
          suffix="%"
          sub={`${Number(slipsRecoveredFast[0]?.count ?? 0)} / ${totalSlips30d} slips`}
          tone={toneFor(recoveryRate, 50, 75)}
        />
        <Metric
          icon={TrendingUp}
          label="D7 retention"
          value={d7Retention}
          suffix="%"
          sub={`${d7CohortRetained} / ${d7CohortRegistered} cohort`}
          tone={toneFor(d7Retention, 30, 50)}
        />
        <Metric
          icon={TrendingUp}
          label="D30 retention"
          value={d30Retention}
          suffix="%"
          sub={`${d30CohortRetained} / ${d30CohortRegistered} cohort`}
          tone={toneFor(d30Retention, 15, 30)}
        />
      </section>

      {/* AUDIENCE */}
      <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric icon={Users} label="Total users" value={totalUsers} sub={`${onboardedUsers} onboarded`} />
        <Metric icon={Users} label="Active 7d" value={active7d} sub={`${active30d} active 30d`} />
        <Metric
          icon={Users}
          label="Onboardings"
          value={onboardingCompleted7d}
          sub="last 7 days"
        />
        <Metric
          icon={Zap}
          label="Excuse detections"
          value={excuseDetected30d}
          sub="classified in chat"
        />
      </section>

      {/* LOOP VOLUME */}
      <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Metric icon={Flame} label="Rescue triggers" value={rescueTriggered30d} sub="fired" />
        <Metric icon={AlertTriangle} label="Slips logged" value={slipsLogged30d} sub="last 30d" />
        <Metric
          icon={TrendingUp}
          label="Callout views"
          value={totalCalloutViews}
          sub={`${totalShareClicks} share clicks`}
        />
      </section>

      {/* PATTERNS */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-500">
            Top excuses (30d, across all users)
          </h3>
          {topExcuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No excuses logged yet.</p>
          ) : (
            <div className="space-y-2">
              {topExcuses.map((e) => (
                <div key={e.category} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{e.category}</span>
                  <span className="font-mono text-orange-400">{e._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-orange-500">
            Most-set danger windows
          </h3>
          {topDangerWindows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No windows mapped yet.</p>
          ) : (
            <div className="space-y-2">
              {topDangerWindows.map((w) => (
                <div key={w.label} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{w.label}</span>
                  <span className="font-mono text-orange-400">{w._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="mt-10 text-[10px] text-muted-foreground">
        Retention cohorts: D7 = users registered 7\u201314 days ago who are active in the last 7 days.
        D30 = users registered 30\u201360 days ago who are active in the last 30 days. Cohort sizes
        below ~20 are noisy; treat as indicative only.
      </p>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  suffix = '',
  sub,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | null
  suffix?: string
  sub: string
  tone?: 'positive' | 'warning' | 'danger' | 'neutral'
}) {
  const color =
    tone === 'positive' ? 'text-emerald-400'
    : tone === 'warning' ? 'text-amber-400'
    : tone === 'danger' ? 'text-red-400'
    : 'text-foreground'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 inline-flex rounded-xl bg-orange-500/10 p-2 text-orange-500">
        <Icon className="h-4 w-4" />
      </div>
      <p className={`text-3xl font-black tabular-nums ${color}`}>
        {value === null ? '\u2014' : value}
        {value !== null && suffix}
      </p>
      <p className="label-xs mt-1 text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

// Green/amber/red bands for the hero metrics. Thresholds picked against
// the spec's targets (60% rescue rate, 50% 24h recovery, 30% D7, 15% D30).
function toneFor(
  value: number | null,
  warnBelow: number,
  goodAbove: number,
): 'positive' | 'warning' | 'danger' | 'neutral' {
  if (value === null) return 'neutral'
  if (value >= goodAbove) return 'positive'
  if (value >= warnBelow) return 'warning'
  return 'danger'
}
