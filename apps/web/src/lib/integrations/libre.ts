/**
 * Abbott FreeStyle Libre CGM integration helpers.
 *
 * Abbott's LibreView API is gated by partnership negotiation. v0.1 ships
 * the OAuth scaffolding only; readings calls return mock data until we
 * get production credentials.
 *
 * TODO: real Libre API access requires Abbott partnership LOI.
 */

// Reuse the AES helpers + encryption-key bootstrap from the Dexcom lib so
// we don't duplicate crypto code across integrations.
export { encryptToken, decryptToken, getEncryptionKey } from './dexcom'

// Placeholder URLs — exact endpoints vary by Abbott partner tier.
export const LIBRE_AUTH_URL = 'https://api.libreview.io/oauth2/authorize'
export const LIBRE_TOKEN_URL = 'https://api.libreview.io/oauth2/token'
export const LIBRE_READINGS_URL = 'https://api.libreview.io/v1/glucose/readings'

export type LibreConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getLibreConfig(): LibreConfig | null {
  const clientId = process.env.LIBRE_CLIENT_ID
  const clientSecret = process.env.LIBRE_CLIENT_SECRET
  const redirectUri = process.env.LIBRE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function buildLibreAuthorizeUrl(state: string): string | null {
  const config = getLibreConfig()
  if (!config) return null
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'read:glucose',
    state,
  })
  return `${LIBRE_AUTH_URL}?${params.toString()}`
}

export type LibreTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export async function exchangeLibreCode(
  code: string,
): Promise<LibreTokenResponse | null> {
  const config = getLibreConfig()
  if (!config) return null

  // TODO: real Libre API access requires Abbott partnership LOI. Until
  // then we attempt a real exchange but tolerate failure so the OAuth
  // scaffolding remains functional in test instances.
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  })
  try {
    const res = await fetch(LIBRE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })
    if (!res.ok) {
      // Mock token for scaffolding — replaced once Abbott partnership is live.
      return {
        access_token: `libre_mock_${Date.now()}`,
        refresh_token: `libre_mock_refresh_${Date.now()}`,
        expires_in: 3600,
        token_type: 'Bearer',
      }
    }
    return (await res.json()) as LibreTokenResponse
  } catch {
    return {
      access_token: `libre_mock_${Date.now()}`,
      refresh_token: `libre_mock_refresh_${Date.now()}`,
      expires_in: 3600,
      token_type: 'Bearer',
    }
  }
}

export type LibreReading = {
  systemTime: string
  displayTime: string
  value: number // mg/dL
  trend?: string
  trendRate?: number | null
}

/**
 * Mock-data response until Abbott partnership API access is live.
 * Returns a couple of plausible readings around 110 mg/dL with no trend.
 */
export async function fetchLibreReadings(_accessToken: string): Promise<LibreReading[]> {
  const now = Date.now()
  // TODO: real Libre API access requires Abbott partnership LOI — return mock data v0.1.
  return [
    {
      systemTime: new Date(now - 15 * 60 * 1000).toISOString(),
      displayTime: new Date(now - 15 * 60 * 1000).toISOString(),
      value: 112,
      trend: 'flat',
      trendRate: 0.1,
    },
    {
      systemTime: new Date(now).toISOString(),
      displayTime: new Date(now).toISOString(),
      value: 108,
      trend: 'flat',
      trendRate: -0.2,
    },
  ]
}
