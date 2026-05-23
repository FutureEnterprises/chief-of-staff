/**
 * GET /api/uap/v1/provenance/[auditId] — UAP v0.1.1 provenance verification.
 *
 * Public, unauthenticated. Recipients of representation actions (Gmail,
 * Stripe, Apple Calendar, your mother's inbox, etc.) verify the
 * cryptographic provenance signature attached to an outgoing action by
 * fetching this endpoint, comparing the returned public key against the
 * one bundled with the payload, and confirming the grant is still active.
 *
 * Per UAP-0.1.md §5.5, the response shape (when implemented) is:
 *
 *   {
 *     "audit_id": "aud_4kx9s7ad",
 *     "payload": { ...canonical signed payload from §5.5... },
 *     "agent_public_key": "<base64 ed25519 agent pub key>",
 *     "user_public_key":  "<base64 ed25519 user pub key>",
 *     "signature":        "<base64 ed25519 sig of payload>",
 *     "algorithm":        "ed25519",
 *     "grant_status":     "active" | "revoked" | "expired" | "killed_globally",
 *     "audit_chain":      { "prev_hash": "...", "row_signature": "..." }
 *   }
 *
 * This is a STUB. UAP-0.1.1 reserves the route as part of the spec's §9
 * surface reservation. The reference engine (which mints, signs, and
 * verifies these provenance envelopes) ships post-Series-A per spec §13.
 *
 * Today's behavior: 501 with a body pointing the caller at the spec. No
 * database read. No partner auth (this endpoint is intentionally
 * unauthenticated — recipients of AI-mediated actions cannot be expected
 * to hold partner credentials).
 *
 * See UAP-0.1.md for the v0.1.1 provenance primitive, T9 (spoofed
 * provenance threat), and the irreversibility floor's interaction with
 * representation actions.
 */

import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await params

  return NextResponse.json(
    {
      error: 'uap_v0_1_1_spec_reserved',
      message:
        'UAP-0.1.1 reserves this endpoint. The provenance reference engine ships post-Series-A.',
      spec: 'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md',
      endpoint: `/api/uap/v1/provenance/${auditId}`,
      audit_id: auditId,
      received_at: new Date().toISOString(),
      hint:
        'Recipients of UAP representation actions should verify provenance signatures via this endpoint once the reference engine ships. See spec §5.5 for the wire format and T9 for the spoofed-provenance threat.',
    },
    { status: 501 },
  )
}
