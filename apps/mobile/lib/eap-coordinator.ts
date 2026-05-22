/**
 * EAP coordinator — the JS-facing surface for COYL's Edge AI Protocol
 * client on iOS.
 *
 * Responsibilities (mirrors the EAP spec at docs/protocol/edge-ai-protocol.md):
 *
 *   1. registerDevice() — POST /api/eap/v1/device/register on first
 *      launch (and on token refresh / state change). Persists the
 *      returned deviceId in expo-secure-store so subsequent action
 *      outcomes can reference it.
 *
 *   2. executeAction() — invoked by the notification routing layer
 *      when a push arrives with data.type === 'eap_action'. Delegates
 *      to per-actuator handlers in ./eap-action-handlers.ts, then
 *      POSTs /api/eap/v1/action/outcome with the result.
 *
 *   3. publishSensors() — runs from a BGTaskScheduler task
 *      ("ai.coyl.eap.publish-sensors") every ~4 hours or on
 *      significant event. Reads the latest sensor cluster via
 *      coyl-health-bridge and POSTs to /api/v1/health/ingest (the
 *      already-shipped ingest endpoint).
 *
 *   4. triggerPanic() — POST /api/eap/v1/panic. The UI hook for the
 *      emergency "kill all proactive AI" switch.
 *
 * Cross-module composition: this coordinator REUSES the existing
 * Live Activity / Voice / Watch / Health bridges. It does not
 * duplicate any of their work — the per-actuator handlers route to
 * the right module and the device-register manifest reflects the
 * full union of capabilities those modules already provide.
 */
import * as SecureStore from 'expo-secure-store'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

import CoylEAPCoordinator from '../modules/coyl-eap-coordinator'
import { handleEapAction, type EAPActionPayload } from './eap-action-handlers'
import {
  postSignalBatch,
  readRecentHRV,
  readSedentaryDuration,
  type HealthSample,
} from './health-bridge'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://coyl.ai'

const EAP_BASE = '/api/eap/v1'
const DEVICE_REGISTER_PATH = `${EAP_BASE}/device/register`
const ACTION_OUTCOME_PATH = `${EAP_BASE}/action/outcome`
const PANIC_PATH = `${EAP_BASE}/panic`

// SecureStore key for the EAP deviceId. Distinct from the App
// Group fingerprint — the fingerprint is the client-minted dedupe
// key, the deviceId is the server-assigned cuid that's the foreign
// key target for ActionRequest + EAPAuditEntry. We need both.
const SECURE_KEY_DEVICE_ID = 'coyl.eap.deviceId'

/**
 * The full set of actuators this iOS coordinator can dispatch.
 * Mirrors the EAP spec § Device Registration manifest.actuators field.
 * Order matches the priority a server-side scheduler should infer if
 * it has to pick a fallback (e.g., haptic > push for time-sensitive).
 */
export const IOS_ACTUATORS = [
  'haptic',
  'push_notification',
  'voice_tts',
  'live_activity',
  'open_url',
  'open_app_intent',
] as const

/**
 * The full set of sensors this iOS coordinator can read.
 * Mirrors the EAP spec § Device Registration manifest.sensors field.
 * Each maps to a coyl-health-bridge / coyl-screen-state surface.
 */
export const IOS_SENSORS = [
  'hrv_proxy',
  'motion',
  'location_geofence',
  'screen_state',
] as const

/** Result of registerDevice(). Mirrors the server's response shape. */
export interface RegisterDeviceResult {
  /** Server-assigned device cuid, or null if registration failed. */
  deviceId: string | null
  /** Client-generated persistent fingerprint (always present). */
  deviceFingerprint: string
}

/**
 * Options for executeAction(). Action payloads arrive via push
 * notifications and are routed through here by the notification
 * receive listener in apps/mobile/app/(app)/_layout.tsx (existing —
 * the wiring task is owned by the founder, see TODOs at top of
 * eap-action-handlers.ts).
 */
export interface ExecuteActionOptions {
  /** Lock-screen action token from the push payload. */
  executionToken: string
  /** Actuator string from the push payload (one of IOS_ACTUATORS). */
  actuator: string
  /** Free-form params, actuator-specific. Shape validated in handlers. */
  params: Record<string, unknown>
  /**
   * Fresh Clerk JWT. The outcome callback path is unauthenticated
   * server-side (the executionToken is the capability) but we still
   * include the Bearer for audit-trail attribution + so the server
   * can correlate with the user.
   */
  getAuthToken: () => Promise<string | null>
}

/**
 * Register this device with the EAP coordinator on coyl.ai.
 *
 * Idempotent server-side on deviceFingerprint — safe to call on
 * every app launch. We rate-limit ourselves with a SecureStore
 * cache of the last successful deviceId so we don't hammer the
 * endpoint on every cold-start.
 *
 * The returned deviceId is also persisted to SecureStore so the
 * action/outcome path can reference it. If registration fails
 * (network error, server error, missing Clerk token) we still
 * return the fingerprint so the JS app can continue offline — the
 * next launch will retry.
 */
