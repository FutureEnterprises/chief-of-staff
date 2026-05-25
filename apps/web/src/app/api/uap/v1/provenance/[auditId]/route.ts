/**
 * GET /api/uap/v1/provenance/[auditId] — public provenance verifier.
 *
 * Per UAP-0.1.md §5.5 (v0.1.1). Recipients of representation actions
 * verify the cryptographic provenance signature attached to an
 * outgoing action by fetching this endpoint, comparing the returned
 * public key against the one bundled with the payload, and confirming
 * the grant is still active.
 *
 * UNAUTHENTICATED — recipients cannot be expected to hold partner
 * credentials. The route is intentionally permissive on read but
 * scoped tightly: it only returns provenance metadata for audit rows
 * whose action is a representation action with a signature attached.
 * Non-representation rows return 404 to prevent enumeration.
 *
 * Response shape (per spec):
 *   {
 *     audit_id, payload, signature, public_key, algorithm,
 *     grant_status,
 *     audit_chain: { prev_hash, row_signature }
 *   }
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

/**
 * Strict whitelist for audit ids. Our audit ids are minted as
 * `aud_<24 hex chars>` (12 random bytes hex-encoded) by the execute
 * route. This regex is the choke point that detains `auditId` from
 * the URL path before it reaches Prisma — anything not matching
 * returns 404 without touching the database.
 */
const AUDIT_ID_PATTERN = /^aud_[a-f0-9]{24}$/

/**
 * Branded type — the only way to produce a `ValidatedAuditId` is via
 * `parseAuditId`, which character-set-whitelists the input. Functions
 * that hit Prisma require this type, so taint analysis can confirm
 * raw URL params never reach the data layer.
 */
type ValidatedAuditId = string & { readonly __brand: 'ValidatedAuditId' }

function parseAuditId(raw: string): ValidatedAuditId | null {
  if (!AUDIT_ID_PATTERN.test(raw)) return null
  return raw as ValidatedAuditId
}

/**
 * Pure data-layer call. Takes a `ValidatedAuditId` (constructed only
 * by `parseAuditId` above), not a raw request param, so static
 * analyzers see no `ctx` taint reaching the query.
 */
async function findAuditEntryByValidatedId(id: ValidatedAuditId) {
  return prisma.uAPAuditEntry.findUnique({
    where: { id },
    include: {
      grant: {
        select: {
          id: true,
          status: true,
          expiresAt: true,
        },
      },
    },
  })
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await ctx.params
  if (!auditId) {
    return NextResponse.json(
      { error: 'missing_audit_id', message: 'Audit id is required.' },
      { status: 400 },
    )
  }
  const validated = parseAuditId(auditId)
  if (validated === null) {
    // Treat malformed ids as not-found rather than 400 so the
    // endpoint can't be used as a format-discovery oracle.
    return NextResponse.json(
      { error: 'not_found', message: 'No audit entry with that id.' },
      { status: 404 },
    )
  }

  let row
  try {
    row = await findAuditEntryByValidatedId(validated)
  } catch (err) {
    console.error('[uap/provenance] audit lookup failed', {
      err: err instanceof Error ? err.message : 'unknown',
      auditId,
    })
    return NextResponse.json(
      { error: 'lookup_failed', message: 'Unable to load audit entry.' },
      { status: 500 },
    )
  }

  if (!row) {
    return NextResponse.json(
      { error: 'not_found', message: 'No audit entry with that id.' },
      { status: 404 },
    )
  }

  // Only return provenance for representation actions that were
  // actually signed. Anything else 404s to prevent the endpoint from
  // being used as an audit-row enumeration oracle for outside parties.
  if (!row.provenanceSignature || !row.provenancePublicKey || !row.provenancePayload) {
    return NextResponse.json(
      {
        error: 'not_a_representation_action',
        message:
          'This audit entry does not carry a v0.1.1 provenance signature.',
      },
      { status: 404 },
    )
  }

  const grantStatus = computeGrantStatus(row.grant)

  return NextResponse.json({
    audit_id: row.id,
    payload: row.provenancePayload,
    signature: row.provenanceSignature,
    public_key: row.provenancePublicKey,
    algorithm: row.provenanceAlgorithm ?? 'ed25519',
    grant_status: grantStatus,
    audit_chain: {
      prev_hash: row.prevHash ?? null,
      row_signature: row.signature,
    },
  })
}

function computeGrantStatus(
  grant: { status: string; expiresAt: Date } | null,
): 'active' | 'revoked' | 'expired' | 'killed_globally' | 'unknown' {
  if (!grant) return 'unknown'
  if (grant.status === 'REVOKED_BY_USER') return 'revoked'
  if (grant.status === 'KILLED_GLOBALLY') return 'killed_globally'
  if (grant.status === 'EXPIRED') return 'expired'
  if (grant.expiresAt.getTime() <= Date.now()) return 'expired'
  return 'active'
}
