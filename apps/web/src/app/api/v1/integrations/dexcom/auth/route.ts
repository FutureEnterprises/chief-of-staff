import { auth } from '@clerk/nextjs/server'
import crypto from 'node:crypto'
import { buildDexcomAuthorizeUrl, getDexcomConfig } from '@/lib/integrations/dexcom'

/**
 * Dexcom OAuth — step 1: redirect the user to Dexcom's authorize URL.
 * Returns 503 `integration_not_configured` when env vars are missing.
 * Clerk-protected: we encode the Clerk user id in the OAuth state so the
 * callback can attribute the returned code without a separate session lookup.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!getDexcomConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = `${clerkId}:${nonce}`
  const url = buildDexcomAuthorizeUrl(state)
  if (!url) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }
  return Response.redirect(url, 302)
}
