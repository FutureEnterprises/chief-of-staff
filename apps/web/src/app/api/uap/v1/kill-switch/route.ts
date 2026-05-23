/**
 * POST /api/uap/v1/kill-switch — UAP v0.1 reserved endpoint
 * (global revoke across all LLMs and all grants).
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
 *   POST /api/uap/v1/kill-switch
 *   Authorization: <user session, NOT partner token>
 *   {
 *     "user_id": "u_2sj8xks0a",
 *     "reason": "user_initiated"
 *   }
 *
 * Per spec §5: "Returns within 1 second. Propagates to every
 * connected EAP surface within 5 seconds. Active grants flip to
 * terminal:killed_globally. The endpoint is rate-limit-exempt and
 * authentication-light — a user in crisis must be able to kill all
 * standing authority even if they cannot remember their password
 * (out-of-band recovery is policy, not protocol)."
 *
 * One of the two non-negotiable primitives per §2 (the other is
 * AUDIT_QUERY). KILL_SWITCH supersedes every grant, every rule,
 * every in-flight action.
 *
 * See UAP-0.1.md for the eight primitives, the hard invariants,
 * the threat model, and the consent UI requirements.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: unknown = null
  try {
    body = await req.json()
  } catch {
    // empty / malformed bodies are fine at the stub stage
  }

  return NextResponse.json(
    {
      error: 'uap_v0_1_spec_reserved',
      message:
        'UAP-0.1 reserves this endpoint. The reference engine ships post-Series-A.',
      spec: 'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md',
      endpoint: '/api/uap/v1/kill-switch',
      received_at: new Date().toISOString(),
      received_keys:
        body && typeof body === 'object' ? Object.keys(body) : [],
    },
    { status: 501 },
  )
}
