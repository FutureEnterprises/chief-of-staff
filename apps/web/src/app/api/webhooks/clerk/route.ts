import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@repo/database'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: {
    type: string
    data: {
      id: string
      email_addresses?: Array<{ email_address: string }>
      first_name?: string
      last_name?: string
      image_url?: string
    }
  }

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof evt
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const { type, data } = evt

  if (type === 'user.created' || type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address ?? ''
    const name = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || email

    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: { email, name, avatarUrl: data.image_url },
      create: { clerkId: data.id, email, name, avatarUrl: data.image_url },
    })
  }

  if (type === 'user.deleted') {
    await prisma.user.deleteMany({ where: { clerkId: data.id } })
  }

  return NextResponse.json({ received: true })
}
