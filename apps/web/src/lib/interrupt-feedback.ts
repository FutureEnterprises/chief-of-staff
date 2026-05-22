/**
 * Inferred interrupt feedback — behavioral judgment of an interrupt firing.
 *
 * Today the user has to manually tap "caught me" or "wrong time" on every
 * interrupt to give the model a judgment signal. ~70% of interrupts get
 * no tag. This module infers the tag from observed behavior in the 30
 * minutes after the interrupt:
 *
 *   • Did the user log a slip in the window? → 'ignored' (the interrupt
 *     fired, the user slipped anyway).
 *   • No slip + the danger window the interrupt fired inside has now
 *     ended? → 'caught_me' (interrupt landed, user got through clean).
 *   • No slip but the original window is still active? → 'defer'
 *     (wait for the window to close before we can score this).
 *
 * Manual user tags always win — callers must skip any interrupt that
 * already has `metadataJson.feedback` set (whether user-set or
 * previously inferred).
 */

export type InferredFeedback = 'caught_me' | 'ignored' | 'defer'

/**
 * Minimal DangerWindow shape needed for the still-active check. Mirrors
 * the matching rule used by the danger-window-interrupt cron:
 * dayOfWeek === -1 means all days, otherwise must match the user's
 * current weekday in their timezone; hour must be inside [start, end).
 */
export type DangerWindowMatcher = {
  id: string
  dayOfWeek: number
  startHour: number
  endHour: number
  active: boolean
}

export type InferInput = {
  /** When the AUTOPILOT_INTERRUPTED event was created. */
  interruptCreatedAt: Date
  /** First slip the user logged in [interruptCreatedAt, +30 min], if any. */
  slipInWindow: { id: string; createdAt: Date } | null
  /**
   * The DangerWindow this interrupt fired inside, if the interrupt's
   * metadataJson included a windowId we could resolve. Null when the
   * interrupt was a non-danger-window kind, or the window has been
   * deleted, or the metadata didn't carry a windowId.
   */
  originatingWindow: DangerWindowMatcher | null
  /** User's IANA timezone — same field the firing cron uses. */
  timezone: string | null | undefined
  /** "Now" — the cron's wall-clock at decision time. */
  now: Date
}

/**
 * Pure inference. No DB writes — caller persists the result.
 *
 * Decision table:
 *
 *   slip in 30-min window?   originating window still active?   →
 *   ──────────────────────   ──────────────────────────────     ─────
 *   yes                      (any)                              ignored
 *   no                       no (or no window known)            caught_me
 *   no                       yes                                defer
 */
export function inferInterruptFeedback(input: InferInput): InferredFeedback {
  if (input.slipInWindow) return 'ignored'

  // If we can't resolve a danger window (non-DW interrupt kind, or window
  // deleted), there's nothing to wait for — score it as caught_me. The
  // cron only considers interrupts ≥30 min old, so "the moment" has
  // already passed even without a window to align to.
  if (!input.originatingWindow) return 'caught_me'

  if (isWindowActiveNow(input.originatingWindow, input.timezone, input.now)) {
    return 'defer'
  }
  return 'caught_me'
}

/**
 * Mirror of the day/hour matching used by danger-window-interrupt.
 * Inactive windows are never considered active (user may have edited
 * their map between fire and inference).
 */
function isWindowActiveNow(
  window: DangerWindowMatcher,
  timezone: string | null | undefined,
  now: Date,
): boolean {
  if (!window.active) return false

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone ?? 'UTC',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const currentDay = dayMap[weekdayStr] ?? 0
  const currentHour = parseInt(hourStr, 10)

  const dayMatches = window.dayOfWeek === -1 || window.dayOfWeek === currentDay
  if (!dayMatches) return false
  return currentHour >= window.startHour && currentHour < window.endHour
}
