import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'
import { checkRateLimit } from '@/lib/rate-limit'
import { mintReferralCoupon, consumeReferralCredit } from '@/lib/referrals'

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })
  // Tier → display name + price (must match the public /pricing page):
  //   core    → Rewire   $12/mo · $99/yr
  //   plus    → Rebound  $29/mo · $199/yr   (GLP-1 maintenance tier)
  //   premium → legacy back-compat only (not shown on the paywall)
  // Backwards compat: legacy PRO_* fall back for CORE_* if the new vars
  // are unset.
  const PRICE_IDS = {
    core_monthly: process.env.STRIPE_CORE_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    core_annual: process.env.STRIPE_CORE_ANNUAL_PRICE_ID ?? process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    plus_monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    plus_annual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID,
    premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    premium_annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  } as const

  // The exact env var backing each (tier × interval) — used to name the
  // precise missing var in the 503 log so misconfiguration is visible.
  const PRICE_ENV_VARS = {
    core_monthly: 'STRIPE_CORE_MONTHLY_PRICE_ID',
    core_annual: 'STRIPE_CORE_ANNUAL_PRICE_ID',
    plus_monthly: 'STRIPE_PLUS_MONTHLY_PRICE_ID',
    plus_annual: 'STRIPE_PLUS_ANNUAL_PRICE_ID',
    premium_monthly: 'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    premium_annual: 'STRIPE_PREMIUM_ANNUAL_PRICE_ID',
  } as const

  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { billingSubscription: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Redeem one referral credit month, if the user has any. Mints a
  // 100%-off, single-cycle Stripe coupon and attaches it to this
  // checkout. Atomic: consumeReferralCredit decrements only if the
  // counter is > 0, so two parallel checkouts can't double-spend.
  let referralCouponId: string | null = null
  if (user.referralCreditMonths > 0) {
    const consumed = await consumeReferralCredit(user.id)
    if (consumed) {
      referralCouponId = await mintReferralCoupon(stripe, user.id)
      if (!referralCouponId) {
        // Coupon mint failed — refund the credit so the user isn't
        // out a month.
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCreditMonths: { increment: 1 } },
        }).catch(() => {})
      }
    }
  }

  const rl = await checkRateLimit('checkout', user.id)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rl.headers })
  }

  const { checkoutSchema } = await import('@/lib/validations')
  const parsed = checkoutSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
  }

  const { interval, tier = 'core' } = parsed.data as { interval: 'monthly' | 'annual'; tier?: 'core' | 'plus' | 'premium' }
  const priceKey = `${tier}_${interval}` as keyof typeof PRICE_IDS
  const priceId = PRICE_IDS[priceKey]

  if (!priceId) {
    // Name the exact env var the founder must set so the misconfiguration
    // isn't invisible until this 503 fires at the first checkout.
    const missingVar = PRICE_ENV_VARS[priceKey]
    console.error(
      `[stripe/checkout] Missing price ID for tier="${tier}" interval="${interval}". Set ${missingVar} in Vercel (Production + Preview).`
    )
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
    // If a referral credit was redeemed, attach the 100%-off coupon
    // to the subscription itself (applies to the first billing cycle).
    // Mutually exclusive with allow_promotion_codes; users on a referral
    // credit can't stack a second promo code on top.
    ...(referralCouponId
      ? { discounts: [{ coupon: referralCouponId }] }
      : { allow_promotion_codes: true }),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true${referralCouponId ? '&referral_credit=1' : ''}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { userId: user.id, ...(referralCouponId ? { referralCouponId } : {}) },
  })

  // Log the paywall event
  await prisma.productivityEvent.create({
    data: { userId: user.id, eventType: 'UPGRADE_STARTED', eventValue: interval },
  })

  return NextResponse.json({ url: session.url })
}
