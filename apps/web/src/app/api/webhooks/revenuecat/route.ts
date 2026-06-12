import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import type { PlanType } from '@repo/database'

/**
 * POST /api/webhooks/revenuecat
 *
 * Receives RevenueCat server-to-server webhook events and reconciles the
 * mobile (StoreKit / Play Billing) entitlement state into User.planType — the
 * single field every entitlement check reads. This is the mobile counterpart to
 * the Stripe webhook (apps/web/src/app/api/webhooks/stripe/route.ts); it mirrors
 * that route's conventions and is careful NEVER to fight it (see the
 * downgrade-safety rule below).
 *
 * THE JOIN KEY
 * ------------
 * The mobile app calls Purchases.logIn(clerkUserId) after Clerk sign-in, so
 * RevenueCat's `app_user_id` IS the Clerk user id. Here we look the User up by
 * `clerkId`. No mapping table, no Prisma migration.
 *
 * ENTITLEMENT → PLAN CONTRACT (must match apps/mobile/lib/purchases.ts)
 * --------------------------------------------------------------------
 *   rebound → PLUS   (rebound wins if a customer somehow holds both)
 *   rewire  → CORE
 *
 * AUTH
 * ----
 * RevenueCat lets you configure a static `Authorization` header on the webhook.
 * We require it to equal process.env.REVENUECAT_WEBHOOK_AUTH, compared with
 * timingSafeEqual (same pattern as lib/cron-auth.ts). Missing env → 503;
 * mismatch → 401.
 *
 * RETRIES
 * -------
 * RevenueCat retries any non-2xx response. So we return 200 on every event we
 * successfully process OR intentionally ignore, and only return non-2xx for
 * genuine auth failures or unexpected handler errors. Unhandled event types are
 * logged and 200'd.
 *
 * DERIVING "HAS AN ACTIVE STRIPE SUB" — NO SCHEMA CHANGE
 * ------------------------------------------------------
 * The Stripe webhook maintains a BillingSubscription row (provider defaults to
 * "stripe"). An active Stripe subscriber is one whose BillingSubscription has a
 * stripeSubscriptionId and a status that is not a terminal/cancelled state.
 * We read that row rather than adding any provider-tracking column.
 */

// RevenueCat event types we act on. Anything else is logged + ignored.
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  // NON_RENEWING_PURCHASE covers consumables/non-subs; harmless to treat as a
  // grant if a future non-renewing product maps to an entitlement.
  'NON_RENEWING_PURCHASE',
])

// EXPIRATION is the real downgrade signal — the entitlement has actually lapsed.
// An ordinary CANCELLATION runs to period end (the user keeps access until
// EXPIRATION), so we do NOT downgrade on CANCELLATION. We only downgrade on
// EXPIRATION and on an immediate revocation (refund / billing-issue grace end).
const REVOKE_EVENTS = new Set(['EXPIRATION'])

const REBOUND = 'rebound'
const REWIRE = 'rewire'

// Plans the RevenueCat layer is allowed to have granted, and is therefore
// allowed to revoke back to FREE. We NEVER touch PREMIUM / TEAM / PRO — those
// come from Stripe or legacy grants and aren't ours to clear.
const RC_GRANTABLE_PLANS: ReadonlySet<PlanType> = new Set<PlanType>(['CORE', 'PLUS'])

type RevenueCatEvent = {
  type?: string
  app_user_id?: string
  // Some events also carry aliases / original_app_user_id; app_user_id is the
  // current identified id, which is what we logged in with.
  entitlement_ids?: string[] | null
  entitlement_id?: string | null
}

type RevenueCatEnvelope = {
  event?: RevenueCatEvent
}

