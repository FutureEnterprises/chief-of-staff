'use client'

/**
 * <SnapshotCard /> — the in-app render of the day-30/60/90 Model
 * Snapshot. Pairs with the cron in /api/cron/model-snapshot and the
 * JSON renderer in /api/v1/model-snapshot/[id].
 *
 * Visual language: matches /today's "cream typography on warm canvas"
 * doctrine — Instrument Serif headline, Geist mono labels, single
 * orange focal accent (#ff6600). No charting library; the decay bars
 * are CSS-only so this card stays shippable on the snapshot page
 * AND inside an OG-image render with zero external deps.
 *
 * Sections, in order:
 *   1. HEADER          — mono date label, serif "Day N." title
 *   2. ARCHETYPE       — family name + did-it-shift line
 *   3. TOP WINDOWS     — table of busiest danger windows + hold rate
 *   4. TOP EXCUSES     — the user's most-run scripts, with narrative
 *   5. INTERVENTIONS   — which modes / copy templates actually worked
 *   6. DECAY CURVES    — bar viz of week-1 vs current strength
 *   7. TRUST TREND     — small sparkline
 *   8. IDENTITY CLAIM  — quote-block one-liner
 *
 * Empty states are honest: when a section has no data, we don't
 * pretend. We render a single mono "—" so the layout doesn't shift
 * and the user can see what we'd fill in over time.
 */

import { useMemo } from 'react'
import type {
  ModelSnapshot,
  SnapshotDecayCurve,
  SnapshotExcuse,
  SnapshotIntervention,
  SnapshotTrustPoint,
  SnapshotWindow,
} from '@/lib/model-snapshot'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type Props = {
  snapshot: ModelSnapshot
  generatedAt?: string
}

