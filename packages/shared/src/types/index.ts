export type TaskStatus = 'INBOX' | 'OPEN' | 'PLANNED' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING' | 'SNOOZED' | 'COMPLETED' | 'ARCHIVED'
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SOMEDAY'
export type PlanType = 'FREE' | 'PRO' | 'TEAM' | 'CORE' | 'PLUS' | 'PREMIUM'

// Autopilot interruption product model. Optional on CoylUser so legacy
// consumers (pre-pivot task-manager surfaces) still compile, but the
// mobile /today screen and patterns surfaces rely on these.
export type PrimaryWedge =
  | 'WEIGHT_LOSS'
  | 'CRAVINGS'
  | 'DESTRUCTIVE_BEHAVIORS'
  | 'CONSISTENCY'
  | 'SPENDING'
  | 'FOCUS'
  | 'PRODUCTIVITY'
export type ToneMode = 'MENTOR' | 'STRATEGIST' | 'NO_BS' | 'BEAST'
export type RecoveryState = 'ACTIVE' | 'SLIPPED' | 'RECOVERING' | 'SILENT'

export interface CoylTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueAt: string | null
  completedAt: string | null
  followUpRequired: boolean
  nextFollowUpAt: string | null
  isRecurring: boolean
  notes: string | null
  projectId: string | null
  project?: { id: string; name: string } | null
  tags: Array<{ id: string; name: string; color: string | null }>
  createdAt: string
  updatedAt: string
}

export interface CoylUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  timezone: string
  morningCheckinTime: string
  nightCheckinTime: string
  emailBriefingEnabled: boolean
  planType: PlanType
  aiAssistsUsed: number
  onboardingCompleted: boolean
  // Autopilot interruption fields. All optional so legacy /today consumers
  // still compile; /api/v1/user GET includes them when the user row has them.
  currentStreak?: number
  selfTrustScore?: number
  primaryWedge?: PrimaryWedge
  toneMode?: ToneMode
  recoveryState?: RecoveryState
  slipsThisMonth?: number
  // Derived: true if current local time falls inside a known danger window.
  insideDangerWindow?: boolean
  // Human-readable label of the next window (e.g. "9:00 PM kitchen").
  nextDangerWindowLabel?: string | null
  // Count of DECISION_MADE + AUTOPILOT_INTERRUPTED events in the last 7 days.
  patternsDefeatedThisWeek?: number
}

export interface CoylProject {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD'
  color: string | null
  icon: string | null
}

export interface TodayResponse {
  dueTodayTasks: CoylTask[]
  followUpsDueToday: CoylTask[]
  overdueTasks: CoylTask[]
  recentlyCompleted: CoylTask[]
  user: CoylUser
}

export interface TasksListResponse {
  tasks: CoylTask[]
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  dueAt?: string
  projectId?: string
  status?: TaskStatus
}
