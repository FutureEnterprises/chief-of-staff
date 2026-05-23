/**
 * POST /api/uap/v1/execute — UAP v0.1 reserved endpoint
 * (execute action under a standing grant).
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
 *   POST /api/uap/v1/execute
 *   Authorization: Bearer coyl_uap_<partner_id>_<secret>
 *   {
 *     "grant_id": "grnt_8x4kls7a9d",
 *     "action": {
 *       "kind": "calendar.write",
 *       "operation": "schedule_event",
 *       "params": { "...domain-specific..." },
 *       "reversibility": "reversible"
 *     },
 *     "context": {
 *       "trigger": "morning_planning_routine",
 *       "confidence": 0.88
 *     }
 *   }
 *
 * The reference engine will: (1) verify the Bearer token, (2) load
 * and re-validate the grant server-side (no cached grants per T2),
 * (3) check scope match, (4) apply rules (quiet_hours, spending_cap,
 * irreversible_floor), (5) write a signed/chained UAPAuditEntry,
 * and (6) return the decision. See §7 for the coordinator sketch
 * and §3 for hard invariants.
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
      endpoint: '/api/uap/v1/execute',
      received_at: new Date().toISOString(),
      received_keys:
        body && typeof body === 'object' ? Object.keys(body) : [],
    },
    { status: 501 },
  )
}
