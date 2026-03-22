'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  completionEvents,
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

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Insights</h1>
        <p className="mt-1 text-sm text-zinc-500">Your productivity patterns over the last 30 days</p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          label="Done this week"
          value={completedLast7Days}
          color="green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Done this month"
          value={completedLast30Days}
          color="blue"
        />
        <MetricCard
          icon={Clock}
          label="Open tasks"
          value={openTasks}
          color="zinc"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Overdue"
          value={overdueTasks}
          color={overdueTasks > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">30-Day Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-zinc-900">{completionRate}%</span>
              <span className="mb-1 text-sm text-zinc-500">
                {completedLast30Days} of {completedLast30Days + openTasks} tasks
              </span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              {completionRate >= 80
                ? 'Excellent completion rate. Keep it up.'
                : completionRate >= 60
                  ? 'Good progress. Focus on clearing the backlog.'
                  : 'Consider reducing your open task count or increasing focus time.'}
            </p>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedPriorities.length === 0 ? (
              <p className="text-sm text-zinc-400">No open tasks</p>
            ) : (
              <div className="space-y-3">
                {sortedPriorities.map((item) => (
                  <div key={item.priority}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-zinc-700">
                        {getPriorityLabel(item.priority)}
                      </span>
                      <span className="text-zinc-500">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.round((item.count / maxPriorityCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coaching Note */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Coaching Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-zinc-600">
              {overdueTasks > 5 && (
                <p className="rounded-lg bg-red-50 p-3 text-red-700">
                  You have {overdueTasks} overdue tasks. Consider a dedicated triage session to reschedule, delegate, or archive these.
                </p>
              )}
              {tasksByPriority.find((p) => p.priority === 'CRITICAL' && p.count > 3) && (
                <p className="rounded-lg bg-amber-50 p-3 text-amber-700">
                  You have more than 3 critical tasks. By definition, not everything can be critical. Consider downgrading some.
                </p>
              )}
              {completedLast7Days >= 10 && (
                <p className="rounded-lg bg-green-50 p-3 text-green-700">
                  You completed {completedLast7Days} tasks this week. Strong execution — make sure you&apos;re also making progress on the most important items, not just the easiest ones.
                </p>
              )}
              {completedLast7Days === 0 && openTasks > 0 && (
                <p className="rounded-lg bg-zinc-50 p-3 text-zinc-700">
                  No tasks completed this week yet. Try starting with one small win today to build momentum.
                </p>
              )}
              {overdueTasks === 0 && completionRate >= 70 && (
                <p className="rounded-lg bg-green-50 p-3 text-green-700">
                  No overdue tasks and a strong completion rate. Your execution system is working well.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  const colors: Record<string, string> = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    zinc: 'text-zinc-600 bg-zinc-50',
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`mb-2 inline-flex rounded-lg p-2 ${colors[color] ?? colors['zinc']}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-2xl font-bold text-zinc-900">{value}</div>
        <p className="text-xs text-zinc-500">{label}</p>
      </CardContent>
    </Card>
  )
}
