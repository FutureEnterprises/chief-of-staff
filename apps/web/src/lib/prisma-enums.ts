/**
 * Prisma enum validators — use these instead of `as any` casts when writing
 * string values into Prisma enum fields, especially for AI-extracted output.
 */
import type {
  TaskPriority,
  TaskSource,
  EffortLevel,
  ReminderType,
} from '@repo/database'

const TASK_PRIORITIES: Set<string> = new Set([
  'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SOMEDAY',
])

const TASK_SOURCES: Set<string> = new Set([
  'MANUAL', 'AI_CHAT', 'AI_EXTRACTION', 'EMAIL', 'CHECKIN', 'API',
])

const EFFORT_LEVELS: Set<string> = new Set([
  'FIVE_MIN', 'FIFTEEN_MIN', 'THIRTY_MIN', 'ONE_HOUR',
  'TWO_HOURS', 'HALF_DAY', 'FULL_DAY', 'MULTI_DAY',
])

const REMINDER_TYPES: Set<string> = new Set([
  'DUE_SOON', 'DUE_NOW', 'OVERDUE', 'FOLLOW_UP',
  'MORNING_CHECKIN', 'NIGHT_CHECKIN', 'DAILY_BRIEFING',
  'SNOOZE_END', 'FOLLOW_UP_ESCALATED', 'WAITING_STALE',
  'WEEKLY_REVIEW', 'OVERDUE_ESCALATED',
])

export function toTaskPriority(value: string | undefined | null, fallback: TaskPriority = 'MEDIUM'): TaskPriority {
  return value && TASK_PRIORITIES.has(value) ? (value as TaskPriority) : fallback
}

export function toTaskSource(value: string | undefined | null, fallback: TaskSource = 'MANUAL'): TaskSource {
  return value && TASK_SOURCES.has(value) ? (value as TaskSource) : fallback
}

export function toEffortLevel(value: string | undefined | null): EffortLevel | null {
  return value && EFFORT_LEVELS.has(value) ? (value as EffortLevel) : null
}

export function toReminderType(value: string): ReminderType {
  if (!REMINDER_TYPES.has(value)) throw new Error(`Invalid reminder type: ${value}`)
  return value as ReminderType
}
