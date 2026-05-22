import { auth } from '@clerk/nextjs/server'
import crypto from 'node:crypto'
import { buildLibreAuthorizeUrl, getLibreConfig } from '@/lib/integrations/libre'

/**
 * FreeStyle Libre OAuth — step 1.
 * TODO: real Libre API access requires Abbott partnership LOI; v0.1 ships
 * OAuth scaffolding only.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!getLibreConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = `${clerkId}:${nonce}`
  const url = buildLibreAuthorizeUrl(state)
  if (!url) return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  return Response.redirect(url, 302)
}
