/**
 * Free-tier event taxonomy — single source of truth.
 *
 * The free consumer tier (see docs/strategy/free-consumer-tier.md) is
 * load-bearing for the seed pitch and brand commitment. These events
 * are what makes "10,000 free users, 41% week-4 retention" a defensible
 * number rather than vibes.
 *
 * Schema philosophy:
 *   - One enum-like const = one event. Don't proliferate.
 *   - Properties are tightly typed. No `unknown` payloads.
 *   - Anonymous-by-default. Hashed user id only; no PII in props.
 *   - Server-side capture preferred over client-side for anything
 *     that affects investor metrics. Client tracking is a nice-to-have.
 *
 * Wiring:
 *   - Today: trackFreeTierEvent() in ./track-free-tier.ts is a stub
 *     that writes to server logs. Wire to PostHog/Plausible/Prisma
 *     when the analytics stack is chosen (decision: Month 2 of v3 plan).
 *   - Tomorrow: same call signature; just swap the implementation.
 *   - Schema additions must be backward-compatible (add optional
 *     props, never remove or repurpose existing ones).
 */

/**
 * Event names — discriminated union root. Adding a new event means
 * adding a member here + a payload type below + a case in
 * FreeTierEventPayload.
 */
export const FreeTierEventName = {
  /** User landed on /audit and the quiz mounted. Top-of-funnel signal. */
  AUDIT_STARTED: 'audit.started',
  /** User answered wedge question (Q1 of 3). */
  AUDIT_WEDGE_ANSWERED: 'audit.wedge_answered',
  /** User answered window question (Q2 of 3). */
  AUDIT_WINDOW_ANSWERED: 'audit.window_answered',
  /** User answered script question (Q3 of 3) → archetype resolved. */
  AUDIT_COMPLETED: 'audit.completed',
  /** User shared their archetype card via /i/[code]. */
  AUDIT_SHARED: 'audit.shared',
  /** User signed up to the email list from a free-tier surface. */
  FREE_TIER_SIGNUP: 'free_tier.signup',
  /** Free user opened the iOS app (Month 4-5+; emits from the app, not the web). */
  APP_OPENED: 'app.opened',
  /** Danger window detected — system fired a candidate interrupt. */
  DANGER_WINDOW_DETECTED: 'interrupt.danger_window_detected',
  /** Interrupt actually fired (push delivered + acknowledged or rendered). */
  INTERRUPT_FIRED: 'interrupt.fired',
  /** User's behavior after the interrupt was the desired re-route. */
  INTERRUPT_CHANGED_BEHAVIOR: 'interrupt.changed_behavior',
  /** User reported a slip in the slip-recovery flow. */
  SLIP_REPORTED: 'slip.reported',
  /** User completed same-night recovery after a slip. */
  RECOVERY_COMPLETED: 'recovery.completed',
  /** User hit the kill switch. Trust-contract metric: how often this fires
   *  is the inverse-trust signal we hold ourselves accountable to. */
  KILL_SWITCH_FIRED: 'kill_switch.fired',
} as const

export type FreeTierEventName = typeof FreeTierEventName[keyof typeof FreeTierEventName]

/** Shared properties present on every event. */
export type FreeTierBaseProps = {
  /** SHA-256 of the user's id + a per-deploy salt. Never raw. */
  anonymousUserId: string
  /** ISO-8601 client wall-clock; server stamps its own time separately. */
  clientTimestamp: string
  /** 'web' | 'ios' | 'wear-ios' etc. Identifies the surface. */
  surface: 'web' | 'ios' | 'apple-watch' | 'android' | 'wear-android'
  /** App or web build version for funnel diffing across releases. */
  buildVersion: string
}

/** Per-event payload types — each must satisfy the discriminated union. */
export type FreeTierEventPayload =
  | { name: typeof FreeTierEventName.AUDIT_STARTED; props: FreeTierBaseProps & { referrer: 'organic' | 'reddit' | 'press' | 'partner' | 'direct' | 'other' } }
  | { name: typeof FreeTierEventName.AUDIT_WEDGE_ANSWERED; props: FreeTierBaseProps & { wedge: 'weight' | 'work' | 'destructive' | 'consistency' | 'spending' | 'focus' } }
  | { name: typeof FreeTierEventName.AUDIT_WINDOW_ANSWERED; props: FreeTierBaseProps & { window: 'morning' | 'midday' | 'evening' | 'late_night' } }
  | { name: typeof FreeTierEventName.AUDIT_COMPLETED; props: FreeTierBaseProps & { familySlug: string; specificSlug: string; completionMs: number } }
  | { name: typeof FreeTierEventName.AUDIT_SHARED; props: FreeTierBaseProps & { channel: 'twitter' | 'linkedin' | 'imessage' | 'copy_link' | 'other' } }
  | { name: typeof FreeTierEventName.FREE_TIER_SIGNUP; props: FreeTierBaseProps & { source: 'audit_result' | 'home' | 'rebound' | 'free_page' | 'other' } }
  | { name: typeof FreeTierEventName.APP_OPENED; props: FreeTierBaseProps & { sessionNumber: number } }
  | { name: typeof FreeTierEventName.DANGER_WINDOW_DETECTED; props: FreeTierBaseProps & { archetypeSlug: string; windowLabel: string; confidence: number } }
  | { name: typeof FreeTierEventName.INTERRUPT_FIRED; props: FreeTierBaseProps & { interruptId: string; archetypeSlug: string; latencyMs: number } }
  | { name: typeof FreeTierEventName.INTERRUPT_CHANGED_BEHAVIOR; props: FreeTierBaseProps & { interruptId: string; userReportedOutcome: 'changed' | 'no_change' | 'partial' } }
  | { name: typeof FreeTierEventName.SLIP_REPORTED; props: FreeTierBaseProps & { archetypeSlug: string } }
  | { name: typeof FreeTierEventName.RECOVERY_COMPLETED; props: FreeTierBaseProps & { archetypeSlug: string; minutesFromSlip: number } }
  | { name: typeof FreeTierEventName.KILL_SWITCH_FIRED; props: FreeTierBaseProps }