/** Constant-time compare of the configured static auth header. */
function authOk(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** All entitlement ids carried on the event (handles both shapes). */
function eventEntitlements(ev: RevenueCatEvent): string[] {
  if (Array.isArray(ev.entitlement_ids)) return ev.entitlement_ids
  if (ev.entitlement_id) return [ev.entitlement_id]
  return []
}

/** rebound wins over rewire; null if the event names neither. */
function planFromEntitlements(ids: string[]): PlanType | null {
  if (ids.includes(REBOUND)) return 'PLUS'
  if (ids.includes(REWIRE)) return 'CORE'
  return null
}

/**
 * Does this user currently have an active Stripe subscription? Read straight
 * from the BillingSubscription row the Stripe webhook maintains — no schema
 * change. "Active" = a Stripe-provider row with a stripeSubscriptionId whose
 * status is not a cancelled/terminal state.
 */
async function hasActiveStripeSub(userId: string): Promise<boolean> {
  const sub = await prisma.billingSubscription.findUnique({
    where: { userId },
    select: { provider: true, stripeSubscriptionId: true, status: true },
  })
  if (!sub) return false
  if (sub.provider !== 'stripe') return false
  if (!sub.stripeSubscriptionId) return false
  const dead = new Set(['cancelled', 'canceled', 'incomplete_expired', 'unpaid'])
  return !dead.has((sub.status ?? '').toLowerCase())
}

export async function POST(req: Request) {
  // ── Auth ──
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH
  if (!expected) {
    return NextResponse.json({ error: 'RevenueCat webhook not configured' }, { status: 503 })
  }
  const provided = req.headers.get('authorization') ?? ''
  if (!authOk(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse ──
  let envelope: RevenueCatEnvelope
  try {
    envelope = (await req.json()) as RevenueCatEnvelope
  } catch {
    // Malformed body — 400 (not a retry-worthy server error).
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = envelope.event
  const type = event?.type
  const appUserId = event?.app_user_id

  if (!event || !type) {
    return NextResponse.json({ error: 'Missing event' }, { status: 400 })
  }

  // TEST events (sent from the dashboard "Send test" button) and any event
  // without an app_user_id can't be reconciled to a user — ack and move on.
  if (!appUserId || type === 'TEST') {
    console.log('[RC webhook] ignoring event without actionable app_user_id', { type })
    return NextResponse.json({ received: true })
  }

  try {
    // app_user_id === Clerk id (set via Purchases.logIn). Find the local user.
    const user = await prisma.user.findUnique({
      where: { clerkId: appUserId },
      select: { id: true, planType: true },
    })
    if (!user) {
      // Unknown user — common for sandbox/test traffic. Ack so RevenueCat
      // doesn't retry forever.
      console.warn('[RC webhook] no user for app_user_id', { type, appUserId })
      return NextResponse.json({ received: true })
    }

    if (GRANT_EVENTS.has(type)) {
      const plan = planFromEntitlements(eventEntitlements(event))
      if (!plan) {
        console.log('[RC webhook] grant event names no COYL entitlement; ignoring', {
          type,
          userId: user.id,
        })
        return NextResponse.json({ received: true })
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { planType: plan } }),
        prisma.productivityEvent.create({
          data: { userId: user.id, eventType: 'UPGRADE_COMPLETED' },
        }),
      ])
      console.log('[RC webhook] granted', { type, userId: user.id, plan })
      return NextResponse.json({ received: true })
    }

    if (REVOKE_EVENTS.has(type)) {
      // Downgrade-safety rule (verbatim intent):
      // Only downgrade to FREE when BOTH:
      //   (a) the user does NOT have an active Stripe subscription, AND
      //   (b) their current planType is one RevenueCat could have granted
      //       (CORE or PLUS) — never touch PREMIUM / TEAM / PRO.
      // This stops an expired App-Store trial from downgrading a Stripe-paying
      // user (or a higher-tier/legacy plan we don't own).
      if (!RC_GRANTABLE_PLANS.has(user.planType)) {
        console.log('[RC webhook] expiration ignored — plan not RC-granted', {
          type,
          userId: user.id,
          planType: user.planType,
        })
        return NextResponse.json({ received: true })
      }
      if (await hasActiveStripeSub(user.id)) {
        console.log('[RC webhook] expiration ignored — active Stripe sub present', {
          type,
          userId: user.id,
        })
        return NextResponse.json({ received: true })
      }
      await prisma.user.update({ where: { id: user.id }, data: { planType: 'FREE' } })
      console.log('[RC webhook] revoked → FREE', { type, userId: user.id })
      return NextResponse.json({ received: true })
    }

    // Known-but-ignored (CANCELLATION runs to period end; BILLING_ISSUE,
    // SUBSCRIPTION_PAUSED, TRANSFER, etc. don't change planType here) and any
    // unrecognised type: log and ack.
    console.log('[RC webhook] unhandled event type — acknowledged', { type })
    return NextResponse.json({ received: true })
  } catch (err) {
    // Genuine server error — return 500 so RevenueCat retries.
    console.error('[RC webhook] handler error', {
      type,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
