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

/* ── Status colors ───────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  INBOX: 'var(--status-inbox)',
  OPEN: 'var(--status-open)',
  PLANNED: 'var(--status-planned)',
  IN_PROGRESS: 'var(--status-in-progress)',
  BLOCKED: 'var(--status-blocked)',
  WAITING: 'var(--status-waiting)',
  SNOOZED: 'var(--status-snoozed)',
  COMPLETED: 'var(--status-completed)',
  ARCHIVED: 'var(--status-archived)',
}

const STATUS_HEX: Record<string, string> = {
  INBOX: '#8b5cf6',
  OPEN: '#3b82f6',
  PLANNED: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  BLOCKED: '#ef4444',
  WAITING: '#a855f7',
  SNOOZED: '#64748b',
  COMPLETED: '#10b981',
  ARCHIVED: '#94a3b8',
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS['OPEN']!
}

export function getStatusHex(status: string): string {
  return STATUS_HEX[status] ?? STATUS_HEX['OPEN']!
}

export function getStatusBadgeVariant(status: string): string {
  const map: Record<string, string> = {
    INBOX: 'status-inbox',
    OPEN: 'status-open',
    PLANNED: 'status-planned',
    IN_PROGRESS: 'status-in-progress',
    BLOCKED: 'status-blocked',
    WAITING: 'status-waiting',
    SNOOZED: 'status-snoozed',
    COMPLETED: 'status-completed',
    ARCHIVED: 'status-archived',
  }
  return map[status] ?? 'status-open'
}

/* ── Priority colors ─────────────────────────────────────────── */

const PRIORITY_HEX: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#2563eb',
  LOW: '#64748b',
  SOMEDAY: '#a1a1aa',
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    HIGH: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
    MEDIUM: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    LOW: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800',
    SOMEDAY: 'text-zinc-500 bg-zinc-50 border-zinc-200 dark:bg-zinc-950/30 dark:border-zinc-800',
  }
  return colors[priority] ?? colors['MEDIUM']!
}

export function getPriorityHex(priority: string): string {
  return PRIORITY_HEX[priority] ?? PRIORITY_HEX['MEDIUM']!
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
