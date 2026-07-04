/**
 * Anonymous audit-funnel session — the funnel-join key for
 * AuditFunnelEvent (started → completed → shared → waitlist_joined)
 * so the admin dashboard can compute step-to-step conversion and
 * sharer→recipient K-factor without a userId.
 *
 * Extracted from audit-view.tsx so share surfaces (/a, /card, /i)
 * can join the same session instead of inventing constant per-slug
 * ids (which collapse distinct-session math).
 *
 * Cookie lives 24h, path=/, SameSite=Lax. Client-only — both helpers
 * return '' during SSR.
 */

const AUDIT_SESSION_COOKIE = 'coyl_audit_sid'
const AUDIT_SESSION_TTL_HOURS = 24

export function getOrCreateAuditSession(): string {
  if (typeof document === 'undefined') return ''
  const existing = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${AUDIT_SESSION_COOKIE}=`))
    ?.split('=')[1]
  if (existing) return existing
  const fresh =
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)) + Date.now().toString(36)
  const maxAge = AUDIT_SESSION_TTL_HOURS * 60 * 60
  document.cookie = `${AUDIT_SESSION_COOKIE}=${fresh}; max-age=${maxAge}; path=/; SameSite=Lax`
  return fresh
}

/** Read-only sibling — for components that need the session id
 *  without retriggering the create flow. */
export function readAuditSession(): string {
  if (typeof document === 'undefined') return ''
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${AUDIT_SESSION_COOKIE}=`))
      ?.split('=')[1] ?? ''
  )
}

/**
 * Fire-and-forget owned-telemetry beacon → /api/v1/audit/event.
 * Swallows every error: telemetry must never break a share surface.
 * (audit-view.tsx keeps its own dual-fire variant that also maps
 * events into PostHog names — this one is for the share islands.)
 */
export function fireAuditBeacon(payload: {
  sessionId: string
  kind:
    | 'landed'
    | 'started'
    | 'completed'
    | 'email_captured'
    | 'signup_started'
    | 'shared'
    | 'waitlist_joined'
    | 'waitlist_referral_joined'
  archetypeFamily?: string
  archetypeSlug?: string
  source?: string
}): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify(payload)
  try {
    if ('sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/v1/audit/event', blob)
    } else {
      void fetch('/api/v1/audit/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* swallow */
  }
}
