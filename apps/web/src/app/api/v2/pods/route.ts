/**
 * /api/v2/pods — collection routes for the NEW Pod model (family /
 * couples accountability). v2 namespace is reserved for this new
 * surface so the legacy /api/v1/pods (challenge pods) stays untouched.
 *
 * GET   → the requester's active pods
 * POST  → create a new pod (caller becomes owner)
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { createPod, getUserPods, PodError, type ShareLevel } from '@/lib/pods'

export const maxDuration = 10

const createSchema = z.object({
  name: z.string().min(3).max(60),
  maxMembers: z.number().int().min(4).max(6).optional(),
  shareLevel: z.enum(['counts_only', 'patterns', 'full']).optional(),
})

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const pods = await getUserPods(user.id)
  return Response.json({ pods })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const pod = await createPod(
      user.id,
      parsed.data.name,
      parsed.data.maxMembers ?? 6,
      (parsed.data.shareLevel ?? 'counts_only') as ShareLevel,
    )
    return Response.json({ pod })
  } catch (err) {
    if (err instanceof PodError) {
      return Response.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
