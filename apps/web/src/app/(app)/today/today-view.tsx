'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import type { Task, User, Tag } from '@repo/database'
import { MotionButton } from '@/components/ui/motion-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskCreateModal } from '@/components/tasks/task-create-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { StaggerList, StaggerItem, PageTransition } from '@/components/motion/animations'
import {
  Sun,
  Moon,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap,
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
    <PageTransition className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(new Date())}</p>
        </div>
        <div className="flex gap-2">
          <MotionButton variant="outline" size="sm" asChild>
            <Link href="/chat?mode=morning">
              <Sun className="h-3.5 w-3.5" /> Morning
            </Link>
          </MotionButton>
          <MotionButton variant="outline" size="sm" asChild>
            <Link href="/chat?mode=night">
              <Moon className="h-3.5 w-3.5" /> Night review
            </Link>
          </MotionButton>
        </div>
      </div>

      {/* Stats */}
      <StaggerList className="mb-8 grid grid-cols-4 gap-3">
        {[
          { label: 'Due today', value: dueTodayTasks.length, color: 'blue', icon: Clock },
          {
            label: 'Overdue',
            value: overdueTasks.length,
            color: overdueTasks.length > 0 ? 'red' : 'green',
            icon: AlertTriangle,
          },
          { label: 'Follow-ups', value: followUpsDueToday.length, color: 'amber', icon: RefreshCw },
          { label: 'Done today', value: recentlyCompleted.length, color: 'teal', icon: CheckCircle2 },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <StatCard {...stat} />
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
          <EmptyState
            icon={CheckCircle2}
            title="All caught up"
            description="Nothing urgent needs your attention right now. Great execution."
            action={
              <MotionButton size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Add a task
              </MotionButton>
            }
          />
        </motion.div>
      )}

      {/* Recently completed */}
      <AnimatePresence>
        {recentlyCompleted.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <Separator className="mb-6" />
            <Section
              title="Completed today"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />}
              count={recentlyCompleted.length}
            >
              <div className="space-y-1">
                {recentlyCompleted.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg"
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
  title,
  icon,
  count,
  countVariant = 'secondary',
  children,
  className,
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
      <div className="mb-2.5 flex items-center gap-1.5">
        {icon}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {count !== undefined && (
          <Badge variant={countVariant} className="h-4 px-1.5 text-[10px]">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </section>
  )
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ElementType
}) {
  const styles: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
    red: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    green: 'text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400',
    teal: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400',
  }
  return (
    <div className={`rounded-xl p-3.5 ${styles[color] ?? styles['blue']}`}>
      <div className="flex items-start justify-between">
        <div className="text-2xl font-bold leading-none">{value}</div>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <div className="mt-1.5 text-[11px] font-medium opacity-80">{label}</div>
    </div>
  )
}
