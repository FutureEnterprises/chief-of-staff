import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const [challenges, entries] = await Promise.all([
    prisma.challenge.findMany({ where: { active: true }, orderBy: { durationDays: 'asc' } }),
    prisma.challengeEntry.findMany({
      where: { userId: user.id },
      select: { challengeId: true, status: true, progress: true, startedAt: true, completedAt: true },
    }),
  ])

  const entryMap = new Map(entries.map((e) => [e.challengeId, e]))

  return Response.json({
    challenges: challenges.map((c) => ({
      ...c,
      entry: entryMap.get(c.id) ?? null,
    })),
  })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { challengeId } = await req.json()
  if (!challengeId) return Response.json({ error: 'challengeId required' }, { status: 400 })

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 })

  // Check if already entered
  const existing = await prisma.challengeEntry.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId } },
  })
  if (existing) return Response.json({ error: 'Already joined this challenge' }, { status: 409 })

  const entry = await prisma.challengeEntry.create({
    data: { userId: user.id, challengeId },
  })

  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'CHALLENGE_STARTED',
      metadataJson: { challengeSlug: challenge.slug, challengeName: challenge.name },
    },
  })

  return Response.json({ entry })
}
