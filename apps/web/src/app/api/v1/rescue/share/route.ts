import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { createShareableRescue } from '@/lib/rescue-share'

/**
 * POST /api/v1/rescue/share
 *
 * Called from the rescue-view "Share the moment" button after the user
 * marks "pulled through." Creates a RescueSession row with
 * outcome=PULLED_THROUGH + a fresh opaque shareCode, then returns the
 * card payload + the public share URL.
 *
 * Authenticated. The trigger key is the same value the rescue endpoint
 * accepts; we validate against the same Zod shape.
 */

// Must be a real RescueTrigger — the value goes straight into the
// Prisma enum column. A free-string cast would throw (500) on any
// unknown value instead of returning a 400.
const schema = z.object({
  trigger: z.enum([
    'BINGE_URGE',
    'DELIVERY_URGE',
    'NICOTINE_URGE',
    'ALCOHOL_URGE',
    'SKIP_WORKOUT',
    'SKIP_WEIGHIN',
    'ALREADY_SLIPPED',
    'SPIRALING',
    'DOOMSCROLL',
    'IMPULSE_SPEND',
    'OTHER',
  ]),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, timezone: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 })
  }

  const card = await createShareableRescue({
    userId: user.id,
    triggerKey: parsed.data.trigger,
    timezone: user.timezone,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  return NextResponse.json({
    ...card,
    shareUrl: `${baseUrl}/i/${card.shareCode}`,
  })
}
