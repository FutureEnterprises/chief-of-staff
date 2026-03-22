import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  return formatDate(d)
}

export function getDaysOverdue(dueAt: Date | string): number {
  const d = typeof dueAt === 'string' ? new Date(dueAt) : dueAt
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueAt: Date | string | null | undefined): boolean {
  if (!dueAt) return false
  const d = typeof dueAt === 'string' ? new Date(dueAt) : dueAt
  return d < new Date()
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: 'text-red-500 bg-red-50 border-red-200',
    HIGH: 'text-orange-500 bg-orange-50 border-orange-200',
    MEDIUM: 'text-blue-500 bg-blue-50 border-blue-200',
    LOW: 'text-zinc-500 bg-zinc-50 border-zinc-200',
    SOMEDAY: 'text-zinc-400 bg-zinc-50 border-zinc-100',
  }
  return colors[priority] ?? colors['MEDIUM']!
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    SOMEDAY: 'Someday',
  }
  return labels[priority] ?? 'Medium'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    INBOX: 'Inbox',
    OPEN: 'Open',
    PLANNED: 'Planned',
    IN_PROGRESS: 'In Progress',
    BLOCKED: 'Blocked',
    WAITING: 'Waiting',
    SNOOZED: 'Snoozed',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
  }
  return labels[status] ?? status
}

export function getEffortLabel(effort: string | null | undefined): string {
  if (!effort) return ''
  const labels: Record<string, string> = {
    FIVE_MIN: '5 min',
    FIFTEEN_MIN: '15 min',
    THIRTY_MIN: '30 min',
    ONE_HOUR: '1 hr',
    TWO_HOURS: '2 hrs',
    HALF_DAY: 'Half day',
    FULL_DAY: 'Full day',
    MULTI_DAY: 'Multi-day',
  }
  return labels[effort] ?? effort
}
