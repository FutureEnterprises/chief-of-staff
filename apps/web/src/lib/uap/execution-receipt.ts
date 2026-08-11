/**
 * UAP execution receipts — binding a DECISION to an EFFECT.
 *
 * ── The gap this closes ────────────────────────────────────────────
 *
 * POST /api/uap/v1/execute decided, audited, signed... and returned.
 * Nothing downstream ever had to show that a decision happened. An
 * ALLOW was ADVISORY: a partner could call /execute, get `denied`, and
 * fire the effect anyway; or call it once and fire the effect fifty
 * times. Every guarantee in UAP-0.1 §3 rested on the partner choosing
 * to honour the answer.
 *
 * A receipt makes the decision load-bearing at the one place COYL
 * actually controls: our own executors. On ALLOW the coordinator mints
 * a single-use receipt bound to a canonical hash of the exact action it
 * authorized. The executor recomputes that hash from the effect it is
 * about to fire and redeems the receipt. Three things then hold at the
 * choke point rather than on the honour system:
 *
 *   1. AUTHORIZATION  — no receipt, no effect. An unauthorized effect
 *      has nothing to present.
 *   2. INTEGRITY      — the recomputed hash must equal the authorized
 *      one. A receipt obtained for "notify the user" cannot be spent on
 *      "wire the money": the swap changes the hash.
 *   3. SINGLE USE     — redemption is a once-only claim. Replaying a
 *      receipt fires nothing.
 *
 * ── Honest scope boundary ──────────────────────────────────────────
 *
 * This mediates effects that fire through COYL-owned executors (the EAP
 * device-action path). It does NOT and cannot mediate an effect a
 * third-party partner performs inside its own infrastructure — if a
 * partner sends the email itself, no code we ship is in that path. What
 * the receipt gives that case is a verifiable artifact the partner's
 * own executor (or an auditor after the fact) can redeem and check.
 * Nothing here should be read as universal enforcement, and no comment
 * in this codebase should imply it.
 *
 * ── Construction ───────────────────────────────────────────────────
 *
 * Receipts are STATELESS-signed and STATEFULLY-consumed:
 *
 *   rcpt_<base64url(claims JSON)>.<base64url(HMAC-SHA256 over that)>
 *
 * The MAC makes the claims unforgeable and self-verifying, so expiry,
 * hash binding, and subject binding need no database round-trip. Only
 * once-only-ness needs durable state, and that state is a row in the
 * EXISTING uap_audit_entries table whose PRIMARY KEY is derived from
 * the receipt: the insert itself is the atomic claim, enforced by
 * Postgres's unique index. A duplicate redemption collides on the PK
 * and is refused. No new table, no new column, no migration — and the
 * redemption lands in the user's signed audit chain, where a consumed
 * authorization belongs.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import { writeAuditEntry } from './audit'

/* ──────────────────── Tunables ──────────────────── */

/**
 * How long a receipt stays redeemable. Long enough for a partner to
 * hand it to its executor and for that executor to reach us; short
 * enough that a leaked receipt is a small window. A receipt is
 * single-use regardless, so this bounds exposure, not usage count.
 */
export const EXECUTION_RECEIPT_TTL_SECONDS = 300

/** Wire version tag inside the claims blob. */
const RECEIPT_VERSION = 'uap-rcpt-1'

const RECEIPT_PREFIX = 'rcpt_'

/**
 * Dev-only fallback MAC key, used when UAP_EXECUTION_RECEIPT_KEY is
 * unset. Mirrors the posture in ./audit.ts: a fixed constant so local
 * runs can mint and redeem receipts across restarts, and NEVER a
 * production posture — anyone reading this file can forge a receipt
 * signed with it. Production must set the env var.
 *
 * Deliberately NOT the audit signing key: an audit-chain key that also
 * mints capabilities means one leak costs both properties.
 */
const DEV_FALLBACK_RECEIPT_KEY =
  'coyl-dev-only-uap-execution-receipt-key-not-for-production'

function receiptKey(): string {
  const env = process.env.UAP_EXECUTION_RECEIPT_KEY
  return env && env.length > 0 ? env : DEV_FALLBACK_RECEIPT_KEY
}

