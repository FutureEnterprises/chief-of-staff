/**
 * COYL Browser Extension — background service worker (Manifest V3)
 *
 * Responsibilities:
 *  1. Track tab switches into watchlisted domains (the doom-scroll sites)
 *  2. Count consecutive opens of the same domain within a window
 *  3. Trigger an interrupt overlay when the count crosses the threshold
 *  4. Sync interrupt feedback (helpful / not-the-moment) back to coyl.ai
 *  5. Host the EAP coordinator — register the browser as an EAP edge
 *     device, poll for pending LLM actions, dispatch to actuators,
 *     publish sensor batches. See eap-coordinator.js for the spec
 *     surface (docs/protocol/edge-ai-protocol.md).
 *
 * Design notes:
 *  - Service worker is event-driven; we can't keep persistent state in
 *    memory across wake/sleep. All state lives in chrome.storage.local.
 *  - The interrupt overlay is injected by the content script; this
 *    service worker just signals "fire" via chrome.tabs.sendMessage.
 *  - User can mute a domain for 1h / 1d / forever via the overlay; the
 *    mute list lives in storage.local.
 *  - The EAP layer runs in parallel — same service worker, same
 *    storage, but disjoint state keys (coyl_eap_*). Neither calls
 *    into the other; they share only the COYL_FIRE_INTERRUPT message
 *    channel into content.js (the 'overlay' EAP actuator reuses the
 *    existing overlay surface).
 *
 * Auth + sync to coyl.ai: deferred to v0.2 for the tab-counter half.
 * EAP uses the user's existing Clerk cookie session (credentials:
 * 'include') against https://coyl.ai/* — no popup flow needed because
 * the user is already signed in via the web app.
 */

import * as eapCoordinator from './eap-coordinator.js'
import * as eapSensors from './eap-sensors.js'

const STORAGE_KEYS = {
  WATCHLIST: 'coyl_watchlist',
  MUTES: 'coyl_mutes',
  COUNTS: 'coyl_recent_opens',
  THRESHOLDS: 'coyl_thresholds',
}

const DEFAULT_THRESHOLDS = {
  // How many times in the last `windowMs` the user has to open a
  // watched domain before we fire an interrupt overlay.
  count: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
}

const DEFAULT_WATCHLIST = [
  'reddit.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'tiktok.com',
  'instagram.com',
  'facebook.com',
  'news.ycombinator.com',
]

// First-install bootstrap — populate the default watchlist + thresholds,
// and bring the EAP coordinator online. Coordinator bootstrap runs on
// BOTH install and update so re-published versions re-register their
// manifest (sensors/actuators may have changed across versions).
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      [STORAGE_KEYS.WATCHLIST]: DEFAULT_WATCHLIST,
      [STORAGE_KEYS.MUTES]: {},
      [STORAGE_KEYS.COUNTS]: {},
      [STORAGE_KEYS.THRESHOLDS]: DEFAULT_THRESHOLDS,
    })
  }

  // EAP: bootstrap on install AND update. registerDevice is idempotent
  // on deviceFingerprint server-side; scheduleAlarms is idempotent on
  // alarm name. Both safe to re-run.
  try {
    await eapCoordinator.bootstrap()
  } catch (err) {
    console.warn('[coyl-ext] EAP bootstrap failed', err)
  }
})

// Service worker may start fresh on browser-launch even when nothing
// was just installed; re-arm the EAP alarms so polling resumes.
// scheduleAlarms is internal — we re-invoke bootstrap which calls it
// and re-registers if needed.
chrome.runtime.onStartup?.addListener(() => {
  eapCoordinator.bootstrap().catch((err) => {
    console.warn('[coyl-ext] EAP startup failed', err)
  })
})

// Single alarm dispatcher for the EAP layer. Alarms registered with
// names outside the EAP namespace are ignored here — the rest of the
// extension can add its own alarms later without colliding.
const EAP_ALARM_SET = new Set(Object.values(eapCoordinator.ALARM_NAMES))
chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm || !alarm.name) return
  if (EAP_ALARM_SET.has(alarm.name)) {
    eapCoordinator.handleAlarm(alarm.name).catch((err) => {
      console.warn('[coyl-ext] EAP alarm dispatch failed', alarm.name, err)
    })
  }
})

// Tab-open sensor: every tab.create event feeds the sliding-window
// counter the sensor batch publishes. Cheap, fire-and-forget.
chrome.tabs.onCreated.addListener(() => {
  eapSensors.recordTabOpen().catch(() => {})
})

/**
 * Pull a clean hostname (no www., no path) from a tab URL. Returns
 * null if the URL is internal (chrome://, about:, file:).
 */
