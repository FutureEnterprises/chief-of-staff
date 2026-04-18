import { prisma } from '@repo/database'
import type { Prisma } from '@repo/database'
import { validateTransition } from '@/lib/task-state-machine'
import type { TaskStatus } from '@/lib/task-state-machine'
import {
  checkTaskLimit,
  consumeAiAssistAtomic,
  EntitlementError,
} from './entitlement.service'
import { toTaskPriority, toTaskSource, toEffortLevel } from '@/lib/prisma-enums'
import { generateText, Output } from 'ai'
import { ExtractedTaskSchema, SYSTEM_PROMPTS, AI_MODEL_FAST, AI_MODEL, TaskDecompositionSchema } from '@repo/ai'

export async function completeTask(taskId: string, userId: string): Promise<void> {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } })
  if (!task) throw new Error('Task not found')
  validateTransition(task.status as TaskStatus, 'COMPLETED')

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', completedAt: new Date(), lastTouchedAt: new Date() },
    }),
    prisma.productivityEvent.create({
      data: { userId, taskId, eventType: 'TASK_COMPLETED' },
    }),
  ])

  // Recovery state transition: SLIPPED/RECOVERING → ACTIVE on any completion
  await prisma.user
    .updateMany({
      where: { id: userId, recoveryState: { in: ['SLIPPED', 'RECOVERING'] } },
      data: { recoveryState: 'ACTIVE' },
    })
    .catch(() => {})

  // Mark any unresolved slips as recovered
  await prisma.slipRecord
    .updateMany({
      where: { userId, recoveredAt: null },
      data: { recoveredAt: new Date() },
    })
    .catch(() => {})
}

export async function snoozeTask(
  taskId: string,
  userId: string,
  until: Date
): Promise<void> {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } })
  if (!task) throw new Error('Task not found')
  validateTransition(task.status as TaskStatus, 'SNOOZED')

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'SNOOZED',
        snoozedUntil: until,
        snoozeCount: { increment: 1 },
        lastTouchedAt: new Date(),
      },
    }),
    prisma.productivityEvent.create({
      data: { userId, taskId, eventType: 'TASK_SNOOZED', eventValue: until.toISOString() },
    }),
  ])
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  newStatus: TaskStatus,
  reason?: string
): Promise<void> {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } })
  if (!task) throw new Error('Task not found')
  validateTransition(task.status as TaskStatus, newStatus)

  if (newStatus === 'ARCHIVED' && !reason) throw new Error('Archive reason is required')

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        lastTouchedAt: new Date(),
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
        ...(newStatus === 'ARCHIVED' && { archivedAt: new Date(), archiveReason: reason }),
        ...(newStatus === 'BLOCKED' && reason && { blockedReason: reason }),
        // Clear blockedReason when unblocking
        ...(task.status === 'BLOCKED' &&
          newStatus !== 'BLOCKED' &&
          newStatus !== 'ARCHIVED' && { blockedReason: null }),
      },
    })

    // Emit reopened event when going back to OPEN
    if (newStatus === 'OPEN' && task.status === 'COMPLETED') {
      await tx.productivityEvent.create({
        data: { userId, taskId, eventType: 'TASK_REOPENED' },
      })
    }
    if (newStatus === 'ARCHIVED') {
      await tx.productivityEvent.create({
        data: { userId, taskId, eventType: 'TASK_ARCHIVED', eventValue: reason },
      })
    }
    if (newStatus === 'BLOCKED') {
      await tx.productivityEvent.create({
        data: { userId, taskId, eventType: 'TASK_BLOCKED', eventValue: reason },
      })
    }
  })
}

export async function createTask(
  userId: string,
  data: {
    title: string
    description?: string
    priority?: string
    dueAt?: Date
    projectId?: string
    tagIds?: string[]
    source?: string
  }
): Promise<{ id: string; title: string }> {
  const limit = await checkTaskLimit(userId)
  if (!limit.allowed) {
    throw new EntitlementError(
      'task_limit',
      `Free plan is limited to ${limit.limit} active tasks. Upgrade to Pro for unlimited tasks.`
    )
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      priority: toTaskPriority(data.priority),
      dueAt: data.dueAt,
      projectId: data.projectId,
      status: 'OPEN',
      source: toTaskSource(data.source),
      lastTouchedAt: new Date(),
      ...(data.tagIds &&
        data.tagIds.length > 0 && {
          tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
        }),
    },
    select: { id: true, title: true },
  })

  await prisma.productivityEvent.create({
    data: { userId, taskId: task.id, eventType: 'TASK_CREATED' },
  })

  return task
}

