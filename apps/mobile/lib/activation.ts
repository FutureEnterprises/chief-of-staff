import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { parseShareSlug, resolveFamily, type WedgeId } from './archetypes'
import { registerForPushNotifications } from './notifications'

/**
 * Activation-funnel state — the AsyncStorage flags + gates that turn the
 * cold-start quiz into the mobile activation path.
 *
 * Flags (all device-local, all best-effort):
 *   • coyl.quizSeen       — '1' once the archetype reveal has rendered.
 *     app/index.tsx routes signed-out users WITHOUT this flag into /(quiz)
 *     (the 3-tap audit) instead of the sign-in wall; returning signed-out
 *     users (flag set) go to sign-in exactly as before.
 *   • coyl.quizResult     — the wedge-window-script share slug of the last
 *     quiz result, stashed on reveal so the post-signup finalize step can
 *     replay it into the account.
 *   • coyl.quizFinalized  — '1' once POST /api/v1/audit/finalize accepted the
 *     stashed result (so we only replay it once per device).
 *   • coyl.sessionCount   — signed-in cold-start counter, bumped once per
 *     (app) mount. Gates the deferred push-permission ask to session ≥ 2.
 *   • coyl.onboardedSeen  — '1' once /today has observed
 *     onboardingCompleted === true from the server. Seeing it is the "value
 *     moment" that also unlocks the push ask.
 */

const QUIZ_SEEN_KEY = 'coyl.quizSeen'
const QUIZ_RESULT_KEY = 'coyl.quizResult'
const QUIZ_FINALIZED_KEY = 'coyl.quizFinalized'
const SESSION_COUNT_KEY = 'coyl.sessionCount'
const ONBOARDED_SEEN_KEY = 'coyl.onboardedSeen'

/**
 * Mobile wedge id → server PrimaryWedge enum (packages/database). Mirrors the
 * mapping the web audit funnel uses when it calls /api/v1/audit/finalize.
 */
const WEDGE_TO_PRIMARY: Record<WedgeId, string> = {
  weight: 'WEIGHT_LOSS',
  work: 'PRODUCTIVITY',
  destructive: 'DESTRUCTIVE_BEHAVIORS',
  consistency: 'CONSISTENCY',
  spending: 'SPENDING',
  focus: 'FOCUS',
}

/**
 * Has this device ever completed/skipped the quiz (i.e. rendered the reveal)?
 * Fails OPEN to true — if AsyncStorage is unreadable we fall back to the
 * pre-quiz behaviour (sign-in) rather than risk looping a returning user
 * through the quiz forever.
 */
export async function hasSeenQuiz(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(QUIZ_SEEN_KEY)) === '1'
  } catch {
    return true
  }
}

/**
 * Mark the quiz funnel as seen and (when provided) stash the result slug for
 * the post-signup finalize replay. Called from the reveal screen on mount.
 */
export async function markQuizSeen(slug?: string): Promise<void> {
  const pairs: [string, string][] = [[QUIZ_SEEN_KEY, '1']]
  if (slug) pairs.push([QUIZ_RESULT_KEY, slug])
  await AsyncStorage.multiSet(pairs)
}

/**
 * Replay a stashed quiz result into the signed-in account, once.
 *
 * POST /api/v1/audit/finalize is the EXISTING web audit-completion endpoint
 * (Bearer Clerk auth): it persists primaryWedge and seeds 2-3 inferred
 * DangerWindow rows for the archetype family, de-duped by label server-side,
 * so re-running is benign. Seeding windows immediately makes the on-device
 * check-in scheduler (lib/checkin-scheduler) meaningful for quiz-first
 * signups, and means the account is interrupt-ready the moment the user
 * finishes web onboarding (the crons additionally require
 * onboardingCompleted=true, which only coyl.ai/onboarding sets — see the
 * finish-setup card on /today).
 *
 * Returns true when a replay was POSTed and accepted this call.
 */
export async function finalizePendingQuizResult(
  getToken: () => Promise<string | null>,
  apiUrl: string,
): Promise<boolean> {
  const slug = await AsyncStorage.getItem(QUIZ_RESULT_KEY)
  if (!slug) return false
  if ((await AsyncStorage.getItem(QUIZ_FINALIZED_KEY)) === '1') return false

  const parsed = parseShareSlug(slug)
  if (!parsed) return false

  const token = await getToken()
  if (!token) return false

  // Device IANA timezone — the finalize schema accepts it optionally. Hermes
  // ships Intl on SDK 52, but guard anyway; the field is droppable.
  let timezone: string | undefined
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    timezone = undefined
  }

  const res = await fetch(`${apiUrl}/api/v1/audit/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      archetypeSlug: resolveFamily(parsed.wedge, parsed.window, parsed.script),
      primaryWedge: WEDGE_TO_PRIMARY[parsed.wedge],
      auditAnswers: [],
      ...(timezone ? { timezone } : {}),
    }),
  })
  if (!res.ok) {
    throw new Error(`audit/finalize ${res.status} ${res.statusText}`)
  }

  await AsyncStorage.setItem(QUIZ_FINALIZED_KEY, '1')
  return true
}

/**
 * Bump the signed-in cold-start counter. Called once per (app) layout mount;
 * the returned count feeds the deferred push-ask gate below.
 */
export async function noteAppSession(): Promise<number> {
  const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY)
  const count = (parseInt(raw ?? '0', 10) || 0) + 1
  await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count))
  return count
}

/**
 * Record that the server reported onboardingCompleted === true. Returns true
 * only the FIRST time (flag transition), so the caller can treat that exact
 * moment as the value moment to trigger the push-permission ask.
 */
export async function markOnboardingCompleteSeen(): Promise<boolean> {
  const prev = await AsyncStorage.getItem(ONBOARDED_SEEN_KEY)
  if (prev === '1') return false
  await AsyncStorage.setItem(ONBOARDED_SEEN_KEY, '1')
  return true
}

/**
 * Deferred push registration — the value-first replacement for the old
 * cold-mount registerForPushNotifications call.
 *
 * Rules:
 *   • Permission already granted → register immediately (silent Expo token
 *     refresh + POST, no dialog involved). Keeps existing users' tokens fresh
 *     every session, exactly as before.
 *   • OS can't show the dialog again (previously denied) → no-op.
 *   • Otherwise only ASK once the user has seen value: onboarding completed
 *     (coyl.onboardedSeen) or this is at least their second signed-in session.
 *     A first-session user who granted permission via the reveal's "daily
 *     pattern check" button lands in the granted fast-path above.
 *
 * registerForPushNotifications itself is unchanged (lib/notifications).
 */
export async function registerForPushIfEarned(
  getToken: () => Promise<string | null>,
  apiUrl: string,
): Promise<string | null> {
  const perms = await Notifications.getPermissionsAsync()
  if (perms.granted) {
    return registerForPushNotifications(getToken, apiUrl)
  }
  if (!perms.canAskAgain) return null

  const [onboardedSeen, countRaw] = [
    await AsyncStorage.getItem(ONBOARDED_SEEN_KEY),
    await AsyncStorage.getItem(SESSION_COUNT_KEY),
  ]
  const sessionCount = parseInt(countRaw ?? '0', 10) || 0
  if (onboardedSeen === '1' || sessionCount >= 2) {
    return registerForPushNotifications(getToken, apiUrl)
  }
  return null
}
