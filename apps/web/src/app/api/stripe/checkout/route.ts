import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

// Price IDs — set these in your Vercel env vars
const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { billingSubscription: true },
  })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const { interval } = await req.json()
  const priceId = interval === 'annual' ? PRICE_IDS.pro_annual : PRICE_IDS.pro_monthly

  if (!priceId) {
    return new NextResponse('Stripe price IDs not configured', { status: 500 })
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
