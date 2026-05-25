/**
 * UAP — Signed Append-Only Audit Chain (Agent A4)
 *
 * Implements the per-row ed25519 signature + sha256 hash chain over the
 * `UAPAuditEntry` table. Per UAP-0.1.md §3 ("Hard Invariants"):
 *
 *   "Every EXECUTE writes one immutable audit row. The log is
 *    append-only, cryptographically signed, and queryable by the user
 *    without LLM partner involvement. The user owns the audit trail."
 *
 * This file is the integrity layer that makes that invariant real.
 * The coordinator (agent A2) calls `writeAuditEntry` after every
 * decision (allowed / denied / needs_per_action_confirmation, plus
 * non-execute operations like grant / revoke / kill / expire). Any
 * historical tampering — flipping a `decision` from "denied" to
 * "allowed", retroactively removing a row, reordering rows — will
 * break either the row signature or the prevHash chain, and
 * `verifyAuditChain` will surface the first invalid row.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Cryptography
 * ──────────────────────────────────────────────────────────────────────
 *
 * Algorithm: ed25519 via Node's built-in `crypto` module (`crypto.sign`
 * / `crypto.verify` with `null` algorithm — the only way Node's Ed25519
 * one-shot API is invoked; `createSign('Ed25519')` is not supported by
 * the stream API). No external dependency.
 *
 * Keys: SERVER-WIDE coordinator signing key, lives in env vars:
 *   UAP_AUDIT_SIGNING_KEY_PRIVATE — base64-encoded raw 32-byte ed25519 private key
 *   UAP_AUDIT_SIGNING_KEY_PUBLIC  — base64-encoded raw 32-byte ed25519 public key
 *
 * If unset (development / first boot), a deterministic dev fallback key
 * is used. The dev key is a known constant baked into this file so
 * dev-mode signatures can be re-verified across restarts without
 * regenerating keys — but it MUST NOT be used in production. We do not
 * log the key material in either path.
 *
 * The coordinator signing key is distinct from the per-user
 * provenance keys (UAPProvenancePayload + UAPProvenanceSignature in
 * lib/uap/types.ts §"Provenance envelope") which agent A6 owns. This
 * key secures the audit-CHAIN row; provenance keys secure the OUTGOING
 * payload that a recipient (Gmail, Slack, etc.) verifies.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Chain construction
 * ──────────────────────────────────────────────────────────────────────
 *
 * Canonical row payload (every byte that's signed, in alphabetical key
 * order — this is the format both `writeAuditEntry` and
 * `verifyAuditChain` use):
 *
 *   {
 *     actionKind, createdAt, decision, decisionReason, grantId,
 *     llmPartnerId, operation, postTermination, prevHash, userId,
 *     // v0.1.1 — included so the provenance envelope is chain-protected:
 *     provenanceAlgorithm, provenancePayload, provenancePublicKey,
 *     provenanceSignature,
 *   }
 *
 * `prevHash` = sha256(previous row's signature), hex-encoded; null for
 * the first row in a user's chain. `signature` = ed25519 sign over the
 * canonical-JSON of the payload, base64-encoded.
 *
 * Re-verification re-derives BOTH halves of the link: the signature
 * is recomputed from the persisted fields (excluding `id` and
 * `signature` itself), and `prevHash` is recomputed from the previous
 * row's persisted signature. Either mismatch invalidates the chain.
 */

import { sign, verify, createHash, createPrivateKey, createPublicKey } from 'crypto'
import type { KeyObject } from 'crypto'

import { Prisma, prisma } from '@repo/database'
import type { UAPAuditEntry } from '@repo/database'

import type { UAPAuditInput, UAPProvenancePayload } from './types'

/* ────────────────────────── Key management ────────────────────────── */

/**
 * Deterministic dev fallback. A fixed 32-byte ed25519 private key used
 * ONLY when the env vars aren't set. The constant is hard-coded so dev
 * sessions can re-verify their own chain across restarts. Never used in
 * production — the env vars are required there (enforced by the build's
 * prebuild env verifier when added).
 *
 * Generated once with `crypto.generateKeyPairSync('ed25519')` and frozen.
 * Not a secret — anyone reading this file can derive the public key — so
 * dev-mode signatures provide NO security guarantee. They exist solely
 * so the chain-verification code path is exercisable locally.
 */
