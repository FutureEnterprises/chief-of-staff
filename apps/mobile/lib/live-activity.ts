/**
 * Live Activity helpers — the JS-facing surface for COYL's iOS
 * lock-screen widget. Callers (push-receive listener, in-app
 * triggers, etc.) interact through this module instead of touching
 * the native bridge directly so error handling and stub fallbacks
 * stay in one place.
 *
 * Every helper is best-effort: if ActivityKit is unsupported (older
 * iOS, Android, web, Expo Go), if the user disabled Live Activities
 * in Settings, or if a native call throws, we swallow the failure
 * and return null / resolve. A missing lock-screen widget is not a
 * critical failure for the interrupt flow — the push notification
 * itself already runs the show.
 */
import CoylLiveActivity from '../modules/coyl-live-activity'

/** Payload required to start an interrupt Live Activity. */
export interface StartInterruptActivityPayload {
  /** Server-side ProductivityEvent id. */
  interruptId: string
  /** Archetype slug, e.g. "the-9pm-negotiator". */
  archetype: string
  /** Primary headline shown on the lock screen. */
  headline: string
  /** Secondary subhead shown on the lock screen. */
  subhead: string
  /** Seconds remaining until the danger window closes. */
  timeRemainingSec: number
}

/**
 * Materialize a Live Activity on the lock screen for an inbound
 * interrupt push. Returns the OS-assigned activity id (caller stores
 * it to later .update or .end) or null on any failure / unsupported
 * environment.
 *
 * The `startedAtIso` field is generated here rather than passed in
 * because the widget reads it for "elapsed since start" math and
 * "now" is the right anchor at the moment the activity goes live.
 */
export async function startInterruptActivity(
  payload: StartInterruptActivityPayload,
): Promise<string | null> {
  if (!CoylLiveActivity.isSupported()) return null
  try {
    const id = await CoylLiveActivity.start({
      archetype: payload.archetype,
      startedAtIso: new Date().toISOString(),
      headline: payload.headline,
      subhead: payload.subhead,
      timeRemainingSec: payload.timeRemainingSec,
      interruptId: payload.interruptId,
    })
    return id || null
  } catch (err) {
    console.warn('[COYL] startInterruptActivity failed:', err)
    return null
  }
}

/**
 * Update an in-flight Live Activity (countdown tick, headline swap,
 * etc.). Partial — only the changed fields need to be set.
 */
export async function updateInterruptActivity(
  activityId: string,
  state: {
    headline?: string
    subhead?: string
    timeRemainingSec?: number
  },
): Promise<void> {
  if (!CoylLiveActivity.isSupported()) return
  try {
    await CoylLiveActivity.update(activityId, state)
  } catch (err) {
    console.warn('[COYL] updateInterruptActivity failed:', err)
  }
}

/**
 * Dismiss the Live Activity. `immediate` removes it instantly;
 * default lets the OS run its short fade-out.
 */
export async function endInterruptActivity(
  activityId: string,
  dismissal: 'immediate' | 'default' = 'immediate',
): Promise<void> {
  try {
    await CoylLiveActivity.end(activityId, { dismissalPolicy: dismissal })
  } catch (err) {
    console.warn('[COYL] endInterruptActivity failed:', err)
  }
}

/**
 * Pushes the Clerk auth token into the shared App Group so the
 * widget's App Intents (Caught me / I slipped / Not now buttons)
 * can authenticate against the COYL API directly from the lock
 * screen. Call this whenever a fresh token is available — at
 * sign-in, after token refresh, etc. No-ops on non-iOS / when the
 * native module isn't loaded.
 */
export async function setLiveActivityAuthToken(
  token: string | null,
): Promise<void> {
  if (!token) return
  try {
    await CoylLiveActivity.setAuthToken(token)
  } catch (err) {
    console.warn('[COYL] setLiveActivityAuthToken failed:', err)
  }
}
