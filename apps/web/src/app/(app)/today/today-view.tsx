'use client'
/**
 * AESTHETIC UPGRADE — May 2026 (operator surface)
 * Refero references applied:
 *   - 554b801c-3b31-4086-a7e5-ae613cdd618b (Linear): midnight command-center
 *     layering, compact 24px section gap, monospace metadata, single accent
 *     restraint, 6px card radius, tight letter-spacing.
 *   - 6e9baa82-2f2f-4e77-8b0d-566325635dbe (Axiom): industrial precision —
 *     2px radius on rectangular surfaces, single orange CTA spotlight,
 *     monospace data labels, thin medium-gray borders for tonal separation.
 *   - 11d3e58a-87d7-4a9a-bbf5-720f4fd3ffc6 (Linear Changelog): mono
 *     timestamps, tabular-nums data alignment, ghost capsule pills,
 *     compact element gap, refined medium-weight headlines.
 * Density/typography tightened for daily-use surface. Brand orange preserved.
 */
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import type { Task, User, Tag } from '@repo/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GlassCard } from '@/components/ui/glass-card'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskCreateModal } from '@/components/tasks/task-create-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { StaggerList, StaggerItem, PageTransition, AnimatedCounter } from '@/components/motion/animations'
import {
  Sun, Moon, Plus, CheckCircle2, AlertTriangle,
  RefreshCw, Clock, Zap, Flame, Brain,
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
  /** The window the user is INSIDE right now (their local time matches an
   *  active danger window). When present, /today renders a real-time
   *  intervention banner instead of waiting for the user to find Rescue. */
  activeDangerWindow?: ActiveDangerWindow
  topExcuseCategory?: string | null
  topExcuseCount?: number
  selfTrustDelta?: number | null
  hasWebPushSubscription?: boolean
  hasMobilePush?: boolean
  hasDangerWindows?: boolean
}

