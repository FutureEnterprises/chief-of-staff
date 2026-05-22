/**
 * COYL Safari Web Extension — EAP coordinator (v0.1)
 *
 * Same shape as the Chrome/Edge/Firefox EAP coordinator (apps/extension/)
 * but adapted to Safari's stricter background-context lifecycle and the
 * `browser.*` API surface.
 *
 * Responsibilities (per docs/protocol/edge-ai-protocol.md):
 *   1. Register the device with the COYL Cloud EAP coordinator
 *      (POST /api/eap/v1/device/register) on first install + on every
 *      manifest change.
 *   2. Persist deviceId + identity in browser.storage.local. Safari
 *      kills background contexts more aggressively than Chrome, so
 *      identity must live in storage, not in memory.
 *   3. Poll /api/eap/v1/devices/<id>/pending-actions every 60s for
 *      queued actions and dispatch them through eap-actuators.js. The
 *      Chrome agent polls every 30s; Safari needs the doubled cadence
 *      because Safari coalesces alarms during low-activity windows.
 *   4. Expose a small message API so options.js (scope-grant toggles)
 *      and the sibling sensors module can refresh the manifest without
 *      knowing the network path.
 *
 * Safari-specific constraints (vs Chrome):
 *   - No background service worker — background.js is a persistent
 *     page that Safari may suspend at any time. We assume cold start
 *     between poll cycles and re-read identity from storage every tick.
 *   - browser.alarms exists but Safari coalesces fires under power
 *     management; we rely on the alarm for the wake nudge AND fall
 *     back to a setTimeout chain inside the background page so we
 *     still get a poll if the alarm gets dropped.
 *   - HTTPS-only host permissions (no http:// allowed). The COYL Cloud
 *     base URL is hard-coded https.
 */

const ext = typeof browser !== 'undefined' ? browser : chrome

const EAP_BASE = 'https://coyl.ai/api/eap/v1'
const EAP_POLL_ALARM = 'coyl-eap-poll'
const EAP_POLL_INTERVAL_MIN = 1 // Safari coalesces alarms; 1-min minimum

const STORAGE = {
  DEVICE_ID: 'coyl_eap_device_id',
  DEVICE_FINGERPRINT: 'coyl_eap_device_fp',
  USER_ID: 'coyl_eap_user_id',
  GRANTED_SCOPES: 'coyl_eap_granted_scopes',
  ENABLED: 'coyl_eap_enabled',
  LAST_REGISTER_AT: 'coyl_eap_last_register_at',
  LAST_POLL_AT: 'coyl_eap_last_poll_at',
}

// The Safari Web Extension exposes a subset of EAP actuators (see
// eap-actuators.js + README) and a subset of EAP sensors (see
// eap-sensors.js + README). The manifest below is the source of truth
// announced to the COYL Cloud coordinator at registration time.
const SAFARI_MANIFEST = {
  sensors: [
    'tab_count',
    'active_url_host',
    // NOTE: screen_state intentionally omitted — Safari does not expose
    // browser.idle. tab_open_rate is best-effort in-memory only.
    'tab_open_rate',
  ],
  actuators: [
    'notification',
    'overlay',
    'tab_close',
    'tab_open',
    'open_url',
  ],
  // userGrantedScopes hydrated from storage at register time — empty
  // until the user toggles them on in the options page.
  userGrantedScopes: [],
}

/**
 * Generate (or recall) a stable per-install device fingerprint. Safari
 * doesn't give us a hardware ID, so this is a random uuid persisted in
 * storage.local — durable enough for EAP's idempotency-on-fingerprint
 * upsert path.
 */
async function getOrCreateFingerprint() {
  const { [STORAGE.DEVICE_FINGERPRINT]: existing } = await ext.storage.local.get(
    STORAGE.DEVICE_FINGERPRINT,
  )
  if (existing) return existing
  // crypto.randomUUID is available in Safari 15.4+ which is well below
  // our minimum (16.4 for Manifest V3).
  const fp = `safari-ext-${crypto.randomUUID()}`
  await ext.storage.local.set({ [STORAGE.DEVICE_FINGERPRINT]: fp })
  return fp
}

/**
 * Read the user-granted scope list from storage. Until the user toggles
 * any scope on in the options page, this is an empty array — which means
 * the coordinator will deny every action request, by design.
 */
async function getGrantedScopes() {
  const { [STORAGE.GRANTED_SCOPES]: scopes } = await ext.storage.local.get(
    STORAGE.GRANTED_SCOPES,
  )
  return Array.isArray(scopes) ? scopes : []
}

