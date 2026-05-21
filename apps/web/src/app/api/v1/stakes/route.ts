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

  // Off-session authorization: pull the customer's default payment
  // method (or any saved one) and pre-authorize the stake amount with
  // manual capture. That way:
  //   - "kept"   → cancel the intent (no charge, no refund roundtrip)
  //   - "broken" → capture the authorized amount (funds collected)
  //
  // If the customer has no saved payment method, return 409 so the UI
  // can route them to subscription setup first.
  let paymentMethodId: string | null = null
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (typeof customer === 'object' && !customer.deleted) {
      const dpm = customer.invoice_settings?.default_payment_method
      paymentMethodId = typeof dpm === 'string' ? dpm : dpm?.id ?? null
    }
    if (!paymentMethodId) {
      const pms = await stripe.paymentMethods.list({ customer: customerId, limit: 1 })
      paymentMethodId = pms.data[0]?.id ?? null
    }
  } catch {
    // ignore — fall through to the no-PM error below
  }
  if (!paymentMethodId) {
    return Response.json(
      { error: 'No payment method on file — subscribe first' },
      { status: 409 },
    )
  }

  let stripeIntentId: string | undefined
  try {
    const intent = await stripe.paymentIntents.create({
      amount: parsed.data.amountCents,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: 'manual',
      confirm: true,
      off_session: true,
      description: `COYL stake: ${parsed.data.charityLabel ?? 'GiveDirectly'}`,
      metadata: { userId: user.id, commitmentId: parsed.data.commitmentId ?? '' },
    })
    // requires_action = SCA challenge. v1 returns 402 and lets the user
    // retry with a different card. Real fix: return client_secret and
    // let Stripe.js confirm with the 3DS modal client-side.
    if (intent.status === 'requires_action') {
      return Response.json(
        { error: 'Card requires authentication — try a different card' },
        { status: 402 },
      )
    }
    if (intent.status !== 'requires_capture' && intent.status !== 'succeeded') {
      return Response.json({ error: `Intent status: ${intent.status}` }, { status: 402 })
    }
    stripeIntentId = intent.id
  } catch (err) {
    console.warn('Stake PaymentIntent failed', {
      err: err instanceof Error ? err.message : 'unknown',
    })
    return Response.json({ error: 'Failed to authorize stake' }, { status: 500 })
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