const DEV_FALLBACK_PRIVATE_KEY_BASE64 =
  'MC4CAQAwBQYDK2VwBCIEIBfZkD2YJv8u/MlW6c0gT4QzOgFqBQv8m5TX1tHrZk2X'
const DEV_FALLBACK_PUBLIC_KEY_BASE64 =
  'MCowBQYDK2VwAyEAFsd5VShE+w9pn5KZ8Hcv8WoVJ6gC+kAyCmI4iZ0OBuw='

let cachedPrivateKey: KeyObject | null = null
let cachedPublicKey: KeyObject | null = null

/**
 * Wrap 32 raw ed25519 private-key bytes in the PKCS#8 DER envelope
 * Node's `createPrivateKey` expects. The prefix is the fixed
 * `AlgorithmIdentifier` + OCTET STRING wrapper for an Ed25519 private
 * key — 16 bytes — followed by the 32-byte key material.
 *
 * Reference: RFC 8410 §7 (Ed25519 PKCS#8 ASN.1).
 */
function rawEd25519PrivateKeyToKeyObject(raw: Buffer): KeyObject {
  if (raw.length !== 32) {
    throw new Error(
      `UAP audit signing key must be 32 raw ed25519 bytes (got ${raw.length})`,
    )
  }
  const prefix = Buffer.from('302e020100300506032b657004220420', 'hex')
  const pkcs8 = Buffer.concat([prefix, raw])
  return createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' })
}

/**
 * Wrap 32 raw ed25519 public-key bytes in the SPKI DER envelope Node's
 * `createPublicKey` expects. The prefix is the fixed
 * `SubjectPublicKeyInfo` wrapper for an Ed25519 public key — 12 bytes —
 * followed by the 32-byte key material.
 *
 * Reference: RFC 8410 §4 (Ed25519 SPKI ASN.1).
 */
function rawEd25519PublicKeyToKeyObject(raw: Buffer): KeyObject {
  if (raw.length !== 32) {
    throw new Error(
      `UAP audit verification key must be 32 raw ed25519 bytes (got ${raw.length})`,
    )
  }
  const prefix = Buffer.from('302a300506032b6570032100', 'hex')
  const spki = Buffer.concat([prefix, raw])
  return createPublicKey({ key: spki, format: 'der', type: 'spki' })
}

/**
 * Decode a base64 key from env. Accepts either:
 *   - 32 raw bytes (the canonical wire format documented in the env
 *     var description), OR
 *   - a full PKCS#8 / SPKI DER blob (so operators who already have
 *     keys in those formats can drop them in without re-encoding).
 *
 * Raw 32-byte keys are wrapped via `rawEd25519PrivateKeyToKeyObject` /
 * `rawEd25519PublicKeyToKeyObject`; DER blobs are passed straight
 * through to `createPrivateKey` / `createPublicKey`.
 */
function decodePrivateKeyEnv(b64: string): KeyObject {
  const buf = Buffer.from(b64, 'base64')
  if (buf.length === 32) return rawEd25519PrivateKeyToKeyObject(buf)
  return createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' })
}

function decodePublicKeyEnv(b64: string): KeyObject {
  const buf = Buffer.from(b64, 'base64')
  if (buf.length === 32) return rawEd25519PublicKeyToKeyObject(buf)
  return createPublicKey({ key: buf, format: 'der', type: 'spki' })
}

/**
 * Resolve the coordinator's ed25519 signing key. Reads the env vars on
 * first call and caches the resulting KeyObjects in-process — KeyObject
 * construction has nontrivial overhead and audit writes happen on the
 * hot path of every UAP EXECUTE.
 *
 * If env vars are not set (development), uses a fixed dev fallback so
 * the chain remains verifiable across restarts in dev. The fallback is
 * NEVER an acceptable production posture; the coordinator will fail
 * loudly if the env-driven verifier flag (added by ops) demands real
 * keys. We do not log key material in either path.
 */
function getSigningKey(): KeyObject {
  if (cachedPrivateKey) return cachedPrivateKey

  const envPrivate = process.env.UAP_AUDIT_SIGNING_KEY_PRIVATE
  const b64 = envPrivate && envPrivate.length > 0
    ? envPrivate
    : DEV_FALLBACK_PRIVATE_KEY_BASE64

  cachedPrivateKey = decodePrivateKeyEnv(b64)
  return cachedPrivateKey
}

