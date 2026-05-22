/**
 * Live Activity push helper.
 *
 * Sends APNs `liveactivity`-type pushes to an iOS ActivityKit Live
 * Activity so the lock-screen widget updates without the app being
 * foregrounded. Lives alongside web-push.ts and the Expo push pipeline
 * — danger-window-interrupt fans an interrupt across all three.
 *
 * APNs uses HTTP/2 to api.push.apple.com (and api.sandbox.push.apple.com
 * for dev builds). Live Activity pushes have a special pair of
 * requirements vs. normal alert pushes:
 *
 *   • apns-topic must be "<bundle-id>.push-type.liveactivity"
 *   • apns-push-type must be "liveactivity"
 *   • apns-priority must be 10 (immediate) for update events,
 *     5 (deferrable) is allowed for low-priority but we use 10
 *     for all interrupt updates.
 *
 * Auth is JWT-based: a short-lived ES256 JWT signed with the .p8 key
 * you download from Apple Developer → Keys. The JWT must be refreshed
 * at least every hour but Apple recommends not regenerating more
 * frequently than every 20 min; we cache one for ~50 min.
 *
 * Env vars (set in Vercel Production + Preview before first deploy):
 *   APNS_KEY_ID       — 10-char key ID from Apple Developer Keys page
 *   APNS_TEAM_ID      — 10-char Apple Team ID
 *   APNS_BUNDLE_ID    — e.g. "ai.coyl.app"
 *   APNS_KEY_P8       — full contents of the .p8 file, including the
 *                       BEGIN/END PRIVATE KEY lines and newlines
 *   APNS_ENV          — "production" | "development" (default "production")
 *
 * The .p8 file format is PKCS#8 PEM. Node's built-in `crypto` can sign
 * ES256 with it directly — no `jose` or `jsonwebtoken` dependency
 * required. If any of the four required env vars are missing, every
 * call returns { ok: false, error: 'apns_not_configured' } so callers
 * can skip silently rather than crash.
 */

import { createSign, type KeyObject, createPrivateKey } from 'crypto'

export type LiveActivityContentState = {
  headline?: string
  subhead?: string
  timeRemainingSec?: number
  // Free-form passthrough — the widget can pull whatever extra fields
  // it wants. Keep these JSON-serializable + small (APNs payload limit
  // for Live Activity updates is 4 KB).
  [key: string]: unknown
}

export type LiveActivityPushArgs = {
  pushToken: string
  activityId: string
  contentState: LiveActivityContentState
  /** 'update' (default) keeps the activity alive; 'end' dismisses it. */
  event?: 'update' | 'end'
  /** Seconds from now after which the activity should be considered stale. */
  staleAfterSec?: number
}

export type LiveActivityPushResult =
  | { ok: true; status: number }
  | { ok: false; error: string; status?: number; reason?: string }

// ---------- Config + JWT cache ----------

function getConfig(): {
  keyId: string
  teamId: string
  bundleId: string
  privateKey: string
  host: string
} | null {
  const keyId = process.env.APNS_KEY_ID
  const teamId = process.env.APNS_TEAM_ID
  const bundleId = process.env.APNS_BUNDLE_ID
  const privateKey = process.env.APNS_KEY_P8
  if (!keyId || !teamId || !bundleId || !privateKey) return null

  const env = (process.env.APNS_ENV ?? 'production').toLowerCase()
  const host =
    env === 'development' || env === 'sandbox'
      ? 'api.sandbox.push.apple.com'
      : 'api.push.apple.com'

  return { keyId, teamId, bundleId, privateKey, host }
}

type JwtCache = { token: string; expiresAt: number }
let jwtCache: JwtCache | null = null

/**
 * Build a fresh ES256 JWT, caching for ~50 min. Apple rejects JWTs
 * older than 1 hour and recommends not minting more than once per
 * 20 min — 50 min sits squarely inside both bounds.
 */
