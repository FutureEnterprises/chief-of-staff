/**
 * EAP device-token mint + verify.
 *
 * A device token is the machine credential a device coordinator (the
 * macOS menu-bar app, the browser extension, a future watchOS bridge)
 * presents on its OWN calls back to the server — the pending-actions
 * poll and the sensor-snapshot publish. It is distinct from:
 *
 *   • the LLM-partner PAP key  (coyl_pap_<id>_<secret>)  — an LLM
 *     partner acting on behalf of a user, and
 *   • the user's Clerk session — the user's browser acting on its own
 *     behalf during the bootstrap window.
 *
 * Wire format:   coyl_eap_<deviceId>_<secret>
 *
 *   - <deviceId> is the cuid of the Device row (lets us look the row
 *     up in one indexed query before doing any bcrypt work).
 *   - <secret>   is 24 random bytes, hex-encoded (48 chars). Only its
 *     bcrypt hash is ever persisted (Device.deviceTokenHash); the
 *     plaintext is handed back to the coordinator exactly once, at
 *     the register call that minted (or first-minted) it.
 *
 * The format intentionally mirrors the PAP key shape (coyl_<proto>_
 * <id>_<secret>) so the same parse/sanitize discipline used in the
 * partner-auth routes applies here too.
 */

import bcrypt from 'bcryptjs'
import { randomBytes, timingSafeEqual } from 'node:crypto'

/** bcrypt cost. Matches the partner-key hashing in lib/llm-partner-keys. */
const BCRYPT_ROUNDS = 10

/** Plaintext token + the columns to persist on the Device row. */
export type MintedDeviceToken = {
  /** Full plaintext token — returned to the coordinator ONCE. */
  token: string
  /** bcrypt hash → Device.deviceTokenHash. */
  deviceTokenHash: string
  /** Last 4 chars of the secret → Device.deviceTokenLastFour. */
  deviceTokenLastFour: string
}

/**
 * Mint a fresh device token bound to `deviceId`. The caller writes
 * `deviceTokenHash` + `deviceTokenLastFour` to the Device row and
 * returns `token` to the coordinator. We never re-derive the plaintext
 * after this — a lost token requires a re-mint.
 */
export async function mintDeviceToken(deviceId: string): Promise<MintedDeviceToken> {
  // 24 bytes → 48 hex chars of secret entropy.
  const secret = randomBytes(24).toString('hex')
  const token = `coyl_eap_${deviceId}_${secret}`
  const deviceTokenHash = await bcrypt.hash(secret, BCRYPT_ROUNDS)
  const deviceTokenLastFour = secret.slice(-4)
  return { token, deviceTokenHash, deviceTokenLastFour }
}

/** Parsed shape of a `coyl_eap_<deviceId>_<secret>` token. */
export type ParsedDeviceToken = {
  deviceId: string
  secret: string
}

/**
 * Parse + shape-validate a device token WITHOUT touching the DB. Returns
 * null on any malformed input. The deviceId is constrained to the cuid
 * charset ([a-z0-9]) so it's safe to feed straight into Prisma; the
 * secret is constrained to hex.
 *
 * NOTE: <secret> may itself contain underscores only if we ever change
 * the encoding — today it's pure hex. We rejoin everything after the
 * deviceId segment with '_' to stay forward-compatible, then validate
 * the rejoined secret against the hex charset.
 */
export function parseDeviceToken(raw: string): ParsedDeviceToken | null {
  if (!raw || raw.length > 256) return null
  // coyl_eap_<deviceId>_<secret>
  const parts = raw.split('_')
  if (parts.length < 4) return null
  if (parts[0] !== 'coyl' || parts[1] !== 'eap') return null
  const deviceId = parts[2]
  const secret = parts.slice(3).join('_')
  if (!deviceId || !secret) return null
  if (!/^[a-z0-9]{1,64}$/.test(deviceId)) return null
  if (!/^[a-f0-9]{8,128}$/.test(secret)) return null
  return { deviceId, secret }
}

/**
 * Timing-safe constant comparison of two same-purpose strings (used to
 * compare the path deviceId against the token's deviceId before we
 * spend a bcrypt round-trip). Falls back to a non-matching result when
 * the lengths differ — timingSafeEqual throws on unequal lengths, and
 * leaking "lengths differ" is harmless here (ids aren't secret), but we
 * keep the branch constant-ish by always running the compare on padded
 * buffers of equal length.
 */
export function timingSafeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) {
    // Still burn a compare against an equal-length buffer so we don't
    // early-return on a length mismatch with a distinguishable timing.
    timingSafeEqual(ab, Buffer.alloc(ab.length))
    return false
  }
  return timingSafeEqual(ab, bb)
}

/**
 * Verify a parsed device token's secret against the stored bcrypt hash.
 * bcrypt.compare is itself constant-time over the hash. Returns false on
 * any error rather than throwing.
 */
export async function verifyDeviceTokenSecret(
  secret: string,
  deviceTokenHash: string | null | undefined,
): Promise<boolean> {
  if (!deviceTokenHash) return false
  return bcrypt.compare(secret, deviceTokenHash).catch(() => false)
}
