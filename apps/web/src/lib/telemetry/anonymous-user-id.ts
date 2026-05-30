/**
 * Anonymous user id — stable per browser/device, never PII.
 *
 * Used as the `distinctId` for PostHog and the `anonymousUserId`
 * column on ClinicalEvent and AuditFunnelEvent. The promise this
 * module makes:
 *
 *   1. Stable across page navigations within a browser session.
 *   2. Stable across sessions for the same browser (localStorage).
 *   3. Never derived from PII. Never the user's email, name, or
 *      authenticated user id in raw form.
 *   4. Authenticated users get a HASH of their user id + per-deploy
 *      salt — so PostHog and the admin dashboard can join across
 *      surfaces without seeing the raw id.
 *   5. SSR-safe — never throws on the server.
 *
 * Why not just `crypto.randomUUID()` on first visit + localStorage?
 *   It's exactly what we do for unauthenticated browsers. For
 *   AUTHENTICATED users, we want the SAME id across browsers (so the
 *   same person on phone + laptop is one funnel), which random UUIDs
 *   in localStorage don't give us. The hash of (user.id + salt)
 *   handles that case.
 */

const STORAGE_KEY = 'coyl_anon_id'

/**
 * Browser-side: read or lazily generate the anonymous id.
 * Returns null on the server. Callers MUST handle null.
 */
export function getOrCreateAnonymousUserIdClient(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null
  }
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    // localStorage can throw in incognito-Safari + some sandboxed iframes.
    // In that case telemetry just doesn't fire — we never break the page.
    return null
  }
}

/**
 * Server-side: hash an authenticated user id with the per-deploy salt.
 * Salt MUST be set as TELEMETRY_HASH_SALT in env. If unset, returns
 * null so callers degrade to anonymous mode rather than emit a
 * predictable hash (which would defeat the point of hashing).
 */
export async function hashAuthenticatedUserId(rawUserId: string): Promise<string | null> {
  const salt = process.env.TELEMETRY_HASH_SALT
  if (!salt || salt.length < 16) return null
  // Web Crypto so this works in Edge runtime too.
  const encoder = new TextEncoder()
  const data = encoder.encode(`${rawUserId}|${salt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