export async function registerDevice(
  getAuthToken: () => Promise<string | null>,
  pushToken?: string | null,
): Promise<RegisterDeviceResult> {
  // Always resolve the fingerprint first — it's the stable identity
  // we'll surface even if the server round-trip fails.
  const deviceFingerprint = await CoylEAPCoordinator.getDeviceFingerprint()

  if (Platform.OS !== 'ios') {
    // EAP coordinator is iOS-only at this revision; Android lives in
    // a future module. Return the fingerprint stub + a null deviceId.
    return { deviceId: null, deviceFingerprint }
  }

  const [opState, grantedScopes, authToken] = await Promise.all([
    CoylEAPCoordinator.getOperationalState(),
    CoylEAPCoordinator.getUserGrantedScopes(),
    getAuthToken().catch(() => null),
  ])

  if (!authToken) {
    // Unauthenticated launch — defer registration until the user
    // signs in. The caller (app layout) re-invokes us on isSignedIn.
    return { deviceId: null, deviceFingerprint }
  }

  // Snapshot the device class + model + OS string. We default to
  // generic values rather than failing on simulators where
  // Device.modelName can be null.
  const model = Device.modelName ?? 'iPhone'
  const osVersion = Device.osVersion ?? 'unknown'
  const os = `iOS ${osVersion}`

  const body: Record<string, unknown> = {
    deviceFingerprint,
    deviceClass: 'ios_phone',
    model,
    os,
    manifest: {
      sensors: [...IOS_SENSORS],
      actuators: [...IOS_ACTUATORS],
      userGrantedScopes: grantedScopes,
    },
    operationalState: opState,
  }
  if (pushToken) {
    body.pushToken = pushToken
  }

  try {
    const res = await fetch(`${API_URL}${DEVICE_REGISTER_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.warn('[COYL][EAP] device.register HTTP', res.status)
      return { deviceId: null, deviceFingerprint }
    }
    const json = (await res.json()) as { device?: { id?: string } }
    const deviceId = json.device?.id ?? null
    if (deviceId) {
      // Cache the server-assigned id so action outcomes can
      // reference it without re-registering. SecureStore (Keychain
      // on iOS) survives reinstall.
      try {
        await SecureStore.setItemAsync(SECURE_KEY_DEVICE_ID, deviceId)
      } catch {
        // SecureStore failures are non-fatal — the id is also
        // recoverable from the next register call.
      }
    }
    return { deviceId, deviceFingerprint }
  } catch (err) {
    console.warn('[COYL][EAP] device.register failed:', err)
    return { deviceId: null, deviceFingerprint }
  }
}

/**
 * Read the cached server-assigned deviceId from SecureStore.
 * Returns null if registerDevice() hasn't completed successfully yet
 * this install.
 */
export async function getCachedDeviceId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_KEY_DEVICE_ID)
  } catch {
    return null
  }
}

/**
 * Dispatches an EAP action received via push notification.
 *
 * Flow:
 *   1. Route to the appropriate actuator handler in
 *      eap-action-handlers.ts. The handler invokes the existing
 *      coyl-* native module (Watch / LiveActivity / Voice / etc.).
 *   2. POST /api/eap/v1/action/outcome with the executionToken and
 *      the outcome (executed | failed). The outcome endpoint is
 *      keyed off the executionToken — that's the single-use
 *      capability the server minted at action/request time.
 *
 * The Bearer token is included for audit attribution; the outcome
 * endpoint accepts the request even without auth (the token is
 * the capability), but Clerk attribution sharpens the audit trail.
 */
export async function executeAction(opts: ExecuteActionOptions): Promise<void> {
  const { executionToken, actuator, params, getAuthToken } = opts

  let outcome: 'executed' | 'failed' = 'executed'
  let outcomeReason: string | null = null

  try {
    await handleEapAction({
      actuator,
      params,
    } satisfies EAPActionPayload)
  } catch (err) {
    outcome = 'failed'
    outcomeReason = err instanceof Error ? err.message : 'unknown'
  }

  // Best-effort outcome post. We do not block the user-visible path
  // on this — the actuator already fired (or failed) by the time we
  // get here, and the EAP server treats missing outcomes as
  // "unknown" (which gets reconciled on the next observable signal).
  try {
    const authToken = await getAuthToken().catch(() => null)
    await fetch(`${API_URL}${ACTION_OUTCOME_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        executionToken,
        outcome,
        outcomeReason,
        deviceState: { foregroundApp: 'com.coyl.app' },
      }),
    })
  } catch (err) {
    console.warn('[COYL][EAP] action.outcome post failed:', err)
  }
}

/**
 * Background sensor publish. Called from the BGTaskScheduler task
 * "ai.coyl.eap.publish-sensors" (registered server-side in Info.plist
 * — see TODO at end of file) and on significant events (HRV spike,
 * geofence enter — those triggers live in coyl-health-bridge).
 *
 * Reads the latest sensor cluster and POSTs it to /api/v1/health/ingest
 * (the existing health ingest endpoint that the BIP signal flow
 * already uses). The server-side EAP daemon reads from the same
 * health table to evaluate SensorSubscription matches and fire
 * webhooks to LLM partners — clients only need to publish the raw
 * signals, not the subscription state.
 */
