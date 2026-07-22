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
  /**
   * Proactive outbound voice call at a danger window ("the app calls you
   * first"). Unlike the push/email classes above, this is opt-IN, not
   * opt-out — an unsolicited phone call is a materially more intrusive
   * interruption than a lock-screen notification, so the default with no
   * explicit choice is OFF. Checked via voiceCallAllowed(), not shouldFire().
   */
  voiceCall?: boolean
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

  return !isInQuietHours(prefs, args.timezone, args.now)
}

/**
 * Proactive voice call gate — the opt-IN counterpart to shouldFire().
 * Returns true only when the user has explicitly turned voiceCall on AND
 * the current local time isn't inside their quiet hours. No env/phone
 * check here — callers (the danger-window cron) verify the user has a
 * phone number and a plan that includes precisionInterrupt separately,
 * since those aren't preference concerns.
 */
export function voiceCallAllowed(args: {
  prefs: unknown
  timezone: string | null
  now?: Date
}): boolean {
  const prefs = parsePrefs(args.prefs)
  if (prefs.voiceCall !== true) return false
  return !isInQuietHours(prefs, args.timezone, args.now)
}

function isInQuietHours(prefs: NotificationPrefs, timezone: string | null, now?: Date): boolean {
  const { quietHoursStart: qs, quietHoursEnd: qe } = prefs
  if (qs == null || qe == null) return false
  if (qs === qe) return false // degenerate — treat as no quiet hours

  // Compute the user's current local hour. Same Intl trick the danger-
  // window-interrupt cron uses, kept consistent so behavior matches.
  const at = now ?? new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone ?? 'UTC',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(at)
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const hour = parseInt(hourStr, 10)

  // Quiet window. If qe > qs the window is single-day (e.g. 22 -> 23
  // means quiet 10pm-11pm). If qe < qs it wraps midnight (22 -> 7 means
  // quiet 10pm-7am).
  if (qe > qs) {
    return hour >= qs && hour < qe
  }
  return hour >= qs || hour < qe
}
