/**
 * COYL Browser Extension — EAP actuators.
 *
 * Each exported function corresponds to one entry in the browser
 * coordinator's manifest.actuators (see eap-coordinator.js). Every
 * actuator is invoked by the coordinator with a `params` object
 * pulled verbatim from the LLM's ActionRequest body (EAP §3); the
 * actuator decides which fields it cares about and ignores the rest.
 *
 * Actuators throw on failure — the coordinator catches and reports
 * via /api/eap/v1/action/outcome. Throwing-with-Error is the only
 * supported failure signal; returning a falsy value counts as success.
 *
 * EAP scope check is performed server-side before an action ever lands
 * in the pending queue, so these handlers do NOT re-check user scopes.
 * Defense-in-depth happens at the backend's coordinator, not here.
 *
 * Coverage limits (documented in EAP §6 table — ~70% browser
 * coverage):
 *   - We CAN fire native notifications, overlay UI on watched pages,
 *     close/open/redirect tabs.
 *   - We CANNOT read tab content beyond the host (no scripting permission
 *     in v0.1) or send messages into chrome:// URLs.
 */

/**
 * 'notification' — chrome.notifications.create
 *
 * Params (LLM-supplied):
 *   {
 *     title: string,
 *     message: string,
 *     iconUrl?: string,       // optional override; defaults to bundled icon
 *     priority?: 0..2,
 *     contextMessage?: string // e.g. the LLM reasoning summary
 *   }
 */
async function fireNotification(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('notification: missing params')
  }
  const title = typeof params.title === 'string' ? params.title : 'COYL'
  const message =
    typeof params.message === 'string'
      ? params.message
      : 'A proactive nudge is ready.'

  // chrome.notifications.create is callback-style on older builds; the
  // Promise form lands on Chrome 116+ / Firefox 110+. Use the callback
  // form wrapped in a Promise to support the widest range.
  await new Promise((resolve, reject) => {
    try {
      chrome.notifications.create(
        {
          type: 'basic',
          iconUrl:
            typeof params.iconUrl === 'string' ? params.iconUrl : 'icons/icon-48.png',
          title,
          message,
          contextMessage:
            typeof params.contextMessage === 'string'
              ? params.contextMessage
              : undefined,
          priority:
            typeof params.priority === 'number'
              ? Math.max(-2, Math.min(2, params.priority))
              : 1,
        },
        (notificationId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(notificationId)
          }
        },
      )
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 'overlay' — reuse the existing content.js full-page overlay surface.
 *
 * We send the same COYL_FIRE_INTERRUPT message the tab-interrupt path
 * sends, so the visual treatment is one consistent COYL overlay
 * across both behavioral interrupts and EAP-initiated nudges. The LLM
 * supplies the host string + a synthesized count so the overlay's
 * existing template renders correctly.
 *
 * Params:
 *   {
 *     tabId?: number,    // if omitted, use the active tab in the focused window
 *     host?: string,     // overlay headline; defaults to the tab's hostname
 *     count?: number     // displayed in the "Nx in 10 minutes" line
 *   }
 *
 * Limitation: chrome.tabs.sendMessage fails silently for chrome:// or
 * about:* URLs because the content script can't inject there. We
 * surface that as a thrown error so the outcome is recorded as failed.
 */
async function fireOverlay(params) {
  const safeParams = params && typeof params === 'object' ? params : {}
  let tabId = typeof safeParams.tabId === 'number' ? safeParams.tabId : null

  if (tabId == null) {
    const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!active || typeof active.id !== 'number') {
      throw new Error('overlay: no active tab')
    }
    tabId = active.id
  }

  const tab = await chrome.tabs.get(tabId)
  const url = tab && tab.url ? tab.url : ''
  const host = typeof safeParams.host === 'string' && safeParams.host
    ? safeParams.host
    : safeHostnameOf(url) ?? 'this site'

  const count =
    typeof safeParams.count === 'number' && safeParams.count > 0
      ? safeParams.count
      : 1

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'COYL_FIRE_INTERRUPT',
      host,
      count,
      threshold: count,
      // Hint to content.js that this came from EAP, not the tab-counter.
      // content.js ignores unknown fields, so this is forward-compatible
      // without touching content.js (which is owned by another agent).
      source: 'eap',
    })
  } catch (err) {
    throw new Error(`overlay: ${err instanceof Error ? err.message : 'sendMessage failed'}`)
  }
}

/**
 * 'tab_close' — chrome.tabs.remove
 *
 * Params:
 *   { tabId: number }
 * If tabId is omitted, closes the active tab in the focused window.
 */
async function fireTabClose(params) {
  const safeParams = params && typeof params === 'object' ? params : {}
  let tabId = typeof safeParams.tabId === 'number' ? safeParams.tabId : null

  if (tabId == null) {
    const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!active || typeof active.id !== 'number') {
      throw new Error('tab_close: no active tab')
    }
    tabId = active.id
  }

  await chrome.tabs.remove(tabId)
}

/**
 * 'tab_open' — chrome.tabs.create
 *
 * Params:
 *   {
 *     url: string,         // required
 *     active?: boolean,    // default false — open in background by default
 *     windowId?: number
 *   }
 */
async function fireTabOpen(params) {
  if (!params || typeof params !== 'object' || typeof params.url !== 'string') {
    throw new Error('tab_open: missing url')
  }
  if (!isSafeUrl(params.url)) {
    throw new Error('tab_open: unsafe scheme')
  }
  await chrome.tabs.create({
    url: params.url,
    active: typeof params.active === 'boolean' ? params.active : false,
    ...(typeof params.windowId === 'number' ? { windowId: params.windowId } : {}),
  })
}

/**
 * 'open_url' — chrome.tabs.update (replace current tab) OR
 *               chrome.tabs.create (new tab, opt-in)
 *
 * Distinct from tab_open: this is the "redirect the user away from
 * X" pattern (e.g. send them from reddit.com to coyl.ai/rescue). By
 * default we update the active tab; pass openInNewTab to create a
 * new one instead.
 *
 * Params:
 *   {
 *     url: string,             // required
 *     tabId?: number,
 *     openInNewTab?: boolean   // default false
 *   }
 */
async function fireOpenUrl(params) {
  if (!params || typeof params !== 'object' || typeof params.url !== 'string') {
    throw new Error('open_url: missing url')
  }
  if (!isSafeUrl(params.url)) {
    throw new Error('open_url: unsafe scheme')
  }

  if (params.openInNewTab === true) {
    await chrome.tabs.create({ url: params.url, active: true })
    return
  }

  let tabId = typeof params.tabId === 'number' ? params.tabId : null
  if (tabId == null) {
    const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!active || typeof active.id !== 'number') {
      // Fallback to creating a tab if no active one exists.
      await chrome.tabs.create({ url: params.url, active: true })
      return
    }
    tabId = active.id
  }

  await chrome.tabs.update(tabId, { url: params.url })
}

/**
 * Only allow LLM-supplied URLs through http(s). Refuse javascript:,
 * data:, file:, chrome:, about:. The actuator coverage table in EAP
 * §6 explicitly excludes chrome:// surfaces — this enforces it.
 */
function isSafeUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

function safeHostnameOf(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (!u.protocol.startsWith('http')) return null
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export {
  fireNotification,
  fireOverlay,
  fireTabClose,
  fireTabOpen,
  fireOpenUrl,
}
