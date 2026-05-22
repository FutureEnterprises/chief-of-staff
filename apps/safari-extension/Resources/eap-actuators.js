/**
 * COYL Safari Web Extension — EAP actuator layer (v0.1)
 *
 * Five actuators exposed to the EAP coordinator. Each one maps an EAP
 * primitive ActionRequest (per docs/protocol/edge-ai-protocol.md §3) to
 * a Safari WebExtension API call.
 *
 *   notification — browser.notifications.create
 *   overlay      — sendMessage to content.js (existing interrupt overlay)
 *   tab_close    — browser.tabs.remove
 *   tab_open     — browser.tabs.create
 *   open_url     — browser.tabs.update on the active tab
 *
 * Safari-specific gaps (vs Chrome ~70% coverage):
 *   - Notifications need a per-site grant in macOS System Settings →
 *     Notifications → Safari. Chrome has a single browser-wide grant.
 *     The coordinator reports `outcome: 'denied_by_platform'` if the
 *     create() call rejects with NotAllowedError.
 *   - Tab focus/move/group APIs that exist in Chrome's tabs.* are not
 *     fully implemented in Safari. We expose the subset that works.
 *   - browser.tabs.update is best-effort on the *active* tab only —
 *     Safari doesn't reliably let an extension navigate background
 *     tabs without user gesture.
 *
 * Every dispatch reports its outcome back via POST /api/eap/v1/action/
 * outcome (primitive #7) so the LLM can observe completion + user
 * interaction.
 */

const ext = typeof browser !== 'undefined' ? browser : chrome

const EAP_BASE = 'https://coyl.ai/api/eap/v1'

const STORAGE = {
  DEVICE_ID: 'coyl_eap_device_id',
  GRANTED_SCOPES: 'coyl_eap_granted_scopes',
}

/**
 * Map an actuator name to the scope key the user must have granted.
 * If the scope isn't in storage, the action is short-circuited with
 * outcome=scope_not_granted before any API call fires.
 */
const ACTUATOR_TO_SCOPE = {
  notification: 'edge:browser:notification',
  overlay: 'edge:browser:overlay',
  tab_close: 'edge:browser:tab_close',
  tab_open: 'edge:browser:tab_open',
  open_url: 'edge:browser:tab_open', // same scope; sub-actuator
}

async function getGrantedScopes() {
  const { [STORAGE.GRANTED_SCOPES]: scopes } = await ext.storage.local.get(
    STORAGE.GRANTED_SCOPES,
  )
  return new Set(Array.isArray(scopes) ? scopes : [])
}