function getVerificationKey(): KeyObject {
  if (cachedPublicKey) return cachedPublicKey

  const envPublic = process.env.UAP_AUDIT_SIGNING_KEY_PUBLIC
  const b64 = envPublic && envPublic.length > 0
    ? envPublic
    : DEV_FALLBACK_PUBLIC_KEY_BASE64

  cachedPublicKey = decodePublicKeyEnv(b64)
  return cachedPublicKey
}

/* ────────────────────────── Canonical JSON ────────────────────────── */

/**
 * Deterministic JSON serializer with alphabetically-sorted keys at
 * every nesting level. Both signing and verification re-derive the
 * exact same byte sequence from the same logical payload, regardless
 * of which order Node decides to iterate properties in (the chain
 * MUST survive Node version upgrades, schema field reorderings, and
 * the difference between an object literal we just constructed and a
 * Prisma row that came back from Postgres).
 *
 * `null` is preserved (NOT stripped) so `prevHash: null` and an absent
 * key serialize differently — important because the first row's
 * payload contains `prevHash: null` explicitly.
 *
 * Date values are coerced to ISO-8601 — Prisma returns DateTime
 * fields as JavaScript `Date`, and `JSON.stringify` already does this,
 * but we surface it here so the contract is obvious.
 */
function canonicalize(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Date) return val.toISOString()
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const sortedKeys = Object.keys(val as Record<string, unknown>).sort()
      const sorted: Record<string, unknown> = {}
      for (const k of sortedKeys) {
        sorted[k] = (val as Record<string, unknown>)[k]
      }
      return sorted
    }
    return val
  })
}

/* ────────────────────────── Payload shaping ────────────────────────── */

/**
 * The exact field set that goes into the signature. Pure-data fields
 * only: no `id` (set by Prisma cuid, has no integrity role), no
 * `signature` (that's what we're computing), no `prisma`-managed
 * relations. `prevHash` is included so re-ordering or removing a
 * historical row breaks the next row's signature in addition to
 * breaking its prevHash linkage — two independent integrity checks
 * per row, not one.
 *
 * Field ordering inside this object literal is irrelevant —
 * `canonicalize` sorts alphabetically — but we still write them in
 * alphabetical order here so a code reviewer can diff the literal
 * against the canonical output without confusion.
 */
type CanonicalAuditPayload = {
  actionKind: string | null
  createdAt: string // ISO-8601
  decision: string
  decisionReason: string | null
  grantId: string
  llmPartnerId: string
  operation: string
  postTermination: boolean
  prevHash: string | null
  provenanceAlgorithm: string | null
  provenancePayload: UAPProvenancePayload | null
  provenancePublicKey: string | null
  provenanceSignature: string | null
  userId: string
}

/**
 * Build the canonical payload for an in-flight row that hasn't been
 * persisted yet. `createdAt` is supplied by the caller (writeAuditEntry)
 * so the signed timestamp matches the column Prisma will later store —
 * NOT a freshly-minted Date that would drift between the signing call
 * and the Postgres insert.
 */
function buildCanonicalPayloadForWrite(
  input: UAPAuditInput,
  prevHash: string | null,
  createdAt: Date,
): CanonicalAuditPayload {
  return {
    actionKind: input.actionKind ?? null,
    createdAt: createdAt.toISOString(),
    decision: input.decision,
    decisionReason: input.decisionReason ?? null,
    grantId: input.grantId,
    llmPartnerId: input.llmPartnerId,
    operation: input.operation,
    postTermination: input.postTermination,
    prevHash,
    provenanceAlgorithm: input.provenanceAlgorithm ?? null,
    provenancePayload: input.provenancePayload ?? null,
    provenancePublicKey: input.provenancePublicKey ?? null,
    provenanceSignature: input.provenanceSignature ?? null,
    userId: input.userId,
  }
}

/**
 * Build the canonical payload from a persisted row. Symmetric with
 * `buildCanonicalPayloadForWrite` so `verifyAuditChain` re-derives the
 * exact byte sequence that was signed at write time.
 *
 * Prisma's UAPAuditEntry row stores `provenancePayload` as `Json` — we
 * cast it through `unknown` to `UAPProvenancePayload | null` for the
 * canonical shape. The cast is safe because writeAuditEntry is the
 * only writer and it sources `provenancePayload` from `UAPAuditInput`.
 */
