/**
 * COYL Browser Extension — EAP coordinator (Manifest V3)
 *
 * Implements the on-device coordinator half of the Edge AI Protocol
 * (see docs/protocol/edge-ai-protocol.md §6) for the
 * Chrome / Edge / Firefox browser surface.
 *
 * Lifecycle inside the service worker:
 *   1. ensureDeviceFingerprint()  — minted once per install, persisted
 *   2. registerDevice()           — POST /api/eap/v1/device/register
 *                                   (idempotent on deviceFingerprint)
 *   3. chrome.alarms              — drives both the pending-actions
 *                                   poll (30s) and the sensor publish
 *                                   (5min). Service workers can't keep
 *                                   timers across sleep, so alarms are
 *                                   the only durable scheduler.
 *   4. pollPendingActions()       — GET /api/eap/v1/devices/<id>/pending-actions
 *                                   for each action, dispatch to
 *                                   eap-actuators.js, then POST the
 *                                   outcome back to
 *                                   /api/eap/v1/action/outcome.
 *
 * Auth model: cookie-based Clerk session against https://coyl.ai/* —
 * we do NOT mint a partner Bearer token here. The /api/eap/v1/* routes
 * accept either an LLM partner Bearer key OR a Clerk-cookie session
 * acting on its own behalf. The browser is the user's own device, so
 * the cookie path applies. If the user is signed out, registration is
 * deferred until they sign in via the popup.
 *
 * Coexists with the original tab-interrupt logic in background.js;
 * neither talks to the other directly — eap-actuators.js reuses the
 * existing COYL_FIRE_INTERRUPT message channel into content.js for the
 * 'overlay' actuator so the visual surface stays unified.
 */

import * as actuators from './eap-actuators.js'
import * as sensors from './eap-sensors.js'

const EAP_STORAGE_KEYS = {
  DEVICE_FINGERPRINT: 'coyl_eap_device_fingerprint',
  DEVICE_ID: 'coyl_eap_device_id',
  SCOPES: 'coyl_eap_user_granted_scopes',
  LAST_REGISTER_AT: 'coyl_eap_last_register_at',
  USER_ID: 'coyl_eap_user_id',
}

const COYL_BASE = 'https://coyl.ai'

const ALARM_NAMES = {
  POLL_PENDING: 'coyl_eap_poll_pending',
  PUBLISH_SENSORS: 'coyl_eap_publish_sensors',
  REREGISTER: 'coyl_eap_reregister',
}

// Manifest advertised at registration. Keep aligned with the actuator
// + sensor implementations in the sibling files — adding a capability
// here without wiring its dispatch is a silent contract break.
const BROWSER_SENSORS = [
  'tab_state',
  'tab_open_rate',
  'active_url',
  'tab_count',
  'screen_state',
]

const BROWSER_ACTUATORS = [
  'notification',
  'overlay',
  'tab_close',
  'tab_open',
  'open_url',
]

/**
 * Detect which Chromium/Gecko build we're running inside. The UA is
 * good enough — we only use this to populate the manifest, not to
 * gate behavior.
 */
function detectBrowserOs() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  // Order matters: Edge UAs include 'Chrome' too, so check Edg/ first.
  if (/Edg\//.test(ua)) return 'Edge'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Chrome\//.test(ua)) return 'Chrome'
  return 'Browser'
}

/**
 * Mint-once device fingerprint. We avoid anything user-identifying;
 * a random opaque id is enough for the backend to dedupe re-registrations.
 */