async function reportOutcome(executionToken, outcome, extra) {
  // Server-side endpoint is POST /api/eap/v1/action/outcome. The
  // partner token is read from storage by background.js / coordinator
  // when actuators don't have direct access.
  try {
    const { coyl_eap_partner_token: token } = await ext.storage.local.get(
      'coyl_eap_partner_token',
    )
    if (!token) return
    await fetch(`${EAP_BASE}/action/outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        executionToken,
        outcome,
        outcomeAt: new Date().toISOString(),
        ...extra,
      }),
    })
  } catch {
    // Outcome reporting is best-effort; the LLM will time out the
    // request on its end if it never sees the outcome.
  }
}

/**
 * notification — browser.notifications.create
 *
 * On Safari this surfaces through the macOS Notification Center, but
 * only if the host app (the Safari Web Extension App container that
 * Xcode generates) has been granted notification permission in System
 * Settings.
 */
async function actuateNotification(action) {
  const params = action.params ?? {}
  const title = typeof params.title === 'string' ? params.title : 'COYL'
  const message = typeof params.message === 'string' ? params.message : ''
  const iconUrl = typeof params.iconUrl === 'string' ? params.iconUrl : 'icons/icon-48.png'
  try {
    await new Promise((resolve, reject) => {
      try {
        const result = ext.notifications.create({
          type: 'basic',
          iconUrl,
          title,
          message,
        }, (id) => {
          if (ext.runtime.lastError) reject(new Error(ext.runtime.lastError.message))
          else resolve(id)
        })
        // Safari's promise-style create can short-circuit without a callback;
        // hedge with then() if a Promise was returned.
        if (result && typeof result.then === 'function') {
          result.then(resolve, reject)
        }
      } catch (err) {
        reject(err)
      }
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'platform_denied', message: String(err?.message ?? err) }
  }
}

/**
 * overlay — reuse the existing interrupt overlay in content.js. The
 * EAP coordinator can fire an LLM-composed overlay anywhere the user
 * has granted the scope. Routes through ext.tabs.sendMessage which the
 * existing content.js handler will accept under a new message type.
 */
async function actuateOverlay(action) {
  const params = action.params ?? {}
  try {
    const tabs = await ext.tabs.query({ active: true, currentWindow: true })
    const tab = tabs[0]
    if (!tab || typeof tab.id !== 'number') {
      return { ok: false, reason: 'no_active_tab' }
    }
    await ext.tabs.sendMessage(tab.id, {
      // Same envelope as COYL_FIRE_INTERRUPT (handled in content.js).
      // EAP-sourced overlays carry the executionToken so the content
      // script can attribute user interaction back to the action.
      type: 'COYL_FIRE_INTERRUPT',
      host: params.host ?? new URL(tab.url ?? 'https://unknown/').hostname,
      count: 0,
      threshold: 0,
      eap: {
        executionToken: action.executionToken,
        title: params.title,
        message: params.message,
      },
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'send_message_failed', message: String(err?.message ?? err) }
  }
}

/**
 * tab_close — browser.tabs.remove. Works without activeTab grant on
 * Safari. The LLM provides either an explicit tabId (from a prior
 * sensor read) or a host filter to scope the close.
 */
async function actuateTabClose(action) {
  const params = action.params ?? {}
  try {
    if (typeof params.tabId === 'number') {
      await ext.tabs.remove(params.tabId)
      return { ok: true, closed: 1 }
    }
    if (typeof params.host === 'string') {
      const tabs = await ext.tabs.query({})
      const targets = tabs
        .filter((t) => {
          try {
            return new URL(t.url ?? '').hostname.replace(/^www\./, '') === params.host
          } catch {
            return false
          }
        })
        .map((t) => t.id)
        .filter((id) => typeof id === 'number')
      if (targets.length === 0) return { ok: true, closed: 0 }
      await ext.tabs.remove(targets)
      return { ok: true, closed: targets.length }
    }
    return { ok: false, reason: 'missing_target' }
  } catch (err) {
    return { ok: false, reason: 'tabs_remove_failed', message: String(err?.message ?? err) }
  }
}

/**
 * tab_open — browser.tabs.create. Opens a new tab pointed at params.url.
 * Honours params.active (default false) and params.openerTabId if the
 * LLM wants the new tab to thread from a specific source tab.
 */
async function actuateTabOpen(action) {
  const params = action.params ?? {}
  if (typeof params.url !== 'string' || !/^https:\/\//.test(params.url)) {
    return { ok: false, reason: 'invalid_url' }
  }
  try {
    const tab = await ext.tabs.create({
      url: params.url,
      active: params.active === true,
      ...(typeof params.openerTabId === 'number' ? { openerTabId: params.openerTabId } : {}),
    })
    return { ok: true, tabId: tab?.id }
  } catch (err) {
    return { ok: false, reason: 'tabs_create_failed', message: String(err?.message ?? err) }
  }
}

/**
 * open_url — browser.tabs.update on the active tab. Best-effort on
 * Safari: if the active tab is itself an extension page (popup,
 * options) or a Safari-internal page, the call no-ops without error.
 */
async function actuateOpenUrl(action) {
  const params = action.params ?? {}
  if (typeof params.url !== 'string' || !/^https:\/\//.test(params.url)) {
    return { ok: false, reason: 'invalid_url' }
  }
  try {
    const tabs = await ext.tabs.query({ active: true, currentWindow: true })
    const tab = tabs[0]
    if (!tab || typeof tab.id !== 'number') {
      // Fall back to opening a new tab.
      const created = await ext.tabs.create({ url: params.url, active: true })
      return { ok: true, tabId: created?.id, viaFallback: 'tab_create' }
    }
    await ext.tabs.update(tab.id, { url: params.url })
    return { ok: true, tabId: tab.id }
  } catch (err) {
    return { ok: false, reason: 'tabs_update_failed', message: String(err?.message ?? err) }
  }
}

const ACTUATORS = {
  notification: actuateNotification,
  overlay: actuateOverlay,
  tab_close: actuateTabClose,
  tab_open: actuateTabOpen,
  open_url: actuateOpenUrl,
}

/**
 * Central dispatch. Called by eap-coordinator.js poll loop for every
 * action drained from /pending-actions.
 *
 * Action shape (per spec §3):
 *   {
 *     executionToken: 'et_xxx',
 *     actuator: 'notification' | 'overlay' | 'tab_close' | 'tab_open' | 'open_url',
 *     params: { ... },
 *     scopeRequested: 'edge:browser:notification',
 *   }
 */
async function dispatch(action) {
  const executionToken = typeof action?.executionToken === 'string' ? action.executionToken : null
  const actuator = typeof action?.actuator === 'string' ? action.actuator : null
  if (!executionToken || !actuator) {
    return { ok: false, reason: 'malformed_action' }
  }
  const fn = ACTUATORS[actuator]
  if (!fn) {
    await reportOutcome(executionToken, 'failed', { reason: 'unsupported_actuator', actuator })
    return { ok: false, reason: 'unsupported_actuator' }
  }
  // Pre-execution scope check. The server already enforces this — but
  // a local check keeps the round-trip honest and lets us emit a
  // clearer outcome.
  const granted = await getGrantedScopes()
  const required = ACTUATOR_TO_SCOPE[actuator]
  if (required && !granted.has(required)) {
    await reportOutcome(executionToken, 'denied', { reason: 'scope_not_granted', scope: required })
    return { ok: false, reason: 'scope_not_granted' }
  }
  const result = await fn(action)
  if (result.ok) {
    await reportOutcome(executionToken, 'executed', { detail: result })
  } else {
    await reportOutcome(executionToken, 'failed', { reason: result.reason, detail: result })
  }
  return result
}

globalThis.__coylEapActuators = {
  dispatch,
  ACTUATORS,
  ACTUATOR_TO_SCOPE,
  reportOutcome,
}
