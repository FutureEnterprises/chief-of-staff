import { auth } from '@clerk/nextjs/server'
import crypto from 'node:crypto'
import {
  buildWithingsAuthorizeUrl,
  getWithingsConfig,
} from '@/lib/integrations/withings'

/**
 * Withings OAuth — step 1: redirect the user to Withings' authorize page.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!getWithingsConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = `${clerkId}:${nonce}`
  const url = buildWithingsAuthorizeUrl(state)
  if (!url) return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  return Response.redirect(url, 302)
}
