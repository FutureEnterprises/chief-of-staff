/**
 * Invite-only sign-up gate — OPT-IN, default OFF.
 *
 * When WAITLIST_GATE_ENABLED === 'true', the consumer sign-up entry
 * requires a redeemed invite (the access cookie set by /redeem/[code]).
 * When unset/false, sign-up is fully open — today's behavior, zero
 * change.
 *
 * SAFETY: the gate must never lock out non-consumer onboarding (B2B
 * teams, clinical, partners). It bypasses when ANY of these hold:
 *   - the access cookie is present (came through /redeem)
 *   - a Clerk invitation ticket is on the URL (__clerk_ticket) — org /
 *     team / clinical invites flow through this
 *   - an explicit ?invite= code is present
 *   - ?ref= is in the bypass allowlist (team/clinical/partner/org/wave/
 *     invite, plus anything in WAITLIST_GATE_BYPASS_REFS)
 *
 * Before enabling in prod, confirm your B2B/clinical links carry a Clerk
 * ticket or a bypass ref — otherwise they'd be gated too. The gate is
 * soft FOMO, not an auth boundary (Clerk is the real boundary), so the
 * cookie isn't signed.
 */

/** The access cookie name dropped by /redeem/[code]. */
export const INVITE_COOKIE = 'coyl_invite'

const DEFAULT_BYPASS_REFS = ['team', 'clinical', 'partner', 'org', 'wave', 'invite']

export function isGateEnabled(): boolean {
  return process.env.WAITLIST_GATE_ENABLED === 'true'
}

function bypassRefs(): string[] {
  const extra = (process.env.WAITLIST_GATE_BYPASS_REFS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return [...DEFAULT_BYPASS_REFS, ...extra]
}

type SP = Record<string, string | string[] | undefined>

function first(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return Array.isArray(v) ? v[0] : v
}

/**
 * Decide whether to allow the bare /sign-up entry. Returns true (allow)
 * whenever the gate is off or any bypass condition holds.
 */
export function signupAllowed(args: {
  hasInviteCookie: boolean
  searchParams: SP
}): boolean {
  if (!isGateEnabled()) return true
  if (args.hasInviteCookie) return true

  const sp = args.searchParams
  if (first(sp, '__clerk_ticket')) return true
  if (first(sp, 'invite')) return true

  const ref = (first(sp, 'ref') ?? '').toLowerCase()
  if (ref && bypassRefs().includes(ref)) return true

  return false
}
