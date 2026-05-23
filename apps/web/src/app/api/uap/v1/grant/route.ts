/**
 * POST /api/uap/v1/grant — UAP v0.1 reserved endpoint (issue grant).
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
 *   POST /api/uap/v1/grant
 *   Authorization: Bearer coyl_uap_<partner_id>_<secret>
 *   {
 *     "user_id": "u_2sj8xks0a",
 *     "scopes": ["calendar.write", "messaging.routine", "purchase.recurring"],
 *     "expires_at": "2026-05-29T17:00:00Z",
 *     "rules": [
 *       { "kind": "spending_cap", "max_per_action_usd": 50 },
 *       { "kind": "quiet_hours", "from": "00:00", "to": "07:00", "tz": "America/Los_Angeles" },
 *       { "kind": "irreversible_floor", "always_confirm": ["money_transfer", "share_pii"] }
 *     ],
 *     "consent_artifact": {
 *       "version": "0.1",
 *       "shown_to_user_at": "2026-05-22T16:58:00Z",
 *       "user_response": "explicit_grant",
 *       "ui_surface": "settings.standing_authority"
 *     }
 *   }
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
      endpoint: '/api/uap/v1/grant',
      received_at: new Date().toISOString(),
      received_keys:
        body && typeof body === 'object' ? Object.keys(body) : [],
    },
    { status: 501 },
  )
}
