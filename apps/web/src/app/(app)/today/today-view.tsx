'use client'
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
import { identitySentence } from '@/lib/identity-sentence'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

type ActiveCommitment = { id: string; rule: string; keepCount: number; breakCount: number } | null
type NextDangerWindow = { label: string; whenText: string; hoursUntil: number } | null

interface TodayViewProps {
  dueTodayTasks: TaskWithRelations[]
  followUpsDueToday: Array<Task & { tags: Array<{ tag: Tag }> }>
  overdueTasks: Array<Task & { tags: Array<{ tag: Tag }> }>
  recentlyCompleted: Task[]
  user: User
  activeCommitment?: ActiveCommitment
  nextDangerWindow?: NextDangerWindow
  topExcuseCategory?: string | null
  topExcuseCount?: number
  selfTrustDelta?: number | null
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
  topExcuseCategory,
  topExcuseCount,
  selfTrustDelta,
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
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-8">
      {/* Decorative gradient mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-60" />

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {greeting}, {firstName}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(new Date())}</p>
      </div>

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
            className={`mb-4 rounded-xl border-l-[3px] ${borderColor} bg-black/30 px-4 py-3`}
          >
            <p className={`text-[10px] font-mono uppercase tracking-widest ${textColor}`}>
              Identity read
            </p>
            <p className="mt-1 text-base font-bold text-foreground sm:text-lg">
              {id.headline}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{id.evidence}</p>
          </motion.div>
        )
      })()}

      {/* TONIGHT'S RULE — dominant hero */}
      {activeCommitment ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 overflow-hidden rounded-3xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent p-6 shadow-[0_0_40px_-10px_rgba(255,102,0,0.4)]"
        >
          <p className="label-xs mb-3 text-orange-500">Today&apos;s rule</p>
          <p className="text-2xl font-black leading-tight text-foreground sm:text-3xl md:text-4xl">
            {activeCommitment.rule}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            <span className="text-emerald-400">{activeCommitment.keepCount} kept</span>
            {activeCommitment.breakCount > 0 && (
              <> · <span className="text-red-400">{activeCommitment.breakCount} broken</span></>
            )}
            <Link href="/commitments" className="ml-3 text-orange-400 hover:text-orange-300">Manage →</Link>
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-3xl border-2 border-dashed border-orange-500/30 p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">No rule set yet.</p>
          <Link href="/commitments" className="mt-2 inline-block text-sm font-bold text-orange-400">
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
        className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <Link
          href="/rescue"
          className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 px-5 py-5 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_-5px_rgba(239,68,68,0.7)]"
        >
          <Flame className="h-5 w-5 transition-transform group-hover:rotate-12" />
          I&rsquo;m about to mess up
        </Link>
        <Link
          href="/decide"
          className="group flex items-center justify-center gap-3 rounded-2xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-transparent px-5 py-5 text-sm font-black uppercase tracking-wider text-foreground transition-all hover:scale-[1.02] hover:border-orange-500/60 hover:bg-orange-500/15"
        >
          <Brain className="h-5 w-5 text-orange-500 transition-transform group-hover:scale-110" />
          What should I do?
        </Link>
        <Link
          href="/slip"
          className="group flex items-center justify-center gap-3 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent px-5 py-5 text-sm font-black uppercase tracking-wider text-foreground transition-all hover:scale-[1.02] hover:border-amber-500/60 hover:bg-amber-500/15"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 transition-transform group-hover:scale-110" />
          I already slipped
        </Link>
      </motion.div>

