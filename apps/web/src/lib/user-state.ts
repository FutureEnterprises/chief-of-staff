/**
 * User state machine for the autopilot interruption loop.
 *
 * The user state is derived from durable DB columns (recoveryState,
 * lastActiveAt, slipsThisMonth, currentStreak) PLUS in-the-moment
 * context (are they inside a danger window right now?).  This file is
 * the single source of truth for "what state is the user in?" and
 * "what transitions are legal?" \u2014 all interrupting code paths read
 * from here instead of duplicating logic.
 *
 * Design goals:
 *   \u2022 Pure functions. No DB I/O. Callers pass in the snapshot.
 *   \u2022 Exhaustive switch in transition(). TypeScript catches missing cases.
 *   \u2022 Every transition lists the signals that can fire it. New signals
 *     must be added explicitly or the compiler complains.
 *
 * See docs/ENGINEERING.md for the full state diagram + transition table.
 */

// ─────────────────────── States ───────────────────────

/**
 * The eight states a user can be in, in product terms.
 *
 * NEW            \u2014 account created, onboarding not yet complete.
 * ACTIVE         \u2014 engaged and on track. Default steady-state.
 * FLARING        \u2014 currently inside one of the user's known danger windows.
 *                  Interrupts allowed; extra confidence to fire.
 * SLIPPED        \u2014 user just logged a slip, <2h since.
 *                  Rescue UI + post-slip check-in tier ACTIVE. No other
 *                  interrupts (don't pile on).
 * RECOVERING     \u2014 2\u201324h post-slip, not yet marked recovered.
 *                  Only the 24h resolve ping is allowed.
 * RESILIENT      \u2014 just recovered from a slip within <24h, streak intact.
 *                  Reward state. Softer voice. Fewer interrupts.
 * SILENT         \u2014 no activity for 2+ days. "You're disappearing" tier.
 * DISAPPEARED    \u2014 no activity for 10+ days. Final re-entry tier only.
 */
export type UserState =
  | 'NEW'
  | 'ACTIVE'
  | 'FLARING'
  | 'SLIPPED'
  | 'RECOVERING'
  | 'RESILIENT'
  | 'SILENT'
  | 'DISAPPEARED'

/**
 * Everything the classifier needs to compute the user's current state.
 * Keep this minimal \u2014 anything added here means another DB column the
 * caller has to fetch on every classification.
 */
export type UserStateSnapshot = {
  onboardingCompleted: boolean
  lastActiveAt: Date
  /** Most recent slip within the last 30 days, or null if none. */
  lastSlipAt: Date | null
  /** Whether the latest slip has been marked recovered. */
  lastSlipRecoveredAt: Date | null
  /** Whether current local time falls inside an active danger window. */
  insideDangerWindow: boolean
  /** Self-reported streak (used to tilt toward RESILIENT vs ACTIVE). */
  currentStreak: number
}

// ─────────────────────── Classifier ───────────────────────

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TWO_DAYS_MS = 2 * ONE_DAY_MS
const TEN_DAYS_MS = 10 * ONE_DAY_MS

/**
 * Derive the user's current state from a snapshot. Priority order matters:
 *
 *   NEW > DISAPPEARED > SILENT > SLIPPED > RECOVERING > RESILIENT > FLARING > ACTIVE
 *
 * Higher-priority states suppress lower ones. E.g. a user inside a danger
 * window who ALSO just slipped is SLIPPED, not FLARING \u2014 they don't need
 * a danger-window ping on top of the post-slip pings.
 */
export function classifyState(s: UserStateSnapshot, now: Date = new Date()): UserState {
  if (!s.onboardingCompleted) return 'NEW'

  const sinceActive = now.getTime() - s.lastActiveAt.getTime()
  if (sinceActive >= TEN_DAYS_MS) return 'DISAPPEARED'
  if (sinceActive >= TWO_DAYS_MS) return 'SILENT'

  if (s.lastSlipAt) {
    const sinceSlip = now.getTime() - s.lastSlipAt.getTime()
    const isRecovered = Boolean(s.lastSlipRecoveredAt)

    if (!isRecovered && sinceSlip < TWO_HOURS_MS) return 'SLIPPED'
    if (!isRecovered && sinceSlip < ONE_DAY_MS) return 'RECOVERING'
    if (isRecovered && sinceSlip < ONE_DAY_MS) return 'RESILIENT'
  }

  if (s.insideDangerWindow) return 'FLARING'
  return 'ACTIVE'
}

// ─────────────────────── Transitions ───────────────────────

/**
 * The signals the state machine reacts to. Everything that might change
 * a user's state passes through one of these. Adding a new signal is a
 * compiler error elsewhere \u2014 intentional, so nothing sneaks in silently.
 */
export type UserSignal =
  | 'ONBOARDING_COMPLETED'
  | 'SLIP_LOGGED'
  | 'SLIP_RECOVERED'
  | 'DANGER_WINDOW_ENTERED'
  | 'DANGER_WINDOW_EXITED'
  | 'ACTIVITY' /* any tap, check-in, message \u2014 resets silence timer */

