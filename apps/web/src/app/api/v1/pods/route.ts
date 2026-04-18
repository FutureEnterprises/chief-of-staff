import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { hasFeature } from '@/lib/services/entitlement.service'
import { randomBytes } from 'crypto'

const createSchema = z.object({
  name: z.string().min(3).max(60),
  durationDays: z.number().int().min(7).max(90).optional(),
})

const joinSchema = z.object({
  joinCode: z.string().length(8),
})

function makeJoinCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) + '-' + randomBytes(3).toString('hex')
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const memberships = await prisma.podMember.findMany({
    where: { userId: user.id, leftAt: null },
    include: {
      pod: {
        include: {
          members: {
            where: { leftAt: null },
            include: { user: { select: { id: true, name: true, executionScore: true, currentStreak: true } } },
          },
          owner: { select: { id: true, name: true } },
        },
      },
    },
  })

  return Response.json({ pods: memberships.map((m) => m.pod) })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'challengePods')
  if (!canUse) {
    return Response.json({ error: 'feature_gated', feature: 'challengePods' }, { status: 402 })
  }

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const durationDays = parsed.data.durationDays ?? 14
  const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

  const pod = await prisma.challengePod.create({
    data: {
      name: parsed.data.name,
      slug: makeSlug(parsed.data.name),
      ownerId: user.id,
      joinCode: makeJoinCode(),
      durationDays,
      endsAt,
    },
  })

  await prisma.podMember.create({
    data: { podId: pod.id, userId: user.id, role: 'owner' },
  })

  await prisma.productivityEvent
    .create({ data: { userId: user.id, eventType: 'POD_CREATED', eventValue: pod.id } })
    .catch(() => {})

  return Response.json({ pod })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'challengePods')
  if (!canUse) {
    return Response.json({ error: 'feature_gated', feature: 'challengePods' }, { status: 402 })
  }

  const parsed = joinSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const pod = await prisma.challengePod.findUnique({ where: { joinCode: parsed.data.joinCode.toUpperCase() } })
  if (!pod || !pod.active) return Response.json({ error: 'Pod not found' }, { status: 404 })

  const memberCount = await prisma.podMember.count({ where: { podId: pod.id, leftAt: null } })
  if (memberCount >= pod.maxMembers) return Response.json({ error: 'Pod full' }, { status: 409 })

  const existing = await prisma.podMember.findUnique({
    where: { podId_userId: { podId: pod.id, userId: user.id } },
  })
  if (existing && !existing.leftAt) return Response.json({ error: 'Already a member' }, { status: 409 })

  await prisma.podMember.upsert({
    where: { podId_userId: { podId: pod.id, userId: user.id } },
    update: { leftAt: null, joinedAt: new Date() },
    create: { podId: pod.id, userId: user.id },
  })

  await prisma.productivityEvent
    .create({ data: { userId: user.id, eventType: 'POD_JOINED', eventValue: pod.id } })
    .catch(() => {})

  return Response.json({ pod })
}