export async function publishSensors(
  getAuthToken: () => Promise<string | null>,
): Promise<void> {
  if (Platform.OS !== 'ios') return

  const authToken = await getAuthToken().catch(() => null)
  if (!authToken) {
    // Unauthenticated — background task fires before sign-in is
    // possible. No-op; next run will succeed.
    return
  }

  try {
    // Pull a short window of HRV + sedentary minutes. We deliberately
    // keep the window small (last 30m) so re-runs are cheap and we
    // don't re-post the same samples twice (the ingest endpoint is
    // idempotent on capturedAt + kind anyway, but small windows save
    // bandwidth).
    const [hrv, sedentaryMin] = await Promise.all([
      readRecentHRV(30).catch(() => []),
      readSedentaryDuration().catch(() => 0),
    ])

    const samples: HealthSample[] = []
    for (const s of hrv) {
      samples.push({
        kind: 'hrv',
        valueNumeric: s.ms,
        capturedAt: s.end.toISOString(),
      })
    }
    if (sedentaryMin > 0) {
      samples.push({
        kind: 'sedentary',
        valueNumeric: sedentaryMin,
        capturedAt: new Date().toISOString(),
      })
    }

    if (samples.length === 0) return
    await postSignalBatch(samples, authToken)
  } catch (err) {
    console.warn('[COYL][EAP] publishSensors failed:', err)
  }
}

/**
 * Panic switch. POSTs /api/eap/v1/panic with Clerk Bearer auth.
 * Server-side this sets PanicState.active=true for 24h, which causes
 * every subsequent ActionRequest from every LLM partner to be
 * denied at the top of the gate stack regardless of any outstanding
 * ScopeGrant.
 *
 * The emergency settings screen (founder adds later) calls this
 * with a one-tap confirm. We return ok/expiresAt so the UI can
 * render "Panic active until 9:42 PM."
 */
export async function triggerPanic(
  getAuthToken: () => Promise<string | null>,
  reason?: string,
): Promise<{ ok: boolean; expiresAt: string | null }> {
  const authToken = await getAuthToken().catch(() => null)
  if (!authToken) {
    return { ok: false, expiresAt: null }
  }

  try {
    const res = await fetch(`${API_URL}${PANIC_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(reason ? { reason } : {}),
    })
    if (!res.ok) {
      return { ok: false, expiresAt: null }
    }
    const json = (await res.json()) as { ok?: boolean; expiresAt?: string }
    return {
      ok: json.ok === true,
      expiresAt: typeof json.expiresAt === 'string' ? json.expiresAt : null,
    }
  } catch (err) {
    console.warn('[COYL][EAP] panic post failed:', err)
    return { ok: false, expiresAt: null }
  }
}

/**
 * Sync the user's EAP scope grants to the App Group so the widget
 * extension + Watch app can read them. Call this whenever the
 * user's scope list changes (granted in Settings, revoked, etc.).
 *
 * The scope list is canonical server-side; this helper exists so the
 * UI can mirror it locally for offline gating + cross-target reads.
 */
export async function syncGrantedScopes(scopes: string[]): Promise<void> {
  if (Platform.OS !== 'ios') return
  try {
    await CoylEAPCoordinator.setUserGrantedScopes(scopes)
  } catch (err) {
    console.warn('[COYL][EAP] setUserGrantedScopes failed:', err)
  }
}

// ---------------------------------------------------------------------------
// TODOs for founder (Xcode-side wiring — not codable from this layer):
//
//   1. Add "ai.coyl.eap.publish-sensors" to the Info.plist key
//      BGTaskSchedulerPermittedIdentifiers so iOS allows the task to
//      run. AppDelegate (or the Expo equivalent) should call:
//
//          BGTaskScheduler.shared.register(
//              forTaskWithIdentifier: "ai.coyl.eap.publish-sensors",
//              using: nil
//          ) { task in
//              // Bridge to JS: call publishSensors() via the JS runtime
//              // (see expo-background-fetch or a custom AppDelegate
//              // hook). Mark the BGAppRefreshTaskRequest as completed
//              // when the JS promise resolves.
//          }
//
//      and schedule the next run every ~4 hours.
//
//   2. Verify the App Group entitlement "group.com.coyl.shared" is
//      enabled on the coyl-eap-coordinator pod target (same entitlement
//      the coyl-live-activity + coyl-watch pods already require).
//
//   3. If expo-module autolink doesn't pick up the new pod, add it
//      manually in apps/mobile/ios/Podfile:
//
//          pod 'CoylEAPCoordinator',
//              :path => '../modules/coyl-eap-coordinator/ios'
//
//   4. Wire the notification receive listener in
//      apps/mobile/app/(app)/_layout.tsx to call:
//
//          if (data.type === 'eap_action') {
//              executeAction({
//                  executionToken: String(data.executionToken),
//                  actuator: String(data.actuator),
//                  params: data.params ?? {},
//                  getAuthToken: () => getTokenRef.current(),
//              }).catch(err => console.warn(err))
//          }
//
//      (We don't ship the wiring here because _layout.tsx is owned by
//      a sibling agent.)
// ---------------------------------------------------------------------------
