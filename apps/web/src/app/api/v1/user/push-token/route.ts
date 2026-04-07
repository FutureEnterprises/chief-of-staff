import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { pushTokenSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit('auth', userId)
  if (rl.limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers })

  const parsed = pushTokenSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid push token' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { clerkId: userId },
    data: { expoPushToken: parsed.data.expoPushToken },
  })

  return NextResponse.json({ ok: true, expoPushToken: user.expoPushToken })
}
