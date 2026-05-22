/**
 * /api/v1/redirect-choices — CRUD over the user's three pre-approved
 * alternatives to autopilot behavior.
 *
 *   GET    → list all active RedirectChoice rows for this user,
 *            ordered by rank ascending.
 *   POST   → create a new RedirectChoice. Hard cap of 3 active; if
 *            the user already has three, the response says "use PATCH"
 *            with a 400, not 409 — the caller should treat this as an
 *            input error and route the user to the edit UI instead.
 *   PATCH  → update text / rank / active / category on an existing
 *            choice (must belong to the calling user).
 *
 * Effectiveness is tracked elsewhere (POST /api/v1/intervention
 * increments servedCount; a separate feedback flow increments
 * acceptedCount). This route deliberately does NOT expose those
 * counters to writes — they're system-managed.
 *
 * Auth: Clerk Bearer token. 401 when unauthenticated.
 */

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'

export const maxDuration = 10

const REDIRECT_CATEGORIES = ['connection', 'creative', 'physical', 'rest', 'other'] as const

const createSchema = z.object({
  text: z.string().min(3).max(160),
  category: z.enum(REDIRECT_CATEGORIES).optional(),
  rank: z.number().int().min(1).max(3).optional(),
})

const patchSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(3).max(160).optional(),
  category: z.enum(REDIRECT_CATEGORIES).optional(),
  rank: z.number().int().min(1).max(3).optional(),
  active: z.boolean().optional(),
})

async function loadUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await loadUser(clerkId)
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const choices = await prisma.redirectChoice.findMany({
    where: { userId: user.id, active: true },
    orderBy: [{ rank: 'asc' }, { createdAt: 'asc' }],
  })

  return Response.json({ choices })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await loadUser(clerkId)
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Hard cap at 3 active. The product rule says the user maintains a
  // tight, owned set — not a wishlist. If they want a different #2,
  // they edit it.
  const activeCount = await prisma.redirectChoice.count({
    where: { userId: user.id, active: true },
  })
  if (activeCount >= 3) {
    return Response.json(
      {
        error: 'limit_reached',
        message: 'You already have 3 active redirects. Update or archive an existing one instead.',
        action: 'PATCH /api/v1/redirect-choices',
      },
      { status: 400 },
    )
  }

  // Default rank = next free slot (1, 2, or 3). If the caller passed
  // an explicit rank that's already taken, we still accept it — the
  // user can re-rank with PATCH later.
  const rank = parsed.data.rank ?? Math.min(activeCount + 1, 3)

  const choice = await prisma.redirectChoice.create({
    data: {
      userId: user.id,
      rank,
      text: parsed.data.text,
      category: parsed.data.category ?? null,
    },
  })

  return Response.json({ choice }, { status: 201 })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await loadUser(clerkId)
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Ownership check before any mutation. Anything else is 404 so we
  // don't leak ID existence.
  const existing = await prisma.redirectChoice.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  })
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  // Reactivating from archive resets archivedAt; deactivating sets it.
  // This is the only place we touch archivedAt to keep its semantics
  // tight ("the moment the user archived this").
  const wantsActive = parsed.data.active
  const archivedAt =
    wantsActive === undefined
      ? undefined
      : wantsActive
      ? null
      : existing.archivedAt ?? new Date()

  const updated = await prisma.redirectChoice.update({
    where: { id: existing.id },
    data: {
      text: parsed.data.text ?? undefined,
      category:
        parsed.data.category === undefined ? undefined : parsed.data.category,
      rank: parsed.data.rank ?? undefined,
      active: parsed.data.active ?? undefined,
      archivedAt,
    },
  })

  return Response.json({ choice: updated })
}