/**
 * Read userId from storage. The userId is set during a future OAuth
 * pairing flow (v0.2); until then registration is best-effort and the
 * server returns user_not_found which we treat as "not yet paired".
 */
async function getUserId() {
  const { [STORAGE.USER_ID]: id } = await ext.storage.local.get(STORAGE.USER_ID)
  return typeof id === 'string' && id.length > 0 ? id : null
}

/**
 * Read the partner bearer token. The Safari extension acts on behalf
 * of the COYL consumer LLM partner token (issued at OAuth pairing). In
 * v0.1 we look for it in storage; if absent, registration short-circuits
 * with a logged warning rather than failing loudly.
 */
async function getPartnerToken() {
  const { coyl_eap_partner_token: token } = await ext.storage.local.get(
    'coyl_eap_partner_token',
  )
  return typeof token === 'string' && token.length > 0 ? token : null
}

/**
 * POST /api/eap/v1/device/register — primitive #1 in the EAP spec.
 *
 * Idempotent on deviceFingerprint. Re-registers whenever the manifest
 * changes (e.g. user grants a new scope in the options page).
 */
async function registerDevice() {
  const enabled = await isEnabled()
  if (!enabled) return { ok: false, reason: 'disabled' }

  const userId = await getUserId()
  const token = await getPartnerToken()
  if (!userId || !token) {
    return { ok: false, reason: 'not_paired' }
  }

  const deviceFingerprint = await getOrCreateFingerprint()
  const grantedScopes = await getGrantedScopes()
  const manifest = { ...SAFARI_MANIFEST, userGrantedScopes: grantedScopes }

  let tabCount = 0
  try {
    const tabs = await ext.tabs.query({})
    tabCount = tabs.length
  } catch {
    // Safari occasionally refuses tabs.query in background-suspended
    // state. Ship the registration without operationalState rather
    // than failing the whole call.
  }

  const body = {
    userId,
    deviceClass: 'safari_extension',
    model: 'Safari Web Extension',
    os: navigator.userAgent,
    deviceFingerprint,
    manifest,
    operationalState: {
      tabCount,
      online: navigator.onLine,
    },
  }

  try {
    const res = await fetch(`${EAP_BASE}/device/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[coyl-eap] register failed', res.status, text)
      return { ok: false, reason: 'http_error', status: res.status }
    }
    const json = await res.json()
    const deviceId = json?.device?.id
    if (typeof deviceId === 'string') {
      await ext.storage.local.set({
        [STORAGE.DEVICE_ID]: deviceId,
        [STORAGE.LAST_REGISTER_AT]: Date.now(),
      })
    }
    return { ok: true, deviceId }
  } catch (err) {
    console.warn('[coyl-eap] register network error', err)
    return { ok: false, reason: 'network_error' }
  }
}

/**
 * GET /api/eap/v1/devices/:deviceId/pending-actions — pull queued
 * actions the COYL Cloud coordinator has accumulated for this device.
 *
 * Returned shape (per spec):
 *   { actions: [ { executionToken, actuator, params, scopeRequested } ] }
 *
 * On a successful drain, each action is dispatched to the actuator
 * layer and its outcome reported via POST /action/outcome (handled in
 * eap-actuators.js).
 */
async function pollPendingActions() {
  const enabled = await isEnabled()
  if (!enabled) return
  const token = await getPartnerToken()
  const { [STORAGE.DEVICE_ID]: deviceId } = await ext.storage.local.get(
    STORAGE.DEVICE_ID,
  )
  if (!deviceId || !token) return

  await ext.storage.local.set({ [STORAGE.LAST_POLL_AT]: Date.now() })

  let actions = []
  try {
    const res = await fetch(`${EAP_BASE}/devices/${encodeURIComponent(deviceId)}/pending-actions`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 204) return // empty queue
    if (!res.ok) {
      // Server hasn't shipped the pending-actions endpoint yet (v0.1
      // server only has /action/request). Treat 404 as "nothing to do".
      if (res.status === 404) return
      console.warn('[coyl-eap] poll failed', res.status)
      return
    }
    const json = await res.json()
    actions = Array.isArray(json?.actions) ? json.actions : []
  } catch (err) {
    // Network blip — swallow and try again next tick.
    return
  }

  if (actions.length === 0) return

  // Dispatch in declared order. The actuator layer handles per-action
  // permission checks, execution, and outcome reporting.
  const dispatcher = globalThis.__coylEapActuators
  if (!dispatcher || typeof dispatcher.dispatch !== 'function') {
    console.warn('[coyl-eap] no actuator dispatcher loaded')
    return
  }
  for (const action of actions) {
    try {
      await dispatcher.dispatch(action)
    } catch (err) {
      console.warn('[coyl-eap] action dispatch failed', action?.executionToken, err)
    }
  }
}

/**
 * Master enabled flag — flipped by the user in the options page. When
 * false, registration is skipped and the poll loop is a no-op. This is
 * the EAP-specific kill switch (separate from the panic switch on the
 * server, which revokes all scopes).
 */
async function isEnabled() {
  const { [STORAGE.ENABLED]: enabled } = await ext.storage.local.get(STORAGE.ENABLED)
  // Default to false: the user explicitly opts the device into EAP via
  // the options page. No silent enrollment.
  return enabled === true
}

/**
 * Start the poll loop. Two redundant triggers because Safari is unreliable:
 *   1. browser.alarms with a 1-minute period — wakes the background page
 *      if it's been suspended.
 *   2. setTimeout chain inside the background page — fires while the
 *      page is alive, catches the case where Safari coalesces alarms.
 * The combination gives ~60s effective cadence even under aggressive
 * idle.
 */
function startPollLoop() {
  try {
    ext.alarms.create(EAP_POLL_ALARM, { periodInMinutes: EAP_POLL_INTERVAL_MIN })
  } catch (err) {
    console.warn('[coyl-eap] alarm create failed', err)
  }
  ext.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === EAP_POLL_ALARM) {
      void pollPendingActions()
    }
  })
  // Best-effort in-page timer as alarm backup. 60s.
  const tick = () => {
    void pollPendingActions()
    setTimeout(tick, 60_000)
  }
  setTimeout(tick, 60_000)
}

/**
 * Public message API. Called from options.js when the user toggles
 * EAP on/off, edits the granted-scopes list, or pastes in pairing
 * credentials. Background.js wires this into the runtime.onMessage
 * dispatcher.
 */
async function handleEapMessage(message) {
  switch (message?.type) {
    case 'COYL_EAP_ENABLE':
      await ext.storage.local.set({ [STORAGE.ENABLED]: true })
      return registerDevice()
    case 'COYL_EAP_DISABLE':
      await ext.storage.local.set({ [STORAGE.ENABLED]: false })
      return { ok: true }
    case 'COYL_EAP_SET_PAIRING':
      // { userId, partnerToken }
      if (typeof message.userId === 'string') {
        await ext.storage.local.set({ [STORAGE.USER_ID]: message.userId })
      }
      if (typeof message.partnerToken === 'string') {
        await ext.storage.local.set({ coyl_eap_partner_token: message.partnerToken })
      }
      return registerDevice()
    case 'COYL_EAP_SET_SCOPES':
      // { scopes: ['edge:browser:notification', ...] }
      if (Array.isArray(message.scopes)) {
        await ext.storage.local.set({ [STORAGE.GRANTED_SCOPES]: message.scopes })
      }
      return registerDevice()
    case 'COYL_EAP_STATUS': {
      const { [STORAGE.DEVICE_ID]: deviceId, [STORAGE.LAST_POLL_AT]: lastPollAt,
        [STORAGE.LAST_REGISTER_AT]: lastRegisterAt, [STORAGE.ENABLED]: enabled,
        [STORAGE.GRANTED_SCOPES]: scopes, [STORAGE.USER_ID]: userId } =
        await ext.storage.local.get([
          STORAGE.DEVICE_ID,
          STORAGE.LAST_POLL_AT,
          STORAGE.LAST_REGISTER_AT,
          STORAGE.ENABLED,
          STORAGE.GRANTED_SCOPES,
          STORAGE.USER_ID,
        ])
      return {
        ok: true,
        enabled: enabled === true,
        paired: typeof userId === 'string' && userId.length > 0,
        deviceId: deviceId ?? null,
        scopes: Array.isArray(scopes) ? scopes : [],
        lastPollAt: lastPollAt ?? null,
        lastRegisterAt: lastRegisterAt ?? null,
      }
    }
    default:
      return null
  }
}

/**
 * Bootstrap — called from background.js after the sensors + actuators
 * modules have loaded. Idempotent.
 */
async function bootstrap() {
  const enabled = await isEnabled()
  if (!enabled) {
    // Still register the message handler so the options page can turn
    // us on later.
    return
  }
  // Best-effort registration on every bootstrap — re-affirms manifest
  // + bumps online flag.
  await registerDevice()
  startPollLoop()
}

// Expose to the rest of the extension via globalThis. background.js
// imports this file via manifest.json's background.scripts array and
// invokes bootstrap() once everything is loaded.
globalThis.__coylEapCoordinator = {
  bootstrap,
  registerDevice,
  pollPendingActions,
  handleEapMessage,
  STORAGE,
  SAFARI_MANIFEST,
}