/**
 * Aggregate metric names — what the admin dashboard surfaces. These
 * derive from the events above. Keeping the metric name set explicit
 * so the seed deck and the admin UI don't drift.
 */
export const FreeTierMetric = {
  WEEKLY_ACTIVE_FREE_USERS: 'weekly_active_free_users',
  TOTAL_QUIZZES_COMPLETED: 'total_quizzes_completed',
  WEEK_4_RETENTION_PCT: 'week_4_retention_pct',
  WEEK_12_RETENTION_PCT: 'week_12_retention_pct',
  DANGER_WINDOWS_DETECTED_PER_USER_PER_WEEK: 'danger_windows_detected_per_user_per_week',
  INTERCEPT_RATE_PCT: 'intercept_rate_pct',
  AVG_INTERRUPT_LATENCY_MS: 'avg_interrupt_latency_ms',
  KILL_SWITCH_FIRE_RATE_PCT: 'kill_switch_fire_rate_pct',
  FREE_TO_PARTNER_CONVERSION_PCT: 'free_to_partner_conversion_pct',
} as const

export type FreeTierMetric = typeof FreeTierMetric[keyof typeof FreeTierMetric]

/**
 * Target values per metric. These are the numbers we tell the board
 * and the seed investors we are aiming at. Surface them next to actuals
 * in the admin UI so misses are visible.
 */
export const FREE_TIER_METRIC_TARGETS: Record<FreeTierMetric, { target: number; unit: string; rationale: string }> = {
  [FreeTierMetric.WEEKLY_ACTIVE_FREE_USERS]: {
    target: 5000,
    unit: 'users',
    rationale: 'Cap on initial free tier infra spend; lifts when B2B revenue funds it.',
  },
  [FreeTierMetric.TOTAL_QUIZZES_COMPLETED]: {
    target: 10000,
    unit: 'completions',
    rationale: 'Month 6 seed-pitch headline metric. 10K completions = credible engagement story.',
  },
  [FreeTierMetric.WEEK_4_RETENTION_PCT]: {
    target: 40,
    unit: '%',
    rationale: 'Above the 30% bar for behavioral apps; below the 60%+ of clinical-grade DTx.',
  },
  [FreeTierMetric.WEEK_12_RETENTION_PCT]: {
    target: 25,
    unit: '%',
    rationale: 'The RCT primary endpoint window. 25%+ at 12 weeks = clinically defensible.',
  },
  [FreeTierMetric.DANGER_WINDOWS_DETECTED_PER_USER_PER_WEEK]: {
    target: 27,
    unit: 'detections',
    rationale: 'Founder essay reference number. ~4/day for the average GLP-1 patient in the 8-12 PM window.',
  },
  [FreeTierMetric.INTERCEPT_RATE_PCT]: {
    target: 35,
    unit: '%',
    rationale: 'Internal week-4 target. % of detected windows where the user reports changed behavior post-interrupt.',
  },
  [FreeTierMetric.AVG_INTERRUPT_LATENCY_MS]: {
    target: 3000,
    unit: 'ms',
    rationale: 'Three seconds. The window where a cued behavior can still be re-routed.',
  },
  [FreeTierMetric.KILL_SWITCH_FIRE_RATE_PCT]: {
    target: 2,
    unit: '%',
    rationale: 'Inverse-trust signal. We hold ourselves accountable to keep this LOW. ≤2% of weekly actives is the ceiling we tolerate.',
  },
  [FreeTierMetric.FREE_TO_PARTNER_CONVERSION_PCT]: {
    target: 12,
    unit: '%',
    rationale: 'Free users whose plan later turns out to cover Rebound (or who refer a clinic that signs). Validates the free-tier-as-pipeline hypothesis.',
  },
}