async function ensureDeviceFingerprint() {
  const got = await chrome.storage.local.get(EAP_STORAGE_KEYS.DEVICE_FINGERPRINT)
  let fp = got[EAP_STORAGE_KEYS.DEVICE_FINGERPRINT]
  if (fp && typeof fp === 'string') return fp

  // crypto.randomUUID is available in MV3 service workers (Chrome 92+,
  // Edge 92+, Firefox 95+). Fallback to a Math.random concat for the
  // very-old Firefox case, even though our minimum supported is newer.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    fp = `ext-${crypto.randomUUID()}`
  } else {
    fp = `ext-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  }
  await chrome.storage.local.set({ [EAP_STORAGE_KEYS.DEVICE_FINGERPRINT]: fp })
  return fp
}

/**
 * Resolve the user's granted EAP/PAP scope keys from local storage.
 * The options page writes them when the user toggles consent.
 */
async function readUserGrantedScopes() {
  const got = await chrome.storage.local.get(EAP_STORAGE_KEYS.SCOPES)
  const scopes = got[EAP_STORAGE_KEYS.SCOPES]
  return Array.isArray(scopes) ? scopes : []
}

/**
 * POST /api/eap/v1/device/register
 *
 * Idempotent on deviceFingerprint. The backend may either:
 *   - 200 with { device: { id, deviceClass, paired } }   — registered
 *   - 401 (no Clerk cookie)                              — user signed out
 *   - 404 user_not_found                                 — user wiped
 * On 200 we persist the deviceId; pending-action polling needs it.
 */
async function registerDevice() {
  const deviceFingerprint = await ensureDeviceFingerprint()
  const userGrantedScopes = await readUserGrantedScopes()

  const body = {
    deviceFingerprint,
    deviceClass: 'browser_extension',
    model: (typeof navigator !== 'undefined' && navigator.userAgent) || 'unknown',
    os: detectBrowserOs(),
    manifest: {
      sensors: BROWSER_SENSORS,
      actuators: BROWSER_ACTUATORS,
      userGrantedScopes,
    },
    operationalState: {
      online: true,
      registeredAt: new Date().toISOString(),
    },
  }

  let res
  try {
    res = await fetch(`${COYL_BASE}/api/eap/v1/device/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    // Network or service-worker context unavailable. Re-register on the
    // next alarm tick — no need to surface to the user.
    console.warn('[coyl-eap] register failed (network)', err)
    return null
  }

  if (res.status === 401) {
    // User signed out. Skip silently; we'll retry after the next sign-in.
    return null
  }
  if (!res.ok) {
    console.warn('[coyl-eap] register non-2xx', res.status)
    return null
  }

  let payload
  try {
    payload = await res.json()
  } catch {
    return null
  }

  const deviceId = payload?.device?.id
  if (deviceId && typeof deviceId === 'string') {
    await chrome.storage.local.set({
      [EAP_STORAGE_KEYS.DEVICE_ID]: deviceId,
      [EAP_STORAGE_KEYS.LAST_REGISTER_AT]: Date.now(),
    })
    return deviceId
  }
  return null
}

/**
 * GET /api/eap/v1/devices/<deviceId>/pending-actions
 *
 * Returns the queue of LLM-proposed actions the device should execute.
 * Wire format expected:
 *   {
 *     "actions": [
 *       {
 *         "executionToken": "et_xyz",
 *         "actuator": "notification" | "overlay" | "tab_close" | "tab_open" | "open_url",
 *         "params": { ...actuator-specific },
 *         "scopeRequested": "edge:browser:notification",
 *         "expiresAt": "2026-05-22T..."
 *       }, ...
 *     ]
 *   }
 *
 * If the backend hasn't shipped this endpoint yet (returns 404), we
 * silently no-op — coordinator becomes register-only until the route
 * lands. Same for 401 (signed out) and network failure.
 */
async function pollPendingActions() {
  const got = await chrome.storage.local.get(EAP_STORAGE_KEYS.DEVICE_ID)
  let deviceId = got[EAP_STORAGE_KEYS.DEVICE_ID]
  if (!deviceId) {
    // Try to (re-)register once per poll cycle when we don't have an id.
    deviceId = await registerDevice()
    if (!deviceId) return
  }

  const url = `${COYL_BASE}/api/eap/v1/devices/${encodeURIComponent(deviceId)}/pending-actions`

  let res
  try {
    res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    return
  }

  // 404 = endpoint not deployed yet. 401 = signed out. Both no-op.
  if (!res.ok) return

  let payload
  try {
    payload = await res.json()
  } catch {
    return
  }

  const actions = Array.isArray(payload?.actions) ? payload.actions : []
  for (const action of actions) {
    await dispatchAction(action)
  }
}