/* ──────────────────── Canonical action hash ──────────────────── */

/**
 * Deterministic JSON with alphabetically-sorted keys at every level.
 * Same discipline as the audit chain's canonicalizer: the hash must be
 * byte-identical when recomputed by a different process, on a different
 * Node version, from an object whose keys were built in another order.
 */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Date) return val.toISOString()
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {}
      for (const k of Object.keys(val as Record<string, unknown>).sort()) {
        sorted[k] = (val as Record<string, unknown>)[k]
      }
      return sorted
    }
    return val
  })
}

export type ActionHashInput = {
  userId: string
  grantId: string
  /** The UAP action kind that was authorized (e.g. 'food_intervention'). */
  actionKind: string
  /** The action's parameters, exactly as the coordinator saw them. */
  actionParams: Record<string, unknown> | undefined
  /** The decision this hash is bound to — the audit row id. */
  decisionId: string
}

/**
 * sha256 over the canonical serialization of
 * (userId, grantId, action kind, action params, decision id).
 *
 * The decision id is in the hash on purpose: without it, two separate
 * authorizations of the same action would produce the same hash, and a
 * receipt from the first could be redeemed against the second's effect
 * after the first was already consumed.
 */
export function computeActionHash(input: ActionHashInput): string {
  return createHash('sha256')
    .update(
      canonicalJson({
        action_kind: input.actionKind,
        action_params: input.actionParams ?? {},
        decision_id: input.decisionId,
        grant_id: input.grantId,
        user_id: input.userId,
      }),
      'utf8',
    )
    .digest('hex')
}

/* ──────────────────── Receipt claims ──────────────────── */

