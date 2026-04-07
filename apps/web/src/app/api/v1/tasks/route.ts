/**
 * Mobile API v1 — Tasks
 * Auth: Bearer token from Clerk (same session token used on web)
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { createTask, completeTask, snoozeTask, updateTaskStatus } from '@/lib/services/task.service'
import { createTaskSchema, patchTaskSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import type { TaskStatus } from '@/lib/task-state-machine'

const VALID_STATUSES = [
  'INBOX', 'OPEN', 'PLANNED', 'IN_PROGRESS', 'BLOCKED',
  'WAITING', 'SNOOZED', 'COMPLETED', 'ARCHIVED',
] as const

async function getDbUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } })
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getDbUser(clerkId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const rl = await checkRateLimit('api', user.id)
  if (rl.limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as TaskStatus | null
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50') || 50, 200)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0') || 0, 0)

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : { status: { notIn: ['ARCHIVED'] } }),
    },
    include: {
      tags: { include: { tag: true } },
      project: { select: { id: true, name: true } },
      subtasks: { select: { id: true, title: true, status: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    take: limit,
    skip: offset,
  })

  return NextResponse.json({ tasks, offset, limit })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getDbUser(clerkId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsed = createTaskSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, priority, dueAt, projectId, tagIds } = parsed.data

  try {
    const task = await createTask(user.id, {
      title,
      description,
      priority,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      projectId,
      tagIds,
    })
    return NextResponse.json({ task }, { status: 201 })
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; feature?: string }
    if (error?.name === 'EntitlementError') {
      return NextResponse.json({ error: error.message, code: error.feature }, { status: 402 })
    }
    throw err
  }
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getDbUser(clerkId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsed = patchTaskSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { taskId, action, status, reason, snoozedUntil } = parsed.data

  try {
    if (action === 'complete') {
      await completeTask(taskId, user.id)
    } else if (action === 'snooze' && snoozedUntil) {
      await snoozeTask(taskId, user.id, new Date(snoozedUntil))
    } else if (action === 'status' && status) {
      await updateTaskStatus(taskId, user.id, status as TaskStatus, reason)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as { message?: string }
    if (error?.message?.includes('Invalid status transition')) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    throw err
  }
}
