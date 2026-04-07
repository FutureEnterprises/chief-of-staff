export type TaskStatus = 'INBOX' | 'OPEN' | 'PLANNED' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING' | 'SNOOZED' | 'COMPLETED' | 'ARCHIVED'
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SOMEDAY'
export type PlanType = 'FREE' | 'PRO' | 'TEAM'

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
