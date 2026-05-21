'use client'
/**
 * /today — Whoop/Oura DNA, signature ring, spatial depth (no SVG viz).
 * Founder direction May 2026: previous Linear/Stripe-Dashboard surface
 * read as "AI dashboard". This redesign moves /today into a biometric-
 * wearable register — premium, alive, layered, and unmistakably COYL.
 *
 * REFERO REFERENCES APPLIED (one-line each):
 *   - 31c2ea57-68e4-4dec-bdea-6ca5baae2c5f (The Outsiders, Readiness):
 *       hero-as-score pattern; HUGE numeric centered, short interpretive
 *       sentence underneath, glassy translucent cards on a deep dark base.
 *   - 85702559-5176-4cb1-a244-57af3597a801 (The Outsiders, Progress):
 *       glassmorphism-on-near-black, large display numerics paired with
 *       compact sparkline-style satellite cards, soft inner shadow depth.
 *   - 4f852081-3d37-4f91-a758-3a7f4867bf88 (GrowPal, Sleep):
 *       grid of small circular progress rings as daily history — informs
 *       the satellite-mini-ring layout under the main score ring.
 *   - c5819e61-5c00-441c-b702-91d16473a807 (Longevity Deck, Stress):
 *       dark-mode HRV dashboard layered metric tiles + segmented controls
 *       with restrained typographic chrome; informs the row-of-metric look.
 *   - 1b7e4f5c-c3c2-48d5-8f34-3ecdd17f422e (Peloton, style):
 *       cinematic dark-premium discipline — single brand accent, generous
 *       breathing, strict restraint on competing colors.
 *
 * WHY each decision:
 *   - No SVG: the brief is locked. CSS `conic-gradient()` paints the ring
 *     natively — same shape Whoop/Oura use, with less paint cost and
 *     full motion/react animateability. SVG would invite chart libraries.
 *   - Ring viz: a single hero atom anchors the screenshot. A Whoop strain
 *     dial is iconic; we want /today to feel the same way at a glance.
 *   - Color discipline: ONLY orange. Whoop is teal, Oura is mint — we
 *     copy their LAYOUT not their palette. Orange stays load-bearing.
 *   - Spatial layers (3 z-planes):
 *       z-0  : warm dark base + drifting orange radial gradient (ambient)
 *       z-10 : the score ring + satellite metrics + identity panel
 *       z-20 : overlay surfaces (danger window banner, FAB, modal)
 *   - Type system: ui-serif greeting for warmth; Geist sans body; Geist
 *     mono tabular-nums for biometric numbers at 60-88px.
 */
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import type { Task, User, Tag } from '@repo/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskCreateModal } from '@/components/tasks/task-create-modal'
import { StaggerList, StaggerItem, PageTransition } from '@/components/motion/animations'
import { TodayScoreRing } from '@/components/today/today-score-ring'
import {
  Sun, Moon, Plus, CheckCircle2, AlertTriangle,
  RefreshCw, Zap, Flame, Brain, Shield,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CalloutPanel } from '@/components/callout/callout-panel'
import { WebPushEnableBanner } from '@/components/web-push/enable-banner'
import { InterruptHistory } from '@/components/interrupt-history/interrupt-history'
import { identitySentence } from '@/lib/identity-sentence'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

type ActiveCommitment = { id: string; rule: string; keepCount: number; breakCount: number } | null
type NextDangerWindow = { label: string; whenText: string; hoursUntil: number } | null
type ActiveDangerWindow = { id: string; label: string; startHour: number; endHour: number; minutesIn: number } | null

interface TodayViewProps {
  dueTodayTasks: TaskWithRelations[]
  followUpsDueToday: Array<Task & { tags: Array<{ tag: Tag }> }>
  overdueTasks: Array<Task & { tags: Array<{ tag: Tag }> }>
  recentlyCompleted: Task[]
  user: User
  activeCommitment?: ActiveCommitment
  nextDangerWindow?: NextDangerWindow
  activeDangerWindow?: ActiveDangerWindow
  topExcuseCategory?: string | null
  topExcuseCount?: number
  selfTrustDelta?: number | null
  hasWebPushSubscription?: boolean
  hasMobilePush?: boolean
  hasDangerWindows?: boolean
}