export function SnapshotCard({ snapshot, generatedAt }: Props) {
  const generatedDateLabel = useMemo(() => formatDate(generatedAt ?? snapshot.periodEnd), [
    generatedAt,
    snapshot.periodEnd,
  ])
  const periodRange = useMemo(
    () => `${formatDate(snapshot.periodStart)} – ${formatDate(snapshot.periodEnd)}`,
    [snapshot.periodStart, snapshot.periodEnd],
  )

  return (
    <article className="relative mx-auto max-w-3xl px-6 py-10 sm:py-12">
      {/* Ambient orange wash — same restraint as /today. The serif is
          the spotlight; this is just atmosphere. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(800px at 90% -10%, rgba(255,102,0,0.07), transparent 65%), radial-gradient(600px at -10% 100%, rgba(255,102,0,0.03), transparent 70%)',
        }}
      />

      {/* SECTION 1 — HEADER */}
      <header className="mb-10 border-b border-white/[0.05] pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
          {generatedDateLabel} · {periodRange}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.02] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
          Day {snapshot.daysOnPlatform}.
          <br />
          <span className="text-[#f5f3ee]/85">Your COYL model.</span>
        </h1>
      </header>

      {/* SECTION 2 — ARCHETYPE */}
      <section className="mb-12">
        <SectionLabel>Archetype</SectionLabel>
        <p className="mt-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.012em] text-[#f5f3ee] sm:text-4xl">
          {humanizeArchetype(snapshot.archetype)}
        </p>
        {snapshot.archetypeChanged ? (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-400">
            Archetype shifted this period.
          </p>
        ) : (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a847a]">
            Same archetype as last period.
          </p>
        )}
      </section>

      {/* SECTION 3 — TOP WINDOWS */}
      <section className="mb-12">
        <SectionLabel>Top windows</SectionLabel>
        {snapshot.topWindows.length === 0 ? (
          <EmptyRow>No danger windows mapped yet.</EmptyRow>
        ) : (
          <div className="mt-4 divide-y divide-white/[0.04] border-y border-white/[0.05]">
            {snapshot.topWindows.map((w, i) => (
              <WindowRow key={`${w.label}-${i}`} window={w} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4 — TOP EXCUSES */}
      <section className="mb-12">
        <SectionLabel>Top excuses</SectionLabel>
        {snapshot.topExcuses.length === 0 ? (
          <EmptyRow>No excuses logged this period.</EmptyRow>
        ) : (
          <ul className="mt-4 space-y-5">
            {snapshot.topExcuses.map((e, i) => (
              <ExcuseRow key={`${e.category}-${i}`} excuse={e} />
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 5 — TOP WORKING INTERVENTIONS */}
      <section className="mb-12">
        <SectionLabel>What actually worked</SectionLabel>
        {snapshot.topWorkingInterventions.length === 0 ? (
          <EmptyRow>Need more interrupt feedback to score what worked.</EmptyRow>
        ) : (
          <ul className="mt-4 space-y-4">
            {snapshot.topWorkingInterventions.map((iv, i) => (
              <InterventionRow key={`${iv.mode}-${i}`} intervention={iv} />
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 6 — DECAY CURVES */}
      <section className="mb-12">
        <SectionLabel>Pattern decay</SectionLabel>
        {snapshot.decayCurves.length === 0 ? (
          <EmptyRow>Not enough pattern history to measure decay yet.</EmptyRow>
        ) : (
          <ul className="mt-4 space-y-5">
            {snapshot.decayCurves.map((c, i) => (
              <DecayRow key={`${c.patternName}-${i}`} curve={c} />
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 7 — TRUST TREND */}
      <section className="mb-12">
        <SectionLabel>Self-Trust Score · weekly</SectionLabel>
        {snapshot.selfTrustTrend.length < 2 ? (
          <EmptyRow>
            {snapshot.selfTrustTrend.length === 1
              ? `Current: ${snapshot.selfTrustTrend[0]?.score}/100`
              : 'Trend builds after your first week.'}
          </EmptyRow>
        ) : (
          <TrustSparkline points={snapshot.selfTrustTrend} />
        )}
      </section>

      {/* SECTION 8 — IDENTITY CLAIM */}
      <section className="mb-4 border-y border-orange-500/15 py-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500/70" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
            Identity
          </p>
        </div>
        <p className="mt-5 font-serif text-[28px] font-normal leading-[1.12] tracking-[-0.012em] text-[#f5f3ee] sm:text-[34px]">
          {snapshot.identityClaim}
        </p>
      </section>
    </article>
  )
}

// ─────────────────────── building blocks ───────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
      {children}
    </p>
  )
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a847a]">
      — {children}
    </p>
  )
}

function WindowRow({ window: w }: { window: SnapshotWindow }) {
  const dayLabel = w.dayOfWeek === -1 ? 'Daily' : (DAY_NAMES[w.dayOfWeek] ?? '—')
  const holdLabel = w.firingCount === 0 ? '—' : `${w.holdRate}% held`
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[19px] font-normal leading-[1.18] tracking-[-0.01em] text-[#f5f3ee]">
          {w.label}
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a847a]">
          {dayLabel} · {w.hours} · {w.firingCount} fires
        </p>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-400">
        {holdLabel}
      </p>
    </div>
  )
}

function ExcuseRow({ excuse }: { excuse: SnapshotExcuse }) {
  return (
    <li>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-400">
        {excuse.category} · {excuse.count}×
      </p>
      <p className="mt-1.5 font-serif text-[19px] font-normal leading-[1.22] tracking-[-0.01em] text-[#f5f3ee]">
        {excuse.narrativeRead}
      </p>
    </li>
  )
}

function InterventionRow({ intervention }: { intervention: SnapshotIntervention }) {
  return (
    <li className="bg-[#0e0d0b] px-5 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a847a]">
          {humanizeMode(intervention.mode)}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-400">
          {intervention.holdRate}% held
        </p>
      </div>
      {intervention.copyTemplate ? (
        <p className="mt-2 font-serif text-[18px] font-normal leading-[1.22] tracking-[-0.01em] text-[#f5f3ee]">
          &ldquo;{intervention.copyTemplate}&rdquo;
        </p>
      ) : null}
    </li>
  )
}

function DecayRow({ curve }: { curve: SnapshotDecayCurve }) {
  // deltaPct < 0 = pattern weakening = good (we color it cream-positive).
  // deltaPct > 0 = pattern strengthening = bad (orange warning accent).
  const isDecaying = curve.deltaPct <= 0
  const accent = isDecaying ? 'bg-[#f5f3ee]/80' : 'bg-orange-400'
  const sign = curve.deltaPct > 0 ? '+' : ''
  const week1Pct = clampBar(curve.week1Strength)
  const currentPct = clampBar(curve.currentStrength)

  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-serif text-[17px] font-normal leading-[1.22] tracking-[-0.01em] text-[#f5f3ee]">
          {curve.patternName}
        </p>
        <p
          className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
            isDecaying ? 'text-[#f5f3ee]/70' : 'text-orange-400'
          }`}
        >
          {sign}
          {curve.deltaPct}%
        </p>
      </div>
      <div className="mt-3 space-y-1.5">
        <BarRow label="Week 1" pct={week1Pct} colorClass="bg-[#8a847a]/50" />
        <BarRow label="Now" pct={currentPct} colorClass={accent} />
      </div>
    </li>
  )
}

function BarRow({ label, pct, colorClass }: { label: string; pct: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a847a]">
        {label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden bg-white/[0.04]">
        {/* Width is the only non-static class — that's fine for Tailwind
            JIT in production because the inline style takes priority. */}
        <span
          className={`absolute inset-y-0 left-0 ${colorClass} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  )
}

function TrustSparkline({ points }: { points: SnapshotTrustPoint[] }) {
  // Simple SVG sparkline. Keeps the card chart-lib-free so it ships
  // inside server-rendered share images too. Width and height are
  // intrinsic via viewBox so the line scales with the card.
  const w = 320
  const h = 80
  const pad = 6
  const scores = points.map((p) => p.score)
  const minScore = Math.min(...scores, 0)
  const maxScore = Math.max(...scores, 100)
  const range = Math.max(1, maxScore - minScore)
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0

  const pathPoints = points.map((p, i) => {
    const x = pad + i * stepX
    const y = h - pad - ((p.score - minScore) / range) * (h - pad * 2)
    return { x, y, score: p.score }
  })
  const path = pathPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ')

  const lastPoint = pathPoints.at(-1)
  const firstPoint = pathPoints[0]
  const delta = lastPoint && firstPoint ? lastPoint.score - firstPoint.score : 0
  const deltaSign = delta > 0 ? '+' : delta < 0 ? '' : ''

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block h-20 w-full max-w-md"
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Self-trust trend: ${points.length} weekly points`}
      >
        <path d={path} fill="none" stroke="#ff6600" strokeWidth={1.5} strokeLinejoin="round" />
        {lastPoint ? (
          <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill="#ff6600" />
        ) : null}
      </svg>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a847a]">
          {points.length} weeks
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-400">
          {lastPoint?.score ?? 0}/100 · {deltaSign}
          {delta} since week 1
        </p>
      </div>
    </div>
  )
}

// ─────────────────────── pure helpers ───────────────────────

function clampBar(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

function humanizeArchetype(raw: string): string {
  // Accept either a family slug ("the-9pm-negotiator") or a raw wedge
  // enum ("WEIGHT_LOSS"). Family slugs read as Title Case; wedge
  // enums read as Sentence case.
  if (!raw) return 'Autopilot Operator'
  if (raw.startsWith('the-')) {
    return raw
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
      // Special-case capitalization fixes for known families.
      .replace('9Pm', '9 PM')
  }
  return raw
    .toLowerCase()
    .split('_')
    .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(' ')
}

function humanizeMode(mode: string): string {
  switch (mode) {
    case 'high_arousal':
      return 'High arousal'
    case 'low_arousal':
      return 'Low arousal'
    case 'post_slip':
      return 'Post-slip'
    case 'calm':
      return 'Calm'
    default:
      return mode.replace(/_/g, ' ')
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
