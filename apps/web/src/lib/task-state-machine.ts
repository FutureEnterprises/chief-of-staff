// Define TaskStatus locally since Prisma client requires db:generate to be run first
export type TaskStatus =
  | 'INBOX'
  | 'OPEN'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'WAITING'
  | 'SNOOZED'
  | 'COMPLETED'
  | 'ARCHIVED'

// Valid state transitions
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  INBOX: ['OPEN', 'PLANNED', 'ARCHIVED'],
  OPEN: ['PLANNED', 'IN_PROGRESS', 'BLOCKED', 'WAITING', 'SNOOZED', 'COMPLETED', 'ARCHIVED'],
  PLANNED: ['IN_PROGRESS', 'BLOCKED', 'WAITING', 'SNOOZED', 'OPEN', 'COMPLETED', 'ARCHIVED'],
  IN_PROGRESS: ['COMPLETED', 'BLOCKED', 'WAITING', 'SNOOZED', 'PLANNED', 'OPEN', 'ARCHIVED'],
  BLOCKED: ['OPEN', 'PLANNED', 'IN_PROGRESS', 'ARCHIVED'],
  WAITING: ['OPEN', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'],
  SNOOZED: ['OPEN', 'PLANNED', 'IN_PROGRESS', 'ARCHIVED'],
  COMPLETED: ['OPEN'],
  ARCHIVED: [],
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function validateTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`)
  }
}

export function isTerminalStatus(status: TaskStatus): boolean {
  return status === 'COMPLETED' || status === 'ARCHIVED'
}

export function isActiveStatus(status: TaskStatus): boolean {
  return !isTerminalStatus(status)
}

// Quick actions available per status (for UI)
export const QUICK_ACTIONS: Record<
  TaskStatus,
  Array<{ label: string; status: TaskStatus; requiresReason?: boolean }>
> = {
  INBOX: [
    { label: 'Move to Open', status: 'OPEN' },
    { label: 'Archive', status: 'ARCHIVED', requiresReason: true },
  ],
  OPEN: [
    { label: 'Start', status: 'IN_PROGRESS' },
    { label: 'Plan', status: 'PLANNED' },
    { label: 'Block', status: 'BLOCKED', requiresReason: true },
    { label: 'Snooze', status: 'SNOOZED' },
    { label: 'Complete', status: 'COMPLETED' },
  ],
  PLANNED: [
    { label: 'Start', status: 'IN_PROGRESS' },
    { label: 'Block', status: 'BLOCKED', requiresReason: true },
    { label: 'Snooze', status: 'SNOOZED' },
    { label: 'Complete', status: 'COMPLETED' },
  ],
  IN_PROGRESS: [
    { label: 'Complete', status: 'COMPLETED' },
    { label: 'Block', status: 'BLOCKED', requiresReason: true },
    { label: 'Wait', status: 'WAITING' },
    { label: 'Snooze', status: 'SNOOZED' },
  ],
  BLOCKED: [
    { label: 'Unblock', status: 'OPEN' },
    { label: 'Archive', status: 'ARCHIVED', requiresReason: true },
  ],
  WAITING: [
    { label: 'Resume', status: 'OPEN' },
    { label: 'Complete', status: 'COMPLETED' },
  ],
  SNOOZED: [
    { label: 'Wake Up', status: 'OPEN' },
    { label: 'Archive', status: 'ARCHIVED', requiresReason: true },
  ],
  COMPLETED: [{ label: 'Reopen', status: 'OPEN' }],
  ARCHIVED: [],
}
