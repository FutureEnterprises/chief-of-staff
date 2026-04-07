import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'

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

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'PRO',
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
        stripePriceId: subscription.items.data[0]?.price.id ?? null,
        planType: 'PRO',
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
        stripePriceId: subscription.items.data[0]?.price.id ?? null,
        planType: 'PRO',
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
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  const planType: 'PRO' | 'FREE' = isActive ? 'PRO' : 'FREE'

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { planType } }),
    prisma.billingSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        planType,
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
