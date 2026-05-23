/**
 * GET /api/uap/v1/grant/[id] — UAP v0.1 reserved endpoint (read grant).
 * DELETE /api/uap/v1/grant/[id] — UAP v0.1 reserved endpoint (revoke grant).
 *
 * This is a STUB. The User-Authority Protocol v0.1 spec at
 * docs/protocol/UAP-0.1.md reserves this route as part of the
 * §9 surface reservation. The reference engine ships post-Series-A.
 *
 * Today's behavior: 501 with a body pointing the caller at the
 * spec. No database side effects. No partner authentication checks
 * (those land with the reference engine).
 *
 * Endpoint shape per spec §5 wire format:
 *   GET    /api/uap/v1/grant/[id]   → returns grant metadata + status
 *                                     (e.g. {grant_id, status, expires_at,
 *                                     audit_url, kill_switch_url})
 *   DELETE /api/uap/v1/grant/[id]   → user-initiated revoke. Flips the
 *                                     grant to REVOKED_BY_USER; in-flight
 *                                     actions audit-trace per §4.
 *
 * See UAP-0.1.md for the eight primitives, the hard invariants,
 * the threat model, and the consent UI requirements.
 */

import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  return NextResponse.json(
    {
      error: 'uap_v0_1_spec_reserved',
      message:
        'UAP-0.1 reserves this endpoint. The reference engine ships post-Series-A.',
      spec: 'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md',
      endpoint: `/api/uap/v1/grant/${id}`,
      received_at: new Date().toISOString(),
      received_keys: [],
    },
    { status: 501 },
  )
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  return NextResponse.json(
    {
      error: 'uap_v0_1_spec_reserved',
      message:
        'UAP-0.1 reserves this endpoint. The reference engine ships post-Series-A.',
      spec: 'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md',
      endpoint: `/api/uap/v1/grant/${id}`,
      received_at: new Date().toISOString(),
      received_keys: [],
    },
    { status: 501 },
  )
}
