/**
 * Microsoft Graph integration helpers.
 *
 * This is the DELEGATED-permissions layer (per-user OAuth) — distinct
 * from the Bot Framework credentials in teams.ts which are a single
 * application identity shared across every tenant the bot is installed
 * in. The two are wired into the same Teams app surface but use
 * SEPARATE Azure AD app registrations (or, optionally, the same one
 * with both Bot + Graph delegated permissions enabled). Either way,
 * the env vars are separate:
 *
 *   MS_BOT_APP_ID + MS_BOT_APP_PASSWORD  — Bot Framework identity
 *   MS_GRAPH_CLIENT_ID + MS_GRAPH_CLIENT_SECRET — Graph delegated OAuth
 *
 * Until MS_GRAPH_CLIENT_ID + MS_GRAPH_CLIENT_SECRET are set in the
 * environment, getGraphConfig() returns null and every public function
 * here either returns null or throws `integration_not_configured`.
 * The OAuth + cron handlers translate that into a 503.
 *
 * The flow:
 *   1. /api/v1/teams/auth/connect  — Clerk-authed; redirects user to
 *      Microsoft's authorize URL with state = signed payload.
 *   2. Microsoft 302s back to /api/v1/teams/auth/callback with code.
 *   3. exchangeCodeForTokens() trades the code for access + refresh.
 *   4. TeamsUserAuth row upserted with encrypted tokens.
 *   5. /api/cron/teams-graph-pull (every 5 min) calls
 *      getValidAccessToken() per row, transparently refreshing if
 *      expired, then runs listCalendarEvents + listSentEmailsWithoutReply
 *      to decide which interrupt class to fire.
 *
 * Token encryption uses the existing AES-256-GCM helper from dexcom.ts
 * (encryptToken / decryptToken) keyed by INTEGRATION_ENCRYPTION_KEY.
 */
import crypto from 'node:crypto'
import { prisma } from '@repo/database'

import { encryptToken, decryptToken, getEncryptionKey } from './dexcom'

export const MS_GRAPH_AUTHORIZE_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
export const MS_GRAPH_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'
export const MS_GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

/**
 * Scopes we request at authorize time. `offline_access` is what
 * unlocks the refresh_token in the response — without it Microsoft
 * returns access-only tokens that die after ~1h and force the user
 * back through consent.
 *
 * The user can downgrade at consent — `scopesGranted` on TeamsUserAuth
 * records what Microsoft actually returned, and the cron skips
 * Mail-dependent interrupt classes if Mail.Read is missing.
 */
export const MS_GRAPH_DEFAULT_SCOPES = [
  'Calendars.Read',
  'Mail.Read',
  'User.Read',
  'offline_access',
] as const

export type GraphConfig = {
  clientId: string
  clientSecret: string
  /** Public redirect URI registered in Azure AD. */
  redirectUri: string
  /** Secret used to HMAC-sign the OAuth state payload (CSRF defense). */
  stateSigningKey: string
}

/**
 * Read Graph delegated-OAuth config from env. Returns null if any
 * required var is missing — callers translate to a 503
 * `integration_not_configured`.
 *
 * `MS_GRAPH_STATE_SIGNING_KEY` is optional; falls back to
 * `CRON_SECRET` if absent (any 32+ byte server secret works — the key
 * is only used to HMAC the {userId, nonce, tenantId} state blob, never
 * to sign tokens or anything sensitive).
 */
