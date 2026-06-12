/**
 * Device-endpoint auth resolver.
 *
 * Shared by the two coordinator-facing routes keyed on a path
 * `<deviceId>`:
 *
 *   GET  /api/eap/v1/devices/<deviceId>/pending-actions
 *   POST /api/eap/v1/sensor/<deviceId>/publish
 *
 * Both are MACHINE auth — they are hit by the user's own device
 * coordinator (and, for the partner path, by an LLM partner). There is
 * NO single credential every documented client sends today, so we
 * accept three, tried in order, and require that whichever one wins
 * resolves to the owner of `<deviceId>`:
 *
 *   1. EAP device token  (Authorization: Bearer coyl_eap_<deviceId>_<secret>)
 *      The canonical machine credential, minted at /device/register.
 *      Timing-safe path↔token deviceId compare, then bcrypt the secret
 *      against Device.deviceTokenHash. This is the path the README
 *      documents ("swapped for an EAP device token issued at register
 *      time").
 *
 *   2. LLM-partner PAP key  (Authorization: Bearer coyl_pap_<id>_<secret>)
 *      Lets a partner poll/publish for a device it legitimately reaches,
 *      gated on the partner holding at least one active ScopeGrant from
 *      the device's owner. Same auth surface as the sibling EAP routes.
 *
 *   3. Clerk session cookie  (auth() → User.clerkId)
 *      The bootstrap window: the user's own browser/desktop acting on
 *      its own behalf before (or instead of) a device token. This is how
 *      the browser extension authenticates today (cookie-based Clerk,
 *      credentials: 'include'). We require the resolved user to OWN the
 *      device.
 *
 * On success we return the resolved userId + the Device row (selected
 * with the columns the callers need). On failure we return a typed
 * {status,error} the route maps straight to a JSON response.
 */

import { auth } from '@clerk/nextjs/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@repo/database'
import {
  parseDeviceToken,
  timingSafeStrEqual,
  verifyDeviceTokenSecret,
} from './device-token'

/** Columns every device-keyed route needs to reason about the device. */
const DEVICE_SELECT = {
  id: true,
  userId: true,
  deviceClass: true,
  paired: true,
  deviceTokenHash: true,
} as const

export type AuthedDevice = {
  id: string
  userId: string
  deviceClass: string
  paired: boolean
  deviceTokenHash: string | null
}

export type DeviceAuthResult =
  | { ok: true; userId: string; device: AuthedDevice; via: 'device_token' | 'partner_key' | 'clerk_session' }
  | { ok: false; status: number; error: string }

/**
 * Resolve auth for a device-keyed route. `pathDeviceId` is the
 * already-sanitized [a-z0-9] id from the URL segment.
 */
