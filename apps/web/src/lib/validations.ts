import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SOMEDAY']).optional(),
  dueAt: z.string().datetime().optional(),
  projectId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
})

export const patchTaskSchema = z.object({
  taskId: z.string().cuid(),
  action: z.enum(['complete', 'snooze', 'status']),
  status: z.enum([
    'INBOX', 'OPEN', 'PLANNED', 'IN_PROGRESS', 'BLOCKED',
    'WAITING', 'SNOOZED', 'COMPLETED', 'ARCHIVED',
  ]).optional(),
  reason: z.string().max(1000).optional(),
  snoozedUntil: z.string().datetime().optional(),
})

export const updateUserSchema = z.object({
  timezone: z.string().min(1).max(100).optional(),
  morningCheckinTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  nightCheckinTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  briefingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reminderIntensity: z.enum(['GENTLE', 'STANDARD', 'RELENTLESS']).optional(),
  emailBriefingEnabled: z.boolean().optional(),
  emailBriefingDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const pushTokenSchema = z.object({
  expoPushToken: z.string().min(1).startsWith('ExponentPushToken['),
})

export const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'annual']),
  tier: z.enum(['core', 'plus', 'premium']).optional().default('core'),
})

export const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.union([z.string().max(50000), z.array(z.unknown())]),
    id: z.string().optional(),
    createdAt: z.unknown().optional(),
    parts: z.array(z.unknown()).optional(),
  })).min(1).max(100),
  mode: z.enum(['morning', 'night', 'general', 'assessment-considerate', 'assessment-nobs']).optional(),
})

export const onboardingSchema = z.object({
  name: z.string().min(1).max(200),
  timezone: z.string().min(1).max(100),
  morningCheckinTime: z.string().regex(/^\d{2}:\d{2}$/),
  nightCheckinTime: z.string().regex(/^\d{2}:\d{2}$/),
  emailBriefingEnabled: z.boolean(),
  firstTask: z.string().max(1000),
  role: z.string().max(50).optional(),
  useCase: z.string().max(50).optional(),
  referralSource: z.string().max(50).optional(),
  biggestGoal: z.string().max(500).optional(),
  failurePattern: z.string().max(200).optional(),
  primaryWedge: z.enum(['PRODUCTIVITY', 'WEIGHT_LOSS', 'CRAVINGS', 'DESTRUCTIVE_BEHAVIORS', 'CONSISTENCY', 'SPENDING', 'FOCUS']).optional(),
  dangerWindowsPicked: z.array(z.string()).max(10).optional(),
  toneMode: z.enum(['MENTOR', 'STRATEGIST', 'NO_BS', 'BEAST']).optional(),
  rescuePreference: z.string().max(40).optional(),
})