function hostnameOf(url) {
  try {
    const u = new URL(url)
    if (!u.protocol.startsWith('http')) return null
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Is this hostname on the watchlist?
 * Matches both exact and subdomain (e.g. m.reddit.com matches reddit.com).
 */
function matchesWatchlist(host, watchlist) {
  if (!host) return false
  return watchlist.some((w) => host === w || host.endsWith('.' + w))
}

/**
 * Is this domain currently muted?
 */
function isMuted(host, mutes) {
  const now = Date.now()
  // exact + parent-domain match
  for (const muted of Object.keys(mutes ?? {})) {
    if (host === muted || host.endsWith('.' + muted)) {
      const expiresAt = mutes[muted]
      if (expiresAt === 'forever' || expiresAt > now) return true
    }
  }
  return false
}

/**
 * Recent-opens counter. Sliding window per domain.
 */
async function recordOpen(host) {
  const { [STORAGE_KEYS.COUNTS]: counts = {}, [STORAGE_KEYS.THRESHOLDS]: thresholds = DEFAULT_THRESHOLDS } =
    await chrome.storage.local.get([STORAGE_KEYS.COUNTS, STORAGE_KEYS.THRESHOLDS])

  const now = Date.now()
  const cutoff = now - thresholds.windowMs
  const opens = (counts[host] ?? []).filter((t) => t > cutoff)
  opens.push(now)
  counts[host] = opens

  await chrome.storage.local.set({ [STORAGE_KEYS.COUNTS]: counts })

  return { count: opens.length, threshold: thresholds.count }
}

/**
 * The main tab-switch handler. When a tab loads a watchlisted domain
 * AND the user has crossed the open-count threshold AND it's not
 * muted, signal the content script to render the interrupt overlay.
 */
async function handleTabUpdate(tabId, changeInfo, tab) {
  // Only process URL changes (not status, audible, etc.)
  if (!changeInfo.url && changeInfo.status !== 'loading') return

  const url = tab.url ?? changeInfo.url
  const host = hostnameOf(url)
  if (!host) return

  const {
    [STORAGE_KEYS.WATCHLIST]: watchlist = DEFAULT_WATCHLIST,
    [STORAGE_KEYS.MUTES]: mutes = {},
  } = await chrome.storage.local.get([STORAGE_KEYS.WATCHLIST, STORAGE_KEYS.MUTES])

  if (!matchesWatchlist(host, watchlist)) return
  if (isMuted(host, mutes)) return

  const { count, threshold } = await recordOpen(host)
  if (count < threshold) return

  // Fire the interrupt. Content script handles the actual overlay
  // injection so we can render rich HTML without CSP issues from the
  // service worker.
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'COYL_FIRE_INTERRUPT',
      host,
      count,
      threshold,
    })
  } catch (err) {
    // Content script may not have loaded yet on document_start; the
    // next page event will retry. Don't log noisily.
  }
}

chrome.tabs.onUpdated.addListener(handleTabUpdate)

/**
 * Keyboard shortcut — Cmd+Shift+L (Mac) / Ctrl+Shift+L (Win) fires a
 * one-tap slip log against coyl.ai. credentials: 'include' picks up the
 * Clerk session cookie if the user is signed in; on 401 we open the
 * sign-in popup. Removes the last bit of friction for the user who's
 * already inside a doom-scroll tab — no app switch, no modal, just confess.
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'quick-slip') return
  try {
    const res = await fetch('https://coyl.ai/api/v1/slip/quick', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (res.status === 401) {
      await chrome.tabs.create({ url: 'https://coyl.ai/sign-in?from=extension' })
      return
    }
    if (res.ok) {
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Slip logged.',
        message: 'Streak preserved. Tap the COYL tab if you need rescue.',
      })
    }
  } catch {
    // network or extension-context error — silent, user can retry
  }
})

/**
 * Inbound messages from content script — user reactions to the
 * interrupt overlay. Mute decisions, feedback, "open rescue" routing.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async () => {
    if (message.type === 'COYL_MUTE') {
      const { host, duration } = message
      const { [STORAGE_KEYS.MUTES]: mutes = {} } = await chrome.storage.local.get(STORAGE_KEYS.MUTES)
      const expiresAt =
        duration === 'forever' ? 'forever' :
        duration === '1d' ? Date.now() + 24 * 60 * 60 * 1000 :
        Date.now() + 60 * 60 * 1000 // default 1h
      mutes[host] = expiresAt
      await chrome.storage.local.set({ [STORAGE_KEYS.MUTES]: mutes })
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'COYL_FEEDBACK') {
      // v0.1: log locally. v0.2: POST to coyl.ai/api/v1/events with
      // INTERRUPT_FEEDBACK eventType (auth via OAuth flow first).
      console.log('[coyl-ext] feedback', message)
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'COYL_OPEN_RESCUE') {
      await chrome.tabs.create({ url: 'https://coyl.ai/rescue?from=extension' })
      sendResponse({ ok: true })
      return
    }

    // Options page tells us the user changed their EAP scope grants.
    // Re-POST the manifest so the backend's userGrantedScopes view
    // catches up without waiting for the hourly re-register tick.
    if (message.type === 'COYL_EAP_SCOPES_UPDATED') {
      try {
        await eapCoordinator.refreshAfterScopeChange()
        sendResponse({ ok: true })
      } catch (err) {
        sendResponse({ ok: false, error: err instanceof Error ? err.message : 'refresh_failed' })
      }
      return
    }
  })()
  return true // async sendResponse
})
