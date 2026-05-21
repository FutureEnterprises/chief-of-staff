import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'
import { markReferralConverted } from '@/lib/referrals'

type PaidTier = 'CORE' | 'PLUS' | 'PREMIUM'

/**
 * Map a Stripe price ID to one of our four PlanType paid tiers.
 *
 * Source of truth for tier definitions: apps/web/src/lib/services/entitlement.service.ts
 * Source of truth for price IDs: Vercel env vars (set per Stripe Dashboard).
 *
 * Without this mapping, every paid checkout writes `planType: 'PRO'` to the
 * user record. PRO is the legacy paid plan and is treated as Core in
 * entitlements, which means a Plus customer paying $29/mo or a Premium
 * customer paying $49/mo would receive only Core features. That is a
 * revenue and trust bug, so map explicitly and fail closed (return null,
 * caller falls back to PRO for legacy safety) if no env match is found.
 */
function tierFromPriceId(priceId: string | null | undefined): PaidTier | null {
  if (!priceId) return null

  const env = process.env
  // Backwards compat: legacy PRO_* env names map to Core, since PRO has
  // always been the entry paid plan in our schema.
  if (
    priceId === env.STRIPE_CORE_MONTHLY_PRICE_ID ||
    priceId === env.STRIPE_CORE_ANNUAL_PRICE_ID ||
    priceId === env.STRIPE_PRO_MONTHLY_PRICE_ID ||
    priceId === env.STRIPE_PRO_ANNUAL_PRICE_ID
  ) {
    return 'CORE'
  }
  if (
    priceId === env.STRIPE_PLUS_MONTHLY_PRICE_ID ||
    priceId === env.STRIPE_PLUS_ANNUAL_PRICE_ID
  ) {
    return 'PLUS'
  }
  if (
    priceId === env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
    priceId === env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
  ) {
    return 'PREMIUM'
  }
  return null
}

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    console.error('Stripe webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, stripe)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, stripe)
        break
      }
    }
  } catch (err) {
    console.error('Error processing Stripe webhook', { type: event.type, error: err instanceof Error ? err.message : 'Unknown error' })
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  const userId = session.metadata?.userId
  if (!userId || session.mode !== 'subscription') return

  const subscriptionId = session.subscription as string
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Resolve the paid tier from the actual price the customer purchased.
  // Falls back to 'PRO' (legacy, treated as CORE downstream) only if no env
  // match — fail visible but not destructive.
  const priceId = subscription.items.data[0]?.price.id ?? null
  const resolvedTier = tierFromPriceId(priceId) ?? 'PRO'
  if (!tierFromPriceId(priceId)) {
    console.warn('Stripe webhook: no price-ID env match, falling back to PRO', { priceId, userId })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        planType: resolvedTier,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
    }),
    prisma.billingSubscription.upsert({
      where: { userId },
      update: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        planType: resolvedTier,
        status: subscription.status,
        renewsAt: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        planType: resolvedTier,
        status: subscription.status,
        startedAt: new Date(),
        renewsAt: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
    }),
    prisma.productivityEvent.create({
      data: {
        userId,
        eventType: subscription.trial_end ? 'TRIAL_STARTED' : 'UPGRADE_COMPLETED',
      },
    }),
  ])

  // Referral conversion — flip the Referral row to converted, grant +1
  // month credit to BOTH referrer and referred (redeemed at next Stripe
  // checkout as a 100%-off coupon — see lib/referrals.markReferralConverted
  // and apps/web/src/app/api/stripe/checkout/route.ts). Only fires on
  // real upgrade, not on a free trial start.
  if (!subscription.trial_end) {
    await markReferralConverted(userId).catch((err) => {
      console.warn('markReferralConverted failed (non-fatal)', {
        userId,
        err: err instanceof Error ? err.message : 'unknown',
      })
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  // When active, resolve tier from the price the customer is on right now
  // (handles upgrades and downgrades). When inactive, drop to FREE.
  const priceId = subscription.items.data[0]?.price.id ?? null
  const resolvedTier = isActive ? (tierFromPriceId(priceId) ?? 'PRO') : 'FREE'

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { planType: resolvedTier } }),
    prisma.billingSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        planType: resolvedTier,
        stripePriceId: priceId,
        renewsAt: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    }),
  ])
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { planType: 'FREE' } }),
    prisma.billingSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        planType: 'FREE',
        cancelledAt: new Date(),
      },
    }),
  ])
}

async function handlePaymentFailed(invoice: Stripe.Invoice, stripe: Stripe) {
  const subscription =
    typeof invoice.subscription === 'string'
      ? await stripe.subscriptions.retrieve(invoice.subscription)
      : null
  const userId = subscription?.metadata?.userId
  if (!userId) return

  console.warn('Payment failed for user', {
    userId,
    invoiceId: invoice.id,
  })
  // Could send a payment-failed email here via Resend
}
