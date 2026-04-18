import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { hasFeature } from '@/lib/services/entitlement.service'
import { Resend } from 'resend'

const inviteSchema = z.object({
  peerEmail: z.string().email(),
})

const respondSchema = z.object({
  partnerId: z.string().cuid(),
  action: z.enum(['accept', 'decline']),
})

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, email: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const [owned, invited] = await Promise.all([
    prisma.accountabilityPartner.findMany({
      where: { ownerId: user.id },
      include: { peer: { select: { id: true, name: true, email: true } } },
    }),
    prisma.accountabilityPartner.findMany({
      where: { peerEmail: user.email, status: 'pending' },
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
  ])

  return Response.json({ owned, invited })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, name: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'accountabilityPartner')
  if (!canUse) {
    return Response.json({ error: 'feature_gated', feature: 'accountabilityPartner' }, { status: 402 })
  }

  const parsed = inviteSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  // Check if peer already exists
  const existingPeer = await prisma.user.findUnique({
    where: { email: parsed.data.peerEmail },
    select: { id: true },
  })

  const partner = await prisma.accountabilityPartner.create({
    data: {
      ownerId: user.id,
      peerEmail: parsed.data.peerEmail,
      peerId: existingPeer?.id ?? null,
    },
  })

  await prisma.productivityEvent
    .create({ data: { userId: user.id, eventType: 'PARTNER_INVITED', eventValue: parsed.data.peerEmail } })
    .catch(() => {})

  // Fire invite email
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>',
        to: parsed.data.peerEmail,
        subject: `${user.name} invited you to be their COYL accountability partner`,
        text: `${user.name} picked you.\n\nYou'll get notified when they slip — and when they recover. Your job: just be visible.\n\nAccept: https://coyl.ai/settings/partners?invite=${partner.id}\n\n— COYL`,
      })
    } catch {
      // silent
    }
  }

  return Response.json({ partner })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, email: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const parsed = respondSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const partner = await prisma.accountabilityPartner.findFirst({
    where: { id: parsed.data.partnerId, peerEmail: user.email, status: 'pending' },
  })
  if (!partner) return Response.json({ error: 'Not found' }, { status: 404 })

  if (parsed.data.action === 'accept') {
    await prisma.accountabilityPartner.update({
      where: { id: partner.id },
      data: { status: 'accepted', acceptedAt: new Date(), peerId: user.id },
    })
    await prisma.productivityEvent.create({
      data: { userId: user.id, eventType: 'PARTNER_ACCEPTED', eventValue: partner.ownerId },
    }).catch(() => {})
  } else {
    await prisma.accountabilityPartner.update({
      where: { id: partner.id },
      data: { status: 'declined' },
    })
  }

  return Response.json({ ok: true })
}
