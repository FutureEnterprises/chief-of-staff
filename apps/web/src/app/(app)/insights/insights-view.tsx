'use client'
import { GlassCard } from '@/components/ui/glass-card'
import { PageTransition, StaggerList, StaggerItem, motion, AnimatedCounter } from '@/components/motion/animations'
import { CheckCircle2, Clock, TrendingUp, AlertTriangle, Flame } from 'lucide-react'
import { getPriorityLabel, getPriorityHex } from '@/lib/utils'
import { ShareButton } from '@/components/share/share-card'

interface InsightsViewProps {
  userId: string
  userName: string
  executionScore: number
  currentStreak: number
  longestStreak: number
  completedLast7Days: number
  completedLast30Days: number
  openTasks: number
  overdueTasks: number
  tasksByPriority: Array<{ priority: string; count: number }>
  completionEvents: string[]
}

export function InsightsView({
  userId,
  userName,
  executionScore,
  currentStreak,
  longestStreak,
  completedLast7Days,
  completedLast30Days,
  openTasks,
  overdueTasks,
  tasksByPriority,
}: InsightsViewProps) {
  const completionRate =
    completedLast30Days + openTasks > 0
      ? Math.round((completedLast30Days / (completedLast30Days + openTasks)) * 100)
      : 0

  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SOMEDAY']
  const sortedPriorities = [...tasksByPriority].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  )
  const maxPriorityCount = Math.max(...tasksByPriority.map((p) => p.count), 1)

  const metrics = [
    { icon: CheckCircle2, label: 'Done this week', value: completedLast7Days, color: 'var(--status-completed)' },
    { icon: TrendingUp, label: 'Done this month', value: completedLast30Days, color: 'var(--status-open)' },
    { icon: Clock, label: 'Open tasks', value: openTasks, color: 'var(--status-in-progress)' },
    { icon: AlertTriangle, label: 'Overdue', value: overdueTasks, color: overdueTasks > 0 ? 'var(--status-blocked)' : 'var(--status-completed)' },
  ]

  return (
    <PageTransition className="relative mx-auto max-w-4xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-1">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your productivity patterns over the last 30 days</p>
        </div>
        <ShareButton userId={userId} executionScore={executionScore} currentStreak={currentStreak} userName={userName} />
      </div>

      {/* Execution Score hero card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <GlassCard variant="orange-glow" className="flex flex-col items-center p-8 text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          <div className="flex flex-col items-center sm:items-start">
            <p className="label-xs mb-2 text-orange-500">Execution Score</p>
            <div className="flex items-baseline gap-2">
              <AnimatedCounter value={executionScore} className="text-6xl font-black tabular-nums text-foreground" />
              <span className="text-xl text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="mt-4 flex gap-6 sm:mt-0 sm:flex-col sm:gap-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-foreground">{currentStreak}-day streak</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Longest: {longestStreak} days
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Metric cards */}
      <StaggerList className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m, i) => (
          <StaggerItem key={i}>
            <GlassCard borderColor={m.color} hover>
              <div className="mb-2 inline-flex rounded-xl p-2.5" style={{ backgroundColor: `${m.color}15` }}>
                <m.icon className="h-4 w-4" style={{ color: m.color }} />
              </div>
              <AnimatedCounter value={m.value} className="text-2xl font-bold tabular-nums text-foreground" />
              <p className="mt-0.5 label-xs text-muted-foreground">{m.label}</p>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion rate */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <h3 className="heading-4 mb-4">30-Day Completion Rate</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold tabular-nums text-foreground">
                <AnimatedCounter value={completionRate} />%
              </span>
              <span className="mb-1 text-sm text-muted-foreground">
                {completedLast30Days} of {completedLast30Days + openTasks} tasks
              </span>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-warm"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {completionRate >= 80 ? 'Excellent completion rate. Keep it up.' : completionRate >= 60 ? 'Good progress. Focus on clearing the backlog.' : 'Consider reducing open tasks or increasing focus time.'}
            </p>
          </GlassCard>
        </motion.div>

        {/* Priority breakdown */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard>
            <h3 className="heading-4 mb-4">Open Tasks by Priority</h3>
            {sortedPriorities.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">No open tasks — nice work.</p>
            ) : (
              <div className="space-y-3">
                {sortedPriorities.map((item, i) => (
                  <div key={item.priority}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-foreground">{getPriorityLabel(item.priority)}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getPriorityHex(item.priority) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((item.count / maxPriorityCount) * 100)}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Coaching notes */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
          <GlassCard>
            <h3 className="heading-4 mb-4">Coaching Note</h3>
            <div className="space-y-3 text-sm">
              {overdueTasks > 5 && (
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--status-blocked)10', borderLeft: '3px solid var(--status-blocked)' }}>
                  <p style={{ color: 'var(--status-blocked)' }}>You have {overdueTasks} overdue tasks. Consider a triage session to reschedule, delegate, or archive them.</p>
                </div>
              )}
              {tasksByPriority.find((p) => p.priority === 'CRITICAL' && p.count > 3) && (
                <div className="rounded-xl border-l-[3px] border-amber-500 bg-amber-500/10 p-3">
                  <p className="text-amber-600 dark:text-amber-400">You have more than 3 critical tasks. Not everything can be critical — consider downgrading some.</p>
                </div>
              )}
              {completedLast7Days >= 10 && (
                <div className="rounded-xl border-l-[3px] bg-emerald-500/10 p-3" style={{ borderColor: 'var(--status-completed)' }}>
                  <p className="text-emerald-600 dark:text-emerald-400">You completed {completedLast7Days} tasks this week. Strong execution — make sure you&apos;re making progress on the most important items.</p>
                </div>
              )}
              {completedLast7Days === 0 && openTasks > 0 && (
                <div className="rounded-xl border-l-[3px] border-muted-foreground/30 bg-muted p-3">
                  <p className="text-muted-foreground">No tasks completed this week yet. Try starting with one small win today to build momentum.</p>
                </div>
              )}
              {overdueTasks === 0 && completionRate >= 70 && (
                <div className="rounded-xl border-l-[3px] bg-emerald-500/10 p-3" style={{ borderColor: 'var(--status-completed)' }}>
                  <p className="text-emerald-600 dark:text-emerald-400">No overdue tasks and a strong completion rate. Your execution system is working well.</p>
                </div>
              )}
              {overdueTasks <= 5 && completedLast7Days < 10 && completionRate < 70 && openTasks === 0 && (
                <p className="text-muted-foreground/60 text-sm">Complete some tasks to see coaching insights here.</p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </PageTransition>
  )
}
