import { z } from 'zod'

export const ExtractedTaskSchema = z.object({
  title: z.string().describe('Short, actionable task title'),
  description: z.string().optional().describe('Additional context or details'),
  dueAt: z.string().datetime().optional().describe('ISO datetime if a specific date was mentioned'),
  followUpRequired: z.boolean().default(false),
  nextFollowUpAt: z.string().datetime().optional(),
  followUpIntervalDays: z.number().int().min(1).max(90).optional(),
  priority: z
    .enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SOMEDAY'])
    .default('MEDIUM'),
  effortEstimate: z
    .enum([
      'FIVE_MIN',
      'FIFTEEN_MIN',
      'THIRTY_MIN',
      'ONE_HOUR',
      'TWO_HOURS',
      'HALF_DAY',
      'FULL_DAY',
      'MULTI_DAY',
    ])
    .optional(),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).describe('Confidence in extraction accuracy'),
  clarificationNeeded: z.string().optional().describe('Question to ask if confidence is low'),
})

export type ExtractedTask = z.infer<typeof ExtractedTaskSchema>

export const TaskDecompositionSchema = z.object({
  goalSummary: z.string(),
  subtasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      effortEstimate: z.enum([
        'FIVE_MIN',
        'FIFTEEN_MIN',
        'THIRTY_MIN',
        'ONE_HOUR',
        'TWO_HOURS',
        'HALF_DAY',
        'FULL_DAY',
        'MULTI_DAY',
      ]),
      order: z.number().int(),
    })
  ),
  suggestedFirstStep: z.string(),
  simplifiedVersion: z.string().describe('A simpler way to approach this task'),
  delegationCandidates: z.array(z.string()).default([]),
  estimatedTotalHours: z.number().optional(),
})

export type TaskDecomposition = z.infer<typeof TaskDecompositionSchema>

export const ProductivityInsightSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum(['pattern', 'warning', 'strength', 'recommendation']),
      title: z.string(),
      description: z.string(),
      actionable: z.boolean(),
      suggestedAction: z.string().optional(),
    })
  ),
  weeklyScore: z.number().min(0).max(100),
  completionRate: z.number().min(0).max(1),
  topFocusArea: z.string(),
  coachingNote: z.string(),
})

export type ProductivityInsight = z.infer<typeof ProductivityInsightSchema>

export const DailySummarySchema = z.object({
  greeting: z.string(),
  topPriorities: z.array(z.string()),
  completedItems: z.array(z.string()),
  overdueItems: z.array(z.string()),
  followUpsDue: z.array(z.string()),
  blockedItems: z.array(z.string()),
  coachingNote: z.string(),
  focusRecommendation: z.string(),
})

export type DailySummary = z.infer<typeof DailySummarySchema>