function getOrMintJwt(cfg: NonNullable<ReturnType<typeof getConfig>>): string {
  const now = Math.floor(Date.now() / 1000)
  if (jwtCache && jwtCache.expiresAt > now + 60) {
    return jwtCache.token
  }

  const header = { alg: 'ES256', kid: cfg.keyId, typ: 'JWT' }
  const payload = { iss: cfg.teamId, iat: now }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  let privateKeyObj: KeyObject
  try {
    privateKeyObj = createPrivateKey({ key: cfg.privateKey, format: 'pem' })
  } catch (err) {
    throw new Error(
      `APNS_KEY_P8 is not a valid PEM-encoded private key: ${
        err instanceof Error ? err.message : 'unknown'
      }`,
    )
  }

  const signer = createSign('SHA256')
  signer.update(signingInput)
  signer.end()
  // dsaEncoding 'ieee-p1363' gives the 64-byte (r || s) signature that
  // JWT requires; the default 'der' would produce an ASN.1 signature
  // which APNs rejects.
  const signature = signer.sign({
    key: privateKeyObj,
    dsaEncoding: 'ieee-p1363',
  })
  const encodedSignature = base64UrlFromBuffer(signature)
  const token = `${signingInput}.${encodedSignature}`

  jwtCache = { token, expiresAt: now + 50 * 60 }
  return token
}

function base64UrlEncode(input: string): string {
  return base64UrlFromBuffer(Buffer.from(input, 'utf8'))
}

function base64UrlFromBuffer(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ---------- Public API ----------

/**
 * Send a single Live Activity update via APNs.
 *
 * Returns `{ ok: false, error: 'apns_not_configured' }` if any of the
 * four required env vars are missing — callers should treat that as a
 * silent skip, not a crash. This is the same shape web-push uses when
 * VAPID isn't set up; lets us land the server scaffolding before the
 * .p8 key is wired in Vercel.
 */
export async function pushLiveActivityUpdate(
  opts: LiveActivityPushArgs,
): Promise<LiveActivityPushResult> {
  const cfg = getConfig()
  if (!cfg) return { ok: false, error: 'apns_not_configured' }

  if (!opts.pushToken || !opts.activityId) {
    return { ok: false, error: 'missing_token_or_activity_id' }
  }

  let jwt: string
  try {
    jwt = getOrMintJwt(cfg)
  } catch (err) {
    return {
      ok: false,
      error: 'jwt_signing_failed',
      reason: err instanceof Error ? err.message : 'unknown',
    }
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const event = opts.event ?? 'update'
  const staleAfterSec = opts.staleAfterSec ?? 60

  const aps: Record<string, unknown> = {
    timestamp: nowSec,
    event,
    'content-state': opts.contentState,
    'stale-date': nowSec + staleAfterSec,
  }
  // For 'end' events, you can optionally include a `dismissal-date`
  // (seconds-since-epoch) to schedule removal from the lock screen.
  // We end immediately by leaving it off — APNs treats absence as "now".
  const body = JSON.stringify({ aps })

  // APNs accepts the request-id header for tracing; reusing activityId
  // here makes it easy to correlate cron logs to APNs server logs.
  const headers: Record<string, string> = {
    authorization: `bearer ${jwt}`,
    'apns-topic': `${cfg.bundleId}.push-type.liveactivity`,
    'apns-push-type': 'liveactivity',
    'apns-priority': '10',
    'apns-expiration': String(nowSec + staleAfterSec),
    'content-type': 'application/json',
  }

  try {
    const res = await fetch(`https://${cfg.host}/3/device/${opts.pushToken}`, {
      method: 'POST',
      headers,
      body,
    })

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, status: res.status }
    }

    // APNs returns a structured error body on failures — surface the
    // `reason` so callers (and the danger-window cron's logs) can
    // distinguish BadDeviceToken (clear the row) from transient 5xx.
    let reason: string | undefined
    try {
      const errBody = (await res.json()) as { reason?: string }
      reason = typeof errBody.reason === 'string' ? errBody.reason : undefined
    } catch {
      // empty body or non-JSON — fine
    }
    return { ok: false, error: 'apns_error', status: res.status, reason }
  } catch (err) {
    return {
      ok: false,
      error: 'apns_request_failed',
      reason: err instanceof Error ? err.message : 'unknown',
    }
  }
}

/**
 * Convenience for the cron: looks at the APNs result and decides if
 * the registration should be flipped inactive. BadDeviceToken means
 * the activity is gone (user dismissed, app uninstalled, etc.) and
 * future sends will keep failing — caller should set active=false on
 * the LiveActivityRegistration row. Returns false for transient 5xx
 * so we don't churn rows on a brief APNs hiccup.
 */
export function isLiveActivityTokenDead(result: LiveActivityPushResult): boolean {
  if (result.ok) return false
  if (result.status === 410) return true // Unregistered
  const reason = result.reason
  if (
    reason === 'BadDeviceToken' ||
    reason === 'Unregistered' ||
    reason === 'DeviceTokenNotForTopic' ||
    reason === 'ExpiredToken'
  ) {
    return true
  }
  return false
}
