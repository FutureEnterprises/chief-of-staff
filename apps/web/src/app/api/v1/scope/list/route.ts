/**
 * GET /api/v1/scope/list
 *
 * Clerk-authenticated. Returns the current user's active scope
 * grants grouped by LLM partner. Powers the "Connected AI Partners"
 * screen in the user settings UI.
 *
 * Response:
 *   {
 *     "grants": [
 *       {
 *         "partner": { "slug": "...", "name": "...", "publisher": "..." },
 *         "scopes": ["proactive_food", "edge:watch:haptic"]
 *       },
 *       ...
 *     ]
 *   }
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { listActiveGrants } from '@/lib/scope-grants'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit('api', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const rows = await listActiveGrants(user.id)

  // Group by partner. Stable ordering: partner slug ASC, scopes ASC
  // (listActiveGrants already orders this way, so we just bucket).
  const byPartnerId = new Map<
    string,
    {
      partner: { slug: string; name: string; publisher: string }
      scopes: string[]
    }
  >()

  for (const row of rows) {
    const partnerId = row.llmPartner.id
    const existing = byPartnerId.get(partnerId)
    if (existing) {
      existing.scopes.push(row.scope)
    } else {
      byPartnerId.set(partnerId, {
        partner: {
          slug: row.llmPartner.slug,
          name: row.llmPartner.name,
          publisher: row.llmPartner.publisher,
        },
        scopes: [row.scope],
      })
    }
  }

  return NextResponse.json({
    grants: Array.from(byPartnerId.values()),
  })
}
