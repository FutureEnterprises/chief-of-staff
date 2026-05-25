/**
 * UAP v0.1.1 — Provenance signing for representation actions.
 *
 * Every EXECUTE whose action is a "representation action" (the agent
 * acts AS the user to another human or external system — see
 * UAP_REPRESENTATION_ACTIONS in ./types) MUST carry a cryptographic
 * provenance signature on the outgoing payload. The signature lets
 * the recipient distinguish:
 *
 *   "AI-mediated message authored by Claude on behalf of Iman,
 *    with active standing authority"
 *
 * from
 *
 *   "compromised account" / "human sender" / "forged AI mediation"
 *
 * The signature is ed25519, computed over the canonical JSON of the
 * §5.5 provenance payload, using the user's per-account UAP signing
 * key. Keys are lazily generated at first-grant time via
 * ensureUserSigningKey(), persisted on the User row, and rotated by
 * rotateUserSigningKey() on KILL_SWITCH (§6 T9 mitigation).
 *
 * Wire format and verification rules: docs/protocol/UAP-0.1.md §5.5.
 * Threat model: docs/protocol/UAP-0.1.md §6 T9 (spoofed provenance).
 *
 * Implementation choices:
 *
 *   - Node built-in `crypto` is used directly. No external dependency
 *     (libsodium, tweetnacl, @noble/ed25519) is pulled in. Node's
 *     `crypto.sign('Ed25519', …)` is purely native and constant-time.
 *
 *   - Keys are stored base64 on the User row (uapSigningKeyPublic +
 *     uapSigningKeyPrivate). Encryption-at-rest is provided by the
 *     underlying Supabase Postgres column policy — the application
 *     layer stores opaque text.
 *
 *   - The signing payload is JSON.stringify with alphabetically-sorted
 *     keys and no whitespace. Sorting is deterministic so the same
 *     payload signs to the same bytes on every box.
 */

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from 'node:crypto'
import { prisma } from '@repo/database'
import type {
  UAPProvenancePayload,
  UAPProvenanceSignature,
  UAPRepresentationAction,
} from './types'
import { UAP_REPRESENTATION_ACTIONS } from './types'

/* ──────────────────── Representation-action lookup ──────────────────── */

/**
 * O(1)-lookup Set view of UAP_REPRESENTATION_ACTIONS. The tuple in
 * ./types is the source of truth (so the type union stays narrow);
 * this Set is the runtime-fast checker used by isRepresentationAction.
 */
export const REPRESENTATION_ACTION_KINDS: ReadonlySet<string> = new Set<string>(
  UAP_REPRESENTATION_ACTIONS as ReadonlyArray<UAPRepresentationAction>,
)

/**
 * True when actionKind is one of the seven v0.1.1 representation
 * actions (send_message, calendar_rsvp, public_post, payment, share,
 * dm_send, comment_post). Callers use this to decide whether to
 * synthesize a provenance signature on the outgoing EXECUTE.
 */
export function isRepresentationAction(actionKind: string): boolean {
  return REPRESENTATION_ACTION_KINDS.has(actionKind)
}

/* ──────────────────── Canonical JSON ──────────────────── */

/**
 * Canonical JSON for signing: keys sorted alphabetically, no
 * whitespace. The payload fields are flat strings (no nested objects
 * at this version), so a single-level alphabetic sort is sufficient.
 *
 * The exact byte sequence this produces is what gets signed and
 * verified — recipients re-serialize the payload with the same rule
 * before calling crypto.verify. Drift in the serializer would silently
 * invalidate every signature, so we centralize it here.
 */
function canonicalize(payload: UAPProvenancePayload): string {
  const sortedKeys = Object.keys(payload).sort() as Array<keyof UAPProvenancePayload>
  const ordered: Record<string, unknown> = {}
  for (const k of sortedKeys) {
    ordered[k] = payload[k]
  }
  return JSON.stringify(ordered)
}

/* ──────────────────── Keypair lifecycle ──────────────────── */

/**
 * Generates a fresh ed25519 keypair. Both keys are returned base64-
 * encoded — SPKI for the public key, PKCS#8 for the private key —
 * which is the format we persist on the User row and the format the
 * recipient receives at GET /api/uap/v1/provenance/{audit_id}.
 */
function generateKeypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  })
  return {
    publicKey: publicKey.toString('base64'),
    privateKey: privateKey.toString('base64'),
  }
}

