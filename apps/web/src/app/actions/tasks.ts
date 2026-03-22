'use server'
import { revalidatePath } from 'next/cache'
import { generateText, Output } from 'ai'
import { prisma } from '@repo/database'
import { requireDbUser } from '@/lib/auth'
import { validateTransition } from '@/lib/task-state-machine'
import { ExtractedTaskSchema, SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'
import type { TaskStatus } from '@/lib/task-state-machine'

export async function completeTask(taskId: string) {
  const user = await requireDbUser()
  const task = await prisma.task.findUnique({ where: { id: taskId, userId: user.id } })
  if (!task) throw new Error('Task not found')

  validateTransition(task.status, 'COMPLETED')

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    }),
    prisma.productivityEvent.create({
      data: { userId: user.id, taskId, eventType: 'TASK_COMPLETED' },
    }),
  ])

  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, reason?: string) {
  const user = await requireDbUser()
  const task = await prisma.task.findUnique({ where: { id: taskId, userId: user.id } })
  if (!task) throw new Error('Task not found')

  validateTransition(task.status, newStatus)

  if (newStatus === 'ARCHIVED' && !reason) {
    throw new Error('Archive reason is required')
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
      ...(newStatus === 'ARCHIVED' && { archivedAt: new Date(), archiveReason: reason }),
      ...(newStatus === 'BLOCKED' && reason && { blockedReason: reason }),
    },
  })

  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function snoozeTask(taskId: string, until: Date) {
  const user = await requireDbUser()
  const task = await prisma.task.findUnique({ where: { id: taskId, userId: user.id } })
  if (!task) throw new Error('Task not found')

  validateTransition(task.status, 'SNOOZED')

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'SNOOZED', snoozedUntil: until },
  })

  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function createTaskFromChat(naturalLanguageInput: string) {
  const user = await requireDbUser()

  const now = new Date()
  const systemPrompt = SYSTEM_PROMPTS.taskExtraction
    .replace('{DATE}', now.toISOString())
    .replace('{TIMEZONE}', user.timezone)

  // AI SDK v6: generateText with Output.object(), result on .output property
  const { output } = await generateText({
    model: AI_MODEL_FAST as any,
    system: systemPrompt,
    prompt: `Extract task from: "${naturalLanguageInput}"`,
    output: Output.object({ schema: ExtractedTaskSchema }),
  })

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: output.title,
      description: output.description,
      status: output.confidence > 0.8 ? 'OPEN' : 'INBOX',
      priority: output.priority as any,
      effortEstimate: (output.effortEstimate as any) ?? null,
      dueAt: output.dueAt ? new Date(output.dueAt) : null,
      followUpRequired: output.followUpRequired,
      nextFollowUpAt: output.nextFollowUpAt ? new Date(output.nextFollowUpAt) : null,
      followUpIntervalDays: output.followUpIntervalDays ?? null,
      source: 'AI_CHAT',
      aiConfidence: output.confidence,
    },
  })

  // Create subtasks if any
  if (output.subtasks.length > 0) {
    await prisma.task.createMany({
      data: output.subtasks.map((title) => ({
        userId: user.id,
        parentTaskId: task.id,
        title,
        status: 'OPEN' as const,
        priority: 'MEDIUM' as const,
        source: 'AI_EXTRACTION' as const,
      })),
    })
  }

  // Log AI interaction
  await prisma.aiInteraction.create({
    data: {
      userId: user.id,
      taskId: task.id,
      interactionType: 'TASK_EXTRACTION',
      provider: 'anthropic',
      model: String(AI_MODEL_FAST),
      inputText: naturalLanguageInput,
      outputJson: output as any,
    },
  })

  // Log productivity event
  await prisma.productivityEvent.create({
    data: { userId: user.id, taskId: task.id, eventType: 'TASK_CREATED' },
  })

  revalidatePath('/today')
  revalidatePath('/tasks')
  revalidatePath('/inbox')

  return { task, extracted: output }
}

export async function createTask(data: {
  title: string
  description?: string
  priority?: string
  dueAt?: Date
  projectId?: string
  tagIds?: string[]
}) {
  const user = await requireDbUser()

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: data.title,
      description: data.description,
      priority: (data.priority as any) ?? 'MEDIUM',
      dueAt: data.dueAt,
      projectId: data.projectId,
      status: 'OPEN',
      source: 'MANUAL',
      ...(data.tagIds &&
        data.tagIds.length > 0 && {
          tags: {
            create: data.tagIds.map((tagId) => ({ tagId })),
          },
        }),
    },
  })

  await prisma.productivityEvent.create({
    data: { userId: user.id, taskId: task.id, eventType: 'TASK_CREATED' },
  })

  revalidatePath('/today')
  revalidatePath('/tasks')
  revalidatePath('/inbox')

  return task
}

export async function decomposeTask(taskId: string) {
  const user = await requireDbUser()
  const task = await prisma.task.findUnique({ where: { id: taskId, userId: user.id } })
  if (!task) throw new Error('Task not found')

  const { AI_MODEL, TaskDecompositionSchema, SYSTEM_PROMPTS: prompts } = await import('@repo/ai')

  // AI SDK v6: Output.object(), result on .output property
  const { output } = await generateText({
    model: AI_MODEL as any,
    system: prompts.taskDecomposition,
    prompt: `Break down this task: "${task.title}"\n\nContext: ${task.description ?? 'No additional context.'}`,
    output: Output.object({ schema: TaskDecompositionSchema }),
  })

  // Create subtasks
  await prisma.task.createMany({
    data: output.subtasks.map((subtask) => ({
      userId: user.id,
      parentTaskId: task.id,
      title: subtask.title,
      description: subtask.description,
      effortEstimate: subtask.effortEstimate as any,
      status: 'OPEN' as const,
      priority: task.priority,
      source: 'AI_EXTRACTION' as const,
    })),
  })

  // Log AI interaction
  await prisma.aiInteraction.create({
    data: {
      userId: user.id,
      taskId: task.id,
      interactionType: 'TASK_DECOMPOSITION',
      provider: 'anthropic',
      model: String(AI_MODEL),
      inputText: task.title,
      outputJson: output as any,
    },
  })

  revalidatePath(`/tasks/${taskId}`)

  return output
}
