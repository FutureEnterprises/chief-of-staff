/**
 * COYL Safari Web Extension — EAP sensor layer (v0.1)
 *
 * Three sensors exposed to the EAP coordinator. Each one maps an EAP
 * primitive sensor name (per docs/protocol/edge-ai-protocol.md §6) to
 * a Safari WebExtension API observation.
 *
 *   tab_count        — browser.tabs.query, instantaneous count
 *   active_url_host  — browser.tabs.onActivated → host string only
 *   tab_open_rate    — sliding-window count of browser.tabs.onCreated
 *                      fires, best-effort in background-page memory
 *
 * Safari-specific gaps (vs Chrome):
 *   - screen_state UNAVAILABLE — Safari does not expose browser.idle.
 *     Documented in README.md.
 *   - tab event history is NOT persisted by Safari across background
 *     suspensions. The sliding window for tab_open_rate is rebuilt
 *     from zero whenever the background page wakes from cold. We use
 *     storage.local to persist the most recent samples, but Safari
 *     wakes/sleeps the background page so frequently that gaps are
 *     expected.
 *
 * Sensor reads are exposed two ways:
 *   1. Pull — globalThis.__coylEapSensors.read(sensorName) returns a
 *      one-shot value (used by /api/eap/v1/sensor/:deviceId/:sensor).
 *   2. Push — subscribers registered via subscribe(sensor, filter,
 *      callback) get fired when the sensor's value crosses a filter.
 *      Used internally by the coordinator if/when it adopts WebHook
 *      relays in v0.2; for now the coordinator polls instead.
 */

const ext = typeof browser !== 'undefined' ? browser : chrome

const STORAGE = {
  TAB_OPEN_SAMPLES: 'coyl_eap_tab_open_samples',
}

const TAB_OPEN_WINDOW_MS = 10 * 60 * 1000 // 10 min sliding window

const subscribers = [] // { id, sensor, filter, callback }

// ---------- tab_count ----------

async function readTabCount() {
  try {
    const tabs = await ext.tabs.query({})
    return { ok: true, value: tabs.length, asOf: new Date().toISOString() }
  } catch (err) {
    return { ok: false, reason: 'tabs_query_failed', message: String(err?.message ?? err) }
  }
}

// ---------- active_url_host ----------

let lastActiveHost = null

function extractHost(url) {
  try {
    const u = new URL(url)
    if (!u.protocol.startsWith('http')) return null
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function refreshActiveHost() {
  try {
    const tabs = await ext.tabs.query({ active: true, currentWindow: true })
    const tab = tabs[0]
    if (!tab || typeof tab.url !== 'string') return null
    const host = extractHost(tab.url)
    lastActiveHost = host
    return host
  } catch {
    return null
  }
}

async function readActiveUrlHost() {
  // Prefer the cached value (set by onActivated/onUpdated). On cold
  // wake the cache is null — fall back to a fresh query.
  if (lastActiveHost !== null) {
    return { ok: true, value: lastActiveHost, asOf: new Date().toISOString() }
  }
  const host = await refreshActiveHost()
  return { ok: true, value: host, asOf: new Date().toISOString() }
}

// onActivated fires when the user switches tabs. We only emit the
// host string — never the full URL or path — to honour the
// `edge:browser:read:active_url` scope's host-only contract.
ext.tabs.onActivated.addListener((info) => {
  void (async () => {
    try {
      const tab = await ext.tabs.get(info.tabId)
      const host = extractHost(tab.url ?? '')
      lastActiveHost = host
      notifySubscribers('active_url_host', { value: host })
    } catch {
      // tabs.get can refuse without activeTab on some Safari versions;
      // ignore and let the next pull refresh.
    }
  })()
})

// onUpdated catches the case where the active tab navigates without a
// switch (user types into the URL bar).
ext.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab?.active) return
  if (!changeInfo.url && changeInfo.status !== 'loading') return
  const host = extractHost(tab.url ?? changeInfo.url ?? '')
  if (host !== lastActiveHost) {
    lastActiveHost = host
    notifySubscribers('active_url_host', { value: host })
  }
})

