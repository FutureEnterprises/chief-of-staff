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
  // A fresh result supersedes any previous replay: clear the finalized flag
  // so a retake (pre-signup or signed-in) is replayed into the account once.
  // Safe because /api/v1/audit/finalize is idempotent server-side (windows
  // de-duped by label, primaryWedge update skipped when unchanged), so even a
  // re-render of the SAME reveal only costs one benign re-POST.
  if (slug) await AsyncStorage.removeItem(QUIZ_FINALIZED_KEY)
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
  if (!parsed) {
    // Junk stash — it can never finalize, so drop it rather than re-parse it
    // on every cold start forever.
    await AsyncStorage.removeItem(QUIZ_RESULT_KEY).catch(() => {})
    return false
  }

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
    // 400 = the server rejected the payload as invalid (unknown slug/wedge).
    // That's permanent for this stash — retrying it every cold start can never
    // succeed — so mark it finalized and stop. Everything else is transient
    // (401 token hiccup, 404 user row not provisioned yet post-signup, 5xx,
    // network throw above): the stash + flag are left untouched so the next
    // cold start retries. The stash is only ever cleared AFTER a success, so
    // no result is lost to a failed attempt.
    if (res.status === 400) {
      await AsyncStorage.setItem(QUIZ_FINALIZED_KEY, '1')
      return false
    }
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
// Single-flight guard: two call sites can race in the same session — the
// (app)/_layout session-count gate at mount and /today's onboarding value
// moment right after its first fetch. Sharing the in-flight promise prevents
// two concurrent OS permission requests (Android 13 will happily show the
// dialog again for a dismissed-not-denied request) and duplicate token POSTs.
// Cleared on settle so a LATER value moment in the same session (user finishes
// web onboarding mid-session, pulls to refresh) can still trigger the ask —
// sequential re-asks are governed by the OS permission state itself.
let pushRegistrationInFlight: Promise<string | null> | null = null

export async function registerForPushIfEarned(
  getToken: () => Promise<string | null>,
  apiUrl: string,
): Promise<string | null> {
  if (pushRegistrationInFlight) return pushRegistrationInFlight
  pushRegistrationInFlight = (async () => {
    try {
      const perms = await Notifications.getPermissionsAsync()
      if (perms.granted) {
        return await registerForPushNotifications(getToken, apiUrl)
      }
      if (!perms.canAskAgain) return null

      const [onboardedSeen, countRaw] = [
        await AsyncStorage.getItem(ONBOARDED_SEEN_KEY),
        await AsyncStorage.getItem(SESSION_COUNT_KEY),
      ]
      const sessionCount = parseInt(countRaw ?? '0', 10) || 0
      if (onboardedSeen === '1' || sessionCount >= 2) {
        return await registerForPushNotifications(getToken, apiUrl)
      }
      return null
    } finally {
      pushRegistrationInFlight = null
    }
  })()
  return pushRegistrationInFlight
}
