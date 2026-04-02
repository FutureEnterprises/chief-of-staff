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
  await completeTaskService(taskId, user.id)
  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  reason?: string
) {
  const user = await requireDbUser()
  await updateTaskStatusService(taskId, user.id, newStatus, reason)
  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function snoozeTask(taskId: string, until: Date) {
  const user = await requireDbUser()
  await snoozeTaskService(taskId, user.id, until)
  revalidatePath('/today')
  revalidatePath('/tasks')
}

export async function createTaskFromChat(naturalLanguageInput: string) {
  const user = await requireDbUser()
  const result = await createTaskFromNaturalLanguage(user.id, naturalLanguageInput, user.timezone)
  revalidatePath('/today')
  revalidatePath('/tasks')
  revalidatePath('/inbox')
  return result
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
  const task = await createTaskService(user.id, data)
  revalidatePath('/today')
  revalidatePath('/tasks')
  revalidatePath('/inbox')
  return task
}

export async function decomposeTask(taskId: string) {
  const user = await requireDbUser()
  const output = await decomposeTaskService(taskId, user.id)
  revalidatePath(`/tasks/${taskId}`)
  return output
}