export type ExecutionReceiptClaims = {
  v: typeof RECEIPT_VERSION
  /** Audit row id of the decision that minted this receipt. */
  aud: string
  /** User the decision was made for. */
  uid: string
  /** Grant the decision was made under. */
  gid: string
  /** Partner the decision was issued to. */
  pid: string
  /** Authorized action kind — carried in the MAC'd claims so the
   *  redeemer does not have to trust a caller-supplied value. */
  ak: string
  /** Authorized action hash (hex). */
  ah: string
  /** Expiry, epoch milliseconds. */
  exp: number
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function macFor(claimsJson: string): Buffer {
  return createHmac('sha256', receiptKey()).update(claimsJson, 'utf8').digest()
}

export type IssuedExecutionReceipt = {
  /** The opaque receipt string handed to the partner. Single use. */
  receiptId: string
  /** The action hash the receipt is bound to (also inside the claims). */
  actionHash: string
  expiresAt: Date
  ttlSeconds: number
}

/**
 * Mint a receipt for an ALLOWED decision. Pure + synchronous: no DB
 * write happens at issuance, because an unredeemed receipt has no
 * state worth storing — the only state that matters is "was this one
 * spent," and that is created at redemption.
 */
export function issueExecutionReceipt(params: {
  auditId: string
  userId: string
  grantId: string
  partnerId: string
  actionKind: string
  actionParams?: Record<string, unknown>
  ttlSeconds?: number
  now?: Date
}): IssuedExecutionReceipt {
  const now = params.now ?? new Date()
  const ttlSeconds = params.ttlSeconds ?? EXECUTION_RECEIPT_TTL_SECONDS
  const actionHash = computeActionHash({
    userId: params.userId,
    grantId: params.grantId,
    actionKind: params.actionKind,
    actionParams: params.actionParams,
    decisionId: params.auditId,
  })

  const claims: ExecutionReceiptClaims = {
    v: RECEIPT_VERSION,
    aud: params.auditId,
    uid: params.userId,
    gid: params.grantId,
    pid: params.partnerId,
    ak: params.actionKind,
    ah: actionHash,
    exp: now.getTime() + ttlSeconds * 1000,
  }

  const claimsJson = canonicalJson(claims)
  const encoded = b64url(Buffer.from(claimsJson, 'utf8'))
  const mac = b64url(macFor(claimsJson))

  return {
    receiptId: `${RECEIPT_PREFIX}${encoded}.${mac}`,
    actionHash,
    expiresAt: new Date(claims.exp),
    ttlSeconds,
  }
}

/* ──────────────────── Refusals ──────────────────── */

export type ReceiptRefusalReason =
  /** Not a receipt: wrong prefix, wrong shape, undecodable claims. */
  | 'receipt_malformed'
  /** Claims decoded but the MAC doesn't match — forged or tampered. */
  | 'receipt_signature_invalid'
  /** Past `exp`. */
  | 'receipt_expired'
  /** The effect being presented is not the effect that was authorized. */
  | 'action_hash_mismatch'
  /** A different partner is trying to redeem this partner's receipt. */
  | 'receipt_partner_mismatch'
  /** Already spent. */
  | 'receipt_already_consumed'
  /** The consumption record could not be written (DB fault). Fails
   *  closed: we could not establish once-only-ness, so no effect. */
  | 'receipt_consume_failed'

export type VerifyExecutionReceiptResult =
  | { ok: true; claims: ExecutionReceiptClaims }
  | { ok: false; reason: ReceiptRefusalReason; detail?: string }

/**
 * Authenticate a receipt and return its claims. Checks shape and MAC
 * only — NOT expiry, partner, or action hash.
 *
 * Exists because an executor needs the AUTHENTICATED action kind, grant
 * id and decision id before it can compute the hash of the effect it is
 * about to fire. Taking those from the request body instead would let a
 * caller supply both sides of the comparison, which is no comparison at
 * all. The claims come out of the MAC'd blob or they don't come out.
 */
export function decodeExecutionReceipt(
  receiptId: string,
): VerifyExecutionReceiptResult {
  const raw = receiptId

  if (typeof raw !== 'string' || !raw.startsWith(RECEIPT_PREFIX)) {
    return { ok: false, reason: 'receipt_malformed', detail: 'bad prefix' }
  }
  const body = raw.slice(RECEIPT_PREFIX.length)
  const dot = body.indexOf('.')
  if (dot <= 0 || dot === body.length - 1) {
    return { ok: false, reason: 'receipt_malformed', detail: 'bad structure' }
  }
  const encoded = body.slice(0, dot)
  const presentedMac = body.slice(dot + 1)

  let claimsJson: string
  try {
    claimsJson = Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    return { ok: false, reason: 'receipt_malformed', detail: 'bad base64url' }
  }

  // Authenticate BEFORE parsing semantics out of the blob — the claims
  // are attacker-supplied until the MAC says otherwise.
  const expectedMac = Buffer.from(b64url(macFor(claimsJson)), 'utf8')
  const givenMac = Buffer.from(presentedMac, 'utf8')
  if (
    expectedMac.length !== givenMac.length ||
    !timingSafeEqual(expectedMac, givenMac)
  ) {
    return { ok: false, reason: 'receipt_signature_invalid' }
  }

  let claims: ExecutionReceiptClaims
  try {
    claims = JSON.parse(claimsJson) as ExecutionReceiptClaims
  } catch {
    return { ok: false, reason: 'receipt_malformed', detail: 'claims not JSON' }
  }
  if (
    claims?.v !== RECEIPT_VERSION ||
    typeof claims.aud !== 'string' ||
    typeof claims.uid !== 'string' ||
    typeof claims.gid !== 'string' ||
    typeof claims.pid !== 'string' ||
    typeof claims.ak !== 'string' ||
    typeof claims.ah !== 'string' ||
    typeof claims.exp !== 'number'
  ) {
    return { ok: false, reason: 'receipt_malformed', detail: 'claims shape' }
  }

  return { ok: true, claims }
}

/**
 * Stateless half of redemption: authenticate, check expiry, check the
 * redeeming partner, and check that the presented effect hashes to the
 * authorized action. Deliberately separate from consumption so a
 * mismatched or expired presentation does NOT burn a receipt the partner
 * may still legitimately redeem for the right effect.
 */
export function verifyExecutionReceipt(params: {
  receiptId: string
  /** Hash recomputed from the effect about to fire. */
  actionHash: string
  /** Partner attempting redemption, when the caller knows it. */
  partnerId?: string
  now?: Date
}): VerifyExecutionReceiptResult {
  const now = params.now ?? new Date()

  const decoded = decodeExecutionReceipt(params.receiptId)
  if (!decoded.ok) return decoded
  const { claims } = decoded

  if (now.getTime() > claims.exp) {
    return {
      ok: false,
      reason: 'receipt_expired',
      detail: `expired_at=${new Date(claims.exp).toISOString()}`,
    }
  }

  if (params.partnerId !== undefined && params.partnerId !== claims.pid) {
    return { ok: false, reason: 'receipt_partner_mismatch' }
  }

  // Constant-time compare on the hash too: it is a secret-adjacent
  // value (knowing it is knowing what was authorized).
  const authorized = Buffer.from(claims.ah, 'utf8')
  const presented = Buffer.from(String(params.actionHash), 'utf8')
  if (
    authorized.length !== presented.length ||
    !timingSafeEqual(authorized, presented)
  ) {
    return {
      ok: false,
      reason: 'action_hash_mismatch',
      detail: `authorized=${claims.ah} presented=${params.actionHash}`,
    }
  }

  return { ok: true, claims }
}

/* ──────────────────── Consumption ──────────────────── */

/**
 * Deterministic primary key for a receipt's consumption row. Derived by
 * hashing the receipt, so:
 *   • the same receipt always maps to the same row → the PK unique
 *     index IS the once-only claim, with no read-then-write window; and
 *   • the row id does not leak the receipt (it is a one-way digest).
 *
 * The `rcp_` prefix keeps consumption rows outside the `aud_<24 hex>`
 * pattern the public provenance verifier will look up, so redemption
 * records are not enumerable through that endpoint.
 */
export function consumptionRowId(receiptId: string): string {
  return `rcp_${createHash('sha256').update(receiptId, 'utf8').digest('hex').slice(0, 24)}`
}

export type ConsumeExecutionReceiptResult =
  | {
      ok: true
      claims: ExecutionReceiptClaims
      /** Audit row id of the consumption record. */
      consumptionAuditId: string
    }
  | { ok: false; reason: ReceiptRefusalReason; detail?: string }

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const code = (err as { code?: unknown }).code
  if (code === 'P2002') return true
  const message = (err as { message?: unknown }).message
  return typeof message === 'string' && /unique constraint/i.test(message)
}

