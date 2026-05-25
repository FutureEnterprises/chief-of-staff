/**
 * UAP-partner Bearer-token authentication.
 *
 * Every incoming UAP request from a foundation lab carries an
 * Authorization header of the form:
 *
 *   Authorization: Bearer coyl_uap_<llmPartnerId>_<keySecret>
 *
 * authenticateUAPPartner() splits that token into its three parts,
 * looks up the LLMPartner row by id, and verifies keySecret against
 * the bcrypt hash on apiKeyHash. Active=false partners are rejected
 * even if the key is valid (revoked-but-not-deleted state).
 *
 * UAP shares the LLMPartner table with PAP/EAP: a partner integrating
 * both protocols holds two distinct keys (one with the coyl_pap_
 * prefix verified against `apiKeyHash`, one with the coyl_uap_ prefix
 * verified against `uapApiKeyHash`). The prefix on the wire is the
 * only protocol marker; the partner id and bcrypt verification are
 * mechanically identical, but each protocol has its own independently-
 * rotated secret on the same partner row so a UAP credential cannot
 * be used to call a PAP endpoint and vice versa.
 *
 * Failed-auth attempts are recorded in EAPAuditEntry (the shared
 * cross-protocol audit table) so the admin dashboard can surface
 * credential-stuffing patterns. We rate-limit the audit writes (one
 * entry per minute per IP) so a high-volume attacker can't blow up
 * our audit table.
 *
 * v0.2 follow-up: EAPAuditEntry has no `protocol` column today, so
 * UAP failed-auth rows are tagged via the `eventKind` value
 * (`uap_partner_auth_failed`) and a `protocol: 'uap'` field inside
 * payloadJson. Once the audit schema grows a first-class column, swap
 * to that.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import type { LLMPartner } from '@repo/database'
import { verifyApiKey } from '@/lib/llm-partner-keys'

/** Token prefix that every issued UAP partner key carries. */
const TOKEN_PREFIX = 'coyl_uap_'

/** Regex constraining the cuid-shaped llmPartnerId portion of a token. */
const KEY_ID_PATTERN = /^[a-z0-9]{12,64}$/i

/** Regex constraining the hex-encoded key-secret portion of a token. */
const KEY_SECRET_PATTERN = /^[a-f0-9]{32,128}$/i

/**
 * In-memory dedupe map for failed-auth audit writes. Keyed by the
 * client IP (or `unknown` if absent); value is the unix-ms timestamp
 * of the last audit entry we logged for that IP. We skip new writes
 * within FAILED_AUTH_AUDIT_WINDOW_MS of the previous entry from the
 * same IP. Per-instance only — Vercel will spin up new Function
 * instances, each with its own copy, so a distributed attacker still
 * gets logged across instances. That's the desired behaviour.
 */
const FAILED_AUTH_AUDIT_WINDOW_MS = 60_000
const lastFailedAuthAuditAt = new Map<string, number>()

/** Result envelope for authenticateUAPPartner — either a partner or a 401 response. */
export type UAPPartnerAuthResult =
  | { partner: LLMPartner; error?: undefined }
  | { partner?: undefined; error: NextResponse }

/**
 * Parsed, character-set-validated token. Producing a value of this
 * type is the ONLY way taint-tainted Bearer-token strings become
 * trusted enough to be passed to Prisma. The parser
 * (parseBearerToken) is the choke point that whitelists each field
 * against a strict regex before constructing the result.
 */
type ValidatedToken = {
  readonly keyId: string
  readonly keySecret: string
}

/**
 * Split + validate the Authorization header value. Returns null on
 * any parse failure; the caller is responsible for emitting the 401.
 *
 * This function is the security-critical taint sink: once a string
 * passes this function it is character-set-whitelisted ([a-z0-9] for
 * the partner id, [a-f0-9] for the secret) and safe to pass into the
 * data layer.
 */
function parseBearerToken(authHeader: string): ValidatedToken | null {
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
  if (!match || !match[1]) return null

  const token = match[1]
  if (!token.startsWith(TOKEN_PREFIX)) return null

  const rest = token.slice(TOKEN_PREFIX.length)
  const sepIdx = rest.indexOf('_')
  if (sepIdx <= 0) return null

  const rawKeyId = rest.slice(0, sepIdx)
  const rawKeySecret = rest.slice(sepIdx + 1)

  if (!KEY_ID_PATTERN.test(rawKeyId)) return null
  if (!KEY_SECRET_PATTERN.test(rawKeySecret)) return null

  return { keyId: rawKeyId, keySecret: rawKeySecret }
}