// The word COYL uses to name this excuse category when calling it out.
// "That's your 'tomorrow' excuse again" — the short tag goes inside the
// quote. Keeps the spec voice consistent with onboarding + patterns.
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

  return (
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-6">
      {/* Decorative gradient mesh — Linear-style restrained ambient lift */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      {/* Header — operator-style metadata rail. Greeting + monospace timestamp,
          flush-baseline. Mirrors Linear Changelog's date treatment. */}
      <div className="mb-5 flex items-baseline justify-between border-b border-white/[0.06] pb-3">
        <p className="label-xs text-foreground/90">
          {greeting}, {firstName}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] tabular-nums text-muted-foreground">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Browser push enablement — only renders if the user has danger
          windows mapped, no existing subscription, and hasn't dismissed
          recently. Closes the "I get the value at risk windows" promise
          for users who don't have the mobile app yet. */}
      <WebPushEnableBanner
        alreadySubscribed={hasWebPushSubscription}
        hasDangerWindows={hasDangerWindows}
        hasMobilePush={hasMobilePush}
      />

      {/* RECOVERY MODE — explicit banner when the user just slipped.
          Per the May 2026 audit §4.4: the brand promise is "no restart,
          continue." This banner makes the promise visible. Hides streak
          surface in the IDENTITY LINE below by short-circuiting the
          warning tone — recovery is its own state, not a guilt state.
          Auto-clears 24h after the slip via the existing recoveryState
          state machine in lib/user-state.ts. */}
      {(user.recoveryState === 'SLIPPED' || user.recoveryState === 'RECOVERING') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-3 overflow-hidden rounded-md border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <span className="text-sm font-bold">↺</span>
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">RECOVERY MODE · 24H</p>
              <p className="mt-1.5 text-base font-semibold leading-tight tracking-[-0.01em] text-foreground">
                You slipped. Good. Now we stop the damage.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Streak preserved. No Monday reset. One tiny better move and you&rsquo;re back.
              </p>
              <Link
                href="/slip"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                Build the recovery plan →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* INSIDE A DANGER WINDOW RIGHT NOW.
          The single most important UI state in the product. When the user
          is currently inside a known risk window, /today turns into a
          live intervention surface — pulsing red border, the window name,
          how many minutes they've been in it, and a one-tap rescue path.
          The same matching logic the danger-window-interrupt cron uses
          for push notifications, surfaced server-side at page render so
          a user without mobile installed (Core, or pre-launch mobile)
          still sees the moment. */}
      {activeDangerWindow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mb-3 overflow-hidden rounded-md border border-red-500/60 bg-gradient-to-br from-red-500/[0.10] via-orange-500/[0.05] to-transparent p-4 shadow-[0_0_36px_-10px_rgba(239,68,68,0.45),inset_0_1px_0_0_rgba(255,255,255,0.02)]"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-red-500/30 bg-red-500/15 text-red-300"
            >
              <Flame className="h-4 w-4" />
            </motion.div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-400 tabular-nums">
                YOU&rsquo;RE IN: {activeDangerWindow.label.toUpperCase()} &middot; {activeDangerWindow.minutesIn} MIN IN
              </p>
              <p className="mt-1.5 text-lg font-semibold leading-tight tracking-[-0.015em] text-foreground sm:text-xl">
                This is the moment your autopilot runs.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                You already know how it ends if nothing interrupts it. One tap, one different choice, the night doesn&rsquo;t turn into the week.
              </p>
              <Link
                href={`/rescue?windowId=${activeDangerWindow.id}&from=danger_window`}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_16px_-3px_rgba(239,68,68,0.6)] transition-shadow hover:shadow-[0_0_24px_-3px_rgba(239,68,68,0.8)]"
              >
                Open rescue &rarr;
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* IDENTITY LINE — the accusatory/affirming one-liner from
          identity-sentence.ts. Sets the emotional register for the page.
          Deterministic from user data, no AI latency. */}
      {(() => {
        const id = identitySentence({
          identityState: user.identityState ?? null,
          recoveryState: user.recoveryState ?? null,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          slipsThisMonth: user.slipsThisMonth,
          selfTrustScore: user.selfTrustScore ?? 0,
        })
        const borderColor =
          id.tone === 'warning' ? 'border-red-500/30'
          : id.tone === 'positive' ? 'border-emerald-500/30'
          : 'border-orange-500/30'
        const textColor =
          id.tone === 'warning' ? 'text-red-300'
          : id.tone === 'positive' ? 'text-emerald-300'
          : 'text-orange-300'
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-3 rounded-sm border-l-2 ${borderColor} bg-white/[0.02] px-4 py-2.5`}
          >
            <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${textColor}`}>
              Identity read
            </p>
            <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-foreground sm:text-base">
              {id.headline}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{id.evidence}</p>
          </motion.div>
        )
      })()}

      {/* TONIGHT'S RULE — dominant hero. Axiom-inspired: charcoal card,
          single orange accent, refined medium-weight headline (not black). */}
      {activeCommitment ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 overflow-hidden rounded-md border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.10] via-orange-500/[0.03] to-transparent p-5 shadow-[0_0_28px_-12px_rgba(255,102,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.03)]"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500">Today&apos;s rule</p>
          <p className="mt-2 text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-3xl">
            {activeCommitment.rule}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-3 text-[11px] font-mono tabular-nums">
            <span className="text-muted-foreground">
              <span className="text-emerald-400">{activeCommitment.keepCount} kept</span>
              {activeCommitment.breakCount > 0 && (
                <> · <span className="text-red-400">{activeCommitment.breakCount} broken</span></>
              )}
            </span>
            <Link href="/commitments" className="text-orange-400 hover:text-orange-300">Manage →</Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-md border border-dashed border-orange-500/25 bg-white/[0.01] p-5 text-center"
        >
          <p className="text-[13px] text-muted-foreground">No rule set yet.</p>
          <Link href="/commitments" className="mt-1.5 inline-block text-[13px] font-semibold text-orange-400 hover:text-orange-300">
            Set today&apos;s rule →
          </Link>
        </motion.div>
      )}

      {/* THREE-CTA ROW — the core UX primitives from the spec.
          All three equal-weight; slip gets promoted out of the secondary
          row because recovery is as important as prevention. Stacks
          1-col mobile, 3-col desktop. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3"
      >
        <Link
          href="/rescue"
          className="group flex items-center justify-center gap-2.5 rounded-md bg-gradient-to-br from-red-500 to-orange-600 px-4 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_22px_-6px_rgba(239,68,68,0.5),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-all hover:shadow-[0_0_36px_-6px_rgba(239,68,68,0.75)]"
        >
          <Flame className="h-4 w-4 transition-transform group-hover:rotate-12" />
          I&rsquo;m about to mess up
        </Link>
        <Link
          href="/decide"
          className="group flex items-center justify-center gap-2.5 rounded-md border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] to-transparent px-4 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-foreground transition-all hover:border-orange-500/50 hover:bg-orange-500/[0.12]"
        >
          <Brain className="h-4 w-4 text-orange-500 transition-transform group-hover:scale-110" />
          What should I do?
        </Link>
        <Link
          href="/slip"
          className="group flex items-center justify-center gap-2.5 rounded-md border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent px-4 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-foreground transition-all hover:border-amber-500/50 hover:bg-amber-500/[0.12]"
        >
          <AlertTriangle className="h-4 w-4 text-amber-500 transition-transform group-hover:scale-110" />
          I already slipped
        </Link>
      </motion.div>

      {/* Quick stats row — Linear-style metric panels. Tight 12px padding,
          monospace labels, hairline borders, tabular-nums for data alignment. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-3"
      >
        <GlassCard className="!p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500/90">Next danger window</p>
          {nextDangerWindow ? (
            <>
              <p className="mt-1.5 text-[13px] font-semibold tracking-[-0.01em] text-foreground">{nextDangerWindow.label}</p>
              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">{nextDangerWindow.whenText}</p>
            </>
          ) : (
            <p className="mt-1.5 text-[13px] text-muted-foreground">None mapped yet</p>
          )}
        </GlassCard>

        <GlassCard className="!p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500/90">Self-Trust</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <AnimatedCounter value={user.selfTrustScore ?? 0} className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground" />
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">/ 100</span>
          </div>
          {selfTrustDelta != null && selfTrustDelta !== 0 && (
            <p className={`mt-0.5 font-mono text-[10px] font-semibold tabular-nums ${selfTrustDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {selfTrustDelta > 0 ? '↑' : '↓'} {Math.abs(selfTrustDelta)} this week
            </p>
          )}
        </GlassCard>

        <GlassCard className="!p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500/90">Excuse detected</p>
          {topExcuseCategory && topExcuseCount && topExcuseCount > 1 ? (
            <>
              <p className="mt-1.5 text-[13px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
                That&apos;s your &ldquo;{EXCUSE_TAG[topExcuseCategory] ?? topExcuseCategory.toLowerCase().replace('_', ' ')}&rdquo; excuse again.
              </p>
              <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                {topExcuseCount}&times; this week · we&rsquo;ll catch it
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-[13px] text-muted-foreground">Not enough data yet</p>
          )}
        </GlassCard>
      </motion.div>

      {/* Recent interrupts — visible proof the JITAI claim is real.
          Server-rendered shell, client component fetches the data
          (small list, mostly cached). Closes the "is COYL actually
          firing for me" question without making the user check email. */}
      <div className="mb-5">
        <InterruptHistory />
      </div>

      {/* Secondary CTAs — Linear Changelog ghost-capsule pills. */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Button variant="glass" size="sm" asChild>
          <Link href="/chat?mode=morning">
            <Sun className="h-3.5 w-3.5 text-amber-500" /> Set today&apos;s rule
          </Link>
        </Button>
        <Button variant="glass" size="sm" asChild>
          <Link href="/chat?mode=night">
            <Moon className="h-3.5 w-3.5 text-indigo-400" /> Did you keep your word?
          </Link>
        </Button>
        <CalloutPanel
          userId={user.id}
          trigger={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/[0.06] px-3 py-1 text-[11px] font-semibold text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/[0.12]">
              <Flame className="h-3 w-3 text-orange-400" />
              Be brutally honest
            </span>
          }
        />
      </div>

      {/* Stats — Linear dashboard tile pattern. Tight gap, mono labels,
          tabular numerals, hairline tonal separation. */}
      <StaggerList className="mb-6 grid grid-cols-4 gap-2">
        {[
          { label: 'Due today', value: dueTodayTasks.length, color: 'var(--status-open)', icon: Clock },
          { label: 'Overdue', value: overdueTasks.length, color: overdueTasks.length > 0 ? 'var(--status-blocked)' : 'var(--status-completed)', icon: AlertTriangle },
          { label: 'Follow-ups', value: followUpsDueToday.length, color: 'var(--status-in-progress)', icon: RefreshCw },
          { label: 'Done today', value: recentlyCompleted.length, color: 'var(--status-completed)', icon: CheckCircle2 },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <GlassCard borderColor={stat.color} hover>
              <div className="flex items-start justify-between">
                <AnimatedCounter value={stat.value} className="text-2xl font-semibold leading-none tabular-nums tracking-[-0.02em]" />
                <div className="rounded-sm p-1" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.10em] text-muted-foreground">{stat.label}</div>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Top priorities */}
      {criticalTasks.length > 0 && (
        <Section
          title="Top priorities"
          icon={<Zap className="h-3 w-3 text-amber-500" />}
          count={criticalTasks.length}
          className="mb-5"
        >
          <StaggerList className="space-y-1.5">
            {criticalTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} compact />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Due today */}
      {dueTodayTasks.length > 0 && (
        <Section title="Due today" count={dueTodayTasks.length} className="mb-5">
          <StaggerList className="space-y-1.5">
            {dueTodayTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Follow-ups */}
      {followUpsDueToday.length > 0 && (
        <Section
          title="Follow-ups due"
          icon={<RefreshCw className="h-3 w-3 text-amber-500" />}
          count={followUpsDueToday.length}
          className="mb-5"
        >
          <StaggerList className="space-y-1.5">
            {followUpsDueToday.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} showFollowUp />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <Section
          title="Overdue"
          icon={<AlertTriangle className="h-3 w-3 text-red-500" />}
          count={overdueTasks.length}
          countVariant="destructive"
          className="mb-5"
        >
          <StaggerList className="space-y-1.5">
            {overdueTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} showOverdue />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Empty state */}
      {totalAttention === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <GlassCard className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm"
            >
              <CheckCircle2 className="h-8 w-8 text-white" />
            </motion.div>
            <h3 className="heading-3 text-foreground">All caught up</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              Nothing urgent needs your attention right now. Great execution.
            </p>
            <Button variant="brand" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add a task
            </Button>
          </GlassCard>
        </motion.div>
      )}

      {/* Recently completed */}
      <AnimatePresence>
        {recentlyCompleted.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <Separator className="mb-5" />
            <Section
              title="Completed today"
              icon={<CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              count={recentlyCompleted.length}
            >
              <div className="space-y-0.5">
                {recentlyCompleted.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-sm px-2.5 py-1.5 transition-colors hover:bg-white/[0.02]">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-[13px] text-muted-foreground line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — slightly more rectangular per operator aesthetic */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-md bg-gradient-warm text-white shadow-[0_0_24px_-4px_rgba(255,102,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] animate-pulse-glow"
        aria-label="Add task"
      >
        <Plus className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {showCreateModal && (
          <TaskCreateModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </PageTransition>
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
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
        {count !== undefined && (
          <Badge variant={countVariant} className="h-4 px-1.5 font-mono text-[10px] tabular-nums">{count}</Badge>
        )}
      </div>
      {children}
    </section>
  )
}