export function getGraphConfig(): GraphConfig | null {
  const clientId = process.env.MS_GRAPH_CLIENT_ID
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET
  const redirectUri =
    process.env.MS_GRAPH_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/v1/teams/auth/callback`
      : null)
  const stateSigningKey =
    process.env.MS_GRAPH_STATE_SIGNING_KEY ?? process.env.CRON_SECRET ?? null
  if (!clientId || !clientSecret || !redirectUri || !stateSigningKey) {
    return null
  }
  return { clientId, clientSecret, redirectUri, stateSigningKey }
}

// ────────────────────────────────────────────────────────────────────
// State payload (CSRF defense for the OAuth round-trip)
// ────────────────────────────────────────────────────────────────────

export type GraphOAuthState = {
  userId: string
  nonce: string
  tenantId: string | null
  ts: number
}

/**
 * Sign + base64url-encode a state payload. The callback verifies the
 * HMAC and rejects on mismatch or stale timestamp.
 */
export function encodeSignedState(payload: GraphOAuthState): string | null {
  const config = getGraphConfig()
  if (!config) return null
  const json = JSON.stringify(payload)
  const body = Buffer.from(json, 'utf8').toString('base64url')
  const sig = crypto
    .createHmac('sha256', config.stateSigningKey)
    .update(body)
    .digest('base64url')
  return `${body}.${sig}`
}

/**
 * Verify + decode a signed state token from the OAuth callback.
 * Returns null on any tamper / decode / staleness failure. The 10-min
 * staleness window matches Azure AD's own short-lived auth-code TTL.
 */
export function decodeSignedState(raw: string | null): GraphOAuthState | null {
  if (!raw) return null
  const config = getGraphConfig()
  if (!config) return null
  const parts = raw.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts as [string, string]
  const expected = crypto
    .createHmac('sha256', config.stateSigningKey)
    .update(body)
    .digest('base64url')
  // constant-time compare; Buffer lengths may diverge on tamper
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null
  let parsed: GraphOAuthState
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8')
    parsed = JSON.parse(json) as GraphOAuthState
  } catch {
    return null
  }
  if (
    typeof parsed.userId !== 'string' ||
    typeof parsed.nonce !== 'string' ||
    typeof parsed.ts !== 'number'
  ) {
    return null
  }
  // 10-min staleness window
  if (Math.abs(Date.now() - parsed.ts) > 10 * 60 * 1000) return null
  return parsed
}

// ────────────────────────────────────────────────────────────────────
// OAuth URL + token-exchange
// ────────────────────────────────────────────────────────────────────

/**
 * Build the Microsoft authorize URL. tenantId is informational only —
 * the authorize endpoint is the `/common/` multi-tenant one so any
 * Azure AD identity can sign in; the actual tenant is locked in at
 * consent time and returned in the id_token / token response.
 */
export function buildAuthorizeUrl(
  userId: string,
  tenantId: string | null,
  scopes: readonly string[] = MS_GRAPH_DEFAULT_SCOPES,
): { url: string; state: string } | null {
  const config = getGraphConfig()
  if (!config) return null
  const state = encodeSignedState({
    userId,
    nonce: crypto.randomBytes(16).toString('hex'),
    tenantId,
    ts: Date.now(),
  })
  if (!state) return null
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    response_mode: 'query',
    scope: scopes.join(' '),
    state,
    // `prompt=select_account` reduces silent-reuse bugs when the user
    // has multiple Microsoft identities cached in the browser.
    prompt: 'select_account',
  })
  return { url: `${MS_GRAPH_AUTHORIZE_URL}?${params.toString()}`, state }
}

export type GraphTokenResponse = {
  token_type: string
  scope: string
  expires_in: number
  ext_expires_in?: number
  access_token: string
  refresh_token?: string
  id_token?: string
}

/**
 * Exchange the authorization code for an access + refresh token pair.
 *
 * The redirect_uri MUST match what was sent on the authorize URL — that
 * value is bound into the auth-code grant and Azure AD rejects
 * mismatches with `invalid_grant`. Pull it from getGraphConfig() so the
 * connect + callback agree.
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<GraphTokenResponse | null> {
  const config = getGraphConfig()
  if (!config) return null
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    scope: MS_GRAPH_DEFAULT_SCOPES.join(' '),
  })
  const res = await fetch(MS_GRAPH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  return (await res.json()) as GraphTokenResponse
}

/**
 * Refresh a Graph access token using the refresh_token grant. Returns
 * null on failure; caller decides whether to drop the TeamsUserAuth
 * row (consent revoked, refresh token expired beyond 90 days, etc.).
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<GraphTokenResponse | null> {
  const config = getGraphConfig()
  if (!config) return null
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: MS_GRAPH_DEFAULT_SCOPES.join(' '),
  })
  const res = await fetch(MS_GRAPH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  return (await res.json()) as GraphTokenResponse
}

/**
 * Persist a token-exchange or refresh result onto the TeamsUserAuth
 * row. Used by both the OAuth callback (initial grant) and
 * getValidAccessToken (silent refresh).
 *
 * Microsoft sometimes omits `refresh_token` on a refresh response when
 * the rolling-refresh-token window hasn't reached its rotation point.
 * In that case we keep the prior refresh token in place — overwriting
 * with undefined would orphan the user permanently.
 */
export async function persistTokens(
  userId: string,
  tenantId: string,
  token: GraphTokenResponse,
  options: { previousRefreshTokenCipher?: string | null } = {},
): Promise<void> {
  if (!getEncryptionKey()) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY missing or invalid')
  }
  const accessCipher = encryptToken(token.access_token)
  // expires_in is seconds-from-now per OAuth 2.0 spec; clamp to a
  // 5-min safety floor so a server clock skew doesn't perma-stale a row.
  const ttlSec = Math.max(60, token.expires_in)
  const expiresAt = new Date(Date.now() + ttlSec * 1000)
  const refreshCipher = token.refresh_token
    ? encryptToken(token.refresh_token)
    : options.previousRefreshTokenCipher
  if (!refreshCipher) {
    // First-grant flow must include a refresh token (we asked for
    // offline_access). If Microsoft didn't return one, treat as a
    // partial-consent failure and bail before persisting an unrefreshable
    // row.
    throw new Error('graph_no_refresh_token')
  }
  const scopesGranted = (token.scope ?? '')
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean)
  await prisma.teamsUserAuth.upsert({
    where: { userId },
    create: {
      userId,
      tenantId,
      accessTokenCipher: accessCipher,
      refreshTokenCipher: refreshCipher,
      tokenExpiresAt: expiresAt,
      scopesGranted,
      lastRefreshedAt: token.refresh_token ? new Date() : null,
    },
    update: {
      tenantId,
      accessTokenCipher: accessCipher,
      refreshTokenCipher: refreshCipher,
      tokenExpiresAt: expiresAt,
      scopesGranted,
      lastRefreshedAt: new Date(),
    },
  })
}

/**
 * Get a usable access token for a given COYL userId, transparently
 * refreshing if expired. Returns null when:
 *   - the user has no TeamsUserAuth row
 *   - Graph isn't configured (returns 503 upstream)
 *   - the refresh attempt failed (user must re-consent)
 */
export async function getValidAccessToken(
  userId: string,
): Promise<{ accessToken: string; tenantId: string; scopes: string[] } | null> {
  const config = getGraphConfig()
  if (!config) return null
  const row = await prisma.teamsUserAuth.findUnique({
    where: { userId },
    select: {
      tenantId: true,
      accessTokenCipher: true,
      refreshTokenCipher: true,
      tokenExpiresAt: true,
      scopesGranted: true,
    },
  })
  if (!row) return null

  // 60-second safety buffer so a token that expires mid-request doesn't
  // 401 on the Graph call.
  const usable = row.tokenExpiresAt.getTime() > Date.now() + 60_000
  if (usable) {
    let accessToken: string
    try {
      accessToken = decryptToken(row.accessTokenCipher)
    } catch {
      return null
    }
    return { accessToken, tenantId: row.tenantId, scopes: row.scopesGranted }
  }

  // Stale — refresh.
  let refreshToken: string
  try {
    refreshToken = decryptToken(row.refreshTokenCipher)
  } catch {
    return null
  }
  const refreshed = await refreshAccessToken(refreshToken)
  if (!refreshed) return null
  await persistTokens(userId, row.tenantId, refreshed, {
    previousRefreshTokenCipher: row.refreshTokenCipher,
  })
  return {
    accessToken: refreshed.access_token,
    tenantId: row.tenantId,
    scopes: (refreshed.scope ?? '').split(' ').filter(Boolean),
  }
}

// ────────────────────────────────────────────────────────────────────
// Graph data helpers — minimal typed wrappers
// ────────────────────────────────────────────────────────────────────

export type GraphCalendarEvent = {
  id: string
  subject: string | null
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  isAllDay?: boolean
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown'
  /** Microsoft's free-text categorization the user / mailbox rules apply. */
  categories?: string[]
  /**
   * Microsoft Graph's "isOnlineMeeting" surface — Teams/Zoom/etc.
   * Currently informational.
   */
  isOnlineMeeting?: boolean
  /** Per-event importance — 'low' | 'normal' | 'high'. */
  importance?: 'low' | 'normal' | 'high'
  organizer?: { emailAddress?: { address?: string; name?: string } }
  attendees?: Array<{
    type?: 'required' | 'optional' | 'resource'
    emailAddress?: { address?: string; name?: string }
  }>
}

/**
 * List the user's calendar events in [fromIso, toIso]. We use the
 * /me/calendarView endpoint (not /me/events) because it expands
 * recurrences into individual instances — required for the focus-block
 * lookahead and density calculations. Caller sorts/filters.
 */
export async function listCalendarEvents(
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<GraphCalendarEvent[]> {
  const token = await getValidAccessToken(userId)
  if (!token) return []
  const params = new URLSearchParams({
    startDateTime: fromIso,
    endDateTime: toIso,
    $top: '100',
    $orderby: 'start/dateTime',
    $select: [
      'id',
      'subject',
      'start',
      'end',
      'isAllDay',
      'showAs',
      'categories',
      'isOnlineMeeting',
      'importance',
      'organizer',
      'attendees',
    ].join(','),
  })
  const url = `${MS_GRAPH_BASE}/me/calendarView?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: 'application/json',
      // Required header for calendarView — tells Graph what timezone
      // to honor in the response start/end fields. UTC keeps downstream
      // math timezone-agnostic.
      Prefer: 'outlook.timezone="UTC"',
    },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { value?: GraphCalendarEvent[] }
  return data.value ?? []
}