/**
 * Lazily generates and persists a UAP signing keypair for the user.
 * If the user already has one, returns it unchanged — so this is safe
 * to call before every signProvenance() without risking a re-generate
 * race. Called by the UAP grant path the first time a user grants any
 * standing authority.
 *
 * Concurrency note: two simultaneous first-grant calls could each
 * generate a keypair before either writes. The second write would
 * overwrite the first's keys, which would invalidate the first
 * caller's just-signed payload. In practice that's not yet a real
 * risk (a single user doesn't initiate two parallel first-grants),
 * but if it becomes one, swap the read-then-write here for an upsert
 * with `ON CONFLICT DO NOTHING` semantics.
 */
export async function ensureUserSigningKey(
  userId: string,
): Promise<{ publicKey: string; privateKey: string }> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { uapSigningKeyPublic: true, uapSigningKeyPrivate: true },
  })

  if (!existing) {
    throw new Error(`UAP provenance: user ${userId} not found`)
  }

  if (existing.uapSigningKeyPublic && existing.uapSigningKeyPrivate) {
    return {
      publicKey: existing.uapSigningKeyPublic,
      privateKey: existing.uapSigningKeyPrivate,
    }
  }

  const fresh = generateKeypair()
  await prisma.user.update({
    where: { id: userId },
    data: {
      uapSigningKeyPublic: fresh.publicKey,
      uapSigningKeyPrivate: fresh.privateKey,
    },
  })
  return fresh
}

/**
 * Rotates the user's UAP signing keypair. Called from the KILL_SWITCH
 * path: invalidating outstanding provenance signatures is intentional
 * — a kill closes the trust path, so the recipient verifying an old
 * signature against the new public key fails by design. Anything the
 * user issued under the old keypair MAY have been authorized at the
 * time but is no longer one the user stands behind.
 *
 * Returns only the new public key. The new private key stays
 * server-side and is only ever read by signProvenance().
 */
export async function rotateUserSigningKey(
  userId: string,
): Promise<{ newPublicKey: string }> {
  const fresh = generateKeypair()
  await prisma.user.update({
    where: { id: userId },
    data: {
      uapSigningKeyPublic: fresh.publicKey,
      uapSigningKeyPrivate: fresh.privateKey,
    },
  })
  return { newPublicKey: fresh.publicKey }
}

/* ──────────────────── Sign / Verify ──────────────────── */

/**
 * Builds the canonical §5.5 provenance payload, signs it with the
 * user's ed25519 private key, and returns the full envelope ready to
 * attach to the outgoing EXECUTE as `provenanceSignature` /
 * `provenancePublicKey` / `provenancePayload` on the audit row, and
 * to be exposed on the wire via `X-UAP-Provenance` or `[via @coyl/…]`.
 */
export async function signProvenance(params: {
  userId: string
  partnerId: string
  grantId: string
  auditId: string
  actionKind: string
  recipientHint: string
}): Promise<UAPProvenanceSignature> {
  const { publicKey, privateKey } = await ensureUserSigningKey(params.userId)

  const payload: UAPProvenancePayload = {
    v: 'uap-0.1.1',
    agent: params.partnerId,
    subject: `did:coyl:${params.userId}`,
    grant_id: params.grantId,
    audit_id: params.auditId,
    action_kind: params.actionKind,
    recipient_hint: params.recipientHint,
    issued_at: new Date().toISOString(),
    audit_url: `https://coyl.ai/api/uap/v1/provenance/${params.auditId}`,
  }

  const canonical = canonicalize(payload)
  const privateKeyObject = createPrivateKey({
    key: Buffer.from(privateKey, 'base64'),
    format: 'der',
    type: 'pkcs8',
  })
  const signature = sign(null, Buffer.from(canonical), privateKeyObject)

  return {
    payload,
    signature: signature.toString('base64'),
    publicKey,
    algorithm: 'ed25519',
  }
}

/**
 * Verifies a provenance signature against its embedded public key and
 * canonical payload. Recipients call this; the COYL coordinator also
 * calls it defensively at the public verifier endpoint to confirm the
 * stored row hasn't drifted from the issued envelope.
 *
 * Returns false on any failure — bad base64, unsupported algorithm,
 * malformed key, or signature mismatch — never throws. A throw here
 * would let a malformed envelope crash the verifier; returning false
 * collapses every "not valid" path into the obvious recipient action
 * (treat as unsigned).
 */
export function verifyProvenance(signature: UAPProvenanceSignature): boolean {
  if (signature.algorithm !== 'ed25519') return false

  try {
    const canonical = canonicalize(signature.payload)
    const publicKeyObject = createPublicKey({
      key: Buffer.from(signature.publicKey, 'base64'),
      format: 'der',
      type: 'spki',
    })
    return verify(
      null,
      Buffer.from(canonical),
      publicKeyObject,
      Buffer.from(signature.signature, 'base64'),
    )
  } catch {
    return false
  }
}
