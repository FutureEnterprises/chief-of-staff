/**
 * /api/v2/pods/[podId] — per-pod operations for the NEW Pod model.
 *
 * GET    → pod details (requester must be a member)
 * PATCH  → update name / shareLevel (owner: name + maxMembers; any
 *          member: their own shareLevel via `shareLevel` field)
 * DELETE → archive the pod (owner only)
 *
 * Note: a member who wants to leave (not archive) should call
 * DELETE on their PodMember row — exposed at this same endpoint
 * with body { action: 'leave' } to keep the URL surface minimal.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import {
  archivePod,
  getPodDetails,
  getPodMetrics,
  leavePod,
  PodError,
} from '@/lib/pods'

export const maxDuration = 10

const patchSchema = z
  .object({
    name: z.string().min(3).max(60).optional(),
    maxMembers: z.number().int().min(4).max(6).optional(),
    shareLevel: z.enum(['counts_only', 'patterns', 'full']).optional(),
    action: z.enum(['leave']).optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.maxMembers !== undefined ||
      v.shareLevel !== undefined ||
      v.action !== undefined,
    { message: 'At least one field is required' },
  )

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ podId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { podId } = await params

  try {
    const [pod, metrics] = await Promise.all([
      getPodDetails(podId, user.id),
      getPodMetrics(podId),
    ])
    return Response.json({ pod, metrics })
  } catch (err) {
    if (err instanceof PodError) {
      return Response.json({ error: err.code, message: err.message }, { status: 404 })
    }
    throw err
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ podId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { podId } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  // Authorize: requester must be an active member of this pod
  const member = await prisma.podMember.findUnique({
    where: { podId_userId: { podId, userId: user.id } },
  })
  if (!member || !member.active) {
    return Response.json({ error: 'not_a_member' }, { status: 404 })
  }

  // Per-member: update own shareLevel
  if (parsed.data.shareLevel !== undefined) {
    await prisma.podMember.update({
      where: { podId_userId: { podId, userId: user.id } },
      data: { shareLevel: parsed.data.shareLevel },
    })
  }

  // Owner-only: update pod-wide fields
  if (parsed.data.name !== undefined || parsed.data.maxMembers !== undefined) {
    if (member.role !== 'owner') {
      return Response.json({ error: 'not_owner' }, { status: 403 })
    }
    await prisma.pod.update({
      where: { id: podId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.maxMembers !== undefined ? { maxMembers: parsed.data.maxMembers } : {}),
      },
    })
  }

  // Leave action
  if (parsed.data.action === 'leave') {
    try {
      await leavePod(podId, user.id)
    } catch (err) {
      if (err instanceof PodError) {
        return Response.json({ error: err.code, message: err.message }, { status: 400 })
      }
      throw err
    }
    return Response.json({ ok: true, left: true })
  }

  return Response.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ podId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { podId } = await params

  try {
    await archivePod(podId, user.id)
    return Response.json({ ok: true, archived: true })
  } catch (err) {
    if (err instanceof PodError) {
      const status = err.code === 'not_owner' ? 403 : 404
      return Response.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