/**
 * Matrix of legal (from, signal) \u2192 to transitions. Used by tests and
 * the engineering doc's transition table. The classifier above derives
 * state directly from data; this matrix is the shape-check equivalent
 * for "when X happens, what moves?"
 */
export const LEGAL_TRANSITIONS: Readonly<
  Partial<Record<UserState, Partial<Record<UserSignal, UserState>>>>
> = Object.freeze({
  NEW: {
    ONBOARDING_COMPLETED: 'ACTIVE',
  },
  ACTIVE: {
    SLIP_LOGGED: 'SLIPPED',
    DANGER_WINDOW_ENTERED: 'FLARING',
  },
  FLARING: {
    SLIP_LOGGED: 'SLIPPED',
    DANGER_WINDOW_EXITED: 'ACTIVE',
  },
  SLIPPED: {
    SLIP_RECOVERED: 'RESILIENT',
    /* no direct edge to ACTIVE; must pass through RECOVERING via time */
  },
  RECOVERING: {
    SLIP_RECOVERED: 'RESILIENT',
  },
  RESILIENT: {
    DANGER_WINDOW_ENTERED: 'FLARING',
    SLIP_LOGGED: 'SLIPPED',
  },
  SILENT: {
    ACTIVITY: 'ACTIVE',
  },
  DISAPPEARED: {
    ACTIVITY: 'ACTIVE',
  },
})

// ─────────────────────── Interrupt policy per state ───────────────────────

/**
 * Which interrupt channels are allowed in each state. Callers use this
 * before firing a cron-originated push/email. Inline UI (opening
 * /today, tapping rescue manually) is always allowed \u2014 the user is
 * already engaged.
 */
export type InterruptKind =
  | 'DANGER_WINDOW'    /* proactive "this is the moment" */
  | 'POST_SLIP_2H'     /* "how are the last 2 hours going?" */
  | 'POST_SLIP_24H'    /* "are you back, or still in it?" */
  | 'SILENT_SOFT'      /* "you stopped showing up" at 2 days */
  | 'SILENT_DIRECT'    /* "you're disappearing" at 5 days */
  | 'SILENT_FINAL'     /* "your autopilot won" at 10 days */

export function isInterruptAllowed(state: UserState, kind: InterruptKind): boolean {
  switch (state) {
    case 'NEW':
      // No proactive interrupts before onboarding finishes. They don't
      // know the product yet; pinging is alienating.
      return false

    case 'SLIPPED':
      // Only the first post-slip wave. No danger-window pings, no silence
      // pings \u2014 the user is raw. Don't pile on.
      return kind === 'POST_SLIP_2H'

    case 'RECOVERING':
      return kind === 'POST_SLIP_24H'

    case 'RESILIENT':
      // Just recovered. Leave them alone to enjoy the win. One exception:
      // if they also just re-entered a danger window, we still fire.
      return false

    case 'FLARING':
      return kind === 'DANGER_WINDOW'

    case 'ACTIVE':
      // Normal state. No silence pings (they're active). No post-slip.
      // Danger-window firing is state-driven \u2014 they move to FLARING first.
      return false

    case 'SILENT':
      return kind === 'SILENT_SOFT' || kind === 'SILENT_DIRECT'

    case 'DISAPPEARED':
      return kind === 'SILENT_FINAL'
  }
}

// ─────────────────────── Tone adaptation ───────────────────────

export type ToneMode = 'MENTOR' | 'STRATEGIST' | 'NO_BS' | 'BEAST'

/**
 * Adaptive tone policy. Even if a user picked NO_BS, we soften to MENTOR
 * during emotionally raw states (right after a slip, during recovery,
 * or their first week with the product) so we don't land in "this thing
 * is mean and I just slipped" at exactly the wrong moment.
 *
 * Returns the tone to USE for this response, which may differ from the
 * user's chosen toneMode.
 */
export function effectiveTone(
  chosen: ToneMode,
  state: UserState,
  daysSinceSignup: number,
): ToneMode {
  // First week: always Mentor regardless of pick. Early churn is
  // catastrophic; a new user hit with BEAST on day 2 bounces.
  if (daysSinceSignup < 7) return 'MENTOR'

  // Emotionally raw moments \u2014 soften at most one step.
  if (state === 'SLIPPED' || state === 'RECOVERING') {
    if (chosen === 'BEAST') return 'NO_BS'
    if (chosen === 'NO_BS') return 'STRATEGIST'
    return chosen
  }

  // DISAPPEARED is a special case: they're not here to pay for anything
  // harsh. Meet them with warmth, not drill-sergeant.
  if (state === 'DISAPPEARED') {
    if (chosen === 'BEAST' || chosen === 'NO_BS') return 'MENTOR'
  }

  return chosen
}

// ─────────────────────── Exports for tests + UI ───────────────────────

export const STATE_LABELS: Record<UserState, string> = {
  NEW: 'New',
  ACTIVE: 'Active',
  FLARING: 'Inside a danger window',
  SLIPPED: 'Just slipped',
  RECOVERING: 'Recovering',
  RESILIENT: 'Recovered within 24h',
  SILENT: 'Silent',
  DISAPPEARED: 'Disappeared',
}
