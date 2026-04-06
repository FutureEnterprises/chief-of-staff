'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTransition, StaggerList, StaggerItem, motion } from '@/components/motion/animations'
import { CheckCircle2, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { getPriorityLabel } from '@/lib/utils'

interface InsightsViewProps {
  completedLast7Days: number
  completedLast30Days: number
  openTasks: number
  overdueTasks: number
  tasksByPriority: Array<{ priority: string; count: number }>
  completionEvents: string[]
}

export function InsightsView({
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
    { icon: CheckCircle2, label: 'Done this week', value: completedLast7Days, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
    { icon: TrendingUp, label: 'Done this month', value: completedLast30Days, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
    { icon: Clock, label: 'Open tasks', value: openTasks, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
    { icon: AlertTriangle, label: 'Overdue', value: overdueTasks, color: overdueTasks > 0 ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
  ]

  const priorityBarColors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-teal-500',
    LOW: 'bg-blue-400',
    SOMEDAY: 'bg-zinc-300',
  }

  return (
    <PageTransition className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Insights
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Your productivity patterns over the last 30 days</p>
      </div>

      {/* Metric cards */}
      <StaggerList className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m, i) => (
          <StaggerItem key={i}>
            <Card className="overflow-hidden">
              <CardContent className="pt-5">
                <div className={`mb-3 inline-flex rounded-lg p-2 ${m.color}`}>
                  <m.icon className="h-4 w-4" />
                </div>
                <AnimatedNumber value={m.value} />
                <p className="mt-0.5 text-xs text-zinc-500">{m.label}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion rate */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">30-Day Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {completionRate}%
                </span>
                <span className="mb-1 text-sm text-zinc-500">
                  {completedLast30Days} of {completedLast30Days + openTasks} tasks
                </span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {completionRate >= 80
                  ? 'Excellent completion rate. Keep it up.'
                  : completionRate >= 60
                    ? 'Good progress. Focus on clearing the backlog.'
                    : 'Consider reducing open tasks or increasing focus time.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPriorities.length === 0 ? (
                <p className="text-sm text-zinc-400">No open tasks — nice work.</p>
              ) : (
                <div className="space-y-3">
                  {sortedPriorities.map((item, i) => (
                    <div key={item.priority}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {getPriorityLabel(item.priority)}
                        </span>
                        <span className="text-zinc-500">{item.count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <motion.div
                          className={`h-full rounded-full ${priorityBarColors[item.priority] ?? 'bg-zinc-400'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((item.count / maxPriorityCount) * 100)}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Coaching note */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coaching Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {overdueTasks > 5 && (
                  <p className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                    You have {overdueTasks} overdue tasks. Consider a triage session to reschedule, delegate, or archive them.
                  </p>
                )}
                {tasksByPriority.find((p) => p.priority === 'CRITICAL' && p.count > 3) && (
                  <p className="rounded-lg bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    You have more than 3 critical tasks. By definition, not everything can be critical — consider downgrading some.
                  </p>
                )}
                {completedLast7Days >= 10 && (
                  <p className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    You completed {completedLast7Days} tasks this week. Strong execution — make sure you&apos;re making progress on the most important items, not just the easiest.
                  </p>
                )}
                {completedLast7Days === 0 && openTasks > 0 && (
                  <p className="rounded-lg bg-zinc-50 p-3 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    No tasks completed this week yet. Try starting with one small win today to build momentum.
                  </p>
                )}
                {overdueTasks === 0 && completionRate >= 70 && (
                  <p className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    No overdue tasks and a strong completion rate. Your execution system is working well.
                  </p>
                )}
                {overdueTasks <= 5 && completedLast7Days < 10 && completionRate < 70 && openTasks === 0 && (
                  <p className="text-zinc-400 text-sm">Complete some tasks to see coaching insights here.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50"
    >
      {value}
    </motion.div>
  )
}