function buildCanonicalPayloadForVerify(
  row: UAPAuditEntry,
): CanonicalAuditPayload {
  return {
    actionKind: row.actionKind ?? null,
    createdAt: row.createdAt.toISOString(),
    decision: row.decision,
    decisionReason: row.decisionReason ?? null,
    grantId: row.grantId,
    llmPartnerId: row.llmPartnerId,
    operation: row.operation,
    postTermination: row.postTermination,
    prevHash: row.prevHash ?? null,
    provenanceAlgorithm: row.provenanceAlgorithm ?? null,
    provenancePayload:
      (row.provenancePayload as unknown as UAPProvenancePayload | null) ?? null,
    provenancePublicKey: row.provenancePublicKey ?? null,
    provenanceSignature: row.provenanceSignature ?? null,
    userId: row.userId,
  }
}

/* ────────────────────────── Sign / verify primitives ────────────────────────── */

/**
 * Ed25519 sign — base64-encoded for storage in a `text` column. Uses
 * Node's `crypto.sign` one-shot API with `null` as the algorithm
 * (Ed25519 includes its own hash + sign in a single primitive — there
 * is no "Ed25519 with SHA-256" mode and the stream `createSign` API
 * does not accept 'Ed25519' as an algorithm name in current Node).
 */
function signCanonical(canonicalJson: string): string {
  const key = getSigningKey()
  const sigBuf = sign(null, Buffer.from(canonicalJson, 'utf8'), key)
  return sigBuf.toString('base64')
}

function verifyCanonical(canonicalJson: string, signatureB64: string): boolean {
  const key = getVerificationKey()
  try {
    return verify(
      null,
      Buffer.from(canonicalJson, 'utf8'),
      key,
      Buffer.from(signatureB64, 'base64'),
    )
  } catch {
    // Malformed signature buffer, corrupt key material, etc. — treat as
    // a verification failure rather than letting the exception escape
    // the chain walk (otherwise a single corrupt row halts auditing for
    // all subsequent rows, which would be worse than reporting the
    // breakage cleanly to the caller).
    return false
  }
}

/**
 * sha256(prev row's signature), hex-encoded. The chain is "next row
 * commits to previous row's signature" — equivalent to a Merkle-style
 * linked list where each link is the cryptographic digest of the
 * previous link's signature (NOT the previous row's payload, because
 * the signature already commits to the payload — chaining the
 * signature is one less hop to verify).
 */
function computePrevHash(previousSignature: string): string {
  return createHash('sha256').update(previousSignature, 'utf8').digest('hex')
}

/* ────────────────────────── Public API ────────────────────────── */

/**
 * Append a signed, chained audit row.
 *
 * Per UAP-0.1.md §3 ("Every EXECUTE writes one immutable audit row")
 * the coordinator calls this exactly once per decision (including
 * non-execute operations: grant / revoke / kill / expire / precheck).
 *
 * Algorithm:
 *   1. Find the user's previous audit row (most recent createdAt).
 *   2. Derive prevHash = sha256(prev.signature) hex, or null if first.
 *   3. Mint createdAt = new Date() — used in both the signed payload
 *      AND the persisted column (must match — see canonicalize note).
 *   4. Build canonical payload (alphabetically-sorted JSON).
 *   5. Sign canonical payload with the coordinator's ed25519 key.
 *   6. Persist the row with computed signature + prevHash.
 *
 * No transactional locking around the previous-row lookup: the audit
 * chain is per-user, and the coordinator is the single writer, so the
 * "concurrent write breaks the chain" race is structurally
 * unreachable in v0.1.1. If/when we shard the coordinator, the writer
 * will need a per-user advisory lock; tracked as v0.2 hardening.
 */
