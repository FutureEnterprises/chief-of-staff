import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { CommitmentDomain, CommitmentFrequency } from '@repo/database'
import { z } from 'zod'

const createSchema = z.object({
  rule: z.string().min(3).max(200),
  domain: z.enum(['FOOD', 'EXERCISE', 'CRAVING', 'SLEEP', 'SPENDING', 'FOCUS', 'RELATIONSHIP', 'DIGITAL', 'OTHER']).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'ONE_TIME']).optional(),
  endsAt: z.string().datetime().optional(),
})

const checkSchema = z.object({
  commitmentId: z.string().cuid(),
  kept: z.boolean(),
})

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const commitments = await prisma.commitment.findMany({
    where: { userId: user.id },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  })

  return Response.json({ commitments })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const commitment = await prisma.commitment.create({
    data: {
      userId: user.id,
      rule: parsed.data.rule,
      domain: (parsed.data.domain ?? 'OTHER') as CommitmentDomain,
      frequency: (parsed.data.frequency ?? 'DAILY') as CommitmentFrequency,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    },
  })

  await prisma.productivityEvent
    .create({ data: { userId: user.id, eventType: 'COMMITMENT_CREATED', eventValue: commitment.id } })
    .catch(() => {})

  return Response.json({ commitment })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const parsed = checkSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const existing = await prisma.commitment.findFirst({
    where: { id: parsed.data.commitmentId, userId: user.id },
  })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.commitment.update({
    where: { id: existing.id },
    data: {
      keepCount: parsed.data.kept ? { increment: 1 } : undefined,
      breakCount: !parsed.data.kept ? { increment: 1 } : undefined,
      lastCheckedAt: new Date(),
    },
  })

  await prisma.productivityEvent
    .create({
      data: {
        userId: user.id,
        eventType: parsed.data.kept ? 'COMMITMENT_KEPT' : 'COMMITMENT_BROKEN',
        eventValue: updated.id,
      },
    })
    .catch(() => {})

  return Response.json({ commitment: updated })
}
