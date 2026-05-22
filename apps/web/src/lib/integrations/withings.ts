/**
 * Withings smart-scale integration helpers.
 *
 * OAuth 2.0 → exchange code → poll /measure?action=getmeas&meastype=1
 * for body weight. Withings POSTs webhook notifications to /webhook
 * which trigger a re-fetch.
 */

export { encryptToken, decryptToken, getEncryptionKey } from './dexcom'

export const WITHINGS_AUTH_URL = 'https://account.withings.com/oauth2_user/authorize2'
export const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'
export const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure'
export const WITHINGS_NOTIFY_URL = 'https://wbsapi.withings.net/notify'

export type WithingsConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getWithingsConfig(): WithingsConfig | null {
  const clientId = process.env.WITHINGS_CLIENT_ID
  const clientSecret = process.env.WITHINGS_CLIENT_SECRET
  const redirectUri = process.env.WITHINGS_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function buildWithingsAuthorizeUrl(state: string): string | null {
  const config = getWithingsConfig()
  if (!config) return null
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'user.metrics',
    state,
  })
  return `${WITHINGS_AUTH_URL}?${params.toString()}`
}

export type WithingsTokenBody = {
  userid: string
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}

/**
 * Withings wraps token responses in { status, body }. status=0 means OK.
 */
export async function exchangeWithingsCode(
  code: string,
): Promise<WithingsTokenBody | null> {
  const config = getWithingsConfig()
  if (!config) return null
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  })
  const res = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { status: number; body?: WithingsTokenBody }
  if (data.status !== 0 || !data.body) return null
  return data.body
}

export type WithingsWeightReading = {
  date: string
  weightKg: number
  source: string
}

/**
 * Fetch weight measurements (meastype=1) for an access token.
 * Withings returns weight in grams * 10^unit; we normalise to kg.
 */
export async function fetchWithingsWeights(
  accessToken: string,
  startdate?: number,
): Promise<WithingsWeightReading[]> {
  const sinceTs = startdate ?? Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const body = new URLSearchParams({
    action: 'getmeas',
    meastype: '1',
    category: '1',
    startdate: String(sinceTs),
  })
  const res = await fetch(WITHINGS_MEASURE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return []
  const data = (await res.json()) as {
    status: number
    body?: {
      measuregrps?: Array<{
        date: number
        measures: Array<{ value: number; type: number; unit: number }>
      }>
    }
  }
  if (data.status !== 0 || !data.body?.measuregrps) return []
  const out: WithingsWeightReading[] = []
  for (const grp of data.body.measuregrps) {
    const weight = grp.measures.find((m) => m.type === 1)
    if (!weight) continue
    const kg = weight.value * Math.pow(10, weight.unit)
    out.push({
      date: new Date(grp.date * 1000).toISOString(),
      weightKg: Math.round(kg * 100) / 100,
      source: 'withings',
    })
  }
  return out
}