export async function createTaskFromNaturalLanguage(
  userId: string,
  input: string,
  userTimezone: string
): Promise<{ task: { id: string; title: string }; extracted: unknown }> {
  // Check task limit and atomically consume AI quota
  const [taskLimit, aiQuota] = await Promise.all([
    checkTaskLimit(userId),
    consumeAiAssistAtomic(userId),
  ])

  if (!taskLimit.allowed) {
    throw new EntitlementError(
      'task_limit',
      `Free plan is limited to ${taskLimit.limit} active tasks. Upgrade to Pro for unlimited tasks.`
    )
  }
  if (!aiQuota.consumed) {
    throw new EntitlementError(
      'ai_quota',
      `You've used all ${aiQuota.limit} Charges this month. Upgrade to Pro for 500/mo.`
    )
  }

  const now = new Date()
  const systemPrompt = SYSTEM_PROMPTS.taskExtraction
    .replace('{DATE}', now.toISOString())
    .replace('{TIMEZONE}', userTimezone)

  const { output } = await generateText({
    model: AI_MODEL_FAST,
    system: systemPrompt,
    prompt: `Extract task from: "${input}"`,
    output: Output.object({ schema: ExtractedTaskSchema }),
  })

  const task = await prisma.task.create({
    data: {
      userId,
      title: output.title,
      description: output.description,
      status: output.confidence > 0.8 ? 'OPEN' : 'INBOX',
      priority: toTaskPriority(output.priority),
      effortEstimate: toEffortLevel(output.effortEstimate),
      dueAt: output.dueAt ? new Date(output.dueAt) : null,
      followUpRequired: output.followUpRequired,
      nextFollowUpAt: output.nextFollowUpAt ? new Date(output.nextFollowUpAt) : null,
      followUpIntervalDays: output.followUpIntervalDays ?? null,
      source: 'AI_CHAT',
      aiConfidence: output.confidence,
      lastTouchedAt: new Date(),
    },
    select: { id: true, title: true },
  })

  // Subtasks
  if (output.subtasks.length > 0) {
    await prisma.task.createMany({
      data: output.subtasks.map((title) => ({
        userId,
        parentTaskId: task.id,
        title,
        status: 'OPEN' as const,
        priority: 'MEDIUM' as const,
        source: 'AI_EXTRACTION' as const,
      })),
    })
  }

  await Promise.all([
    prisma.aiInteraction.create({
      data: {
        userId,
        taskId: task.id,
        interactionType: 'TASK_EXTRACTION',
        provider: 'anthropic',
        model: String(AI_MODEL_FAST),
        inputText: input,
        outputJson: JSON.parse(JSON.stringify(output)),
      },
    }),
    prisma.productivityEvent.create({
      data: { userId, taskId: task.id, eventType: 'TASK_CREATED' },
    }),
  ])

  return { task, extracted: output }
}

export async function decomposeTask(
  taskId: string,
  userId: string
): Promise<unknown> {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } })
  if (!task) throw new Error('Task not found')

  const aiQuota = await consumeAiAssistAtomic(userId)
  if (!aiQuota.consumed) {
    throw new EntitlementError(
      'ai_quota',
      `You've used all ${aiQuota.limit} Charges this month. Upgrade to Pro for 500/mo.`
    )
  }

  const { output } = await generateText({
    model: AI_MODEL,
    system: SYSTEM_PROMPTS.taskDecomposition,
    prompt: `Break down this task: "${task.title}"\n\nContext: ${task.description ?? 'No additional context.'}`,
    output: Output.object({ schema: TaskDecompositionSchema }),
  })

  await prisma.task.createMany({
    data: output.subtasks.map((subtask) => ({
      userId,
      parentTaskId: task.id,
      title: subtask.title,
      description: subtask.description,
      effortEstimate: toEffortLevel(subtask.effortEstimate),
      status: 'OPEN' as const,
      priority: task.priority,
      source: 'AI_EXTRACTION' as const,
    })),
  })

  await Promise.all([
    prisma.aiInteraction.create({
      data: {
        userId,
        taskId: task.id,
        interactionType: 'TASK_DECOMPOSITION',
        provider: 'anthropic',
        model: String(AI_MODEL),
        inputText: task.title,
        outputJson: JSON.parse(JSON.stringify(output)),
      },
    }),
    prisma.productivityEvent.create({
      data: { userId, taskId: task.id, eventType: 'TASK_DECOMPOSED' },
    }),
  ])

  return output
}
