import { createHmac, timingSafeEqual } from 'crypto'
import { headers } from 'next/headers'

/**
 * Shared Twilio webhook signature verification, used by every inbound
 * Twilio route (SMS, and now the voice TwiML + status callbacks).
 * Twilio signs POST params with TWILIO_AUTH_TOKEN — see
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Extracted from the original inbound/twilio SMS route so the voice
 * routes don't reimplement HMAC comparison, a security-sensitive check
 * that should have exactly one implementation.
 */
export function expectedTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string,
): string {
  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) {
    data += key + params[key]
  }
  return createHmac('sha1', authToken).update(data).digest('base64')
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Verify an inbound Twilio webhook request. Returns the parsed
 * form-encoded params on success, or null if the signature is missing,
 * invalid, or TWILIO_AUTH_TOKEN isn't configured.
 *
 * Reconstructs the URL the way Twilio signed it — the public
 * (x-forwarded-host) URL, not req.url, which may be an internal alias.
 */
export async function verifyTwilioWebhook(
  req: Request,
): Promise<{ params: Record<string, string> } | null> {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return null

  let bodyText: string
  try {
    bodyText = await req.text()
  } catch {
    return null
  }

  const params: Record<string, string> = {}
  const usp = new URLSearchParams(bodyText)
  for (const [k, v] of usp.entries()) params[k] = v

  const h = await headers()
  const forwardedHost = h.get('x-forwarded-host') ?? h.get('host')
  const forwardedProto = h.get('x-forwarded-proto') ?? 'https'
  const reqUrl = new URL(req.url)
  const url = forwardedHost
    ? `${forwardedProto}://${forwardedHost}${reqUrl.pathname}${reqUrl.search}`
    : req.url

  const providedSig = h.get('x-twilio-signature') ?? ''
  const expectedSig = expectedTwilioSignature(url, params, authToken)
  if (!providedSig || !constantTimeEqual(providedSig, expectedSig)) return null

  return { params }
}
