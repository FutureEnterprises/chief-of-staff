/**
 * lib/pods.ts — server-side helpers for the family/couples Pod feature.
 *
 * Backs the NEW Pod + PodMember models (schema.prisma §1339+), distinct
 * from the legacy ChallengePod + ChallengePodMember pair which still
 * services cohort/streak-challenge pods through /api/v1/pods.
 *
 * Privacy model: each PodMember row carries its own `shareLevel` knob —
 * 'counts_only' | 'patterns' | 'full' — so what a member exposes to the
 * pod is controlled per-member, not by the pod itself. Surfaces that
 * render other-member data should respect each row's shareLevel.
 */
import { prisma } from '@repo/database'
import type { Pod, PodMember } from '@repo/database'

export type ShareLevel = 'counts_only' | 'patterns' | 'full'

export class PodError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'PodError'
  }
}

/**
 * Create a new pod owned by `userId`. Caller becomes the first member
 * with role='owner' in a single transaction so a pod is never observable
 * without its creator.
 */
export async function createPod(
  userId: string,
  name: string,
  maxMembers: number = 6,
  shareLevel: ShareLevel = 'counts_only',
): Promise<Pod & { members: PodMember[] }> {
  const trimmed = name.trim()
  if (trimmed.length < 3 || trimmed.length > 60) {
    throw new PodError('invalid_name', 'Pod name must be 3–60 characters')
  }
  if (maxMembers < 4 || maxMembers > 6) {
    throw new PodError('invalid_max_members', 'maxMembers must be between 4 and 6')
  }

  return prisma.$transaction(async (tx) => {
    const pod = await tx.pod.create({
      data: {
        name: trimmed,
        createdById: userId,
        maxMembers,
      },
    })
    await tx.podMember.create({
      data: {
        podId: pod.id,
        userId,
        role: 'owner',
        shareLevel,
      },
    })
    return tx.pod.findUniqueOrThrow({
      where: { id: pod.id },
      include: { members: true },
    })
  })
}

/**
 * Join a pod via its inviteCode. Idempotent for users who previously
 * left — the existing PodMember row is reactivated (leftAt → null,
 * active → true) so we keep their history intact.
 */
export async function joinPod(
  userId: string,
  inviteCode: string,
): Promise<{ pod: Pod; member: PodMember }> {
  const code = inviteCode.trim()
  if (!code) throw new PodError('invalid_code', 'Invite code is required')

  const pod = await prisma.pod.findUnique({
    where: { inviteCode: code },
    include: { members: { where: { active: true } } },
  })
  if (!pod || pod.archivedAt) {
    throw new PodError('pod_not_found', 'No active pod with that invite code')
  }

  const existing = pod.members.find((m) => m.userId === userId && m.active)
  if (existing) {
    return { pod, member: existing }
  }

  if (pod.members.length >= pod.maxMembers) {
    throw new PodError('pod_full', 'This pod is at capacity')
  }

  const member = await prisma.podMember.upsert({
    where: { podId_userId: { podId: pod.id, userId } },
    update: { leftAt: null, active: true, joinedAt: new Date() },
    create: {
      podId: pod.id,
      userId,
      role: 'member',
    },
  })
  return { pod, member }
}

/**
 * Return every active pod the user belongs to. `members` is hydrated so
 * callers can render avatars + shared metrics without a second roundtrip.
 */