export async function authenticateDeviceRequest(
  req: Request,
  pathDeviceId: string,
): Promise<DeviceAuthResult> {
  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()

  // ---- Tier 1: EAP device token ----
  if (bearer.startsWith('coyl_eap_')) {
    const parsed = parseDeviceToken(bearer)
    if (!parsed) {
      return { ok: false, status: 401, error: 'invalid_token_format' }
    }
    // The token must be for the SAME device the path addresses. Compare
    // timing-safe so a wrong-device token can't be probed by latency.
    if (!timingSafeStrEqual(parsed.deviceId, pathDeviceId)) {
      return { ok: false, status: 403, error: 'device_mismatch' }
    }
    // nosemgrep
    const device = await prisma.device.findUnique({
      where: { id: parsed.deviceId },
      select: DEVICE_SELECT,
    })
    if (!device) {
      return { ok: false, status: 404, error: 'device_not_found' }
    }
    const valid = await verifyDeviceTokenSecret(parsed.secret, device.deviceTokenHash)
    if (!valid) {
      return { ok: false, status: 401, error: 'invalid_device_token' }
    }
    return { ok: true, userId: device.userId, device, via: 'device_token' }
  }

  // ---- Tier 2: LLM-partner PAP key ----
  if (bearer.startsWith('coyl_pap_')) {
    const partner = await authenticatePartnerKey(bearer)
    if (!partner.ok) {
      return { ok: false, status: partner.status, error: partner.error }
    }
    const safeDeviceId = sanitizeCuid(pathDeviceId)
    if (!safeDeviceId) {
      return { ok: false, status: 400, error: 'invalid_device_id' }
    }
    // nosemgrep
    const device = await prisma.device.findUnique({
      where: { id: safeDeviceId },
      select: DEVICE_SELECT,
    })
    if (!device) {
      return { ok: false, status: 404, error: 'device_not_found' }
    }
    // The partner must hold an active, unexpired ScopeGrant from the
    // device's owner — same gate the fleet-discovery route uses. Without
    // it, fleet/device enumeration would leak personal metadata.
    // device.userId + partner.partnerId are both server-resolved (cuid
    // lookups), not raw request input.
    // nosemgrep
    const grant = await prisma.scopeGrant.findFirst({
      where: {
        userId: device.userId,
        llmPartnerId: partner.partnerId,
        active: true,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    })
    if (!grant) {
      return { ok: false, status: 403, error: 'no_scope_granted' }
    }
    return { ok: true, userId: device.userId, device, via: 'partner_key' }
  }

  // ---- Tier 3: Clerk session cookie (bootstrap) ----
  // The browser extension (cookie-based Clerk) and any pre-device-token
  // coordinator land here. auth() reads the Clerk session cookie/handshake
  // off the request — it does NOT verify an arbitrary Authorization
  // bearer JWT (see device-auth discrepancy in the route docs).
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { ok: false, status: 401, error: 'missing_credentials' }
  }
  // clerkId comes from the verified Clerk session, not raw request input.
  // nosemgrep
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return { ok: false, status: 404, error: 'user_not_found' }
  }
  const safeDeviceId = sanitizeCuid(pathDeviceId)
  if (!safeDeviceId) {
    return { ok: false, status: 400, error: 'invalid_device_id' }
  }
  // nosemgrep
  const device = await prisma.device.findUnique({
    where: { id: safeDeviceId },
    select: DEVICE_SELECT,
  })
  if (!device) {
    return { ok: false, status: 404, error: 'device_not_found' }
  }
  if (device.userId !== user.id) {
    // Don't leak existence of another user's device — 404, not 403.
    return { ok: false, status: 404, error: 'device_not_found' }
  }
  return { ok: true, userId: user.id, device, via: 'clerk_session' }
}

// ---------- Partner-key auth (mirrored from the sibling EAP routes) ----------

type PartnerAuthResult =
  | { ok: true; partnerId: string }
  | { ok: false; status: number; error: string }

async function authenticatePartnerKey(bearer: string): Promise<PartnerAuthResult> {
  // Wire format per lib/llm-partner-keys.ts: coyl_pap_<llmPartnerId>_<keySecret>
  const parts = bearer.split('_')
  if (parts.length < 4 || parts[0] !== 'coyl') {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  const partnerId = parts[2]
  const keySecret = parts.slice(3).join('_')
  if (!partnerId || !keySecret) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  const safePartnerId = sanitizeCuid(partnerId)
  if (!safePartnerId) {
    return { ok: false, status: 401, error: 'invalid_token_format' }
  }
  // nosemgrep
  const partner = await prisma.lLMPartner.findUnique({
    where: { id: safePartnerId },
    select: { id: true, apiKeyHash: true, active: true },
  })
  if (!partner || !partner.active) {
    return { ok: false, status: 401, error: 'unknown_partner' }
  }
  const valid = await bcrypt.compare(keySecret, partner.apiKeyHash).catch(() => false)
  if (!valid) {
    return { ok: false, status: 401, error: 'invalid_token' }
  }
  return { ok: true, partnerId: partner.id }
}

/**
 * Whitelist-by-construction cuid sanitizer. Mirrors the helper inlined
 * across the EAP routes: builds a fresh [a-z0-9] string char-by-char so
 * static taint-trackers see a constant-derived value, and fails closed
 * on anything malformed before a DB round-trip.
 */
function sanitizeCuid(input: string): string | null {
  if (!input || input.length === 0 || input.length > 64) return null
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i)
    if (!ALPHABET.includes(c)) return null
    out += c
  }
  return out
}