const EXCUSE_TAG: Record<string, string> = {
  DELAY: 'tomorrow',
  REWARD: 'deserving',
  MINIMIZATION: 'just this once',
  COLLAPSE: 'I already blew it',
  EXHAUSTION: 'too tired',
  EXCEPTION: 'special week',
  COMPENSATION: "I'll make up for it",
  SOCIAL_PRESSURE: "couldn't say no",
}

/**
 * TODAY SCORE — composite 0-100 read of the operator's day.
 *
 * Formula (intentionally simple, deterministic, no surprise):
 *   base                                = 50  (neutral starting point)
 *   + 12 * keptCommitments               (rewards behavior we want)
 *   + 6  * interruptsSucceeded           (rewards engaging the JITAI)
 *   + 8  * selfTrustScore/100 scaled     (longer-arc trust signal)
 *   - 14 * brokenCommitments             (slip-or-break penalty)
 *   - 10 * slipsToday                    (today-specific damage)
 *
 * Clamped to [0, 100]. Tier mapping at consumption site.
 */
function computeTodayScore(opts: {
  kept: number
  broken: number
  interruptsWon: number
  slipsToday: number
  selfTrust: number
}): number {
  const { kept, broken, interruptsWon, slipsToday, selfTrust } = opts
  const raw =
    50 +
    12 * kept +
    6 * interruptsWon +
    8 * (selfTrust / 100) -
    14 * broken -
    10 * slipsToday
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function scoreTone(score: number): 'positive' | 'neutral' | 'warning' | 'danger' {
  if (score >= 75) return 'positive'
  if (score >= 55) return 'neutral'
  if (score >= 35) return 'warning'
  return 'danger'
}

export function TodayView({
  dueTodayTasks,
  followUpsDueToday,
  overdueTasks,
  recentlyCompleted,
  user,
  activeCommitment,
  nextDangerWindow,
  activeDangerWindow,
  topExcuseCategory,
  topExcuseCount,
  selfTrustDelta,
  hasWebPushSubscription = false,
  hasMobilePush = false,
  hasDangerWindows = false,
}: TodayViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.name.split(' ')[0] ?? user.name
  const totalAttention = dueTodayTasks.length + overdueTasks.length + followUpsDueToday.length
  const criticalTasks = [...dueTodayTasks, ...overdueTasks]
    .filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
    .slice(0, 3)

  // Score composite — falls back gracefully when commitments are absent.
  const kept = activeCommitment?.keepCount ?? 0
  const broken = activeCommitment?.breakCount ?? 0
  const slipsToday = user.recoveryState === 'SLIPPED' ? 1 : 0
  // interruptsWonToday is not on user; default to 0 — the surface still
  // renders proudly because the formula rewards trust + kept rules.
  const interruptsWon = 0
  const todayScore = computeTodayScore({
    kept,
    broken,
    interruptsWon,
    slipsToday,
    selfTrust: user.selfTrustScore ?? 0,
  })
  const tone = scoreTone(todayScore)

  // Satellite metric percentages — each maps to its own 0-100 mini-ring.
  // Streak: cap at 30 days as full ring (longer is presented as 100%).
  const streakPct = Math.min(100, Math.round(((user.currentStreak ?? 0) / 30) * 100))
  const selfTrustPct = Math.max(0, Math.min(100, user.selfTrustScore ?? 0))
  const interruptsPct = Math.min(100, interruptsWon * 20)

  return (
    <PageTransition className="relative mx-auto max-w-3xl px-5 py-8 sm:px-6">
      {/* ════════════════════ Z-PLANE 0 — AMBIENT BACKGROUND ════════════════════
          Warm-dark wash with a slow-drifting orange radial that lives behind
          everything. This is the "atmosphere" plane — pure mood, no content. */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, #14110e 0%, #0e0d0b 55%, #07060500 100%)',
          }}
        />
        <motion.div
          aria-hidden
          animate={{
            opacity: [0.35, 0.6, 0.35],
            x: ['-2%', '2%', '-2%'],
            y: ['-1%', '1%', '-1%'],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-[8%] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255,102,0,0.22) 0%, rgba(255,102,0,0.06) 45%, transparent 75%)',
          }}
        />
        {/* Subtle dot pattern — anti-banding on the gradient, premium feel.
            Pure CSS so no SVG anywhere on the page. */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
          }}
        />
      </div>

      {/* ════════════════════ Z-PLANE 10 — CONTENT (THE DASHBOARD) ════════════════════ */}

      {/* HEADER — serif greeting + monospace timestamp. The serif is the
          single moment of warmth on the page; everything else is grotesk
          + mono. Mirrors the wearable-app trick of one elegant accent. */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-baseline justify-between"
      >
        <p
          className="text-[22px] font-medium tracking-[-0.02em] text-foreground sm:text-[26px]"
          style={{ fontFamily: 'ui-serif, "Iowan Old Style", Georgia, serif' }}
        >
          {greeting}, <span className="italic text-orange-300/90">{firstName}</span>
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-muted-foreground">
          {formatDate(new Date())}
        </p>
      </motion.div>

      <WebPushEnableBanner
        alreadySubscribed={hasWebPushSubscription}
        hasDangerWindows={hasDangerWindows}
        hasMobilePush={hasMobilePush}
      />

      {/* SIGNATURE RING — the photo-atom. Built entirely with CSS conic-gradient.
          When the user is in a danger window, the perimeter pulses orange. */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
        className="mb-8 flex flex-col items-center pt-6"
      >
        <TodayScoreRing
          score={todayScore}
          caption={tone === 'positive' ? 'On track today' : tone === 'danger' ? 'Today needs you' : 'Today'}
          tone={tone}
          pulse={Boolean(activeDangerWindow)}
          satellites={[
            {
              label: 'Streak',
              value: user.currentStreak ?? 0,
              percent: streakPct,
              display: `${user.currentStreak ?? 0}d`,
            },
            {
              label: 'Self-trust',
              value: selfTrustPct,
              percent: selfTrustPct,
              display: `${selfTrustPct}`,
            },
            {
              label: 'Interrupts',
              value: interruptsWon,
              percent: interruptsPct,
              display: `${interruptsWon}`,
            },
          ]}
        />
      </motion.section>

      {/* ACTIVE DANGER WINDOW — overlay surface (z-plane 20 in effect).
          Highest-urgency moment in the product. */}
      <AnimatePresence>
        {activeDangerWindow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-20 mb-5 overflow-hidden rounded-2xl border border-orange-500/40 p-5"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,90,30,0.12) 0%, rgba(255,90,30,0.04) 60%, transparent 100%)',
              boxShadow:
                '0 24px 60px -20px rgba(255,90,30,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-orange-500/40 bg-orange-500/15 text-orange-300"
              >
                <Flame className="h-4 w-4" />
              </motion.div>
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300 tabular-nums">
                  You&rsquo;re in: {activeDangerWindow.label} &middot; {activeDangerWindow.minutesIn} min in
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-xl">
                  This is the moment your autopilot runs.
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  You already know how it ends. One tap, one different choice, the night doesn&rsquo;t turn into the week.
                </p>
                <Link
                  href={`/rescue?windowId=${activeDangerWindow.id}&from=danger_window`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-white shadow-[0_0_20px_-3px_rgba(255,102,0,0.7)] transition-shadow hover:shadow-[0_0_28px_-2px_rgba(255,102,0,0.85)]"
                >
                  Open rescue &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECOVERY MODE — softer "we caught you" register */}
      {(user.recoveryState === 'SLIPPED' || user.recoveryState === 'RECOVERING') && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 overflow-hidden rounded-2xl border border-white/[0.05] p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,102,0,0.06) 0%, rgba(255,102,0,0.015) 50%, transparent 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">Recovery mode &middot; 24h</p>
              <p className="mt-2 text-lg font-semibold leading-tight tracking-[-0.015em] text-foreground">
                You slipped. Good. Now we stop the damage.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Streak preserved. No Monday reset. One tiny better move and you&rsquo;re back.
              </p>
              <Link
                href="/slip"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-orange-300 transition-colors hover:bg-orange-500/15"
              >
                Build the recovery plan &rarr;
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* IDENTITY LINE — the headline read on who you are today. Lives just
          under the ring as the "interpretation" layer. */}
      {(() => {
        const id = identitySentence({
          identityState: user.identityState ?? null,
          recoveryState: user.recoveryState ?? null,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          slipsThisMonth: user.slipsThisMonth,
          selfTrustScore: user.selfTrustScore ?? 0,
        })
        const accent =
          id.tone === 'warning' ? 'text-orange-300'
          : id.tone === 'positive' ? 'text-orange-200'
          : 'text-orange-300'
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="mb-5 rounded-2xl border border-white/[0.04] p-5"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0.005) 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.03), 0 12px 32px -20px rgba(0,0,0,0.7)',
            }}
          >
            <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${accent}`}>
              Identity read
            </p>
            <p
              className="mt-2 text-[17px] font-medium leading-[1.25] tracking-[-0.015em] text-foreground"
              style={{ fontFamily: 'ui-serif, "Iowan Old Style", Georgia, serif' }}
            >
              {id.headline}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{id.evidence}</p>
          </motion.div>
        )
      })()}

      {/* TONIGHT'S RULE — hero card. Floating, warm, depth via box-shadow. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5 }}
        className="mb-4"
      >
        {activeCommitment ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-orange-500/25 p-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,102,0,0.10) 0%, rgba(255,102,0,0.02) 55%, transparent 100%)',
              boxShadow:
                '0 30px 70px -30px rgba(255,102,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(255,102,0,0.18) 0%, transparent 70%)' }}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-400">
              Today&apos;s rule
            </p>
            <p
              className="mt-3 text-[24px] font-medium leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[28px]"
              style={{ fontFamily: 'ui-serif, "Iowan Old Style", Georgia, serif' }}
            >
              {activeCommitment.rule}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 font-mono text-[11px] tabular-nums">
              <span className="text-muted-foreground">
                <span className="text-orange-200">{activeCommitment.keepCount} kept</span>
                {activeCommitment.breakCount > 0 && (
                  <> &middot; <span className="text-orange-400/80">{activeCommitment.breakCount} broken</span></>
                )}
              </span>
              <Link href="/commitments" className="text-orange-300 transition-colors hover:text-orange-200">
                Manage &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-500/25 bg-white/[0.01] p-6 text-center">
            <p className="text-[13px] text-muted-foreground">No rule set yet.</p>
            <Link href="/commitments" className="mt-2 inline-block text-[13px] font-semibold text-orange-300 hover:text-orange-200">
              Set today&apos;s rule &rarr;
            </Link>
          </div>
        )}
      </motion.div>

      {/* THREE PRIMARY ACTIONS — equal-weight CTAs, raised tiles with depth.
          Each tile has its own subtle gradient + inner highlight; spatial
          motion via whileHover scale. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.5 }}
        className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-3"
      >
        <ActionTile href="/rescue" icon={<Flame className="h-4 w-4" />} label="I'm about to mess up" emphasis />
        <ActionTile href="/decide" icon={<Brain className="h-4 w-4" />} label="What should I do?" />
        <ActionTile href="/slip" icon={<AlertTriangle className="h-4 w-4" />} label="I already slipped" />
      </motion.div>

      {/* CONTEXTUAL METRIC ROW — three slim glass tiles, biometric typography. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30, duration: 0.5 }}
        className="mb-7 grid grid-cols-1 gap-2.5 md:grid-cols-3"
      >
        <MetricTile
          label="Next danger window"
          primary={nextDangerWindow?.label ?? 'None mapped yet'}
          secondary={nextDangerWindow?.whenText}
        />
        <MetricTile
          label="Self-trust"
          primary={`${user.selfTrustScore ?? 0}`}
          primaryMono
          unit="/ 100"
          secondary={
            selfTrustDelta != null && selfTrustDelta !== 0
              ? `${selfTrustDelta > 0 ? '↑' : '↓'} ${Math.abs(selfTrustDelta)} this week`
              : undefined
          }
          secondaryAccent={selfTrustDelta != null && selfTrustDelta > 0 ? 'positive' : selfTrustDelta != null && selfTrustDelta < 0 ? 'negative' : undefined}
        />
        <MetricTile
          label="Excuse detected"
          primary={
            topExcuseCategory && topExcuseCount && topExcuseCount > 1
              ? `"${EXCUSE_TAG[topExcuseCategory] ?? topExcuseCategory.toLowerCase().replace('_', ' ')}"`
              : 'Not enough data'
          }
          secondary={
            topExcuseCategory && topExcuseCount && topExcuseCount > 1
              ? `${topExcuseCount}× this week`
              : undefined
          }
        />
      </motion.div>

      {/* Recent interrupts — server proof the JITAI is firing. */}
      <div className="mb-6">
        <InterruptHistory />
      </div>

      {/* Secondary CTAs — capsule pills, restrained */}
      <div className="mb-7 flex flex-wrap gap-2">
        <Button variant="glass" size="sm" asChild>
          <Link href="/chat?mode=morning">
            <Sun className="h-3.5 w-3.5 text-orange-300" /> Set today&apos;s rule
          </Link>
        </Button>
        <Button variant="glass" size="sm" asChild>
          <Link href="/chat?mode=night">
            <Moon className="h-3.5 w-3.5 text-orange-200/70" /> Did you keep your word?
          </Link>
        </Button>
        <CalloutPanel
          userId={user.id}
          trigger={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/[0.06] px-3 py-1 text-[11px] font-semibold text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/[0.12]">
              <Flame className="h-3 w-3 text-orange-300" />
              Be brutally honest
            </span>
          }
        />
      </div>

      {/* TASKS ROLL-UP — biometric numerics, glassy tiles */}
      <StaggerList className="mb-7 grid grid-cols-4 gap-2.5">
        {[
          { label: 'Due', value: dueTodayTasks.length },
          { label: 'Overdue', value: overdueTasks.length, urgent: overdueTasks.length > 0 },
          { label: 'Follow-ups', value: followUpsDueToday.length },
          { label: 'Done', value: recentlyCompleted.length },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <div
              className="rounded-2xl border border-white/[0.05] px-3 py-3.5"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.005) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -16px rgba(0,0,0,0.7)',
              }}
            >
              <p className="font-mono text-[28px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-foreground">
                {stat.value}
              </p>
              <p
                className={`mt-2 font-mono text-[9.5px] uppercase tracking-[0.16em] ${
                  stat.urgent ? 'text-orange-300' : 'text-muted-foreground'
                }`}
              >
                {stat.label}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Top priorities */}
      {criticalTasks.length > 0 && (
        <Section title="Top priorities" icon={<Zap className="h-3 w-3 text-orange-300" />} count={criticalTasks.length} className="mb-6">
          <StaggerList className="space-y-1.5">
            {criticalTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} compact />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {dueTodayTasks.length > 0 && (
        <Section title="Due today" count={dueTodayTasks.length} className="mb-6">
          <StaggerList className="space-y-1.5">
            {dueTodayTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {followUpsDueToday.length > 0 && (
        <Section title="Follow-ups due" icon={<RefreshCw className="h-3 w-3 text-orange-300" />} count={followUpsDueToday.length} className="mb-6">
          <StaggerList className="space-y-1.5">
            {followUpsDueToday.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} showFollowUp />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {overdueTasks.length > 0 && (
        <Section title="Overdue" icon={<AlertTriangle className="h-3 w-3 text-orange-400" />} count={overdueTasks.length} countVariant="destructive" className="mb-6">
          <StaggerList className="space-y-1.5">
            {overdueTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} showOverdue />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {totalAttention === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/[0.04] py-12 text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, #ff8020 0%, #ff6600 70%)',
              boxShadow: '0 12px 32px -8px rgba(255,102,0,0.55)',
            }}
          >
            <CheckCircle2 className="h-7 w-7 text-white" />
          </motion.div>
          <h3
            className="text-[20px] font-medium tracking-[-0.02em] text-foreground"
            style={{ fontFamily: 'ui-serif, "Iowan Old Style", Georgia, serif' }}
          >
            All caught up
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted-foreground">
            Nothing urgent. Use the quiet — set tomorrow&rsquo;s rule now.
          </p>
          <Button variant="brand" size="sm" className="mt-5" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add a task
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {recentlyCompleted.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-7">
            <Separator className="mb-5" />
            <Section title="Completed today" icon={<CheckCircle2 className="h-3 w-3 text-orange-200" />} count={recentlyCompleted.length}>
              <div className="space-y-0.5">
                {recentlyCompleted.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.02]">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-orange-200" />
                    <span className="text-[13px] text-muted-foreground line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════ Z-PLANE 20 — OVERLAY (FAB) ════════════════════ */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-20 grid h-13 w-13 place-items-center rounded-full text-white"
        style={{
          width: 52,
          height: 52,
          background: 'radial-gradient(circle at 35% 30%, #ff8020 0%, #ff6600 70%)',
          boxShadow:
            '0 18px 40px -10px rgba(255,102,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
        aria-label="Add task"
      >
        <Plus className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {showCreateModal && <TaskCreateModal onClose={() => setShowCreateModal(false)} />}
      </AnimatePresence>
    </PageTransition>
  )
}

/* ════════════════════ Subcomponents ════════════════════ */

function ActionTile({
  href,
  icon,
  label,
  emphasis,
}: {
  href: string
  icon: React.ReactNode
  label: string
  emphasis?: boolean
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className="group flex items-center justify-center gap-2.5 rounded-2xl border px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.10em] transition-all"
        style={
          emphasis
            ? {
                color: '#ffffff',
                borderColor: 'rgba(255,102,0,0.35)',
                background:
                  'linear-gradient(135deg, rgba(255,102,0,0.95) 0%, rgba(224,92,0,0.95) 100%)',
                boxShadow:
                  '0 16px 40px -14px rgba(255,102,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
              }
            : {
                color: 'hsl(var(--foreground))',
                borderColor: 'rgba(255,255,255,0.06)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.005) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 22px -12px rgba(0,0,0,0.65)',
              }
        }
      >
        <span className={emphasis ? 'text-white' : 'text-orange-300'}>{icon}</span>
        {label}
      </Link>
    </motion.div>
  )
}

function MetricTile({
  label,
  primary,
  primaryMono,
  unit,
  secondary,
  secondaryAccent,
}: {
  label: string
  primary: string
  primaryMono?: boolean
  unit?: string
  secondary?: string
  secondaryAccent?: 'positive' | 'negative'
}) {
  const secondaryColor =
    secondaryAccent === 'positive' ? 'text-orange-200'
    : secondaryAccent === 'negative' ? 'text-orange-400/80'
    : 'text-muted-foreground'
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/[0.05] p-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0.005) 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 28px -18px rgba(0,0,0,0.7)',
      }}
    >
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-orange-300/80">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <p
          className={`text-[15px] font-semibold leading-tight tracking-[-0.01em] text-foreground ${
            primaryMono ? 'font-mono text-[24px] tabular-nums tracking-[-0.03em]' : ''
          }`}
        >
          {primary}
        </p>
        {unit && <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{unit}</span>}
      </div>
      {secondary && (
        <p className={`mt-1 font-mono text-[10px] tabular-nums ${secondaryColor}`}>{secondary}</p>
      )}
    </motion.div>
  )
}

function Section({
  title, icon, count, countVariant = 'secondary', children, className,
}: {
  title: string
  icon?: React.ReactNode
  count?: number
  countVariant?: 'secondary' | 'destructive'
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-2.5 flex items-center gap-1.5 border-b border-white/[0.04] pb-2">
        {icon}
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
        {count !== undefined && (
          <Badge variant={countVariant} className="h-4 px-1.5 font-mono text-[10px] tabular-nums">{count}</Badge>
        )}
      </div>
      {children}
    </section>
  )
}