/**
 * Redeem a receipt for a specific effect. Atomic and once-only.
 *
 * Order is deliberate: everything that can refuse WITHOUT burning the
 * receipt happens first (shape, MAC, expiry, partner, action hash).
 * Only a fully-valid presentation reaches the claim, so an attacker
 * cannot invalidate someone else's receipt by presenting it against a
 * bogus effect.
 *
 * The claim is a single INSERT whose primary key is a function of the
 * receipt. Postgres's unique index decides the winner; the loser gets
 * `receipt_already_consumed`. There is no read-then-write, so there is
 * no window between checking and claiming.
 *
 * Any other write failure returns `receipt_consume_failed` — we could
 * not establish that this receipt is unspent, so the effect must not
 * fire.
 */
export async function consumeExecutionReceipt(params: {
  receiptId: string
  actionHash: string
  partnerId?: string
  now?: Date
}): Promise<ConsumeExecutionReceiptResult> {
  const verified = verifyExecutionReceipt(params)
  if (!verified.ok) return verified

  const { claims } = verified
  const rowId = consumptionRowId(params.receiptId)

  try {
    const row = await writeAuditEntry({
      auditId: rowId,
      grantId: claims.gid,
      userId: claims.uid,
      llmPartnerId: claims.pid,
      operation: 'consume',
      actionKind: claims.ak,
      decision: 'allowed',
      decisionReason: `receipt_consumed decision_audit_id=${claims.aud} action_hash=${claims.ah}`,
      postTermination: false,
    })
    return { ok: true, claims, consumptionAuditId: row.id }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        reason: 'receipt_already_consumed',
        detail: `decision_audit_id=${claims.aud}`,
      }
    }
    console.error('[uap/execution-receipt] consumption write failed', {
      err: err instanceof Error ? err.message : 'unknown',
      decisionAuditId: claims.aud,
    })
    return { ok: false, reason: 'receipt_consume_failed' }
  }
}