export type GraphSentMessage = {
  id: string
  conversationId: string | null
  subject: string | null
  bodyPreview: string | null
  sentDateTime: string
  toRecipients?: Array<{ emailAddress?: { address?: string; name?: string } }>
  ccRecipients?: Array<{ emailAddress?: { address?: string; name?: string } }>
}

/**
 * List sent emails from before `sinceIso` (i.e. "older than N hours")
 * for the Follow-Through Pinger signal. Filters server-side by
 * sentDateTime; the "no reply" check happens client-side because the
 * Graph "has reply" surface requires a per-conversation lookup that
 * blows the rate budget — instead we check whether the conversationId
 * has any inbound message dated after the sent message.
 *
 * Returns the candidate sent messages; the cron does the
 * conversation-reply lookup per recipient.
 */
export async function listSentEmailsWithoutReply(
  userId: string,
  sinceIso: string,
): Promise<GraphSentMessage[]> {
  const token = await getValidAccessToken(userId)
  if (!token) return []
  const params = new URLSearchParams({
    // `lt` = older than `sinceIso` (so a 48h window means
    // sinceIso = now - 48h and we want everything BEFORE that).
    $filter: `sentDateTime lt ${sinceIso}`,
    $top: '50',
    $orderby: 'sentDateTime desc',
    $select: [
      'id',
      'conversationId',
      'subject',
      'bodyPreview',
      'sentDateTime',
      'toRecipients',
      'ccRecipients',
    ].join(','),
  })
  // mailFolders('SentItems') is the canonical sent-mail folder across
  // every Microsoft 365 mailbox; mailFolders('sentitems') (lowercase)
  // also works but Microsoft docs use the CamelCase form.
  const url = `${MS_GRAPH_BASE}/me/mailFolders('SentItems')/messages?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { value?: GraphSentMessage[] }
  return data.value ?? []
}

/**
 * Check whether a conversation has received any inbound (non-sent)
 * message after the given timestamp. Used to filter the
 * Follow-Through Pinger candidate list: if the recipient replied at
 * any point AFTER the sent timestamp, suppress.
 *
 * Returns true on Graph errors (fail-closed for the interrupt — better
 * to miss firing once than to nag someone who already replied).
 */
export async function conversationHasReplyAfter(
  userId: string,
  conversationId: string,
  afterIso: string,
): Promise<boolean> {
  const token = await getValidAccessToken(userId)
  if (!token) return true
  const params = new URLSearchParams({
    $filter: `conversationId eq '${conversationId}' and receivedDateTime gt ${afterIso}`,
    $top: '1',
    $select: 'id',
  })
  const url = `${MS_GRAPH_BASE}/me/messages?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return true // fail-closed
  const data = (await res.json()) as { value?: Array<{ id: string }> }
  return (data.value ?? []).length > 0
}
