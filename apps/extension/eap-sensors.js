/**
 * COYL Browser Extension — EAP sensors.
 *
 * Publishes browser-specific sensor readings to
 * /api/v1/health/ingest every ~5 minutes (the cadence is set by the
 * chrome.alarms schedule in eap-coordinator.js).
 *
 * Sensors published in each batch:
 *   - tab_state         : "active" if any window is focused, else "background"
 *   - tab_open_rate     : tab.create events per 10-minute sliding window
 *   - active_url        : focused tab's HOST only — never the full URL.
 *                         The active_url scope in EAP §8 is intentionally
 *                         host-granular; full URLs would leak query params,
 *                         per-page identifiers, and (worst case) auth tokens.
 *   - tab_count         : total tabs across all open windows
 *   - screen_state      : 'active' | 'idle' | 'locked'  from chrome.idle.queryState
 *
 * Storage layout:
 *   coyl_eap_tab_opens : number[]   // unix-ms timestamps, trimmed to last 1h
 *
 * The tab-open counter is wired via chrome.tabs.onCreated in
 * background.js (where the listener has to be registered at the
 * top level for MV3 service workers). On each event it calls
 * recordTabOpen() here, which appends + trims.
 */

const SENSOR_STORAGE_KEYS = {
  TAB_OPENS: 'coyl_eap_tab_opens',
}

const OPEN_RATE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const OPEN_RATE_TRIM_HORIZON_MS = 60 * 60 * 1000 // never keep > 1h of events

/**
 * Called from background.js's chrome.tabs.onCreated listener. Appends
 * a timestamp + trims older-than-1h to keep storage bounded.
 */
async function recordTabOpen() {
  const now = Date.now()
  const got = await chrome.storage.local.get(SENSOR_STORAGE_KEYS.TAB_OPENS)
  const prior = Array.isArray(got[SENSOR_STORAGE_KEYS.TAB_OPENS])
    ? got[SENSOR_STORAGE_KEYS.TAB_OPENS]
    : []
  const next = prior.filter((t) => now - t < OPEN_RATE_TRIM_HORIZON_MS)
  next.push(now)
  await chrome.storage.local.set({ [SENSOR_STORAGE_KEYS.TAB_OPENS]: next })
}

/**
 * Count tab.create events that landed inside the last 10 minutes.
 */
async function readTabOpenRate() {
  const now = Date.now()
  const got = await chrome.storage.local.get(SENSOR_STORAGE_KEYS.TAB_OPENS)
  const events = Array.isArray(got[SENSOR_STORAGE_KEYS.TAB_OPENS])
    ? got[SENSOR_STORAGE_KEYS.TAB_OPENS]
    : []
  return events.filter((t) => now - t < OPEN_RATE_WINDOW_MS).length
}

/**
 * Pull the active tab's HOST only — never the path or query string.
 * Returns null if no active tab, or if the URL is internal (chrome://,
 * about:, file:) — those leak no usable signal.
 */
async function readActiveUrlHost() {
  try {
    const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!active || typeof active.url !== 'string') return null
    const u = new URL(active.url)
    if (!u.protocol.startsWith('http')) return null
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Total open tabs across all windows. chrome.tabs.query with no
 * filter returns every tab the extension has visibility into.
 */
async function readTabCount() {
  try {
    const all = await chrome.tabs.query({})
    return Array.isArray(all) ? all.length : 0
  } catch {
    return 0
  }
}

/**
 * 'active' | 'idle' | 'locked'  — the 'idle' permission is required
 * in manifest.json. Threshold of 60s for the active/idle boundary.
 */
async function readScreenState() {
  return new Promise((resolve) => {
    try {
      chrome.idle.queryState(60, (state) => {
        if (chrome.runtime.lastError || typeof state !== 'string') {
          resolve('unknown')
        } else {
          resolve(state)
        }
      })
    } catch {
      resolve('unknown')
    }
  })
}

/**
 * Heuristic: if there's any active+focused tab we mark tab_state
 * 'active', else 'background'. Cheaper than wiring a full
 * chrome.windows.onFocusChanged listener and good enough for the
 * sensor batch.
 */
async function readTabState() {
  try {
    const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    return active && active.active ? 'active' : 'background'
  } catch {
    return 'unknown'
  }
}

/**
 * Build the sensor batch and POST to /api/v1/health/ingest.
 * Coordinator passes the base URL in case we ever stage against a
 * preview deployment.
 */
async function publishSensorBatch(baseUrl) {
  const at = new Date().toISOString()

  const [tabState, tabOpenRate, activeUrlHost, tabCount, screenState] =
    await Promise.all([
      readTabState(),
      readTabOpenRate(),
      readActiveUrlHost(),
      readTabCount(),
      readScreenState(),
    ])

  // Each reading is a discrete sensor record. The /health/ingest
  // route accepts a batch shape so we send all five at once.
  const readings = [
    { sensor: 'tab_state', value: tabState, at },
    { sensor: 'tab_open_rate', value: tabOpenRate, at },
    // Host string ONLY. The active_url scope vocabulary is
    // host-granular and full URLs would leak. If the active tab is
    // internal (host = null), we omit the reading rather than send
    // a misleading empty string.
    ...(activeUrlHost ? [{ sensor: 'active_url', value: activeUrlHost, at }] : []),
    { sensor: 'tab_count', value: tabCount, at },
    { sensor: 'screen_state', value: screenState, at },
  ]

  try {
    await fetch(`${baseUrl}/api/v1/health/ingest`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'browser_extension',
        readings,
      }),
    })
  } catch {
    // Best-effort. The next alarm tick will retry; we don't queue
    // missed batches because stale sensor readings are worse than
    // missing readings for proactive AI.
  }
}

export {
  publishSensorBatch,
  recordTabOpen,
  readTabOpenRate,
  readActiveUrlHost,
  readTabCount,
  readScreenState,
  readTabState,
}
