import crypto from 'node:crypto'

/**
 * Dexcom CGM integration helpers.
 *
 * OAuth flow + EGV (estimated glucose value) polling. Dexcom doesn't push
 * real-time webhooks, so we poll /v3/users/self/egvs every ~15 min via cron
 * (cron entry added by main thread, not this commit).
 *
 * Token + reading persistence lives on ProductivityEvent — see
 * spec for the FEATURE_USED + metadataJson convention.
 */

export const DEXCOM_AUTH_URL = 'https://api.dexcom.com/v2/oauth2/login'
export const DEXCOM_TOKEN_URL = 'https://api.dexcom.com/v2/oauth2/token'
export const DEXCOM_EGV_URL = 'https://api.dexcom.com/v3/users/self/egvs'

export type DexcomConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

/**
 * Read Dexcom config from env. Returns null if any required var is
 * missing — callers translate to a 503 `integration_not_configured`.
 */
export function getDexcomConfig(): DexcomConfig | null {
  const clientId = process.env.DEXCOM_CLIENT_ID
  const clientSecret = process.env.DEXCOM_CLIENT_SECRET
  const redirectUri = process.env.DEXCOM_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

/**
 * AES-256-GCM encryption for OAuth tokens at rest.
 * Key comes from INTEGRATION_ENCRYPTION_KEY (32-byte base64).
 * v0.1 — no KMS yet; rotate by re-prompting OAuth on key change.
 */
export function getEncryptionKey(): Buffer | null {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!raw) return null
  try {
    const key = Buffer.from(raw, 'base64')
    if (key.length !== 32) return null
    return key
  } catch {
    return null
  }
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  if (!key) throw new Error('INTEGRATION_ENCRYPTION_KEY missing or invalid')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${encrypted.toString('base64')}.${authTag.toString('base64')}`
}

export function decryptToken(payload: string): string {
  const key = getEncryptionKey()
  if (!key) throw new Error('INTEGRATION_ENCRYPTION_KEY missing or invalid')
  const [ivB64, dataB64, tagB64] = payload.split('.')
  if (!ivB64 || !dataB64 || !tagB64) throw new Error('Malformed ciphertext')
  const authTag = Buffer.from(tagB64, 'base64')
  // GCM auth tag must be exactly 16 bytes — reject anything shorter to prevent
  // forgery attacks via truncated tags (CWE-310).
  if (authTag.length !== 16) throw new Error('Invalid auth tag length')
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivB64, 'base64'),
    { authTagLength: 16 },
  )
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

/**
 * Build the Dexcom authorize URL for the user's OAuth redirect.
 */
export function buildDexcomAuthorizeUrl(state: string): string | null {
  const config = getDexcomConfig()
  if (!config) return null
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'offline_access',
    state,
  })
  return `${DEXCOM_AUTH_URL}?${params.toString()}`
}

export type DexcomTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/**
 * Exchange authorization code for an access token.
 */
export async function exchangeDexcomCode(
  code: string,
): Promise<DexcomTokenResponse | null> {
  const config = getDexcomConfig()
  if (!config) return null
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  })
  const res = await fetch(DEXCOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  return (await res.json()) as DexcomTokenResponse
}

export type DexcomEgvReading = {
  systemTime: string
  displayTime: string
  value: number // mg/dL
  trend?: string
  trendRate?: number | null
}

/**
 * Fetch the most recent glucose readings for a given access token.
 * Window defaults to the last 60 min — the poller calls this every 15 min.
 */
export async function fetchDexcomEgvs(
  accessToken: string,
  startDate?: string,
  endDate?: string,
): Promise<DexcomEgvReading[]> {
  const end = endDate ?? new Date().toISOString()
  const start = startDate ?? new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const url = `${DEXCOM_EGV_URL}?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { records?: DexcomEgvReading[] }
  return data.records ?? []
}
