/**
 * /api/v2/pods/[podId]/join — accept-an-invite endpoint for the NEW
 * Pod model. The body carries the inviteCode which must match the
 * pod identified by [podId]; mismatch returns 404 so we never reveal
 * which pod ids exist.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { joinPod, PodError } from '@/lib/pods'

export const maxDuration = 10

const joinSchema = z.object({
  inviteCode: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ podId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { podId } = await params
  const body = await req.json().catch(() => null)
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { pod, member } = await joinPod(user.id, parsed.data.inviteCode)
    // 404 if the inviteCode resolved to a different pod than the URL
    // claimed — keeps the URL surface honest without leaking ids.
    if (pod.id !== podId) {
      return Response.json({ error: 'pod_not_found' }, { status: 404 })
    }
    return Response.json({ pod, member })
  } catch (err) {
    if (err instanceof PodError) {
      const status =
        err.code === 'pod_not_found' ? 404 : err.code === 'pod_full' ? 409 : 400
      return Response.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
