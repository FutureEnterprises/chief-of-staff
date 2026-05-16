/**
 * Notification preferences — shared parsing + policy helpers.
 *
 * The User.notificationPrefs JSON column is freeform by design so adding
 * a new interrupt class (SMS, accountability partner ping, etc.) doesn't
 * require a migration. The shape is enforced here, not in the schema.
 *
 * Default policy when notificationPrefs is null or missing a key: ALLOW.
 * Users who never touched Settings get every interrupt — that's the
 * product contract from /pricing and the onboarding precision-interrupt
 * opt-in. Explicit opt-out is the only path to silence.
 */

export type InterruptType = 'dangerWindow' | 'glp1Day3' | 'postSlip'

export interface NotificationPrefs {
  dangerWindow?: boolean
  glp1Day3?: boolean
  postSlip?: boolean
  /** Inclusive start hour (0-23) in user's local timezone. */
  quietHoursStart?: number | null
  /** Exclusive end hour (0-23) in user's local timezone. May wrap
   *  past midnight if end < start (e.g. start=22, end=7 → 10pm–7am). */
  quietHoursEnd?: number | null
}

export function parsePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object') return {}
  return raw as NotificationPrefs
}

export const DEFAULT_PREFS: Required<Pick<NotificationPrefs, 'dangerWindow' | 'glp1Day3' | 'postSlip'>> & NotificationPrefs = {
  dangerWindow: true,
  glp1Day3: true,
  postSlip: true,
  quietHoursStart: null,
  quietHoursEnd: null,
}

/**
 * Should we send this interrupt class to this user right now?
 *
 * Two gates:
 *   1. Per-class opt-out (notificationPrefs.<type> === false)
 *   2. Quiet hours — if the user's local hour falls inside the configured
 *      window, suppress everything. Quiet hours can wrap midnight.
 *
 * The function is pure — caller passes the current Date and the user's
 * timezone. Crons should already have these computed for window matching;
 * adding the quiet-hour check is ~5 lines and free.
 */
export function shouldFire(args: {
  type: InterruptType
  prefs: unknown
  timezone: string | null
  now?: Date
}): boolean {
  const prefs = parsePrefs(args.prefs)
  if (prefs[args.type] === false) return false

  const { quietHoursStart: qs, quietHoursEnd: qe } = prefs
  if (qs == null || qe == null) return true
  if (qs === qe) return true // degenerate — treat as no quiet hours

  // Compute the user's current local hour. Same Intl trick the danger-
  // window-interrupt cron uses, kept consistent so behavior matches.
  const now = args.now ?? new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: args.timezone ?? 'UTC',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const hour = parseInt(hourStr, 10)

  // Quiet window. If qe > qs the window is single-day (e.g. 22 -> 23
  // means quiet 10pm-11pm). If qe < qs it wraps midnight (22 -> 7 means
  // quiet 10pm-7am).
  if (qe > qs) {
    return !(hour >= qs && hour < qe)
  }
  return !(hour >= qs || hour < qe)
}
