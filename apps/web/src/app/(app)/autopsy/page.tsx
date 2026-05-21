import { Suspense } from 'react'
import Link from 'next/link'
import { requireDbUser } from '@/lib/auth'
import { prisma } from '@repo/database'
import { PageTransition } from '@/components/motion/animations'
import { StructuredResponse } from '@/components/structured-response'
import { Flame, AlertTriangle, Calendar, Activity } from 'lucide-react'

export const metadata = { title: 'Autopilot Autopsy' }

/**
 * /autopsy — in-app weekly autopilot autopsy view.
 *
 * The cron at /api/cron/autopilot-autopsy fires Monday 10:00 UTC,
 * generates an AI-written pattern report per user, emails it, AND
 * persists the full text + structured counts on a WEEKLY_REPORT_SENT
 * ProductivityEvent. This page reads the latest one and renders it.
 *
 * Per the viral-mechanics playbook §4: weekly autopsy is the curiosity-
 * not-guilt re-engagement mechanic. The push reads "Your autopsy is
 * ready" — not "you missed a day" — and the page that opens reinforces
 * that framing.
 *
 * Honest empty state: if no autopsy has been generated yet (new user, or
 * cron hasn't run), we tell them when to expect the first one and what
 * it'll contain. No fake placeholder data.
 */

interface AutopsyMeta {
  type?: string
  autopsyText?: string
  topExcuses?: Array<{ category: string; count: number }>
  slipCount?: number
  rescueCounts?: Record<string, number>
  tasksCompleted?: number
  dangerWindowCount?: number
  wedge?: string
  periodStart?: string
  periodEnd?: string
}

async function getLatestAutopsy(userId: string): Promise<{
  generatedAt: Date
  meta: AutopsyMeta
} | null> {
  const event = await prisma.productivityEvent.findFirst({
    where: {
      userId,
      eventType: 'WEEKLY_REPORT_SENT',
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, metadataJson: true },
  })
  if (!event) return null
  if (typeof event.metadataJson !== 'object' || event.metadataJson === null) return null
  const meta = event.metadataJson as AutopsyMeta
  if (meta.type !== 'autopilot_autopsy') return null
  return { generatedAt: event.createdAt, meta }
}

export default async function AutopsyPage() {
  const user = await requireDbUser()
  const latest = await getLatestAutopsy(user.id)

  return (
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-500">
          Autopilot autopsy
        </p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-foreground md:text-4xl">
          What your autopilot did this week.
        </h1>
        {latest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Generated{' '}
            {latest.generatedAt.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}{' '}
            · Period:{' '}
            {latest.meta.periodStart
              ? new Date(latest.meta.periodStart).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}{' '}
            →{' '}
            {latest.meta.periodEnd
              ? new Date(latest.meta.periodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </p>
        )}
      </div>

      {!latest ? <EmptyState /> : <AutopsyContent meta={latest.meta} />}
    </PageTransition>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center">
      <Activity className="mx-auto h-8 w-8 text-orange-500/60" />
      <p className="mt-4 text-base font-bold text-foreground">
        No autopsy yet.
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Your first autopilot autopsy fires the Monday after you&rsquo;ve had a
        week of activity &mdash; rescues, slips, recoveries, danger windows
        defeated. The report shows up here and in your email.
      </p>
      <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
        It&rsquo;s not a guilt notification. It&rsquo;s a pattern read &mdash; what
        your autopilot learned about you this week, in COYL&rsquo;s voice.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/today"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-xs font-bold text-white shadow-[0_0_14px_-2px_rgba(255,102,0,0.4)]"
        >
          Back to today
        </Link>
        <Link
          href="/patterns"
          className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          See your patterns
        </Link>
      </div>
    </div>
  )
}

function AutopsyContent({ meta }: { meta: AutopsyMeta }) {
  const slipCount = meta.slipCount ?? 0
  const interrupted = meta.rescueCounts?.INTERRUPTED ?? 0
  const pending = meta.rescueCounts?.PENDING ?? 0

  return (
    <Suspense fallback={null}>
      {/* Counters strip */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Counter
          icon={<Flame className="h-4 w-4" />}
          label="Interrupts"
          value={interrupted}
          tone="orange"
        />
        <Counter
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Slips"
          value={slipCount}
          tone="muted"
        />
        <Counter
          icon={<Activity className="h-4 w-4" />}
          label="Tasks done"
          value={meta.tasksCompleted ?? 0}
          tone="muted"
        />
        <Counter
          icon={<Calendar className="h-4 w-4" />}
          label="Danger windows"
          value={meta.dangerWindowCount ?? 0}
          tone="muted"
        />
      </section>

      {/* Top excuses */}
      {meta.topExcuses && meta.topExcuses.length > 0 && (
        <section className="mb-6 rounded-2xl border border-white/5 bg-black/30 p-5">
          <p className="label-xs text-orange-500 mb-3">Top excuses this week</p>
          <ul className="space-y-2">
            {meta.topExcuses.map((e) => (
              <li
                key={e.category}
                className="flex items-baseline justify-between rounded-lg border-l-[3px] border-orange-500/60 bg-orange-500/[0.04] px-4 py-2.5"
              >
                <span className="text-sm font-semibold text-foreground">
                  {humanCategory(e.category)}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{e.count}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AI-written report */}
      {meta.autopsyText && (
        <section className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.06] to-transparent p-6 md:p-8">
          <p className="label-xs text-orange-400 mb-3">The read</p>
          <StructuredResponse text={meta.autopsyText} accentColor="orange" />
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/patterns"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_-3px_rgba(255,102,0,0.4)]"
        >
          Open patterns view
        </Link>
        <Link
          href="/commitments"
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Set next week&rsquo;s rule
        </Link>
      </div>
    </Suspense>
  )
}

function Counter({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'orange' | 'muted'
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === 'orange'
          ? 'border-orange-500/30 bg-orange-500/[0.04]'
          : 'border-white/5 bg-black/20'
      }`}
    >
      <div className={`flex items-center gap-2 ${tone === 'orange' ? 'text-orange-400' : 'text-muted-foreground'}`}>
        {icon}
        <p className="text-[10px] font-mono uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function humanCategory(c: string): string {
  switch (c) {
    case 'DELAY':           return '"I\'ll start tomorrow"'
    case 'REWARD':          return '"I deserve this"'
    case 'MINIMIZATION':    return '"One time won\'t matter"'
    case 'COLLAPSE':        return '"I already blew it"'
    case 'EXHAUSTION':      return '"I\'m too tired"'
    case 'EXCEPTION':       return '"This week is weird"'
    case 'COMPENSATION':    return '"I\'ll make up for it"'
    case 'SOCIAL_PRESSURE': return '"I couldn\'t say no"'
    default:                return c.toLowerCase().replace(/_/g, ' ')
  }
}
