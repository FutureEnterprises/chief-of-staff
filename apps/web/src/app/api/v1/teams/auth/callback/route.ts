/**
 * Microsoft Graph delegated-OAuth — step 2: exchange the authorization
 * code for an access + refresh token pair and upsert the TeamsUserAuth
 * row.
 *
 * Public route (Microsoft can't include a Clerk JWT on the redirect
 * back). User attribution comes from the HMAC-signed `state` payload
 * we minted in /api/v1/teams/auth/connect — the signature is
 * timing-safe-verified inside decodeSignedState() so a tampered state
 * (different userId, replayed nonce) is rejected before we touch the
 * DB.
 *
 * The tenantId we persist is derived from the id_token's `tid` claim,
 * not from the optional `tenant` query hint that may or may not be
 * present — this is the authoritative source per Microsoft's identity
 * platform docs.
 */
import { prisma } from '@repo/database'
import crypto from 'node:crypto'
import {
  decodeSignedState,
  exchangeCodeForTokens,
  getGraphConfig,
  persistTokens,
} from '@/lib/integrations/microsoft-graph'

/**
 * Decode the `tid` (tenant id) claim from the id_token returned by the
 * token-exchange. Microsoft signs id_tokens but for the tenant-id read
 * we only need the payload — the access token's authority (i.e. the
 * tenant) is enforced server-side at every subsequent Graph call.
 */
function extractTenantIdFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  try {
    const payloadPart = parts[1]
    if (!payloadPart) return null
    const b64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const json = Buffer.from(b64 + pad, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { tid?: unknown }
    if (typeof payload.tid !== 'string') return null
    // Tenant ids from Azure AD are always UUID-shaped (32 hex + 4
    // dashes). Reject anything else to keep a malformed/forged id_token
    // from injecting noise into the row.
    if (!/^[0-9a-fA-F-]{32,36}$/.test(payload.tid)) return null
    return payload.tid
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return Response.json({ error: `aad_${errorParam}` }, { status: 400 })
  }
  if (!code || !stateRaw) {
    return Response.json({ error: 'missing_params' }, { status: 400 })
  }
  if (!getGraphConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const state = decodeSignedState(stateRaw)
  if (!state) {
    return Response.json({ error: 'invalid_state' }, { status: 400 })
  }

  // The state payload carries the COYL userId minted by /connect.
  // Look it up — if the user vanished between connect + callback (rare;
  // happens if the Clerk account was deleted), 404.
  const user = await prisma.user.findUnique({
    where: { id: state.userId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const token = await exchangeCodeForTokens(code)
  if (!token) {
    return Response.json({ error: 'token_exchange_failed' }, { status: 502 })
  }

  // tenantId of record is the id_token `tid` claim. Fallback to the
  // hint from the signed state if the id_token didn't ship (shouldn't
  // happen with our scope set, but defence-in-depth).
  const tenantId =
    extractTenantIdFromIdToken(token.id_token) ?? state.tenantId ?? 'common'

  try {
    await persistTokens(user.id, tenantId, token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[teams/auth/callback] persist failed', {
      userId: user.id,
      err: msg,
    })
    return Response.json({ error: 'persist_failed', detail: msg }, { status: 500 })
  }

  // Audit the connect as a FEATURE_USED event so the Today view +
  // /settings/teams card can show "connected" status without an
  // extra round-trip.
  await prisma.productivityEvent.create({
    data: {
      userId: user.id,
      eventType: 'FEATURE_USED',
      eventValue: 'integration_token_graph',
      metadataJson: {
        tenantId,
        scopesGranted: (token.scope ?? '').split(' ').filter(Boolean),
        connectedAt: new Date().toISOString(),
        // Provenance fingerprint of the consent — used to spot replay
        // anomalies in the audit dashboard.
        consentFingerprint: crypto
          .createHash('sha256')
          .update(`${user.id}:${tenantId}:${token.scope ?? ''}`)
          .digest('hex')
          .slice(0, 16),
      },
    },
  })

  // Use the configured app URL, never req.url — req.url is
  // attacker-controlled and naive base-URL construction is an
  // open-redirect vector (CWE-601). Hard-coded path suffix means the
  // entire destination is server-controlled.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  return Response.redirect(`${appUrl}/settings?integration=teams_connected`, 302)
}
