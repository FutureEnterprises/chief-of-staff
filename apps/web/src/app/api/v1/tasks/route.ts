/**
 * Mobile API v1 — Tasks
 * Auth: Bearer token from Clerk (same session token used on web)
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { createTask, completeTask, snoozeTask, updateTaskStatus } from '@/lib/services/task.service'
import type { TaskStatus } from '@/lib/task-state-machine'

async function getDbUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } })
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })
  const user = await getDbUser(clerkId)
  if (!user) return new NextResponse('User not found', { status: 404 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as any } : { status: { notIn: ['ARCHIVED'] } }),
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
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })
  const user = await getDbUser(clerkId)
  if (!user) return new NextResponse('User not found', { status: 404 })

  const body = await req.json()
  const { title, description, priority, dueAt, projectId, tagIds } = body

  if (!title || typeof title !== 'string') {
    return new NextResponse('title is required', { status: 400 })
  }

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
  } catch (err: any) {
    if (err?.name === 'EntitlementError') {
      return NextResponse.json({ error: err.message, code: err.feature }, { status: 402 })
    }
    throw err
  }
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })
  const user = await getDbUser(clerkId)
  if (!user) return new NextResponse('User not found', { status: 404 })

  const body = await req.json()
  const { taskId, action, status, reason, snoozedUntil } = body

  if (!taskId) return new NextResponse('taskId is required', { status: 400 })

  try {
    if (action === 'complete') {
      await completeTask(taskId, user.id)
    } else if (action === 'snooze' && snoozedUntil) {
      await snoozeTask(taskId, user.id, new Date(snoozedUntil))
    } else if (action === 'status' && status) {
      await updateTaskStatus(taskId, user.id, status as TaskStatus, reason)
    } else {
      return new NextResponse('Invalid action', { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.message?.includes('Invalid status transition')) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    throw err
  }
}
