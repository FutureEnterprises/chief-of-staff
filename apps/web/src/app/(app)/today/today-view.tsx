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

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

interface TodayViewProps {
  dueTodayTasks: TaskWithRelations[]
  followUpsDueToday: Array<Task & { tags: Array<{ tag: Tag }> }>
  overdueTasks: Array<Task & { tags: Array<{ tag: Tag }> }>
  recentlyCompleted: Task[]
  user: User
}

export function TodayView({
  dueTodayTasks,
  followUpsDueToday,
  overdueTasks,
  recentlyCompleted,
  user,
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-1">
            {greeting}, <span className="text-gradient-warm">{firstName}</span>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="brand" size="sm" asChild>
            <Link href="/rescue">
              <Flame className="h-3.5 w-3.5" /> Rescue
            </Link>
          </Button>
          <Button variant="glass" size="sm" asChild>
            <Link href="/decide">
              <Brain className="h-3.5 w-3.5 text-orange-500" /> Decide
            </Link>
          </Button>
          <Button variant="glass" size="sm" asChild>
            <Link href="/chat?mode=morning">
              <Sun className="h-3.5 w-3.5 text-amber-500" /> Morning
            </Link>
          </Button>
          <Button variant="glass" size="sm" asChild>
            <Link href="/chat?mode=night">
              <Moon className="h-3.5 w-3.5 text-indigo-400" /> Night review
            </Link>
          </Button>
        </div>
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