// ---------- tab_open_rate ----------

// Best-effort in-page array of recent open timestamps. Re-hydrated
// from storage on bootstrap; written back after each push so we get
// continuity across short suspensions. Safari kills the background
// page often enough that long-window analytics aren't reliable from
// the extension alone — the LLM should combine this with server-side
// history if it needs deep continuity.
let tabOpenSamples = []

async function loadTabOpenSamples() {
  const { [STORAGE.TAB_OPEN_SAMPLES]: samples } = await ext.storage.local.get(
    STORAGE.TAB_OPEN_SAMPLES,
  )
  tabOpenSamples = Array.isArray(samples) ? samples : []
  pruneTabOpenSamples()
}

function pruneTabOpenSamples() {
  const cutoff = Date.now() - TAB_OPEN_WINDOW_MS
  tabOpenSamples = tabOpenSamples.filter((t) => typeof t === 'number' && t > cutoff)
}

async function persistTabOpenSamples() {
  try {
    await ext.storage.local.set({ [STORAGE.TAB_OPEN_SAMPLES]: tabOpenSamples })
  } catch {
    // storage occasionally throws under quota pressure; skip.
  }
}

ext.tabs.onCreated.addListener(() => {
  tabOpenSamples.push(Date.now())
  pruneTabOpenSamples()
  void persistTabOpenSamples()
  notifySubscribers('tab_open_rate', { value: tabOpenSamples.length })
})

async function readTabOpenRate() {
  pruneTabOpenSamples()
  return {
    ok: true,
    value: {
      count: tabOpenSamples.length,
      windowMs: TAB_OPEN_WINDOW_MS,
      // Always best-effort on Safari — surface that to the consumer.
      bestEffort: true,
    },
    asOf: new Date().toISOString(),
  }
}

// ---------- screen_state ----------
// Not available on Safari. Stub returns a sentinel so callers can
// detect rather than 404.
async function readScreenState() {
  return {
    ok: false,
    reason: 'unavailable_on_platform',
    detail: 'Safari does not expose browser.idle — screen_state cannot be observed from a Web Extension.',
  }
}

// ---------- dispatch + subscribe ----------

const SENSORS = {
  tab_count: readTabCount,
  active_url_host: readActiveUrlHost,
  tab_open_rate: readTabOpenRate,
  screen_state: readScreenState, // returns unavailable
}

async function read(sensor) {
  const fn = SENSORS[sensor]
  if (!fn) return { ok: false, reason: 'unknown_sensor', sensor }
  return fn()
}

function subscribe(sensor, filter, callback) {
  const id = `s_${Math.random().toString(36).slice(2, 10)}`
  subscribers.push({ id, sensor, filter, callback })
  return id
}

function unsubscribe(id) {
  const idx = subscribers.findIndex((s) => s.id === id)
  if (idx >= 0) subscribers.splice(idx, 1)
}

function notifySubscribers(sensor, payload) {
  for (const sub of subscribers) {
    if (sub.sensor !== sensor) continue
    // Simple filter contract: if filter.match is a function, it must
    // return true to fire. No filter ⇒ fire on every event.
    if (sub.filter && typeof sub.filter.match === 'function') {
      try {
        if (!sub.filter.match(payload)) continue
      } catch {
        continue
      }
    }
    try {
      sub.callback({ sensor, ...payload, asOf: new Date().toISOString() })
    } catch (err) {
      console.warn('[coyl-eap] sensor subscriber threw', sensor, err)
    }
  }
}

// Bootstrap: rehydrate sliding window + active host.
void loadTabOpenSamples()
void refreshActiveHost()

globalThis.__coylEapSensors = {
  read,
  subscribe,
  unsubscribe,
  SENSORS: Object.keys(SENSORS),
  TAB_OPEN_WINDOW_MS,
}
