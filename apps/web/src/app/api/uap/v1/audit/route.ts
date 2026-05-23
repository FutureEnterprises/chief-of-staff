/**
 * GET /api/uap/v1/audit — UAP v0.1 reserved endpoint
 * (user reads their UAP audit history).
 *
 * This is a STUB. The User-Authority Protocol v0.1 spec at
 * docs/protocol/UAP-0.1.md reserves this route as part of the
 * §9 surface reservation. The reference engine ships post-Series-A.
 *
 * Today's behavior: 501 with a body pointing the caller at the
 * spec. No database side effects. No partner authentication checks
 * (those land with the reference engine).
 *
 * Endpoint shape per spec §2 (AUDIT_QUERY) and §3:
 *   GET /api/uap/v1/audit?grant_id=<id>&since=<iso>&limit=<n>
 *   Authorization: <user session>
 *
 * Per spec §2: "AUDIT_QUERY — User reads everything performed under
 * grant G, or all grants for LLM Y, or all activity for user U.
 * Read-only, append-only log."
 *
 * One of the two non-negotiable primitives per §2 (the other is
 * KILL_SWITCH). Per §3: "Every EXECUTE writes one immutable audit
 * row. The log is append-only, cryptographically signed, and
 * queryable by the user without LLM partner involvement. The user
 * owns the audit trail — not the LLM, not COYL."
 *
 * See UAP-0.1.md for the eight primitives, the hard invariants,
 * the threat model, and the consent UI requirements.
 */

import { NextResponse } from 'next/server'

export async function GET(_req: Request) {
  return NextResponse.json(
    {
      error: 'uap_v0_1_spec_reserved',
      message:
        'UAP-0.1 reserves this endpoint. The reference engine ships post-Series-A.',
      spec: 'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md',
      endpoint: '/api/uap/v1/audit',
      received_at: new Date().toISOString(),
      received_keys: [],
    },
    { status: 501 },
  )
}
