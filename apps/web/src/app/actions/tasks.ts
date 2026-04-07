'use server'
import { revalidatePath } from 'next/cache'
import { requireDbUser } from '@/lib/auth'
import {
  completeTask as completeTaskService,
  snoozeTask as snoozeTaskService,
  updateTaskStatus as updateTaskStatusService,
  createTask as createTaskService,
  createTaskFromNaturalLanguage,
  decomposeTask as decomposeTaskService,
} from '@/lib/services/task.service'
import type { TaskStatus } from '@/lib/task-state-machine'

export async function completeTask(taskId: string) {
  const user = await requireDbUser()
  try {
    await completeTaskService(taskId, user.id)
  } catch (err) {
    const e = err as { name?: string; message?: string }
    if (e.name === 'EntitlementError') throw new Error(e.message)
    throw new Error('Failed to complete task')
  }
  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  reason?: string
) {
  const user = await requireDbUser()
  try {
    await updateTaskStatusService(taskId, user.id, newStatus, reason)
  } catch (err) {
    const e = err as { message?: string }
    if (e.message?.includes('Invalid status transition')) throw new Error(e.message)
    throw new Error('Failed to update task status')
  }
  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function snoozeTask(taskId: string, until: Date) {
  const user = await requireDbUser()
  try {
    await snoozeTaskService(taskId, user.id, until)
  } catch {
    throw new Error('Failed to snooze task')
  }
  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function createTaskFromChat(naturalLanguageInput: string) {
  const user = await requireDbUser()
  try {
    const result = await createTaskFromNaturalLanguage(user.id, naturalLanguageInput, user.timezone)
    revalidatePath('/today')
    revalidatePath('/tasks')
    revalidatePath('/inbox')
    return result
  } catch (err) {
    const e = err as { name?: string; message?: string }
    if (e.name === 'EntitlementError') throw new Error(e.message)
    throw new Error('Failed to create task')
  }
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
  const { createTaskSchema } = await import('@/lib/validations')
  const parsed = createTaskSchema.safeParse({
    ...data,
    dueAt: data.dueAt?.toISOString(),
  })
  if (!parsed.success) throw new Error('Invalid task data')

  try {
    const task = await createTaskService(user.id, data)
    revalidatePath('/today')
    revalidatePath('/tasks')
    revalidatePath('/inbox')
    return task
  } catch (err) {
    const e = err as { name?: string; message?: string }
    if (e.name === 'EntitlementError') throw new Error(e.message)
    throw new Error('Failed to create task')
  }
}

export async function decomposeTask(taskId: string) {
  const user = await requireDbUser()
  try {
    const output = await decomposeTaskService(taskId, user.id)
    revalidatePath(`/tasks/${taskId}`)
    return output
  } catch (err) {
    const e = err as { name?: string; message?: string }
    if (e.name === 'EntitlementError') throw new Error(e.message)
    throw new Error('Failed to decompose task')
  }
}