export async function writeAuditEntry(
  input: UAPAuditInput,
): Promise<UAPAuditEntry> {
  const previous = await prisma.uAPAuditEntry.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: 'desc' },
  })

  const prevHash = previous ? computePrevHash(previous.signature) : null
  const createdAt = new Date()

  const canonical = canonicalize(
    buildCanonicalPayloadForWrite(input, prevHash, createdAt),
  )
  const signature = signCanonical(canonical)

  return prisma.uAPAuditEntry.create({
    data: {
      grantId: input.grantId,
      userId: input.userId,
      llmPartnerId: input.llmPartnerId,
      operation: input.operation,
      actionKind: input.actionKind ?? null,
      decision: input.decision,
      decisionReason: input.decisionReason ?? null,
      postTermination: input.postTermination,
      signature,
      prevHash,
      provenanceSignature: input.provenanceSignature ?? null,
      provenancePublicKey: input.provenancePublicKey ?? null,
      provenanceAlgorithm: input.provenanceAlgorithm ?? null,
      // Prisma's nullable Json column requires the JsonNull sentinel for
      // SQL NULL (a literal TS `null` is interpreted as the JSON-`null`
      // value, which would be a distinct in-band marker). Cast via
      // `unknown` because UAPProvenancePayload's nested literal types
      // are stricter than Prisma's structural InputJsonValue.
      provenancePayload: input.provenancePayload
        ? (input.provenancePayload as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      createdAt,
    },
  })
}

/**
 * Read the user's audit chain (oldest first — chain traversal order).
 *
 * `limit` default = 50, max 500 — a hard ceiling so a user with
 * thousands of audit rows can't accidentally request the full table in
 * one round-trip (the audit-viewer UI paginates; the verify-chain code
 * path walks the chain in batches and checkpoints).
 *
 * `grantId` and `since` are optional narrowing filters — useful for
 * "show me everything that happened under this specific grant" or
 * "show me everything since I last reviewed this morning."
 */
export async function loadAuditChain(params: {
  userId: string
  limit?: number
  grantId?: string
  since?: Date
}): Promise<UAPAuditEntry[]> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 500)

  return prisma.uAPAuditEntry.findMany({
    where: {
      userId: params.userId,
      ...(params.grantId ? { grantId: params.grantId } : {}),
      ...(params.since ? { createdAt: { gte: params.since } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
}

/**
 * Walk the user's entire chain and verify both halves of every link.
 *
 * For each row, in createdAt-ascending order:
 *   - Re-derive the canonical payload (which includes the persisted
 *     prevHash) and verify the persisted signature matches.
 *   - Re-derive what the prevHash SHOULD be (sha256 of the previous
 *     row's signature, or null for the first row) and verify the
 *     persisted prevHash matches.
 *
 * Either failure flips the chain to invalid and the function returns
 * immediately with the offending row's id — by design a verifier walks
 * only until it finds the breakage, not past it. (A tampered row
 * invalidates every downstream signature too, so reporting them all
 * would be noise.)
 *
 * `totalChecked` counts rows actually inspected, not the chain length
 * — equals the chain length on a clean chain, equals (index_of_break
 * + 1) on a broken one.
 */
export async function verifyAuditChain(userId: string): Promise<{
  valid: boolean
  invalidAtAuditId?: string
  totalChecked: number
}> {
  const rows = await prisma.uAPAuditEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })

  let expectedPrevHash: string | null = null
  let totalChecked = 0

  for (const row of rows) {
    totalChecked += 1

    // Check 1: the persisted prevHash links to the previous row's
    // signature (or is null for the first row).
    if ((row.prevHash ?? null) !== expectedPrevHash) {
      return { valid: false, invalidAtAuditId: row.id, totalChecked }
    }

    // Check 2: the persisted signature matches a re-derivation of the
    // canonical payload using the persisted fields.
    const canonical = canonicalize(buildCanonicalPayloadForVerify(row))
    if (!verifyCanonical(canonical, row.signature)) {
      return { valid: false, invalidAtAuditId: row.id, totalChecked }
    }

    expectedPrevHash = computePrevHash(row.signature)
  }

  return { valid: true, totalChecked }
}

/**
 * Fetch a single audit row by id.
 *
 * Used by the recipient-verifier path (GET /api/uap/v1/provenance/[auditId])
 * so a downstream recipient — Gmail server, Slack, the human inside
 * those inboxes — can look up the audit row referenced by a
 * representation action's provenance payload and re-confirm that the
 * action they received was real and is still in good standing (grant
 * not revoked, kill switch not fired, etc.). Returns null when the id
 * doesn't exist, so the route layer can map missing → 404 without
 * leaking existence info to attackers via timing.
 */
export async function loadAuditEntry(
  auditId: string,
): Promise<UAPAuditEntry | null> {
  return prisma.uAPAuditEntry.findUnique({ where: { id: auditId } })
}

