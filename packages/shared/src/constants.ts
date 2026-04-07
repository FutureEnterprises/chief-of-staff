export const STATUS_LABELS: Record<string, string> = {
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

export const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  SOMEDAY: 'Someday',
}

export const STATUS_COLORS: Record<string, string> = {
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

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#2563eb',
  LOW: '#64748b',
  SOMEDAY: '#a1a1aa',
}

export const BRAND = {
  orange: '#ff6600',
  charcoal: '#1a1a1a',
  cream: '#f5f5f0',
  gradientWarmStart: '#ff6600',
  gradientWarmEnd: '#ff3d00',
} as const