/**
 * Route a single action to its actuator handler in eap-actuators.js,
 * then POST the outcome back.
 */
async function dispatchAction(action) {
  if (!action || typeof action !== 'object') return
  const executionToken = action.executionToken
  if (!executionToken || typeof executionToken !== 'string') return

  const startedAt = Date.now()
  let outcome = 'executed'
  let errorReason = null

  try {
    switch (action.actuator) {
      case 'notification':
        await actuators.fireNotification(action.params)
        break
      case 'overlay':
        await actuators.fireOverlay(action.params)
        break
      case 'tab_close':
        await actuators.fireTabClose(action.params)
        break
      case 'tab_open':
        await actuators.fireTabOpen(action.params)
        break
      case 'open_url':
        await actuators.fireOpenUrl(action.params)
        break
      default:
        outcome = 'failed'
        errorReason = 'unknown_actuator'
    }
  } catch (err) {
    outcome = 'failed'
    errorReason = err instanceof Error ? err.message : 'actuator_error'
  }

  await postOutcome({
    executionToken,
    outcome,
    outcomeAt: new Date().toISOString(),
    deviceState: {
      latencyMs: Date.now() - startedAt,
      ...(errorReason ? { errorReason } : {}),
    },
  })
}

/**
 * POST /api/eap/v1/action/outcome — closes the loop per EAP §7.
 */
async function postOutcome(body) {
  try {
    await fetch(`${COYL_BASE}/api/eap/v1/action/outcome`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // Best-effort. The backend will time the action out on its end.
  }
}

/**
 * Schedule the two recurring alarms. Idempotent — calling multiple
 * times in a single session is safe; chrome.alarms.create with an
 * existing name replaces the schedule.
 *
 * Why alarms not setInterval: MV3 service workers are killed after
 * ~30s of idle. setInterval handles die with them; alarms wake the
 * worker back up. This is the canonical EAP-on-MV3 pattern.
 */
function scheduleAlarms() {
  chrome.alarms.create(ALARM_NAMES.POLL_PENDING, {
    delayInMinutes: 0.5, // ~30s first fire
    periodInMinutes: 0.5,
  })
  chrome.alarms.create(ALARM_NAMES.PUBLISH_SENSORS, {
    delayInMinutes: 1, // first publish 1min after install
    periodInMinutes: 5,
  })
  chrome.alarms.create(ALARM_NAMES.REREGISTER, {
    // Refresh manifest + operationalState hourly so the backend's
    // `online` + `lastSeenAt` stays current and any scope changes the
    // user made in the options page get propagated.
    delayInMinutes: 60,
    periodInMinutes: 60,
  })
}

/**
 * Single entry point background.js wires into chrome.alarms.onAlarm.
 * Returns a promise the caller can await for testing; in production
 * the alarm dispatcher doesn't care about the return.
 */
async function handleAlarm(alarmName) {
  switch (alarmName) {
    case ALARM_NAMES.POLL_PENDING:
      await pollPendingActions()
      return
    case ALARM_NAMES.PUBLISH_SENSORS:
      await sensors.publishSensorBatch(COYL_BASE)
      return
    case ALARM_NAMES.REREGISTER:
      await registerDevice()
      return
  }
}

/**
 * Called from background.js onInstalled. Registers the device and
 * sets up the alarms. Safe to call more than once.
 */
async function bootstrap() {
  scheduleAlarms()
  // Don't block the install handler on the network round-trip; let
  // the first alarm pull it through if the network is slow.
  registerDevice().catch(() => {})
}

/**
 * Called from options.js after the user toggles scope checkboxes. We
 * re-POST the device manifest so the backend's userGrantedScopes view
 * stays in sync without waiting for the hourly re-register tick.
 */
async function refreshAfterScopeChange() {
  await registerDevice()
}

export {
  ALARM_NAMES,
  EAP_STORAGE_KEYS,
  bootstrap,
  handleAlarm,
  registerDevice,
  refreshAfterScopeChange,
}