export async function getUserPods(
  userId: string,
): Promise<Array<Pod & { members: Array<PodMember & { user: { id: string; name: string | null; avatarUrl: string | null; currentStreak: number; primaryWedge: string; lastActiveAt: Date } }> }>> {
  const memberships = await prisma.podMember.findMany({
    where: { userId, active: true },
    include: {
      pod: {
        include: {
          members: {
            where: { active: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  currentStreak: true,
                  primaryWedge: true,
                  lastActiveAt: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships
    .filter((m) => !m.pod.archivedAt)
    .map((m) => m.pod)
}

/**
 * Pod detail for the requesting user. Throws if the requester is not
 * an active member — both 'not found' and 'not a member' collapse to
 * the same error so we don't leak which pod ids exist.
 */
export async function getPodDetails(
  podId: string,
  requestingUserId: string,
): Promise<Pod & {
  members: Array<PodMember & { user: { id: string; name: string | null; avatarUrl: string | null; currentStreak: number; primaryWedge: string; lastActiveAt: Date } }>
  requesterRole: string
}> {
  const pod = await prisma.pod.findUnique({
    where: { id: podId },
    include: {
      members: {
        where: { active: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              currentStreak: true,
              primaryWedge: true,
              lastActiveAt: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!pod || pod.archivedAt) {
    throw new PodError('pod_not_found', 'Pod not found')
  }

  const requester = pod.members.find((m) => m.userId === requestingUserId)
  if (!requester) {
    throw new PodError('not_a_member', 'Pod not found')
  }

  return { ...pod, requesterRole: requester.role }
}

/**
 * Soft-leave a pod. Sets `leftAt` + `active=false` on the membership
 * row so we keep the history. The pod itself is untouched.
 *
 * Owners cannot leave a pod without first transferring ownership;
 * archiving the pod is the supported exit path.
 */
export async function leavePod(podId: string, userId: string): Promise<void> {
  const member = await prisma.podMember.findUnique({
    where: { podId_userId: { podId, userId } },
  })
  if (!member || !member.active) {
    throw new PodError('not_a_member', 'You are not a member of this pod')
  }
  if (member.role === 'owner') {
    throw new PodError('owner_cannot_leave', 'Owners must archive the pod instead')
  }
  await prisma.podMember.update({
    where: { podId_userId: { podId, userId } },
    data: { leftAt: new Date(), active: false },
  })
}

/**
 * Archive a pod. Only the owner can archive. Soft-delete: archivedAt
 * is set, but member rows are left as-is for audit/history.
 */
export async function archivePod(podId: string, ownerId: string): Promise<void> {
  const member = await prisma.podMember.findUnique({
    where: { podId_userId: { podId, userId: ownerId } },
  })
  if (!member || member.role !== 'owner') {
    throw new PodError('not_owner', 'Only the pod owner can archive')
  }
  await prisma.pod.update({
    where: { id: podId },
    data: { archivedAt: new Date() },
  })
}

/**
 * Compute the shared metrics surfaced on the pod-detail view.
 * - sharedStreak: lowest current streak across active members (the
 *   pod's chain is only as strong as its weakest link).
 * - slipsLast7: total slip records across active members in the last
 *   7 days.
 * - archetypeDistribution: { archetype → count }, archetype-less
 *   members tallied under '__unknown'.
 */
export async function getPodMetrics(podId: string): Promise<{
  sharedStreak: number
  slipsLast7: number
  archetypeDistribution: Record<string, number>
  memberCount: number
}> {
  const members = await prisma.podMember.findMany({
    where: { podId, active: true },
    include: { user: { select: { id: true, currentStreak: true, primaryWedge: true } } },
  })

  const memberCount = members.length
  const sharedStreak =
    memberCount === 0
      ? 0
      : Math.min(...members.map((m) => m.user.currentStreak ?? 0))

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const userIds = members.map((m) => m.user.id)
  const slipsLast7 =
    userIds.length === 0
      ? 0
      : await prisma.slipRecord.count({
          where: { userId: { in: userIds }, createdAt: { gte: sevenDaysAgo } },
        })

  const archetypeDistribution: Record<string, number> = {}
  for (const m of members) {
    const key = m.user.primaryWedge ?? '__unknown'
    archetypeDistribution[key] = (archetypeDistribution[key] ?? 0) + 1
  }

  return { sharedStreak, slipsLast7, archetypeDistribution, memberCount }
}
