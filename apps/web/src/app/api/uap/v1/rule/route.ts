/**
 * POST /api/uap/v1/rule — UAP v0.1 reserved endpoint
 * (declare a pre-decline rule).
 *
 * This is a STUB. The User-Authority Protocol v0.1 spec at
 * docs/protocol/UAP-0.1.md reserves this route as part of the
 * §9 surface reservation. The reference engine ships post-Series-A.
 *
 * Today's behavior: 501 with a body pointing the caller at the
 * spec. No database side effects. No partner authentication checks
 * (those land with the reference engine).
 *
 * Endpoint shape per spec §2 (RULE_DECLARE) and §5:
 *   POST /api/uap/v1/rule
 *   Authorization: <user session>
 *   {
 *     "user_id": "u_2sj8xks0a",
 *     "grant_id": "grnt_8x4kls7a9d",  // optional; null = user-global rule
 *     "kind": "spending_cap" | "quiet_hours" | "irreversible_floor" | ...,
 *     "params": { "max_per_action_usd": 50 }
 *   }
 *
 * Per spec §2: "RULE_DECLARE — User pre-declines a class of action
 * ('never spend > $50 without asking', 'never send messages after
 * midnight', 'never share with X'). Rules supersede grants. A rule
 * violation auto-denies even if the grant would otherwise allow."
 *
 * Per spec §3 hard invariant: "Negative authority precedes positive
 * authority. A rule that pre-declines an action class is stronger
 * than any grant. RULE_DECLARE writes a row that supersedes every
 * overlapping grant, even fresh ones."
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
      endpoint: '/api/uap/v1/rule',
      received_at: new Date().toISOString(),
      received_keys:
        body && typeof body === 'object' ? Object.keys(body) : [],
    },
    { status: 501 },
  )
}
