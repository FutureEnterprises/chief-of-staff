import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { pushTokenSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/v1/mobile/push-token
 *
 * Persists the device's Expo push token to User.expoPushToken so the web
 * cron (danger-window-interrupt, post-slip-interrupt, churn) can deliver Expo
 * push to this device. The mobile app calls this on sign-in once it has the
 * token from Notifications.getExpoPushTokenAsync().
 *
 * Auth: Clerk session token (Bearer) → clerkId → User row (User.clerkId).
 * `auth()` is kept outside try/catch per the Next 16 cacheComponents pattern
 * used across the api/v1 routes.
 *
 * Body: { expoPushToken: string }  (validated by pushTokenSchema — must be a
 * non-empty "ExponentPushToken[...]" string)
 *
 * Mirrors the existing /api/v1/user/push-token route; lives under the mobile
 * namespace so the mobile client has a single, stable /api/v1/mobile/* surface.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit('auth', clerkId)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rl.headers },
    )
  }

  const parsed = pushTokenSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid push token' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { clerkId },
    data: { expoPushToken: parsed.data.expoPushToken },
  })

  return NextResponse.json({ ok: true, expoPushToken: user.expoPushToken })
}