/**
 * Look up the partner row by its already-validated id. Decoupled
 * from the parser so static analyzers see a pure-string input here
 * with no `req` taint reaching the data layer.
 */
async function findPartnerByValidatedId(keyId: string): Promise<LLMPartner | null> {
  return prisma.lLMPartner.findUnique({ where: { id: keyId } })
}

/**
 * Verify a Bearer token on the request and return the matching
 * LLMPartner row. On failure, returns an already-constructed
 * NextResponse with the appropriate 401 + JSON body so route handlers
 * can do `if ('error' in result) return result.error`.
 */
export async function authenticateUAPPartner(req: Request): Promise<UAPPartnerAuthResult> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) {
    return {
      error: NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 },
      ),
    }
  }

  const validated = parseBearerToken(header)
  if (!validated) {
    await recordFailedAuth(req, null, 'malformed_token')
    return {
      error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    }
  }

  const partner = await findPartnerByValidatedId(validated.keyId)
  if (!partner) {
    await recordFailedAuth(req, null, 'unknown_partner_id')
    return {
      error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    }
  }

  if (!partner.active) {
    await recordFailedAuth(req, partner.id, 'partner_inactive')
    return {
      error: NextResponse.json(
        { error: 'Partner account is inactive' },
        { status: 401 },
      ),
    }
  }

  // UAP verification uses the partner's UAP-scoped key (uapApiKeyHash),
  // NOT the PAP key (apiKeyHash). A partner that has not been issued a
  // UAP key yet cannot authenticate against UAP routes even if their
  // PAP key is valid — distinct protocols, distinct credentials.
  if (!partner.uapApiKeyHash) {
    await recordFailedAuth(req, partner.id, 'uap_key_not_minted')
    return {
      error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    }
  }

  const ok = await verifyApiKey(validated.keySecret, partner.uapApiKeyHash)
  if (!ok) {
    await recordFailedAuth(req, partner.id, 'bad_secret')
    return {
      error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    }
  }

  return { partner }
}

/**
 * Convenience wrapper: returns the partner directly on success, or
 * throws a UAPPartnerAuthError carrying the 401 NextResponse to be
 * caught by the route handler. Use in routes that don't want to
 * destructure the result object.
 */
export async function requireUAPPartner(req: Request): Promise<LLMPartner> {
  const result = await authenticateUAPPartner(req)
  if (result.error) throw new UAPPartnerAuthError(result.error)
  return result.partner
}

export class UAPPartnerAuthError extends Error {
  readonly response: NextResponse
  constructor(response: NextResponse) {
    super('UAPPartner authentication failed')
    this.name = 'UAPPartnerAuthError'
    this.response = response
  }
}

/**
 * Best-effort EAPAuditEntry write for a failed UAP auth attempt.
 * Rate-limited per source IP so a credential-stuffing attacker can't
 * fill the audit table. Failures are swallowed — audit logging must
 * never break the auth flow itself.
 *
 * Distinguished from the PAP variant by:
 *   - eventKind: 'uap_partner_auth_failed' (vs 'partner_auth_failed')
 *   - payloadJson.protocol: 'uap' (v0.2: promote to a real column)
 */
async function recordFailedAuth(
  req: Request,
  llmPartnerId: string | null,
  reasonCode: string,
): Promise<void> {
  const ipAddress = extractIp(req)
  const ipKey = ipAddress || 'unknown'
  const now = Date.now()
  const last = lastFailedAuthAuditAt.get(ipKey)
  if (last !== undefined && now - last < FAILED_AUTH_AUDIT_WINDOW_MS) {
    return
  }
  lastFailedAuthAuditAt.set(ipKey, now)

  try {
    await prisma.eAPAuditEntry.create({
      data: {
        // userId is required by the schema but a failed-auth attempt
        // has no associated user — we use the sentinel 'unknown'
        // so the audit row is queryable by eventKind + ipAddress.
        userId: 'unknown',
        llmPartnerId,
        eventKind: 'uap_partner_auth_failed',
        referenceId: null,
        payloadJson: {
          protocol: 'uap',
          reasonCode,
          userAgent: req.headers.get('user-agent') ?? null,
          path: safeUrl(req.url)?.pathname ?? null,
        },
        ipAddress,
      },
    })
  } catch (err) {
    // Audit logging must never fail the request. Log to stderr only.
    console.warn('[uap-partner-auth] failed to write audit entry', {
      err: err instanceof Error ? err.message : 'unknown',
      reasonCode,
    })
  }
}

/** Best-effort IP extraction from common Vercel/Cloudflare headers. */
function extractIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return null
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}
