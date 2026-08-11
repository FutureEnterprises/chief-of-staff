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
 *     grant_status, consent_class,
 *     audit_chain: { prev_hash, row_signature }
 *   }
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { checkDistributedRateLimit } from '@/lib/rate-limit'
import { consentClassLabel } from '@/lib/uap/consent-class'

/**
 * Per-IP rate limit for this UNAUTHENTICATED verifier. Recipients
 * verify one envelope at a time; 120/10min per IP is generous for
 * legitimate verification and caps blind id-space scanning. Allow-on-
 * unconfigured (dev / Redis hiccup) — verification must not hard-fail
 * on missing Redis.
 */
const PROVENANCE_IP_LIMIT = 120
const PROVENANCE_IP_WINDOW_MS = 10 * 60 * 1000

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
          // Consent provenance — which class of consent backed the
          // decision this envelope attests to. Read from the grant, the
          // authoritative record, so a relying party does not have to
          // trust an unsigned field travelling next to the signature.
          consentArtifact: true,
        },
      },
    },
  })
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ auditId: string }> },
) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const rl = await checkDistributedRateLimit({
    prefix: 'uap-provenance-ip',
    identifier: ip,
    limit: PROVENANCE_IP_LIMIT,
    windowMs: PROVENANCE_IP_WINDOW_MS,
  })
  if (rl.configured && rl.limited) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

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
    // 'coordinator_verified' — COYL hosted the consent ceremony and saw
    // the user accept. 'partner_attested' — the LLM partner asserted the
    // user consented, on its own credential; such grants cannot
    // authorize irreversibility-floor actions at all. 'unclassified' —
    // the grant predates consent classing. A recipient deciding how
    // much to trust an AI-mediated message should read this alongside
    // grant_status.
    consent_class: consentClassLabel(row.grant?.consentArtifact),
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
