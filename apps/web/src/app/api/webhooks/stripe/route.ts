import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return new NextResponse('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
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
        await handlePaymentFailed(invoice)
        break
      }
    }
  } catch (err) {
    console.error('Error processing Stripe webhook', { type: event.type, err })
    return new NextResponse('Webhook handler error', { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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
  const planType = isActive ? 'PRO' : 'FREE'

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { planType: planType as any } }),
    prisma.billingSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        planType: planType as any,
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

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription =
    typeof invoice.subscription === 'string'
      ? await stripe.subscriptions.retrieve(invoice.subscription)
      : null
  const userId = subscription?.metadata?.userId
  if (!userId) return

  console.warn('Payment failed for user', {
    userId,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
  })
  // Could send a payment-failed email here via Resend
}