      {/* Quick stats row — Next Danger Window + Self-Trust + Pattern */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <GlassCard className="!p-4">
          <p className="label-xs mb-2 text-orange-500">Next danger window</p>
          {nextDangerWindow ? (
            <>
              <p className="text-sm font-bold text-foreground">{nextDangerWindow.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{nextDangerWindow.whenText}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">None mapped yet</p>
          )}
        </GlassCard>

        <GlassCard className="!p-4">
          <p className="label-xs mb-2 text-orange-500">Self-Trust</p>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={user.selfTrustScore ?? 0} className="text-2xl font-black tabular-nums text-foreground" />
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          {selfTrustDelta != null && selfTrustDelta !== 0 && (
            <p className={`mt-0.5 text-xs font-semibold ${selfTrustDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {selfTrustDelta > 0 ? '↑' : '↓'} {Math.abs(selfTrustDelta)} this week
            </p>
          )}
        </GlassCard>

        <GlassCard className="!p-4">
          <p className="label-xs mb-2 text-orange-500">Excuse detected</p>
          {topExcuseCategory && topExcuseCount && topExcuseCount > 1 ? (
            <>
              <p className="text-sm font-bold leading-snug text-foreground">
                That&apos;s your &ldquo;{EXCUSE_TAG[topExcuseCategory] ?? topExcuseCategory.toLowerCase().replace('_', ' ')}&rdquo; excuse again.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {topExcuseCount}&times; this week. We&rsquo;ll catch it when it fires.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough data yet</p>
          )}
        </GlassCard>
      </motion.div>

      {/* Secondary CTAs — check-ins */}
      <div className="mb-8 flex flex-wrap gap-2">
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
        {/* Callout Mode — "Be brutally honest." Opens a modal that streams
            COYL's sharpest read of the user's current pattern, with share. */}
        <CalloutPanel
          userId={user.id}
          trigger={
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 transition-all hover:border-orange-500/60 hover:from-orange-500/20 hover:to-red-500/20 hover:shadow-[0_0_16px_rgba(255,102,0,0.2)]">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              Be brutally honest
            </span>
          }
        />
      </div>

      {/* Stats */}
      <StaggerList className="mb-8 grid grid-cols-4 gap-3">
        {[
          { label: 'Due today', value: dueTodayTasks.length, color: 'var(--status-open)', icon: Clock },
          { label: 'Overdue', value: overdueTasks.length, color: overdueTasks.length > 0 ? 'var(--status-blocked)' : 'var(--status-completed)', icon: AlertTriangle },
          { label: 'Follow-ups', value: followUpsDueToday.length, color: 'var(--status-in-progress)', icon: RefreshCw },
          { label: 'Done today', value: recentlyCompleted.length, color: 'var(--status-completed)', icon: CheckCircle2 },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <GlassCard borderColor={stat.color} hover>
              <div className="flex items-start justify-between">
                <AnimatedCounter value={stat.value} className="text-2xl font-bold leading-none" />
                <div className="rounded-lg p-1.5" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="mt-2 label-xs text-muted-foreground">{stat.label}</div>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Top priorities */}
      {criticalTasks.length > 0 && (
        <Section
          title="Top priorities"
          icon={<Zap className="h-3.5 w-3.5 text-amber-500" />}
          count={criticalTasks.length}
          className="mb-6"
        >
          <StaggerList className="space-y-2">
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
        <Section title="Due today" count={dueTodayTasks.length} className="mb-6">
          <StaggerList className="space-y-2">
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
          icon={<RefreshCw className="h-3.5 w-3.5 text-amber-500" />}
          count={followUpsDueToday.length}
          className="mb-6"
        >
          <StaggerList className="space-y-2">
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
          icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          count={overdueTasks.length}
          countVariant="destructive"
          className="mb-6"
        >
          <StaggerList className="space-y-2">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
            <Separator className="mb-6" />
            <Section
              title="Completed today"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              count={recentlyCompleted.length}
            >
              <div className="space-y-1">
                {recentlyCompleted.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-muted/50">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="text-sm text-muted-foreground line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-warm text-white shadow-lg shadow-orange-500/25 animate-pulse-glow"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
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
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="label-xs text-muted-foreground">{title}</h2>
        {count !== undefined && (
          <Badge variant={countVariant} className="h-4 px-1.5 text-[10px]">{count}</Badge>
        )}
      </div>
      {children}
    </section>
  )
}
