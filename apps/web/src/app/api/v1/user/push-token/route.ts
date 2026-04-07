import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { expoPushToken } = body

  if (!expoPushToken || typeof expoPushToken !== 'string') {
    return NextResponse.json({ error: 'Missing expoPushToken' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { clerkId: userId },
    data: { expoPushToken },
  })

  return NextResponse.json({ ok: true, expoPushToken: user.expoPushToken })
}
