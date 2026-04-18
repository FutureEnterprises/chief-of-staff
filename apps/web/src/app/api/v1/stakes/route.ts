import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'
import { z } from 'zod'
import { hasFeature } from '@/lib/services/entitlement.service'

const placeSchema = z.object({
  amountCents: z.number().int().min(500).max(100000), // $5 - $1000
  commitmentId: z.string().cuid().optional(),
  charityLabel: z.string().max(80).optional(),
})

const resolveSchema = z.object({
  stakeId: z.string().cuid(),
  outcome: z.enum(['kept', 'broken']),
})

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const stakes = await prisma.stake.findMany({
    where: { userId: user.id },
    include: { commitment: true },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ stakes })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { billingSubscription: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const canUse = await hasFeature(user.id, 'financialStakes')
  if (!canUse) {
    return Response.json({ error: 'feature_gated', feature: 'financialStakes' }, { status: 402 })
  }

  const parsed = placeSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  // Create Stripe PaymentIntent with manual capture — funds authorized but not charged
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return Response.json({ error: 'Stakes not configured' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })
  const customerId = user.billingSubscription?.stripeCustomerId

  if (!customerId) {
    return Response.json({ error: 'No billing profile — subscribe first' }, { status: 409 })
  }

  let stripeIntentId: string | undefined
  try {
    const intent = await stripe.paymentIntents.create({
      amount: parsed.data.amountCents,
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual',
      confirm: false,
      description: `COYL stake: ${parsed.data.charityLabel ?? 'GiveDirectly'}`,
      metadata: { userId: user.id, commitmentId: parsed.data.commitmentId ?? '' },
    })
    stripeIntentId = intent.id
  } catch {
    return Response.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }

  const stake = await prisma.stake.create({
    data: {
      userId: user.id,
      amountCents: parsed.data.amountCents,
      charityLabel: parsed.data.charityLabel ?? 'GiveDirectly',
      stripeIntentId,
    },
  })

  if (parsed.data.commitmentId) {
    await prisma.commitment.updateMany({
      where: { id: parsed.data.commitmentId, userId: user.id },
      data: { stakeAmountCents: parsed.data.amountCents, stakeId: stake.id },
    })
  }

  await prisma.productivityEvent
    .create({
      data: { userId: user.id, eventType: 'STAKE_PLACED', eventValue: stake.id, metadataJson: { amountCents: parsed.data.amountCents } },
    })
    .catch(() => {})

  return Response.json({ stake })
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const parsed = resolveSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const stake = await prisma.stake.findFirst({
    where: { id: parsed.data.stakeId, userId: user.id, status: 'active' },
  })
  if (!stake) return Response.json({ error: 'Not found or already resolved' }, { status: 404 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return Response.json({ error: 'Stakes not configured' }, { status: 503 })
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

  if (parsed.data.outcome === 'kept') {
    // Release the auth (no charge)
    if (stake.stripeIntentId) {
      try { await stripe.paymentIntents.cancel(stake.stripeIntentId) } catch { /* ignore */ }
    }
    await prisma.stake.update({
      where: { id: stake.id },
      data: { status: 'released', refundedAt: new Date() },
    })
    await prisma.productivityEvent
      .create({ data: { userId: user.id, eventType: 'STAKE_REFUNDED', eventValue: stake.id } })
      .catch(() => {})
  } else {
    // Capture the payment — funds go to the charity (OPTIONAL: Stripe Connect transfer)
    if (stake.stripeIntentId) {
      try { await stripe.paymentIntents.capture(stake.stripeIntentId) } catch { /* ignore */ }
    }
    await prisma.stake.update({
      where: { id: stake.id },
      data: { status: 'charged', chargedAt: new Date() },
    })
    await prisma.productivityEvent
      .create({ data: { userId: user.id, eventType: 'STAKE_CHARGED', eventValue: stake.id } })
      .catch(() => {})
  }

  return Response.json({ ok: true })
}
