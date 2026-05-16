import webpush from 'web-push'
import { prisma, Prisma } from '@repo/database'

/**
 * Web Push helper.
 *
 * Used by the danger-window-interrupt cron (and other interrupt-firing
 * crons) to send push notifications to web-subscribed users in parallel
 * with the Expo push pipeline for mobile users.
 *
 * VAPID setup:
 *   1. Generate keys once: `npx web-push generate-vapid-keys`
 *   2. Set env vars in Vercel:
 *      - VAPID_PUBLIC_KEY  (also exposed to client as
 *        NEXT_PUBLIC_VAPID_PUBLIC_KEY — same value)
 *      - VAPID_PRIVATE_KEY
 *      - VAPID_SUBJECT     (mailto:hello@coyl.ai)
 *   3. Browser uses NEXT_PUBLIC_VAPID_PUBLIC_KEY to subscribe; server
 *      uses the private key to sign each push.
 *
 * Failure modes:
 *   - 404 / 410 from the push endpoint = subscription expired or
 *     revoked. Caller should clear webPushSubscription on the user row.
 *   - Other errors are logged and swallowed so one bad subscription
 *     doesn't take down the cron batch.
 */

export type WebPushSubscription = {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export type WebPushPayload = {
  title: string
  body: string
  data?: Record<string, unknown>
}

export type SendResult = 'sent' | 'expired' | 'error' | 'skipped'

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:hello@coyl.ai'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

/**
 * Send a single web-push notification.
 * Returns:
 *   'sent'    — push accepted by browser push service
 *   'expired' — subscription is gone, caller should clear it from DB
 *   'error'   — transient or config failure, logged
 */
export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: WebPushPayload,
): Promise<SendResult> {
  if (!ensureConfigured()) {
    console.warn('web-push not configured (missing VAPID env vars)')
    return 'error'
  }

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload),
      { TTL: 60 }, // notifications older than 60s shouldn't be delivered
    )
    return 'sent'
  } catch (err: unknown) {
    const statusCode =
      err instanceof Error && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : null
    if (statusCode === 404 || statusCode === 410) {
      return 'expired'
    }
    console.warn('web-push send failed', {
      statusCode,
      message: err instanceof Error ? err.message : 'unknown',
    })
    return 'error'
  }
}

/**
 * Cron-friendly wrapper: take a user row (or anything with id +
 * webPushSubscription Json), send if subscribed, auto-clear the DB row
 * on expired so the next cron tick doesn't retry a dead endpoint.
 *
 * Returns 'skipped' when the user has no subscription — lets the caller
 * compose a channel string ("expo+web+email") without an outer null check.
 *
 * Threading the prisma update through here means each cron only has to
 * pass the user object + payload, not implement its own cleanup branch.
 */
export async function sendWebPushForUser(args: {
  userId: string
  subscription: unknown
  payload: WebPushPayload
}): Promise<SendResult> {
  if (!args.subscription) return 'skipped'

  const sub = args.subscription as WebPushSubscription
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return 'skipped'
  }

  const result = await sendWebPush(sub, args.payload)
  if (result === 'expired') {
    await prisma.user
      .update({
        where: { id: args.userId },
        data: { webPushSubscription: Prisma.JsonNull },
      })
      .catch(() => {})
  }
  return result
}
