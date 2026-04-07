import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })
  const PRICE_IDS = {
    pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  }

  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { billingSubscription: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const rl = await checkRateLimit('checkout', user.id)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers })
  }

  const { checkoutSchema } = await import('@/lib/validations')
  const parsed = checkoutSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
  }

  const { interval } = parsed.data
  const priceId = interval === 'annual' ? PRICE_IDS.pro_annual : PRICE_IDS.pro_monthly

  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price IDs not configured' }, { status: 503 })
  }

  // Reuse existing Stripe customer if possible
  let stripeCustomerId = user.billingSubscription?.stripeCustomerId ?? undefined

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id, clerkId },
    })
    stripeCustomerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: interval === 'annual' ? 7 : undefined,
      metadata: { userId: user.id },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    allow_promotion_codes: true,
    metadata: { userId: user.id },
  })

  // Log the paywall event
  await prisma.productivityEvent.create({
    data: { userId: user.id, eventType: 'UPGRADE_STARTED', eventValue: interval },
  })

  return NextResponse.json({ url: session.url })
}
