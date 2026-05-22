/**
 * Google & Microsoft calendar integration helpers.
 *
 * Both providers expose OAuth 2.0 + a list-events endpoint. We pull events
 * for the next 7 days and aggregate to (count, durationMinutes, density).
 * We never read titles, attendees, or descriptions — only counts + windows.
 */

export { encryptToken, decryptToken, getEncryptionKey } from './dexcom'

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GOOGLE_EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export const MS_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
export const MS_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'
export const MS_EVENTS_URL = 'https://graph.microsoft.com/v1.0/me/calendarView'

export type CalendarConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getGoogleCalendarConfig(): CalendarConfig | null {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function getMicrosoftCalendarConfig(): CalendarConfig | null {
  const clientId = process.env.MS_CALENDAR_CLIENT_ID
  const clientSecret = process.env.MS_CALENDAR_CLIENT_SECRET
  const redirectUri = process.env.MS_CALENDAR_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function buildGoogleCalendarAuthorizeUrl(state: string): string | null {
  const config = getGoogleCalendarConfig()
  if (!config) return null
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export function buildMicrosoftCalendarAuthorizeUrl(state: string): string | null {
  const config = getMicrosoftCalendarConfig()
  if (!config) return null
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'offline_access Calendars.Read',
    response_mode: 'query',
    state,
  })
  return `${MS_AUTH_URL}?${params.toString()}`
}

export type OAuthTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

export async function exchangeGoogleCalendarCode(
  code: string,
): Promise<OAuthTokenResponse | null> {
  const config = getGoogleCalendarConfig()
  if (!config) return null
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  return (await res.json()) as OAuthTokenResponse
}

export async function exchangeMicrosoftCalendarCode(
  code: string,
): Promise<OAuthTokenResponse | null> {
  const config = getMicrosoftCalendarConfig()
  if (!config) return null
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    scope: 'offline_access Calendars.Read',
  })
  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  return (await res.json()) as OAuthTokenResponse
}

export type CalendarEventSummary = {
  start: string
  end: string
  durationMinutes: number
}

export type CalendarDayAggregate = {
  date: string // ISO date (YYYY-MM-DD)
  eventCount: number
  busyMinutes: number
  density: 'light' | 'moderate' | 'heavy' | 'punishing'
}

function inferDensity(busyMinutes: number): CalendarDayAggregate['density'] {
  if (busyMinutes > 360) return 'punishing'
  if (busyMinutes > 240) return 'heavy'
  if (busyMinutes > 120) return 'moderate'
  return 'light'
}

/**
 * Aggregate raw event windows by ISO date. Privacy-preserving — only
 * counts and durations cross the boundary, never titles/attendees.
 */
export function aggregateByDay(events: CalendarEventSummary[]): CalendarDayAggregate[] {
  const buckets = new Map<string, { count: number; minutes: number }>()
  for (const ev of events) {
    const date = ev.start.slice(0, 10)
    const existing = buckets.get(date) ?? { count: 0, minutes: 0 }
    existing.count += 1
    existing.minutes += ev.durationMinutes
    buckets.set(date, existing)
  }
  return [...buckets.entries()].map(([date, agg]) => ({
    date,
    eventCount: agg.count,
    busyMinutes: agg.minutes,
    density: inferDensity(agg.minutes),
  }))
}

/**
 * Fetch the next 7 days of Google Calendar events as count+duration only.
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
): Promise<CalendarEventSummary[]> {
  const now = new Date()
  const max = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const url = `${GOOGLE_EVENTS_URL}?timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(max.toISOString())}&singleEvents=true&maxResults=250`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) return []
  const data = (await res.json()) as {
    items?: Array<{
      start?: { dateTime?: string; date?: string }
      end?: { dateTime?: string; date?: string }
    }>
  }
  const out: CalendarEventSummary[] = []
  for (const ev of data.items ?? []) {
    const start = ev.start?.dateTime ?? ev.start?.date
    const end = ev.end?.dateTime ?? ev.end?.date
    if (!start || !end) continue
    const durationMinutes = Math.max(
      0,
      Math.round((Date.parse(end) - Date.parse(start)) / 60000),
    )
    out.push({ start, end, durationMinutes })
  }
  return out
}

/**
 * Fetch the next 7 days of Microsoft Graph calendar view as count+duration.
 */
export async function fetchMicrosoftCalendarEvents(
  accessToken: string,
): Promise<CalendarEventSummary[]> {
  const now = new Date()
  const max = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const url = `${MS_EVENTS_URL}?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(max.toISOString())}&$top=250`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) return []
  const data = (await res.json()) as {
    value?: Array<{
      start?: { dateTime?: string }
      end?: { dateTime?: string }
    }>
  }
  const out: CalendarEventSummary[] = []
  for (const ev of data.value ?? []) {
    const start = ev.start?.dateTime
    const end = ev.end?.dateTime
    if (!start || !end) continue
    const durationMinutes = Math.max(
      0,
      Math.round((Date.parse(end) - Date.parse(start)) / 60000),
    )
    out.push({ start, end, durationMinutes })
  }
  return out
}
